"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

export type Language = "en" | "zh";

export const languageStorageKey = "trip-dashboard-language";

const legacyLanguageStorageKey = "italy-trip-language";

const translations = {
  en: {
    "language.label": "Language",
    "language.toggle": "EN / 中文",

    "nav.dashboard": "Dashboard",
    "nav.home": "Home",
    "nav.itinerary": "Itinerary",
    "nav.plan": "Plan",
    "nav.bookings": "Bookings",
    "nav.book": "Book",
    "nav.budget": "Budget",
    "nav.money": "Money",
    "nav.packing": "Packing",
    "nav.pack": "Pack",
    "nav.documents": "Documents",
    "nav.docs": "Docs",
    "nav.more": "More",

    "common.add": "Add",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.hide": "Hide",
    "common.loading": "Loading",
    "common.open": "Open",
    "common.retry": "Retry",
    "common.save": "Save",
    "common.show": "Show",
    "common.view": "View",
    "common.call": "Call",
    "common.map": "Map",
    "common.filter": "Filter",
    "common.by": "By",
    "common.priority": "Priority",
    "common.createdBy": "Created by",

    "dashboard.eyebrow": "Private trip dashboard",
    "dashboard.travellers": "travellers",
    "dashboard.nextUp": "Next up",
    "dashboard.day": "Day {day}",
    "dashboard.viewItinerary": "View itinerary",
    "dashboard.needsAttention": "Needs attention",
    "dashboard.bookingItem": "booking item",
    "dashboard.bookingItems": "booking items",
    "dashboard.attentionHint": "Pending, not booked, or waiting for confirmation.",
    "dashboard.openBookings": "Open bookings",
    "dashboard.noBookingAttention": "No booking items need attention right now.",
    "dashboard.quickActions": "Quick actions",
    "dashboard.quickActionsHint": "Jump to the full tools when you need details.",
    "dashboard.action.plan": "Plan",
    "dashboard.action.planDetail": "Daily route",
    "dashboard.action.bookings": "Bookings",
    "dashboard.action.bookingsDetail": "Confirmations",
    "dashboard.action.money": "Money",
    "dashboard.action.moneyDetail": "Shared costs",
    "dashboard.action.packing": "Packing",
    "dashboard.action.packingDetail": "Checklist",
    "dashboard.action.documents": "Documents",
    "dashboard.action.documentsDetail": "Safe links",

    "sos.button": "SOS",
    "sos.ariaLabel": "Emergency quick access",
    "sos.title": "Emergency",
    "sos.description": "Choose a number, then confirm the call on your phone.",
    "sos.close": "Close",
    "sos.closeAria": "Close emergency quick access",
    "sos.callNumber": "Call {number}",

    "budgetWidget.eyebrow": "Money snapshot",
    "budgetWidget.title": "Outstanding by currency",
    "budgetWidget.description": "Full expense details stay in Budget.",
    "budgetWidget.openBudget": "Open Budget",
    "budgetWidget.loading": "Loading budget ledger...",
    "budgetWidget.retrying": "Retrying...",
    "budgetWidget.emptyTitle": "No shared expenses yet.",
    "budgetWidget.emptyDescription": "Add expenses from Budget, Itinerary, or Bookings when ready.",
    "budgetWidget.totalSpent": "Total spent",
    "budgetWidget.topSettlements": "Top settlements",
    "budgetWidget.allBalanced": "All outstanding expenses are balanced.",
    "budgetWidget.recentExpenses": "Recent expenses",
    "budgetWidget.pays": "pays",
    "budgetWidget.source.misc": "Misc",
    "budgetWidget.source.itinerary": "Itinerary",
    "budgetWidget.source.booking": "Booking",
    "budgetWidget.errorLoad": "Unable to load budget summary.",
    "budgetWidget.errorTimeout": "Request timed out. Please retry.",

    "reminders.eyebrow": "Important reminders",
    "reminders.title": "Top shared notes",
    "reminders.description": "Showing the highest priority reminders first.",
    "reminders.add": "Add reminder",
    "reminders.manage": "Manage",
    "reminders.showLess": "Show less",
    "reminders.filterAll": "All priorities",
    "reminders.label": "Reminder",
    "reminders.placeholder": "Example: Confirm hotel address",
    "reminders.saveChanges": "Save changes",
    "reminders.saving": "Saving...",
    "reminders.deleting": "Deleting...",
    "reminders.emptyFiltered": "No reminders match this filter yet.",
    "reminders.empty": "No reminders yet.",
    "reminders.showAll": "Show all {count} reminders",
    "reminders.required": "Reminder text is required.",
    "reminders.errorLoad": "Unable to load reminders.",
    "reminders.errorSave": "Unable to save reminder.",
    "reminders.errorDelete": "Unable to delete reminder.",
    "reminders.confirmDelete": "Delete this reminder?",

    "status.notBooked": "Not Booked",
    "status.pending": "Pending",
    "status.booked": "Booked",
    "status.paid": "Paid",
    "status.cancelled": "Cancelled",
    "status.needConfirmation": "Need Confirmation",
    "status.checkBeforeDeparture": "Check Before Departure",
    "status.confirmed": "Confirmed",
    "priority.high": "High",
    "priority.medium": "Medium",
    "priority.low": "Low",
    "option.all": "All",
    "category.flight": "Flight",
    "category.hotel": "Hotel",
    "category.train": "Train",
    "category.attraction": "Attraction",
    "category.restaurant": "Restaurant",
    "category.insurance": "Insurance",
    "category.other": "Other",
    "category.accommodation": "Accommodation",
    "category.transport": "Transport",
    "category.food": "Food",
    "category.documents": "Documents",
    "category.clothes": "Clothes",
    "category.electronics": "Electronics",
    "category.medicine": "Medicine",
    "category.toiletries": "Toiletries",
    "category.travelEssentials": "Travel Essentials",
    "category.sharedItems": "Shared Items",
    "category.personalCare": "Personal Care",
    "category.passport": "Passport",
    "category.receipt": "Receipt",
    "category.emergencyNumber": "Emergency Number",
    "category.traveller": "Traveller",
    "category.bank": "Bank",
    "category.embassy": "Embassy",
    "category.medical": "Medical",

    "page.itinerary.eyebrow": "Daily plan",
    "page.itinerary.title": "Itinerary",
    "page.itinerary.description": "Filter by city, open each day, and quickly find the plan, transport, tickets, base location, and map links.",
    "page.bookings.eyebrow": "Booking center",
    "page.bookings.title": "Bookings",
    "page.bookings.description": "Track flights, hotels, trains, attractions, restaurants, insurance, and items that still need confirmation.",
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
    "page.packing.eyebrow": "Checklist",
    "page.packing.title": "Packing List",
    "page.packing.description": "Shared packing checklist with traveler responsibilities, priorities, and packed status.",
    "page.documents.eyebrow": "Private links only",
    "page.documents.title": "Documents",
    "page.documents.description": "Store only private cloud link placeholders and safe summaries here. Do not upload real files into this project.",
    "page.more.eyebrow": "More tools",
    "page.more.title": "More",
    "page.more.description": "Secondary trip tools are grouped here so the phone navigation stays simple during the trip.",
    "page.more.open": "Open"
  },
  zh: {
    "language.label": "语言",
    "language.toggle": "EN / 中文",

    "nav.dashboard": "总览",
    "nav.home": "首页",
    "nav.itinerary": "行程",
    "nav.plan": "行程",
    "nav.bookings": "预订",
    "nav.book": "预订",
    "nav.budget": "预算",
    "nav.money": "费用",
    "nav.packing": "行李",
    "nav.pack": "行李",
    "nav.documents": "文件",
    "nav.docs": "文件",
    "nav.more": "更多",

    "common.add": "新增",
    "common.cancel": "取消",
    "common.close": "关闭",
    "common.delete": "删除",
    "common.edit": "编辑",
    "common.hide": "隐藏",
    "common.loading": "加载中",
    "common.open": "打开",
    "common.retry": "重试",
    "common.save": "保存",
    "common.show": "显示",
    "common.view": "查看",
    "common.call": "拨打",
    "common.map": "地图",
    "common.filter": "筛选",
    "common.by": "创建者",
    "common.priority": "优先级",
    "common.createdBy": "创建者",

    "dashboard.eyebrow": "私人旅行总览",
    "dashboard.travellers": "位成员",
    "dashboard.nextUp": "下一步",
    "dashboard.day": "第 {day} 天",
    "dashboard.viewItinerary": "查看行程",
    "dashboard.needsAttention": "需要关注",
    "dashboard.bookingItem": "个预订事项",
    "dashboard.bookingItems": "个预订事项",
    "dashboard.attentionHint": "待处理、未预订或等待确认。",
    "dashboard.openBookings": "打开预订",
    "dashboard.noBookingAttention": "目前没有需要关注的预订事项。",
    "dashboard.quickActions": "快捷入口",
    "dashboard.quickActionsHint": "需要完整功能时，从这里进入对应工具。",
    "dashboard.action.plan": "行程",
    "dashboard.action.planDetail": "每日路线",
    "dashboard.action.bookings": "预订",
    "dashboard.action.bookingsDetail": "确认事项",
    "dashboard.action.money": "费用",
    "dashboard.action.moneyDetail": "共同开销",
    "dashboard.action.packing": "行李",
    "dashboard.action.packingDetail": "清单",
    "dashboard.action.documents": "文件",
    "dashboard.action.documentsDetail": "安全链接",

    "sos.button": "SOS",
    "sos.ariaLabel": "紧急快速入口",
    "sos.title": "紧急信息",
    "sos.description": "选择号码后，在手机上确认拨打。",
    "sos.close": "关闭",
    "sos.closeAria": "关闭紧急快速入口",
    "sos.callNumber": "拨打 {number}",

    "budgetWidget.eyebrow": "费用快照",
    "budgetWidget.title": "按币种显示待结算",
    "budgetWidget.description": "完整费用明细保留在预算页面。",
    "budgetWidget.openBudget": "打开预算",
    "budgetWidget.loading": "正在加载费用账本...",
    "budgetWidget.retrying": "正在重试...",
    "budgetWidget.emptyTitle": "还没有共同费用。",
    "budgetWidget.emptyDescription": "准备好后，可从预算、行程或预订添加费用。",
    "budgetWidget.totalSpent": "已花费",
    "budgetWidget.topSettlements": "主要结算建议",
    "budgetWidget.allBalanced": "当前待结算费用已平衡。",
    "budgetWidget.recentExpenses": "最近费用",
    "budgetWidget.pays": "支付给",
    "budgetWidget.source.misc": "其他",
    "budgetWidget.source.itinerary": "行程",
    "budgetWidget.source.booking": "预订",
    "budgetWidget.errorLoad": "无法加载预算摘要。",
    "budgetWidget.errorTimeout": "请求超时，请重试。",

    "reminders.eyebrow": "重要提醒",
    "reminders.title": "共享提醒",
    "reminders.description": "优先显示最重要的提醒。",
    "reminders.add": "新增提醒",
    "reminders.manage": "管理",
    "reminders.showLess": "收起",
    "reminders.filterAll": "全部优先级",
    "reminders.label": "提醒",
    "reminders.placeholder": "例如：确认酒店地址",
    "reminders.saveChanges": "保存修改",
    "reminders.saving": "保存中...",
    "reminders.deleting": "删除中...",
    "reminders.emptyFiltered": "没有符合筛选的提醒。",
    "reminders.empty": "还没有提醒。",
    "reminders.showAll": "显示全部 {count} 条提醒",
    "reminders.required": "请填写提醒内容。",
    "reminders.errorLoad": "无法加载提醒。",
    "reminders.errorSave": "无法保存提醒。",
    "reminders.errorDelete": "无法删除提醒。",
    "reminders.confirmDelete": "删除这条提醒？",

    "status.notBooked": "未预订",
    "status.pending": "待处理",
    "status.booked": "已预订",
    "status.paid": "已付款",
    "status.cancelled": "已取消",
    "status.needConfirmation": "需确认",
    "status.checkBeforeDeparture": "出发前检查",
    "status.confirmed": "已确认",
    "priority.high": "高",
    "priority.medium": "中",
    "priority.low": "低",
    "option.all": "全部",
    "category.flight": "航班",
    "category.hotel": "酒店",
    "category.train": "火车",
    "category.attraction": "景点",
    "category.restaurant": "餐厅",
    "category.insurance": "保险",
    "category.other": "其他",
    "category.accommodation": "住宿",
    "category.transport": "交通",
    "category.food": "餐饮",
    "category.documents": "文件",
    "category.clothes": "衣物",
    "category.electronics": "电子用品",
    "category.medicine": "药品",
    "category.toiletries": "洗漱用品",
    "category.travelEssentials": "旅行必需品",
    "category.sharedItems": "共享物品",
    "category.personalCare": "个人护理",
    "category.passport": "护照",
    "category.receipt": "收据",
    "category.emergencyNumber": "紧急号码",
    "category.traveller": "旅伴",
    "category.bank": "银行",
    "category.embassy": "大使馆",
    "category.medical": "医疗",

    "page.itinerary.eyebrow": "每日计划",
    "page.itinerary.title": "行程",
    "page.itinerary.description": "按城市筛选并查看每日安排、交通、票务、住宿地点和地图链接。",
    "page.bookings.eyebrow": "预订中心",
    "page.bookings.title": "预订",
    "page.bookings.description": "跟踪航班、酒店、火车、景点、餐厅、保险以及仍需确认的事项。",
    "page.budget.eyebrow": "共同费用",
    "page.budget.title": "预算",
    "page.budget.description": "按币种计算总费用、人均分摊、已付款金额和简单结算建议。",
    "page.budget.summary": "摘要",
    "page.budget.totalTripCost": "旅行总费用",
    "page.budget.costPerPerson": "人均费用",
    "page.budget.paidByEachPerson": "各自已付",
    "page.budget.owedByEachPerson": "各自应付",
    "page.budget.settlementSummary": "结算摘要",
    "page.budget.noSettlement": "此币种无需结算。",
    "page.budget.pays": "支付给",
    "page.budget.unsettledExpenses": "未结算费用",
    "page.budget.paidBy": "付款人",
    "page.budget.splitAmong": "分摊成员",
    "page.packing.eyebrow": "清单",
    "page.packing.title": "行李清单",
    "page.packing.description": "共享行李清单，可记录成员职责、优先级和打包状态。",
    "page.documents.eyebrow": "仅私人链接",
    "page.documents.title": "文件",
    "page.documents.description": "这里只保存私人云端链接占位和安全摘要，不要上传真实文件到项目里。",
    "page.more.eyebrow": "更多工具",
    "page.more.title": "更多",
    "page.more.description": "次要旅行工具集中在这里，让手机底部导航保持简洁。",
    "page.more.open": "打开"
  }
} as const;

export type TranslationKey = keyof typeof translations.en;

type TranslationParams = Record<string, string | number>;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function normalizeLanguage(value: string | null): Language | null {
  return value === "zh" || value === "en" ? value : null;
}

function getInitialStoredLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  const current = normalizeLanguage(window.localStorage.getItem(languageStorageKey));
  if (current) {
    return current;
  }

  const legacy = normalizeLanguage(window.localStorage.getItem(legacyLanguageStorageKey));
  if (legacy) {
    window.localStorage.setItem(languageStorageKey, legacy);
    window.localStorage.removeItem(legacyLanguageStorageKey);
    return legacy;
  }

  return "en";
}

function interpolate(value: string, params?: TranslationParams) {
  if (!params) {
    return value;
  }

  return value.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    setLanguageState(getInitialStoredLanguage());
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(languageStorageKey, nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((currentLanguage) => {
      const nextLanguage = currentLanguage === "zh" ? "en" : "zh";
      window.localStorage.setItem(languageStorageKey, nextLanguage);
      return nextLanguage;
    });
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t: (key, params) => interpolate(translations[language][key] ?? translations.en[key], params)
    }),
    [language, setLanguage, toggleLanguage]
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
