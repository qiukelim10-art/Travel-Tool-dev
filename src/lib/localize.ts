import type { Language } from "@/lib/i18n";

const uiValueTranslations: Record<string, { en: string; zh: string }> = {
  "Not Booked": { en: "Not Booked", zh: "未预订" },
  Pending: { en: "Pending", zh: "待处理" },
  Booked: { en: "Booked", zh: "已预订" },
  Paid: { en: "Paid", zh: "已付款" },
  Cancelled: { en: "Cancelled", zh: "已取消" },
  "Need Confirmation": { en: "Need Confirmation", zh: "需确认" },
  "Check Before Departure": { en: "Check Before Departure", zh: "出发前检查" },
  Confirmed: { en: "Confirmed", zh: "已确认" },
  Outstanding: { en: "Outstanding", zh: "待结算" },
  Settled: { en: "Settled", zh: "已结算" },
  High: { en: "High", zh: "高" },
  Medium: { en: "Medium", zh: "中" },
  Low: { en: "Low", zh: "低" },
  All: { en: "All", zh: "全部" },
  Flight: { en: "Flight", zh: "航班" },
  Hotel: { en: "Hotel", zh: "酒店" },
  Train: { en: "Train", zh: "火车" },
  Attraction: { en: "Attraction", zh: "景点" },
  Restaurant: { en: "Restaurant", zh: "餐厅" },
  Insurance: { en: "Insurance", zh: "保险" },
  Shopping: { en: "Shopping", zh: "购物" },
  Other: { en: "Other", zh: "其他" },
  Accommodation: { en: "Accommodation", zh: "住宿" },
  Transport: { en: "Transport", zh: "交通" },
  Food: { en: "Food", zh: "餐饮" },
  Documents: { en: "Documents", zh: "文件" },
  Clothes: { en: "Clothes", zh: "衣物" },
  Electronics: { en: "Electronics", zh: "电子用品" },
  Medicine: { en: "Medicine", zh: "药品" },
  Toiletries: { en: "Toiletries", zh: "洗漱用品" },
  "Travel Essentials": { en: "Travel Essentials", zh: "旅行必需品" },
  "Shared Items": { en: "Shared Items", zh: "共享物品" },
  "Personal Care": { en: "Personal Care", zh: "个人护理" },
  Passport: { en: "Passport", zh: "护照" },
  Receipt: { en: "Receipt", zh: "收据" },
  "Emergency Number": { en: "Emergency Number", zh: "紧急号码" },
  Traveller: { en: "Traveller", zh: "旅伴" },
  Bank: { en: "Bank", zh: "银行" },
  Embassy: { en: "Embassy", zh: "大使馆" },
  Medical: { en: "Medical", zh: "医疗" },
  itinerary: { en: "Itinerary", zh: "行程" },
  booking: { en: "Booking", zh: "预订" },
  misc: { en: "Misc", zh: "其他" }
};

export function translateText(language: Language, value?: string) {
  if (!value) {
    return value;
  }

  return uiValueTranslations[value]?.[language] ?? value;
}

export function translateOption(language: Language, value: string) {
  return translateText(language, value) ?? value;
}
