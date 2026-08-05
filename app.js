import {
  categories,
  getHttpsHref,
  getInstallHintState,
  getTrustedAppHref,
  platforms,
} from "/platforms.js";

const categoryNav = document.querySelector("#category-nav");
const main = document.querySelector("#main-content");

function makeTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function openTrustedApp(appHref) {
  window.location.href = appHref;
}

function renderPlatformCard(platform) {
  const href = getHttpsHref(platform.href);
  const appHref = href ? getTrustedAppHref(platform.appHref) : null;
  const code = typeof platform.code === "string" && platform.code.trim() ? platform.code : null;
  const isReady = Boolean(appHref || href || code);
  const card = document.createElement("article");

  card.className = `platform-card${isReady ? " platform-card--ready" : " platform-card--pending"}`;
  card.style.setProperty("--card-accent", platform.accent);
  card.setAttribute("aria-labelledby", `${platform.id}-name`);

  const cardTop = document.createElement("div");
  cardTop.className = "platform-card__top";

  const icon = makeTextElement("span", "platform-card__icon", platform.monogram);
  icon.setAttribute("aria-hidden", "true");
  const status = makeTextElement(
    "span",
    `platform-card__status${isReady ? " platform-card__status--ready" : ""}`,
    appHref ? "打开 App" : href ? "官方入口" : code ? "可复制口令" : "App 内入口",
  );
  cardTop.append(icon, status);

  const copy = document.createElement("div");
  copy.className = "platform-card__copy";
  const name = makeTextElement("h3", "platform-card__name", platform.name);
  name.id = `${platform.id}-name`;
  copy.append(name, makeTextElement("p", "platform-card__description", platform.description));

  const action = makeTextElement(
    appHref || href ? "a" : code ? "button" : "span",
    `platform-card__action${appHref ? " platform-card__action--app" : href ? " platform-card__action--link" : code ? " platform-card__action--copy" : ""}`,
    `${platform.actionLabel}${href && !appHref ? " →" : ""}`,
  );
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
      } catch {
        action.textContent = "复制失败，请展开步骤手动复制";
      }
      window.setTimeout(() => {
        action.textContent = platform.actionLabel;
      }, 3000);
    });
  }

  const actions = document.createElement("div");
  actions.className = `platform-card__actions${appHref && href ? " platform-card__actions--split" : ""}`;
  actions.append(action);

  if (appHref && href) {
    const webFallback = makeTextElement(
      "a",
      "platform-card__fallback",
      "网页",
    );
    webFallback.href = href;
    webFallback.target = "_blank";
    webFallback.rel = "noopener noreferrer";
    webFallback.setAttribute("aria-label", `${platform.name}：在新窗口访问淘宝网页版`);
    actions.append(webFallback);
  }

  const guide = document.createElement("details");
  guide.className = "saving-guide";
  const summary = makeTextElement("summary", "saving-guide__summary", "查看省钱步骤");
  summary.setAttribute("aria-label", `查看${platform.name}省钱步骤`);
  const steps = document.createElement("ol");
  steps.className = "saving-guide__steps";
  for (const tip of platform.tips) {
    steps.append(makeTextElement("li", "", tip));
  }
  const notice = makeTextElement("p", "saving-guide__notice", platform.notice);
  guide.append(summary, steps, notice);

  card.append(cardTop, copy, actions, guide);
  return card;
}

for (const category of categories) {
  const navLink = makeTextElement("a", "category-nav__link", category.title);
  navLink.href = `#${category.id}`;
  categoryNav.append(navLink);

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
  heading.append(headingCopy, makeTextElement("p", "section-heading__description", category.description));

  const grid = document.createElement("div");
  grid.className = "platform-grid";
  for (const platform of platforms.filter((item) => item.category === category.id)) {
    grid.append(renderPlatformCard(platform));
  }

  section.append(heading, grid);
  main.append(section);
}

const isSecure =
  location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname);
const hasServiceWorker = "serviceWorker" in navigator;
const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const userAgent = navigator.userAgent;
const isIosDevice =
  /iPhone|iPad|iPod/i.test(userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isIosSafari =
  isIosDevice &&
  /WebKit/i.test(userAgent) &&
  !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);
const installBadge = document.querySelector("#install-badge");
const installTip = document.querySelector("#install-tip");

function updateInstallHint(hasInstallPrompt = false) {
  const installState = getInstallHintState({
    isSecure,
    hasInstallPrompt,
    isIosSafari,
    isStandalone,
  });

  if (installState === "available") {
    installBadge.textContent = "＋ 可添加到桌面";
    installBadge.hidden = false;
    installTip.textContent = isIosSafari
      ? "安装提示：点击浏览器的分享按钮，再选择“添加到主屏幕”。外部优惠页面仍需联网访问。"
      : "安装提示：在浏览器菜单中选择“安装应用”或“添加到主屏幕”。外部优惠页面仍需联网访问。";
    installTip.hidden = false;
  } else if (installState === "installed") {
    installBadge.textContent = "桌面模式";
    installBadge.hidden = false;
  }
}

updateInstallHint();
window.addEventListener("beforeinstallprompt", () => updateInstallHint(true));

const canUseServiceWorker = isSecure && hasServiceWorker;

if (canUseServiceWorker) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
  });
}
