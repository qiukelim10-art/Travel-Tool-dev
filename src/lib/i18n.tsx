"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

export type Language = "en" | "zh";

const languageStorageKey = "italy-trip-language";

const translations = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.home": "Home",
    "nav.itinerary": "Itinerary",
    "nav.plan": "Plan",
    "nav.bookings": "Bookings",
    "nav.book": "Book",
    "nav.budget": "Budget",
    "nav.money": "Money",
    "nav.map": "Map",
    "nav.food": "Food",
    "nav.attractions": "Attractions",
    "nav.see": "See",
    "nav.packing": "Packing",
    "nav.pack": "Pack",
    "nav.documents": "Documents",
    "nav.docs": "Docs",
    "nav.emergency": "Emergency",
    "nav.more": "More",
    "language.switch": "Language: 中文 / EN",
    "language.switchShort": "中/EN",
    "language.label": "Language",
    "common.all": "All",
    "common.open": "Open",
    "common.close": "Close",
    "common.view": "View",
    "common.call": "Call",
    "common.map": "Map",
    "common.openMap": "Open map",
    "common.officialSite": "Official site",
    "common.tbc": "TBC",
    "common.owner": "Owner",
    "common.day": "Day",
    "common.date": "Date",
    "common.location": "Location",
    "common.amount": "Amount",
    "common.status": "Status",
    "common.category": "Category",
    "common.title": "Title",
    "common.city": "City",
    "common.priority": "Priority",
    "common.price": "Price",
    "common.reservation": "Reservation",
    "common.booking": "Booking",
    "common.duration": "Duration",
    "common.ticket": "Ticket",
    "common.required": "Required",
    "common.freeNotNeeded": "Free / not needed",
    "common.bookedBy": "Booked by",
    "common.privateLink": "Private link placeholder",
    "page.dashboard.eyebrow": "Private trip dashboard",
    "page.dashboard.tripDates": "Trip dates",
    "page.dashboard.tripDatesValue": "Oct 8-18",
    "page.dashboard.travellers": "travellers",
    "page.dashboard.cities": "Cities",
    "page.dashboard.routeDetail": "Rome, Florence, Venice, Milan route placeholder.",
    "page.dashboard.nextDeadline": "Next deadline",
    "page.dashboard.emergencyDetail": "Tap Emergency any time from the bottom navigation.",
    "page.dashboard.nextItineraryDay": "Next itinerary day",
    "page.dashboard.bookingProgress": "Booking progress",
    "page.dashboard.itemsNeedAction": "items still need action.",
    "page.dashboard.budgetOverview": "Budget overview",
    "page.dashboard.perPerson": "per person",
    "page.dashboard.openBudget": "Open budget",
    "page.dashboard.importantReminders": "Important reminders",
    "page.itinerary.eyebrow": "Daily plan",
    "page.itinerary.title": "Itinerary",
    "page.itinerary.description": "Filter by city, open each day, and quickly find the plan, transport, tickets, base location, and map links.",
    "page.itinerary.morning": "Morning",
    "page.itinerary.afternoon": "Afternoon",
    "page.itinerary.evening": "Evening",
    "page.itinerary.base": "Base",
    "page.itinerary.transport": "Transport",
    "page.itinerary.meals": "Meals",
    "page.itinerary.tickets": "Tickets",
    "page.itinerary.noHotel": "No hotel set",
    "page.itinerary.estimatedCost": "Estimated cost:",
    "page.bookings.eyebrow": "Booking center",
    "page.bookings.title": "Bookings",
    "page.bookings.description": "Track flights, hotels, trains, attractions, restaurants, insurance, and items that still need confirmation.",
    "page.bookings.totalItems": "Total items",
    "page.bookings.needAction": "Need action",
    "page.bookings.visible": "Visible",
    "page.bookings.owner": "Owner",
    "page.budget.eyebrow": "Shared costs",
    "page.budget.title": "Budget",
    "page.budget.description": "Automatically calculates total costs, per-person shares, paid amounts, and simple settlement suggestions by currency.",
    "page.budget.summary": "Summary",
    "page.budget.totalTripCost": "Total trip cost",
    "page.budget.costPerPerson": "Cost per person",
    "page.budget.paidByEachPerson": "Paid by each person",
    "page.budget.owedByEachPerson": "Owed by each person",
    "page.budget.settlementSummary": "Settlement summary",
    "page.budget.noSettlement": "No settlement needed for this currency.",
    "page.budget.pays": "pays",
    "page.budget.unsettledExpenses": "Unsettled expenses",
    "page.budget.paidBy": "Paid by",
    "page.budget.splitAmong": "Split among",
    "page.emergency.eyebrow": "Quick help",
    "page.emergency.title": "Emergency",
    "page.emergency.description": "Use this page for urgent numbers, traveller contacts, hotel placeholders, insurance, bank, embassy, and medical links.",
    "page.map.eyebrow": "Places and routes",
    "page.map.title": "Map",
    "page.map.description": "Use placeholder maps and location links for hotels, attractions, stations, restaurants, and emergency searches.",
    "page.map.directoryEyebrow": "Directory",
    "page.map.directoryTitle": "Important places",
    "page.map.directoryDescription": "Filter the placeholder location list by city or category, then open the place in Google Maps.",
    "page.food.eyebrow": "Restaurants",
    "page.food.title": "Food",
    "page.food.description": "Shortlist must-try, good-to-have, and backup food options with reservation status and map links.",
    "page.attractions.eyebrow": "Sightseeing",
    "page.attractions.title": "Attractions",
    "page.attractions.description": "Track priority, ticket requirements, booking status, estimated duration, and map links for major sights.",
    "page.packing.eyebrow": "Checklist",
    "page.packing.title": "Packing List",
    "page.packing.description": "Static checklist for required items, shared responsibilities, and trip essentials. Checked state is placeholder-only for Phase 2.",
    "page.packing.totalItems": "Total items",
    "page.packing.checked": "Checked",
    "page.documents.eyebrow": "Private links only",
    "page.documents.title": "Documents",
    "page.documents.description": "Store only private cloud link placeholders and safe summaries here. Do not upload real files into this project.",
    "page.documents.sensitiveRule": "Sensitive document rule",
    "page.documents.sensitiveRuleBody": "Do not store real passports, identity documents, payment card details, insurance certificates, booking confirmation files, or full receipt files in this repo. Use private Google Drive, iCloud Drive, or OneDrive links shared only with the 4 travellers.",
    "page.documents.sensitive": "Sensitive",
    "page.documents.standard": "Standard",
    "page.more.eyebrow": "More tools",
    "page.more.title": "More",
    "page.more.description": "Secondary trip tools are grouped here so the phone navigation stays simple during the trip.",
    "page.more.open": "Open"
  },
  zh: {
    "nav.dashboard": "总览",
    "nav.home": "首页",
    "nav.itinerary": "行程",
    "nav.plan": "行程",
    "nav.bookings": "预订",
    "nav.book": "预订",
    "nav.budget": "预算",
    "nav.money": "预算",
    "nav.map": "地图",
    "nav.food": "美食",
    "nav.attractions": "景点",
    "nav.see": "景点",
    "nav.packing": "行李",
    "nav.pack": "行李",
    "nav.documents": "文件",
    "nav.docs": "文件",
    "nav.emergency": "紧急",
    "nav.more": "更多",
    "language.switch": "语言：中文 / EN",
    "language.switchShort": "中/EN",
    "language.label": "语言",
    "common.all": "全部",
    "common.open": "展开",
    "common.close": "收起",
    "common.view": "查看",
    "common.call": "拨打",
    "common.map": "地图",
    "common.openMap": "打开地图",
    "common.officialSite": "官网",
    "common.tbc": "待确认",
    "common.owner": "负责人",
    "common.day": "第",
    "common.date": "日期",
    "common.location": "地点",
    "common.amount": "金额",
    "common.status": "状态",
    "common.category": "类别",
    "common.title": "标题",
    "common.city": "城市",
    "common.priority": "优先级",
    "common.price": "价格",
    "common.reservation": "订位",
    "common.booking": "预订",
    "common.duration": "时长",
    "common.ticket": "门票",
    "common.required": "必备",
    "common.freeNotNeeded": "免费 / 不需要",
    "common.bookedBy": "预订人",
    "common.privateLink": "私人链接占位",
    "page.dashboard.eyebrow": "私人旅行总览",
    "page.dashboard.tripDates": "旅行日期",
    "page.dashboard.tripDatesValue": "10月8日-18日",
    "page.dashboard.travellers": "位旅客",
    "page.dashboard.cities": "城市",
    "page.dashboard.routeDetail": "罗马、佛罗伦萨、威尼斯、米兰路线占位。",
    "page.dashboard.nextDeadline": "下个截止日",
    "page.dashboard.emergencyDetail": "需要时可随时从底部导航进入紧急页面。",
    "page.dashboard.nextItineraryDay": "下一天行程",
    "page.dashboard.bookingProgress": "预订进度",
    "page.dashboard.itemsNeedAction": "项仍需处理。",
    "page.dashboard.budgetOverview": "预算概览",
    "page.dashboard.perPerson": "每人",
    "page.dashboard.openBudget": "打开预算",
    "page.dashboard.importantReminders": "重要提醒",
    "page.itinerary.eyebrow": "每日计划",
    "page.itinerary.title": "行程",
    "page.itinerary.description": "按城市筛选、展开每天安排，并快速查看计划、交通、门票、住宿地点和地图链接。",
    "page.itinerary.morning": "上午",
    "page.itinerary.afternoon": "下午",
    "page.itinerary.evening": "晚上",
    "page.itinerary.base": "住宿",
    "page.itinerary.transport": "交通",
    "page.itinerary.meals": "用餐",
    "page.itinerary.tickets": "门票",
    "page.itinerary.noHotel": "尚未设置酒店",
    "page.itinerary.estimatedCost": "预计花费：",
    "page.bookings.eyebrow": "预订中心",
    "page.bookings.title": "预订",
    "page.bookings.description": "追踪机票、酒店、火车、景点、餐厅、保险，以及仍需确认的事项。",
    "page.bookings.totalItems": "总项目",
    "page.bookings.needAction": "需处理",
    "page.bookings.visible": "当前显示",
    "page.bookings.owner": "负责人",
    "page.budget.eyebrow": "共同费用",
    "page.budget.title": "预算",
    "page.budget.description": "自动计算总费用、人均分摊、已付款金额，并按货币给出简单结算建议。",
    "page.budget.summary": "汇总",
    "page.budget.totalTripCost": "总旅行费用",
    "page.budget.costPerPerson": "每人费用",
    "page.budget.paidByEachPerson": "各自已付",
    "page.budget.owedByEachPerson": "各自应付",
    "page.budget.settlementSummary": "结算摘要",
    "page.budget.noSettlement": "此货币无需结算。",
    "page.budget.pays": "支付给",
    "page.budget.unsettledExpenses": "未结算费用",
    "page.budget.paidBy": "付款人",
    "page.budget.splitAmong": "分摊成员",
    "page.emergency.eyebrow": "快速求助",
    "page.emergency.title": "紧急",
    "page.emergency.description": "用于查看紧急号码、旅伴联系方式、酒店占位信息、保险、银行、大使馆和医疗链接。",
    "page.map.eyebrow": "地点和路线",
    "page.map.title": "地图",
    "page.map.description": "使用地图和地点链接占位，集中查看酒店、景点、车站、餐厅和紧急搜索。",
    "page.map.directoryEyebrow": "地点目录",
    "page.map.directoryTitle": "重要地点",
    "page.map.directoryDescription": "按城市或类别筛选地点，然后在 Google Maps 中打开。",
    "page.food.eyebrow": "餐厅",
    "page.food.title": "美食",
    "page.food.description": "整理必吃、可选和备用餐厅，并追踪订位状态和地图链接。",
    "page.attractions.eyebrow": "观光",
    "page.attractions.title": "景点",
    "page.attractions.description": "追踪主要景点的优先级、门票需求、预订状态、预计停留时间和地图链接。",
    "page.packing.eyebrow": "清单",
    "page.packing.title": "行李清单",
    "page.packing.description": "静态清单，用于记录必备物品、共同责任和旅行必需品。勾选状态在第二阶段才会真正可操作。",
    "page.packing.totalItems": "总物品",
    "page.packing.checked": "已勾选",
    "page.documents.eyebrow": "仅私人链接",
    "page.documents.title": "文件",
    "page.documents.description": "这里只保存私人云端链接占位和安全摘要。不要把真实文件上传到此项目。",
    "page.documents.sensitiveRule": "敏感文件规则",
    "page.documents.sensitiveRuleBody": "不要在此 repo 存放真实护照、身份证件、付款卡资料、保险证书、预订确认文件或完整收据。请使用只共享给 4 位旅客的私人 Google Drive、iCloud Drive 或 OneDrive 链接。",
    "page.documents.sensitive": "敏感",
    "page.documents.standard": "普通",
    "page.more.eyebrow": "更多工具",
    "page.more.title": "更多",
    "page.more.description": "次要旅行工具集中放在这里，让手机底部导航在旅途中保持简洁。",
    "page.more.open": "打开"
  }
} as const;

export type TranslationKey = keyof typeof translations.en;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getBrowserLanguage(): Language {
  if (typeof navigator === "undefined") {
    return "en";
  }

  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

function getStoredLanguage(): Language | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(languageStorageKey);
  return stored === "zh" || stored === "en" ? stored : null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    setLanguageState(getStoredLanguage() ?? getBrowserLanguage());
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(languageStorageKey, nextLanguage);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage(language === "zh" ? "en" : "zh"),
      t: (key) => translations[language][key]
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
