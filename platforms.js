export const categories = [
  {
    id: "food",
    title: "外卖省钱",
    eyebrow: "吃喝到家",
    description: "先领券、再凑单，结算时比较真实到手价",
  },
  {
    id: "local",
    title: "到店团购",
    eyebrow: "附近好价",
    description: "团购、特价套餐与免费试的常用找法",
  },
  {
    id: "shopping",
    title: "网购省钱",
    eyebrow: "买得划算",
    description: "签到红包、限时秒杀与购物券叠加步骤",
  },
];

export const platforms = [
  {
    id: "meituan-allowance",
    category: "food",
    name: "美团天天津贴",
    monogram: "美",
    description: "天天津贴搭配神券膨胀，结算页比较组合",
    href: "https://m.dianping.com/awp/hfe/block-page/call-native/meituan.html",
    actionLabel: "打开截图中的美团首页",
    accent: "#ffd866",
    tips: [
      "打开美团 App，进入“外卖 → 神券”，先签到领取当天可用神券。",
      "在神券页查看“膨一下”或“膨胀”；找不到时可在美团内搜索“膨一下”。",
      "再回到外卖首页领取“天天津贴”，然后选择支持这些优惠的商品。",
      "在结算页确认津贴、膨胀券和店铺优惠是否生效，以最终实付为准。",
    ],
    notice: "链接会唤起美团 App 首页；入口名称会因城市、账号和时段变化，津贴与膨胀券不保证每单都能叠加。",
  },
  {
    id: "jd-waimai",
    category: "food",
    name: "京东外卖百亿补贴",
    monogram: "京",
    description: "直达外卖补贴频道，先领券再选店",
    href: "https://hour.jd.com/aggregationChannel/channel?channelId=13376&httpsSchema=1&args-scene=singleNew&svcType=lbs&args-smallHomeModuleId=31548&title=%E5%A4%96%E5%8D%96&args-sourceValue=179&args-channelType=mixSingleChannel",
    actionLabel: "打开京东外卖领券",
    accent: "#ffd9d1",
    tips: [
      "打开京东 App，进入首页“秒送”，再选择外卖或补贴会场。",
      "先查看“领券”“百亿补贴”等入口，领取当前账号可用的券。",
      "选店加购后，核对商家满减、平台券、配送费与起送门槛。",
      "结算前切换可用券比较实付；不能叠加的券就选减得更多的一张。",
    ],
    notice: "链接已去除分享追踪参数；具体券额、资格和可用商家会随账号、城市与时段变化。",
  },
  {
    id: "alipay-flash-sale",
    category: "food",
    name: "闪购极速版（支付宝）",
    monogram: "闪",
    description: "直达支付宝内闪购极速版，先领红包再比配送费",
    href: "https://ur.alipay.com/_33FPR0PIKSD6LrOEXwNxml",
    actionLabel: "打开闪购极速版",
    accent: "#ffd4c4",
    tips: [
      "点击按钮进入支付宝里的闪购极速版，先确认当前城市和定位。",
      "先到“天天红包”或页面领券入口领取当前账号可用的红包。",
      "搜索商品或门店后，比较爆品团、店铺满减、起送价和配送费。",
      "付款前核对红包是否生效，并以结算页显示的最终实付为准。",
    ],
    notice: "入口、红包和配送范围会因账号、地区与时间变化；该链接来自支付宝官方分享页。",
  },
  {
    id: "alipay-special-deals",
    category: "local",
    name: "支付宝神券 · 团购",
    monogram: "支",
    description: "打开支付宝搜索神券，再进入神券团购页面",
    href: "https://ur.alipay.com/_4vC30z2bFQz5m93B6Gbii1",
    actionLabel: "打开支付宝搜索神券",
    accent: "#dceaff",
    tips: [
      "点击按钮打开支付宝的“神券”搜索结果，再进入“神券 · 团购”。",
      "确认所在城市后，按附近美食、茶咖、快餐等分类查看套餐。",
      "记下套餐内容，再到大众点评、抖省省或美团搜索同一家店比价。",
      "付款前确认适用门店、不可用日期、预约要求和退款规则。",
    ],
    notice: "链接来自支付宝官方分享页；搜索结果、券额和套餐会按城市、账号与时段展示。",
  },
  {
    id: "jd-dine-in",
    category: "local",
    name: "京东到店美食",
    monogram: "到",
    description: "直达到店美食频道，比较附近套餐与团购价",
    href: "https://hour.jd.com/stockpiling/index?title=%E5%88%B0%E5%BA%97%E7%BE%8E%E9%A3%9F&channelId=32899&followChannelId=1255",
    actionLabel: "打开京东到店美食",
    accent: "#ffd7d4",
    tips: [
      "点击按钮进入京东到店美食，先确认当前城市和附近门店。",
      "查看套餐包含内容、适用人数、可用时段和是否需要预约。",
      "用店名到美团、支付宝或大众点评搜索同款套餐，比较最终实付。",
      "购买前确认核销方式、适用分店、退款规则和不可用日期。",
    ],
    notice: "链接已去除分享追踪参数；频道、门店和优惠会随城市、账号与时间变化。",
  },
  {
    id: "meituan-group-buy",
    category: "local",
    name: "美团特价团",
    monogram: "团",
    description: "从美食团购进入，再搜索“特价团”比较同店套餐",
    href: "https://m.dianping.com/awp/hfe/block-page/call-native/meituan.html",
    actionLabel: "打开截图中的美团首页",
    accent: "#ffe0a6",
    tips: [
      "打开美团后，在顶部搜索“特价团”，或从“美食团购”分类进入。",
      "按当前城市筛选附近门店，先看套餐包含的菜品、数量和使用时段。",
      "搜索同一家店，对比普通团购、特价团和其他平台的最终实付。",
      "购买前确认适用分店、预约要求、不可用日期和过期退款规则。",
    ],
    notice: "链接会唤起美团 App 首页；特价团入口与套餐会因城市、账号和时段变化。",
  },
  {
    id: "dou-sheng-sheng",
    category: "local",
    name: "抖省省",
    monogram: "抖",
    description: "独立团购 App，适合搜附近低价套餐",
    href: null,
    actionLabel: "打开抖省省 App 查看",
    accent: "#e7ddff",
    tips: [
      "打开抖省省 App，用抖音账号登录并确认当前城市。",
      "直接搜索店名，或从“附近好价”和品类入口找套餐。",
      "查看当前账号的优惠券，并和抖音内收藏或同店套餐比较。",
      "购买前确认适用分店、使用时段、预约方式和过期退款规则。",
    ],
    notice: "这是独立 App；部分城市、门店或优惠可能尚未覆盖。",
  },
  {
    id: "dianping-deals",
    category: "local",
    name: "大众点评特价团 / 免费试",
    monogram: "点",
    description: "特价套餐直接比价，免费试先看报名规则",
    href: "https://t.dianping.com/",
    actionLabel: "打开大众点评官方团购",
    accent: "#ffe0c2",
    tips: [
      "在大众点评首页找“特价团”，或直接搜索店名和套餐。",
      "想参加免费试时，搜索“免费试”并查看当前城市是否有入口。",
      "免费试通常需要报名或抽选，先确认公布结果、核销时间和体验要求。",
      "购买团购前比较同店其他平台价格，并确认预约、退款与不可用日期。",
    ],
    notice: "免费试并非直接免单；如活动要求反馈，只提交真实体验。",
  },
  {
    id: "taobao-signin",
    category: "shopping",
    name: "淘宝红包签到",
    monogram: "签",
    description: "打开截图中的淘宝首页，再点“红包签到”",
    href: "https://m.taobao.com/",
    appHref: "taobao://m.taobao.com",
    actionLabel: "打开淘宝 App 首页",
    accent: "#ffe2c9",
    tips: [
      "点击按钮直接唤起淘宝 App 首页，再点截图中的“红包签到”。",
      "完成当天签到；有连续签到或浏览任务时，只做你愿意完成的任务。",
      "领取后查看红包有效期、使用门槛和适用品类。",
      "下单结算前确认红包已经勾选，不要为了凑门槛多买不需要的商品。",
    ],
    notice: "淘宝可能恢复上次打开的位置，无法保证每次都停在“推荐”标签；若未安装或没有成功打开 App，请点卡片下方的淘宝网页版入口。",
  },
  {
    id: "taobao-seckill",
    category: "shopping",
    name: "淘宝秒杀",
    monogram: "秒",
    description: "打开淘宝首页，再从“淘宝秒杀”进入当前场次",
    href: "https://m.taobao.com/",
    appHref: "taobao://m.taobao.com",
    actionLabel: "打开淘宝 App 首页",
    accent: "#ffd8c4",
    tips: [
      "点击按钮唤起淘宝 App 首页，再点截图中的“淘宝秒杀”。",
      "先确认开抢场次，收藏商品或设置官方提醒。",
      "开抢前选好规格、收货地址和支付方式，并领取页面可用的店铺券。",
      "结算时核对秒杀价、运费和退换规则；价格不合适就不抢。",
    ],
    notice: "淘宝可能恢复上次打开的位置；库存和场次实时变化，不使用代抢、脚本或来路不明的口令链接。",
  },
  {
    id: "jd-seckill",
    category: "shopping",
    name: "京东秒杀",
    monogram: "秒",
    description: "直达京东秒杀，先看场次再比较最终实付",
    href: "https://pro.m.jd.com/mall/active/Md9FMi1pJXg2q7qc8CmE9FNYDS4/index.html",
    actionLabel: "打开京东秒杀",
    accent: "#ffd7d4",
    tips: [
      "进入京东秒杀后，先确认当前场次、开抢时间和剩余库存。",
      "提前选好规格并领取商品页、店铺或品类可用的优惠券。",
      "开抢时核对秒杀价、运费、售后和是否支持价格保护。",
      "同款在普通商品页再比一次最终实付，价格不合适就不抢。",
    ],
    notice: "链接已去除分享追踪参数；场次、库存、资格和价格以京东页面实时显示为准。",
  },
  {
    id: "jingxi-goods",
    category: "shopping",
    name: "京喜好物",
    monogram: "喜",
    description: "进入京喜自营优惠频道，找低价好物再核对规格",
    href: "https://prodev.m.jd.com/mall/active/2iqSwv1JiDHxAkHAikfU6XAECFmo/index.html",
    actionLabel: "打开京喜好物",
    accent: "#ffe0c9",
    tips: [
      "进入京喜自营优惠频道，先搜索需要的商品或查看限量抢、秒杀与补贴。",
      "确认品牌、型号、规格和数量，避免只看最低展示价。",
      "领取可用优惠后，和京东普通商品页、其他店铺比较最终实付。",
      "付款前核对卖家、运费、配送时效、售后和退换条件。",
    ],
    notice: "链接已去除分享追踪参数；实际落地为京喜自营优惠频道，活动会随账号与时间变化。",
  },
  {
    id: "jd-trial",
    category: "shopping",
    name: "京东试用",
    monogram: "试",
    description: "复制完整口令后打开京东 App，进入天天试用活动",
    href: null,
    code: "14:/【京东试用】天天0元抢大牌试用，↷Jℹ️ng◁東！M6Md68En03Q0！ CA1565",
    actionLabel: "复制京东试用口令",
    accent: "#ffe5da",
    tips: [
      "完整口令：14:/【京东试用】天天0元抢大牌试用，↷Jℹ️ng◁東！M6Md68En03Q0！ CA1565",
      "点击“复制京东试用口令”，再打开京东 App，等待它自动识别剪贴板。",
      "如果没有弹出活动页，就把完整口令粘贴到京东首页搜索框并搜索。",
      "确认目标页标题为“京东试用”后，再查看申请资格、试用要求和运费。",
    ],
    notice: "这是用户提供的京东口令，可能带分享归因并存在有效期；不保证中选或所有商品均为 0 元。",
  },
  {
    id: "pinduoduo",
    category: "shopping",
    name: "拼多多",
    monogram: "拼",
    description: "先比同规格到手价，再看百亿补贴、限时秒杀与多人团",
    href: "https://mobile.yangkeduo.com/",
    actionLabel: "打开拼多多官方入口",
    accent: "#ffd8dc",
    tips: [
      "搜索后锁定品牌、型号、规格和数量，别被最低展示价的小规格误导。",
      "查看百亿补贴、限时秒杀或多人团，领券后比较单买与拼单的结算价。",
      "同款比较两三家；品牌商品优先选择官方旗舰店或授权店，并核对售后保障。",
      "付款页确认实际支付、运费、时效和退货条件，重要活动规则可以先截图。",
    ],
    notice: "优惠、频道和券会因账号、地区与时间变化；不点第三方返利或陌生助力链接。",
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

const TRUSTED_APP_HREFS = new Set(["taobao://m.taobao.com"]);

export function getTrustedAppHref(value) {
  return typeof value === "string" && TRUSTED_APP_HREFS.has(value) ? value : null;
}

export function getInstallHintState({ isSecure, hasInstallPrompt, isIosSafari, isStandalone }) {
  if (isStandalone) return "installed";
  if (isSecure && (hasInstallPrompt || isIosSafari)) return "available";
  return "hidden";
}
