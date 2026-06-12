import type { Booking, BookingStatus } from "@/data/tripData";

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
