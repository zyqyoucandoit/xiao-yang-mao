export const categories = [
  {
    id: "food",
    title: "外卖闪购",
    eyebrow: "吃喝到家",
    description: "外卖红包、即时零售和餐饮优惠入口",
  },
  {
    id: "shopping",
    title: "网购省钱",
    eyebrow: "买得划算",
    description: "常用购物平台的优惠券与活动入口",
  },
  {
    id: "travel",
    title: "出行优惠",
    eyebrow: "轻松出发",
    description: "打车、聚合出行与日常通勤优惠入口",
  },
];

export const platforms = [
  {
    id: "meituan-waimai",
    category: "food",
    name: "美团外卖",
    monogram: "美",
    description: "外卖红包与餐饮优惠",
    href: null,
    accent: "#ffd866",
  },
  {
    id: "jd-waimai",
    category: "food",
    name: "京东外卖",
    monogram: "京",
    description: "外卖券与即时配送优惠",
    href: null,
    accent: "#ffd9d1",
  },
  {
    id: "taobao-flash",
    category: "food",
    name: "淘宝闪购",
    monogram: "闪",
    description: "即时零售与吃喝优惠",
    href: null,
    accent: "#ffe0c2",
  },
  {
    id: "eleme",
    category: "food",
    name: "饿了么",
    monogram: "饿",
    description: "外卖红包与会员优惠",
    href: null,
    accent: "#dceaff",
  },
  {
    id: "taobao-tmall",
    category: "shopping",
    name: "淘宝 / 天猫",
    monogram: "淘",
    description: "购物券与活动入口",
    href: null,
    accent: "#ffe2c9",
  },
  {
    id: "jd-mall",
    category: "shopping",
    name: "京东商城",
    monogram: "京",
    description: "商城优惠与品类券",
    href: null,
    accent: "#ffd7d4",
  },
  {
    id: "pinduoduo",
    category: "shopping",
    name: "拼多多",
    monogram: "拼",
    description: "平台活动与购物优惠",
    href: null,
    accent: "#ffd8dc",
  },
  {
    id: "didi",
    category: "travel",
    name: "滴滴出行",
    monogram: "滴",
    description: "打车券与出行活动",
    href: null,
    accent: "#ffe0b5",
  },
  {
    id: "amap-taxi",
    category: "travel",
    name: "高德打车",
    monogram: "高",
    description: "聚合打车优惠入口",
    href: null,
    accent: "#d9e7ff",
  },
];

export function getHttpsHref(value) {
  if (typeof value !== "string" || value.trim() === "") return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function getInstallHintState({ isSecure, hasInstallPrompt, isIosSafari, isStandalone }) {
  if (isStandalone) return "installed";
  if (isSecure && (hasInstallPrompt || isIosSafari)) return "available";
  return "hidden";
}
