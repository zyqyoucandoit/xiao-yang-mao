import { categories, getHttpsHref, getInstallHintState, getTrustedAppHref, platforms } from "/platforms.js";

const categoryNav = document.querySelector("#category-nav");
const main = document.querySelector("#main-content");
const maintenanceCount = document.querySelector("#maintenance-count");
const manageLink = document.querySelector("#manage-link");
const palette = ["#ffd866", "#ffd9d1", "#dceaff", "#e7ddff", "#ffe0a6", "#ffd8dc", "#d9f2df", "#ffe2c9"];

let state = { entries: fallbackEntries(), staleCount: null, source: "fallback" };
let authState = { checked: false, authenticated: false };

function fallbackEntries() {
  return platforms.map((entry, index) => ({
    ...entry,
    enabled: true,
    sortOrder: index,
    lastVerifiedAt: null,
    createdAt: null,
    updatedAt: null,
  }));
}

function makeTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function makeButton(text, className, handler, disabled = false) {
  const button = makeTextElement("button", className, text);
  button.type = "button";
  button.disabled = disabled;
  button.addEventListener("click", handler);
  return button;
}

function openTrustedApp(appHref) { window.location.href = appHref; }

function renderPlatformCard(platform) {
  const href = getHttpsHref(platform.href);
  const appHref = href ? getTrustedAppHref(platform.appHref) : null;
  const code = typeof platform.code === "string" && platform.code.trim() ? platform.code : null;
  const showCardGuide = platform.category !== "shopping";
  const showWebFallback = Boolean(appHref && href && showCardGuide);
  const isReady = Boolean(appHref || href || code);
  const card = document.createElement("article");
  card.className = `platform-card${isReady ? " platform-card--ready" : " platform-card--pending"}`;
  card.style.setProperty("--card-accent", platform.accent || "#ffe0a6");
  card.setAttribute("aria-labelledby", `${platform.id}-name`);
  const cardTop = document.createElement("div");
  cardTop.className = "platform-card__top";
  const icon = makeTextElement("span", "platform-card__icon", platform.monogram || platform.name.slice(0, 1));
  icon.setAttribute("aria-hidden", "true");
  const status = makeTextElement("span", `platform-card__status${isReady ? " platform-card__status--ready" : ""}`, appHref ? "打开 App" : href ? "官方入口" : code ? "可复制口令" : "待添加链接");
  cardTop.append(icon, status);
  const copy = document.createElement("div");
  copy.className = "platform-card__copy";
  const name = makeTextElement("h3", "platform-card__name", platform.name);
  name.id = `${platform.id}-name`;
  copy.append(name, makeTextElement("p", "platform-card__description", platform.description));
  const action = makeTextElement(appHref || href ? "a" : code ? "button" : "span", `platform-card__action${appHref ? " platform-card__action--app" : href ? " platform-card__action--link" : code ? " platform-card__action--copy" : ""}`, `${platform.actionLabel}${href && !appHref ? " ↗" : ""}`);
  if (appHref) {
    action.href = href;
    action.setAttribute("aria-label", `${platform.name}：打开淘宝 App 首页`);
    action.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openTrustedApp(appHref);
    });
  } else if (href) {
    action.href = href;
    action.target = "_blank";
    action.rel = "noopener noreferrer";
    action.setAttribute("aria-label", `${platform.actionLabel}（新窗口）`);
  } else if (code) {
    action.type = "button";
    action.setAttribute("aria-live", "polite");
    action.addEventListener("click", async () => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(code);
        action.textContent = "已复制，打开京东 App";
      } catch { action.textContent = "复制失败，请在浏览器中重试"; }
      window.setTimeout(() => { action.textContent = platform.actionLabel; }, 3000);
    });
  }
  const actions = document.createElement("div");
  actions.className = `platform-card__actions${showWebFallback ? " platform-card__actions--split" : ""}`;
  actions.append(action);
  if (showWebFallback) {
    const webFallback = makeTextElement("a", "platform-card__fallback", "网页");
    webFallback.href = href;
    webFallback.target = "_blank";
    webFallback.rel = "noopener noreferrer";
    webFallback.setAttribute("aria-label", `${platform.name}：在新窗口访问网页版本`);
    actions.append(webFallback);
  }
  card.append(cardTop, copy, actions);
  if (showCardGuide && ((platform.tips || []).length || platform.notice)) {
    const guide = document.createElement("details");
    guide.className = "saving-guide";
    const summary = makeTextElement("summary", "saving-guide__summary", "查看省钱步骤");
    summary.setAttribute("aria-label", `查看${platform.name}省钱步骤`);
    guide.append(summary);
    if ((platform.tips || []).length) {
      const steps = document.createElement("ol");
      steps.className = "saving-guide__steps";
      for (const tip of platform.tips) steps.append(makeTextElement("li", "", tip));
      guide.append(steps);
    }
    if (platform.notice) guide.append(makeTextElement("p", "saving-guide__notice", platform.notice));
    card.append(guide);
  }
  return card;
}

function renderNav() {
  categoryNav.replaceChildren();
  for (const category of categories) {
    const navLink = makeTextElement("a", "category-nav__link", category.title);
    navLink.href = `#${category.id}`;
    categoryNav.append(navLink);
  }
}

function updateMaintenanceCount() {
  const count = Number.isInteger(state.staleCount) ? state.staleCount : null;
  maintenanceCount.hidden = count === null;
  maintenanceCount.textContent = count === null ? "" : `待维护 ${count} 项`;
  manageLink.setAttribute("aria-label", count === null ? "管理入口" : `管理入口，待维护 ${count} 项`);
}

function renderHome() {
  main.replaceChildren();
  for (const category of categories) {
    const section = document.createElement("section");
    section.className = "category-section";
    section.id = category.id;
    section.setAttribute("aria-labelledby", `${category.id}-title`);
    const heading = document.createElement("div");
    heading.className = "section-heading";
    const headingCopy = document.createElement("div");
    const eyebrow = makeTextElement("p", "section-heading__eyebrow", category.eyebrow);
    const title = makeTextElement("h2", "section-heading__title", category.title);
    title.id = `${category.id}-title`;
    headingCopy.append(eyebrow, title);
    heading.append(headingCopy);
    const grid = document.createElement("div");
    grid.className = "platform-grid";
    for (const platform of state.entries.filter((item) => item.enabled && item.category === category.id)) grid.append(renderPlatformCard(platform));
    if (!grid.children.length) grid.append(makeTextElement("p", "empty-category", "暂时没有启用的入口。"));
    section.append(heading, grid);
    main.append(section);
  }
}

function inputField(labelText, control, hint = "") {
  const label = document.createElement("label");
  label.className = "manager-field";
  label.append(makeTextElement("span", "manager-field__label", labelText), control);
  if (hint) label.append(makeTextElement("small", "manager-field__hint", hint));
  return label;
}

function createInput(type, name, value = "") {
  const input = document.createElement("input");
  input.type = type;
  input.name = name;
  input.value = value || "";
  return input;
}

function statusText(entry) {
  if (!entry.enabled) return "已暂停";
  if (!entry.lastVerifiedAt) return "待确认";
  const date = new Date(entry.lastVerifiedAt);
  const stale = Number.isNaN(date.getTime()) || Date.now() - date.getTime() > 30 * 86400000;
  return stale ? "待确认" : `已确认 ${date.toLocaleDateString("zh-CN")}`;
}

function managerRequestAvailable() { return navigator.onLine && state.source === "cloud" && authState.authenticated; }

async function requestApi(path, options = {}) {
  if (!managerRequestAvailable()) throw new Error("当前离线或云端暂不可用，无法保存修改。");
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) }, credentials: "same-origin", cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "保存失败，请稍后重试。");
  return payload;
}

async function refreshSession() {
  try {
    const response = await fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" });
    const payload = await response.json();
    authState = { checked: true, authenticated: payload.authenticated === true };
  } catch {
    authState = { checked: true, authenticated: false };
  }
}

async function refreshEntries(includeInactive = location.hash === "#manage") {
  try {
    const response = await fetch(`/api/entries${includeInactive ? "?all=1" : ""}`, { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) throw new Error("API unavailable");
    const payload = await response.json();
    if (!Array.isArray(payload.entries)) throw new Error("Invalid API response");
    state = { entries: payload.entries, staleCount: Number.isInteger(payload.staleCount) ? payload.staleCount : null, source: payload.source === "cloud" ? "cloud" : "fallback" };
  } catch {
    state = { entries: fallbackEntries(), staleCount: null, source: "fallback" };
  }
  updateMaintenanceCount();
}

function renderLogin(message = "") {
  main.replaceChildren();
  const form = document.createElement("form");
  form.className = "manager manager-login";
  form.setAttribute("aria-labelledby", "manager-login-title");
  const card = document.createElement("div");
  card.className = "manager-heading manager-login__card";
  card.append(makeTextElement("h2", "manager-heading__title", "管理入口"));
  card.querySelector("h2").id = "manager-login-title";
  card.append(makeTextElement("p", "manager-heading__description", "请输入独立管理密码，维护内容只对你本人开放。"));
  if (message) {
    const feedback = makeTextElement("p", "manager-feedback manager-feedback--page", message);
    feedback.setAttribute("aria-live", "polite");
    card.append(feedback);
  }
  const password = createInput("password", "password");
  password.autocomplete = "current-password";
  password.required = true;
  password.minLength = 12;
  card.append(inputField("管理密码", password, "密码不会写入浏览器本地存储。"));
  const actions = document.createElement("div");
  actions.className = "manager-toolbar";
  const submit = makeTextElement("button", "manager-primary", "登录管理");
  submit.type = "submit";
  const back = makeButton("返回首页", "manager-secondary", () => { location.hash = "#food"; });
  actions.append(submit, back);
  card.append(actions);
  form.append(card);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.value }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "登录失败，请稍后重试。");
      authState = { checked: true, authenticated: true };
      await refreshEntries(true);
      renderManage("登录成功。");
    } catch (error) {
      renderLogin(error instanceof Error ? error.message : "登录失败，请稍后重试。");
    }
  });
  main.append(form);
  password.focus();
}

function renderEditor(entry = null, message = "") {
  const isEdit = Boolean(entry);
  const isSpecial = Boolean(entry?.appHref || entry?.code);
  const form = document.createElement("form");
  form.className = "manager-editor";
  form.noValidate = true;
  const title = makeTextElement("h2", "manager-editor__title", isEdit ? `编辑：${entry.name}` : "新增入口");
  form.append(title);
  const feedback = makeTextElement("p", "manager-feedback", message);
  feedback.hidden = !message;
  feedback.setAttribute("aria-live", "polite");
  form.append(feedback);
  const grid = document.createElement("div");
  grid.className = "manager-form-grid";
  const category = document.createElement("select"); category.name = "category";
  for (const item of categories) { const option = new Option(item.title, item.id, false, (entry?.category || "food") === item.id); category.append(option); }
  const name = createInput("text", "name", entry?.name); name.maxLength = 50; name.required = true;
  const monogram = createInput("text", "monogram", entry?.monogram); monogram.maxLength = 3; monogram.required = true;
  const description = document.createElement("textarea"); description.name = "description"; description.maxLength = 160; description.required = true; description.value = entry?.description || "";
  const href = createInput("url", "href", entry?.href); href.placeholder = "https://..."; href.required = !entry?.code; href.disabled = Boolean(entry?.code);
  const actionLabel = createInput("text", "actionLabel", entry?.actionLabel); actionLabel.maxLength = 48; actionLabel.required = true;
  const accent = createInput("color", "accent", entry?.accent || palette[0]);
  grid.append(inputField("分类", category), inputField("名称", name), inputField("文字图标", monogram, "最多 3 个字"), inputField("简介", description), inputField("HTTPS 跳转链接", href, entry?.code ? "京东口令入口保留原口令，不提供自定义 App Scheme。" : "仅接受 HTTPS，不能包含账号密码。"), inputField("按钮文字", actionLabel), inputField("暖色卡片颜色", accent));
  form.append(grid);
  const guideFields = document.createElement("div");
  guideFields.className = "manager-guide-fields";
  const tips = document.createElement("textarea"); tips.name = "tips"; tips.value = (entry?.tips || []).join("\n"); tips.placeholder = "每行一条省钱步骤";
  const notice = document.createElement("textarea"); notice.name = "notice"; notice.value = entry?.notice || ""; notice.placeholder = "可选提示";
  guideFields.append(inputField("省钱步骤", tips, "每行一条；网购分类不会显示。"), inputField("提示", notice, "网购分类不会显示。"));
  form.append(guideFields);
  const special = isSpecial ? makeTextElement("p", "manager-special-note", entry.code ? "高级类型：京东口令。口令保留为当前内置内容，不能通过管理页改成自定义 App Scheme。" : "高级类型：淘宝 App 唤起。安全唤起规则保留，不能新增或替换为自定义 App Scheme。") : null;
  if (special) form.append(special);
  const controls = document.createElement("div"); controls.className = "manager-editor__actions";
  const save = makeTextElement("button", "manager-primary", isEdit ? "保存修改" : "新增入口"); save.type = "submit"; save.disabled = !managerRequestAvailable();
  const cancel = makeButton("取消", "manager-secondary", () => renderManage());
  controls.append(save, cancel); form.append(controls);
  const syncGuideFields = () => { guideFields.hidden = category.value === "shopping"; };
  category.addEventListener("change", syncGuideFields); syncGuideFields();
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = { category: category.value, name: name.value, monogram: monogram.value, description: description.value, href: href.value, actionLabel: actionLabel.value, accent: accent.value, tips: tips.value.split("\n").map((item) => item.trim()).filter(Boolean), notice: notice.value };
    save.disabled = true; feedback.hidden = true;
    try {
      await requestApi(isEdit ? `/api/entries/${encodeURIComponent(entry.id)}` : "/api/entries", { method: isEdit ? "PATCH" : "POST", body: JSON.stringify(payload) });
      await refreshEntries(true); renderManage(isEdit ? "已保存修改。" : "已新增入口。");
    } catch (error) { feedback.textContent = error instanceof Error ? error.message : "保存失败。"; feedback.hidden = false; save.disabled = false; }
  });
  main.replaceChildren(form);
}

function renderManagerRow(entry) {
  const row = document.createElement("article"); row.className = "manager-row";
  const info = document.createElement("div"); info.className = "manager-row__info";
  const title = makeTextElement("h3", "manager-row__title", entry.name);
  const meta = makeTextElement("p", "manager-row__meta", `${categories.find((item) => item.id === entry.category)?.title || entry.category} · ${statusText(entry)}`);
  const link = makeTextElement("p", "manager-row__link", entry.code ? "高级类型：京东口令" : entry.appHref ? "高级类型：淘宝 App 唤起" : entry.href || "待补充链接");
  info.append(title, meta, link);
  const actions = document.createElement("div"); actions.className = "manager-row__actions";
  const disabled = !managerRequestAvailable();
  actions.append(
    makeButton("编辑", "manager-secondary", () => renderEditor(entry), disabled),
    makeButton("已确认", "manager-secondary", async () => { await runManagerAction(entry.id, "verify"); }, disabled),
    makeButton(entry.enabled ? "暂停" : "恢复", "manager-secondary", async () => { await runManagerAction(entry.id, "toggle"); }, disabled),
  );
  row.append(info, actions); return row;
}

async function runManagerAction(id, action) {
  try { await requestApi(`/api/entries/${encodeURIComponent(id)}/${action}`, { method: "POST", body: "{}" }); await refreshEntries(true); renderManage(action === "verify" ? "已更新确认时间。" : "入口状态已更新。"); }
  catch (error) { renderManage(error instanceof Error ? error.message : "操作失败。"); }
}

function renderManage(message = "") {
  main.replaceChildren();
  const section = document.createElement("section"); section.className = "manager"; section.setAttribute("aria-labelledby", "manager-title");
  const heading = document.createElement("div"); heading.className = "manager-heading";
  const title = makeTextElement("h2", "manager-heading__title", "管理入口"); title.id = "manager-title";
  const description = makeTextElement("p", "manager-heading__description", state.source === "cloud" ? `待维护 ${state.staleCount ?? 0} 项：启用入口超过 30 天未确认，或从未确认。` : "当前离线或云端暂不可用：首页会继续显示内置入口，管理保存已禁用。");
  heading.append(title, description); section.append(heading);
  if (message) { const feedback = makeTextElement("p", "manager-feedback manager-feedback--page", message); feedback.setAttribute("aria-live", "polite"); section.append(feedback); }
  const toolbar = document.createElement("div"); toolbar.className = "manager-toolbar";
  toolbar.append(
    makeButton("新增入口", "manager-primary", () => renderEditor(), !managerRequestAvailable()),
    makeButton("退出管理", "manager-secondary", async () => {
      try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, cache: "no-store" }); } catch {}
      authState = { checked: true, authenticated: false };
      renderLogin("已退出管理。");
    }, false),
    makeButton("返回首页", "manager-secondary", () => { location.hash = "#food"; }, false),
  );
  section.append(toolbar);
  const list = document.createElement("div"); list.className = "manager-list";
  for (const entry of state.entries) list.append(renderManagerRow(entry));
  section.append(list); main.append(section);
}

function renderRoute() {
  renderNav();
  if (location.hash === "#manage") {
    if (!authState.authenticated) renderLogin();
    else renderManage();
  }
  else renderHome();
}

async function loadRoute() {
  if (location.hash === "#manage") {
    await refreshSession();
    if (authState.authenticated) await refreshEntries(true);
  } else {
    await refreshEntries(false);
  }
  renderRoute();
}

async function boot() { await loadRoute(); }

window.addEventListener("hashchange", () => { loadRoute(); });
window.addEventListener("online", () => { loadRoute(); });
window.addEventListener("offline", () => { state = { ...state, source: "fallback", staleCount: null }; updateMaintenanceCount(); if (location.hash === "#manage") renderManage(); });

const isSecure = location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname);
const hasServiceWorker = "serviceWorker" in navigator;
const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const userAgent = navigator.userAgent;
const isIosDevice = /iPhone|iPad|iPod/i.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isIosSafari = isIosDevice && /WebKit/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);
const installBadge = document.querySelector("#install-badge"); const installTip = document.querySelector("#install-tip");
function updateInstallHint(hasInstallPrompt = false) {
  const installState = getInstallHintState({ isSecure, hasInstallPrompt, isIosSafari, isStandalone });
  installBadge.hidden = true; installTip.hidden = true;
  if (installState === "available") {
    installBadge.textContent = "可添加到桌面"; installBadge.hidden = false;
    installTip.textContent = isIosSafari ? "安装提示：点击浏览器的分享按钮，再选择“添加到主屏幕”。外部优惠页面仍需联网访问。" : "安装提示：在浏览器菜单中选择“安装应用”或“添加到主屏幕”。外部优惠页面仍需联网访问。";
    installTip.hidden = false;
  }
}
updateInstallHint(); window.addEventListener("beforeinstallprompt", () => updateInstallHint(true)); window.addEventListener("appinstalled", () => updateInstallHint(false));
if (isSecure && hasServiceWorker) window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {}); });

boot();
