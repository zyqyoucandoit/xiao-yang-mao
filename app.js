import { categories, getHttpsHref, getInstallHintState, platforms } from "/platforms.js";

const categoryNav = document.querySelector("#category-nav");
const main = document.querySelector("#main-content");

function makeTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function renderPlatformCard(platform) {
  const href = getHttpsHref(platform.href);
  const card = document.createElement(href ? "a" : "button");

  card.className = `platform-card${href ? " platform-card--ready" : " platform-card--pending"}`;
  card.style.setProperty("--card-accent", platform.accent);

  if (href) {
    card.href = href;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.setAttribute("aria-label", `打开${platform.name}优惠页面（新窗口）`);
  } else {
    card.type = "button";
    card.disabled = true;
    card.setAttribute("aria-label", `${platform.name}优惠链接待添加`);
  }

  const cardTop = document.createElement("span");
  cardTop.className = "platform-card__top";

  const icon = makeTextElement("span", "platform-card__icon", platform.monogram);
  icon.setAttribute("aria-hidden", "true");
  const status = makeTextElement(
    "span",
    `platform-card__status${href ? " platform-card__status--ready" : ""}`,
    href ? "链接可用" : "待添加链接",
  );
  cardTop.append(icon, status);

  const copy = document.createElement("span");
  copy.className = "platform-card__copy";
  copy.append(
    makeTextElement("span", "platform-card__name", platform.name),
    makeTextElement("span", "platform-card__description", platform.description),
  );

  const action = makeTextElement(
    "span",
    "platform-card__action",
    href ? "前往查看优惠 →" : "链接补充后即可使用",
  );
  card.append(cardTop, copy, action);
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
