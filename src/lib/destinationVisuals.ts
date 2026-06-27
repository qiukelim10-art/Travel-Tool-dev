export type DestinationRegion =
  | "japan"
  | "korea"
  | "china"
  | "italy"
  | "uk"
  | "france"
  | "switzerland"
  | "spain"
  | "austria"
  | "czechia"
  | "hungary"
  | "generic";

export type DestinationVisualIdentity = {
  region: DestinationRegion;
  toneClass: string;
  shapeClass: string;
  countryCode: string;
  countryName: string;
  countryCodes: string[];
  countryNames: string[];
  destinationLabel: string;
  stampLabel: string;
  stampDetail: string;
  routeMarks: string[];
  destinations: TripRouteDestination[];
};

export type TripRouteDestination = {
  name: string;
  lat?: number;
  lng?: number;
  visualPosition?: {
    x: number;
    y: number;
  };
  countryCode?: string;
  countryName?: string;
  date?: string | null;
};

export type DestinationRouteStop = {
  city: string;
  country?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

type DestinationVisualInput = {
  destination?: string;
  routeCities?: string[];
  routeLabel?: string;
  routeStops?: DestinationRouteStop[];
  tripName?: string;
};

type DestinationVisualPreset = {
  region: DestinationRegion;
  countryCode: string;
  countryName: string;
  keywords: string[];
};

const routeSplitPattern = /\s*(?:->|→|,|，|\/|;|；|、|\n)\s*/u;

const presets: DestinationVisualPreset[] = [
  {
    region: "japan",
    countryCode: "JP",
    countryName: "Japan",
    keywords: [
      "japan",
      "日本",
      "tokyo",
      "東京",
      "osaka",
      "大阪",
      "kyoto",
      "京都",
      "nara",
      "奈良",
      "sapporo",
      "札幌",
      "fukuoka",
      "福岡",
      "hiroshima",
      "広島"
    ]
  },
  {
    region: "korea",
    countryCode: "KR",
    countryName: "South Korea",
    keywords: [
      "korea",
      "south korea",
      "韩国",
      "韓國",
      "seoul",
      "首尔",
      "首爾",
      "busan",
      "釜山",
      "jeju",
      "济州",
      "濟州"
    ]
  },
  {
    region: "china",
    countryCode: "CN",
    countryName: "China",
    keywords: [
      "china",
      "中国",
      "中國",
      "beijing",
      "北京",
      "shanghai",
      "上海",
      "suzhou",
      "苏州",
      "guangzhou",
      "广州",
      "廣州",
      "shenzhen",
      "深圳",
      "chengdu",
      "成都",
      "hangzhou",
      "杭州"
    ]
  },
  {
    region: "italy",
    countryCode: "IT",
    countryName: "Italy",
    keywords: [
      "italy",
      "italia",
      "意大利",
      "rome",
      "roma",
      "罗马",
      "羅馬",
      "venice",
      "venezia",
      "威尼斯",
      "florence",
      "firenze",
      "佛罗伦萨",
      "佛羅倫斯",
      "milan",
      "milano",
      "米兰",
      "米蘭",
      "naples",
      "napoli",
      "那不勒斯"
    ]
  },
  {
    region: "uk",
    countryCode: "GB",
    countryName: "United Kingdom",
    keywords: [
      "united kingdom",
      "great britain",
      "england",
      "scotland",
      "wales",
      "uk",
      "london",
      "edinburgh",
      "manchester",
      "bath",
      "oxford",
      "cambridge",
      "york",
      "英国",
      "英國",
      "伦敦",
      "倫敦",
      "爱丁堡",
      "愛丁堡",
      "曼彻斯特",
      "曼徹斯特"
    ]
  },
  {
    region: "france",
    countryCode: "FR",
    countryName: "France",
    keywords: [
      "france",
      "paris",
      "nice",
      "lyon",
      "marseille",
      "bordeaux",
      "strasbourg",
      "avignon",
      "法国",
      "法國",
      "巴黎",
      "尼斯",
      "里昂",
      "马赛",
      "馬賽"
    ]
  },
  {
    region: "switzerland",
    countryCode: "CH",
    countryName: "Switzerland",
    keywords: [
      "switzerland",
      "swiss",
      "zurich",
      "lucerne",
      "interlaken",
      "geneva",
      "bern",
      "zermatt",
      "lausanne",
      "瑞士",
      "苏黎世",
      "蘇黎世",
      "卢塞恩",
      "盧塞恩",
      "因特拉肯",
      "日内瓦",
      "日內瓦",
      "伯尔尼",
      "伯爾尼",
      "采尔马特",
      "策马特"
    ]
  },
  {
    region: "spain",
    countryCode: "ES",
    countryName: "Spain",
    keywords: [
      "spain",
      "madrid",
      "barcelona",
      "seville",
      "valencia",
      "granada",
      "malaga",
      "bilbao",
      "西班牙",
      "马德里",
      "馬德里",
      "巴塞罗那",
      "巴塞羅那",
      "塞维利亚",
      "塞維利亞",
      "瓦伦西亚",
      "瓦倫西亞"
    ]
  },
  {
    region: "austria",
    countryCode: "AT",
    countryName: "Austria",
    keywords: [
      "austria",
      "vienna",
      "salzburg",
      "innsbruck",
      "hallstatt",
      "graz",
      "linz",
      "奥地利",
      "奧地利",
      "维也纳",
      "維也納",
      "萨尔茨堡",
      "薩爾茨堡",
      "因斯布鲁克",
      "因斯布魯克",
      "哈尔施塔特",
      "哈爾施塔特"
    ]
  },
  {
    region: "czechia",
    countryCode: "CZ",
    countryName: "Czechia",
    keywords: [
      "czechia",
      "czech republic",
      "czech",
      "prague",
      "cesky krumlov",
      "brno",
      "karlovy vary",
      "ostrava",
      "捷克",
      "布拉格",
      "克鲁姆洛夫",
      "克魯姆洛夫",
      "布尔诺",
      "布爾諾"
    ]
  },
  {
    region: "hungary",
    countryCode: "HU",
    countryName: "Hungary",
    keywords: [
      "hungary",
      "budapest",
      "eger",
      "szeged",
      "debrecen",
      "pecs",
      "匈牙利",
      "布达佩斯",
      "布達佩斯"
    ]
  }
];

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  beijing: { lat: 39.9042, lng: 116.4074 },
  北京: { lat: 39.9042, lng: 116.4074 },
  shanghai: { lat: 31.2304, lng: 121.4737 },
  上海: { lat: 31.2304, lng: 121.4737 },
  hangzhou: { lat: 30.2741, lng: 120.1551 },
  杭州: { lat: 30.2741, lng: 120.1551 },
  suzhou: { lat: 31.2989, lng: 120.5853 },
  苏州: { lat: 31.2989, lng: 120.5853 },
  guangzhou: { lat: 23.1291, lng: 113.2644 },
  广州: { lat: 23.1291, lng: 113.2644 },
  shenzhen: { lat: 22.5431, lng: 114.0579 },
  深圳: { lat: 22.5431, lng: 114.0579 },
  chengdu: { lat: 30.5728, lng: 104.0668 },
  成都: { lat: 30.5728, lng: 104.0668 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  東京: { lat: 35.6762, lng: 139.6503 },
  osaka: { lat: 34.6937, lng: 135.5023 },
  大阪: { lat: 34.6937, lng: 135.5023 },
  kyoto: { lat: 35.0116, lng: 135.7681 },
  京都: { lat: 35.0116, lng: 135.7681 },
  nara: { lat: 34.6851, lng: 135.8048 },
  奈良: { lat: 34.6851, lng: 135.8048 },
  sapporo: { lat: 43.0618, lng: 141.3545 },
  札幌: { lat: 43.0618, lng: 141.3545 },
  fukuoka: { lat: 33.5902, lng: 130.4017 },
  福岡: { lat: 33.5902, lng: 130.4017 },
  hiroshima: { lat: 34.3853, lng: 132.4553 },
  広島: { lat: 34.3853, lng: 132.4553 },
  nagoya: { lat: 35.1815, lng: 136.9066 },
  seoul: { lat: 37.5665, lng: 126.978 },
  首尔: { lat: 37.5665, lng: 126.978 },
  首爾: { lat: 37.5665, lng: 126.978 },
  busan: { lat: 35.1796, lng: 129.0756 },
  釜山: { lat: 35.1796, lng: 129.0756 },
  jeju: { lat: 33.4996, lng: 126.5312 },
  济州: { lat: 33.4996, lng: 126.5312 },
  濟州: { lat: 33.4996, lng: 126.5312 },
  incheon: { lat: 37.4563, lng: 126.7052 },
  daegu: { lat: 35.8714, lng: 128.6014 },
  gyeongju: { lat: 35.8562, lng: 129.2247 },
  rome: { lat: 41.9028, lng: 12.4964 },
  roma: { lat: 41.9028, lng: 12.4964 },
  罗马: { lat: 41.9028, lng: 12.4964 },
  florence: { lat: 43.7696, lng: 11.2558 },
  firenze: { lat: 43.7696, lng: 11.2558 },
  佛罗伦萨: { lat: 43.7696, lng: 11.2558 },
  venice: { lat: 45.4408, lng: 12.3155 },
  venezia: { lat: 45.4408, lng: 12.3155 },
  威尼斯: { lat: 45.4408, lng: 12.3155 },
  milan: { lat: 45.4642, lng: 9.19 },
  milano: { lat: 45.4642, lng: 9.19 },
  米兰: { lat: 45.4642, lng: 9.19 },
  naples: { lat: 40.8518, lng: 14.2681 },
  napoli: { lat: 40.8518, lng: 14.2681 },
  那不勒斯: { lat: 40.8518, lng: 14.2681 },
  bologna: { lat: 44.4949, lng: 11.3426 },
  pisa: { lat: 43.7228, lng: 10.4017 },
  london: { lat: 51.5072, lng: -0.1276 },
  伦敦: { lat: 51.5072, lng: -0.1276 },
  倫敦: { lat: 51.5072, lng: -0.1276 },
  edinburgh: { lat: 55.9533, lng: -3.1883 },
  爱丁堡: { lat: 55.9533, lng: -3.1883 },
  愛丁堡: { lat: 55.9533, lng: -3.1883 },
  manchester: { lat: 53.4808, lng: -2.2426 },
  曼彻斯特: { lat: 53.4808, lng: -2.2426 },
  曼徹斯特: { lat: 53.4808, lng: -2.2426 },
  bath: { lat: 51.3811, lng: -2.359 },
  oxford: { lat: 51.752, lng: -1.2577 },
  cambridge: { lat: 52.2053, lng: 0.1218 },
  york: { lat: 53.959, lng: -1.0815 },
  glasgow: { lat: 55.8642, lng: -4.2518 },
  liverpool: { lat: 53.4084, lng: -2.9916 },
  paris: { lat: 48.8566, lng: 2.3522 },
  巴黎: { lat: 48.8566, lng: 2.3522 },
  nice: { lat: 43.7102, lng: 7.262 },
  尼斯: { lat: 43.7102, lng: 7.262 },
  lyon: { lat: 45.764, lng: 4.8357 },
  里昂: { lat: 45.764, lng: 4.8357 },
  marseille: { lat: 43.2965, lng: 5.3698 },
  马赛: { lat: 43.2965, lng: 5.3698 },
  馬賽: { lat: 43.2965, lng: 5.3698 },
  bordeaux: { lat: 44.8378, lng: -0.5792 },
  strasbourg: { lat: 48.5734, lng: 7.7521 },
  avignon: { lat: 43.9493, lng: 4.8055 },
  zurich: { lat: 47.3769, lng: 8.5417 },
  苏黎世: { lat: 47.3769, lng: 8.5417 },
  蘇黎世: { lat: 47.3769, lng: 8.5417 },
  lucerne: { lat: 47.0502, lng: 8.3093 },
  卢塞恩: { lat: 47.0502, lng: 8.3093 },
  盧塞恩: { lat: 47.0502, lng: 8.3093 },
  interlaken: { lat: 46.6863, lng: 7.8632 },
  因特拉肯: { lat: 46.6863, lng: 7.8632 },
  geneva: { lat: 46.2044, lng: 6.1432 },
  日内瓦: { lat: 46.2044, lng: 6.1432 },
  日內瓦: { lat: 46.2044, lng: 6.1432 },
  bern: { lat: 46.948, lng: 7.4474 },
  伯尔尼: { lat: 46.948, lng: 7.4474 },
  伯爾尼: { lat: 46.948, lng: 7.4474 },
  zermatt: { lat: 46.0207, lng: 7.7491 },
  采尔马特: { lat: 46.0207, lng: 7.7491 },
  策马特: { lat: 46.0207, lng: 7.7491 },
  lausanne: { lat: 46.5197, lng: 6.6323 },
  madrid: { lat: 40.4168, lng: -3.7038 },
  马德里: { lat: 40.4168, lng: -3.7038 },
  馬德里: { lat: 40.4168, lng: -3.7038 },
  barcelona: { lat: 41.3874, lng: 2.1686 },
  巴塞罗那: { lat: 41.3874, lng: 2.1686 },
  巴塞羅那: { lat: 41.3874, lng: 2.1686 },
  seville: { lat: 37.3891, lng: -5.9845 },
  塞维利亚: { lat: 37.3891, lng: -5.9845 },
  塞維利亞: { lat: 37.3891, lng: -5.9845 },
  valencia: { lat: 39.4699, lng: -0.3763 },
  瓦伦西亚: { lat: 39.4699, lng: -0.3763 },
  瓦倫西亞: { lat: 39.4699, lng: -0.3763 },
  granada: { lat: 37.1773, lng: -3.5986 },
  malaga: { lat: 36.7213, lng: -4.4214 },
  bilbao: { lat: 43.263, lng: -2.935 },
  vienna: { lat: 48.2082, lng: 16.3738 },
  维也纳: { lat: 48.2082, lng: 16.3738 },
  維也納: { lat: 48.2082, lng: 16.3738 },
  salzburg: { lat: 47.8095, lng: 13.055 },
  萨尔茨堡: { lat: 47.8095, lng: 13.055 },
  薩爾茨堡: { lat: 47.8095, lng: 13.055 },
  innsbruck: { lat: 47.2692, lng: 11.4041 },
  因斯布鲁克: { lat: 47.2692, lng: 11.4041 },
  因斯布魯克: { lat: 47.2692, lng: 11.4041 },
  hallstatt: { lat: 47.5622, lng: 13.6493 },
  哈尔施塔特: { lat: 47.5622, lng: 13.6493 },
  哈爾施塔特: { lat: 47.5622, lng: 13.6493 },
  graz: { lat: 47.0707, lng: 15.4395 },
  linz: { lat: 48.3069, lng: 14.2858 },
  prague: { lat: 50.0755, lng: 14.4378 },
  布拉格: { lat: 50.0755, lng: 14.4378 },
  cesky_krumlov: { lat: 48.8127, lng: 14.3175 },
  "cesky krumlov": { lat: 48.8127, lng: 14.3175 },
  克鲁姆洛夫: { lat: 48.8127, lng: 14.3175 },
  克魯姆洛夫: { lat: 48.8127, lng: 14.3175 },
  brno: { lat: 49.1951, lng: 16.6068 },
  布尔诺: { lat: 49.1951, lng: 16.6068 },
  布爾諾: { lat: 49.1951, lng: 16.6068 },
  "karlovy vary": { lat: 50.2319, lng: 12.8712 },
  ostrava: { lat: 49.8209, lng: 18.2625 },
  budapest: { lat: 47.4979, lng: 19.0402 },
  布达佩斯: { lat: 47.4979, lng: 19.0402 },
  布達佩斯: { lat: 47.4979, lng: 19.0402 },
  eger: { lat: 47.9025, lng: 20.3772 },
  szeged: { lat: 46.253, lng: 20.1414 },
  debrecen: { lat: 47.5316, lng: 21.6273 },
  pecs: { lat: 46.0727, lng: 18.2323 }
};

const cityVisualPositions: Record<string, { x: number; y: number }> = {
  tokyo: { x: 63.7, y: 46.8 },
  osaka: { x: 52.1, y: 50.8 },
  kyoto: { x: 52.9, y: 49.5 },
  nara: { x: 53.3, y: 51.0 },
  sapporo: { x: 68.5, y: 16.3 },
  fukuoka: { x: 37.8, y: 55.4 },
  hiroshima: { x: 43.6, y: 52.1 },
  nagoya: { x: 56.1, y: 48.8 },
  seoul: { x: 40.8, y: 31.8 },
  busan: { x: 61.2, y: 66.4 },
  jeju: { x: 35.6, y: 88.9 },
  incheon: { x: 37.6, y: 32.7 },
  daegu: { x: 56.2, y: 56.8 },
  gyeongju: { x: 64.4, y: 56.2 },
  rome: { x: 49.6, y: 49.7 },
  roma: { x: 49.6, y: 49.7 },
  florence: { x: 42.5, y: 34.0 },
  firenze: { x: 42.5, y: 34.0 },
  venice: { x: 48.6, y: 20.0 },
  venezia: { x: 48.6, y: 20.0 },
  milan: { x: 30.7, y: 19.8 },
  milano: { x: 30.7, y: 19.8 },
  naples: { x: 59.8, y: 58.6 },
  napoli: { x: 59.8, y: 58.6 },
  bologna: { x: 43.0, y: 27.9 },
  pisa: { x: 37.7, y: 34.4 },
  beijing: { x: 67.5, y: 41.3 },
  shanghai: { x: 74.8, y: 59.8 },
  hangzhou: { x: 72.9, y: 61.8 },
  suzhou: { x: 73.5, y: 59.6 },
  guangzhou: { x: 62.9, y: 77.0 },
  shenzhen: { x: 64.1, y: 78.3 },
  chengdu: { x: 49.6, y: 61.2 },
  xian: { x: 56.6, y: 53.2 },
  "xi an": { x: 56.6, y: 53.2 },
  hong_kong: { x: 64.2, y: 78.8 },
  "hong kong": { x: 64.2, y: 78.8 },
  macau: { x: 63.3, y: 79.0 },
  chongqing: { x: 53.2, y: 63.3 },
  wuhan: { x: 64.4, y: 61.1 },
  london: { x: 68.4, y: 76.9 },
  edinburgh: { x: 48.4, y: 34.1 },
  manchester: { x: 54.6, y: 57.9 },
  bath: { x: 53.8, y: 78.1 },
  oxford: { x: 61.0, y: 74.5 },
  cambridge: { x: 70.1, y: 70.1 },
  york: { x: 62.2, y: 53.3 },
  glasgow: { x: 41.4, y: 34.9 },
  liverpool: { x: 49.7, y: 58.6 },
  paris: { x: 49.2, y: 27.8 },
  nice: { x: 77.8, y: 71.8 },
  lyon: { x: 63.7, y: 54.3 },
  marseille: { x: 66.8, y: 75.4 },
  bordeaux: { x: 32.2, y: 62.2 },
  strasbourg: { x: 80.6, y: 30.3 },
  avignon: { x: 63.5, y: 69.8 },
  zurich: { x: 56.2, y: 33.1 },
  lucerne: { x: 51.5, y: 42.7 },
  interlaken: { x: 42.6, y: 53.5 },
  geneva: { x: 8.0, y: 67.7 },
  bern: { x: 34.2, y: 45.7 },
  zermatt: { x: 40.3, y: 73.1 },
  lausanne: { x: 17.8, y: 58.4 },
  madrid: { x: 46.2, y: 44.0 },
  barcelona: { x: 88.2, y: 33.9 },
  seville: { x: 29.9, y: 75.8 },
  valencia: { x: 70.0, y: 54.0 },
  granada: { x: 47.0, y: 78.0 },
  malaga: { x: 41.1, y: 82.8 },
  bilbao: { x: 51.7, y: 14.1 },
  vienna: { x: 87.2, y: 41.8 },
  salzburg: { x: 47.9, y: 48.7 },
  innsbruck: { x: 28.4, y: 58.1 },
  hallstatt: { x: 55.0, y: 53.0 },
  graz: { x: 76.2, y: 61.6 },
  linz: { x: 62.5, y: 40.0 },
  prague: { x: 35.1, y: 45.3 },
  cesky_krumlov: { x: 33.5, y: 70.2 },
  "cesky krumlov": { x: 33.5, y: 70.2 },
  brno: { x: 64.2, y: 62.7 },
  "karlovy vary": { x: 14.1, y: 42.2 },
  ostrava: { x: 86.5, y: 50.3 },
  budapest: { x: 44.3, y: 43.9 },
  eger: { x: 62.5, y: 35.7 },
  szeged: { x: 59.3, y: 68.8 },
  debrecen: { x: 79.6, y: 43.2 },
  pecs: { x: 33.3, y: 72.5 },
  北京: { x: 67.5, y: 41.3 },
  上海: { x: 74.8, y: 59.8 },
  杭州: { x: 72.9, y: 61.8 },
  广州: { x: 62.9, y: 77.0 },
  深圳: { x: 64.1, y: 78.3 },
  成都: { x: 49.6, y: 61.2 },
  伦敦: { x: 68.4, y: 76.9 },
  倫敦: { x: 68.4, y: 76.9 },
  巴黎: { x: 49.2, y: 27.8 },
  苏黎世: { x: 56.2, y: 33.1 },
  蘇黎世: { x: 56.2, y: 33.1 },
  马德里: { x: 46.2, y: 44.0 },
  馬德里: { x: 46.2, y: 44.0 },
  巴塞罗那: { x: 88.2, y: 33.9 },
  巴塞羅那: { x: 88.2, y: 33.9 },
  维也纳: { x: 87.2, y: 41.8 },
  維也納: { x: 87.2, y: 41.8 },
  布拉格: { x: 35.1, y: 45.3 },
  布达佩斯: { x: 44.3, y: 43.9 },
  布達佩斯: { x: 44.3, y: 43.9 }
};

export function getDestinationVisualIdentity({
  destination,
  routeCities = [],
  routeLabel,
  routeStops = [],
  tripName
}: DestinationVisualInput): DestinationVisualIdentity {
  const routeMarks = buildRouteMarks(routeCities, routeLabel, routeStops);
  const routeStopDestinations = buildRouteDestinationsFromStops(routeStops);
  const visibleMarks = routeMarks.length > 0 ? routeMarks : [cleanText(destination) || cleanText(tripName) || "Trip"];
  const destinations = routeStopDestinations.length > 0 ? routeStopDestinations : buildRouteDestinations(visibleMarks);
  const routePresets = uniquePresets(
    destinations
      .map((destinationItem) => findPresetByCountryCode(destinationItem.countryCode))
      .filter((preset): preset is DestinationVisualPreset => Boolean(preset))
  );
  const routeSearchText = [routeLabel, routeMarks.join(" "), routeStops.map(formatRouteStopSearchText).join(" ")]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
  const tripSearchText = [destination, tripName].filter(Boolean).join(" ").toLocaleLowerCase();
  const preset = routePresets[0] ?? findPreset(routeSearchText) ?? findPreset(tripSearchText);
  const region = preset?.region ?? "generic";
  const countryNames = routePresets.length > 0
    ? routePresets.map((routePreset) => routePreset.countryName)
    : preset
      ? [preset.countryName]
      : [];
  const countryCodes = routePresets.length > 0
    ? routePresets.map((routePreset) => routePreset.countryCode)
    : preset
      ? [preset.countryCode]
      : [];
  const destinationLabel =
    countryNames.length > 1
      ? "Multi-country"
      : countryNames[0] ?? cleanText(destination) ?? routeMarks[0] ?? cleanText(tripName) ?? "Trip";
  const firstStop = visibleMarks[0];
  const lastStop = visibleMarks[visibleMarks.length - 1];
  const countryName = preset?.countryName ?? destinationLabel;

  return {
    region,
    toneClass: `destination-visual--${region}`,
    shapeClass: `destination-map-shape--${region}`,
    countryCode: preset?.countryCode ?? "GENERIC",
    countryName,
    countryCodes,
    countryNames,
    destinationLabel,
    stampLabel: formatStampLabel(destinationLabel),
    stampDetail: firstStop === lastStop ? firstStop : `${firstStop} · ${lastStop}`,
    routeMarks: visibleMarks.slice(0, 5),
    destinations
  };
}

function findPreset(searchText: string) {
  if (!searchText) {
    return undefined;
  }

  const normalizedSearchText = searchText.toLocaleLowerCase();
  return presets.find((candidate) =>
    candidate.keywords.some((keyword) => normalizedSearchText.includes(keyword.toLocaleLowerCase()))
  );
}

function findPresetByCountryCode(countryCode?: string) {
  if (!countryCode) {
    return undefined;
  }

  const normalizedCode = countryCode.toLocaleUpperCase();
  return presets.find((candidate) => candidate.countryCode === normalizedCode);
}

function uniquePresets(routePresets: DestinationVisualPreset[]) {
  const seen = new Set<string>();
  return routePresets.filter((preset) => {
    if (seen.has(preset.countryCode)) {
      return false;
    }

    seen.add(preset.countryCode);
    return true;
  });
}

function buildRouteMarks(routeCities: string[], routeLabel?: string, routeStops: DestinationRouteStop[] = []) {
  const candidates = [
    ...routeStops.map((stop) => stop.city),
    ...routeCities,
    ...splitRouteLabel(routeLabel)
  ]
    .map(cleanText)
    .filter(Boolean);
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const key = candidate.toLocaleLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function formatRouteStopSearchText(stop: DestinationRouteStop) {
  return [stop.city, stop.country].filter(Boolean).join(" ");
}

function splitRouteLabel(routeLabel?: string) {
  return cleanText(routeLabel)
    .split(routeSplitPattern)
    .map(cleanText)
    .filter(Boolean);
}

function cleanText(value?: string) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function buildRouteDestinationsFromStops(routeStops: DestinationRouteStop[]): TripRouteDestination[] {
  return routeStops
    .map((stop) => {
      const name = cleanText(stop.city);
      if (!name) {
        return null;
      }

      const preset = resolvePresetForStop(stop);
      return buildRouteDestination(name, preset, stop.startDate ?? stop.endDate ?? null);
    })
    .filter((destination): destination is TripRouteDestination => Boolean(destination));
}

function buildRouteDestinations(routeMarks: string[]): TripRouteDestination[] {
  return routeMarks
    .map((name) => {
      const preset = findPreset(name);
      return buildRouteDestination(name, preset, null);
    })
    .filter((destination): destination is TripRouteDestination => Boolean(destination));
}

function buildRouteDestination(
  name: string,
  preset: DestinationVisualPreset | undefined,
  date: string | null
): TripRouteDestination | null {
  const coordinate = coordinateForCity(name);
  const visualPosition = visualPositionForCity(name);

  return coordinate || visualPosition || preset
    ? {
        name,
        ...(coordinate ?? {}),
        ...(visualPosition ? { visualPosition } : {}),
        ...(preset
          ? {
              countryCode: preset.countryCode,
              countryName: preset.countryName
            }
          : {}),
        ...(date ? { date } : {})
      }
    : null;
}

function resolvePresetForStop(stop: DestinationRouteStop) {
  return findPreset(cleanText(stop.city)) ?? findPreset(cleanText(stop.country ?? ""));
}

function visualPositionForCity(name: string) {
  const key = normalizeCoordinateKey(name);
  if (cityVisualPositions[key]) {
    return cityVisualPositions[key];
  }

  const match = Object.entries(cityVisualPositions).find(([candidate]) =>
    key.includes(candidate) || candidate.includes(key)
  );

  return match?.[1] ?? null;
}

function coordinateForCity(name: string) {
  const key = normalizeCoordinateKey(name);
  if (cityCoordinates[key]) {
    return cityCoordinates[key];
  }

  const match = Object.entries(cityCoordinates).find(([candidate]) =>
    key.includes(candidate) || candidate.includes(key)
  );

  return match?.[1] ?? null;
}

function normalizeCoordinateKey(value: string) {
  return cleanText(value)
    .toLocaleLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatStampLabel(value: string) {
  return /^[\x00-\x7F]+$/.test(value) ? value.toUpperCase() : value;
}
