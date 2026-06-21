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
  tripStyle?: SetupTripStyle;
  transportMode?: SetupTransportMode;
  accommodationMode?: SetupAccommodationMode;
  luggageMode?: SetupLuggageMode;
  expenseSplittingEnabled: boolean;
};

export type SetupGenerationSummary = {
  templateId: SetupTemplateId;
  templateLabel: string;
  travelerCount: number;
  routeStopCount: number;
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
  const travelers = input.travelerNames.map((displayName, index) => ({
    id: travelerIdForIndex(index),
    displayName,
    displayOrder: index + 1,
    isActive: true
  }));
  const owner = input.travelerNames[0];
  const routeStops = buildRouteStops(input, template);
  const tripNotes = buildTripNotes(input, template);
  const itineraryItems = buildItineraryShell(input, template);
  const reminders = buildReminders(input, template, owner);
  const bookings = buildBookings(input, template, owner);
  const packingItems = buildPacking(input, template, travelers.map((traveler) => traveler.id));
  const documents = buildDocuments(input, template, travelers.map((traveler) => traveler.id));

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
      reminderCount: reminders.length,
      bookingCount: bookings.length,
      itineraryCount: itineraryItems.length,
      itineraryDayCount: daysInclusive(input.startDate, input.endDate),
      packingCount: packingItems.length,
      documentCount: documents.length,
      budgetCategoryCount: expenseCategories.length,
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
  const items = Array.isArray(value) ? value : [];
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

function buildRouteStops(input: SetupGenerationInput, template: SetupTemplateOption): TripSettingsInput["routeStops"] {
  const totalDays = daysInclusive(input.startDate, input.endDate);
  const country = countryForTemplate(input, template);

  return input.routeCities.map((city, index) => {
    const startOffset = Math.floor((index * totalDays) / input.routeCities.length);
    const endOffset = Math.max(startOffset, Math.floor(((index + 1) * totalDays) / input.routeCities.length) - 1);

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

function buildTripNotes(input: SetupGenerationInput, template: SetupTemplateOption) {
  return [
    `Generated starter workspace from ${template.label}.`,
    `Trip style: ${optionLabel(input.tripStyle ?? "balanced")}.`,
    `Transport: ${optionLabel(input.transportMode ?? "public-transport")}.`,
    `Accommodation: ${optionLabel(input.accommodationMode ?? "hotel")}.`,
    `Luggage: ${optionLabel(input.luggageMode ?? "checked-luggage")}.`,
    `Expense splitting: ${input.expenseSplittingEnabled ? "enabled" : "disabled"}.`,
    "Replace all placeholder checklist items with confirmed non-sensitive trip details."
  ].join("\n");
}

function buildReminders(input: SetupGenerationInput, template: SetupTemplateOption, owner: string): ReminderInput[] {
  const destinationItems = destinationReminderItems(input.templateId);
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

function destinationReminderItems(templateId: SetupTemplateId) {
  switch (templateId) {
    case "china-city-general":
      return [
        "Confirm payment setup, local transport app access, and connectivity before arrival.",
        "Save offline map, translation, and hotel address details for the main city.",
        "Check attraction booking windows and local reservation rules."
      ];
    case "china-multi-city":
      return [
        "Confirm intercity train or flight placeholders for every route leg.",
        "Prepare payment setup, transport app access, and hotel address notes for each city.",
        "Save offline map, translation, and connectivity backups before departure."
      ];
    case "japan-general":
      return [
        "Confirm IC card or local transport setup before the first full day.",
        "Add rail or intercity transport placeholders for route days.",
        "Review restaurant, attraction, and pocket WiFi or eSIM tasks."
      ];
    case "korea-general":
      return [
        "Confirm transport card, eSIM or roaming, and map app setup before arrival.",
        "Add restaurant, attraction, beauty, or appointment booking placeholders.",
        "Save hotel address and local navigation notes for each city."
      ];
    default:
      return [
        "Check official entry and document sources for every traveler.",
        "Confirm roaming or eSIM, transport, and accommodation basics.",
        "Save offline copies of non-sensitive booking summaries."
      ];
  }
}

function buildBookings(input: SetupGenerationInput, template: SetupTemplateOption, owner: string): BookingInput[] {
  const accommodationLabel = input.accommodationMode === "airbnb" ? "Airbnb / homestay" : optionLabel(input.accommodationMode ?? "hotel");
  const routeBookings = input.routeCities.map((city, index) => ({
    category: "Hotel" as const,
    description: `${city} ${accommodationLabel} confirmation`,
    date: routeDateForIndex(input, index),
    location: city,
    bookedBy: owner,
    amount: null,
    currency: null,
    notes: "Add provider, safe confirmation summary, check-in details, and cloud link if needed.",
    status: "Pending" as const
  }));
  const intercityBookings = input.routeCities.slice(1).map((city, index) => ({
    category: intercityBookingCategory(input),
    description: `${transportBookingLabel(input)} to ${city}`,
    date: routeDateForIndex(input, index + 1),
    location: city,
    bookedBy: owner,
    amount: null,
    currency: null,
    notes: "Add route, station/airport, departure time, and booking owner after confirmed.",
    status: "Not Booked" as const
  }));

  return [
    {
      category: "Flight",
      description: "International arrival / departure transport",
      date: input.startDate,
      location: input.routeCities[0],
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Add safe flight or arrival summary only. Do not store full confirmation PDFs here.",
      status: "Pending"
    },
    ...routeBookings,
    ...intercityBookings,
    {
      category: "Attraction",
      description: `${template.defaultDestination} key attraction reservations`,
      date: addDays(input.startDate, Math.min(1, daysInclusive(input.startDate, input.endDate) - 1)),
      location: input.routeCities[0],
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Add booking windows, ticket owners, and official source links after checking.",
      status: "Not Booked"
    },
    {
      category: "Restaurant",
      description: "Priority restaurant reservations",
      date: addDays(input.startDate, Math.min(2, daysInclusive(input.startDate, input.endDate) - 1)),
      location: input.routeCities[0],
      bookedBy: owner,
      amount: null,
      currency: null,
      notes: "Add preferred dates, reservation owner, and dietary notes if useful.",
      status: "Not Booked"
    },
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
    }
  ];
}

function buildItineraryShell(input: SetupGenerationInput, template: SetupTemplateOption): ItineraryInput[] {
  const totalDays = daysInclusive(input.startDate, input.endDate);
  const items: ItineraryInput[] = [];

  for (let index = 0; index < totalDays; index += 1) {
    const city = cityForDay(input.routeCities, index, totalDays);
    const isFirst = index === 0;
    const isLast = index === totalDays - 1;

    items.push({
      travelDate: addDays(input.startDate, index),
      city,
      startTime: isFirst || isLast ? undefined : "09:30",
      endTime: undefined,
      title: isFirst ? "Arrival and essentials setup" : isLast ? "Departure buffer and checkout" : `Plan ${city} day ${index + 1}`,
      location: city,
      details: "Add confirmed activities, meeting points, booking links, and practical notes.",
      transport: transportPrompt(input, template, isFirst, isLast),
      meal: mealPrompt(input),
      costAmount: null,
      currency: input.defaultCurrencies[0],
      notes: "Generated shell item. Replace with confirmed non-sensitive plan details.",
      mapQuery: city,
      sortOrder: index + 1
    });
  }

  return items;
}

function buildPacking(input: SetupGenerationInput, template: SetupTemplateOption, travelerIds: string[]): PackingInput[] {
  const destinationItems = destinationPackingItems(input.templateId);
  const baseItems: Array<Omit<PackingInput, "statuses">> = [
    {
      name: "Passport / travel document wallet",
      category: "Documents",
      priority: "High",
      notes: "Carry the actual documents securely. Do not store document numbers in this app.",
      quantity: null,
      sortOrder: 1
    },
    {
      name: input.luggageMode === "carry-on" ? "Carry-on packing cube set" : "Checked luggage tag and lock",
      category: "Travel Essentials",
      priority: "Medium",
      notes: `Generated for ${optionLabel(input.luggageMode ?? "checked-luggage")} mode.`,
      quantity: null,
      sortOrder: 2
    },
    {
      name: "Phone charger and power bank",
      category: "Electronics",
      priority: "High",
      notes: "Confirm airline and local rules before packing power banks.",
      quantity: null,
      sortOrder: 3
    },
    {
      name: "Travel adapter",
      category: "Electronics",
      priority: "High",
      notes: `Check plug type for ${template.defaultDestination}.`,
      quantity: null,
      sortOrder: 4
    },
    {
      name: "Weather-appropriate clothes",
      category: "Clothes",
      priority: "Medium",
      notes: "Adjust after checking weather one week before departure.",
      quantity: null,
      sortOrder: 5
    },
    {
      name: "Basic personal medicine",
      category: "Medicine",
      priority: "Medium",
      notes: "Keep medicine details private and follow personal medical advice.",
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
    ...destinationItems.map((item, index) => ({ ...item, sortOrder: index + 8 }))
  ];

  return baseItems.map((item) => ({
    ...item,
    statuses: travelerIds.map((travelerId) => ({
      travelerId,
      status: "required"
    }))
  }));
}

function destinationPackingItems(templateId: SetupTemplateId): Array<Omit<PackingInput, "statuses" | "sortOrder">> {
  switch (templateId) {
    case "china-city-general":
    case "china-multi-city":
      return [
        {
          name: "Payment and local transport app setup",
          category: "Travel Essentials",
          priority: "High",
          notes: "Add non-sensitive setup notes only.",
          quantity: null
        },
        {
          name: "Offline map and translation app setup",
          category: "Electronics",
          priority: "Medium",
          notes: "Download before departure.",
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
          notes: "Add selected card or app notes after confirming.",
          quantity: null
        },
        {
          name: "Korea map and translation app setup",
          category: "Electronics",
          priority: "Medium",
          notes: "Download before departure.",
          quantity: null
        }
      ];
    default:
      return [
        {
          name: "Offline map and translation backup",
          category: "Electronics",
          priority: "Medium",
          notes: "Download before departure.",
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

function buildDocuments(input: SetupGenerationInput, template: SetupTemplateOption, travelerIds: string[]): DocumentInput[] {
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
      title: `${template.defaultDestination} accommodation summaries`,
      category: "Hotel",
      priority: "High",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Add hotel names, dates, and safe check-in notes after confirmed.",
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
      title: input.routeCities.length > 1 ? "Intercity transport summaries" : "Local transport setup notes",
      category: "Transport",
      priority: "Medium",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Add safe route, pickup, and owner notes after confirmed.",
      sortOrder: 6
    },
    {
      title: "Shared cloud folder placeholder",
      category: "Other",
      priority: "Low",
      status: "Needed",
      externalUrl: null,
      requiresPasscode: false,
      notes: "Use permission-controlled cloud storage for real files.",
      sortOrder: 7
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
