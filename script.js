const appState = {
  subjects: [],
  subjectId: null,
  gradeId: null,
  paragraphId: null,
  user: null,
  discountPromo: null,
};

const mapViewState = {
  root: null,
  expanded: new Set(),
  activeTarget: null,
  canOpenFullscreen: false,
  panZoom: new WeakMap(),
  lastToggle: {
    path: null,
    action: null,
    stamp: 0,
  },
};

const subjectGrid = document.querySelector("#subjectGrid");
const classSelect = document.querySelector("#classSelect");
const paragraphSelect = document.querySelector("#paragraphSelect");
const mapTitle = document.querySelector("#mapTitle");
const mapMeta = document.querySelector("#mapMeta");
const mapTree = document.querySelector("#mapTree");
const mapTreeFullscreen = document.querySelector("#mapTreeFullscreen");
const openMapFullscreen = document.querySelector("#openMapFullscreen");
const closeMapFullscreen = document.querySelector("#closeMapFullscreen");
const mapFullscreen = document.querySelector("#mapFullscreen");
const mapFullscreenTitle = document.querySelector("#mapFullscreenTitle");
const mapFullscreenMeta = document.querySelector("#mapFullscreenMeta");
const mapAccessBanner = document.querySelector("#mapAccessBanner");
const heroBadge = document.querySelector(".hero__badge");
const heroTitle = document.querySelector("#heroTitle");
const heroDescription = document.querySelector("#heroDescription");
const heroScreenChip = document.querySelector("#heroScreenChip");
const sidebarAuthText = document.querySelector("#sidebarAuthText");
const sidebarAuthExtra = document.querySelector("#sidebarAuthExtra");
const sidebar = document.querySelector(".sidebar");
const mobileMenuButton = document.querySelector("#mobileMenuButton");
const mobileMenuClose = document.querySelector("#mobileMenuClose");
const mobileSidebarBackdrop = document.querySelector("#mobileSidebarBackdrop");
const mobileCurrentScreen = document.querySelector("#mobileCurrentScreen");

const adminMenuButton = document.querySelector("#adminMenuButton");
const adminSubjectSelect = document.querySelector("#adminSubjectSelect");
const adminClassSelect = document.querySelector("#adminClassSelect");
const adminParagraphSelect = document.querySelector("#adminParagraphSelect");
const adminFileInput = document.querySelector("#adminFileInput");
const adminSaveButton = document.querySelector("#adminSaveButton");
const adminClearButton = document.querySelector("#adminClearButton");
const adminAddParagraphButton = document.querySelector("#adminAddParagraphButton");
const adminAddContentButton = document.querySelector("#adminAddContentButton");
const adminAddSummaryButton = document.querySelector("#adminAddSummaryButton");
const adminAddClassButton = document.querySelector("#adminAddClassButton");
const adminNewClassTitle = document.querySelector("#adminNewClassTitle");
const adminStatus = document.querySelector("#adminStatus");
const adminBindingsList = document.querySelector("#adminBindingsList");
const adminClassManagerList = document.querySelector("#adminClassManagerList");
const adminParagraphManagerList = document.querySelector("#adminParagraphManagerList");

const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const authFormsCard = document.querySelector("#authFormsCard");
const authTabLogin = document.querySelector("#authTabLogin");
const authTabRegister = document.querySelector("#authTabRegister");
const authLoginPane = document.querySelector("#authLoginPane");
const authRegisterPane = document.querySelector("#authRegisterPane");
const authStatus = document.querySelector("#authStatus");
const profileSummary = document.querySelector("#profileSummary");
const cabinetStatus = document.querySelector("#cabinetStatus");
const logoutButton = document.querySelector("#logoutButton");
const goToAdminFromCabinet = document.querySelector("#goToAdminFromCabinet");
const pricingStatus = document.querySelector("#pricingStatus");
const yearPlanDiscountLabel = document.querySelector("#yearPlanDiscountLabel");
const yearPlanOldPrice = document.querySelector("#yearPlanOldPrice");
const yearPlanPrice = document.querySelector("#yearPlanPrice");
const promoCodeInput = document.querySelector("#promoCodeInput");
const promoApplyButton = document.querySelector("#promoApplyButton");
const promoStatus = document.querySelector("#promoStatus");
const appModal = document.querySelector("#appModal");
const appModalTitle = document.querySelector("#appModalTitle");
const appModalText = document.querySelector("#appModalText");
const appModalIcon = document.querySelector(".app-modal__icon");
const appModalClose = document.querySelector("#appModalClose");
const appModalAction = document.querySelector("#appModalAction");
const adminGeneratePromoButton = document.querySelector("#adminGeneratePromoButton");
const adminShowPromosButton = document.querySelector("#adminShowPromosButton");
const adminPromoList = document.querySelector("#adminPromoList");
const adminCatalogAccessList = document.querySelector("#adminCatalogAccessList");
const adminTrafficStats = document.querySelector("#adminTrafficStats");
const adminStatsRecentList = document.querySelector("#adminStatsRecentList");
const adminPaidUsersList = document.querySelector("#adminPaidUsersList");
const personalDataConsentLink = document.querySelector("#personalDataConsentLink");
let appModalActionHandler = null;
const screenContentMeta = {
  teacher: {
    title: "Учебники и интеллект-карты",
    description:
      "Выберите предмет, затем класс и параграф. В каждой теме ветви карты можно сворачивать и разворачивать для повторения материала.",
    chip: "Главная",
  },
  student: {
    title: "Подсказки для школьника",
    description: "Короткий и понятный сценарий подготовки: карта, конспект, пересказ и самопроверка.",
    chip: "Школьнику",
  },
  pricing: {
    title: "Тарифы и подписка",
    description: "Выберите подходящий тариф и оплатите в ЮKassa. Доступ включается автоматически.",
    chip: "Тарифы",
  },
  cabinet: {
    title: "Личный кабинет",
    description: "Управляйте аккаунтом, подпиской и промокодами в одном месте.",
    chip: "Личный кабинет",
  },
  admin: {
    title: "Админка",
    description: "Загрузка карт, настройка доступа к предметам и управление промокодами.",
    chip: "Админка",
  },
};
const YEAR_SPECIAL_PROMO_CODE = "BSTSUB100FOR1Y";
const YEAR_SPECIAL_PRICE = 100;
const PERSONAL_DATA_CONSENT_TEXT = [
  "Нажимая «Согласен(а), скачать оферту», вы даете согласие на обработку персональных данных в соответствии с Федеральным законом №152-ФЗ «О персональных данных».",
  "Оператор персональных данных: Акифьева Ирина Вячеславовна, email: UMKarta@mail.ru.",
  "Обрабатываемые данные: email, пароль (в хешированном виде), технические данные сессии/устройства и сведения об оплате.",
  "Цели обработки: регистрация, авторизация, предоставление доступа к платформе, исполнение публичной оферты, прием оплаты, уведомления пользователя и исполнение требований законодательства РФ.",
  "Срок обработки: до достижения целей обработки или до отзыва согласия пользователем.",
  "Отзыв согласия возможен по запросу на email: UMKarta@mail.ru.",
].join("\n\n");
const SELLER_CHECKOUT_ALERT_TEXT = [
  "Перед оплатой ознакомьтесь с данными продавца (из оферты):",
  "Продавец: Акифьева Ирина Вячеславовна.",
  "ИНН: 631224366168.",
  "Оплата подписки означает акцепт условий Публичной оферты.",
].join("\n\n");

mapViewState.activeTarget = mapTree;

init();

async function init() {
  setupMenuTabs();
  setupMobileMenu();
  setupTeacherSelectors();
  setupAdminPanel();
  setupMapFullscreenControls();
  setupAppModal();
  setupAuthPanel();
  setupAuthTabs();
  setupPersonalDataConsentLink();
  setupPromoPanel();
  setupPlanButtons();
  setupMapPanZoomSync();

  await loadCatalog();
  alignCatalogSelection();
  renderSubjects();
  renderClassOptions();
  rebuildAdminSelectors();
  await refreshCurrentUser();
  applyUserStateToUi();
  await refreshPromoState();
  await refreshSubscriptionStatus();

  const params = new URLSearchParams(window.location.search);
  if (params.get("paid") === "1") {
    const lastPaymentId = localStorage.getItem("umkarta_last_payment_id");
    await refreshSubscriptionStatus(lastPaymentId ? { paymentId: lastPaymentId } : undefined);
    pricingStatus.textContent =
      pricingStatus.textContent ||
      "Платеж подтвержден. Проверяем статус подписки по вебхуку ЮKassa, обновление может занять до 10-20 секунд.";
  }
}

function setupAuthTabs() {
  if (!authTabLogin || !authTabRegister || !authLoginPane || !authRegisterPane) return;

  const activatePane = (pane) => {
    const isLogin = pane === "login";
    authTabLogin.classList.toggle("is-active", isLogin);
    authTabRegister.classList.toggle("is-active", !isLogin);
    authTabLogin.setAttribute("aria-selected", isLogin ? "true" : "false");
    authTabRegister.setAttribute("aria-selected", isLogin ? "false" : "true");
    authLoginPane.classList.toggle("is-active", isLogin);
    authRegisterPane.classList.toggle("is-active", !isLogin);
    authLoginPane.hidden = !isLogin;
    authRegisterPane.hidden = isLogin;
    authStatus.textContent = "";
  };

  authTabLogin.addEventListener("click", () => activatePane("login"));
  authTabRegister.addEventListener("click", () => activatePane("register"));
}

function setupMenuTabs() {
  const menuButtons = document.querySelectorAll(".menu__item");
  const panels = document.querySelectorAll(".screen");

  menuButtons.forEach((button) => {
    button.addEventListener("click", () => {
      menuButtons.forEach((btn) => btn.classList.remove("is-active"));
      button.classList.add("is-active");

      const screen = button.dataset.screen;
      panels.forEach((panel) => {
        panel.classList.toggle("is-visible", panel.dataset.screenPanel === screen);
      });

      updateScreenContext(screen);
      closeMobileMenu();
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (screen !== "teacher") {
        closeFullscreenMap();
      }

      if (screen === "admin") {
        renderAdminGradeManager();
        renderAdminBindings();
        renderAdminParagraphManager();
        renderAdminCatalogAccess();
        renderAdminPromos();
        renderAdminStats();
      }
    });
  });

  const initialScreen = document.querySelector(".menu__item.is-active")?.dataset.screen || "teacher";
  updateScreenContext(initialScreen);
}

function setupMobileMenu() {
  if (!mobileMenuButton || !sidebar || !mobileSidebarBackdrop) return;

  const openMenu = () => {
    sidebar.classList.add("is-open");
    mobileSidebarBackdrop.hidden = false;
    document.body.classList.add("menu-open");
  };

  mobileMenuButton.addEventListener("click", openMenu);
  mobileMenuClose?.addEventListener("click", closeMobileMenu);
  mobileSidebarBackdrop.addEventListener("click", closeMobileMenu);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) {
      closeMobileMenu();
    }
  });
}

function closeMobileMenu() {
  if (!sidebar || !mobileSidebarBackdrop) return;
  sidebar.classList.remove("is-open");
  mobileSidebarBackdrop.hidden = true;
  document.body.classList.remove("menu-open");
}

function updateScreenContext(screen) {
  const meta = screenContentMeta[screen] || screenContentMeta.teacher;
  if (heroTitle) heroTitle.textContent = meta.title;
  if (heroDescription) heroDescription.textContent = meta.description;
  if (heroScreenChip) heroScreenChip.textContent = meta.chip;
  if (mobileCurrentScreen) mobileCurrentScreen.textContent = meta.chip;
}

function setupTeacherSelectors() {
  classSelect.addEventListener("change", async () => {
    appState.gradeId = classSelect.value;
    appState.paragraphId = null;
    renderParagraphOptions();
    clearMap();
    await renderMap();
  });

  paragraphSelect.addEventListener("change", async () => {
    appState.paragraphId = paragraphSelect.value;
    await renderMap();
  });
}

function setupMapFullscreenControls() {
  openMapFullscreen.addEventListener("click", () => {
    if (!mapViewState.root || !mapViewState.canOpenFullscreen) return;

    mapFullscreen.hidden = false;
    document.body.style.overflow = "hidden";
    mapFullscreenTitle.textContent = mapTitle.textContent;
    mapFullscreenMeta.textContent = mapMeta.textContent;
    renderMindMap(mapViewState.root, { resetExpanded: false, target: mapTreeFullscreen, resetViewport: true });
  });

  closeMapFullscreen.addEventListener("click", closeFullscreenMap);

  mapFullscreen.addEventListener("click", (event) => {
    if (event.target === mapFullscreen) {
      closeFullscreenMap();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !mapFullscreen.hidden) {
      closeFullscreenMap();
    }
  });
}

function setupMapPanZoomSync() {
  window.addEventListener("resize", () => {
    syncMapViewport(mapTree);
    syncMapViewport(mapTreeFullscreen);
  });
}

function setupAuthPanel() {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.querySelector("#loginEmail").value.trim();
    const password = document.querySelector("#loginPassword").value;

    const response = await apiJson("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });

    if (!response.ok) {
      const message = response.data?.error || "Не удалось войти.";
      authStatus.textContent = message;
      showAppModal(message, {
        title: "Ошибка входа",
        icon: "⚠️",
        actionText: "Понятно",
      });
      return;
    }

    authStatus.textContent = "Вы успешно вошли.";
    showAppModal("Вы успешно вошли в личный кабинет.", {
      title: "Вход выполнен",
      icon: "✅",
      actionText: "Продолжить",
    });
    await refreshCurrentUser();
    if (loginForm) loginForm.reset();
    if (registerForm) registerForm.reset();
    applyUserStateToUi();
    await refreshPromoState();
    await refreshSubscriptionStatus();
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.querySelector("#registerEmail").value.trim();
    const password = document.querySelector("#registerPassword").value;

    const response = await apiJson("/api/auth/register", {
      method: "POST",
      body: { email, password },
    });

    if (!response.ok) {
      const message = response.data?.error || "Не удалось зарегистрироваться.";
      authStatus.textContent = message;
      showAppModal(message, {
        title: "Ошибка регистрации",
        icon: "⚠️",
        actionText: "Понятно",
      });
      return;
    }

    authStatus.textContent = "Регистрация завершена. Вам доступны первые 3 карты бесплатно.";
    showAppModal("Регистрация завершена. Вам доступны первые 3 карты бесплатно.", {
      title: "Аккаунт создан",
      icon: "🎉",
      actionText: "Продолжить",
    });
    if (authTabLogin?.click) authTabLogin.click();
    await refreshCurrentUser();
    if (loginForm) loginForm.reset();
    if (registerForm) registerForm.reset();
    applyUserStateToUi();
    await refreshPromoState();
    await refreshSubscriptionStatus();
  });

  logoutButton.addEventListener("click", async () => {
    await apiJson("/api/auth/logout", { method: "POST" });
    await refreshCurrentUser();
    appState.discountPromo = null;
    if (promoStatus) promoStatus.textContent = "";
    if (promoCodeInput) promoCodeInput.value = "";
    applyUserStateToUi();
    await refreshPromoState();
    await refreshSubscriptionStatus();
    authStatus.textContent = "Вы вышли из аккаунта.";
    showAppModal("Вы вышли из личного кабинета.", {
      title: "Выход выполнен",
      icon: "👋",
      actionText: "Хорошо",
    });
  });

  goToAdminFromCabinet.addEventListener("click", () => {
    openScreen("admin");
  });
}

function setupPersonalDataConsentLink() {
  if (!personalDataConsentLink) return;
  personalDataConsentLink.addEventListener("click", (event) => {
    event.preventDefault();
    showAppModal(PERSONAL_DATA_CONSENT_TEXT, {
      title: "Согласие на обработку персональных данных",
      icon: "⚖️",
      actionText: "Понятно",
    });
  });
}

function setupPlanButtons() {
  document.querySelectorAll(".plan-buy-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const planId = button.dataset.planId;
      await startSubscription(planId, button);
    });
  });
}

function setupPromoPanel() {
  if (promoApplyButton) {
    promoApplyButton.addEventListener("click", async () => {
      if (!appState.user) {
        showAppModal("Сначала войдите в личный кабинет, чтобы применить промокод.");
        openScreen("cabinet");
        return;
      }

      const rawCode = promoCodeInput?.value || "";
      const code = String(rawCode).trim();
      if (!code) {
        if (promoStatus) promoStatus.textContent = "Введите промокод.";
        return;
      }

      if (promoStatus) promoStatus.textContent = "Проверяю промокод...";
      const response = await apiJson("/api/promocodes/apply", {
        method: "POST",
        body: { code },
      });

      if (!response.ok) {
        if (promoStatus) promoStatus.textContent = response.data?.error || "Не удалось применить промокод.";
        return;
      }

      if (response.data?.type === "discount") {
        appState.discountPromo = response.data.discount || null;
      }
      if (response.data?.type === "year_special") {
        appState.discountPromo = response.data.discount || null;
        showAppModal("Годовой план снижен до 100 ₽ по промокоду BSTSUB100FOR1Y.", {
          title: "Спецпредложение активировано",
          icon: "🔥",
          actionText: "Отлично",
        });
      }

      await refreshCurrentUser();
      await refreshPromoState();
      applyUserStateToUi();

      if (promoCodeInput) promoCodeInput.value = "";
      if (promoStatus) promoStatus.textContent = response.data?.message || "Промокод применен.";
    });
  }

  if (adminGeneratePromoButton) {
    adminGeneratePromoButton.addEventListener("click", async () => {
      if (!isAdmin()) {
        adminStatus.textContent = "Доступ в админку только у администратора.";
        return;
      }

      const response = await apiJson("/api/admin/promocodes/generate", { method: "POST", body: {} });
      if (!response.ok) {
        adminStatus.textContent = response.data?.error || "Не удалось сгенерировать промокод.";
        return;
      }

      const promo = response.data?.promo;
      adminStatus.textContent = promo?.code
        ? `Промокод создан: ${promo.code} (дает 3 дня подписки).`
        : "Промокод создан.";
      await renderAdminPromos();
    });
  }

  if (adminShowPromosButton) {
    adminShowPromosButton.addEventListener("click", async () => {
      await renderAdminPromos();
    });
  }
}

async function startSubscription(planId, sourceButton, options = {}) {
  if (!appState.user) {
    showAppModal("Для оформления подписки нужно войти или зарегистрироваться.");
    pricingStatus.textContent = "";
    cabinetStatus.textContent = "Для оформления подписки нужно войти или зарегистрироваться.";
    openScreen("cabinet");
    return;
  }

  if (!options.skipSellerInfo) {
    showAppModal(SELLER_CHECKOUT_ALERT_TEXT, {
      title: "Данные продавца перед оплатой",
      icon: "🧾",
      actionText: "Перейти к оплате",
      onAction: () => {
        void startSubscription(planId, sourceButton, { skipSellerInfo: true });
      },
    });
    return;
  }

  sourceButton.disabled = true;
  const response = await apiJson("/api/subscription/create-payment", {
    method: "POST",
    body: {
      planId,
      returnUrl: `${window.location.origin}/?paid=1`,
      promoCode: appState.discountPromo?.code || "",
    },
  });
  sourceButton.disabled = false;

  if (!response.ok) {
    const msg = response.data?.error || "Не удалось создать платеж.";
    pricingStatus.textContent = msg;
    cabinetStatus.textContent = msg;
    return;
  }

  if (response.data?.paymentId) {
    localStorage.setItem("umkarta_last_payment_id", response.data.paymentId);
  }

  const discountMeta =
    response.data?.specialYearPrice
      ? ` Годовой тариф по коду ${response.data.promoCode}: ${response.data.specialYearPrice} ₽.`
      : response.data?.discountPercent > 0
        ? ` Скидка ${response.data.discountPercent}% по коду ${response.data.promoCode}.`
        : "";
  pricingStatus.textContent = `Переходим в ЮKassa для оплаты.${discountMeta} После оплаты статус обновится автоматически по вебхуку.`;
  cabinetStatus.textContent = pricingStatus.textContent;

  const url = response.data?.confirmationUrl;
  if (url) {
    window.location.href = url;
    return;
  }

  const msg = "Платеж создан, но отсутствует ссылка подтверждения.";
  pricingStatus.textContent = msg;
  cabinetStatus.textContent = msg;
}

function setupAppModal() {
  if (!appModal) return;

  const closeModal = () => {
    appModal.hidden = true;
    document.body.style.overflow = "";
    appModalActionHandler = null;
  };

  appModalClose?.addEventListener("click", closeModal);
  appModalAction?.addEventListener("click", () => {
    const handler = appModalActionHandler;
    closeModal();
    if (typeof handler === "function") {
      handler();
    }
  });

  appModal.addEventListener("click", (event) => {
    if (event.target === appModal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !appModal.hidden) {
      closeModal();
    }
  });
}

function showAppModal(text, options = {}) {
  if (!appModal || !appModalText) return;
  if (appModalTitle) {
    appModalTitle.textContent = String(options.title || "Нужен вход в аккаунт");
  }
  if (appModalIcon) {
    appModalIcon.textContent = String(options.icon || "🔒");
  }
  if (appModalAction) {
    appModalAction.textContent = String(options.actionText || "Понятно");
  }
  appModalActionHandler = typeof options.onAction === "function" ? options.onAction : null;
  appModalText.textContent = String(text || "Для продолжения нужно войти в личный кабинет.");
  appModal.hidden = false;
  document.body.style.overflow = "hidden";
}

async function refreshCurrentUser() {
  const response = await apiJson("/api/auth/me", { method: "GET" });
  appState.user = response.ok ? response.data?.user || null : null;
  appState.discountPromo = response.ok ? response.data?.discountPromo || null : null;
}

async function refreshPromoState() {
  if (!appState.user) {
    appState.discountPromo = null;
    if (promoStatus) promoStatus.textContent = "";
    return;
  }

  const response = await apiJson("/api/promocodes/me", { method: "GET" });
  if (response.ok) {
    appState.discountPromo = response.data?.discount || null;
  }
}

function promoStatusText(promo) {
  if (!promo) return "";
  if (promo.type === "year_special") {
    return `Активен спецпромокод ${promo.code}: годовой тариф ${promo.yearPrice || YEAR_SPECIAL_PRICE} ₽.`;
  }
  if (promo.code && promo.percent) {
    return `Активна скидка ${promo.percent}% по коду ${promo.code}.`;
  }
  return "";
}

function applyPricingPromoState(promo) {
  if (!yearPlanDiscountLabel || !yearPlanOldPrice || !yearPlanPrice) return;

  if (promo?.type === "year_special") {
    yearPlanDiscountLabel.textContent = "СПЕЦПРЕДЛОЖЕНИЕ";
    yearPlanOldPrice.textContent = "3 840 ₽";
    yearPlanPrice.textContent = `${promo.yearPrice || YEAR_SPECIAL_PRICE} ₽`;
    return;
  }

  yearPlanDiscountLabel.textContent = "-20% ЭКОНОМИЯ";
  yearPlanOldPrice.textContent = "4 800 ₽ (400x12)";
  yearPlanPrice.textContent = "3 840 ₽";
}

function applyUserStateToUi() {
  const user = appState.user;
  const isAdmin = Boolean(user && user.role === "admin");

  adminMenuButton.hidden = !isAdmin;
  goToAdminFromCabinet.hidden = !isAdmin;
  logoutButton.hidden = !user;

  if (!user) {
    if (authFormsCard) authFormsCard.hidden = false;
    if (authTabLogin && authTabRegister && authLoginPane && authRegisterPane) {
      authTabLogin.classList.add("is-active");
      authTabRegister.classList.remove("is-active");
      authTabLogin.setAttribute("aria-selected", "true");
      authTabRegister.setAttribute("aria-selected", "false");
      authLoginPane.hidden = false;
      authRegisterPane.hidden = true;
      authLoginPane.classList.add("is-active");
      authRegisterPane.classList.remove("is-active");
    }
    sidebarAuthText.textContent = "Гость. Для просмотра карт нужна регистрация.";
    sidebarAuthExtra.textContent = "";
    heroBadge.textContent = "Первые 3 карты бесплатно после регистрации";
    profileSummary.innerHTML = "<p>Вы не авторизованы.</p>";
    pricingStatus.textContent = "";
    cabinetStatus.textContent = "";
    if (promoApplyButton) promoApplyButton.disabled = false;
    if (promoCodeInput) promoCodeInput.disabled = false;
    if (promoStatus) promoStatus.textContent = "";
    applyPricingPromoState(null);

    if (document.querySelector('.menu__item.is-active')?.dataset.screen === "admin") {
      openScreen("cabinet");
    }
    renderMap();
    return;
  }

  if (authFormsCard) authFormsCard.hidden = true;
  sidebarAuthText.textContent = user.subscriptionActive
    ? `Активная подписка до ${formatDate(user.subscriptionUntil)}.`
    : `Бесплатно доступно: ${user.freeMapsLeft} из 3 карт.`;
  sidebarAuthExtra.textContent = user.subscriptionActive
    ? "Полный доступ ко всем ментальным картам."
    : "После исчерпания бесплатного лимита нужен любой платный тариф.";

  heroBadge.textContent = user.subscriptionActive
    ? "Подписка активна"
    : `Осталось бесплатно: ${user.freeMapsLeft} карты`;

  profileSummary.innerHTML = `
    <p><b>Email:</b> ${escapeHtml(user.email)}</p>
    <p><b>Роль:</b> ${user.role === "admin" ? "Администратор" : "Пользователь"}</p>
    <p><b>Подписка:</b> ${
      user.subscriptionActive ? `активна до ${formatDate(user.subscriptionUntil)}` : "не активна"
    }</p>
    <p><b>Бесплатный лимит:</b> ${user.freeMapsLeft} карты(карт) осталось</p>
  `;

  if (promoApplyButton) promoApplyButton.disabled = false;
  if (promoCodeInput) promoCodeInput.disabled = false;
  if (promoStatus) promoStatus.textContent = promoStatusText(appState.discountPromo);
  applyPricingPromoState(appState.discountPromo);

  renderMap();
}

async function refreshSubscriptionStatus(options = {}) {
  if (!appState.user) return;

  const query = new URLSearchParams();
  if (options.paymentId) {
    query.set("paymentId", String(options.paymentId));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await apiJson(`/api/subscription/status${suffix}`, { method: "GET" });
  if (!response.ok) return;

  const status = response.data || {};
  appState.discountPromo = status.discount || appState.discountPromo || null;

  if (promoStatus) promoStatus.textContent = promoStatusText(appState.discountPromo);
  applyPricingPromoState(appState.discountPromo);

  if (status.subscriptionActive && status.subscriptionUntil) {
    const msg = `Подписка активна до ${formatDate(status.subscriptionUntil)}.`;
    pricingStatus.textContent = msg;
    cabinetStatus.textContent = msg;
    sidebarAuthText.textContent = msg;
    sidebarAuthExtra.textContent = "Оплаченный доступ активен для всех предметов и классов.";
    return;
  }

  if (status.pendingPayments > 0) {
    const msg = "Платеж создан и ожидает подтверждения/вебхука ЮKassa. Обновите страницу через 10-20 секунд.";
    pricingStatus.textContent = msg;
    cabinetStatus.textContent = msg;
    sidebarAuthExtra.textContent = "Оплата в обработке: статус обновится автоматически после вебхука ЮKassa.";
    return;
  }
}

async function loadCatalog() {
  const response = await apiJson("/api/catalog", { method: "GET" });
  if (response.ok && Array.isArray(response.data?.subjects)) {
    appState.subjects = response.data.subjects;
    return;
  }

  appState.subjects = [
    {
      id: "history",
      title: "История",
      planned: false,
      grades: {
        "5": { title: "История Древнего мира", paragraphs: createParagraphs("История", 5, 18) },
      },
    },
    { id: "biology", title: "Биология", planned: true },
    { id: "geography", title: "География", planned: true },
    { id: "physics", title: "Физика", planned: true },
    { id: "chemistry", title: "Химия", planned: true },
  ];
}

function alignCatalogSelection() {
  const firstOpenSubject = appState.subjects.find((subject) => !subject.planned);
  if (!appState.subjectId) {
    appState.subjectId = firstOpenSubject?.id || null;
  }

  const currentSubject = getCurrentSubject();
  if (!currentSubject || currentSubject.planned) {
    appState.subjectId = firstOpenSubject?.id || null;
    appState.gradeId = null;
    appState.paragraphId = null;
    return;
  }

  const grades = currentSubject.grades || {};
  if (!appState.gradeId || !grades[appState.gradeId]) {
    appState.gradeId = null;
    appState.paragraphId = null;
    return;
  }

  const paragraphs = grades[appState.gradeId]?.paragraphs || [];
  if (!appState.paragraphId || !paragraphs.some((paragraph) => paragraph.id === appState.paragraphId)) {
    appState.paragraphId = null;
  }
}

function renderSubjects() {
  subjectGrid.innerHTML = "";

  appState.subjects.forEach((subject) => {
    const card = document.createElement("article");
    card.className = "subject-card";
    if (subject.planned) card.classList.add("is-planned");
    if (appState.subjectId === subject.id) card.classList.add("is-active");

    card.innerHTML = `
      <h3>${escapeHtml(subject.title)}</h3>
      <p>${subject.planned ? "Закрыто" : "Доступно"}</p>
    `;

    card.addEventListener("click", () => {
      if (subject.planned) return;
      appState.subjectId = subject.id;
      appState.gradeId = null;
      appState.paragraphId = null;
      renderSubjects();
      renderClassOptions();
      clearMap();
    });

    subjectGrid.appendChild(card);
  });
}

function renderClassOptions() {
  const subject = getCurrentSubject();

  classSelect.innerHTML = "";
  paragraphSelect.innerHTML = "";

  if (!subject) {
    classSelect.disabled = true;
    classSelect.innerHTML = "<option>Сначала выберите предмет</option>";
    paragraphSelect.disabled = true;
    paragraphSelect.innerHTML = "<option>Сначала выберите класс</option>";
    return;
  }

  classSelect.disabled = false;
  classSelect.append(new Option("Выберите класс", ""));

  Object.entries(subject.grades || {}).forEach(([gradeId, grade]) => {
    classSelect.append(new Option(formatGradeOptionLabel(gradeId, grade), gradeId));
  });

  paragraphSelect.disabled = true;
  paragraphSelect.append(new Option("Сначала выберите класс", ""));
}

function renderParagraphOptions() {
  const grade = getCurrentGrade();
  paragraphSelect.innerHTML = "";

  if (!grade) {
    paragraphSelect.disabled = true;
    paragraphSelect.append(new Option("Сначала выберите класс", ""));
    return;
  }

  paragraphSelect.disabled = false;
  paragraphSelect.append(new Option("Выберите параграф", ""));

  grade.paragraphs.forEach((paragraph) => {
    paragraphSelect.append(new Option(paragraph.title, paragraph.id));
  });
}

async function renderMap() {
  const paragraph = getCurrentParagraph();
  if (!paragraph) {
    clearMap();
    return;
  }

  mapTitle.textContent = paragraph.title;

  if (!appState.user) {
    mapMeta.textContent = "Для просмотра карты войдите в личный кабинет.";
    setMapAccessBanner("Просмотр ментальных карт доступен только после регистрации и входа.", false);
    showMapPlaceholder("", { cabinetLink: true });
    setFullscreenAvailability(false);
    return;
  }

  const url = `/api/maps/resolve?subjectId=${encodeURIComponent(appState.subjectId)}&gradeId=${encodeURIComponent(
    appState.gradeId,
  )}&paragraphId=${encodeURIComponent(appState.paragraphId)}`;

  const response = await apiJson(url, { method: "GET" });

  if (response.ok) {
    const payload = response.data;
    const map = payload.map;
    mapMeta.textContent = `Источник: ${payload.sourceName} · Ветвей: ${countNodes(map)} · Колесо: масштаб, ЛКМ: перемещение`;

    const freeLeft = payload.access?.freeLeft;
    if (appState.user.subscriptionActive) {
      setMapAccessBanner(`Подписка активна до ${formatDate(appState.user.subscriptionUntil)}. Полный доступ открыт.`, false);
    } else if (typeof freeLeft === "number") {
      setMapAccessBanner(`Бесплатный лимит: осталось ${freeLeft} карты(карт).`, false);
    } else {
      setMapAccessBanner("", true);
    }

    renderMindMap(map, { resetExpanded: true, target: mapTree, resetViewport: true });
    setFullscreenAvailability(true);
    return;
  }

  if (response.status === 401) {
    await refreshCurrentUser();
    applyUserStateToUi();
    setMapAccessBanner(response.data?.error || "Нужно войти в личный кабинет.", false);
    showMapPlaceholder("", { cabinetLink: true });
    return;
  }

  if (response.status === 402) {
    mapMeta.textContent = "Бесплатный лимит исчерпан";
    setMapAccessBanner(response.data?.error || "Оформите подписку, чтобы продолжить.", false);
    showMapPlaceholder("Лимит бесплатных карт исчерпан. Перейдите в раздел «Тарифы».");
    setFullscreenAvailability(false);
    return;
  }

  if (response.status === 404) {
    mapMeta.textContent = response.data?.error || "Карта не найдена";
    setMapAccessBanner("", true);
    showMapPlaceholder("Для этого параграфа карта пока не добавлена в админке.");
    setFullscreenAvailability(false);
    return;
  }

  mapMeta.textContent = "Ошибка загрузки карты";
  setMapAccessBanner(response.data?.error || "Произошла ошибка.", false);
  showMapPlaceholder("Не удалось загрузить карту. Попробуйте позже.");
  setFullscreenAvailability(false);
}

function clearMap() {
  mapTitle.textContent = "Выберите параграф";
  mapMeta.textContent = "Карта появится здесь";
  mapViewState.root = null;
  mapViewState.expanded.clear();
  setMapAccessBanner("", true);
  setFullscreenAvailability(false);
  clearMapViewport(mapTree);
  clearMapViewport(mapTreeFullscreen);
  closeFullscreenMap();
  showMapPlaceholder("Выберите предмет, класс и параграф.");
}

function showMapPlaceholder(text, options = {}) {
  clearMapViewport(mapTree);
  const box = document.createElement("div");
  box.className = "map-placeholder";

  if (options.cabinetLink) {
    const before = document.createTextNode("Войдите в ");
    const link = document.createElement("a");
    link.href = "#";
    link.className = "map-placeholder__link";
    link.textContent = "личный кабинет";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openScreen("cabinet");
      const loginEmail = document.querySelector("#loginEmail");
      loginEmail?.focus();
    });
    const after = document.createTextNode(" чтобы открыть карту.");
    box.append(before, link, after);
  } else {
    box.textContent = String(text || "");
  }

  mapTree.innerHTML = "";
  mapTree.appendChild(box);
}

function setMapAccessBanner(text, hidden) {
  if (hidden || !text) {
    mapAccessBanner.hidden = true;
    mapAccessBanner.textContent = "";
    return;
  }
  mapAccessBanner.hidden = false;
  mapAccessBanner.textContent = text;
}

function setFullscreenAvailability(enabled) {
  mapViewState.canOpenFullscreen = Boolean(enabled);
  openMapFullscreen.disabled = !enabled;
}

function closeFullscreenMap() {
  if (mapFullscreen.hidden) return;
  mapFullscreen.hidden = true;
  document.body.style.overflow = "";
  clearMapViewport(mapTreeFullscreen);
  mapTreeFullscreen.innerHTML = "";
  if (mapViewState.root) {
    renderMindMap(mapViewState.root, { resetExpanded: false, target: mapTree, resetViewport: false });
  }
}

function setupAdminPanel() {
  adminSubjectSelect.addEventListener("change", () => {
    renderAdminClassOptions();
    renderAdminParagraphOptions();
    renderAdminBindings();
    renderAdminGradeManager();
    renderAdminParagraphManager();
    renderAdminStats();
  });

  adminClassSelect.addEventListener("change", () => {
    renderAdminParagraphOptions();
    renderAdminBindings();
    renderAdminGradeManager();
    renderAdminParagraphManager();
    renderAdminStats();
  });

  adminSaveButton.addEventListener("click", async () => {
    if (!isAdmin()) {
      adminStatus.textContent = "Доступ в админку только у администратора.";
      return;
    }

    const selectedParagraphIds = getSelectedParagraphIds();
    const file = adminFileInput.files?.[0];

    if (!selectedParagraphIds.length) {
      adminStatus.textContent = "Выберите минимум один параграф.";
      return;
    }

    if (!file) {
      adminStatus.textContent = "Добавьте файл карты.";
      return;
    }

    try {
      adminStatus.textContent = "Обрабатываю файл и формирую структуру карты...";
      const parsed = await parseUploadFile(file);
      adminStatus.textContent = "Сохраняю карту. Если включен AI, это может занять до 30-60 секунд...";
      const response = await apiJson("/api/admin/maps", {
        method: "POST",
        body: {
          subjectId: adminSubjectSelect.value,
          gradeId: adminClassSelect.value,
          paragraphIds: selectedParagraphIds,
          sourceName: file.name,
          importFormat: parsed.format,
          rawText: parsed.rawText || null,
          pdfPreviewDataUrl: parsed.pdfPreviewDataUrl || null,
          preserveText: Boolean(parsed.preserveText),
          map: parsed.map,
        },
      });

      if (!response.ok) {
        adminStatus.textContent = response.data?.error || "Ошибка сохранения карты.";
        return;
      }

      adminFileInput.value = "";
      const aiMeta = response.data?.ai;
      if (aiMeta?.used) {
        const ocrNote = aiMeta?.ocrUsed ? " (PDF OCR + AI)" : "";
        adminStatus.textContent = `Карта привязана к ${selectedParagraphIds.length} параграфам. Название параграфа обновлено по имени файла: «${response.data?.paragraphTitle || file.name}». AI-обработка (${aiMeta.provider}, ${aiMeta.model}) применена${ocrNote}.`;
      } else if (aiMeta?.preserveText) {
        const ocrNote = aiMeta?.ocrUsed ? " (PDF OCR)" : "";
        adminStatus.textContent = `Карта привязана к ${selectedParagraphIds.length} параграфам. Название параграфа обновлено по имени файла: «${response.data?.paragraphTitle || file.name}». Режим без изменения текста${ocrNote}.`;
      } else if (aiMeta?.enabled && aiMeta?.error) {
        const ocrNote = aiMeta?.ocrUsed ? " OCR выполнен, но AI не собрал структуру." : "";
        adminStatus.textContent = `Карта привязана к ${selectedParagraphIds.length} параграфам. Название параграфа обновлено по имени файла: «${response.data?.paragraphTitle || file.name}». AI недоступен: ${aiMeta.error}.${ocrNote} Использована исходная структура.`;
      } else {
        adminStatus.textContent = `Карта привязана к ${selectedParagraphIds.length} параграфам. Название параграфа обновлено по имени файла: «${response.data?.paragraphTitle || file.name}».`;
      }
      await reloadCatalogAndUiState();
      await renderAdminBindings();
      await renderAdminParagraphManager();

      if (
        appState.subjectId === adminSubjectSelect.value &&
        appState.gradeId === adminClassSelect.value &&
        selectedParagraphIds.includes(appState.paragraphId)
      ) {
        await renderMap();
      }
    } catch (error) {
      adminStatus.textContent = String(error.message || error);
    }
  });

  adminClearButton.addEventListener("click", async () => {
    if (!isAdmin()) {
      adminStatus.textContent = "Доступ в админку только у администратора.";
      return;
    }

    const selectedParagraphIds = getSelectedParagraphIds();
    if (!selectedParagraphIds.length) {
      adminStatus.textContent = "Выберите параграфы для удаления карт.";
      return;
    }

    const response = await apiJson("/api/admin/maps", {
      method: "DELETE",
      body: {
        subjectId: adminSubjectSelect.value,
        gradeId: adminClassSelect.value,
        paragraphIds: selectedParagraphIds,
      },
    });

    if (!response.ok) {
      adminStatus.textContent = response.data?.error || "Не удалось удалить карты.";
      return;
    }

    adminStatus.textContent = `Удалено привязок: ${response.data?.removed ?? 0}`;
    await renderAdminBindings();
    await renderAdminParagraphManager();

    if (
      appState.subjectId === adminSubjectSelect.value &&
      appState.gradeId === adminClassSelect.value &&
      selectedParagraphIds.includes(appState.paragraphId)
    ) {
      await renderMap();
    }
  });

  adminAddParagraphButton?.addEventListener("click", async () => {
    await handleParagraphAdminAction("add");
  });

  adminAddContentButton?.addEventListener("click", async () => {
    await handleParagraphAdminAction("add_content");
  });

  adminAddSummaryButton?.addEventListener("click", async () => {
    await handleParagraphAdminAction("add_summary");
  });

  adminAddClassButton?.addEventListener("click", async () => {
    const title = String(adminNewClassTitle?.value || "").trim();
    const ok = await handleGradeAdminAction("add", { title });
    if (ok && adminNewClassTitle) adminNewClassTitle.value = "";
  });
}

function rebuildAdminSelectors() {
  const adminSubjects = appState.subjects.filter((subject) => Boolean(subject.grades));
  const current = adminSubjectSelect.value;
  adminSubjectSelect.innerHTML = "";

  adminSubjects.forEach((subject) => {
    const suffix = subject.planned ? " (закрыт)" : "";
    adminSubjectSelect.append(new Option(`${subject.title}${suffix}`, subject.id));
  });

  if (adminSubjects.some((subject) => subject.id === current)) {
    adminSubjectSelect.value = current;
  } else if (adminSubjects.length) {
    adminSubjectSelect.value = adminSubjects[0].id;
  }

  renderAdminClassOptions();
  renderAdminParagraphOptions();
}

function renderAdminClassOptions() {
  const subject = getAdminSubject();
  const current = adminClassSelect.value;
  adminClassSelect.innerHTML = "";

  if (!subject || !subject.grades) {
    return;
  }

  Object.entries(subject.grades).forEach(([gradeId, grade]) => {
    adminClassSelect.append(new Option(formatGradeOptionLabel(gradeId, grade), gradeId));
  });

  if (current && subject.grades[current]) {
    adminClassSelect.value = current;
  }
}

function renderAdminParagraphOptions() {
  const grade = getAdminGrade();
  adminParagraphSelect.innerHTML = "";

  if (!grade) {
    return;
  }

  grade.paragraphs.forEach((paragraph) => {
    adminParagraphSelect.append(new Option(paragraph.title, paragraph.id));
  });
}

async function renderAdminBindings() {
  if (!isAdmin()) {
    adminBindingsList.innerHTML = "<li>Для просмотра привязок нужен аккаунт администратора.</li>";
    return;
  }

  const subjectId = adminSubjectSelect.value;
  const gradeId = adminClassSelect.value;
  if (!subjectId || !gradeId) {
    adminBindingsList.innerHTML = "<li>Выберите предмет и класс.</li>";
    return;
  }

  const response = await apiJson(
    `/api/admin/maps?subjectId=${encodeURIComponent(subjectId)}&gradeId=${encodeURIComponent(gradeId)}`,
    { method: "GET" },
  );

  if (!response.ok) {
    adminBindingsList.innerHTML = `<li>${escapeHtml(response.data?.error || "Не удалось загрузить привязки.")}</li>`;
    return;
  }

  const records = response.data?.records || [];
  if (!records.length) {
    adminBindingsList.innerHTML = "<li>Для этого класса пока нет загруженных карт.</li>";
    return;
  }

  adminBindingsList.innerHTML = "";
  records
    .sort((a, b) => String(a.paragraphId).localeCompare(String(b.paragraphId), "ru"))
    .forEach((record) => {
      const li = document.createElement("li");
      li.textContent = `${record.paragraphId} — ${record.sourceName} — обновлено ${formatDateTime(record.updatedAt)}`;
      adminBindingsList.appendChild(li);
    });
}

async function handleGradeAdminAction(action, payload = {}) {
  if (!isAdmin()) {
    adminStatus.textContent = "Доступ в админку только у администратора.";
    return false;
  }

  const subjectId = adminSubjectSelect.value;
  if (!subjectId) {
    adminStatus.textContent = "Выберите предмет.";
    return false;
  }

  const response = await apiJson("/api/admin/grades", {
    method: "POST",
    body: {
      subjectId,
      action,
      ...payload,
    },
  });

  if (!response.ok) {
    adminStatus.textContent = response.data?.error || "Не удалось изменить структуру классов.";
    return false;
  }

  await reloadCatalogAndUiState();
  await renderAdminGradeManager();
  await renderAdminParagraphManager();
  await renderAdminBindings();
  adminStatus.textContent = "Структура классов обновлена.";
  return true;
}

async function renderAdminGradeManager() {
  if (!adminClassManagerList) return;

  if (!isAdmin()) {
    adminClassManagerList.innerHTML = "<li>Для управления нужен аккаунт администратора.</li>";
    return;
  }

  const subjectId = adminSubjectSelect.value;
  if (!subjectId) {
    adminClassManagerList.innerHTML = "<li>Выберите предмет.</li>";
    return;
  }

  const response = await apiJson(`/api/admin/grades?subjectId=${encodeURIComponent(subjectId)}`, { method: "GET" });
  if (!response.ok) {
    adminClassManagerList.innerHTML = `<li>${escapeHtml(response.data?.error || "Не удалось загрузить классы.")}</li>`;
    return;
  }

  const grades = Array.isArray(response.data?.grades) ? response.data.grades : [];
  if (!grades.length) {
    adminClassManagerList.innerHTML = "<li>Классы отсутствуют.</li>";
    return;
  }

  adminClassManagerList.innerHTML = "";
  grades.forEach((grade, index) => {
    const li = document.createElement("li");
    li.className = "admin-grade-item";

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 220;
    input.value = grade.title || "";
    input.className = "admin-grade-item__input";

    const meta = document.createElement("p");
    meta.className = "admin-grade-item__meta";
    meta.textContent = `ID: ${grade.id} · параграфов: ${grade.paragraphCount ?? 0}`;

    const controls = document.createElement("div");
    controls.className = "admin-grade-item__controls";

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = "Сохранить";
    saveButton.addEventListener("click", async () => {
      const title = String(input.value || "").trim();
      await handleGradeAdminAction("rename", { gradeId: grade.id, title });
    });

    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.textContent = "↑";
    upButton.disabled = index === 0;
    upButton.addEventListener("click", async () => {
      await handleGradeAdminAction("move_up", { gradeId: grade.id });
    });

    const downButton = document.createElement("button");
    downButton.type = "button";
    downButton.textContent = "↓";
    downButton.disabled = index === grades.length - 1;
    downButton.addEventListener("click", async () => {
      await handleGradeAdminAction("move_down", { gradeId: grade.id });
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Удалить класс";
    deleteButton.className = "danger";
    deleteButton.addEventListener("click", async () => {
      await handleGradeAdminAction("delete", { gradeId: grade.id });
    });

    controls.append(saveButton, upButton, downButton, deleteButton);
    li.append(input, meta, controls);
    adminClassManagerList.appendChild(li);
  });
}

async function handleParagraphAdminAction(action, payload = {}) {
  if (!isAdmin()) {
    adminStatus.textContent = "Доступ в админку только у администратора.";
    return false;
  }

  const subjectId = adminSubjectSelect.value;
  const gradeId = adminClassSelect.value;
  if (!subjectId || !gradeId) {
    adminStatus.textContent = "Выберите предмет и класс.";
    return false;
  }

  const response = await apiJson("/api/admin/paragraphs", {
    method: "POST",
    body: {
      subjectId,
      gradeId,
      action,
      ...payload,
    },
  });

  if (!response.ok) {
    adminStatus.textContent = response.data?.error || "Не удалось изменить структуру параграфов.";
    return false;
  }

  await reloadCatalogAndUiState();
  await renderAdminGradeManager();
  await renderAdminBindings();
  await renderAdminParagraphManager();
  adminStatus.textContent = "Структура параграфов обновлена.";
  return true;
}

async function renderAdminParagraphManager() {
  if (!adminParagraphManagerList) return;

  if (!isAdmin()) {
    adminParagraphManagerList.innerHTML = "<li>Для управления нужен аккаунт администратора.</li>";
    return;
  }

  const subjectId = adminSubjectSelect.value;
  const gradeId = adminClassSelect.value;
  if (!subjectId || !gradeId) {
    adminParagraphManagerList.innerHTML = "<li>Выберите предмет и класс.</li>";
    return;
  }

  const [paragraphsRes, mapsRes] = await Promise.all([
    apiJson(`/api/admin/paragraphs?subjectId=${encodeURIComponent(subjectId)}&gradeId=${encodeURIComponent(gradeId)}`, {
      method: "GET",
    }),
    apiJson(`/api/admin/maps?subjectId=${encodeURIComponent(subjectId)}&gradeId=${encodeURIComponent(gradeId)}`, {
      method: "GET",
    }),
  ]);

  if (!paragraphsRes.ok) {
    adminParagraphManagerList.innerHTML = `<li>${escapeHtml(paragraphsRes.data?.error || "Не удалось загрузить параграфы.")}</li>`;
    return;
  }

  const paragraphs = Array.isArray(paragraphsRes.data?.paragraphs) ? paragraphsRes.data.paragraphs : [];
  const mapParagraphs = new Set(
    Array.isArray(mapsRes.data?.records) ? mapsRes.data.records.map((item) => String(item.paragraphId || "")) : [],
  );

  if (!paragraphs.length) {
    adminParagraphManagerList.innerHTML = "<li>Параграфы отсутствуют. Добавьте новую главу.</li>";
    return;
  }

  adminParagraphManagerList.innerHTML = "";
  paragraphs.forEach((paragraph, index) => {
    const li = document.createElement("li");
    li.className = "admin-paragraph-item";

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 220;
    input.value = paragraph.title || "";
    input.className = "admin-paragraph-item__input";

    const controls = document.createElement("div");
    controls.className = "admin-paragraph-item__controls";

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = "Сохранить";
    saveButton.addEventListener("click", async () => {
      const title = String(input.value || "").trim();
      await handleParagraphAdminAction("rename", { paragraphId: paragraph.id, title });
    });

    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.textContent = "↑";
    upButton.disabled = index === 0;
    upButton.addEventListener("click", async () => {
      await handleParagraphAdminAction("move_up", { paragraphId: paragraph.id });
    });

    const downButton = document.createElement("button");
    downButton.type = "button";
    downButton.textContent = "↓";
    downButton.disabled = index === paragraphs.length - 1;
    downButton.addEventListener("click", async () => {
      await handleParagraphAdminAction("move_down", { paragraphId: paragraph.id });
    });

    const removeMapButton = document.createElement("button");
    removeMapButton.type = "button";
    removeMapButton.textContent = "Удалить карту";
    removeMapButton.disabled = !mapParagraphs.has(String(paragraph.id || ""));
    removeMapButton.addEventListener("click", async () => {
      await handleParagraphAdminAction("delete_map", { paragraphId: paragraph.id });
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Удалить главу";
    deleteButton.className = "danger";
    deleteButton.addEventListener("click", async () => {
      await handleParagraphAdminAction("delete", { paragraphId: paragraph.id });
    });

    controls.append(saveButton, upButton, downButton, removeMapButton, deleteButton);
    li.append(input, controls);
    adminParagraphManagerList.appendChild(li);
  });
}

async function renderAdminPromos() {
  if (!adminPromoList) return;

  if (!isAdmin()) {
    adminPromoList.innerHTML = "<li>Для просмотра промокодов нужен аккаунт администратора.</li>";
    return;
  }

  const response = await apiJson("/api/admin/promocodes/inactive", { method: "GET" });
  if (!response.ok) {
    adminPromoList.innerHTML = `<li>${escapeHtml(response.data?.error || "Не удалось загрузить промокоды.")}</li>`;
    return;
  }

  const oneTimeRecords = Array.isArray(response.data?.oneTimeRecords) ? response.data.oneTimeRecords : [];
  const permanentDiscounts = Array.isArray(response.data?.permanentDiscounts) ? response.data.permanentDiscounts : [];

  const items = [
    ...oneTimeRecords.map((item) => ({
      text: `${item.code} — ${item.gives} — создан ${formatDateTime(item.createdAt)}`,
    })),
    ...permanentDiscounts.map((item) => ({
      text: `${item.code} — ${item.gives}`,
    })),
  ];

  if (!items.length) {
    adminPromoList.innerHTML = "<li>Нет доступных промокодов.</li>";
    return;
  }

  adminPromoList.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item.text;
    adminPromoList.appendChild(li);
  });
}

async function renderAdminCatalogAccess() {
  if (!adminCatalogAccessList) return;

  if (!isAdmin()) {
    adminCatalogAccessList.innerHTML = "<li>Для управления доступом нужен аккаунт администратора.</li>";
    return;
  }

  const response = await apiJson("/api/admin/catalog-access", { method: "GET" });
  if (!response.ok) {
    adminCatalogAccessList.innerHTML = `<li>${escapeHtml(response.data?.error || "Не удалось загрузить доступ к каталогу.")}</li>`;
    return;
  }

  const subjects = Array.isArray(response.data?.subjects) ? response.data.subjects : [];
  if (!subjects.length) {
    adminCatalogAccessList.innerHTML = "<li>Предметы не найдены.</li>";
    return;
  }

  adminCatalogAccessList.innerHTML = "";
  subjects.forEach((subject) => {
    const li = document.createElement("li");
    li.className = "admin-catalog-access-item";

    const label = document.createElement("span");
    const status = subject.enabled ? "открыт" : "закрыт";
    const extra = subject.hasGrades ? "" : " (классы еще не добавлены)";
    label.innerHTML = `<b>${escapeHtml(subject.title)}</b> — ${status}${extra}`;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "admin-catalog-access-toggle";
    button.textContent = subject.enabled ? "Закрыть" : "Открыть";
    button.addEventListener("click", async () => {
      button.disabled = true;
      const updateResponse = await apiJson("/api/admin/catalog-access", {
        method: "POST",
        body: {
          subjectId: subject.id,
          enabled: !subject.enabled,
        },
      });
      button.disabled = false;

      if (!updateResponse.ok) {
        adminStatus.textContent = updateResponse.data?.error || "Не удалось изменить доступ к предмету.";
        return;
      }

      adminStatus.textContent = `Предмет «${subject.title}» ${!subject.enabled ? "открыт" : "закрыт"}.`;
      await loadCatalog();
      alignCatalogSelection();
      renderSubjects();
      renderClassOptions();
      renderParagraphOptions();
      await renderMap();
      rebuildAdminSelectors();
      await renderAdminCatalogAccess();
    });

    li.append(label, button);
    adminCatalogAccessList.appendChild(li);
  });
}

async function reloadCatalogAndUiState() {
  const prevSubjectId = appState.subjectId;
  const prevGradeId = appState.gradeId;
  const prevParagraphId = appState.paragraphId;

  await loadCatalog();
  alignCatalogSelection();

  if (prevSubjectId) appState.subjectId = prevSubjectId;
  const currentSubject = getCurrentSubject();
  if (currentSubject?.grades && prevGradeId && currentSubject.grades[prevGradeId]) {
    appState.gradeId = prevGradeId;
  } else if (!currentSubject?.grades?.[appState.gradeId]) {
    appState.gradeId = null;
  }

  const currentGrade = getCurrentGrade();
  if (currentGrade?.paragraphs?.some((item) => item.id === prevParagraphId)) {
    appState.paragraphId = prevParagraphId;
  } else if (!currentGrade?.paragraphs?.some((item) => item.id === appState.paragraphId)) {
    appState.paragraphId = null;
  }

  renderSubjects();
  renderClassOptions();
  if (appState.gradeId) {
    classSelect.value = appState.gradeId;
    renderParagraphOptions();
  }
  if (appState.paragraphId) {
    paragraphSelect.value = appState.paragraphId;
  }

  rebuildAdminSelectors();
  await renderMap();
}

async function renderAdminStats() {
  if (!adminTrafficStats || !adminPaidUsersList || !adminStatsRecentList) return;

  if (!isAdmin()) {
    adminTrafficStats.innerHTML = "";
    adminStatsRecentList.innerHTML = "<li>Для просмотра статистики нужен аккаунт администратора.</li>";
    adminPaidUsersList.innerHTML = "<li>Для просмотра нужен аккаунт администратора.</li>";
    return;
  }

  const response = await apiJson("/api/admin/stats", { method: "GET" });
  if (!response.ok) {
    const errorText = escapeHtml(response.data?.error || "Не удалось загрузить статистику.");
    adminTrafficStats.innerHTML = `<article class="stats-card"><p>Ошибка</p><strong>—</strong></article>`;
    adminStatsRecentList.innerHTML = `<li>${errorText}</li>`;
    adminPaidUsersList.innerHTML = `<li>${errorText}</li>`;
    return;
  }

  const counts = response.data?.counts || {};
  const cards = [
    { label: "Всего переходов", value: counts.total ?? 0 },
    { label: "Обычная ссылка", value: counts.direct ?? 0 },
    { label: "enter=tg", value: counts.tg ?? 0 },
    { label: "enter=vk", value: counts.vk ?? 0 },
    { label: "enter=another", value: counts.another ?? 0 },
  ];

  adminTrafficStats.innerHTML = "";
  cards.forEach((item) => {
    const card = document.createElement("article");
    card.className = "stats-card";
    card.innerHTML = `<p>${escapeHtml(item.label)}</p><strong>${Number(item.value) || 0}</strong>`;
    adminTrafficStats.appendChild(card);
  });

  const recent = Array.isArray(response.data?.recent) ? response.data.recent : [];
  adminStatsRecentList.innerHTML = "";
  if (!recent.length) {
    adminStatsRecentList.innerHTML = "<li>Пока нет зафиксированных переходов.</li>";
  } else {
    recent.slice(0, 20).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${formatDateTime(item.at)} — ${item.source}`;
      adminStatsRecentList.appendChild(li);
    });
  }

  const paidSubscribers = Array.isArray(response.data?.paidSubscribers) ? response.data.paidSubscribers : [];
  adminPaidUsersList.innerHTML = "";
  if (!paidSubscribers.length) {
    adminPaidUsersList.innerHTML = "<li>Нет активных оплаченных подписок.</li>";
    return;
  }

  paidSubscribers.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML =
      `<b>${escapeHtml(item.email || "")}</b> — ${escapeHtml(item.planTitle || "Не определен")} ` +
      `— до ${formatDate(item.subscriptionUntil)}`;
    adminPaidUsersList.appendChild(li);
  });
}

function getSelectedParagraphIds() {
  return Array.from(adminParagraphSelect.selectedOptions).map((option) => option.value);
}

function formatGradeOptionLabel(gradeId, grade) {
  const title = String(grade?.title || "").trim();
  if (!title) return `${gradeId} класс`;
  if (/класс/i.test(title)) return title;
  return `${gradeId} класс · ${title}`;
}

function getCurrentSubject() {
  return appState.subjects.find((subject) => subject.id === appState.subjectId) || null;
}

function getCurrentGrade() {
  const subject = getCurrentSubject();
  if (!subject || !appState.gradeId) return null;
  return subject.grades?.[appState.gradeId] || null;
}

function getCurrentParagraph() {
  const grade = getCurrentGrade();
  if (!grade || !appState.paragraphId) return null;
  return grade.paragraphs.find((paragraph) => paragraph.id === appState.paragraphId) || null;
}

function getAdminSubject() {
  return appState.subjects.find((subject) => subject.id === adminSubjectSelect.value) || null;
}

function getAdminGrade() {
  const subject = getAdminSubject();
  if (!subject) return null;
  return subject.grades?.[adminClassSelect.value] || null;
}

function isAdmin() {
  return Boolean(appState.user && appState.user.role === "admin");
}

function openScreen(screen) {
  const targetButton = Array.from(document.querySelectorAll(".menu__item")).find(
    (item) => item.dataset.screen === screen,
  );
  targetButton?.click();
}

async function apiJson(url, options = {}) {
  const fetchOptions = {
    method: options.method || "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, status: 0, data: { error: String(error.message || error) } };
  }
}

function renderMindMap(rootNode, options = {}) {
  const target = options.target || mapTree;
  if (!rootNode) {
    clearMapViewport(target);
    target.innerHTML = "";
    return;
  }

  const { resetExpanded = false, resetViewport = false } = options;
  mapViewState.root = rootNode;
  mapViewState.activeTarget = target;

  if (resetExpanded) {
    mapViewState.expanded.clear();
  }

  const layout = buildMindMapLayout(rootNode);
  const { entries, links, canvasWidth, canvasHeight } = layout;
  const now = Date.now();
  const toggleMeta = mapViewState.lastToggle;
  const shouldAnimate =
    toggleMeta &&
    toggleMeta.path &&
    toggleMeta.action === "expand" &&
    now - Number(toggleMeta.stamp || 0) < 700;

  target.innerHTML = "";
  const stage = document.createElement("div");
  stage.className = "mindmap-stage";

  const viewport = document.createElement("div");
  viewport.className = "mindmap-viewport";

  const canvas = document.createElement("div");
  canvas.className = "mindmap-canvas";
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "mindmap-svg");
  svg.setAttribute("width", String(canvasWidth));
  svg.setAttribute("height", String(canvasHeight));

  const nodesLayer = document.createElement("div");
  nodesLayer.className = "mindmap-nodes";

  const byPath = new Map(entries.map((entry) => [entry.path, entry]));
  links.forEach((link) => {
    const parent = byPath.get(link.parentPath);
    const child = byPath.get(link.childPath);
    if (!parent) return;
    if (!child) return;

    const curve = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const fromX = link.side === "right" ? parent.x + parent.width + 2 : parent.x - 2;
    const fromY = parent.centerY;
    const toX = link.side === "right" ? child.x - 2 : child.x + child.width + 2;
    const toY = child.centerY;
    const control = Math.max(48, Math.min(230, Math.abs(toX - fromX) * 0.44));

    const d =
      link.side === "right"
        ? `M ${fromX} ${fromY} C ${fromX + control} ${fromY}, ${toX - control} ${toY}, ${toX} ${toY}`
        : `M ${fromX} ${fromY} C ${fromX - control} ${fromY}, ${toX + control} ${toY}, ${toX} ${toY}`;

    curve.setAttribute(
      "d",
      d,
    );
    const linkClasses = [`mindmap-link`, `branch-color-${link.colorIndex % 8}`];
    if (shouldAnimate && link.childPath.startsWith(`${toggleMeta.path}.`)) {
      linkClasses.push("is-enter");
    }
    curve.setAttribute("class", linkClasses.join(" "));
    if (shouldAnimate && link.childPath.startsWith(`${toggleMeta.path}.`)) {
      curve.style.setProperty("--enter-delay", `${Math.min(240, child.depth * 30)}ms`);
    }
    svg.appendChild(curve);
  });

  entries.forEach((entry) => {
    const clickable = entry.path !== "0" && entry.hasChildren;
    const node = document.createElement(clickable ? "button" : "div");
    if (clickable) node.type = "button";

    const classes = ["mind-node", `depth-${Math.min(entry.depth, 4)}`];
    if (entry.path === "0") {
      classes.push("is-root");
    } else {
      classes.push("branch-node", `side-${entry.side}`, `branch-color-${entry.colorIndex % 8}`);
      if (!entry.hasChildren) classes.push("is-leaf");
      if (shouldAnimate && entry.path.startsWith(`${toggleMeta.path}.`)) {
        classes.push("is-enter");
      }
    }

    node.className = classes.join(" ");
    node.style.left = `${entry.x}px`;
    node.style.top = `${entry.y}px`;
    node.style.width = `${entry.width}px`;
    node.style.height = `${entry.height}px`;
    if (shouldAnimate && entry.path.startsWith(`${toggleMeta.path}.`)) {
      node.style.setProperty("--enter-delay", `${Math.min(260, entry.depth * 34)}ms`);
    }

    const label = document.createElement("span");
    label.className = "mind-node__label";
    if (entry.path === "0") {
      const rootCard = getRootCardContent(entry.node);
      label.classList.add("mind-node__label--root");
      label.textContent = rootCard.title;
      node.appendChild(label);

      rootCard.lines.forEach((line, index) => {
        const meta = document.createElement("div");
        meta.className = `mind-root-line ${index === 0 ? "is-lead" : ""}`;
        meta.textContent = line;
        node.appendChild(meta);
      });
    } else {
      const title = cleanupNodeText(entry.node.title || "Без названия");
      label.textContent = title;
      node.appendChild(label);
    }
    nodesLayer.appendChild(node);

    if (clickable) {
      node.addEventListener("click", () => toggleMindMapNode(entry.path));

      const toggle = document.createElement("button");
      toggle.type = "button";
      const toggleClasses = ["mind-toggle", entry.expanded ? "is-open" : ""];
      if (toggleMeta?.path === entry.path && now - Number(toggleMeta.stamp || 0) < 700) {
        toggleClasses.push("is-focus");
      }
      toggle.className = toggleClasses.filter(Boolean).join(" ");
      toggle.style.left = `${entry.side === "right" ? entry.x + entry.width + 8 : entry.x - 22}px`;
      toggle.style.top = `${entry.centerY - 9}px`;
      toggle.textContent = entry.expanded ? (entry.side === "right" ? "‹" : "›") : entry.side === "right" ? "›" : "‹";
      toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleMindMapNode(entry.path);
      });
      nodesLayer.appendChild(toggle);
    }
  });

  canvas.appendChild(svg);
  canvas.appendChild(nodesLayer);
  viewport.appendChild(canvas);
  stage.appendChild(viewport);
  target.appendChild(stage);

  const panState = ensureMapViewportState(target);
  panState.viewport = viewport;
  panState.canvasWidth = canvasWidth;
  panState.canvasHeight = canvasHeight;

  buildMapControls(target, panState);

  if (resetViewport || !panState.initialized) {
    fitMapViewport(target, panState);
    panState.initialized = true;
  } else {
    clampMapViewport(target, panState);
    applyMapViewport(target, panState);
  }
}

function toggleMindMapNode(path) {
  if (path === "0") return;
  if (mapViewState.expanded.has(path)) {
    const prefix = `${path}.`;
    Array.from(mapViewState.expanded).forEach((openedPath) => {
      if (openedPath === path || openedPath.startsWith(prefix)) {
        mapViewState.expanded.delete(openedPath);
      }
    });
    mapViewState.lastToggle = {
      path,
      action: "collapse",
      stamp: Date.now(),
    };
  } else {
    mapViewState.expanded.add(path);
    mapViewState.lastToggle = {
      path,
      action: "expand",
      stamp: Date.now(),
    };
  }

  renderMindMap(mapViewState.root, {
    resetExpanded: false,
    resetViewport: false,
    target: mapViewState.activeTarget || mapTree,
  });
}

function ensureMapViewportState(target) {
  let state = mapViewState.panZoom.get(target);
  if (state) {
    return state;
  }

  state = {
    scale: 1,
    translateX: 18,
    translateY: 18,
    minScale: 0.34,
    maxScale: 2.7,
    isDragging: false,
    dragPointerId: null,
    dragStartClientX: 0,
    dragStartClientY: 0,
    dragStartX: 0,
    dragStartY: 0,
    viewport: null,
    canvasWidth: 0,
    canvasHeight: 0,
    initialized: false,
    controls: null,
    listenersBound: false,
  };

  mapViewState.panZoom.set(target, state);
  bindMapViewportListeners(target, state);
  return state;
}

function bindMapViewportListeners(target, state) {
  if (state.listenersBound) return;
  state.listenersBound = true;

  target.addEventListener("pointerdown", (event) => {
    if (!state.viewport) return;
    if (event.button !== 0) return;
    if (event.target.closest(".mind-node, .mind-toggle, .mindmap-controls button")) return;

    state.isDragging = true;
    state.dragPointerId = event.pointerId;
    state.dragStartClientX = event.clientX;
    state.dragStartClientY = event.clientY;
    state.dragStartX = state.translateX;
    state.dragStartY = state.translateY;
    target.classList.add("is-panning");
    target.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  target.addEventListener("pointermove", (event) => {
    if (!state.isDragging || state.dragPointerId !== event.pointerId) return;
    const dx = event.clientX - state.dragStartClientX;
    const dy = event.clientY - state.dragStartClientY;
    state.translateX = state.dragStartX + dx;
    state.translateY = state.dragStartY + dy;
    clampMapViewport(target, state);
    applyMapViewport(target, state);
  });

  const finishDrag = (event) => {
    if (!state.isDragging) return;
    if (event.pointerId !== undefined && state.dragPointerId !== event.pointerId) return;
    if (state.dragPointerId !== null && target.hasPointerCapture(state.dragPointerId)) {
      target.releasePointerCapture(state.dragPointerId);
    }
    state.isDragging = false;
    state.dragPointerId = null;
    target.classList.remove("is-panning");
  };

  target.addEventListener("pointerup", finishDrag);
  target.addEventListener("pointercancel", finishDrag);
  target.addEventListener("pointerleave", (event) => {
    if (!state.isDragging) return;
    if (event.buttons === 0) finishDrag(event);
  });

  target.addEventListener(
    "wheel",
    (event) => {
      if (!state.viewport) return;
      event.preventDefault();
      const zoomFactor = event.deltaY < 0 ? 1.12 : 0.9;
      zoomMapViewportAtClientPoint(target, state, event.clientX, event.clientY, zoomFactor);
    },
    { passive: false },
  );
}

function buildMapControls(target, state) {
  if (state.controls?.parentElement === target) {
    state.controls.remove();
    state.controls = null;
  }

  const controls = document.createElement("div");
  controls.className = "mindmap-controls";
  controls.innerHTML = `
    <button type="button" data-action="in" title="Приблизить">+</button>
    <button type="button" data-action="out" title="Отдалить">-</button>
    <button type="button" data-action="reset" title="Сброс">100%</button>
    <button type="button" data-action="expand-all" title="Развернуть все ветви">++</button>
    <button type="button" data-action="collapse-all" title="Свернуть до первого уровня">--</button>
  `;

  controls.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || !state.viewport) return;
    const action = button.dataset.action;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    if (action === "in") {
      zoomMapViewportAtClientPoint(target, state, centerX, centerY, 1.15);
      return;
    }
    if (action === "out") {
      zoomMapViewportAtClientPoint(target, state, centerX, centerY, 0.87);
      return;
    }
    if (action === "expand-all") {
      const paths = collectExpandablePaths(mapViewState.root);
      mapViewState.expanded = new Set(paths.filter((path) => path !== "0"));
      mapViewState.lastToggle = {
        path: "0",
        action: "expand",
        stamp: Date.now(),
      };
      renderMindMap(mapViewState.root, {
        resetExpanded: false,
        resetViewport: false,
        target: mapViewState.activeTarget || mapTree,
      });
      return;
    }
    if (action === "collapse-all") {
      mapViewState.expanded.clear();
      mapViewState.lastToggle = {
        path: "0",
        action: "collapse",
        stamp: Date.now(),
      };
      renderMindMap(mapViewState.root, {
        resetExpanded: false,
        resetViewport: false,
        target: mapViewState.activeTarget || mapTree,
      });
      return;
    }
    fitMapViewport(target, state);
  });

  state.controls = controls;
  target.appendChild(controls);
}

function collectExpandablePaths(node, path = "0", acc = []) {
  if (!node || typeof node !== "object") return acc;
  if (Array.isArray(node.children) && node.children.length) {
    acc.push(path);
    node.children.forEach((child, index) => {
      collectExpandablePaths(child, `${path}.${index}`, acc);
    });
  }
  return acc;
}

function fitMapViewport(target, state) {
  if (!state.viewport) return;
  const viewportWidth = target.clientWidth || 900;
  const viewportHeight = target.clientHeight || 500;
  const desiredWidth = viewportWidth - 96;
  const desiredHeight = viewportHeight - 96;
  const widthScale = desiredWidth > 0 ? desiredWidth / state.canvasWidth : 1;
  const heightScale = desiredHeight > 0 ? desiredHeight / state.canvasHeight : 1;
  const fitScale = Math.min(1, Math.max(state.minScale, Math.min(widthScale, heightScale)));
  state.scale = Math.min(state.maxScale, fitScale);
  const contentWidth = state.canvasWidth * state.scale;
  const contentHeight = state.canvasHeight * state.scale;
  state.translateX = contentWidth + 64 < viewportWidth ? (viewportWidth - contentWidth) / 2 : 24;
  state.translateY = contentHeight + 64 < viewportHeight ? (viewportHeight - contentHeight) / 2 : 24;
  clampMapViewport(target, state);
  applyMapViewport(target, state);
}

function zoomMapViewportAtClientPoint(target, state, clientX, clientY, zoomFactor) {
  if (!state.viewport) return;
  const rect = target.getBoundingClientRect();
  const anchorX = clientX - rect.left;
  const anchorY = clientY - rect.top;
  const prevScale = state.scale;
  const nextScale = clampNumber(prevScale * zoomFactor, state.minScale, state.maxScale);
  if (Math.abs(nextScale - prevScale) < 0.0001) return;

  const worldX = (anchorX - state.translateX) / prevScale;
  const worldY = (anchorY - state.translateY) / prevScale;

  state.scale = nextScale;
  state.translateX = anchorX - worldX * nextScale;
  state.translateY = anchorY - worldY * nextScale;
  clampMapViewport(target, state);
  applyMapViewport(target, state);
}

function clampMapViewport(target, state) {
  if (!state.viewport) return;
  const viewportWidth = target.clientWidth || 900;
  const viewportHeight = target.clientHeight || 500;
  const contentWidth = state.canvasWidth * state.scale;
  const contentHeight = state.canvasHeight * state.scale;
  const margin = 90;

  let minX = viewportWidth - contentWidth - margin;
  let maxX = margin;
  let minY = viewportHeight - contentHeight - margin;
  let maxY = margin;

  if (contentWidth <= viewportWidth) {
    minX = maxX = (viewportWidth - contentWidth) / 2;
  }
  if (contentHeight <= viewportHeight) {
    minY = maxY = (viewportHeight - contentHeight) / 2;
  }

  state.translateX = clampNumber(state.translateX, minX, maxX);
  state.translateY = clampNumber(state.translateY, minY, maxY);
}

function applyMapViewport(target, state) {
  if (!state.viewport) return;
  state.viewport.style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
  target.style.cursor = state.isDragging ? "grabbing" : "grab";
}

function clearMapViewport(target) {
  const state = mapViewState.panZoom.get(target);
  if (!state) return;
  state.isDragging = false;
  state.dragPointerId = null;
  state.viewport = null;
  state.controls = null;
  target.classList.remove("is-panning");
  target.style.cursor = "";
}

function syncMapViewport(target) {
  const state = mapViewState.panZoom.get(target);
  if (!state || !state.viewport) return;
  clampMapViewport(target, state);
  applyMapViewport(target, state);
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildMindMapLayout(rootNode) {
  const entries = [];
  const entriesByPath = new Map();
  const links = [];
  const boxes = new Map();
  const heights = new Map();
  const rowsGap = 42;
  const depthGap = 210;
  const rootGap = 210;
  const nodeTextOffset = 0;

  const rootPath = "0";
  const rootChildren = Array.isArray(rootNode.children) ? rootNode.children : [];
  const indexedChildren = rootChildren.map((child, index) => ({
    child,
    index,
    path: `${rootPath}.${index}`,
    colorIndex: index,
    sideHint: child?.side === "left" || child?.side === "right" ? child.side : null,
  }));

  let rightChildren = indexedChildren.filter((item) => item.sideHint === "right");
  let leftChildren = indexedChildren.filter((item) => item.sideHint === "left");
  const neutralChildren = indexedChildren.filter((item) => !item.sideHint);
  neutralChildren.forEach((item, idx) => {
    if (idx % 2 === 0) rightChildren.push(item);
    else leftChildren.push(item);
  });
  if (!leftChildren.length && rightChildren.length > 1) {
    leftChildren = rightChildren.splice(Math.ceil(rightChildren.length / 2));
  }

  const rootBox = estimateNodeBox(rootNode, 0, true);
  boxes.set(rootPath, rootBox);
  heights.set(rootPath, rootBox.height);

  const sideHeight = (items, side) => {
    const childHeights = items.map((item) => computeSubtreeHeight(item.child, item.path, 1, side, boxes, heights, rowsGap));
    if (!childHeights.length) return 0;
    return childHeights.reduce((sum, value) => sum + value, 0) + rowsGap * (childHeights.length - 1);
  };

  const rightTotal = sideHeight(rightChildren, "right");
  const leftTotal = sideHeight(leftChildren, "left");

  const rootEntry = {
    path: rootPath,
    parentPath: null,
    node: rootNode,
    depth: 0,
    side: "center",
    colorIndex: 0,
    x: -rootBox.width / 2,
    y: -rootBox.height / 2,
    width: rootBox.width,
    height: rootBox.height,
    centerX: 0,
    centerY: 0,
    hasChildren: rootChildren.length > 0,
    expanded: true,
  };
  entries.push(rootEntry);
  entriesByPath.set(rootPath, rootEntry);

  const placeSide = (items, side, totalHeight) => {
    if (!items.length) return;
    let currentTop = -totalHeight / 2;
    items.forEach((item) => {
      placeSubtree(
        item.child,
        item.path,
        rootPath,
        1,
        side,
        item.colorIndex,
        currentTop,
        { entries, entriesByPath, links, boxes, heights, rowsGap, depthGap, rootGap, rootBox, nodeTextOffset },
      );
      currentTop += heights.get(item.path) + rowsGap;
    });
  };

  placeSide(rightChildren, "right", rightTotal);
  placeSide(leftChildren, "left", leftTotal);

  const minX = Math.min(...entries.map((entry) => entry.x));
  const minY = Math.min(...entries.map((entry) => entry.y));
  const maxX = Math.max(...entries.map((entry) => entry.x + entry.width));
  const maxY = Math.max(...entries.map((entry) => entry.y + entry.height));
  const padding = 170;

  const shiftX = padding - minX;
  const shiftY = padding - minY;

  entries.forEach((entry) => {
    entry.x += shiftX;
    entry.y += shiftY;
    entry.centerX = entry.x + entry.width / 2;
    entry.centerY = entry.y + entry.height / 2;
  });

  return {
    entries,
    links,
    canvasWidth: Math.max(1000, Math.ceil(maxX - minX + padding * 2)),
    canvasHeight: Math.max(620, Math.ceil(maxY - minY + padding * 2)),
  };
}

function computeSubtreeHeight(node, path, depth, side, boxes, heights, rowsGap) {
  const box = estimateNodeBox(node, depth, false);
  boxes.set(path, box);

  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const expanded = isExpanded(path, depth, hasChildren);
  if (!hasChildren || !expanded) {
    heights.set(path, box.height);
    return box.height;
  }

  const childHeights = node.children.map((child, index) =>
    computeSubtreeHeight(child, `${path}.${index}`, depth + 1, side, boxes, heights, rowsGap),
  );

  const childrenStackHeight =
    childHeights.reduce((sum, value) => sum + value, 0) + rowsGap * Math.max(0, childHeights.length - 1);
  const total = Math.max(box.height, childrenStackHeight);
  heights.set(path, total);
  return total;
}

function placeSubtree(node, path, parentPath, depth, side, colorIndex, top, layout) {
  const { entries, entriesByPath, links, boxes, heights, rowsGap, depthGap, rootGap, rootBox, nodeTextOffset } = layout;
  const box = boxes.get(path);
  const totalHeight = heights.get(path);
  const y = top + (totalHeight - box.height) / 2;
  const parentEntry = entriesByPath.get(parentPath) || entriesByPath.get("0");
  const hopGap = depth === 1 ? rootGap : depthGap;
  const x =
    side === "right"
      ? parentEntry.x + parentEntry.width + hopGap + nodeTextOffset
      : parentEntry.x - hopGap - nodeTextOffset - box.width;

  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const expanded = isExpanded(path, depth, hasChildren);

  const entry = {
    path,
    parentPath,
    node,
    depth,
    side,
    colorIndex,
    x,
    y,
    width: box.width,
    height: box.height,
    centerX: x + box.width / 2,
    centerY: y + box.height / 2,
    hasChildren,
    expanded,
  };
  entries.push(entry);
  entriesByPath.set(path, entry);

  links.push({ parentPath, childPath: path, side, colorIndex });

  if (!hasChildren || !expanded) return;

  const childHeights = node.children.map((_, index) => heights.get(`${path}.${index}`));
  const childrenTotal =
    childHeights.reduce((sum, value) => sum + value, 0) + rowsGap * Math.max(0, childHeights.length - 1);

  let currentTop = top + (totalHeight - childrenTotal) / 2;
  node.children.forEach((child, index) => {
    const childPath = `${path}.${index}`;
    placeSubtree(child, childPath, path, depth + 1, side, colorIndex, currentTop, layout);
    currentTop += heights.get(childPath) + rowsGap;
  });
}

const NODE_TEXT_MEASURE_CONTEXT = document.createElement("canvas").getContext("2d");

function getNodeTypography(depth) {
  if (depth <= 1) {
    return {
      fontSize: 20,
      lineHeight: 1.22,
      paddingX: 18,
      paddingY: 12,
      minWidth: 220,
      maxWidth: 620,
      maxTextWidth: 520,
    };
  }

  if (depth === 2) {
    return {
      fontSize: 17,
      lineHeight: 1.22,
      paddingX: 16,
      paddingY: 10,
      minWidth: 190,
      maxWidth: 560,
      maxTextWidth: 440,
    };
  }

  return {
    fontSize: 16,
    lineHeight: 1.24,
    paddingX: 14,
    paddingY: 9,
    minWidth: 160,
    maxWidth: 520,
    maxTextWidth: 410,
  };
}

function measureTextPx(text, font) {
  if (!NODE_TEXT_MEASURE_CONTEXT) {
    return String(text || "").length * 8;
  }
  NODE_TEXT_MEASURE_CONTEXT.font = font;
  return NODE_TEXT_MEASURE_CONTEXT.measureText(String(text || "")).width;
}

function splitTokenToFit(token, maxWidth, font) {
  const value = String(token || "");
  if (!value) return [];
  if (measureTextPx(value, font) <= maxWidth) return [value];

  const chunks = [];
  let chunk = "";
  for (const char of value) {
    const candidate = `${chunk}${char}`;
    if (chunk && measureTextPx(candidate, font) > maxWidth) {
      chunks.push(chunk);
      chunk = char;
    } else {
      chunk = candidate;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks.length ? chunks : [value];
}

function wrapTextLinesPx(text, maxWidth, font) {
  const source = String(text || "").trim();
  if (!source) return [""];

  const tokens = source.split(/\s+/).filter(Boolean);
  const normalizedTokens = [];
  tokens.forEach((token) => {
    normalizedTokens.push(...splitTokenToFit(token, maxWidth, font));
  });

  const lines = [];
  let current = "";
  normalizedTokens.forEach((token) => {
    const candidate = current ? `${current} ${token}` : token;
    if (current && measureTextPx(candidate, font) > maxWidth) {
      lines.push(current);
      current = token;
    } else {
      current = candidate;
    }
  });

  if (current) lines.push(current);
  return lines.length ? lines : [source];
}

function estimateNodeBox(node, depth, isRoot = false) {
  const title = cleanupNodeText(node.title || "Без названия");
  if (isRoot || depth === 0) {
    const rootCard = getRootCardContent(node);
    const titleLines = Math.max(1, Math.ceil(rootCard.title.length / 42));
    const metaLines = rootCard.lines.reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / 58)), 0);
    const lines = Math.max(3, Math.min(16, titleLines + metaLines));
    return {
      width: Math.max(520, Math.min(780, Math.round(rootCard.title.length * 4.6) + 360)),
      height: Math.max(180, lines * 23 + 60),
    };
  }

  const typography = getNodeTypography(depth);
  const font = `700 ${typography.fontSize}px "Manrope", sans-serif`;
  const lines = wrapTextLinesPx(title, typography.maxTextWidth, font);
  const longest = lines.reduce((max, line) => Math.max(max, measureTextPx(line, font)), 0);
  const hasChildren = Array.isArray(node?.children) && node.children.length > 0;
  const connectorGutter = hasChildren ? 26 : 16;
  const width = clampNumber(
    Math.ceil(longest + typography.paddingX * 2 + connectorGutter + 14),
    typography.minWidth,
    typography.maxWidth,
  );
  const height = Math.ceil(lines.length * typography.fontSize * typography.lineHeight + typography.paddingY * 2 + 4);
  return { width, height };
}

function isExpanded(path, depth, hasChildren) {
  if (!hasChildren) return false;
  if (depth === 0) return true;
  return mapViewState.expanded.has(path);
}

function getRootCardContent(node) {
  const title = cleanupNodeText(node?.title || "Без названия");
  const lines = [];

  if (typeof node?.description === "string" && node.description.trim()) {
    lines.push(cleanupNodeText(node.description).slice(0, 260));
  }

  if (Array.isArray(node?.details)) {
    node.details
      .map((item) => cleanupNodeText(item))
      .filter(Boolean)
      .slice(0, 8)
      .forEach((item) => lines.push(item.slice(0, 260)));
  }

  if (!lines.length) {
    const top = Array.isArray(node?.children) ? node.children : [];
    const topTitles = top.map((child) => cleanupNodeText(child?.title || "")).filter(Boolean);
    topTitles.slice(0, 4).forEach((text) => lines.push(text));
  }

  return { title, lines: lines.slice(0, 8) };
}

function findNodeByPattern(rootNode, pattern) {
  if (!rootNode || !Array.isArray(rootNode.children)) return "";
  const stack = [...rootNode.children];
  while (stack.length) {
    const current = stack.shift();
    const title = cleanupNodeText(current?.title || "");
    if (title && pattern.test(title)) return title;
    if (Array.isArray(current?.children) && current.children.length) {
      stack.push(...current.children);
    }
  }
  return "";
}

function countNodes(node) {
  if (!node.children || node.children.length === 0) return 1;
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

async function parseUploadFile(file) {
  const lowerName = file.name.toLowerCase();
  const isText = lowerName.endsWith(".txt") || lowerName.endsWith(".md");
  const isXmind = lowerName.endsWith(".xmind");
  const isXmmap = lowerName.endsWith(".xmmap");
  const isPdf = lowerName.endsWith(".pdf");

  if (!isText && !isXmind && !isXmmap && !isPdf) {
    throw new Error("Поддерживаются форматы: txt, xmind, xmmap, pdf.");
  }

  if (isXmind) {
    const root = await parseXmindFile(file);
    return { map: root, format: "xmind", rawText: null, preserveText: true };
  }

  if (isXmmap) {
    const raw = await file.text();
    const root = parseXmmapText(raw);
    return { map: root, format: "xmmap", rawText: truncateForAi(raw, 300000), preserveText: true };
  }

  if (isPdf) {
    return parsePdfFile(file);
  }

  const raw = await file.text();
  const root = parseTextMap(raw);
  return { map: root, format: "text", rawText: truncateForAi(raw, 300000) };
}

async function parsePdfFile(file) {
  let pdfjs;
  try {
    pdfjs = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs");
  } catch {
    throw new Error("Не удалось подключить PDF-модуль (проверьте интернет).");
  }

  const workerUrl = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  }

  const bytes = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  if (!pdf.numPages) {
    throw new Error("PDF пустой.");
  }

  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();
  const rawText = (textContent.items || [])
    .map((item) => cleanupNodeText(item?.str || ""))
    .filter(Boolean)
    .join("\n");

  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    throw new Error("Не удалось создать canvas для PDF.");
  }

  await page.render({ canvasContext: context, viewport }).promise;
  const pdfPreviewDataUrl = canvas.toDataURL("image/jpeg", 0.84);

  const fallbackMap = {
    title: file.name.replace(/\.pdf$/i, "") || "PDF-карта",
    children: rawText
      ? rawText
          .split("\n")
          .slice(0, 10)
          .map((line) => ({ title: cleanupNodeText(line), children: [] }))
      : [],
  };

  return {
    map: fallbackMap,
    format: "pdf",
    rawText: truncateForAi(rawText, 50000),
    pdfPreviewDataUrl,
  };
}

function parseTextMap(raw) {
  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\t/g, "  "))
    .filter((line) => line.trim().length > 0);

  if (!lines.length) {
    throw new Error("Файл пустой.");
  }

  const parsed = lines
    .map((line) => {
      const match = line.match(/^(\s*)/);
      const indent = match ? match[0].length : 0;
      const level = Math.floor(indent / 2);
      const cleanText = line
        .trim()
        .replace(/^[-*+]\s+/, "")
        .replace(/^\d+\.\s+/, "")
        .replace(/^#+\s*/, "")
        .trim();

      if (!cleanText) return null;
      return { level, title: cleanupNodeText(cleanText), children: [] };
    })
    .filter(Boolean);

  if (!parsed.length) {
    throw new Error("Не удалось распознать структуру в txt/md.");
  }

  const root = parsed[0];
  const stack = [{ node: root, level: root.level }];

  for (let i = 1; i < parsed.length; i += 1) {
    const item = parsed[i];

    while (stack.length && item.level <= stack[stack.length - 1].level) {
      stack.pop();
    }

    const parent = stack.length ? stack[stack.length - 1].node : root;
    parent.children.push(item);
    stack.push({ node: item, level: item.level });
  }

  normalizeLevels(root);
  return root;
}

async function parseXmindFile(file) {
  let JSZip;
  try {
    ({ default: JSZip } = await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm"));
  } catch {
    throw new Error("Не удалось подключить модуль чтения .xmind (проверьте интернет).\n");
  }

  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const contentEntry = zip.file("content.json");
  if (contentEntry) {
    const contentRaw = await contentEntry.async("string");
    const sheets = JSON.parse(contentRaw);
    if (!Array.isArray(sheets) || !sheets.length || !sheets[0].rootTopic) {
      throw new Error("Некорректный content.json в .xmind.");
    }
    return parseXmindTopic(sheets[0].rootTopic);
  }

  const xmlEntry = zip.file("content.xml");
  if (!xmlEntry) {
    throw new Error("В .xmind не найден ни content.json, ни content.xml.");
  }

  const xmlRaw = await xmlEntry.async("string");
  const xmlRoot = parseXmindXmlRootTopic(xmlRaw);
  if (!xmlRoot) {
    throw new Error("Не удалось прочитать root topic из content.xml.");
  }

  return parseXmindXmlTopic(xmlRoot);
}

function parseXmindTopic(topic) {
  const candidateTitle =
    topic.title ||
    (Array.isArray(topic.attributedTitle) && topic.attributedTitle[0] && topic.attributedTitle[0].text) ||
    "Без названия";

  const attached = topic.children && Array.isArray(topic.children.attached) ? topic.children.attached : [];
  return {
    title: cleanupNodeText(candidateTitle),
    children: attached.map((child) => parseXmindTopic(child)),
  };
}

function parseXmindXmlRootTopic(xmlRaw) {
  const doc = new DOMParser().parseFromString(xmlRaw, "application/xml");
  if (doc.querySelector("parsererror")) return null;

  const all = Array.from(doc.getElementsByTagName("*"));
  return (
    all.find((node) => node.localName === "topic" && node.parentElement?.localName === "sheet") ||
    all.find((node) => node.localName === "topic") ||
    null
  );
}

function parseXmindXmlTopic(topicElement) {
  const titleNode = Array.from(topicElement.children).find((node) => node.localName === "title");
  const title = cleanupNodeText(titleNode?.textContent || "Без названия");

  const childrenNode = Array.from(topicElement.children).find((node) => node.localName === "children");
  const topicsTypeNodes = childrenNode
    ? Array.from(childrenNode.children).filter((node) => node.localName === "topics")
    : [];

  const childTopics = [];
  topicsTypeNodes.forEach((topicsNode) => {
    Array.from(topicsNode.children)
      .filter((node) => node.localName === "topic")
      .forEach((topicNode) => {
        childTopics.push(parseXmindXmlTopic(topicNode));
      });
  });

  return { title, children: childTopics };
}

function parseXmmapText(raw) {
  const source = raw.replace(/\r/g, "");
  const tokenRegex = /<ap:Topic\b[^>]*>|<\/ap:Topic>|<ap:Text\b[\s\S]*?\/>|<ap:Offset\b[^>]*\/>/gi;
  const tokens = source.match(tokenRegex) || [];
  const stack = [];
  let root = null;

  tokens.forEach((token) => {
    if (/^<ap:Topic\b/i.test(token)) {
      stack.push({
        title: "",
        children: [],
        details: [],
        _offsetCx: null,
        _sideHint: null,
      });
      return;
    }

    if (/^<ap:Text\b/i.test(token) && stack.length) {
      const plainText = extractXmmapPlainText(token);
      if (plainText) {
        const parsed = splitXmmapTextLines(plainText);
        const node = stack[stack.length - 1];
        node.title = parsed.title || node.title || "Без названия";
        if (parsed.details.length) {
          node.details = parsed.details.slice(0, 12);
        }
      }
      return;
    }

    if (/^<ap:Offset\b/i.test(token) && stack.length) {
      const cxMatch = token.match(/\bCX="([^"]+)"/i) || token.match(/\bCX='([^']+)'/i);
      const cx = Number(cxMatch?.[1]);
      if (Number.isFinite(cx)) {
        stack[stack.length - 1]._offsetCx = cx;
      }
      return;
    }

    if (/^<\/ap:Topic>/i.test(token) && stack.length) {
      const node = stack.pop();
      if (!node.title) node.title = "Без названия";
      if (Array.isArray(node.details) && !node.details.length) {
        delete node.details;
      }

      if (!stack.length) {
        delete node._offsetCx;
        delete node._sideHint;
        root = node;
      } else {
        const parent = stack[stack.length - 1];

        if (parent === stack[0]) {
          if (node._offsetCx < 0) node._sideHint = "left";
          else if (node._offsetCx > 0) node._sideHint = "right";
        }

        if (!node._sideHint && parent._sideHint) {
          node._sideHint = parent._sideHint;
        }

        if (node._sideHint === "left" || node._sideHint === "right") {
          node.side = node._sideHint;
        }

        delete node._offsetCx;
        delete node._sideHint;
        parent.children.push(node);
      }
    }
  });

  if (!root) {
    throw new Error("Не удалось разобрать .xmmap.");
  }

  return root;
}

function extractXmmapPlainText(token) {
  const attrMatch = token.match(/\bPlainText\s*=\s*/i);
  if (!attrMatch) return "";

  const start = attrMatch.index + attrMatch[0].length;
  const quote = token[start];
  if (quote !== '"' && quote !== "'") return "";

  const closeTagIndex = token.lastIndexOf("/>");
  const searchEnd = closeTagIndex >= 0 ? closeTagIndex : token.length;
  const end = token.lastIndexOf(quote, searchEnd - 1);
  if (end <= start) return "";

  return token.slice(start + 1, end);
}

function splitXmmapTextLines(value) {
  const text = String(value || "")
    .replace(/<\/div>/gi, "<br>")
    .replace(/<div[^>]*>/gi, "")
    .replace(/<\/p>/gi, "<br>")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n");

  const decoded = decodeHtmlEntities(text);
  const lines = decoded
    .split("\n")
    .map((line) =>
      line
        .replace(/<\/?[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\*\*/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);

  return {
    title: lines[0] || "Без названия",
    details: lines.slice(1),
  };
}

function truncateForAi(value, maxLength) {
  const text = String(value || "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}\n\n...[truncated]`;
}

function cleanupNodeText(input) {
  if (!input) return "Без названия";
  const normalized = String(input)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ");

  const decoded = decodeHtmlEntities(normalized)
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return decoded || "Без названия";
}

function decodeHtmlEntities(text) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function normalizeLevels(node) {
  if (!node.children) return;
  node.children.forEach((child) => {
    delete child.level;
    normalizeLevels(child);
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

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString("ru-RU");
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleString("ru-RU");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
