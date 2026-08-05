import assert from "node:assert/strict";
import test from "node:test";
import {
  categories,
  getHttpsHref,
  getInstallHintState,
  getTrustedAppHref,
  platforms,
} from "../platforms.js";
import worker from "../dist/server/index.js";

test("新版分类、平台与省钱步骤保持完整", () => {
  assert.deepEqual(categories.map((item) => item.id), ["food", "local", "shopping"]);
  assert.equal(platforms.length, 14);
  assert.equal(categories.some((item) => item.id === "travel"), false);
  assert.equal(platforms.some((item) => item.category === "travel"), false);
  assert.equal(
    platforms.every(
      (item) =>
        Array.isArray(item.tips) &&
        item.tips.length >= 3 &&
        item.tips.every((tip) => typeof tip === "string" && tip.length > 0) &&
        typeof item.notice === "string" &&
        item.notice.length > 0,
    ),
    true,
  );
  assert.equal(
    platforms.every((item) => item.href === null || getHttpsHref(item.href) !== null),
    true,
  );

  const requestedLinkedIds = [
    "meituan-allowance",
    "jd-waimai",
    "alipay-flash-sale",
    "alipay-special-deals",
    "jd-dine-in",
    "meituan-group-buy",
    "taobao-signin",
    "jd-seckill",
    "jingxi-goods",
    "pinduoduo",
  ];
  assert.equal(
    requestedLinkedIds.every((id) => {
      const item = platforms.find((platform) => platform.id === id);
      return item && getHttpsHref(item.href) !== null;
    }),
    true,
  );

  const meituanHome = "https://m.dianping.com/awp/hfe/block-page/call-native/meituan.html";
  assert.equal(platforms.find((item) => item.id === "meituan-allowance")?.href, meituanHome);
  assert.equal(platforms.find((item) => item.id === "meituan-group-buy")?.href, meituanHome);
  assert.equal(
    platforms.find((item) => item.id === "alipay-special-deals")?.href,
    "https://ur.alipay.com/_4vC30z2bFQz5m93B6Gbii1",
  );
  assert.equal(
    platforms.find((item) => item.id === "alipay-flash-sale")?.href,
    "https://ur.alipay.com/_33FPR0PIKSD6LrOEXwNxml",
  );

  for (const id of ["jd-waimai", "jd-dine-in"]) {
    const href = platforms.find((item) => item.id === id)?.href;
    assert.equal(new URL(href).hostname, "hour.jd.com");
    assert.doesNotMatch(href, /utm_|shareid|[?&]gx[d]?=/i);
  }

  for (const id of ["jd-seckill", "jingxi-goods"]) {
    const href = platforms.find((item) => item.id === id)?.href;
    assert.equal(new URL(href).search, "");
  }

  assert.equal(platforms.some((item) => item.id === "jd-mall"), false);
  const jdTrial = platforms.find((item) => item.id === "jd-trial");
  assert.equal(jdTrial?.href, null);
  assert.equal(
    jdTrial?.code,
    "14:/【京东试用】天天0元抢大牌试用，↷Jℹ️ng◁東！M6Md68En03Q0！ CA1565",
  );

  for (const id of ["taobao-signin", "taobao-seckill"]) {
    const item = platforms.find((platform) => platform.id === id);
    assert.equal(item?.href, "https://m.taobao.com/");
    assert.equal(item?.appHref, "taobao://m.taobao.com");
  }
});

test("安装提示只在合适的运行环境显示", () => {
  assert.equal(
    getInstallHintState({
      isSecure: true,
      hasInstallPrompt: true,
      isIosSafari: false,
      isStandalone: false,
    }),
    "available",
  );
  assert.equal(
    getInstallHintState({
      isSecure: true,
      hasInstallPrompt: false,
      isIosSafari: false,
      isStandalone: true,
    }),
    "installed",
  );
  assert.equal(
    getInstallHintState({
      isSecure: true,
      hasInstallPrompt: false,
      isIosSafari: true,
      isStandalone: false,
    }),
    "available",
  );
  assert.equal(
    getInstallHintState({
      isSecure: false,
      hasInstallPrompt: true,
      isIosSafari: false,
      isStandalone: false,
    }),
    "hidden",
  );
});

test("只接受无凭据的绝对 HTTPS 链接", () => {
  assert.equal(getHttpsHref("https://example.com/coupon"), "https://example.com/coupon");
  assert.equal(getHttpsHref("http://example.com"), null);
  assert.equal(getHttpsHref("javascript:alert(1)"), null);
  assert.equal(getHttpsHref("https://user:pass@example.com"), null);
  assert.equal(getHttpsHref("not-a-url"), null);
  assert.equal(getTrustedAppHref("taobao://m.taobao.com"), "taobao://m.taobao.com");
  assert.equal(getTrustedAppHref("taobao://evil.example"), null);
  assert.equal(getTrustedAppHref("javascript:alert(1)"), null);
});

test("站点外壳与 PWA 资源可以由 Worker 提供", async () => {
  for (const pathname of [
    "/",
    "/styles.css",
    "/platforms.js",
    "/app.js",
    "/manifest.webmanifest",
    "/sw.js",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/icons/icon-maskable-512.png",
    "/icons/apple-touch-icon.png",
  ]) {
    const response = await worker.fetch(new Request(`https://example.test${pathname}`));
    assert.equal(response.status, 200, pathname);
  }

  const html = await (await worker.fetch(new Request("https://example.test/"))).text();
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /小羊毛仅整理跳转入口/);

  const manifest = await (
    await worker.fetch(new Request("https://example.test/manifest.webmanifest"))
  ).json();
  assert.equal(manifest.name, "小羊毛");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.icons.length, 3);

  const appSource = await (
    await worker.fetch(new Request("https://example.test/app.js"))
  ).text();
  assert.match(appSource, /document\.createElement\("article"\)/);
  assert.match(appSource, /document\.createElement\("details"\)/);
  assert.match(appSource, /action\.target = "_blank"/);
  assert.match(appSource, /action\.rel = "noopener noreferrer"/);
  assert.match(appSource, /navigator\.clipboard\?\.writeText/);
  assert.match(appSource, /window\.location\.href = appHref/);
  assert.match(appSource, /event\.preventDefault\(\)/);
  assert.match(appSource, /未打开？访问淘宝网页版/);
  assert.doesNotMatch(appSource, /visibilitychange/);

  const serviceWorker = await (
    await worker.fetch(new Request("https://example.test/sw.js"))
  ).text();
  assert.match(serviceWorker, /url\.origin !== self\.location\.origin/);
  assert.match(serviceWorker, /NETWORK_FIRST_ASSETS\.has\(url\.pathname\)/);
  assert.match(serviceWorker, /networkFirstAsset\(request\)/);
  assert.match(serviceWorker, /caches\.match\(request\)/);
});

test("不存在的路径返回 404", async () => {
  const response = await worker.fetch(new Request("https://example.test/missing"));
  assert.equal(response.status, 404);
});
