import {
  bookingCurrencies,
  type BookingInput,
  type DocumentInput,
  expenseCategories,
  type ItineraryInput,
  type PackingInput,
  type ReminderInput,
  type SharedCurrency,
  type TripSettingsInput,
  type TripSettingsResponse
} from "@/lib/sharedDataTypes";

export const setupTemplateIds = [
  "china-city-general",
  "china-multi-city",
  "japan-general",
  "korea-general",
  "generic-international"
] as const;

export type SetupTemplateId = (typeof setupTemplateIds)[number];

export const setupTripStyles = ["balanced", "relaxed", "packed", "shopping", "food", "family"] as const;
export type SetupTripStyle = (typeof setupTripStyles)[number];

export const setupTransportModes = ["public-transport", "rail", "car-rental", "mixed", "undecided"] as const;
export type SetupTransportMode = (typeof setupTransportModes)[number];

export const setupAccommodationModes = ["hotel", "airbnb", "mixed", "undecided"] as const;
export type SetupAccommodationMode = (typeof setupAccommodationModes)[number];

export const setupLuggageModes = ["carry-on", "checked-luggage", "mixed", "undecided"] as const;
export type SetupLuggageMode = (typeof setupLuggageModes)[number];

export type SetupTemplateOption = {
  id: SetupTemplateId;
  label: string;
  description: string;
  defaultDestination: string;
  defaultCities: string[];
  defaultTimezone: string;
};

export type SetupGenerationInput = {
  templateId: SetupTemplateId;
  tripName: string;
  destination: string;
  startDate: string;
  endDate: string;
  timezone?: string;
  defaultCurrencies: SharedCurrency[];
  travelerCount?: number;
  travelerNames: string[];
  routeCities: string[];
  overnightCities?: string[];
  dayTripCities?: string[];
  tripStyle?: SetupTripStyle;
  transportMode?: SetupTransportMode;
  accommodationMode?: SetupAccommodationMode;
  luggageMode?: SetupLuggageMode;
  expenseSplittingEnabled: boolean;
};

export type SetupRouteLeg = {
  from: string;
  to: string;
  label: string;
};

export type SetupGenerationSummary = {
  templateId: SetupTemplateId;
  templateLabel: string;
  travelerCount: number;
  routeStopCount: number;
  routeCities: string[];
  routeLegs: string[];
  overnightCityCount: number;
  dayTripCityCount: number;
  seasonLabel: string;
  seasonalPackingIncluded: boolean;
  reminderCount: number;
  bookingCount: number;
  itineraryCount: number;
  itineraryDayCount: number;
  packingCount: number;
  documentCount: number;
  budgetCategoryCount: number;
  expenseSplittingEnabled: boolean;
};

export type GeneratedWorkspace = {
  settings: TripSettingsInput;
  reminders: ReminderInput[];
  bookings: BookingInput[];
  itineraryItems: ItineraryInput[];
  packingItems: PackingInput[];
  documents: DocumentInput[];
  summary: SetupGenerationSummary;
};

export type SetupGenerationResponse = {
  settings: TripSettingsResponse;
  summary: SetupGenerationSummary;
};

type SeasonProfile = {
  label: string;
  packingItems: Array<Omit<PackingInput, "statuses" | "sortOrder">>;
  note: string;
};

type SetupGenerationContext = {
  routeCities: string[];
  routeLegs: SetupRouteLeg[];
  overnightCities: string[];
  dayTripCities: string[];
  durationDays: number;
  durationNights: number;
  travelMonth: number;
  country: string;
  accommodationLabel: string;
  season: SeasonProfile;
};

export const setupTemplateOptions: SetupTemplateOption[] = [
  {
    id: "china-city-general",
    label: "China city general",
    description: "One-city China starter workspace with payment, transport, hotel, maps, and connectivity tasks.",
    defaultDestination: "China",
    defaultCities: ["Shanghai"],
    defaultTimezone: "Asia/Shanghai"
  },
  {
    id: "china-multi-city",
    label: "China multi-city",
    description: "Multi-city China starter workspace with rail, hotel, attraction, payment, and route coordination.",
    defaultDestination: "China",
    defaultCities: ["Shanghai", "Hangzhou"],
    defaultTimezone: "Asia/Shanghai"
  },
  {
    id: "japan-general",
    label: "Japan general",
    description: "Japan starter workspace with IC card, rail, hotel, restaurant, attraction, and connectivity tasks.",
    defaultDestination: "Japan",
    defaultCities: ["Tokyo", "Kyoto", "Osaka"],
    defaultTimezone: "Asia/Tokyo"
  },
  {
    id: "korea-general",
    label: "Korea general",
    description: "Korea starter workspace with transport card, map apps, hotel, restaurant, beauty, and eSIM tasks.",
    defaultDestination: "South Korea",
    defaultCities: ["Seoul", "Busan"],
    defaultTimezone: "Asia/Seoul"
  },
  {
    id: "generic-international",
    label: "Generic international",
    description: "Fallback international trip workspace with bookings, documents, packing, route, and admin tasks.",
    defaultDestination: "International trip",
    defaultCities: ["Arrival city", "Main city"],
    defaultTimezone: "UTC"
  }
];

const validCurrencies = bookingCurrencies;
const maxTripDays = 21;
const maxTravelers = 8;
const maxRouteStops = 8;

export function getSetupTemplateOption(id: SetupTemplateId) {
  return setupTemplateOptions.find((template) => template.id === id) ?? setupTemplateOptions[0];
}

export function recommendedCurrenciesForTemplate(id: SetupTemplateId): SharedCurrency[] {
  switch (id) {
    case "china-city-general":
    case "china-multi-city":
      return ["SGD", "CNY"];
    case "japan-general":
      return ["SGD", "JPY"];
    case "korea-general":
      return ["SGD", "KRW"];
    default:
      return ["SGD"];
  }
}

export function buildStarterWorkspace(rawInput: Partial<SetupGenerationInput>): GeneratedWorkspace {
  const input = normalizeSetupGenerationInput(rawInput);
  const template = getSetupTemplateOption(input.templateId);
  const context = buildSetupGenerationContext(input, template);
  const travelers = input.travelerNames.map((displayName, index) => ({
    id: travelerIdForIndex(index),
    displayName,
    displayOrder: index + 1,
    isActive: true
  }));
  const owner = input.travelerNames[0];
  const routeStops = buildRouteStops(input, template, context);
  const tripNotes = buildTripNotes(input, template, context);
  const itineraryItems = buildItineraryShell(input, template, context);
  const reminders = buildReminders(input, template, owner, context);
  const bookings = buildBookings(input, template, owner, context);
  const packingItems = buildPacking(input, template, travelers.map((traveler) => traveler.id), context);
  const documents = buildDocuments(input, template, travelers.map((traveler) => traveler.id), context);

  return {
    settings: {
      trip: {
        name: input.tripName,
        destination: input.destination,
        startDate: input.startDate,
        endDate: input.endDate,
        defaultCurrencies: input.defaultCurrencies,
        timezone: input.timezone || template.defaultTimezone,
        notes: tripNotes
      },
      travelers,
      routeStops
    },
    reminders,
    bookings,
    itineraryItems,
    packingItems,
    documents,
    summary: {
      templateId: input.templateId,
      templateLabel: template.label,
      travelerCount: travelers.length,
      routeStopCount: routeStops.length,
      routeCities: context.routeCities,
      routeLegs: context.routeLegs.map((leg) => leg.label),
      overnightCityCount: context.overnightCities.length,
      dayTripCityCount: context.dayTripCities.length,
      seasonLabel: context.season.label,
      seasonalPackingIncluded: context.season.packingItems.length > 0,
      reminderCount: reminders.length,
      bookingCount: bookings.length,
      itineraryCount: itineraryItems.length,
      itineraryDayCount: daysInclusive(input.startDate, input.endDate),
      packingCount: packingItems.length,
      documentCount: documents.length,
      budgetCategoryCount: budgetCategoriesForTemplate(input.templateId, context).length,
      expenseSplittingEnabled: input.expenseSplittingEnabled
    }
  };
}

export function normalizeSetupGenerationInput(rawInput: Partial<SetupGenerationInput>): SetupGenerationInput {
  const templateId = setupTemplateIds.includes(rawInput.templateId as SetupTemplateId)
    ? (rawInput.templateId as SetupTemplateId)
    : "generic-international";
  const template = getSetupTemplateOption(templateId);
  const tripName = String(rawInput.tripName ?? "").trim();
  const destination = String(rawInput.destination ?? "").trim() || template.defaultDestination;
  const startDate = String(rawInput.startDate ?? "").trim();
  const endDate = String(rawInput.endDate ?? "").trim();
  const timezone = String(rawInput.timezone ?? "").trim() || template.defaultTimezone;
  const defaultCurrencies = normalizeCurrencies(rawInput.defaultCurrencies, templateId);
  const travelerCount = normalizeTravelerCount(rawInput.travelerCount, rawInput.travelerNames);
  const travelerNames = normalizeTravelerNames(rawInput.travelerNames, travelerCount);
  const routeCities = normalizeTextList(rawInput.routeCities, maxRouteStops);
  const overnightCities = normalizeTextList(rawInput.overnightCities, maxRouteStops);
  const dayTripCities = normalizeTextList(rawInput.dayTripCities, maxRouteStops);
  const tripStyle = normalizeOption(rawInput.tripStyle, setupTripStyles, "balanced");
  const transportMode = normalizeOption(rawInput.transportMode, setupTransportModes, "public-transport");
  const accommodationMode = normalizeOption(rawInput.accommodationMode, setupAccommodationModes, "hotel");
  const luggageMode = normalizeOption(rawInput.luggageMode, setupLuggageModes, "checked-luggage");
  const expenseSplittingEnabled: boolean = rawInput.expenseSplittingEnabled === false ? false : true;

  if (!tripName) {
    throw new Error("Trip name is required for setup generation.");
  }
  if (!isDateInput(startDate) || !isDateInput(endDate)) {
    throw new Error("Start date and end date are required for setup generation.");
  }
  if (startDate > endDate) {
    throw new Error("Start date must be before or equal to end date.");
  }
  if (daysInclusive(startDate, endDate) > maxTripDays) {
    throw new Error(`Setup generation supports trips up to ${maxTripDays} days in v1.`);
  }
  if (travelerNames.length === 0) {
    throw new Error("At least one active traveler is required.");
  }
  if (routeCities.length === 0 && template.defaultCities.length === 0) {
    throw new Error("At least one route city is required.");
  }

  return {
    templateId,
    tripName,
    destination,
    startDate,
    endDate,
    timezone,
    defaultCurrencies,
    travelerCount: travelerNames.length,
    travelerNames,
    routeCities: routeCities.length > 0 ? routeCities : template.defaultCities,
    overnightCities,
    dayTripCities,
    tripStyle,
    transportMode,
    accommodationMode,
    luggageMode,
    expenseSplittingEnabled
  };
}

function normalizeCurrencies(value: unknown, templateId: SetupTemplateId): SharedCurrency[] {
  const currencies = Array.isArray(value)
    ? value.map((currency) => String(currency).trim()).filter((currency): currency is SharedCurrency =>
        (validCurrencies as readonly string[]).includes(currency)
      )
    : [];
  const uniqueCurrencies = Array.from(new Set(currencies));

  if (uniqueCurrencies.length === 0) {
    return recommendedCurrenciesForTemplate(templateId);
  }

  return uniqueCurrencies;
}

function normalizeTravelerCount(value: unknown, names: unknown) {
  const fromNames = Array.isArray(names) ? names.length : 0;
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return Math.min(maxTravelers, Math.max(1, Math.floor(numericValue)));
  }
  return Math.min(maxTravelers, Math.max(1, fromNames || 4));
}

function normalizeTravelerNames(value: unknown, count: number) {
  const inputNames = normalizeTextList(value, maxTravelers);
  return Array.from({ length: count }, (_, index) => inputNames[index] || `Traveler ${index + 1}`);
}

function normalizeTextList(value: unknown, maxItems: number) {
  const items = Array.isArray(value) ? value : typeof value === "string" ? splitSetupText(value) : [];
  const uniqueItems: string[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const text = String(item ?? "").trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) {
      continue;
    }
    uniqueItems.push(text);
    seen.add(key);
    if (uniqueItems.length >= maxItems) {
      break;
    }
  }

  return uniqueItems;
}

function normalizeOption<T extends readonly string[]>(value: unknown, options: T, fallback: T[number]) {
  return options.includes(value as T[number]) ? (value as T[number]) : fallback;
}

function splitSetupText(value: string) {
  return value.split(/\s*(?:->|→|,|，|\/|、|;|；|\r?\n)\s*/g);
}

function buildSetupGenerationContext(input: SetupGenerationInput, template: SetupTemplateOption): SetupGenerationContext {
  const routeCities = input.routeCities.length > 0 ? input.routeCities : template.defaultCities;
  const routeLegs = routeCities.slice(1).map((city, index) => ({
    from: routeCities[index],
    to: city,
    label: `${routeCities[index]} -> ${city}`
  }));
  const dayTripCities = normalizeCityList(input.dayTripCities ?? []);
  const dayTripKeys = new Set(dayTripCities.map(cityKey));
  const requestedOvernightCities = normalizeCityList(input.overnightCities ?? []);
  const overnightCandidates =
    requestedOvernightCities.length > 0
      ? requestedOvernightCities
      : routeCities.filter((city) => !dayTripKeys.has(cityKey(city)));
  const overnightCities = overnightCandidates.length > 0 ? overnightCandidates : [routeCities[0] ?? input.destination];
  const durationDays = daysInclusive(input.startDate, input.endDate);
  const travelMonth = Number(input.startDate.slice(5, 7));

  return {
    routeCities,
    routeLegs,
    overnightCities,
    dayTripCities,
    durationDays,
    durationNights: Math.max(0, durationDays - 1),
    travelMonth,
    country: countryForTemplate(input, template),
    accommodationLabel: accommodationLabelFor(input),
    season: seasonProfileForTemplate(input.templateId, travelMonth)
  };
}

function normalizeCityList(cities: string[]) {
  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const city of cities) {
    const text = city.trim();
    const key = cityKey(text);
    if (!text || seen.has(key)) {
      continue;
    }
    normalized.push(text);
    seen.add(key);
  }
  return normalized;
}

function cityKey(value: string) {
  return value.trim().toLowerCase();
}

function formatRouteLegs(context: SetupGenerationContext) {
  if (context.routeLegs.length === 0) {
    return "none";
  }
  return context.routeLegs.map((leg) => leg.label).join("; ");
}

function accommodationLabelFor(input: SetupGenerationInput) {
  if (input.accommodationMode === "airbnb") {
    return "Airbnb / homestay";
  }
  if (input.accommodationMode === "mixed") {
    return "mixed accommodation";
  }
  if (input.accommodationMode === "undecided") {
    return "accommodation";
  }
  return "hotel";
}

function seasonProfileForTemplate(templateId: SetupTemplateId, month: number): SeasonProfile {
  const seasonName = seasonLabelForMonth(month);
  const destination =
    templateId === "japan-general"
      ? "Japan"
      : templateId === "korea-general"
        ? "Korea"
        : templateId === "china-city-general" || templateId === "china-multi-city"
          ? "China"
          : "the destination";

  if (month >= 3 && month <= 5) {
    return {
      label: `${seasonName} in ${destination}`,
      note: "Plan layers, rain backup, and shoes that can handle long walking days.",
      packingItems: [
        seasonalPackingItem("Light jacket or cardigan", "Clothes", "Medium", "Useful for cooler mornings, evenings, and indoor air conditioning."),
        seasonalPackingItem("Layered tops", "Clothes", "Medium", "Pack layers that can be adjusted after checking the forecast."),
        seasonalPackingItem("Comfortable walking shoes", "Clothes", "High", "Choose shoes already broken in before departure."),
        seasonalPackingItem("Compact umbrella or rain jacket", "Travel Essentials", "Medium", "Add after checking the forecast closer to departure.")
      ]
    };
  }

  if (month >= 6 && month <= 8) {
    return {
      label: `${seasonName} in ${destination}`,
      note: "Plan heat, rain, sun protection, hydration, and spare light layers.",
      packingItems: [
        seasonalPackingItem("Breathable clothing", "Clothes", "Medium", "Pack light layers suitable for warm weather and indoor cooling."),
        seasonalPackingItem("Sun protection", "Personal Care", "Medium", "Add sunscreen, hat, or sunglasses based on personal preference."),
        seasonalPackingItem("Compact umbrella or rain jacket", "Travel Essentials", "Medium", "Useful for summer rain and city walking."),
        seasonalPackingItem("Refillable water bottle", "Travel Essentials", "Low", "Optional shared or personal item for long walking days.")
      ]
    };
  }

  if (month >= 9 && month <= 11) {
    return {
      label: `${seasonName} in ${destination}`,
      note: "Plan mild layers, cooler evenings, walking comfort, and rain backup.",
      packingItems: [
        seasonalPackingItem("Light jacket or sweater", "Clothes", "Medium", "Useful for cooler evenings and early starts."),
        seasonalPackingItem("Layered tops", "Clothes", "Medium", "Pack layers that work across warm afternoons and cooler nights."),
        seasonalPackingItem("Comfortable walking shoes", "Clothes", "High", "Choose shoes already broken in before departure."),
        seasonalPackingItem("Compact umbrella or rain jacket", "Travel Essentials", "Medium", "Keep one rain backup for city walks and transfer days.")
      ]
    };
  }

  return {
    label: `${seasonName} in ${destination}`,
    note: "Plan warm layers, weather checks, and footwear that works for cold or wet days.",
    packingItems: [
      seasonalPackingItem("Warm outer layer", "Clothes", "High", "Adjust warmth after checking the destination forecast."),
      seasonalPackingItem("Thermal or layered tops", "Clothes", "Medium", "Pack layers that can be added or removed through the day."),
      seasonalPackingItem("Comfortable weather-ready shoes", "Clothes", "High", "Choose shoes suited to cold or wet walking days."),
      seasonalPackingItem("Gloves or scarf if needed", "Clothes", "Low", "Optional item based on forecast and personal tolerance.")
    ]
  };
}

function seasonLabelForMonth(month: number) {
  if (month >= 3 && month <= 5) {
    return "spring";
  }
  if (month >= 6 && month <= 8) {
    return "summer";
  }
  if (month >= 9 && month <= 11) {
    return "autumn";
  }
  return "winter";
}

function seasonalPackingItem(
  name: string,
  category: PackingInput["category"],
  priority: PackingInput["priority"],
  notes: string
): Omit<PackingInput, "statuses" | "sortOrder"> {
  return {
    name,
    category,
    priority,
    notes,
    quantity: null
  };
}

function buildRouteStops(
  input: SetupGenerationInput,
  template: SetupTemplateOption,
  context: SetupGenerationContext
): TripSettingsInput["routeStops"] {
  const totalDays = context.durationDays;
  const country = countryForTemplate(input, template);

  return context.routeCities.map((city, index) => {
    const startOffset = Math.floor((index * totalDays) / context.routeCities.length);
    const endOffset = Math.max(startOffset, Math.floor(((index + 1) * totalDays) / context.routeCities.length) - 1);

    return {
      id: `setup-route-${index + 1}`,
      city,
      country,
      startDate: addDays(input.startDate, startOffset),
      endDate: addDays(input.startDate, Math.min(endOffset, totalDays - 1)),
      sortOrder: index + 1
    };
  });
}

function buildTripNotes(input: SetupGenerationInput, template: SetupTemplateOption, context: SetupGenerationContext) {
  return [
    `Generated starter workspace from ${template.label}.`,
    `Trip style: ${optionLabel(input.tripStyle ?? "balanced")}.`,
    `Transport: ${optionLabel(input.transportMode ?? "public-transport")}.`,
    `Accommodation: ${optionLabel(input.accommodationMode ?? "hotel")}.`,
    `Luggage: ${optionLabel(input.luggageMode ?? "checked-luggage")}.`,
    `Expense splitting: ${input.expenseSplittingEnabled ? "enabled" : "disabled"}.`,
    `Duration: ${context.durationDays} days / ${context.durationNights} nights.`,
    `Route cities detected: ${context.routeCities.join(" -> ")}.`,
    `Route legs: ${formatRouteLegs(context)}.`,
    `Overnight cities: ${context.overnightCities.join(", ")}.`,
    `Day trip cities: ${context.dayTripCities.length > 0 ? context.dayTripCities.join(", ") : "none"}.`,
    `Season profile: ${context.season.label}. ${context.season.note}`,
    `Starter budget categories: ${budgetCategoriesForTemplate(input.templateId, context).join("; ")}.`,
    ...destinationTripNotes(input, template, context),
    "Replace all placeholder checklist items with confirmed non-sensitive trip details."
  ].join("\n");
}

function destinationTripNotes(
  input: SetupGenerationInput,
  template: SetupTemplateOption,
  context: SetupGenerationContext
) {
  const notes = [
    [
      "Emergency card placeholders to fill:",
      "accommodation address, travel insurance contact, group emergency contact, local emergency number source,",
      "embassy or consulate source, medical/allergy note if useful, and offline screenshots."
    ].join(" "),
    "Document and entry checklist items must be checked against official sources. This app does not decide visa or entry eligibility.",
    `Keep booking amounts empty until real costs are confirmed. The starter expense ledger is empty for ${template.label}.`
  ];

  if (input.templateId === "china-multi-city") {
    return [
      ...notes,
      "China multi-city mode creates accommodation only for overnight cities and day-trip return transport for day trip cities."
    ];
  }

  if (input.templateId === "japan-general" || input.templateId === "korea-general") {
    return [
      ...notes,
      `${template.label} route planning uses overnight cities for accommodation and day trip cities for return transport reminders.`
    ];
  }

  if (input.templateId === "generic-international" && context.dayTripCities.length > 0) {
    return [...notes, "Generic mode keeps day trip wording broad because it does not assume local transport systems."];
  }

  return notes;
}

function buildReminders(
  input: SetupGenerationInput,
  template: SetupTemplateOption,
  owner: string,
  context: SetupGenerationContext
): ReminderInput[] {
  const destinationItems = destinationReminderItems(input.templateId, context);
  const dayTripItems = context.dayTripCities.map((city) => `Add a same-day return plan, meeting point, and backup transport note for ${city}.`);
  return [
    {
      text: "Store the private trip link, planner edit passcode, and recovery token outside this workspace.",
      priority: "High",
      createdBy: owner
    },
    {
      text: "Assign owners for every major booking and confirm what still needs to be reserved.",
      priority: "High",
      createdBy: owner
    },
    {
      text: "Fill the emergency card with safe local contacts before departure.",
      priority: "Medium",
      createdBy: owner
    },
    {
      text: `Check the ${context.season.label} packing notes and edit them after checking the weather closer to departure.`,
      priority: "Medium",
      createdBy: owner
    },
    ...dayTripItems.map((text) => ({
      text,
      priority: "Medium",
      createdBy: owner
    } as ReminderInput)),
    ...destinationItems.map((text, index) => ({
      text,
      priority: index === 0 ? "High" : "Medium",
      createdBy: owner
    } as ReminderInput)),
    {
      text: `Review this ${template.label} starter workspace with all travelers before sharing the link in the group chat.`,
      priority: "Medium",
      createdBy: owner
    }
  ];
}

function destinationReminderItems(templateId: SetupTemplateId, context: SetupGenerationContext) {
  switch (templateId) {
    case "china-city-general":
      return [
        "Confirm mobile payment, backup card, and cash plan before arrival.",
        `Save offline map, translation, and accommodation address notes for ${context.overnightCities[0]}.`,
        "Check attraction booking windows and official reservation rules.",
        "Add local metro or taxi setup notes for arrival day.",
        "Confirm roaming, eSIM, or local connectivity before departure.",
        "Screenshot non-sensitive booking summaries and keep full private files outside the app."
      ];
    case "china-multi-city":
      return [
        `Confirm intercity train or flight placeholders for ${formatRouteLegs(context)}.`,
        `Prepare hotel address notes for overnight cities: ${context.overnightCities.join(", ")}.`,
        "Keep day trip cities out of the accommodation list and add return transport notes.",
        "Add luggage storage, locker, or hotel transfer notes for route change days.",
        "Prepare payment setup, transport app access, and connectivity backups before departure.",
        "Save offline map and translation notes for each overnight city."
      ];
    case "japan-general":
      return [
        "Check passport validity and official visa / entry requirement sources for every traveler; this app is not legal advice.",
        "Buy or confirm travel insurance and save safe provider contact details.",
        `Confirm accommodation names, dates, check-in windows, and safe address notes for ${context.overnightCities.join(", ")}.`,
        "Prepare eSIM or pocket WiFi activation, pickup, and return details before departure.",
        "Choose IC card or local transport setup and add first-day station or airport transfer notes.",
        "Confirm airport transfer or airport train plans for arrival and departure days.",
        "Reserve major attractions, theme parks, museums, or restaurants where bookings are needed.",
        "Download offline maps, translation tools, and hotel addresses for each city.",
        "Screenshot key bookings and keep full private files outside this app.",
        "Check baggage allowance, luggage storage, luggage forwarding, yen, and payment card plans."
      ];
    case "korea-general":
      return [
        "Confirm transport card, eSIM or roaming, and map app setup before arrival.",
        `Add KTX, intercity, or airport transport placeholders for ${formatRouteLegs(context)}.`,
        `Confirm accommodation notes for overnight cities: ${context.overnightCities.join(", ")}.`,
        "Add restaurant, attraction, beauty, or appointment booking placeholders.",
        "Save local navigation notes and accommodation addresses for each city.",
        "Keep screenshots of key bookings and store full private files outside this app."
      ];
    default:
      return [
        "Check official entry and document sources for every traveler.",
        `Confirm accommodation basics for overnight cities: ${context.overnightCities.join(", ")}.`,
        `Add route transport placeholders for ${formatRouteLegs(context)}.`,
        "Confirm roaming or eSIM, local transport, and arrival transfer basics.",
        "Save offline copies of non-sensitive booking summaries.",
        "Keep destination-specific claims broad until the planner replaces them with confirmed details."
      ];
  }
}

function buildBookings(
  input: SetupGenerationInput,
  template: SetupTemplateOption,
  owner: string,
  context: SetupGenerationContext
): BookingInput[] {
  if (input.templateId === "japan-general") {
    return buildJapanBookings(input, owner, context);
  }

  const firstCity = context.routeCities[0] ?? input.destination;
  const routeBookings = context.overnightCities.map((city, index) => ({
    category: "Hotel" as const,
    description: `${city} ${context.accommodationLabel} confirmation`,
    date: routeDateForIndex(input, index),
    location: city,
    bookedBy: owner,
    amount: null,
    currency: null,
    notes: "Add provider, safe confirmation summary, check-in details, and cloud link if needed.",
    status: "Pending" as const
  }));
  const intercityBookings = context.routeLegs.map((leg, index) => ({
    category: intercityBookingCategory(input),
    description: `${transportBookingLabel(input)}: ${leg.label}`,
    date: routeDateForIndex(input, index + 1),
    location: leg.to,
    bookedBy: owner,
    amount: null,
    currency: null,
    notes: "Add route, station/airport, departure time, and booking owner after confirmed.",
    status: "Not Booked" as const
  }));
  const dayTripBookings = context.dayTripCities.map((city, index) => ({
    category: intercityBookingCategory(input),
    description: `${city} day trip return transport`,
    date: routeDateForIndex(input, Math.min(context.routeCities.length - 1, index + 1)),
    location: city,
    bookedBy: owner,
    amount: null,
    currency: null,
    notes: "Add outbound route, return route, last return time, meeting point, and backup transport after confirmed.",
    status: "Not Booked" as const
  }));
  const paymentItem = input.templateId === "china-city-general" || input.templateId === "china-multi-city"
    ? [
        {
          category: "Other" as const,
          description: "Mobile payment and backup money setup",
          date: input.startDate,
          location: input.destination,
          bookedBy: owner,
          amount: null,
          currency: null,
          notes: "Add non-sensitive setup notes only. Do not store card details or passcodes.",
          status: "Pending" as const
        }
      ]
    : [];
  const koreaSpecificItems = input.templateId === "korea-general"
    ? [
        {
          category: "Train" as const,
          description: "Transport card / local transit setup",
          date: input.startDate,
          location: firstCity,
          bookedBy: owner,
          amount: null,
          currency: null,
          notes: "Add selected card, app, airport pickup, or top-up notes after confirmed.",
          status: "Pending" as const
        },
        {
          category: "Other" as const,
          description: "Restaurant / beauty / appointment shortlist",
          date: addDays(input.startDate, Math.min(2, context.durationDays - 1)),
          location: firstCity,
          bookedBy: owner,
          amount: null,
          currency: null,
          notes: "Add reservation owner, preferred times, and safe contact notes after confirmed.",
          status: "Not Booked" as const
        }
      ]
    : [];
  const restaurantItems = input.templateId !== "korea-general"
    ? [
        {
          category: "Restaurant" as const,
          description: "Priority restaurant reservations",
          date: addDays(input.startDate, Math.min(2, context.durationDays - 1)),
          location: firstCity,
          bookedBy: owner,
          amount: null,
          currency: null,
          notes: "Add preferred dates, reservation owner, and dietary notes if useful.",
          status: "Not Booked" as const
        }
      ]
    : [];

  const bookings: BookingInput[] = [
    {
      category: "Flight",
      description: "International arrival / departure transport",
      date: input.startDate,
      location: firstCity,
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Add safe flight or arrival summary only. Do not store full confirmation PDFs here.",
      status: "Pending"
    },
    ...routeBookings,
    ...intercityBookings,
    ...dayTripBookings,
    ...paymentItem,
    {
      category: "Other",
      description: "Airport transfer / arrival transport plan",
      date: input.startDate,
      location: firstCity,
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Add airport, station, meeting point, luggage, and backup transport notes after confirmed.",
      status: "Not Booked"
    },
    {
      category: "Other",
      description: "eSIM / roaming / connectivity",
      date: input.startDate,
      location: input.destination,
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Add activation, provider, and backup roaming notes after confirmed.",
      status: "Not Booked"
    },
    {
      category: "Attraction",
      description: `${template.defaultDestination} key attraction reservations`,
      date: addDays(input.startDate, Math.min(1, context.durationDays - 1)),
      location: firstCity,
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Add booking windows, ticket owners, and official source links after checking.",
      status: "Not Booked"
    },
    ...koreaSpecificItems,
    ...restaurantItems,
    {
      category: "Insurance",
      description: "Travel insurance summary",
      date: input.startDate,
      location: input.destination,
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Store only safe summary and provider contact. Keep full policy files outside this app.",
      status: "Pending"
    },
    {
      category: "Other",
      description: "Final booking confirmation review",
      date: input.startDate,
      location: input.destination,
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Review flights, accommodation, route transport, attractions, restaurants, insurance, connectivity, and emergency address notes with the group.",
      status: "Need Confirmation"
    }
  ];

  return bookings;
}

function buildJapanBookings(input: SetupGenerationInput, owner: string, context: SetupGenerationContext): BookingInput[] {
  const firstCity = context.routeCities[0] ?? input.destination;
  const secondDay = addDays(input.startDate, Math.min(1, context.durationDays - 1));
  const thirdDay = addDays(input.startDate, Math.min(2, context.durationDays - 1));
  const routeBookings = context.overnightCities.map((city, index) => ({
    category: "Hotel" as const,
    description: `${city} ${context.accommodationLabel} confirmation`,
    date: routeDateForIndex(input, index),
    location: city,
    bookedBy: owner,
    amount: null,
    currency: null,
    notes: "Add provider, safe check-in summary, address placeholder, and cloud link only if needed. Keep full confirmations outside this app.",
    status: "Pending" as const
  }));
  const intercityBookings = context.routeLegs.map((leg, index) => ({
    category: intercityBookingCategory(input),
    description: `${transportBookingLabel(input)}: ${leg.label}`,
    date: routeDateForIndex(input, index + 1),
    location: leg.to,
    bookedBy: owner,
    amount: null,
    currency: null,
    notes:
      input.transportMode === "car-rental"
        ? "Add pickup, drop-off, parking, toll, route, and driver notes after confirmed."
        : "Add station, route, seat/reservation status, luggage, and ticket owner after confirmed.",
    status: "Not Booked" as const
  }));
  const dayTripBookings = context.dayTripCities.map((city, index) => ({
    category: "Train" as const,
    description: `${city} day trip return transport`,
    date: routeDateForIndex(input, Math.min(context.routeCities.length - 1, index + 1)),
    location: city,
    bookedBy: owner,
    amount: null,
    currency: null,
    notes: "Add outbound route, return route, last return time, meeting point, and backup transport. Do not create accommodation for this day trip.",
    status: "Not Booked" as const
  }));

  return [
    {
      category: "Flight",
      description: "International flights",
      date: input.startDate,
      location: firstCity,
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Add safe arrival/departure summary only. Do not store full confirmation PDFs or private booking references here.",
      status: "Pending"
    },
    ...routeBookings,
    ...intercityBookings,
    ...dayTripBookings,
    {
      category: "Train",
      description: "Airport transfer or airport train plan",
      date: input.startDate,
      location: firstCity,
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Add airport, station, meeting point, luggage, and backup taxi notes after confirmed.",
      status: "Not Booked"
    },
    {
      category: "Train",
      description: "Local transport card / IC card plan",
      date: input.startDate,
      location: firstCity,
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Add chosen physical or mobile IC setup path after checking device and card compatibility.",
      status: "Pending"
    },
    {
      category: "Other",
      description: "eSIM / pocket WiFi",
      date: input.startDate,
      location: input.destination,
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Add activation, pickup, return, and backup roaming notes after confirmed.",
      status: "Not Booked"
    },
    {
      category: "Insurance",
      description: "Travel insurance details",
      date: input.startDate,
      location: input.destination,
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Store only provider name and safe contact summary. Keep full policy files outside this app.",
      status: "Pending"
    },
    {
      category: "Attraction",
      description: "Major attraction / theme park / museum tickets",
      date: secondDay,
      location: firstCity,
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Add booking windows, ticket owner, official source link placeholder, and reservation status after checking.",
      status: "Not Booked"
    },
    {
      category: "Restaurant",
      description: "Priority restaurant reservations",
      date: thirdDay,
      location: firstCity,
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Add preferred dates, reservation owner, dietary notes, and backup options if useful.",
      status: "Not Booked"
    },
    {
      category: "Other",
      description: "Luggage storage / forwarding placeholder",
      date: secondDay,
      location: firstCity,
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Use only if the route needs lockers, luggage forwarding, or hotel-to-hotel transfer.",
      status: "Not Booked"
    },
    {
      category: "Other",
      description: "Final booking confirmation review",
      date: input.startDate,
      location: input.destination,
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Review flights, accommodation, transport, attractions, restaurants, insurance, and emergency address notes with the group.",
      status: "Need Confirmation"
    }
  ];
}

function buildItineraryShell(
  input: SetupGenerationInput,
  template: SetupTemplateOption,
  context: SetupGenerationContext
): ItineraryInput[] {
  const totalDays = context.durationDays;
  const items: ItineraryInput[] = [];

  for (let index = 0; index < totalDays; index += 1) {
    const city = itineraryCityForDay(context, index, totalDays);
    const previousOvernightCity = index > 0 ? overnightCityForDay(context, index - 1, totalDays) : city;
    const overnightCity = overnightCityForDay(context, index, totalDays);
    const isDayTrip = isDayTripCity(context, city);
    const isTransferDay = index > 0 && overnightCity !== previousOvernightCity;
    const isFirst = index === 0;
    const isLast = index === totalDays - 1;
    const isJapan = input.templateId === "japan-general";

    items.push({
      travelDate: addDays(input.startDate, index),
      city,
      startTime: isFirst || isLast ? undefined : "09:30",
      endTime: undefined,
      title: isJapan
        ? japanItineraryTitle(input, context, index, totalDays, city)
        : isDayTrip
          ? `${city} day trip and return`
          : isTransferDay
            ? `Transfer to ${overnightCity}`
            : isFirst
              ? "Arrival and essentials setup"
              : isLast
                ? "Departure buffer and checkout"
                : `Plan ${city} day ${index + 1}`,
      location: city,
      details: isJapan
        ? japanItineraryDetails(input, context, index, totalDays, city)
        : itineraryDetails(input, context, index, totalDays, city, isDayTrip, isTransferDay),
      transport: isJapan
        ? japanTransportPrompt(input, context, index, totalDays, city)
        : itineraryTransportPrompt(input, template, context, index, totalDays, city, isDayTrip, isTransferDay),
      meal: isJapan ? japanMealPrompt(input, index) : mealPrompt(input),
      costAmount: null,
      currency: input.defaultCurrencies[0],
      notes: isJapan
        ? "Japan starter shell item. Replace with confirmed non-sensitive plan details, booking links, and meeting points."
        : "Starter shell item. Replace with confirmed non-sensitive plan details.",
      mapQuery: city,
      sortOrder: index + 1
    });
  }

  return items;
}

function itineraryCityForDay(context: SetupGenerationContext, dayIndex: number, totalDays: number) {
  const transferCity = cityForDay(context.routeCities, dayIndex, totalDays);
  if (context.dayTripCities.length === 0 || dayIndex === 0 || dayIndex === totalDays - 1) {
    return transferCity;
  }

  const dayTripSlot = dayIndex - 1;
  if (dayTripSlot >= 0 && dayTripSlot < context.dayTripCities.length) {
    return context.dayTripCities[dayTripSlot];
  }

  return transferCity;
}

function overnightCityForDay(context: SetupGenerationContext, dayIndex: number, totalDays: number) {
  return cityForDay(context.overnightCities, dayIndex, totalDays);
}

function isDayTripCity(context: SetupGenerationContext, city: string) {
  const key = cityKey(city);
  return context.dayTripCities.some((dayTripCity) => cityKey(dayTripCity) === key);
}

function itineraryDetails(
  input: SetupGenerationInput,
  context: SetupGenerationContext,
  dayIndex: number,
  totalDays: number,
  city: string,
  isDayTrip: boolean,
  isTransferDay: boolean
) {
  const overnightCity = overnightCityForDay(context, dayIndex, totalDays);
  const previousOvernightCity = dayIndex > 0 ? overnightCityForDay(context, dayIndex - 1, totalDays) : overnightCity;

  if (dayIndex === 0) {
    return "Add arrival time, transfer, accommodation check-in, connectivity setup, and a light nearby plan.";
  }
  if (dayIndex === totalDays - 1) {
    return "Add checkout time, luggage plan, departure transfer, meal buffer, and final group meeting point.";
  }
  if (isDayTrip) {
    return `Add ${city} outbound route, return route to ${overnightCity}, meal backup, and last-return buffer. Do not add accommodation for this city.`;
  }
  if (isTransferDay) {
    return `Add ${previousOvernightCity} to ${overnightCity} transport details, luggage storage or transfer notes, check-in timing, and a light first activity.`;
  }
  if (input.tripStyle === "food") {
    return "Add restaurant shortlist, reservation owner, backup meal option, local movement notes, and rest window.";
  }
  if (input.tripStyle === "shopping") {
    return "Add shopping areas, luggage or delivery notes, meal backup, local movement, and a flexible rest window.";
  }

  return "Add confirmed attractions, meal options, meeting points, booking links, rest windows, and practical notes.";
}

function itineraryTransportPrompt(
  input: SetupGenerationInput,
  template: SetupTemplateOption,
  context: SetupGenerationContext,
  dayIndex: number,
  totalDays: number,
  city: string,
  isDayTrip: boolean,
  isTransferDay: boolean
) {
  const overnightCity = overnightCityForDay(context, dayIndex, totalDays);
  const previousOvernightCity = dayIndex > 0 ? overnightCityForDay(context, dayIndex - 1, totalDays) : overnightCity;

  if (dayIndex === 0) {
    return "Add airport/station arrival route, luggage, local transport setup, and accommodation transfer notes.";
  }
  if (dayIndex === totalDays - 1) {
    return "Add checkout, luggage, station/airport transfer, and departure buffer.";
  }
  if (isDayTrip) {
    return `Add ${city} outbound route, return route to ${overnightCity}, last train/bus check, and backup transport.`;
  }
  if (isTransferDay) {
    if (input.transportMode === "car-rental") {
      return `Add drive route from ${previousOvernightCity} to ${overnightCity}, parking, tolls, pickup/drop-off, luggage, and backup timing.`;
    }
    if (input.templateId === "china-city-general" || input.templateId === "china-multi-city") {
      return "Add rail, flight, taxi, or public transport plan with station names, ticket owner, luggage, and meeting point.";
    }
    if (input.templateId === "korea-general") {
      return "Add KTX, intercity bus, subway, taxi, or airport route with ticket/card notes, luggage, and meeting point.";
    }
    return `Add transport from ${previousOvernightCity} to ${overnightCity}, ticket status, luggage plan, and meeting point.`;
  }
  if (input.transportMode === "rail") {
    return `Add rail/local transport plan for ${template.defaultDestination}, ticket/card notes, station exits, and backup route.`;
  }
  if (input.transportMode === "car-rental") {
    return "Add parking, toll, fuel, route, and driver notes once confirmed.";
  }
  if (input.transportMode === "mixed") {
    return "Add taxi, train, public transport, or walking plan once confirmed.";
  }
  if (input.transportMode === "undecided") {
    return "Choose transport mode later and add route, ticket, or pickup notes.";
  }
  return "Add public transport route, ticket/card notes, walking time, and meeting point.";
}

function japanItineraryTitle(
  input: SetupGenerationInput,
  context: SetupGenerationContext,
  dayIndex: number,
  totalDays: number,
  city: string
) {
  const isFirst = dayIndex === 0;
  const isLast = dayIndex === totalDays - 1;
  const previousOvernightCity = dayIndex > 0 ? overnightCityForDay(context, dayIndex - 1, totalDays) : city;
  const overnightCity = overnightCityForDay(context, dayIndex, totalDays);
  const isTransferDay = dayIndex > 0 && overnightCity !== previousOvernightCity;
  const isDayTrip = isDayTripCity(context, city);

  if (isFirst) {
    return "Arrival / check-in / light local exploration";
  }
  if (isLast) {
    return "Departure buffer / checkout / airport transfer";
  }
  if (isDayTrip) {
    return `${city} day trip / return to ${overnightCity}`;
  }
  if (isTransferDay) {
    return `Transfer to ${overnightCity} / station and luggage buffer`;
  }

  const pattern = dayIndex % 4;
  if (pattern === 1) {
    return `${city} city exploration day`;
  }
  if (pattern === 2) {
    return `${city} attraction / reservation day`;
  }
  if (pattern === 3) {
    return `${city} food / shopping / flexible day`;
  }
  return `${city} open plan / backup weather day`;
}

function japanItineraryDetails(
  input: SetupGenerationInput,
  context: SetupGenerationContext,
  dayIndex: number,
  totalDays: number,
  city: string
) {
  const previousOvernightCity = dayIndex > 0 ? overnightCityForDay(context, dayIndex - 1, totalDays) : city;
  const overnightCity = overnightCityForDay(context, dayIndex, totalDays);
  const isTransferDay = dayIndex > 0 && overnightCity !== previousOvernightCity;
  const isDayTrip = isDayTripCity(context, city);

  if (dayIndex === 0) {
    return "Add arrival time, airport or station transfer, accommodation check-in, IC card or local transport setup, and a light nearby plan.";
  }
  if (dayIndex === totalDays - 1) {
    return "Add checkout time, luggage plan, airport or station transfer, meal buffer, and final group meeting point.";
  }
  if (isDayTrip) {
    return `Add ${city} outbound route, return route to ${overnightCity}, booking windows, meal backup, and last-return buffer.`;
  }
  if (isTransferDay) {
    return `Add ${previousOvernightCity} to ${overnightCity} rail or transport details, luggage storage/forwarding notes, check-in timing, and a light first activity.`;
  }

  return "Add confirmed attractions, restaurant reservations, shopping or rest windows, meeting points, booking links, and practical notes.";
}

function japanTransportPrompt(
  input: SetupGenerationInput,
  context: SetupGenerationContext,
  dayIndex: number,
  totalDays: number,
  city: string
) {
  const previousOvernightCity = dayIndex > 0 ? overnightCityForDay(context, dayIndex - 1, totalDays) : city;
  const overnightCity = overnightCityForDay(context, dayIndex, totalDays);
  const isTransferDay = dayIndex > 0 && overnightCity !== previousOvernightCity;
  const isDayTrip = isDayTripCity(context, city);

  if (dayIndex === 0) {
    return "Add airport/station arrival route, IC card setup, luggage, and accommodation transfer notes.";
  }
  if (dayIndex === totalDays - 1) {
    return "Add checkout, luggage, station/airport transfer, and departure buffer.";
  }
  if (isDayTrip) {
    return `Add ${city} outbound route, return route to ${overnightCity}, last train/bus check, and backup taxi option.`;
  }
  if (isTransferDay) {
    return input.transportMode === "car-rental"
      ? "Add drive route, parking, toll, pickup/drop-off, luggage, and backup timing notes."
      : "Add Shinkansen, limited express, local train, or bus route, seat/reservation status, station names, luggage, and meeting point.";
  }
  if (input.transportMode === "rail") {
    return "Add local train/subway/bus route, IC card notes, station exits, and backup taxi option.";
  }
  if (input.transportMode === "car-rental") {
    return "Add parking, toll, fuel, route, and driver notes once confirmed.";
  }
  return "Add local transport route, ticket/card notes, walking time, and meeting point.";
}

function japanMealPrompt(input: SetupGenerationInput, dayIndex: number) {
  if (input.tripStyle === "food") {
    return "Add restaurant shortlist, reservation owner, backup meal option, and dietary notes if useful.";
  }
  if (input.tripStyle === "shopping") {
    return "Add mall, market, konbini, or station-area meal options near the day's route.";
  }
  if (dayIndex === 0) {
    return "Add simple arrival meal or convenience-store backup near accommodation.";
  }
  return mealPrompt(input);
}

function buildPacking(
  input: SetupGenerationInput,
  template: SetupTemplateOption,
  travelerIds: string[],
  context: SetupGenerationContext
): PackingInput[] {
  if (input.templateId === "japan-general") {
    return buildJapanPacking(input, travelerIds, context);
  }

  const destinationItems = destinationPackingItems(input.templateId, context);
  const baseItems: Array<Omit<PackingInput, "statuses" | "sortOrder"> & { sharedOwnerIndex?: number }> = [
    {
      name: "Passport / travel document wallet",
      category: "Documents",
      priority: "High",
      notes: "Carry the actual documents securely. Do not store document numbers in this app.",
      quantity: null
    },
    {
      name: input.luggageMode === "carry-on" ? "Carry-on packing cube set" : "Checked luggage tag and lock",
      category: "Travel Essentials",
      priority: "Medium",
      notes: `Generated for ${optionLabel(input.luggageMode ?? "checked-luggage")} mode.`,
      quantity: null
    },
    {
      name: "Phone charger and power bank",
      category: "Electronics",
      priority: "High",
      notes: "Confirm airline and local rules before packing power banks.",
      quantity: null
    },
    {
      name: "Travel adapter",
      category: "Electronics",
      priority: "High",
      notes: `Check plug type for ${template.defaultDestination}.`,
      quantity: null
    },
    {
      name: "Basic personal medicine",
      category: "Medicine",
      priority: "Medium",
      notes: "Keep medicine details private and follow personal medical advice.",
      quantity: null
    },
    {
      name: "Toiletries kit",
      category: "Toiletries",
      priority: "Medium",
      notes: "Use travel-size containers where needed.",
      quantity: null
    },
    {
      name: "Offline booking screenshots",
      category: "Documents",
      priority: "Medium",
      notes: "Save safe screenshots for flights, accommodation, transport, and major bookings. Keep full private files outside this app.",
      quantity: null
    },
    ...context.season.packingItems,
    ...destinationItems,
    {
      name: "Shared first aid basics",
      category: "Shared Items",
      priority: "Medium",
      notes: "Assign one traveler for shared basics. Keep private medical details outside this app.",
      quantity: null,
      sharedOwnerIndex: 0
    },
    {
      name: "Shared charging adapter / extension plug",
      category: "Shared Items",
      priority: "Medium",
      notes: "Assign one traveler if the group wants a shared charging backup.",
      quantity: null,
      sharedOwnerIndex: 1
    }
  ];

  return baseItems.map((item, index) => {
    const { sharedOwnerIndex, ...packingItem } = item;
    return {
      ...packingItem,
      sortOrder: index + 1,
      statuses:
        sharedOwnerIndex === undefined
          ? requiredStatusesForAll(travelerIds)
          : sharedOwnerStatuses(travelerIds, sharedOwnerIndex)
    };
  });
}

function buildJapanPacking(
  input: SetupGenerationInput,
  travelerIds: string[],
  context: SetupGenerationContext
): PackingInput[] {
  const checkedLuggage = input.luggageMode === "checked-luggage" || input.luggageMode === "mixed";
  const firstSeasonItem = context.season.packingItems[0];
  const secondSeasonItem = context.season.packingItems[1];
  const items: Array<Omit<PackingInput, "statuses"> & { sharedOwnerIndex?: number }> = [
    {
      name: "Passport / travel document wallet",
      category: "Documents",
      priority: "High",
      notes: "Carry actual documents securely. Do not store document numbers in this app.",
      quantity: null,
      sortOrder: 1
    },
    {
      name: "Offline copy of hotel and first-night address",
      category: "Documents",
      priority: "High",
      notes: "Save screenshots or offline notes before departure; keep full private files outside this app.",
      quantity: null,
      sortOrder: 2
    },
    {
      name: "Comfortable walking shoes",
      category: "Clothes",
      priority: "High",
      notes: "Japan city trips often involve long station walks and stairs.",
      quantity: null,
      sortOrder: 3
    },
    {
      name: firstSeasonItem?.name ?? "Weather-appropriate outerwear",
      category: firstSeasonItem?.category ?? "Clothes",
      priority: firstSeasonItem?.priority ?? "Medium",
      notes: firstSeasonItem?.notes ?? `Generated for ${context.season.label}. Adjust after checking Japan weather one week before departure.`,
      quantity: null,
      sortOrder: 4
    },
    {
      name: secondSeasonItem?.name ?? "Seasonal clothing layers",
      category: secondSeasonItem?.category ?? "Clothes",
      priority: secondSeasonItem?.priority ?? "Medium",
      notes: secondSeasonItem?.notes ?? context.season.note,
      quantity: null,
      sortOrder: 5
    },
    {
      name: "Compact umbrella or rain jacket",
      category: "Travel Essentials",
      priority: "Medium",
      notes: "Useful for city walking and station transfers.",
      quantity: null,
      sortOrder: 6
    },
    {
      name: "Toiletries kit",
      category: "Toiletries",
      priority: "Medium",
      notes: "Use travel-size containers where needed.",
      quantity: null,
      sortOrder: 7
    },
    {
      name: "Medication / basic first aid",
      category: "Medicine",
      priority: "Medium",
      notes: "Keep medicine details private and follow personal medical advice.",
      quantity: null,
      sortOrder: 8
    },
    {
      name: "Hand sanitizer / wet wipes",
      category: "Personal Care",
      priority: "Medium",
      notes: "Useful for long train days and food stops.",
      quantity: null,
      sortOrder: 9
    },
    {
      name: "Universal travel adapter",
      category: "Electronics",
      priority: "High",
      notes: "Check your device plugs and voltage needs before packing.",
      quantity: null,
      sortOrder: 10
    },
    {
      name: "Portable charger / power bank",
      category: "Electronics",
      priority: "High",
      notes: "Confirm airline and local rules before packing power banks.",
      quantity: null,
      sortOrder: 11
    },
    {
      name: "Phone charging cable",
      category: "Electronics",
      priority: "High",
      notes: "Pack the cable needed for maps, translation, transport, and booking screenshots.",
      quantity: null,
      sortOrder: 12
    },
    {
      name: "eSIM / pocket WiFi setup details",
      category: "Electronics",
      priority: "High",
      notes: "Add activation, pickup, return, and backup roaming notes after confirmed.",
      quantity: null,
      sortOrder: 13
    },
    {
      name: "Small coin pouch or wallet",
      category: "Travel Essentials",
      priority: "Medium",
      notes: "Useful for coins, receipts, and small cash situations.",
      quantity: null,
      sortOrder: 14
    },
    {
      name: "Reusable shopping bag",
      category: "Travel Essentials",
      priority: "Low",
      notes: "Useful for convenience stores, shopping, and day trips.",
      quantity: null,
      sortOrder: 15
    },
    {
      name: checkedLuggage ? "Checked luggage tag" : "Carry-on luggage tag",
      category: "Travel Essentials",
      priority: "Medium",
      notes: `Generated for ${optionLabel(input.luggageMode ?? "checked-luggage")} mode.`,
      quantity: null,
      sortOrder: 16
    },
    {
      name: "Travel lock",
      category: "Travel Essentials",
      priority: "Medium",
      notes: "Use where appropriate for luggage storage or hotel transfers.",
      quantity: null,
      sortOrder: 17
    },
    {
      name: "Extra foldable bag for shopping",
      category: "Travel Essentials",
      priority: "Low",
      notes: "Optional space for souvenirs, shopping, or laundry separation.",
      quantity: null,
      sortOrder: 18
    },
    {
      name: "IC card / local transport setup note",
      category: "Travel Essentials",
      priority: "High",
      notes: "Edit after choosing physical IC card, mobile wallet, or other local transport setup.",
      quantity: null,
      sortOrder: 19
    },
    {
      name: "Shared group medicine / first aid kit",
      category: "Shared Items",
      priority: "Medium",
      notes: "Assign one traveler to carry the shared kit; keep private medical details out of notes.",
      quantity: null,
      sortOrder: 20,
      sharedOwnerIndex: 0
    },
    {
      name: "Shared charging adapter / extension plug",
      category: "Shared Items",
      priority: "Medium",
      notes: "Assign one traveler if the group wants a shared charging backup.",
      quantity: null,
      sortOrder: 21,
      sharedOwnerIndex: 1
    },
    {
      name: "Offline map / translation downloads",
      category: "Electronics",
      priority: "Medium",
      notes: "Download city maps, station areas, accommodation addresses, and translation tools before departure.",
      quantity: null,
      sortOrder: 22
    },
    {
      name: "Key booking screenshots",
      category: "Documents",
      priority: "Medium",
      notes: "Save safe screenshots for flights, hotels, rail, attractions, and restaurants; keep private full files outside this app.",
      quantity: null,
      sortOrder: 23
    }
  ];

  return items.map((item) => {
    const { sharedOwnerIndex, ...packingItem } = item;
    return {
      ...packingItem,
      statuses:
        sharedOwnerIndex === undefined
          ? requiredStatusesForAll(travelerIds)
          : sharedOwnerStatuses(travelerIds, sharedOwnerIndex)
    };
  });
}

function destinationPackingItems(
  templateId: SetupTemplateId,
  context: SetupGenerationContext
): Array<Omit<PackingInput, "statuses" | "sortOrder">> {
  switch (templateId) {
    case "china-city-general":
    case "china-multi-city":
      return [
        {
          name: "Payment and local transport app setup",
          category: "Travel Essentials",
          priority: "High",
          notes: "Add non-sensitive setup notes only. Do not store card numbers, passcodes, or account details.",
          quantity: null
        },
        {
          name: "Offline map and translation app setup",
          category: "Electronics",
          priority: "Medium",
          notes: `Download maps, translation tools, and accommodation addresses for ${context.overnightCities.join(", ")} before departure.`,
          quantity: null
        },
        {
          name: "Connectivity backup",
          category: "Electronics",
          priority: "Medium",
          notes: "Add roaming, eSIM, local SIM, or Wi-Fi backup notes after choosing the setup.",
          quantity: null
        },
        {
          name: "Luggage storage / transfer notes",
          category: "Travel Essentials",
          priority: inputLikeMultiCity(templateId, context) ? "Medium" : "Low",
          notes: "Use for station lockers, hotel storage, delivery, or route-change days if needed.",
          quantity: null
        },
        {
          name: "Safe document copies",
          category: "Documents",
          priority: "High",
          notes: "Keep safe summaries and cloud-folder placeholders only. Do not store passport numbers in this app.",
          quantity: null
        }
      ];
    case "japan-general":
      return [
        {
          name: "IC card or mobile transport setup",
          category: "Travel Essentials",
          priority: "High",
          notes: "Add chosen setup path after confirming device compatibility.",
          quantity: null
        },
        {
          name: "Pocket WiFi or eSIM setup",
          category: "Electronics",
          priority: "Medium",
          notes: "Add pickup or activation notes when confirmed.",
          quantity: null
        }
      ];
    case "korea-general":
      return [
        {
          name: "Transport card setup",
          category: "Travel Essentials",
          priority: "High",
          notes: "Add selected card, app, pickup, or top-up notes after confirming.",
          quantity: null
        },
        {
          name: "Korea map and translation app setup",
          category: "Electronics",
          priority: "Medium",
          notes: `Download maps, translation tools, and accommodation addresses for ${context.overnightCities.join(", ")} before departure.`,
          quantity: null
        },
        {
          name: "eSIM or roaming setup",
          category: "Electronics",
          priority: "High",
          notes: "Add activation, backup roaming, and airport setup notes after confirmed.",
          quantity: null
        },
        {
          name: "Restaurant / beauty / appointment notes",
          category: "Travel Essentials",
          priority: "Low",
          notes: "Use only for confirmed reservations, safe contact notes, or booking windows.",
          quantity: null
        }
      ];
    default:
      return [
        {
          name: "Offline map and translation backup",
          category: "Electronics",
          priority: "Medium",
          notes: "Download before departure and replace with destination-specific tools after checking.",
          quantity: null
        },
        {
          name: "Connectivity backup",
          category: "Electronics",
          priority: "Medium",
          notes: "Add roaming, eSIM, local SIM, or Wi-Fi plan after choosing the setup.",
          quantity: null
        },
        {
          name: "Reusable day bag",
          category: "Travel Essentials",
          priority: "Low",
          notes: "Useful for travel days and sightseeing.",
          quantity: null
        }
      ];
  }
}

function inputLikeMultiCity(templateId: SetupTemplateId, context: SetupGenerationContext) {
  return templateId === "china-multi-city" || context.routeLegs.length > 0 || context.dayTripCities.length > 0;
}

function buildDocuments(
  input: SetupGenerationInput,
  template: SetupTemplateOption,
  travelerIds: string[],
  context: SetupGenerationContext
): DocumentInput[] {
  if (input.templateId === "japan-general") {
    return buildJapanDocuments(input, travelerIds, context);
  }

  const baseDocuments: Array<Omit<DocumentInput, "statuses">> = [
    {
      title: "Passport validity check",
      category: "Passport",
      priority: "High",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Check actual passport details outside this app. Do not store passport numbers here.",
      sortOrder: 1
    },
    {
      title: "Official entry / visa source check",
      category: "Visa / Entry",
      priority: "High",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Use official sources. This starter item is not legal or immigration advice.",
      sortOrder: 2
    },
    {
      title: "Flight or arrival transport summary",
      category: "Flight",
      priority: "High",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Store only safe summary and cloud-folder placeholder if needed.",
      sortOrder: 3
    },
    {
      title: `${context.accommodationLabel} summaries for overnight cities`,
      category: "Hotel",
      priority: "High",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: `Add safe check-in notes for overnight cities only: ${context.overnightCities.join(", ")}.`,
      sortOrder: 4
    },
    {
      title: "Travel insurance summary",
      category: "Insurance",
      priority: "Medium",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Keep full certificates outside this app.",
      sortOrder: 5
    },
    {
      title: context.routeLegs.length > 0 ? "Route transport summaries" : "Local transport setup notes",
      category: "Transport",
      priority: "Medium",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: context.routeLegs.length > 0
        ? `Add safe route, ticket, station, pickup, and owner notes for ${formatRouteLegs(context)}.`
        : "Add safe route, pickup, card/app, and owner notes after confirmed.",
      sortOrder: 6
    },
    {
      title: context.dayTripCities.length > 0 ? "Day trip return transport notes" : "Attraction / restaurant booking summaries",
      category: "Booking",
      priority: "Medium",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: context.dayTripCities.length > 0
        ? `Add outbound, return, last-return, and backup transport notes for ${context.dayTripCities.join(", ")}. Do not add accommodation for these cities.`
        : "Add safe booking summaries, owner notes, and official source links after confirmed.",
      sortOrder: 7
    },
    {
      title: "Connectivity and offline access setup",
      category: "Other",
      priority: "Medium",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Add eSIM, roaming, offline map, translation, and accommodation address notes after choosing the setup.",
      sortOrder: 8
    },
    {
      title: "Emergency contact and address placeholder",
      category: "Other",
      priority: "High",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Add group emergency contact, accommodation address, insurance contact, and official local emergency number source before departure.",
      sortOrder: 9
    },
    {
      title: "Shared cloud folder placeholder",
      category: "Other",
      priority: "Low",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Use permission-controlled cloud storage for real files.",
      sortOrder: 10
    },
    {
      title: "Offline copies / screenshots of key bookings",
      category: "Booking",
      priority: "Medium",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Save safe screenshots for flights, accommodation, transport, attractions, food bookings, insurance, and emergency address basics.",
      sortOrder: 11
    }
  ];

  return baseDocuments.map((document) => ({
    ...document,
    statuses: travelerIds.map((travelerId) => ({
      travelerId,
      status: "required"
    }))
  }));
}

function buildJapanDocuments(
  input: SetupGenerationInput,
  travelerIds: string[],
  context: SetupGenerationContext
): DocumentInput[] {
  const firstCity = context.overnightCities[0] ?? input.destination;
  const documents: Array<Omit<DocumentInput, "statuses">> = [
    {
      title: "Passport validity check",
      category: "Passport",
      priority: "High",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Check actual passport details outside this app. Do not store passport numbers here.",
      sortOrder: 1
    },
    {
      title: "Official visa / entry requirement source check",
      category: "Visa / Entry",
      priority: "High",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Add an official source link after checking. This starter item is not legal or immigration advice.",
      sortOrder: 2
    },
    {
      title: "Flight confirmation safe summary",
      category: "Flight",
      priority: "High",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Store only safe arrival/departure summary. Keep full confirmation files outside this app.",
      sortOrder: 3
    },
    {
      title: "Accommodation confirmation summaries",
      category: "Hotel",
      priority: "High",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: `Add hotel names, city dates, check-in windows, and safe address notes for overnight cities only: ${context.overnightCities.join(", ") || firstCity}.`,
      sortOrder: 4
    },
    {
      title: "Travel insurance details",
      category: "Insurance",
      priority: "High",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Store provider name and emergency contact only. Keep full certificates outside this app.",
      sortOrder: 5
    },
    {
      title: context.routeLegs.length > 0 ? "Rail / Shinkansen / intercity ticket confirmations" : "Local transport / IC card setup notes",
      category: "Transport",
      priority: "Medium",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: context.routeLegs.length > 0
        ? `Add safe route, station, ticket owner, and reservation-status notes for ${formatRouteLegs(context)} after confirmed.`
        : "Add safe route, station, ticket owner, and IC card setup notes after confirmed.",
      sortOrder: 6
    },
    {
      title: "Attraction / event / restaurant ticket confirmations",
      category: "Booking",
      priority: "Medium",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Track booking windows, official source links, ticket owners, and reservation status.",
      sortOrder: 7
    },
    {
      title: context.dayTripCities.length > 0 ? "Day trip return transport notes" : "Flexible day route notes",
      category: "Transport",
      priority: "Medium",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: context.dayTripCities.length > 0
        ? `Add outbound route, return route, last train/bus check, and backup option for ${context.dayTripCities.join(", ")}. Do not add accommodation for these cities.`
        : "Add local route notes, station exits, or backup taxi option after the daily plan is confirmed.",
      sortOrder: 8
    },
    {
      title: "Emergency contact list and hotel address placeholder",
      category: "Other",
      priority: "High",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Add group emergency contact, hotel address, local emergency number source, and insurance contact before departure.",
      sortOrder: 9
    },
    {
      title: "Medical note / medication list if applicable",
      category: "Other",
      priority: "Medium",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Keep private medical details outside this app unless the group deliberately chooses safe summary wording.",
      sortOrder: 10
    },
    {
      title: "Permission-controlled cloud folder link placeholder",
      category: "Other",
      priority: "Low",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Use private cloud storage for real files. Do not paste passcodes, passport numbers, or full confirmations into notes.",
      sortOrder: 11
    },
    {
      title: "Offline copies / screenshots of key bookings",
      category: "Booking",
      priority: "Medium",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Save safe screenshots for flight, hotel, rail, attraction, restaurant, insurance, and emergency address basics.",
      sortOrder: 12
    }
  ];

  return documents.map((document) => ({
    ...document,
    statuses: requiredDocumentStatusesForAll(travelerIds)
  }));
}

function budgetCategoriesForTemplate(templateId: SetupTemplateId, context?: SetupGenerationContext) {
  const hasRouteComplexity = (context?.routeLegs.length ?? 0) > 0 || (context?.dayTripCities.length ?? 0) > 0;

  switch (templateId) {
    case "japan-general":
      return [
        "Flights",
        "Accommodation",
        "Intercity transport",
        "Local transport",
        "Food",
        "Attractions",
        "Shopping",
        "eSIM / pocket WiFi",
        "Insurance",
        "Luggage storage / forwarding",
        "Emergency buffer",
        "Shared group expenses"
      ];
    case "korea-general":
      return [
        "Flights",
        "Accommodation",
        "KTX / intercity transport",
        "Local transport",
        "Food",
        "Attractions",
        "Restaurant / appointment deposits",
        "eSIM / roaming",
        "Insurance",
        "Shopping",
        "Emergency buffer",
        "Shared group expenses"
      ];
    case "china-city-general":
    case "china-multi-city":
      return [
        "Flights",
        "Accommodation",
        ...(hasRouteComplexity ? ["Intercity transport"] : []),
        "Local transport",
        "Food",
        "Attractions",
        "Mobile payment buffer",
        "eSIM / roaming",
        "Insurance",
        "Luggage storage / transfer",
        "Emergency buffer",
        "Shared group expenses"
      ];
    default:
      return [
        "Flights",
        "Accommodation",
        hasRouteComplexity ? "Route transport" : "Local transport",
        "Food",
        "Attractions",
        "Insurance",
        "Connectivity",
        "Shopping",
        "Emergency buffer",
        "Shared group expenses"
      ];
  }
}

function requiredStatusesForAll(travelerIds: string[]): PackingInput["statuses"] {
  return travelerIds.map((travelerId) => ({
    travelerId,
    status: "required"
  }));
}

function sharedOwnerStatuses(travelerIds: string[], ownerIndex: number): PackingInput["statuses"] {
  if (travelerIds.length === 0) {
    return [];
  }

  const selectedIndex = ownerIndex % travelerIds.length;
  return travelerIds.map((travelerId, index) => ({
    travelerId,
    status: index === selectedIndex ? "required" : "not_needed"
  }));
}

function requiredDocumentStatusesForAll(travelerIds: string[]): DocumentInput["statuses"] {
  return travelerIds.map((travelerId) => ({
    travelerId,
    status: "required"
  }));
}

function routeDateForIndex(input: SetupGenerationInput, index: number) {
  const totalDays = daysInclusive(input.startDate, input.endDate);
  return addDays(input.startDate, Math.min(totalDays - 1, Math.floor((index * totalDays) / input.routeCities.length)));
}

function transportPrompt(
  input: SetupGenerationInput,
  template: SetupTemplateOption,
  isFirst: boolean,
  isLast: boolean
) {
  if (isFirst) {
    return "Add arrival transport from airport/station to accommodation.";
  }
  if (isLast) {
    return "Add checkout, luggage, and departure transport buffer.";
  }
  if (input.transportMode === "rail") {
    return `Add rail/local transport plan for ${template.defaultDestination}.`;
  }
  if (input.transportMode === "car-rental") {
    return "Add pickup, parking, toll, route, fuel, and driver notes once confirmed.";
  }
  if (input.transportMode === "mixed") {
    return "Add taxi, train, public transport, or walking plan once confirmed.";
  }
  if (input.transportMode === "undecided") {
    return "Choose transport mode later and add route, ticket, or pickup notes.";
  }
  return "Add public transport route, ticket/card notes, and meeting point.";
}

function mealPrompt(input: SetupGenerationInput) {
  if (input.tripStyle === "relaxed") {
    return "Add simple meal plan with backup options and rest time.";
  }
  if (input.tripStyle === "packed") {
    return "Add quick meal options near the day's route.";
  }
  if (input.tripStyle === "shopping") {
    return "Add mall, market, or shopping-area meal options.";
  }
  if (input.tripStyle === "food") {
    return "Add restaurant shortlist, reservation owner, and backup meal option.";
  }
  if (input.tripStyle === "family") {
    return "Add simple meal plan and rest breaks if useful.";
  }
  return "Add meal plan or backup option.";
}

function intercityBookingCategory(input: SetupGenerationInput): BookingInput["category"] {
  if (input.templateId === "generic-international" || input.transportMode === "car-rental" || input.transportMode === "undecided") {
    return "Other";
  }
  return "Train";
}

function transportBookingLabel(input: SetupGenerationInput) {
  if (input.transportMode === "car-rental") {
    return "Car rental / drive plan";
  }
  if (input.transportMode === "rail") {
    return "Rail / train transport";
  }
  if (input.transportMode === "mixed") {
    return "Intercity transport";
  }
  return "Route transport";
}

function cityForDay(cities: string[], dayIndex: number, totalDays: number) {
  const cityIndex = Math.min(cities.length - 1, Math.floor((dayIndex * cities.length) / totalDays));
  return cities[cityIndex] ?? cities[0] ?? "Main city";
}

function countryForTemplate(input: SetupGenerationInput, template: SetupTemplateOption) {
  if (input.templateId === "china-city-general" || input.templateId === "china-multi-city") {
    return "China";
  }
  if (input.templateId === "japan-general") {
    return "Japan";
  }
  if (input.templateId === "korea-general") {
    return "South Korea";
  }
  return input.destination || template.defaultDestination;
}

function travelerIdForIndex(index: number) {
  return `person_${String.fromCharCode(97 + index)}`;
}

function isDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function daysInclusive(startDate: string, endDate: string) {
  return Math.floor((dateToUtc(endDate).getTime() - dateToUtc(startDate).getTime()) / 86400000) + 1;
}

function addDays(value: string, days: number) {
  const date = dateToUtc(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateToUtc(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function optionLabel(value: string) {
  return value.replace(/-/g, " ");
}
