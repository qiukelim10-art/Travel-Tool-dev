import type {
  Attraction,
  Booking,
  DocumentLink,
  EmergencyInfo,
  Expense,
  ItineraryDay,
  MapLocation,
  PackingItem,
  Restaurant,
  TripMap
} from "@/data/tripData";
import type { Language } from "@/lib/i18n";

type Localizable =
  | Attraction
  | Booking
  | DocumentLink
  | EmergencyInfo
  | Expense
  | ItineraryDay
  | MapLocation
  | PackingItem
  | Restaurant
  | TripMap;

const zhText: Record<string, string> = {
  "Italy Trip 2026": "意大利之旅 2026",
  "October 2026": "2026年10月",
  "Person A": "成员 A",
  "Person B": "成员 B",
  "Person C": "成员 C",
  "Person D": "成员 D",
  Everyone: "所有人",
  Italy: "意大利",
  Rome: "罗马",
  Florence: "佛罗伦萨",
  Venice: "威尼斯",
  Milan: "米兰",
  "Vatican City": "梵蒂冈",
  "All cities": "全部城市",
  "Private planning site for the 4 travellers. Placeholder data only.":
    "4 位旅客专用的私人计划网站。目前仅使用占位资料。",
  Pending: "待处理",
  "Need Confirmation": "需确认",
  "Not Booked": "未预订",
  Booked: "已预订",
  Paid: "已付款",
  Cancelled: "已取消",
  "Check Before Departure": "出发前检查",
  Confirmed: "已确认",
  Urgent: "紧急",
  Flight: "机票",
  Flights: "机票",
  Hotel: "酒店",
  Hotels: "酒店",
  Train: "火车",
  Trains: "火车",
  Attraction: "景点",
  Attractions: "景点",
  Restaurant: "餐厅",
  Insurance: "保险",
  Other: "其他",
  Accommodation: "住宿",
  Transport: "交通",
  Food: "餐饮",
  Documents: "文件",
  Clothes: "衣物",
  Electronics: "电子用品",
  Medicine: "药品",
  Toiletries: "洗漱用品",
  "Travel Essentials": "旅行必需品",
  "Shared Items": "共同物品",
  Passport: "护照",
  Receipt: "收据",
  "Emergency Number": "紧急号码",
  Traveller: "旅伴",
  Bank: "银行",
  Embassy: "大使馆",
  Medical: "医疗",
  "Train Station": "火车站",
  Airport: "机场",
  Pharmacy: "药房",
  Supermarket: "超市",
  Emergency: "紧急",
  "Must Try": "必吃",
  "Good to Have": "可选",
  Backup: "备用",
  Budget: "平价",
  Moderate: "中等",
  Splurge: "较贵",
  "Not Needed": "不需要",
  "Must Visit": "必去",
  "Nice to Have": "可选",
  Optional: "备选",
  "Lock flights and first hotel": "锁定机票和第一间酒店",
  "Check passport validity before booking final tickets.":
    "预订最终机票前，先检查护照有效期。",
  "Confirm ETIAS and Schengen entry requirements before departure.":
    "出发前确认 ETIAS 和申根入境要求。",
  "Buy travel insurance before paying major bookings.":
    "支付大额预订前先购买旅行保险。",
  "Download offline maps for each city.": "下载每个城市的离线地图。",
  "Save tickets and hotel confirmations offline.": "离线保存门票和酒店确认资料。",
  "Arrive in Rome": "抵达罗马",
  "Airport transfer, hotel check-in, easy dinner near base.":
    "机场交通、酒店入住，并在住宿附近轻松晚餐。",
  "Depart Singapore or connect toward Rome.": "从新加坡出发，或转机前往罗马。",
  "Arrive at Rome airport.": "抵达罗马机场。",
  "Transfer to hotel and check in.": "前往酒店并办理入住。",
  "Short walk near hotel.": "在酒店附近简单散步。",
  "Simple dinner and early rest.": "简单晚餐并早点休息。",
  "Airport train or private transfer": "机场火车或私人接送",
  "Walk near hotel": "酒店附近步行",
  "Dinner near hotel": "酒店附近晚餐",
  "Flight confirmation placeholder": "机票确认占位",
  "Airport transfer pending": "机场交通待定",
  "Keep the first day light in case of flight delays.": "第一天保持轻松，以防航班延误。",
  "Rome base area": "罗马住宿区域",
  "Ancient Rome": "古罗马",
  "Colosseum, Roman Forum, Trevi Fountain.": "斗兽场、古罗马广场、特莱维喷泉。",
  "Colosseum timed entry placeholder.": "斗兽场定时入场占位。",
  "Roman Forum walk.": "古罗马广场步行。",
  "Lunch near Monti.": "在 Monti 附近午餐。",
  "Capitoline Hill or Pantheon area.": "卡比托利欧山或万神殿区域。",
  "Trevi Fountain and dinner reservation placeholder.": "特莱维喷泉和晚餐预订占位。",
  Metro: "地铁",
  Walk: "步行",
  "Lunch near Monti": "Monti 附近午餐",
  "Dinner near Trevi": "特莱维附近晚餐",
  "Colosseum tickets pending": "斗兽场门票待定",
  "Book timed tickets early once the itinerary is confirmed.":
    "行程确认后尽早预订定时门票。",
  Colosseum: "斗兽场",
  "Vatican Day": "梵蒂冈日",
  "Vatican Museums and St. Peter's Basilica.": "梵蒂冈博物馆和圣彼得大教堂。",
  "Vatican Museums timed entry placeholder.": "梵蒂冈博物馆定时入场占位。",
  "St. Peter's Basilica.": "圣彼得大教堂。",
  "Coffee break near Prati.": "在 Prati 附近咖啡休息。",
  "Dinner in Trastevere placeholder.": "Trastevere 晚餐占位。",
  "Taxi if needed": "需要时打车",
  "Lunch near Vatican": "梵蒂冈附近午餐",
  "Dinner in Trastevere": "Trastevere 晚餐",
  "Vatican Museums tickets pending": "梵蒂冈博物馆门票待定",
  "Dress code required for religious sites.": "宗教场所需要符合着装要求。",
  "Vatican Museums": "梵蒂冈博物馆",
  "Rome to Florence": "罗马到佛罗伦萨",
  "Train to Florence, Duomo area, sunset viewpoint.":
    "搭火车去佛罗伦萨，逛主教座堂区域和日落观景点。",
  "Check out from Rome hotel.": "从罗马酒店退房。",
  "Train from Rome to Florence.": "搭火车从罗马到佛罗伦萨。",
  "Check in to Florence hotel.": "入住佛罗伦萨酒店。",
  "Duomo area walk.": "主教座堂区域步行。",
  "Piazzale Michelangelo sunset.": "米开朗琪罗广场看日落。",
  "Dinner near Santo Spirito.": "Santo Spirito 附近晚餐。",
  "High-speed train": "高速火车",
  "Train station snack": "车站简餐",
  "Dinner in Florence": "佛罗伦萨晚餐",
  "Rome to Florence train pending": "罗马到佛罗伦萨火车待定",
  "Keep luggage transfer simple and avoid tight train timing.":
    "行李移动尽量简单，避免火车时间太紧。",
  "Florence Duomo": "佛罗伦萨主教座堂",
  "Florence Art and Food": "佛罗伦萨艺术与美食",
  "Uffizi or Accademia, food stops, old bridge.":
    "乌菲兹或学院美术馆、美食点、老桥。",
  "Uffizi Gallery or Accademia timed ticket placeholder.":
    "乌菲兹或学院美术馆定时门票占位。",
  "Ponte Vecchio.": "老桥。",
  "Mercato Centrale or cafe break.": "中央市场或咖啡休息。",
  "Dinner reservation placeholder.": "晚餐预订占位。",
  "Florentine sandwich placeholder": "佛罗伦萨三明治占位",
  "Dinner reservation pending": "晚餐预订待定",
  "Museum tickets pending": "博物馆门票待定",
  "Pick one major museum to avoid overloading the day.":
    "选择一个主要博物馆，避免当天安排过满。",
  "Uffizi Gallery": "乌菲兹美术馆",
  "Florence to Venice": "佛罗伦萨到威尼斯",
  "Train to Venice, canals, Rialto area.": "搭火车去威尼斯，运河和里亚托区域。",
  "Check out from Florence hotel.": "从佛罗伦萨酒店退房。",
  "Train to Venice.": "搭火车去威尼斯。",
  "Check in to Venice hotel.": "入住威尼斯酒店。",
  "Rialto Bridge walk.": "里亚托桥步行。",
  "Canal-side dinner placeholder.": "运河边晚餐占位。",
  Vaporetto: "水上巴士",
  "Lunch near station": "车站附近午餐",
  "Dinner in Venice": "威尼斯晚餐",
  "Florence to Venice train pending": "佛罗伦萨到威尼斯火车待定",
  "Pack light for bridges and walking in Venice.": "威尼斯桥多路多，尽量轻装。",
  "Rialto Bridge": "里亚托桥",
  "Venice Main Sights": "威尼斯主要景点",
  "St. Mark's Square, Doge's Palace, relaxed canal walk.":
    "圣马可广场、总督府、轻松运河散步。",
  "St. Mark's Square.": "圣马可广场。",
  "Doge's Palace ticket placeholder.": "总督府门票占位。",
  "Lunch near Castello.": "Castello 附近午餐。",
  "Optional gondola or lagoon ride.": "可选贡多拉或泻湖游船。",
  "Cicchetti dinner route placeholder.": "Cicchetti 晚餐路线占位。",
  "Lunch near Castello": "Castello 附近午餐",
  "Cicchetti dinner": "Cicchetti 晚餐",
  "Doge's Palace pending": "总督府待定",
  "Avoid rushing; Venice is better with flexible walking time.":
    "不要赶行程；威尼斯更适合留弹性步行时间。",
  "St. Mark's Square": "圣马可广场",
  "Venice to Milan": "威尼斯到米兰",
  "Train to Milan, Duomo, Galleria.": "搭火车去米兰，参观主教座堂和拱廊。",
  "Check out from Venice hotel.": "从威尼斯酒店退房。",
  "Train to Milan.": "搭火车去米兰。",
  "Check in to Milan hotel.": "入住米兰酒店。",
  "Milan Duomo area.": "米兰主教座堂区域。",
  "Dinner near Brera placeholder.": "Brera 附近晚餐占位。",
  "Lunch on arrival": "抵达后午餐",
  "Dinner near Brera": "Brera 附近晚餐",
  "Venice to Milan train pending": "威尼斯到米兰火车待定",
  "Duomo rooftop pending": "主教座堂屋顶待定",
  "Confirm train station and hotel luggage timing.": "确认车站和酒店行李时间安排。",
  "Milan Duomo": "米兰主教座堂",
  "Singapore to Rome flight": "新加坡到罗马航班",
  "Placeholder only. Replace after flights are confirmed.":
    "仅占位。航班确认后再替换。",
  "Rome hotel": "罗马酒店",
  "Use private booking link later.": "之后使用私人预订链接。",
  "Rome to Florence train": "罗马到佛罗伦萨火车",
  "Roma Termini": "罗马 Termini 车站",
  "Book after city dates are final.": "城市日期确定后再预订。",
  "Colosseum timed entry": "斗兽场定时入场",
  "Timed entry recommended.": "建议预订定时入场。",
  "Travel insurance": "旅行保险",
  "Buy before major non-refundable bookings.": "在支付主要不可退款预订前购买。",
  "Flight planning deposit placeholder": "机票计划订金占位",
  "Rome hotel deposit placeholder": "罗马酒店订金占位",
  "Planning dinner placeholder": "计划会议晚餐占位",
  "Museum ticket hold placeholder": "博物馆门票预留占位",
  "Italy emergency number": "意大利紧急号码",
  "Use for police, ambulance, fire, or urgent danger.":
    "用于报警、救护车、消防或紧急危险情况。",
  "Placeholder phone number.": "电话号码占位。",
  "Rome hotel address placeholder": "罗马酒店地址占位",
  "Replace with real hotel address only if access is protected.":
    "只有在访问受保护时，才替换为真实酒店地址。",
  "Travel insurance hotline": "旅行保险热线",
  "Placeholder hotline.": "热线占位。",
  "Lost card hotline": "银行卡挂失热线",
  "Add each bank's real emergency number later.": "之后添加各银行真实紧急号码。",
  "Singapore consular assistance": "新加坡领事协助",
  "Consular assistance link placeholder": "领事协助链接占位",
  "Confirm official contact details before departure.": "出发前确认官方联系方式。",
  "Nearest hospital or pharmacy": "最近医院或药房",
  "Search nearby medical help": "搜索附近医疗帮助",
  "Use location sharing during the trip.": "旅途中使用位置共享。",
  "Main trip map": "主旅行地图",
  "Placeholder embed. Replace with a private Google My Maps embed link later.":
    "地图嵌入占位。之后替换为私人 Google My Maps 嵌入链接。",
  "Rome map": "罗马地图",
  "Rome hotels, attractions, restaurants, and stations placeholder.":
    "罗马酒店、景点、餐厅和车站占位。",
  "Florence map": "佛罗伦萨地图",
  "Florence base area and food stops placeholder.": "佛罗伦萨住宿区域和美食点占位。",
  "Venice map": "威尼斯地图",
  "Venice walking and vaporetto planning placeholder.": "威尼斯步行和水上巴士计划占位。",
  "Milan map": "米兰地图",
  "Milan final city and airport transfer placeholder.": "米兰最后一站和机场交通占位。",
  "Rome hotel placeholder": "罗马酒店占位",
  "Rome hotel area placeholder": "罗马酒店区域占位",
  "Replace only after deciding privacy handling.": "确定隐私处理方式后再替换。",
  "Piazza del Colosseo, Rome": "罗马斗兽场广场",
  "Timed ticket likely needed.": "可能需要定时门票。",
  "Roma Termini station": "罗马 Termini 车站",
  "Florence hotel placeholder": "佛罗伦萨酒店占位",
  "Florence hotel area placeholder": "佛罗伦萨酒店区域占位",
  "Venice hotel placeholder": "威尼斯酒店占位",
  "Venice hotel area placeholder": "威尼斯酒店区域占位",
  "Milan hotel placeholder": "米兰酒店占位",
  "Milan hotel area placeholder": "米兰酒店区域占位",
  "Duomo di Milano": "米兰主教座堂",
  "Nearest pharmacy search": "最近药房搜索",
  "Use current location during the trip": "旅途中使用当前位置",
  "Rome pasta placeholder": "罗马意面占位",
  "Roman pasta": "罗马意面",
  "Shortlist a real restaurant later.": "之后筛选真实餐厅。",
  "Trastevere dinner placeholder": "Trastevere 晚餐占位",
  Italian: "意大利菜",
  "Florence sandwich placeholder": "佛罗伦萨三明治占位",
  Sandwich: "三明治",
  "Florence steak placeholder": "佛罗伦萨牛排占位",
  Tuscan: "托斯卡纳菜",
  "Venice cicchetti route placeholder": "威尼斯 Cicchetti 路线占位",
  Cicchetti: "Cicchetti 小吃",
  "Milan risotto placeholder": "米兰烩饭占位",
  Milanese: "米兰菜",
  "2-3 hours": "2-3 小时",
  "Book timed entry once dates are final.": "日期确定后预订定时入场。",
  "3-4 hours": "3-4 小时",
  "Dress code applies nearby religious sites.": "附近宗教场所需注意着装要求。",
  "Piazzale Michelangelo": "米开朗琪罗广场",
  "1 hour": "1 小时",
  "Doge's Palace": "总督府",
  "2 hours": "2 小时",
  "Milan Duomo rooftop": "米兰主教座堂屋顶",
  "1.5-2 hours": "1.5-2 小时",
  "Travel insurance summary": "旅行保险摘要",
  "Comfortable walking shoes": "舒适步行鞋",
  "Light rain jacket or umbrella": "轻便雨衣或雨伞",
  "Power adapter": "电源转换插头",
  "Power bank": "移动电源",
  "Basic medicine kit": "基础药品包",
  "Toiletries pouch": "洗漱包",
  "Offline maps downloaded": "已下载离线地图",
  "Printed backup itinerary": "纸质备用行程",
  "Flight confirmation private link placeholder": "机票确认私人链接占位",
  "Store the real confirmation in private cloud storage only.":
    "真实确认文件只存放在私人云端空间。",
  "Hotel bookings folder placeholder": "酒店预订文件夹占位",
  "Use a private folder shared only with the 4 travellers.":
    "使用只共享给 4 位旅客的私人文件夹。",
  "Train tickets folder placeholder": "火车票文件夹占位",
  "Replace with a private link after tickets are booked.":
    "火车票预订后替换为私人链接。",
  "Attraction tickets folder placeholder": "景点门票文件夹占位",
  "Use only summary links here, not file uploads.":
    "这里只放摘要链接，不上传文件。",
  "Insurance policy private link placeholder": "保险保单私人链接占位",
  "Do not paste policy numbers or personal identifiers into the repo.":
    "不要把保单号码或个人身份资料贴进 repo。",
  "Payment receipts folder placeholder": "付款收据文件夹占位",
  "Keep receipts in private storage and record only safe summaries here.":
    "收据保存在私人空间，此处只记录安全摘要。"
};

function translateValue(language: Language, value: string) {
  return language === "zh" ? zhText[value] ?? value : value;
}

function translateArray(language: Language, values: string[]) {
  return values.map((value) => translateValue(language, value));
}

export function translateText(language: Language, value?: string) {
  return value ? translateValue(language, value) : value;
}

export function localizeList<T extends Localizable>(language: Language, items: T[]): T[] {
  return items.map((item) => localizeItem(language, item));
}

export function localizeItem<T extends Localizable>(language: Language, item: T): T {
  if (language === "en") {
    return item;
  }

  const localized: Record<string, unknown> = { ...item };

  for (const [key, value] of Object.entries(localized)) {
    if (typeof value === "string") {
      localized[key] = translateValue(language, value);
    }

    if (Array.isArray(value) && value.every((entry) => typeof entry === "string")) {
      localized[key] = translateArray(language, value);
    }

    if (key === "mapLinks" && Array.isArray(value)) {
      localized[key] = value.map((link) => ({
        ...link,
        label: translateValue(language, link.label)
      }));
    }
  }

  return localized as T;
}

export function translateOption(language: Language, value: string) {
  return value === "All" ? (language === "zh" ? "全部" : "All") : translateValue(language, value);
}
