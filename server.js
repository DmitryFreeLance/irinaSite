const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const { spawnSync } = require("child_process");
const { v4: uuidv4 } = require("uuid");

dotenv.config();

const app = express();
const ROOT = __dirname;
const DB_PATH = path.join(ROOT, "data", "app-db.json");
const FREE_MAP_LIMIT = 3;
const KIE_API_BASE = (process.env.KIE_API_BASE || "https://api.kie.ai").replace(/\/+$/, "");
const KIE_GEMINI_MODEL = process.env.KIE_GEMINI_MODEL || "gemini-2.5-pro";
const KIE_NORMALIZE_MAPS = String(process.env.KIE_NORMALIZE_MAPS || "true").toLowerCase() !== "false";
const KIE_API_KEY = process.env.KIE_API_KEY || "48e07ca7a9144b5507abb8cb0af45bdc";

const PLANS = [
  { id: "start", title: "1 месяц «Старт»", months: 1, days: 31, price: 400 },
  { id: "quarter", title: "3 месяца «Квартал»", months: 3, days: 93, price: 1080 },
  { id: "year", title: "12 месяцев «Год знаний»", months: 12, days: 366, price: 3840 },
];

const DISCOUNT_PROMO_CODES = new Set(["УЧУСЬ1.0", "МНЕМО1.0", "АРТ1.0"]);
const DISCOUNT_PROMO_PERCENT = 10;
const YEAR_SPECIAL_PROMO_CODE = "BSTSUB100FOR1Y";
const YEAR_SPECIAL_PROMO_PRICE = 100;
const ENTER_SOURCES = new Set(["tg", "vk", "another"]);
const DEFAULT_SUBJECT_ACCESS = {
  history: true,
  biology: false,
  geography: false,
  physics: false,
  chemistry: false,
};

function baseCatalog() {
  return [
    {
      id: "history",
      title: "История",
      planned: false,
      grades: {
        "5": { title: "История Древнего мира", paragraphs: createParagraphs("История", 5, 18) },
        "6": { title: "История Средних веков", paragraphs: createParagraphs("История", 6, 20) },
        "7": { title: "История Нового времени", paragraphs: createParagraphs("История", 7, 16) },
      },
    },
    {
      id: "biology",
      title: "Биология",
      planned: false,
      grades: {
        "6": { title: "Живые организмы", paragraphs: createParagraphs("Биология", 6, 24) },
        "7": { title: "Биология человека", paragraphs: createParagraphs("Биология", 7, 28) },
        "8": { title: "Общая биология", paragraphs: createParagraphs("Биология", 8, 22) },
      },
    },
    { id: "geography", title: "География", planned: true },
    { id: "physics", title: "Физика", planned: true },
    { id: "chemistry", title: "Химия", planned: true },
  ];
}

function ensureCatalogAccess(db) {
  ensureSubjectStructures(db);
  if (!db.catalogAccess || typeof db.catalogAccess !== "object") {
    db.catalogAccess = {};
  }
  const subjects = ensureSubjectStructures(db);
  subjects.forEach((subject, index) => {
    if (typeof db.catalogAccess[subject.id] === "boolean") return;
    if (Object.prototype.hasOwnProperty.call(DEFAULT_SUBJECT_ACCESS, subject.id)) {
      db.catalogAccess[subject.id] = Boolean(DEFAULT_SUBJECT_ACCESS[subject.id]);
      return;
    }
    db.catalogAccess[subject.id] = index === 0;
  });
}

function ensureParagraphOverrides(db) {
  if (!db.paragraphOverrides || typeof db.paragraphOverrides !== "object") {
    db.paragraphOverrides = {};
  }
}

function ensureParagraphStructures(db) {
  if (!db.paragraphStructures || typeof db.paragraphStructures !== "object") {
    db.paragraphStructures = {};
  }
}

function ensureGradeStructures(db) {
  if (!db.gradeStructures || typeof db.gradeStructures !== "object") {
    db.gradeStructures = {};
  }
}

function ensureSubjectStructures(db) {
  if (!Array.isArray(db.subjectStructures)) {
    db.subjectStructures = [];
  }

  const baseList = baseCatalog();
  const existing = db.subjectStructures
    .map((item, index) => sanitizeSubjectEntity(item, index + 1))
    .filter(Boolean);

  const existingIds = new Set(existing.map((item) => item.id));
  baseList.forEach((subject, index) => {
    if (existingIds.has(subject.id)) return;
    existing.push(
      sanitizeSubjectEntity(
        {
          id: subject.id,
          title: subject.title,
          order: index + 1,
        },
        index + 1,
      ),
    );
  });

  const sanitized = existing
    .filter(Boolean)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((item, index) => ({ ...item, order: index + 1 }));

  db.subjectStructures = sanitized;
  return sanitized;
}

function ensureTrafficStats(db) {
  if (!db.trafficStats || typeof db.trafficStats !== "object") {
    db.trafficStats = {};
  }
  if (!db.trafficStats.counts || typeof db.trafficStats.counts !== "object") {
    db.trafficStats.counts = {};
  }
  if (!Array.isArray(db.trafficStats.recent)) {
    db.trafficStats.recent = [];
  }
  const keys = ["total", "direct", "tg", "vk", "another"];
  keys.forEach((key) => {
    if (typeof db.trafficStats.counts[key] !== "number") {
      db.trafficStats.counts[key] = 0;
    }
  });
}

function applyParagraphOverridesToCatalog(catalog, db) {
  ensureParagraphOverrides(db);
  ensureParagraphStructures(db);
  ensureGradeStructures(db);
  return catalog.map((subject) => {
    const subjectOverrides = db.paragraphOverrides[subject.id] || {};
    const subjectStructures = db.paragraphStructures[subject.id] || {};
    const baseGrades = subject.grades && typeof subject.grades === "object" ? subject.grades : {};
    const baseGradeEntries = Object.entries(baseGrades);
    const structuredGrades = ensureSubjectGradeStructure(db, subject.id, baseGradeEntries);
    if (!structuredGrades.length && !baseGradeEntries.length) {
      return subject;
    }

    const grades = Object.fromEntries(
      structuredGrades.map((gradeMeta, gradeIndex) => {
        const gradeId = gradeMeta.id;
        const baseGrade = baseGrades[gradeId] || null;
        const gradeTitle = gradeMeta.title || baseGrade?.title || `Класс ${gradeId}`;
        const fallbackParagraphs = Array.isArray(baseGrade?.paragraphs)
          ? baseGrade.paragraphs
          : createParagraphs(subject.title || "Предмет", gradeId, 0);
        const rawStructure = subjectStructures[gradeId];
        const structuredParagraphs = Array.isArray(rawStructure)
          ? rawStructure.map((item, index) => sanitizeParagraphEntity(item, index + 1)).filter(Boolean)
          : [];
        const gradeOverrides = subjectOverrides[gradeId] || {};
        const sourceParagraphs = structuredParagraphs.length ? structuredParagraphs : fallbackParagraphs;
        const paragraphs = sourceParagraphs.map((paragraph) => {
          const override = gradeOverrides[paragraph.id];
          if (typeof override !== "string" || !override.trim()) {
            return paragraph;
          }
          return { ...paragraph, title: override.trim().slice(0, 220) };
        });
        return [gradeId, { title: gradeTitle, paragraphs, order: gradeIndex + 1 }];
      }),
    );

    return { ...subject, grades };
  });
}

function buildCatalogBlueprint(db) {
  const baseById = new Map(baseCatalog().map((item) => [item.id, item]));
  const structured = ensureSubjectStructures(db);
  return structured.map((item) => {
    const base = baseById.get(item.id);
    const subject = base ? { ...base } : { id: item.id, title: item.title, planned: true };
    subject.title = item.title || subject.title;
    return subject;
  });
}

function catalogFromDb(db) {
  ensureCatalogAccess(db);
  const catalog = buildCatalogBlueprint(db).map((subject) => ({
    ...subject,
    planned: !Boolean(db.catalogAccess[subject.id]),
  }));
  return applyParagraphOverridesToCatalog(catalog, db);
}

function getPlanById(planId) {
  return PLANS.find((item) => item.id === String(planId || ""));
}

function loadDb() {
  const raw = fs.readFileSync(DB_PATH, "utf8");
  const db = JSON.parse(raw);
  if (!db.users) db.users = [];
  if (!db.maps) db.maps = [];
  if (!db.payments) db.payments = [];
  if (!db.promoCodes) db.promoCodes = [];
  ensureCatalogAccess(db);
  ensureParagraphOverrides(db);
  ensureParagraphStructures(db);
  ensureGradeStructures(db);
  ensureTrafficStats(db);
  return db;
}

function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function mutateDb(mutator) {
  const db = loadDb();
  const result = mutator(db);
  saveDb(db);
  return result;
}

function activeSubscription(user) {
  if (!user.subscriptionUntil) return false;
  return new Date(user.subscriptionUntil).getTime() > Date.now();
}

function extendUserSubscription(user, plan) {
  extendUserSubscriptionDays(user, plan.days);
}

function extendUserSubscriptionDays(user, days) {
  const safeDays = Math.max(0, Number(days) || 0);
  if (!safeDays) return;
  const now = Date.now();
  const activeUntil = user.subscriptionUntil ? new Date(user.subscriptionUntil).getTime() : 0;
  const startAt = Math.max(now, activeUntil);
  user.subscriptionUntil = new Date(startAt + safeDays * 24 * 60 * 60 * 1000).toISOString();
}

function publicUser(user) {
  const viewed = Array.isArray(user.viewedMapKeys) ? user.viewedMapKeys.length : 0;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    subscriptionActive: activeSubscription(user),
    subscriptionUntil: user.subscriptionUntil || null,
    freeMapsUsed: viewed,
    freeMapsLeft: Math.max(0, FREE_MAP_LIMIT - viewed),
  };
}

function applyPaymentOutcome(db, payment, options = {}) {
  if (!payment) return;

  const status = String(options.status || payment.status || "pending").toLowerCase();
  const nowIso = new Date().toISOString();
  const userId = String(options.userId || payment.userId || "");
  const plan = getPlanById(options.planId || payment.planId);

  payment.status = status;
  payment.updatedAt = nowIso;
  if (options.providerPayload) {
    payment.providerPayload = options.providerPayload;
  }

  if (status === "succeeded" && !payment.appliedAt && plan && userId) {
    const user = db.users.find((item) => item.id === userId);
    if (user) {
      extendUserSubscription(user, plan);
      payment.appliedAt = nowIso;
    }
  }
}

async function fetchYooKassaPayment(paymentId) {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey || !paymentId) return null;

  try {
    const response = await axios.get(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(paymentId)}`, {
      auth: { username: shopId, password: secretKey },
      timeout: 12000,
    });
    return response.data || null;
  } catch {
    return null;
  }
}

function normalizePromoCode(input) {
  return String(input || "").trim().toUpperCase().replace(/\s+/g, "");
}

function isDiscountPromoCode(code) {
  return DISCOUNT_PROMO_CODES.has(normalizePromoCode(code));
}

function isYearSpecialPromoCode(code) {
  return normalizePromoCode(code) === YEAR_SPECIAL_PROMO_CODE;
}

function promoStateFromCode(code) {
  const normalized = normalizePromoCode(code);
  if (isDiscountPromoCode(normalized)) {
    return { type: "discount", code: normalized, percent: DISCOUNT_PROMO_PERCENT };
  }
  if (isYearSpecialPromoCode(normalized)) {
    return { type: "year_special", code: normalized, yearPrice: YEAR_SPECIAL_PROMO_PRICE, planId: "year" };
  }
  return null;
}

function generateTrialPromoCode(db) {
  let attempts = 0;
  while (attempts < 50) {
    const raw = crypto.randomBytes(4).toString("hex").toUpperCase();
    const code = `UMK3D-${raw}`;
    const existsInDb = db.promoCodes.some((item) => normalizePromoCode(item.code) === code);
    const existsDiscount = DISCOUNT_PROMO_CODES.has(code);
    if (!existsInDb && !existsDiscount) return code;
    attempts += 1;
  }
  return `UMK3D-${Date.now().toString(36).toUpperCase()}`;
}

function sanitizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function resolveEnterSource(raw) {
  const normalized = String(raw || "").trim().toLowerCase();
  return ENTER_SOURCES.has(normalized) ? normalized : "direct";
}

function paragraphTitleFromSourceName(sourceName) {
  const raw = String(sourceName || "").trim();
  const parsed = path.parse(raw);
  const candidate = String(parsed.name || raw || "").trim();
  if (!candidate) return "Без названия";
  return candidate.slice(0, 220);
}

function sanitizeParagraphEntity(raw, fallbackIndex) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || "").trim().slice(0, 80);
  const title = String(raw.title || "").trim().slice(0, 220);
  if (!id || !title) return null;
  const chapter = String(raw.chapter || `Глава ${Math.ceil((fallbackIndex || 1) / 5)}`).trim().slice(0, 120);
  return { id, title, chapter };
}

function sanitizeSubjectEntity(raw, fallbackIndex) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || "").trim().slice(0, 80);
  const title = String(raw.title || "").trim().slice(0, 220);
  if (!id || !title) return null;
  return { id, title, order: Number(raw.order) || fallbackIndex || 0 };
}

function sanitizeGradeEntity(raw, fallbackIndex) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || "").trim().slice(0, 80);
  const title = String(raw.title || "").trim().slice(0, 220);
  if (!id || !title) return null;
  return { id, title, order: Number(raw.order) || fallbackIndex || 0 };
}

function createSubjectId(list) {
  const used = new Set((list || []).map((item) => String(item.id || "")));
  let attempt = 1;
  while (attempt < 2000) {
    const id = `subject-custom-${attempt}`;
    if (!used.has(id)) return id;
    attempt += 1;
  }
  return `subject-custom-${Date.now().toString(36)}`;
}

function createGradeId(subjectId, list) {
  const used = new Set((list || []).map((item) => String(item.id || "")));
  let attempt = 1;
  while (attempt < 2000) {
    const id = `${subjectId}-class-${attempt}`;
    if (!used.has(id)) return id;
    attempt += 1;
  }
  return `${subjectId}-class-${Date.now().toString(36)}`;
}

function ensureSubjectGradeStructure(db, subjectId, baseGradeEntries = null) {
  ensureGradeStructures(db);
  if (!Array.isArray(db.gradeStructures[subjectId])) {
    const sourceEntries =
      Array.isArray(baseGradeEntries) && baseGradeEntries.length
        ? baseGradeEntries
        : Object.entries(baseCatalog().find((item) => item.id === subjectId)?.grades || {});
    db.gradeStructures[subjectId] = sourceEntries.map(([gradeId, grade], index) =>
      sanitizeGradeEntity({ id: gradeId, title: grade?.title || String(gradeId), order: index + 1 }, index + 1),
    );
  }

  const sanitized = db.gradeStructures[subjectId]
    .map((item, index) => sanitizeGradeEntity(item, index + 1))
    .filter(Boolean)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((item, index) => ({ ...item, order: index + 1 }));

  db.gradeStructures[subjectId] = sanitized;
  return sanitized;
}

function createParagraphId(gradeId, list) {
  const used = new Set((list || []).map((item) => String(item.id || "")));
  let attempt = 1;
  while (attempt < 2000) {
    const id = `p-${gradeId}-custom-${attempt}`;
    if (!used.has(id)) return id;
    attempt += 1;
  }
  return `p-${gradeId}-custom-${Date.now().toString(36)}`;
}

function ensureGradeParagraphStructure(db, subjectId, gradeId) {
  ensureParagraphStructures(db);
  if (!db.paragraphStructures[subjectId]) db.paragraphStructures[subjectId] = {};
  if (!Array.isArray(db.paragraphStructures[subjectId][gradeId])) {
    const baseSubject = baseCatalog().find((item) => item.id === subjectId);
    const baseGrade = baseSubject?.grades?.[gradeId];
    db.paragraphStructures[subjectId][gradeId] = (baseGrade?.paragraphs || []).map((item, index) =>
      sanitizeParagraphEntity(item, index + 1),
    );
  }
  return db.paragraphStructures[subjectId][gradeId];
}

function sanitizeMapNode(node, depth = 0) {
  if (!node || typeof node !== "object") {
    return { title: "Без названия", children: [] };
  }

  const title = String(node.title || "Без названия").slice(0, 1200);
  const description = typeof node.description === "string" ? String(node.description).slice(0, 4000) : undefined;
  const details = Array.isArray(node.details)
    ? node.details.map((item) => String(item || "").slice(0, 1200)).filter(Boolean).slice(0, 60)
    : undefined;
  const side = node.side === "left" || node.side === "right" ? node.side : undefined;
  const children = Array.isArray(node.children)
    ? node.children.slice(0, 500).map((child) => sanitizeMapNode(child, depth + 1))
    : [];

  if (depth > 24) {
    return { title, children: [] };
  }

  const output = { title, children };
  if (description && description.trim()) output.description = description.trim();
  if (details?.length) output.details = details;
  if (side) output.side = side;
  return output;
}

function countMapNodes(node) {
  if (!node || typeof node !== "object") return 0;
  const children = Array.isArray(node.children) ? node.children : [];
  return 1 + children.reduce((sum, child) => sum + countMapNodes(child), 0);
}

function serializeMapForAi(node, options = {}) {
  const maxNodes = Number(options.maxNodes || 900);
  const maxDepth = Number(options.maxDepth || 12);
  let nodes = 0;

  function walk(input, depth = 0) {
    if (!input || typeof input !== "object") return null;
    if (nodes >= maxNodes || depth > maxDepth) return null;
    nodes += 1;

    const title = String(input.title || "Без названия").slice(0, 260);
    const children = [];
    if (Array.isArray(input.children) && depth < maxDepth) {
      for (const child of input.children) {
        if (nodes >= maxNodes) break;
        const parsed = walk(child, depth + 1);
        if (parsed) children.push(parsed);
      }
    }
    return { title, children };
  }

  return walk(node) || { title: "Без названия", children: [] };
}

function extractJsonObject(text) {
  const source = String(text || "").trim();
  if (!source) {
    throw new Error("AI вернул пустой ответ.");
  }

  const fenced = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return JSON.parse(fenced[1]);
  }

  try {
    return JSON.parse(source);
  } catch {
    const first = source.indexOf("{");
    const last = source.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(source.slice(first, last + 1));
    }
    throw new Error("AI вернул не-JSON ответ.");
  }
}

function extractOcrTextFromDataUrl(dataUrl) {
  const value = String(dataUrl || "");
  if (!value.startsWith("data:image/") || !value.includes(",")) {
    return "";
  }

  const base64 = value.slice(value.indexOf(",") + 1);
  const pythonScript = `
import base64, io, json, sys
from PIL import Image
import pytesseract
from pytesseract import Output

b64 = sys.stdin.read().strip()
if not b64:
    print("")
    raise SystemExit(0)

raw = base64.b64decode(b64)
img = Image.open(io.BytesIO(raw)).convert("RGB")
try:
    data = pytesseract.image_to_data(img, output_type=Output.DICT, lang="rus+eng", config="--psm 11")
except Exception:
    data = pytesseract.image_to_data(img, output_type=Output.DICT, lang="eng", config="--psm 11")

rows = {}
for i, txt in enumerate(data.get("text", [])):
    t = (txt or "").strip()
    conf = data.get("conf", ["-1"])[i]
    try:
        c = float(conf)
    except Exception:
        c = -1
    if not t or c < 10:
        continue
    key = (
        data.get("block_num", [0])[i],
        data.get("par_num", [0])[i],
        data.get("line_num", [0])[i],
    )
    x = int(data.get("left", [0])[i])
    y = int(data.get("top", [0])[i])
    w = int(data.get("width", [0])[i])
    h = int(data.get("height", [0])[i])
    rows.setdefault(key, []).append({"x": x, "y": y, "w": w, "h": h, "conf": c, "text": t})

merged = []
for key, items in rows.items():
    items.sort(key=lambda it: it["x"])
    text = " ".join(it["text"] for it in items).strip()
    if not text:
        continue
    x = min(it["x"] for it in items)
    y = min(it["y"] for it in items)
    x2 = max(it["x"] + it["w"] for it in items)
    y2 = max(it["y"] + it["h"] for it in items)
    avg_conf = sum(it["conf"] for it in items) / len(items)
    merged.append({"x": x, "y": y, "w": x2-x, "h": y2-y, "conf": avg_conf, "text": text})

merged.sort(key=lambda r: (r["y"], r["x"]))
print(json.dumps(merged, ensure_ascii=False))
`;

  try {
    const result = spawnSync("python3", ["-c", pythonScript], {
      input: base64,
      encoding: "utf8",
      maxBuffer: 25 * 1024 * 1024,
      timeout: 120000,
    });

    if (result.error || result.status !== 0) {
      return "";
    }

    const raw = String(result.stdout || "").trim();
    if (!raw) return "";
    const rows = JSON.parse(raw);
    if (!Array.isArray(rows) || !rows.length) return "";

    return rows
      .slice(0, 5000)
      .map((row) => `[x:${row.x} y:${row.y} w:${row.w} h:${row.h} conf:${Math.round(row.conf)}] ${row.text}`)
      .join("\n");
  } catch {
    return "";
  }
}

function buildFallbackMapFromOcr(ocrText, sourceName = "PDF-карта") {
  const lines = String(ocrText || "")
    .split("\n")
    .map((line) => {
      const match = line.match(/^\[x:(\d+)\s+y:(\d+)\s+w:(\d+)\s+h:(\d+)\s+conf:(\d+)\]\s+(.+)$/);
      if (!match) return null;
      const x = Number(match[1]);
      const y = Number(match[2]);
      const conf = Number(match[5]);
      const text = String(match[6] || "").trim();
      if (!text || conf < 10 || text.length < 2) return null;
      if (/^[\W_]+$/.test(text)) return null;
      return { x, y, conf, text };
    })
    .filter(Boolean)
    .slice(0, 5000);

  if (!lines.length) {
    return { title: String(sourceName).replace(/\.pdf$/i, "") || "PDF-карта", children: [] };
  }

  const xs = lines.map((line) => line.x);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;

  const centerCandidates = lines
    .filter((line) => Math.abs(line.x - centerX) < 220)
    .sort((a, b) => b.text.length - a.text.length);

  const rootTitle =
    centerCandidates.find((line) => line.text.length > 14 && line.text.length < 180)?.text ||
    String(sourceName).replace(/\.pdf$/i, "") ||
    "PDF-карта";

  const root = { title: cleanupMapText(rootTitle), children: [] };
  const centerRows = lines
    .filter((line) => Math.abs(line.x - centerX) < 260)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const details = centerRows
    .map((line) => cleanupMapText(line.text))
    .filter(Boolean)
    .filter((text) => text !== root.title)
    .slice(0, 10);
  if (details.length) {
    root.details = details;
  }
  const sideRows = lines
    .filter((line) => cleanupMapText(line.text) !== root.title)
    .map((line) => ({ ...line, side: line.x < centerX ? "left" : "right", dist: Math.abs(line.x - centerX) }))
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const bySide = {
    left: sideRows.filter((row) => row.side === "left"),
    right: sideRows.filter((row) => row.side === "right"),
  };

  ["left", "right"].forEach((side) => {
    const rows = bySide[side];
    if (!rows.length) return;

    const minDist = Math.min(...rows.map((row) => row.dist));
    const maxDist = Math.max(...rows.map((row) => row.dist));
    const step = Math.max(70, (maxDist - minDist + 1) / 4);
    const stack = [];

    rows.forEach((row) => {
      const clean = cleanupMapText(row.text);
      if (!clean) return;
      const level = Math.max(1, Math.min(5, 1 + Math.floor((row.dist - minDist) / step)));
      const node = { title: clean, children: [] };

      while (stack.length && level <= stack[stack.length - 1].level) {
        stack.pop();
      }

      const parent = stack.length ? stack[stack.length - 1].node : root;
      parent.children.push(node);
      stack.push({ level, node });
    });
  });

  return sanitizeMapNode(root);
}

function cleanupMapText(input) {
  const value = String(input || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!value) return "";
  return value.slice(0, 600);
}

async function normalizeMapWithKieAi(sourceMap, context = {}) {
  const apiKey = KIE_API_KEY;
  const preserveText = context.preserveText === true;
  if (!KIE_NORMALIZE_MAPS || !apiKey) {
    return {
      map: sourceMap,
      ai: {
        enabled: Boolean(apiKey && KIE_NORMALIZE_MAPS),
        used: false,
        provider: "kie.ai",
        model: KIE_GEMINI_MODEL,
        preserveText,
      },
    };
  }

  let workingMap = sanitizeMapNode(sourceMap);
  const safeRawText = String(context.rawText || "").slice(0, 300000);
  const sourceName = String(context.sourceName || "uploaded-map");
  const importFormat = String(context.importFormat || "unknown");
  const pdfPreviewDataUrl = String(context.pdfPreviewDataUrl || "");
  let effectiveRawText = safeRawText;
  let ocrUsed = false;

  if (importFormat === "pdf" && !effectiveRawText && pdfPreviewDataUrl) {
    const ocrText = extractOcrTextFromDataUrl(pdfPreviewDataUrl).slice(0, 250000);
    if (ocrText) {
      effectiveRawText = ocrText;
      ocrUsed = true;
    }
  }

  if (importFormat === "pdf" && (!workingMap.children || !workingMap.children.length) && effectiveRawText) {
    const ocrMap = buildFallbackMapFromOcr(effectiveRawText, sourceName);
    if (Array.isArray(ocrMap.children) && ocrMap.children.length) {
      workingMap = ocrMap;
    }
  }

  if (preserveText) {
    return {
      map: workingMap,
      ai: {
        enabled: Boolean(apiKey && KIE_NORMALIZE_MAPS),
        used: false,
        provider: "kie.ai",
        model: KIE_GEMINI_MODEL,
        ocrUsed,
        preserveText: true,
      },
    };
  }

  const promptMap = serializeMapForAi(workingMap);

  const isPdfImport = importFormat === "pdf";
  const systemPrompt =
    "Ты редактор интеллект-карт. Верни ТОЛЬКО JSON объекта карты вида {\"title\":\"...\",\"children\":[...]} без markdown. " +
    "Сохраняй смысл и иерархию исходной карты, удаляй служебный мусор, html-теги и дубли. НЕ сжимай и НЕ пересказывай карту кратко: сохраняй максимальное количество исходных пунктов и подпунктов. " +
    (isPdfImport
      ? "Для PDF восстанавливай структуру именно как ментальную карту по координатам OCR: узлы рядом с центром — верхний уровень, более дальние — нижние уровни. Сохраняй почти все микро-ветви."
      : "");

  const userPrompt = {
    task: "Normalize mind map for interactive school viewer.",
    sourceName,
    importFormat,
    map: promptMap,
    rawTextHint: effectiveRawText || null,
    outputRules: {
      requiredKeys: ["title", "children"],
      titleLimit: 240,
      maxDepth: 12,
      maxChildrenPerNode: 80,
      preferDetailOverCompression: true,
      language: "keep source language",
      outputOnlyJson: true,
    },
  };

  try {
    const response = await axios.post(
      `${KIE_API_BASE}/${encodeURIComponent(KIE_GEMINI_MODEL)}/v1/chat/completions`,
      {
        model: KIE_GEMINI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPrompt) },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 120000,
      },
    );

    const message = response.data?.choices?.[0]?.message?.content;
    const text = Array.isArray(message)
      ? message.map((part) => (typeof part === "string" ? part : part?.text || "")).join("\n")
      : String(message || "");
    const parsed = extractJsonObject(text);
    const normalizedMap = sanitizeMapNode(parsed.map || parsed);

    return {
      map: normalizedMap,
      ai: {
        enabled: true,
        used: true,
        provider: "kie.ai",
        model: KIE_GEMINI_MODEL,
        ocrUsed,
      },
    };
  } catch (error) {
    const details = error?.response?.data?.error || error?.response?.data || error?.message || String(error);
    return {
      map: workingMap,
      ai: {
        enabled: true,
        used: false,
        provider: "kie.ai",
        model: KIE_GEMINI_MODEL,
        ocrUsed,
        error: typeof details === "string" ? details : JSON.stringify(details),
      },
    };
  }
}

function ensureAdminSeed() {
  mutateDb((db) => {
    ensureCatalogAccess(db);
    const seedAdmins = [
      {
        email: sanitizeEmail(process.env.ADMIN_EMAIL || "admin.umkart.9x7q2@bk.ru"),
        password: process.env.ADMIN_PASSWORD || "fc67a6HkYXOO4OcbdHQomAKB",
      },
    ];

    seedAdmins.forEach(({ email, password }) => {
      let user = db.users.find((item) => item.email === email);
      if (!user) {
        user = {
          id: crypto.randomUUID(),
          email,
          passwordHash: bcrypt.hashSync(password, 10),
          role: "admin",
          subscriptionUntil: null,
          viewedMapKeys: [],
          createdAt: new Date().toISOString(),
        };
        db.users.push(user);
        console.log("[seed] Создан admin:", email, "пароль:", password);
        return;
      }

      user.role = "admin";
      if (!bcrypt.compareSync(password, user.passwordHash || "")) {
        user.passwordHash = bcrypt.hashSync(password, 10);
      }
      if (!Array.isArray(user.viewedMapKeys)) user.viewedMapKeys = [];
    });
  });
}

function createParagraphs(subjectName, gradeId, total) {
  return Array.from({ length: total }).map((_, index) => {
    const num = index + 1;
    return {
      id: `p-${gradeId}-${num}`,
      title: `§${num}. ${subjectName}: тема ${num}`,
      chapter: `Глава ${Math.ceil(num / 5)}`,
    };
  });
}

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    res.status(401).json({ error: "Нужна регистрация и вход в личный кабинет." });
    return;
  }
  next();
}

function requireAdmin(req, res, next) {
  const db = loadDb();
  const user = db.users.find((u) => u.id === req.session.userId);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Доступ только для администраторов." });
    return;
  }
  req.currentUser = user;
  next();
}

app.use(express.json({ limit: "60mb" }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_umkarta_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 },
  }),
);

app.use((req, _res, next) => {
  if (req.method === "GET" && req.path === "/") {
    const source = resolveEnterSource(req.query?.enter);
    mutateDb((db) => {
      ensureTrafficStats(db);
      db.trafficStats.counts.total += 1;
      db.trafficStats.counts[source] += 1;
      db.trafficStats.recent.unshift({
        at: new Date().toISOString(),
        source,
      });
      if (db.trafficStats.recent.length > 200) {
        db.trafficStats.recent = db.trafficStats.recent.slice(0, 200);
      }
    });
  }
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.get("/api/plans", (_req, res) => {
  res.json({ plans: PLANS });
});

app.get("/api/catalog", (_req, res) => {
  const db = loadDb();
  res.json({ subjects: catalogFromDb(db) });
});

app.post("/api/auth/register", (req, res) => {
  const email = sanitizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "Введите корректный email." });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Пароль должен быть не короче 6 символов." });
    return;
  }

  const user = mutateDb((db) => {
    const exists = db.users.find((item) => item.email === email);
    if (exists) return null;

    const created = {
      id: crypto.randomUUID(),
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      role: "user",
      subscriptionUntil: null,
      viewedMapKeys: [],
      createdAt: new Date().toISOString(),
    };
    db.users.push(created);
    return created;
  });

  if (!user) {
    res.status(409).json({ error: "Пользователь с таким email уже зарегистрирован." });
    return;
  }

  req.session.userId = user.id;
  res.json({ user: publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const email = sanitizeEmail(req.body.email);
  const password = String(req.body.password || "");

  const db = loadDb();
  const user = db.users.find((item) => item.email === email);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    res.status(401).json({ error: "Неверный email или пароль." });
    return;
  }

  req.session.userId = user.id;
  res.json({ user: publicUser(user) });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get("/api/auth/me", (req, res) => {
  if (!req.session.userId) {
    res.json({ user: null });
    return;
  }

  const db = loadDb();
  const user = db.users.find((item) => item.id === req.session.userId);
  if (!user) {
    req.session.userId = null;
    req.session.activeDiscountPromoCode = null;
    res.json({ user: null });
    return;
  }

  const activePromoCode = normalizePromoCode(req.session.activeDiscountPromoCode);
  const discountPromo = promoStateFromCode(activePromoCode);
  res.json({ user: publicUser(user), discountPromo });
});

app.get("/api/maps/resolve", requireAuth, (req, res) => {
  const subjectId = String(req.query.subjectId || "");
  const gradeId = String(req.query.gradeId || "");
  const paragraphId = String(req.query.paragraphId || "");

  if (!subjectId || !gradeId || !paragraphId) {
    res.status(400).json({ error: "Не хватает параметров subjectId/gradeId/paragraphId." });
    return;
  }

  const mapKey = `${subjectId}::${gradeId}::${paragraphId}`;

  const result = mutateDb((db) => {
    const user = db.users.find((item) => item.id === req.session.userId);
    if (!user) {
      return { status: 401, body: { error: "Сессия устарела. Войдите заново." } };
    }

    const mapRecord = db.maps.find((item) => item.key === mapKey);
    if (!mapRecord) {
      return { status: 404, body: { error: "Для этого параграфа карта пока не загружена." } };
    }

    if (user.role === "admin" || activeSubscription(user)) {
      return {
        status: 200,
        body: {
          map: mapRecord.map,
          sourceName: mapRecord.sourceName,
          access: { type: user.role === "admin" ? "admin" : "subscription", freeLeft: Math.max(0, FREE_MAP_LIMIT - (user.viewedMapKeys || []).length) },
        },
      };
    }

    if (!Array.isArray(user.viewedMapKeys)) user.viewedMapKeys = [];
    if (!user.viewedMapKeys.includes(mapKey)) {
      if (user.viewedMapKeys.length >= FREE_MAP_LIMIT) {
        return {
          status: 402,
          body: {
            error: "Бесплатный лимит (3 карты) исчерпан. Оформите подписку.",
            plans: PLANS,
            freeLeft: 0,
          },
        };
      }
      user.viewedMapKeys.push(mapKey);
    }

    return {
      status: 200,
      body: {
        map: mapRecord.map,
        sourceName: mapRecord.sourceName,
        access: { type: "free", freeLeft: Math.max(0, FREE_MAP_LIMIT - user.viewedMapKeys.length) },
      },
    };
  });

  res.status(result.status).json(result.body);
});

app.get("/api/admin/maps", requireAuth, requireAdmin, (req, res) => {
  const subjectId = String(req.query.subjectId || "");
  const gradeId = String(req.query.gradeId || "");
  const db = loadDb();

  const records = db.maps
    .filter((item) => (!subjectId || item.subjectId === subjectId) && (!gradeId || item.gradeId === gradeId))
    .map((item) => ({
      id: item.id,
      key: item.key,
      subjectId: item.subjectId,
      gradeId: item.gradeId,
      paragraphId: item.paragraphId,
      sourceName: item.sourceName,
      updatedAt: item.updatedAt,
    }));

  res.json({ records });
});

app.post("/api/admin/maps", requireAuth, requireAdmin, async (req, res) => {
  const subjectId = String(req.body.subjectId || "");
  const gradeId = String(req.body.gradeId || "");
  const paragraphIds = Array.isArray(req.body.paragraphIds) ? req.body.paragraphIds.map((item) => String(item)) : [];
  const sourceName = String(req.body.sourceName || "uploaded-map");
  const importFormat = String(req.body.importFormat || "unknown");
  const rawText = String(req.body.rawText || "");
  const pdfPreviewDataUrl = String(req.body.pdfPreviewDataUrl || "");
  const preserveText = req.body.preserveText === true;
  const sourceMap = sanitizeMapNode(req.body.map || null);

  if (!subjectId || !gradeId || !paragraphIds.length) {
    res.status(400).json({ error: "Нужны subjectId, gradeId и минимум один paragraphId." });
    return;
  }

  if (!sourceMap || !sourceMap.title) {
    res.status(400).json({ error: "Не удалось распознать дерево карты." });
    return;
  }

  const transformed = await normalizeMapWithKieAi(sourceMap, {
    sourceName,
    importFormat,
    rawText,
    pdfPreviewDataUrl,
    preserveText,
  });
  const map = transformed.map;
  const autoParagraphTitle = paragraphTitleFromSourceName(sourceName);

  const changed = mutateDb((db) => {
    ensureParagraphOverrides(db);
    if (!db.paragraphOverrides[subjectId]) db.paragraphOverrides[subjectId] = {};
    if (!db.paragraphOverrides[subjectId][gradeId]) db.paragraphOverrides[subjectId][gradeId] = {};

    const now = new Date().toISOString();
    const list = [];

    paragraphIds.forEach((paragraphId) => {
      const key = `${subjectId}::${gradeId}::${paragraphId}`;
      let row = db.maps.find((item) => item.key === key);
      if (!row) {
        row = {
          id: crypto.randomUUID(),
          key,
          subjectId,
          gradeId,
          paragraphId,
          sourceName,
          map,
          createdBy: req.currentUser.id,
          createdAt: now,
          updatedAt: now,
        };
        db.maps.push(row);
      } else {
        row.sourceName = sourceName;
        row.map = map;
        row.updatedAt = now;
      }
      db.paragraphOverrides[subjectId][gradeId][paragraphId] = autoParagraphTitle;
      list.push({ key: row.key, paragraphId: row.paragraphId, updatedAt: row.updatedAt });
    });

    return list;
  });

  res.json({
    ok: true,
    updated: changed.length,
    records: changed,
    paragraphTitle: autoParagraphTitle,
    ai: transformed.ai,
  });
});

app.delete("/api/admin/maps", requireAuth, requireAdmin, (req, res) => {
  const subjectId = String(req.body.subjectId || "");
  const gradeId = String(req.body.gradeId || "");
  const paragraphIds = Array.isArray(req.body.paragraphIds) ? req.body.paragraphIds.map((item) => String(item)) : [];

  if (!subjectId || !gradeId || !paragraphIds.length) {
    res.status(400).json({ error: "Нужны subjectId, gradeId и список paragraphIds." });
    return;
  }

  const removed = mutateDb((db) => {
    const before = db.maps.length;
    const toRemove = new Set(paragraphIds.map((paragraphId) => `${subjectId}::${gradeId}::${paragraphId}`));
    db.maps = db.maps.filter((item) => !toRemove.has(item.key));
    return before - db.maps.length;
  });

  res.json({ ok: true, removed });
});

app.get("/api/admin/catalog-access", requireAuth, requireAdmin, (_req, res) => {
  const db = loadDb();
  ensureCatalogAccess(db);
  const currentCatalog = catalogFromDb(db);
  const subjects = currentCatalog.map((subject) => {
    const enriched = currentCatalog.find((item) => item.id === subject.id) || subject;
    return {
      id: subject.id,
      title: enriched.title || subject.title,
      enabled: Boolean(db.catalogAccess[subject.id]),
      hasGrades: Boolean(enriched.grades && Object.keys(enriched.grades).length),
    };
  });
  res.json({ subjects });
});

app.post("/api/admin/catalog-access", requireAuth, requireAdmin, (req, res) => {
  const subjectId = String(req.body.subjectId || "");
  const enabled = req.body.enabled === true;

  const result = mutateDb((db) => {
    ensureCatalogAccess(db);
    const subject = catalogFromDb(db).find((item) => item.id === subjectId);
    if (!subject) {
      return { status: 404, body: { error: "Предмет не найден." } };
    }
    db.catalogAccess[subjectId] = enabled;
    return {
      status: 200,
      body: {
        ok: true,
        subjectId,
        enabled,
      },
    };
  });

  res.status(result.status).json(result.body);
});

app.get("/api/admin/subjects", requireAuth, requireAdmin, (_req, res) => {
  const db = loadDb();
  ensureCatalogAccess(db);
  const subjects = catalogFromDb(db).map((subject, index) => ({
    id: subject.id,
    title: String(subject.title || subject.id),
    order: index + 1,
    enabled: Boolean(db.catalogAccess?.[subject.id]),
    hasGrades: Boolean(subject.grades && Object.keys(subject.grades).length),
    gradeCount: subject.grades ? Object.keys(subject.grades).length : 0,
  }));
  res.json({ subjects });
});

app.post("/api/admin/subjects", requireAuth, requireAdmin, (req, res) => {
  const action = String(req.body.action || "");
  const subjectId = String(req.body.subjectId || "");
  const titleInput = String(req.body.title || "").trim();

  if (!action) {
    res.status(400).json({ error: "Нужен action." });
    return;
  }

  const result = mutateDb((db) => {
    const structure = ensureSubjectStructures(db);
    ensureCatalogAccess(db);
    const index = structure.findIndex((item) => item.id === subjectId);

    if (action === "add") {
      if (!titleInput || titleInput.length < 2) {
        return { status: 400, body: { error: "Введите название предмета (минимум 2 символа)." } };
      }
      const id = createSubjectId(structure);
      structure.push({ id, title: titleInput.slice(0, 220), order: structure.length + 1 });
      db.catalogAccess[id] = false;
      ensureSubjectGradeStructure(db, id, []);
      return { status: 200, body: { ok: true, action, subjectId: id } };
    }

    if (index === -1) {
      return { status: 404, body: { error: "Предмет не найден." } };
    }

    if (action === "rename") {
      if (!titleInput || titleInput.length < 2) {
        return { status: 400, body: { error: "Название предмета должно быть не короче 2 символов." } };
      }
      structure[index].title = titleInput.slice(0, 220);
      return { status: 200, body: { ok: true, action, subjectId } };
    }

    if (action === "move_up") {
      if (index > 0) {
        const [row] = structure.splice(index, 1);
        structure.splice(index - 1, 0, row);
      }
      return { status: 200, body: { ok: true, action, subjectId } };
    }

    if (action === "move_down") {
      if (index < structure.length - 1) {
        const [row] = structure.splice(index, 1);
        structure.splice(index + 1, 0, row);
      }
      return { status: 200, body: { ok: true, action, subjectId } };
    }

    if (action === "delete") {
      const baseIds = new Set(baseCatalog().map((item) => item.id));
      if (baseIds.has(subjectId)) {
        return { status: 400, body: { error: "Базовый предмет удалить нельзя." } };
      }
      structure.splice(index, 1);
      if (db.catalogAccess) delete db.catalogAccess[subjectId];
      if (db.gradeStructures) delete db.gradeStructures[subjectId];
      if (db.paragraphStructures) delete db.paragraphStructures[subjectId];
      if (db.paragraphOverrides) delete db.paragraphOverrides[subjectId];
      db.maps = db.maps.filter((item) => item.subjectId !== subjectId);
      return { status: 200, body: { ok: true, action, subjectId } };
    }

    return { status: 400, body: { error: "Неизвестное действие." } };
  });

  res.status(result.status).json(result.body);
});

app.get("/api/admin/grades", requireAuth, requireAdmin, (req, res) => {
  const subjectId = String(req.query.subjectId || "");
  if (!subjectId) {
    res.status(400).json({ error: "Нужен subjectId." });
    return;
  }

  const db = loadDb();
  const subject = catalogFromDb(db).find((item) => item.id === subjectId);
  if (!subject) {
    res.status(404).json({ error: "Предмет не найден." });
    return;
  }

  const structured = ensureSubjectGradeStructure(
    db,
    subjectId,
    Object.entries(subject.grades && typeof subject.grades === "object" ? subject.grades : {}),
  );
  const subjectFromCatalog = subject;
  const list = structured.map((meta, index) => {
    const grade = subjectFromCatalog?.grades?.[meta.id];
    return {
      id: meta.id,
      title: String(grade?.title || meta.title || meta.id),
      order: index + 1,
      paragraphCount: Array.isArray(grade?.paragraphs) ? grade.paragraphs.length : 0,
    };
  });
  res.json({ grades: list });
});

app.post("/api/admin/grades", requireAuth, requireAdmin, (req, res) => {
  const subjectId = String(req.body.subjectId || "");
  const action = String(req.body.action || "");
  const gradeId = String(req.body.gradeId || "");
  const titleInput = String(req.body.title || "").trim();

  if (!subjectId || !action) {
    res.status(400).json({ error: "Нужны subjectId и action." });
    return;
  }

  const result = mutateDb((db) => {
    const baseSubject = catalogFromDb(db).find((item) => item.id === subjectId);
    if (!baseSubject) {
      return { status: 404, body: { error: "Предмет не найден." } };
    }

    const structure = ensureSubjectGradeStructure(
      db,
      subjectId,
      Object.entries(baseSubject.grades && typeof baseSubject.grades === "object" ? baseSubject.grades : {}),
    );
    const index = structure.findIndex((item) => item.id === gradeId);

    if (action === "add") {
      if (!titleInput || titleInput.length < 2) {
        return { status: 400, body: { error: "Введите название класса (минимум 2 символа)." } };
      }
      const id = createGradeId(subjectId, structure);
      structure.push({ id, title: titleInput.slice(0, 220), order: structure.length + 1 });
      ensureGradeParagraphStructure(db, subjectId, id);
      return { status: 200, body: { ok: true, action, gradeId: id } };
    }

    if (index === -1) {
      return { status: 404, body: { error: "Класс не найден." } };
    }

    if (action === "rename") {
      if (!titleInput || titleInput.length < 2) {
        return { status: 400, body: { error: "Название класса должно быть не короче 2 символов." } };
      }
      structure[index].title = titleInput.slice(0, 220);
      return { status: 200, body: { ok: true, action, gradeId } };
    }

    if (action === "move_up") {
      if (index > 0) {
        const [row] = structure.splice(index, 1);
        structure.splice(index - 1, 0, row);
      }
      return { status: 200, body: { ok: true, action, gradeId } };
    }

    if (action === "move_down") {
      if (index < structure.length - 1) {
        const [row] = structure.splice(index, 1);
        structure.splice(index + 1, 0, row);
      }
      return { status: 200, body: { ok: true, action, gradeId } };
    }

    if (action === "delete") {
      structure.splice(index, 1);
      if (db.paragraphStructures?.[subjectId]) {
        delete db.paragraphStructures[subjectId][gradeId];
      }
      if (db.paragraphOverrides?.[subjectId]) {
        delete db.paragraphOverrides[subjectId][gradeId];
      }
      db.maps = db.maps.filter((item) => !(item.subjectId === subjectId && item.gradeId === gradeId));
      return { status: 200, body: { ok: true, action, gradeId } };
    }

    return { status: 400, body: { error: "Неизвестное действие." } };
  });

  res.status(result.status).json(result.body);
});

app.get("/api/admin/paragraphs", requireAuth, requireAdmin, (req, res) => {
  const subjectId = String(req.query.subjectId || "");
  const gradeId = String(req.query.gradeId || "");
  if (!subjectId || !gradeId) {
    res.status(400).json({ error: "Нужны subjectId и gradeId." });
    return;
  }

  const db = loadDb();
  const subject = catalogFromDb(db).find((item) => item.id === subjectId);
  const grade = subject?.grades?.[gradeId];
  if (!grade) {
    res.status(404).json({ error: "Класс не найден." });
    return;
  }

  res.json({ paragraphs: grade.paragraphs || [] });
});

app.post("/api/admin/paragraphs", requireAuth, requireAdmin, (req, res) => {
  const subjectId = String(req.body.subjectId || "");
  const gradeId = String(req.body.gradeId || "");
  const action = String(req.body.action || "");
  const paragraphId = String(req.body.paragraphId || "");
  const titleInput = String(req.body.title || "").trim();

  if (!subjectId || !gradeId || !action) {
    res.status(400).json({ error: "Нужны subjectId, gradeId и action." });
    return;
  }

  const result = mutateDb((db) => {
    const subject = catalogFromDb(db).find((item) => item.id === subjectId);
    if (!subject || !subject.grades?.[gradeId]) {
      return { status: 404, body: { error: "Предмет или класс не найден." } };
    }

    const list = ensureGradeParagraphStructure(db, subjectId, gradeId);
    const index = list.findIndex((item) => item.id === paragraphId);

    if (action === "add") {
      const id = createParagraphId(gradeId, list);
      const title = (titleInput || "Новая глава").slice(0, 220);
      list.push({ id, title, chapter: "Дополнительно" });
      return { status: 200, body: { ok: true, action, paragraphId: id } };
    }

    if (action === "add_content") {
      const id = createParagraphId(gradeId, list);
      list.unshift({ id, title: "Содержание", chapter: "Содержание" });
      return { status: 200, body: { ok: true, action, paragraphId: id } };
    }

    if (action === "add_summary") {
      const id = createParagraphId(gradeId, list);
      list.push({ id, title: "Итоги главы", chapter: "Итоги" });
      return { status: 200, body: { ok: true, action, paragraphId: id } };
    }

    if (index === -1) {
      return { status: 404, body: { error: "Параграф не найден." } };
    }

    if (action === "rename") {
      if (!titleInput || titleInput.length < 2) {
        return { status: 400, body: { error: "Название должно быть не короче 2 символов." } };
      }
      list[index].title = titleInput.slice(0, 220);
      ensureParagraphOverrides(db);
      if (!db.paragraphOverrides[subjectId]) db.paragraphOverrides[subjectId] = {};
      if (!db.paragraphOverrides[subjectId][gradeId]) db.paragraphOverrides[subjectId][gradeId] = {};
      db.paragraphOverrides[subjectId][gradeId][paragraphId] = list[index].title;
      return { status: 200, body: { ok: true, action, paragraphId } };
    }

    if (action === "move_up") {
      if (index > 0) {
        const [row] = list.splice(index, 1);
        list.splice(index - 1, 0, row);
      }
      return { status: 200, body: { ok: true, action, paragraphId } };
    }

    if (action === "move_down") {
      if (index < list.length - 1) {
        const [row] = list.splice(index, 1);
        list.splice(index + 1, 0, row);
      }
      return { status: 200, body: { ok: true, action, paragraphId } };
    }

    if (action === "delete") {
      list.splice(index, 1);
      ensureParagraphOverrides(db);
      if (db.paragraphOverrides?.[subjectId]?.[gradeId]) {
        delete db.paragraphOverrides[subjectId][gradeId][paragraphId];
      }
      const mapKey = `${subjectId}::${gradeId}::${paragraphId}`;
      db.maps = db.maps.filter((item) => item.key !== mapKey);
      return { status: 200, body: { ok: true, action, paragraphId } };
    }

    if (action === "delete_map") {
      const mapKey = `${subjectId}::${gradeId}::${paragraphId}`;
      const before = db.maps.length;
      db.maps = db.maps.filter((item) => item.key !== mapKey);
      return { status: 200, body: { ok: true, action, paragraphId, removed: before - db.maps.length } };
    }

    return { status: 400, body: { error: "Неизвестное действие." } };
  });

  res.status(result.status).json(result.body);
});

app.post("/api/admin/paragraph-title", requireAuth, requireAdmin, (req, res) => {
  const subjectId = String(req.body.subjectId || "");
  const gradeId = String(req.body.gradeId || "");
  const paragraphId = String(req.body.paragraphId || "");
  const title = String(req.body.title || "").trim();

  if (!subjectId || !gradeId || !paragraphId) {
    res.status(400).json({ error: "Нужны subjectId, gradeId и paragraphId." });
    return;
  }

  if (!title || title.length < 2) {
    res.status(400).json({ error: "Название параграфа должно быть не короче 2 символов." });
    return;
  }

  const result = mutateDb((db) => {
    const subject = catalogFromDb(db).find((item) => item.id === subjectId);
    if (!subject || !subject.grades?.[gradeId]) {
      return { status: 404, body: { error: "Предмет или класс не найден." } };
    }

    const paragraphExists = subject.grades[gradeId].paragraphs.some((item) => item.id === paragraphId);
    if (!paragraphExists) {
      return { status: 404, body: { error: "Параграф не найден." } };
    }

    ensureParagraphOverrides(db);
    if (!db.paragraphOverrides[subjectId]) db.paragraphOverrides[subjectId] = {};
    if (!db.paragraphOverrides[subjectId][gradeId]) db.paragraphOverrides[subjectId][gradeId] = {};
    db.paragraphOverrides[subjectId][gradeId][paragraphId] = title.slice(0, 220);

    return {
      status: 200,
      body: {
        ok: true,
        subjectId,
        gradeId,
        paragraphId,
        title: db.paragraphOverrides[subjectId][gradeId][paragraphId],
      },
    };
  });

  res.status(result.status).json(result.body);
});

app.get("/api/admin/stats", requireAuth, requireAdmin, (_req, res) => {
  const db = loadDb();
  ensureTrafficStats(db);

  const paidMap = new Map();
  db.payments.forEach((payment) => {
    if (String(payment.status || "").toLowerCase() !== "succeeded") return;
    const userId = String(payment.userId || "");
    if (!userId) return;
    const existing = paidMap.get(userId);
    const existingTs = existing ? new Date(existing.updatedAt || existing.createdAt || 0).getTime() : 0;
    const nextTs = new Date(payment.updatedAt || payment.createdAt || 0).getTime();
    if (!existing || nextTs >= existingTs) {
      paidMap.set(userId, payment);
    }
  });

  const paidSubscribers = db.users
    .filter((user) => activeSubscription(user) && paidMap.has(user.id))
    .map((user) => {
      const payment = paidMap.get(user.id);
      const plan = getPlanById(payment?.planId);
      return {
        email: user.email,
        planId: payment?.planId || "",
        planTitle: plan?.title || payment?.planId || "Не определен",
        subscriptionUntil: user.subscriptionUntil || null,
      };
    })
    .sort((a, b) => String(a.subscriptionUntil || "").localeCompare(String(b.subscriptionUntil || "")) * -1);

  res.json({
    counts: db.trafficStats.counts,
    recent: db.trafficStats.recent.slice(0, 30),
    paidSubscribers,
  });
});

app.post("/api/promocodes/apply", requireAuth, (req, res) => {
  const code = normalizePromoCode(req.body.code);
  if (!code) {
    res.status(400).json({ error: "Введите промокод." });
    return;
  }

  if (isYearSpecialPromoCode(code)) {
    req.session.activeDiscountPromoCode = code;
    res.json({
      ok: true,
      type: "year_special",
      message: `Промокод ${code} активирован: годовой тариф снижен до ${YEAR_SPECIAL_PROMO_PRICE} ₽.`,
      discount: { type: "year_special", code, yearPrice: YEAR_SPECIAL_PROMO_PRICE, planId: "year" },
    });
    return;
  }

  if (isDiscountPromoCode(code)) {
    req.session.activeDiscountPromoCode = code;
    res.json({
      ok: true,
      type: "discount",
      message: `Промокод ${code} активирован: скидка ${DISCOUNT_PROMO_PERCENT}% на оплату подписки.`,
      discount: { type: "discount", code, percent: DISCOUNT_PROMO_PERCENT },
    });
    return;
  }

  const result = mutateDb((db) => {
    const user = db.users.find((item) => item.id === req.session.userId);
    if (!user) {
      return { status: 401, body: { error: "Сессия устарела. Войдите заново." } };
    }

    const promo = db.promoCodes.find((item) => normalizePromoCode(item.code) === code);
    if (!promo) {
      return { status: 404, body: { error: "Промокод не найден." } };
    }

    if (promo.type !== "trial_3d") {
      return { status: 400, body: { error: "Этот промокод нельзя активировать в данном режиме." } };
    }

    if (promo.usedBy || promo.active === false) {
      return { status: 409, body: { error: "Промокод уже использован." } };
    }

    extendUserSubscriptionDays(user, 3);
    promo.usedBy = user.id;
    promo.usedAt = new Date().toISOString();
    promo.active = false;

    return {
      status: 200,
      body: {
        ok: true,
        type: "trial_3d",
        message: "Промокод успешно активирован. Подписка продлена на 3 дня.",
        subscriptionUntil: user.subscriptionUntil,
      },
    };
  });

  res.status(result.status).json(result.body);
});

app.get("/api/promocodes/me", requireAuth, (req, res) => {
  const code = normalizePromoCode(req.session.activeDiscountPromoCode);
  const promo = promoStateFromCode(code);
  if (!promo) {
    res.json({ discount: null });
    return;
  }
  res.json({ discount: promo });
});

app.post("/api/admin/promocodes/generate", requireAuth, requireAdmin, (req, res) => {
  const promo = mutateDb((db) => {
    const code = generateTrialPromoCode(db);
    const now = new Date().toISOString();
    const item = {
      id: crypto.randomUUID(),
      code,
      type: "trial_3d",
      description: "3 дня подписки",
      active: true,
      createdBy: req.currentUser.id,
      createdAt: now,
      usedBy: null,
      usedAt: null,
    };
    db.promoCodes.push(item);
    return item;
  });

  res.json({
    ok: true,
    promo: { code: promo.code, type: promo.type, description: promo.description, createdAt: promo.createdAt },
  });
});

app.get("/api/admin/promocodes/inactive", requireAuth, requireAdmin, (req, res) => {
  const db = loadDb();
  const oneTimeRecords = db.promoCodes
    .filter((item) => item.type === "trial_3d" && !item.usedBy && item.active !== false)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .map((item) => ({
      code: item.code,
      gives: item.description || "3 дня подписки",
      createdAt: item.createdAt,
    }));

  const permanentDiscounts = Array.from(DISCOUNT_PROMO_CODES).map((code) => ({
    code,
    gives: `Скидка ${DISCOUNT_PROMO_PERCENT}% (без ограничений по количеству активаций)`,
    permanent: true,
  }));

  permanentDiscounts.push({
    code: YEAR_SPECIAL_PROMO_CODE,
    gives: `Годовой тариф за ${YEAR_SPECIAL_PROMO_PRICE} ₽ (без ограничений по количеству активаций)`,
    permanent: true,
  });

  res.json({
    oneTimeRecords,
    permanentDiscounts,
  });
});

app.get("/api/subscription/status", requireAuth, async (req, res) => {
  const paymentId = String(req.query.paymentId || "");
  const providerPayment = paymentId ? await fetchYooKassaPayment(paymentId) : null;

  const result = mutateDb((db) => {
    const user = db.users.find((item) => item.id === req.session.userId);
    if (!user) {
      return { status: 401, body: { error: "Сессия устарела. Войдите заново." } };
    }

    if (providerPayment?.id) {
      let payment = db.payments.find((item) => item.paymentId === providerPayment.id);
      if (!payment) {
        payment = {
          id: crypto.randomUUID(),
          paymentId: providerPayment.id,
          userId: user.id,
          planId: String(providerPayment?.metadata?.planId || ""),
          status: String(providerPayment.status || "pending"),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.payments.push(payment);
      }
      applyPaymentOutcome(db, payment, {
        status: providerPayment.status,
        planId: providerPayment?.metadata?.planId || payment.planId,
        userId: providerPayment?.metadata?.userId || payment.userId || user.id,
        providerPayload: providerPayment,
      });
    }

    const pendingPayments = db.payments.filter(
      (item) => item.userId === user.id && ["pending", "waiting_for_capture"].includes(String(item.status || "").toLowerCase()),
    ).length;

    const recentPayments = db.payments
      .filter((item) => item.userId === user.id)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, 5)
      .map((item) => ({
        paymentId: item.paymentId,
        planId: item.planId,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

    return {
      status: 200,
      body: {
        subscriptionActive: activeSubscription(user),
        subscriptionUntil: user.subscriptionUntil || null,
        pendingPayments,
        recentPayments,
      },
    };
  });

  if (result.status === 200) {
    const activeDiscountPromoCode = normalizePromoCode(req.session.activeDiscountPromoCode);
    result.body.discount = promoStateFromCode(activeDiscountPromoCode);
  }

  res.status(result.status).json(result.body);
});

app.post("/api/subscription/create-payment", requireAuth, async (req, res) => {
  const planId = String(req.body.planId || "");
  const returnUrl = String(req.body.returnUrl || `${process.env.BASE_URL || "http://localhost:8080"}/?paid=1`);
  const requestPromoCode = normalizePromoCode(req.body.promoCode);
  const sessionPromoCode = normalizePromoCode(req.session.activeDiscountPromoCode);

  const plan = getPlanById(planId);
  if (!plan) {
    res.status(400).json({ error: "Неизвестный тариф." });
    return;
  }

  const effectivePromoCode = requestPromoCode || sessionPromoCode;
  let discountPercent = 0;
  let specialYearPrice = null;
  if (effectivePromoCode) {
    if (isYearSpecialPromoCode(effectivePromoCode)) {
      if (plan.id !== "year") {
        res.status(400).json({ error: "Промокод BSTSUB100FOR1Y действует только на годовой тариф." });
        return;
      }
      specialYearPrice = YEAR_SPECIAL_PROMO_PRICE;
    } else if (isDiscountPromoCode(effectivePromoCode)) {
      discountPercent = DISCOUNT_PROMO_PERCENT;
    } else {
      res.status(400).json({ error: "Промокод не дает скидку на оплату подписки." });
      return;
    }
  }

  const discountedAmount =
    specialYearPrice !== null
      ? Number(specialYearPrice)
      : Number((plan.price * (1 - discountPercent / 100)).toFixed(2));
  const finalAmount = Math.max(1, discountedAmount);

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    res.status(503).json({
      error: "ЮKassa не настроена: добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env",
      provider: "yookassa",
    });
    return;
  }

  try {
    const idempotenceKey = uuidv4();
    const ykResponse = await axios.post(
      "https://api.yookassa.ru/v3/payments",
      {
        amount: {
          value: finalAmount.toFixed(2),
          currency: "RUB",
        },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: returnUrl,
        },
        description:
          specialYearPrice !== null
            ? `Подписка УМКарта: ${plan.title} (спеццена ${YEAR_SPECIAL_PROMO_PRICE} ₽ по промокоду)`
            : `Подписка УМКарта: ${plan.title}${discountPercent ? ` (${discountPercent}% по промокоду)` : ""}`,
        metadata: {
          userId: req.session.userId,
          planId: plan.id,
          promoCode: effectivePromoCode || "",
          discountPercent: String(discountPercent || 0),
          specialYearPrice: specialYearPrice !== null ? String(specialYearPrice) : "",
        },
      },
      {
        auth: { username: shopId, password: secretKey },
        headers: { "Idempotence-Key": idempotenceKey },
        timeout: 12000,
      },
    );

    const paymentId = ykResponse.data.id;
    const confirmationUrl = ykResponse.data?.confirmation?.confirmation_url;

    mutateDb((db) => {
      db.payments.push({
        id: crypto.randomUUID(),
        paymentId,
        userId: req.session.userId,
        planId: plan.id,
        status: "pending",
        amount: Number(finalAmount),
        baseAmount: Number(plan.price),
        discountPercent,
        specialYearPrice,
        promoCode: effectivePromoCode || null,
        currency: "RUB",
        provider: "yookassa",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    res.json({
      paymentId,
      confirmationUrl,
      provider: "yookassa",
      amount: finalAmount,
      baseAmount: plan.price,
      discountPercent,
      specialYearPrice,
      promoCode: effectivePromoCode || null,
    });
  } catch (error) {
    const details = error?.response?.data || String(error.message || error);
    res.status(502).json({ error: "Ошибка создания платежа в ЮKassa", details });
  }
});

app.post("/api/yookassa/webhook", (req, res) => {
  const event = req.body?.event;
  const obj = req.body?.object;
  if (!obj || !obj.id) {
    res.json({ ok: true });
    return;
  }

  const paymentId = obj.id;
  const metadata = obj.metadata || {};
  const metaUserId = String(metadata.userId || "");
  const metaPlanId = String(metadata.planId || "");
  const statusFromObject = String(obj.status || "").toLowerCase();
  const mappedStatus =
    statusFromObject ||
    (event === "payment.succeeded" ? "succeeded" : event === "payment.canceled" ? "canceled" : "pending");

  mutateDb((db) => {
    const payment = db.payments.find((item) => item.paymentId === paymentId);
    if (payment) {
      applyPaymentOutcome(db, payment, {
        status: mappedStatus,
        userId: metaUserId || payment.userId,
        planId: metaPlanId || payment.planId,
        providerPayload: obj,
      });
      return;
    }

    if (metaUserId && metaPlanId) {
      const created = {
        id: crypto.randomUUID(),
        paymentId,
        userId: metaUserId,
        planId: metaPlanId,
        status: "pending",
        provider: "yookassa",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.payments.push(created);
      applyPaymentOutcome(db, created, {
        status: mappedStatus,
        userId: metaUserId,
        planId: metaPlanId,
        providerPayload: obj,
      });
    }
  });

  res.json({ ok: true });
});

app.use((req, res, next) => {
  const blocked = new Set(["/server.js", "/package.json", "/.env", "/.env.example", "/data/app-db.json"]);
  if (blocked.has(req.path)) {
    res.status(404).end();
    return;
  }
  next();
});

app.use(express.static(ROOT));

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "API endpoint not found" });
    return;
  }
  res.sendFile(path.join(ROOT, "index.html"));
});

ensureAdminSeed();

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`УМКарта server running on http://localhost:${port}`);
});
