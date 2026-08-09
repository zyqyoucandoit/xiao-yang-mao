import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  categories,
  getHttpsHref,
  getInstallHintState,
  getTrustedAppHref,
  platforms,
} from "../platforms.js";
import { fallbackEntries } from "../api/_lib/db.js";
import { normalizeEntry, normalizeTips, isStale } from "../api/_lib/config.js";
import { createSessionValue, verifySessionValue } from "../api/_lib/auth.js";

test("分类、入口和省钱步骤保持完整", () => {
  assert.deepEqual(categories.map((item) => item.id), ["food", "local", "shopping"]);
  assert.equal(platforms.length, 14);
  assert.equal(categories.some((item) => item.id === "travel"), false);
  assert.equal(platforms.some((item) => item.category === "travel"), false);
  assert.equal(platforms.every((item) => Array.isArray(item.tips) && item.tips.length >= 3), true);
  assert.equal(platforms.every((item) => item.href === null || getHttpsHref(item.href) !== null), true);
  assert.equal(platforms.filter((item) => item.category === "shopping").every((item) => item.tips.length > 0), true);
});

test("保留用户确认的优惠入口和特殊类型", () => {
  const requestedLinkedIds = ["meituan-allowance", "jd-waimai", "alipay-flash-sale", "alipay-special-deals", "jd-dine-in", "meituan-group-buy", "taobao-signin", "jd-seckill", "jingxi-goods", "pinduoduo"];
  assert.equal(requestedLinkedIds.every((id) => getHttpsHref(platforms.find((item) => item.id === id)?.href)), true);
  assert.equal(platforms.find((item) => item.id === "jd-trial")?.code, "14:/【京东试用】天天0元抢大牌试用，↷Jℹ️ng◁東！M6Md68En03Q0！ CA1565");
  for (const id of ["taobao-signin", "taobao-seckill"]) {
    const item = platforms.find((platform) => platform.id === id);
    assert.equal(item?.href, "https://m.taobao.com/");
    assert.equal(getTrustedAppHref(item?.appHref), "taobao://m.taobao.com");
  }
});

test("安装提示只在合适的运行环境显示", () => {
  assert.equal(getInstallHintState({ isSecure: true, hasInstallPrompt: true, isIosSafari: false, isStandalone: false }), "available");
  assert.equal(getInstallHintState({ isSecure: true, hasInstallPrompt: false, isIosSafari: false, isStandalone: true }), "installed");
  assert.equal(getInstallHintState({ isSecure: true, hasInstallPrompt: false, isIosSafari: true, isStandalone: false }), "available");
  assert.equal(getInstallHintState({ isSecure: false, hasInstallPrompt: true, isIosSafari: false, isStandalone: false }), "hidden");
});

test("入口链接安全校验拒绝非 HTTPS 和自定义 Scheme", () => {
  assert.equal(getHttpsHref("https://example.com/coupon"), "https://example.com/coupon");
  assert.equal(getHttpsHref("http://example.com"), null);
  assert.equal(getHttpsHref("javascript:alert(1)"), null);
  assert.equal(getHttpsHref("https://user:pass@example.com"), null);
  assert.equal(getHttpsHref("not-a-url"), null);
  assert.throws(() => normalizeEntry({ category: "food", name: "非法", monogram: "非", description: "测试", href: "http://example.com", actionLabel: "打开", accent: "#ffffff" }));
  assert.deepEqual(normalizeTips(["步骤 1"], "shopping"), []);
});

test("入口回退数据、维护周期与会话签名", () => {
  assert.equal(fallbackEntries().length, 14);
  assert.equal(isStale({ enabled: true, lastVerifiedAt: null }), true);
  assert.equal(isStale({ enabled: false, lastVerifiedAt: null }), false);
  process.env.SESSION_SECRET = "test-secret";
  const token = createSessionValue(Date.now());
  assert.equal(verifySessionValue(token), true);
  assert.equal(verifySessionValue(`${token}x`), false);
});

test("Vercel 静态输出、API 排除缓存与 PWA 资源齐全", async () => {
  for (const pathname of ["index.html", "styles.css", "platforms.js", "app.js", "manifest.webmanifest", "sw.js", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"]) {
    const body = await readFile(new URL(`../dist/${pathname}`, import.meta.url));
    assert.ok(body.length > 0, pathname);
  }
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /id="manage-link"/);
  assert.doesNotMatch(html, /把零散的优惠入口和省钱步骤收进一个口袋/);
  const appSource = await readFile(new URL("../dist/app.js", import.meta.url), "utf8");
  assert.match(appSource, /api\/auth\/login/);
  assert.match(appSource, /#manage/);
  assert.match(appSource, /managerRequestAvailable/);
  assert.match(appSource, /platform\.category !== "shopping"/);
  const serviceWorker = await readFile(new URL("../dist/sw.js", import.meta.url), "utf8");
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/api\/"\)/);
});
