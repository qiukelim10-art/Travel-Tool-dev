import { travelers, type Booking, type BookingStatus } from "@/data/tripData";

export const reminderPriorities = ["High", "Medium", "Low"] as const;
export type ReminderPriority = (typeof reminderPriorities)[number];

export const bookingCategories = [
  "Flight",
  "Hotel",
  "Train",
  "Attraction",
  "Restaurant",
  "Insurance",
  "Other"
] as const satisfies readonly Booking["category"][];

export const bookingStatuses = [
  "Not Booked",
  "Pending",
  "Booked",
  "Paid",
  "Cancelled",
  "Need Confirmation"
] as const satisfies readonly BookingStatus[];

export const bookingCurrencies = ["EUR", "SGD"] as const;
export type SharedCurrency = (typeof bookingCurrencies)[number];

export const expenseSourceTypes = ["itinerary", "booking", "misc"] as const;
export type ExpenseSourceType = (typeof expenseSourceTypes)[number];

export const expenseCategories = [
  "Flight",
  "Accommodation",
  "Transport",
  "Food",
  "Attraction",
  "Insurance",
  "Shopping",
  "Other"
] as const;
export type ExpenseCategory = (typeof expenseCategories)[number];

export const packingCategories = [
  "Documents",
  "Clothes",
  "Electronics",
  "Medicine",
  "Toiletries",
  "Travel Essentials",
  "Shared Items",
  "Personal Care",
  "Other"
] as const;
export type PackingCategory = (typeof packingCategories)[number];

export const packingPriorities = ["High", "Medium", "Low"] as const;
export type PackingPriority = (typeof packingPriorities)[number];

export const packingTravelerStatuses = ["required", "packed", "not_needed"] as const;
export type PackingTravelerStatus = (typeof packingTravelerStatuses)[number];

export type SharedReminder = {
  id: string;
  text: string;
  priority: ReminderPriority;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type SharedBooking = {
  id: string;
  category: Booking["category"];
  description: string;
  date: string;
  location: string | null;
  bookedBy: string;
  amount: number | null;
  currency: SharedCurrency | null;
  notes: string | null;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
};

export type ReminderInput = {
  text: string;
  priority: ReminderPriority;
  createdBy: string;
};

export type BookingInput = {
  category: Booking["category"];
  description: string;
  date: string;
  location?: string;
  bookedBy: string;
  amount?: number | null;
  currency?: SharedCurrency | null;
  notes?: string;
  status: BookingStatus;
};

export type SharedPackingTravelerStatus = {
  travelerId: string;
  status: PackingTravelerStatus;
  updatedAt: string | null;
};

export type SharedPackingItem = {
  id: string;
  name: string;
  category: PackingCategory;
  priority: PackingPriority;
  notes: string | null;
  quantity: number | null;
  sortOrder: number;
  statuses: SharedPackingTravelerStatus[];
  createdAt: string;
  updatedAt: string;
};

export type ExpenseSplit = {
  travelerId: string;
  createdAt?: string;
};

export type SharedExpense = {
  id: string;
  sourceType: ExpenseSourceType;
  sourceId: string | null;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: SharedCurrency;
  paidByTravelerId: string;
  splitTravelerIds: string[];
  settled: boolean;
  expenseDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseInput = {
  sourceType: ExpenseSourceType;
  sourceId?: string | null;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: SharedCurrency;
  paidByTravelerId: string;
  splitTravelerIds: string[];
  settled: boolean;
  expenseDate: string;
  notes?: string | null;
};

export type PackingInput = {
  name: string;
  category: PackingCategory;
  priority: PackingPriority;
  notes?: string;
  quantity?: number | null;
  sortOrder?: number;
  statuses: {
    travelerId: string;
    status: PackingTravelerStatus;
  }[];
};

export type SharedItineraryItem = {
  id: string;
  travelDate: string;
  city: string;
  startTime: string | null;
  endTime: string | null;
  title: string;
  location: string | null;
  details: string | null;
  transport: string | null;
  meal: string | null;
  costAmount: number | null;
  currency: SharedCurrency;
  notes: string | null;
  mapQuery: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ItineraryInput = {
  travelDate: string;
  city: string;
  startTime?: string;
  endTime?: string;
  title: string;
  location?: string;
  details?: string;
  transport?: string;
  meal?: string;
  costAmount?: number | null;
  currency?: SharedCurrency;
  notes?: string;
  mapQuery?: string;
  sortOrder?: number;
};

const notNeededByDefault = new Set<PackingCategory>([
  "Medicine",
  "Toiletries",
  "Personal Care",
  "Shared Items"
]);

export function defaultPackingStatusForCategory(category: PackingCategory): PackingTravelerStatus {
  return notNeededByDefault.has(category) ? "not_needed" : "required";
}

export function buildDefaultPackingStatuses(category: PackingCategory) {
  const status = defaultPackingStatusForCategory(category);
  return travelers
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((traveler) => ({
      travelerId: traveler.id,
      status
    }));
}
