export type BookingStatus =
  | "Not Booked"
  | "Pending"
  | "Booked"
  | "Paid"
  | "Cancelled"
  | "Need Confirmation";

export type TripStatus = {
  flights: BookingStatus;
  hotels: BookingStatus;
  trains: BookingStatus;
  attractions: BookingStatus;
  insurance: BookingStatus;
  entryRequirement: "Check Before Departure" | "Confirmed";
};

export type ItineraryDay = {
  day: number;
  date: string;
  city: string;
  title: string;
  hotel?: string;
  highlight: string;
  morning: string[];
  afternoon: string[];
  evening: string[];
  transport: string[];
  meals: string[];
  tickets: string[];
  estimatedCost: number;
  currency: "EUR" | "SGD" | "MYR";
  notes: string;
  mapLinks: {
    label: string;
    url: string;
  }[];
};

export type Booking = {
  id: string;
  category:
    | "Flight"
    | "Hotel"
    | "Train"
    | "Attraction"
    | "Restaurant"
    | "Insurance"
    | "Other";
  title: string;
  date: string;
  time?: string;
  location?: string;
  bookedBy: string;
  paidBy?: string;
  amount?: number;
  currency?: "EUR" | "SGD" | "MYR";
  status: BookingStatus;
  confirmationLink?: string;
  notes?: string;
};

export type Expense = {
  id: string;
  date: string;
  item: string;
  category:
    | "Flight"
    | "Accommodation"
    | "Transport"
    | "Food"
    | "Attraction"
    | "Insurance"
    | "Other";
  amount: number;
  currency: "EUR" | "SGD" | "MYR";
  paidBy: string;
  splitAmong: string[];
  notes?: string;
  settled: boolean;
};

export type EmergencyInfo = {
  type:
    | "Emergency Number"
    | "Traveller"
    | "Hotel"
    | "Insurance"
    | "Bank"
    | "Embassy"
    | "Medical"
    | "Other";
  title: string;
  value: string;
  phone?: string;
  mapLink?: string;
  notes?: string;
  urgent?: boolean;
};

export type MapLocation = {
  name: string;
  city: string;
  category:
    | "Hotel"
    | "Attraction"
    | "Restaurant"
    | "Train Station"
    | "Airport"
    | "Pharmacy"
    | "Supermarket"
    | "Emergency";
  address: string;
  googleMapsLink: string;
  notes?: string;
};

export type TripMap = {
  title: string;
  city: string;
  embedUrl: string;
  notes: string;
};

export type Restaurant = {
  name: string;
  city: string;
  cuisine: string;
  priority: "Must Try" | "Good to Have" | "Backup";
  priceRange: "Budget" | "Moderate" | "Splurge";
  reservationStatus: "Not Needed" | "Not Booked" | "Pending" | "Booked";
  googleMapsLink?: string;
  notes?: string;
};

export type Attraction = {
  name: string;
  city: string;
  priority: "Must Visit" | "Nice to Have" | "Optional";
  ticketRequired: boolean;
  bookingStatus: "Not Needed" | "Pending" | "Booked";
  estimatedDuration: string;
  officialWebsite?: string;
  googleMapsLink?: string;
  notes?: string;
};

export type PackingItem = {
  item: string;
  category:
    | "Documents"
    | "Clothes"
    | "Electronics"
    | "Medicine"
    | "Toiletries"
    | "Travel Essentials"
    | "Shared Items"
    | "Personal Care"
    | "Other";
  owner: string | "Everyone";
  required: boolean;
  checked: boolean;
};

export type Traveler = {
  id: string;
  name: string;
  displayOrder: number;
};

export type DocumentLink = {
  title: string;
  category:
    | "Flight"
    | "Hotel"
    | "Train"
    | "Attraction"
    | "Insurance"
    | "Passport"
    | "Receipt"
    | "Other";
  owner: string;
  link: string;
  sensitive: boolean;
  notes?: string;
};

// Data safety note: values in this file are seed/demo data for planning only.
// Replace them with real trip details only when they are non-sensitive.
// Do not store passport numbers, payment details, full confirmations, or private files here.
export const tripInfo = {
  title: "Italy Trip 2026",
  month: "October 2026",
  startDate: "2026-10-08",
  endDate: "2026-10-18",
  participants: ["Person A", "Person B", "Person C", "Person D"],
  countries: ["Italy"],
  cities: ["Rome", "Florence", "Venice", "Milan"],
  privacyNote: "Private planning site for the 4 travellers. Placeholder data only.",
  status: {
    flights: "Pending",
    hotels: "Need Confirmation",
    trains: "Not Booked",
    attractions: "Pending",
    insurance: "Pending",
    entryRequirement: "Check Before Departure"
  } satisfies TripStatus,
  reminders: [
    "Check passport validity before booking final tickets.",
    "Confirm ETIAS and Schengen entry requirements before departure.",
    "Buy travel insurance before paying major bookings.",
    "Download offline maps for each city.",
    "Save tickets and hotel confirmations offline."
  ],
  nextDeadline: {
    title: "Lock flights and first hotel",
    date: "2026-07-15",
    owner: "Person A"
  }
};

// Placeholder traveler identities. Keep these display names generic until the
// group intentionally decides what non-sensitive names should appear on the site.
export const travelers: Traveler[] = [
  { id: "person_a", name: "Person A", displayOrder: 1 },
  { id: "person_b", name: "Person B", displayOrder: 2 },
  { id: "person_c", name: "Person C", displayOrder: 3 },
  { id: "person_d", name: "Person D", displayOrder: 4 }
];

// Safe demo itinerary seed data. Public place names are acceptable; hotel names,
// tickets, costs, and notes are placeholders until real non-sensitive details are provided.
export const itinerary: ItineraryDay[] = [
  {
    day: 1,
    date: "2026-10-08",
    city: "Rome",
    title: "Arrive in Rome",
    hotel: "Rome hotel placeholder",
    highlight: "Airport transfer, hotel check-in, easy dinner near base.",
    morning: ["Depart Singapore or connect toward Rome."],
    afternoon: ["Arrive at Rome airport.", "Transfer to hotel and check in."],
    evening: ["Short walk near hotel.", "Simple dinner and early rest."],
    transport: ["Airport train or private transfer", "Walk near hotel"],
    meals: ["Dinner near hotel"],
    tickets: ["Flight confirmation placeholder", "Airport transfer pending"],
    estimatedCost: 80,
    currency: "EUR",
    notes: "Keep the first day light in case of flight delays.",
    mapLinks: [
      {
        label: "Rome base area",
        url: "https://www.google.com/maps/search/Rome+Italy"
      }
    ]
  },
  {
    day: 2,
    date: "2026-10-09",
    city: "Rome",
    title: "Ancient Rome",
    hotel: "Rome hotel placeholder",
    highlight: "Colosseum, Roman Forum, Trevi Fountain.",
    morning: ["Colosseum timed entry placeholder.", "Roman Forum walk."],
    afternoon: ["Lunch near Monti.", "Capitoline Hill or Pantheon area."],
    evening: ["Trevi Fountain and dinner reservation placeholder."],
    transport: ["Metro", "Walk"],
    meals: ["Lunch near Monti", "Dinner near Trevi"],
    tickets: ["Colosseum tickets pending"],
    estimatedCost: 95,
    currency: "EUR",
    notes: "Book timed tickets early once the itinerary is confirmed.",
    mapLinks: [
      {
        label: "Colosseum",
        url: "https://www.google.com/maps/search/Colosseum+Rome"
      }
    ]
  },
  {
    day: 3,
    date: "2026-10-10",
    city: "Vatican City",
    title: "Vatican Day",
    hotel: "Rome hotel placeholder",
    highlight: "Vatican Museums and St. Peter's Basilica.",
    morning: ["Vatican Museums timed entry placeholder."],
    afternoon: ["St. Peter's Basilica.", "Coffee break near Prati."],
    evening: ["Dinner in Trastevere placeholder."],
    transport: ["Metro", "Walk", "Taxi if needed"],
    meals: ["Lunch near Vatican", "Dinner in Trastevere"],
    tickets: ["Vatican Museums tickets pending"],
    estimatedCost: 100,
    currency: "EUR",
    notes: "Dress code required for religious sites.",
    mapLinks: [
      {
        label: "Vatican Museums",
        url: "https://www.google.com/maps/search/Vatican+Museums"
      }
    ]
  },
  {
    day: 4,
    date: "2026-10-11",
    city: "Florence",
    title: "Rome to Florence",
    hotel: "Florence hotel placeholder",
    highlight: "Train to Florence, Duomo area, sunset viewpoint.",
    morning: ["Check out from Rome hotel.", "Train from Rome to Florence."],
    afternoon: ["Check in to Florence hotel.", "Duomo area walk."],
    evening: ["Piazzale Michelangelo sunset.", "Dinner near Santo Spirito."],
    transport: ["High-speed train", "Walk"],
    meals: ["Train station snack", "Dinner in Florence"],
    tickets: ["Rome to Florence train pending"],
    estimatedCost: 120,
    currency: "EUR",
    notes: "Keep luggage transfer simple and avoid tight train timing.",
    mapLinks: [
      {
        label: "Florence Duomo",
        url: "https://www.google.com/maps/search/Florence+Duomo"
      }
    ]
  },
  {
    day: 5,
    date: "2026-10-12",
    city: "Florence",
    title: "Florence Art and Food",
    hotel: "Florence hotel placeholder",
    highlight: "Uffizi or Accademia, food stops, old bridge.",
    morning: ["Uffizi Gallery or Accademia timed ticket placeholder."],
    afternoon: ["Ponte Vecchio.", "Mercato Centrale or cafe break."],
    evening: ["Dinner reservation placeholder."],
    transport: ["Walk"],
    meals: ["Florentine sandwich placeholder", "Dinner reservation pending"],
    tickets: ["Museum tickets pending"],
    estimatedCost: 90,
    currency: "EUR",
    notes: "Pick one major museum to avoid overloading the day.",
    mapLinks: [
      {
        label: "Uffizi Gallery",
        url: "https://www.google.com/maps/search/Uffizi+Gallery"
      }
    ]
  },
  {
    day: 6,
    date: "2026-10-13",
    city: "Venice",
    title: "Florence to Venice",
    hotel: "Venice hotel placeholder",
    highlight: "Train to Venice, canals, Rialto area.",
    morning: ["Check out from Florence hotel.", "Train to Venice."],
    afternoon: ["Check in to Venice hotel.", "Rialto Bridge walk."],
    evening: ["Canal-side dinner placeholder."],
    transport: ["High-speed train", "Vaporetto", "Walk"],
    meals: ["Lunch near station", "Dinner in Venice"],
    tickets: ["Florence to Venice train pending"],
    estimatedCost: 130,
    currency: "EUR",
    notes: "Pack light for bridges and walking in Venice.",
    mapLinks: [
      {
        label: "Rialto Bridge",
        url: "https://www.google.com/maps/search/Rialto+Bridge+Venice"
      }
    ]
  },
  {
    day: 7,
    date: "2026-10-14",
    city: "Venice",
    title: "Venice Main Sights",
    hotel: "Venice hotel placeholder",
    highlight: "St. Mark's Square, Doge's Palace, relaxed canal walk.",
    morning: ["St. Mark's Square.", "Doge's Palace ticket placeholder."],
    afternoon: ["Lunch near Castello.", "Optional gondola or lagoon ride."],
    evening: ["Cicchetti dinner route placeholder."],
    transport: ["Walk", "Vaporetto"],
    meals: ["Lunch near Castello", "Cicchetti dinner"],
    tickets: ["Doge's Palace pending"],
    estimatedCost: 105,
    currency: "EUR",
    notes: "Avoid rushing; Venice is better with flexible walking time.",
    mapLinks: [
      {
        label: "St. Mark's Square",
        url: "https://www.google.com/maps/search/St+Marks+Square+Venice"
      }
    ]
  },
  {
    day: 8,
    date: "2026-10-15",
    city: "Milan",
    title: "Venice to Milan",
    hotel: "Milan hotel placeholder",
    highlight: "Train to Milan, Duomo, Galleria.",
    morning: ["Check out from Venice hotel.", "Train to Milan."],
    afternoon: ["Check in to Milan hotel.", "Milan Duomo area."],
    evening: ["Dinner near Brera placeholder."],
    transport: ["High-speed train", "Metro", "Walk"],
    meals: ["Lunch on arrival", "Dinner near Brera"],
    tickets: ["Venice to Milan train pending", "Duomo rooftop pending"],
    estimatedCost: 125,
    currency: "EUR",
    notes: "Confirm train station and hotel luggage timing.",
    mapLinks: [
      {
        label: "Milan Duomo",
        url: "https://www.google.com/maps/search/Milan+Duomo"
      }
    ]
  }
];

// Safe demo booking seed data. Amounts are reference values only and do not count
// in the expense ledger unless a linked expense is created.
export const bookings: Booking[] = [
  {
    id: "flight-sin-rome",
    category: "Flight",
    title: "Singapore to Rome flight",
    date: "2026-10-08",
    bookedBy: "Person A",
    paidBy: "Person A",
    amount: 3200,
    currency: "SGD",
    status: "Pending",
    confirmationLink: "#",
    notes: "Placeholder only. Replace after flights are confirmed."
  },
  {
    id: "rome-hotel",
    category: "Hotel",
    title: "Rome hotel",
    date: "2026-10-08",
    location: "Rome",
    bookedBy: "Person B",
    status: "Need Confirmation",
    confirmationLink: "#",
    notes: "Use private booking link later."
  },
  {
    id: "rome-florence-train",
    category: "Train",
    title: "Rome to Florence train",
    date: "2026-10-11",
    time: "10:00",
    location: "Roma Termini",
    bookedBy: "Person C",
    status: "Not Booked",
    notes: "Book after city dates are final."
  },
  {
    id: "colosseum",
    category: "Attraction",
    title: "Colosseum timed entry",
    date: "2026-10-09",
    time: "09:30",
    location: "Rome",
    bookedBy: "Person D",
    status: "Pending",
    notes: "Timed entry recommended."
  },
  {
    id: "insurance",
    category: "Insurance",
    title: "Travel insurance",
    date: "2026-07-15",
    bookedBy: "Person A",
    status: "Pending",
    notes: "Buy before major non-refundable bookings."
  }
];

// Safe demo expense seed data. Replace only with confirmed payments and never
// store card, receipt, transfer, or confirmation identifiers here.
export const expenses: Expense[] = [
  {
    id: "flight-deposit",
    date: "2026-06-01",
    item: "Flight planning deposit placeholder",
    category: "Flight",
    amount: 1200,
    currency: "SGD",
    paidBy: "Person A",
    splitAmong: ["Person A", "Person B", "Person C", "Person D"],
    settled: false
  },
  {
    id: "rome-hotel-deposit",
    date: "2026-06-05",
    item: "Rome hotel deposit placeholder",
    category: "Accommodation",
    amount: 800,
    currency: "EUR",
    paidBy: "Person B",
    splitAmong: ["Person A", "Person B", "Person C", "Person D"],
    settled: false
  },
  {
    id: "planning-dinner",
    date: "2026-06-08",
    item: "Planning dinner placeholder",
    category: "Food",
    amount: 160,
    currency: "SGD",
    paidBy: "Person C",
    splitAmong: ["Person A", "Person B", "Person C", "Person D"],
    settled: true
  },
  {
    id: "museum-hold",
    date: "2026-06-09",
    item: "Museum ticket hold placeholder",
    category: "Attraction",
    amount: 240,
    currency: "EUR",
    paidBy: "Person D",
    splitAmong: ["Person A", "Person B", "Person C", "Person D"],
    settled: false
  }
];

// Static emergency demo data retained for older/static views. Dashboard quick
// access uses public emergency numbers from emergencyContacts.ts.
export const emergencyInfo: EmergencyInfo[] = [
  {
    type: "Emergency Number",
    title: "Italy emergency number",
    value: "112",
    phone: "112",
    notes: "Use for police, ambulance, fire, or urgent danger.",
    urgent: true
  },
  {
    type: "Traveller",
    title: "Person A",
    value: "+00 0000 0000",
    phone: "+0000000000",
    notes: "Placeholder phone number."
  },
  {
    type: "Traveller",
    title: "Person B",
    value: "+00 0000 0001",
    phone: "+0000000001",
    notes: "Placeholder phone number."
  },
  {
    type: "Traveller",
    title: "Person C",
    value: "+00 0000 0002",
    phone: "+0000000002",
    notes: "Placeholder phone number."
  },
  {
    type: "Traveller",
    title: "Person D",
    value: "+00 0000 0003",
    phone: "+0000000003",
    notes: "Placeholder phone number."
  },
  {
    type: "Hotel",
    title: "Rome hotel",
    value: "Rome hotel address placeholder",
    mapLink: "https://www.google.com/maps/search/Rome+hotel",
    notes: "Replace with real hotel address only if access is protected."
  },
  {
    type: "Insurance",
    title: "Travel insurance hotline",
    value: "+00 0000 0100",
    phone: "+0000000100",
    notes: "Placeholder hotline."
  },
  {
    type: "Bank",
    title: "Lost card hotline",
    value: "+00 0000 0200",
    phone: "+0000000200",
    notes: "Add each bank's real emergency number later."
  },
  {
    type: "Embassy",
    title: "Singapore consular assistance",
    value: "Consular assistance link placeholder",
    notes: "Confirm official contact details before departure."
  },
  {
    type: "Medical",
    title: "Nearest hospital or pharmacy",
    value: "Search nearby medical help",
    mapLink: "https://www.google.com/maps/search/hospital+near+me",
    notes: "Use location sharing during the trip."
  }
];

// Safe demo map embeds and searches. Prefer public Google Maps search links;
// avoid exact private lodging details until access protection exists.
export const tripMaps: TripMap[] = [
  {
    title: "Main trip map",
    city: "All cities",
    embedUrl: "https://www.google.com/maps?q=Italy&output=embed",
    notes: "Placeholder embed. Replace with a private Google My Maps embed link later."
  },
  {
    title: "Rome map",
    city: "Rome",
    embedUrl: "https://www.google.com/maps?q=Rome+Italy&output=embed",
    notes: "Rome hotels, attractions, restaurants, and stations placeholder."
  },
  {
    title: "Florence map",
    city: "Florence",
    embedUrl: "https://www.google.com/maps?q=Florence+Italy&output=embed",
    notes: "Florence base area and food stops placeholder."
  },
  {
    title: "Venice map",
    city: "Venice",
    embedUrl: "https://www.google.com/maps?q=Venice+Italy&output=embed",
    notes: "Venice walking and vaporetto planning placeholder."
  },
  {
    title: "Milan map",
    city: "Milan",
    embedUrl: "https://www.google.com/maps?q=Milan+Italy&output=embed",
    notes: "Milan final city and airport transfer placeholder."
  }
];

// Safe demo location list. Public attractions and stations are fine; lodging
// addresses remain broad placeholders until privacy handling is decided.
export const mapLocations: MapLocation[] = [
  {
    name: "Rome hotel placeholder",
    city: "Rome",
    category: "Hotel",
    address: "Rome hotel area placeholder",
    googleMapsLink: "https://www.google.com/maps/search/Rome+hotel",
    notes: "Replace only after deciding privacy handling."
  },
  {
    name: "Colosseum",
    city: "Rome",
    category: "Attraction",
    address: "Piazza del Colosseo, Rome",
    googleMapsLink: "https://www.google.com/maps/search/Colosseum+Rome",
    notes: "Timed ticket likely needed."
  },
  {
    name: "Roma Termini",
    city: "Rome",
    category: "Train Station",
    address: "Roma Termini station",
    googleMapsLink: "https://www.google.com/maps/search/Roma+Termini"
  },
  {
    name: "Florence hotel placeholder",
    city: "Florence",
    category: "Hotel",
    address: "Florence hotel area placeholder",
    googleMapsLink: "https://www.google.com/maps/search/Florence+hotel"
  },
  {
    name: "Uffizi Gallery",
    city: "Florence",
    category: "Attraction",
    address: "Uffizi Gallery, Florence",
    googleMapsLink: "https://www.google.com/maps/search/Uffizi+Gallery"
  },
  {
    name: "Venice hotel placeholder",
    city: "Venice",
    category: "Hotel",
    address: "Venice hotel area placeholder",
    googleMapsLink: "https://www.google.com/maps/search/Venice+hotel"
  },
  {
    name: "Rialto Bridge",
    city: "Venice",
    category: "Attraction",
    address: "Rialto Bridge, Venice",
    googleMapsLink: "https://www.google.com/maps/search/Rialto+Bridge+Venice"
  },
  {
    name: "Milan hotel placeholder",
    city: "Milan",
    category: "Hotel",
    address: "Milan hotel area placeholder",
    googleMapsLink: "https://www.google.com/maps/search/Milan+hotel"
  },
  {
    name: "Milan Duomo",
    city: "Milan",
    category: "Attraction",
    address: "Duomo di Milano",
    googleMapsLink: "https://www.google.com/maps/search/Milan+Duomo"
  },
  {
    name: "Nearest pharmacy search",
    city: "All cities",
    category: "Pharmacy",
    address: "Use current location during the trip",
    googleMapsLink: "https://www.google.com/maps/search/pharmacy+near+me"
  }
];

// Safe restaurant shortlist placeholders. Add real public restaurant names and
// Maps links later, but keep private reservation references out of the repo.
export const restaurants: Restaurant[] = [
  {
    name: "Rome pasta placeholder",
    city: "Rome",
    cuisine: "Roman pasta",
    priority: "Must Try",
    priceRange: "Moderate",
    reservationStatus: "Pending",
    googleMapsLink: "https://www.google.com/maps/search/pasta+Rome",
    notes: "Shortlist a real restaurant later."
  },
  {
    name: "Trastevere dinner placeholder",
    city: "Rome",
    cuisine: "Italian",
    priority: "Good to Have",
    priceRange: "Moderate",
    reservationStatus: "Not Booked",
    googleMapsLink: "https://www.google.com/maps/search/Trastevere+dinner"
  },
  {
    name: "Florence sandwich placeholder",
    city: "Florence",
    cuisine: "Sandwich",
    priority: "Must Try",
    priceRange: "Budget",
    reservationStatus: "Not Needed",
    googleMapsLink: "https://www.google.com/maps/search/sandwich+Florence"
  },
  {
    name: "Florence steak placeholder",
    city: "Florence",
    cuisine: "Tuscan",
    priority: "Good to Have",
    priceRange: "Splurge",
    reservationStatus: "Pending",
    googleMapsLink: "https://www.google.com/maps/search/bistecca+Florence"
  },
  {
    name: "Venice cicchetti route placeholder",
    city: "Venice",
    cuisine: "Cicchetti",
    priority: "Must Try",
    priceRange: "Moderate",
    reservationStatus: "Not Needed",
    googleMapsLink: "https://www.google.com/maps/search/cicchetti+Venice"
  },
  {
    name: "Milan risotto placeholder",
    city: "Milan",
    cuisine: "Milanese",
    priority: "Backup",
    priceRange: "Moderate",
    reservationStatus: "Not Booked",
    googleMapsLink: "https://www.google.com/maps/search/risotto+Milan"
  }
];

// Safe public attraction placeholders. Do not add ticket barcodes, QR codes, or
// complete booking references.
export const attractions: Attraction[] = [
  {
    name: "Colosseum",
    city: "Rome",
    priority: "Must Visit",
    ticketRequired: true,
    bookingStatus: "Pending",
    estimatedDuration: "2-3 hours",
    googleMapsLink: "https://www.google.com/maps/search/Colosseum+Rome",
    notes: "Book timed entry once dates are final."
  },
  {
    name: "Vatican Museums",
    city: "Vatican City",
    priority: "Must Visit",
    ticketRequired: true,
    bookingStatus: "Pending",
    estimatedDuration: "3-4 hours",
    googleMapsLink: "https://www.google.com/maps/search/Vatican+Museums",
    notes: "Dress code applies nearby religious sites."
  },
  {
    name: "Uffizi Gallery",
    city: "Florence",
    priority: "Nice to Have",
    ticketRequired: true,
    bookingStatus: "Pending",
    estimatedDuration: "2-3 hours",
    googleMapsLink: "https://www.google.com/maps/search/Uffizi+Gallery"
  },
  {
    name: "Piazzale Michelangelo",
    city: "Florence",
    priority: "Must Visit",
    ticketRequired: false,
    bookingStatus: "Not Needed",
    estimatedDuration: "1 hour",
    googleMapsLink: "https://www.google.com/maps/search/Piazzale+Michelangelo"
  },
  {
    name: "Doge's Palace",
    city: "Venice",
    priority: "Nice to Have",
    ticketRequired: true,
    bookingStatus: "Pending",
    estimatedDuration: "2 hours",
    googleMapsLink: "https://www.google.com/maps/search/Doge's+Palace+Venice"
  },
  {
    name: "Milan Duomo rooftop",
    city: "Milan",
    priority: "Must Visit",
    ticketRequired: true,
    bookingStatus: "Pending",
    estimatedDuration: "1.5-2 hours",
    googleMapsLink: "https://www.google.com/maps/search/Milan+Duomo+rooftop"
  }
];

// Safe packing checklist seed data. Track document presence only; do not store
// document numbers, scans, or private medical details.
export const packingItems: PackingItem[] = [
  {
    item: "Passport",
    category: "Documents",
    owner: "Everyone",
    required: true,
    checked: false
  },
  {
    item: "Travel insurance summary",
    category: "Documents",
    owner: "Everyone",
    required: true,
    checked: false
  },
  {
    item: "Comfortable walking shoes",
    category: "Clothes",
    owner: "Everyone",
    required: true,
    checked: false
  },
  {
    item: "Light rain jacket or umbrella",
    category: "Clothes",
    owner: "Everyone",
    required: false,
    checked: false
  },
  {
    item: "Power adapter",
    category: "Electronics",
    owner: "Everyone",
    required: true,
    checked: false
  },
  {
    item: "Power bank",
    category: "Electronics",
    owner: "Person A",
    required: true,
    checked: false
  },
  {
    item: "Basic medicine kit",
    category: "Medicine",
    owner: "Person B",
    required: true,
    checked: false
  },
  {
    item: "Toiletries pouch",
    category: "Toiletries",
    owner: "Everyone",
    required: true,
    checked: false
  },
  {
    item: "Offline maps downloaded",
    category: "Travel Essentials",
    owner: "Everyone",
    required: true,
    checked: false
  },
  {
    item: "Printed backup itinerary",
    category: "Shared Items",
    owner: "Person C",
    required: false,
    checked: false
  }
];

// Placeholder document links only. Real files should stay in private storage
// and the repo should not contain full confirmation numbers or identity details.
export const documentLinks: DocumentLink[] = [
  {
    title: "Flight confirmation private link placeholder",
    category: "Flight",
    owner: "Person A",
    link: "#",
    sensitive: true,
    notes: "Store the real confirmation in private cloud storage only."
  },
  {
    title: "Hotel bookings folder placeholder",
    category: "Hotel",
    owner: "Person B",
    link: "#",
    sensitive: true,
    notes: "Use a private folder shared only with the 4 travellers."
  },
  {
    title: "Train tickets folder placeholder",
    category: "Train",
    owner: "Person C",
    link: "#",
    sensitive: true,
    notes: "Replace with a private link after tickets are booked."
  },
  {
    title: "Attraction tickets folder placeholder",
    category: "Attraction",
    owner: "Person D",
    link: "#",
    sensitive: false,
    notes: "Use only summary links here, not file uploads."
  },
  {
    title: "Insurance policy private link placeholder",
    category: "Insurance",
    owner: "Person A",
    link: "#",
    sensitive: true,
    notes: "Do not paste policy numbers or personal identifiers into the repo."
  },
  {
    title: "Payment receipts folder placeholder",
    category: "Receipt",
    owner: "Person A",
    link: "#",
    sensitive: true,
    notes: "Keep receipts in private storage and record only safe summaries here."
  }
];
