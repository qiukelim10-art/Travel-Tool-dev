import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import mysql from "mysql2/promise";
import { bookings, documentLinks, expenses, itinerary, packingItems, travelers, tripInfo } from "@/data/tripData";
import {
  buildStarterWorkspace,
  type GeneratedWorkspace,
  type SetupGenerationInput,
  type SetupGenerationResponse
} from "@/lib/setupTemplates";
import {
  bookingCategories,
  bookingCurrencies,
  bookingStatuses,
  defaultPackingStatusForCategory,
  documentCategories,
  documentPriorities,
  documentStatuses,
  documentTravelerStatuses,
  expenseCategories,
  expenseSourceTypes,
  type DocumentCategory,
  type DocumentInput,
  type DocumentTravelerStatus,
  type ItineraryInput,
  packingCategories,
  packingPriorities,
  packingTravelerStatuses,
  reminderPriorities,
  type BookingInput,
  type ExpenseCategory,
  type ExpenseInput,
  type PackingCategory,
  type PackingInput,
  type PackingTravelerStatus,
  type SharedItineraryItem,
  type SharedDocumentItem,
  type SharedExpense,
  type SharedPackingItem,
  type SharedCurrency,
  type ReminderInput,
  type SharedBooking,
  type SharedReminder,
  type TripRouteStop,
  type TripSettings,
  type TripSettingsInput,
  type TripSettingsResponse,
  type TripTraveler
} from "@/lib/sharedDataTypes";

type DbRow = Record<string, unknown>;

type MysqlPool = {
  execute<T = DbRow[]>(sql: string, values?: unknown[]): Promise<[T, unknown]>;
  getConnection(): Promise<MysqlConnection>;
  end(): Promise<void>;
};

type MysqlConnection = {
  execute<T = DbRow[]>(sql: string, values?: unknown[]): Promise<[T, unknown]>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
};

type SharedDataStoreState = {
  serverPool: MysqlPool | null;
  appPool: MysqlPool | null;
  initialized: boolean;
  initializePromise: Promise<void> | null;
};

const sharedDataStoreState = (
  globalThis as typeof globalThis & {
    __italyTripSharedDataStore?: SharedDataStoreState;
  }
).__italyTripSharedDataStore ??= {
  serverPool: null,
  appPool: null,
  initialized: false,
  initializePromise: null
};

const priorityRank: Record<string, number> = {
  High: 1,
  Medium: 2,
  Low: 3
};

const activeTripId = "active-trip";
const defaultTripCurrencies = ["EUR", "SGD", "MYR"] as const satisfies readonly SharedCurrency[];
const defaultTripRouteStops = ["Rome", "Florence", "Venice", "Milan"] as const;
const editorSessionDurationMs = 12 * 60 * 60 * 1000;
const currencyEnumValues = bookingCurrencies.map((currency) => `'${currency}'`).join(", ");

export type TripAccessMode = "viewer" | "editor";

export type TripAccessStatus = {
  configured: boolean;
  authorized: boolean;
  mode: TripAccessMode | null;
  editorExpiresAt: string | null;
  recoveryTokenAvailable: boolean;
  travelers: TripTraveler[];
};

export type TripAccessSetupResult = {
  shareToken: string;
  ownerRecoveryToken: string;
  editorToken: string;
  editorExpiresAt: string;
  travelers: TripTraveler[];
};

export type TripEditorSessionResult = {
  editorToken: string;
  editorExpiresAt: string;
};

function getDbName() {
  return process.env.MYSQL_DATABASE || "italy_trip_2026";
}

function assertSafeIdentifier(value: string) {
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error("MYSQL_DATABASE may only contain letters, numbers, and underscores.");
  }
}

function isEnvEnabled(name: string) {
  return ["1", "true", "yes", "on"].includes(String(process.env[name] ?? "").trim().toLowerCase());
}

function usesManagedSchema() {
  return isEnvEnabled("MYSQL_MANAGED_SCHEMA");
}

function baseConfig() {
  const config: Record<string, unknown> = {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    waitForConnections: true,
    connectionLimit: 5,
    namedPlaceholders: false
  };

  if (isEnvEnabled("MYSQL_SSL")) {
    const ca = String(process.env.MYSQL_SSL_CA ?? "").trim();
    config.ssl = ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true };
  }

  return config;
}

function getServerPool() {
  if (!sharedDataStoreState.serverPool) {
    sharedDataStoreState.serverPool = mysql.createPool(baseConfig()) as unknown as MysqlPool;
  }

  return sharedDataStoreState.serverPool;
}

function getAppPool() {
  if (!sharedDataStoreState.appPool) {
    sharedDataStoreState.appPool = mysql.createPool({
      ...baseConfig(),
      database: getDbName()
    }) as unknown as MysqlPool;
  }

  return sharedDataStoreState.appPool;
}

function asString(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value ?? "");
}

function asDateOnly(value: unknown) {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return String(value ?? "").slice(0, 10);
}

function nullableString(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function nullableTime(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text.slice(0, 5) : null;
}

function asBoolean(value: unknown) {
  return value === true || value === 1 || value === "1";
}

function asDefaultCurrencies(value: unknown): SharedCurrency[] {
  if (Array.isArray(value)) {
    return value.filter((currency): currency is SharedCurrency =>
      (bookingCurrencies as readonly string[]).includes(String(currency))
    );
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return asDefaultCurrencies(parsed);
    } catch {
      return [...defaultTripCurrencies];
    }
  }

  return [...defaultTripCurrencies];
}

function mapTripSettings(row: DbRow): TripSettings {
  return {
    id: asString(row.id),
    name: asString(row.name),
    destination: asString(row.destination),
    startDate: row.start_date === null || row.start_date === undefined ? null : asDateOnly(row.start_date),
    endDate: row.end_date === null || row.end_date === undefined ? null : asDateOnly(row.end_date),
    defaultCurrencies: asDefaultCurrencies(row.default_currencies),
    timezone: asString(row.timezone),
    notes: nullableString(row.notes),
    setupCompletedAt:
      row.setup_completed_at === null || row.setup_completed_at === undefined ? null : asString(row.setup_completed_at),
    isActive: asBoolean(row.is_active),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at)
  };
}

function mapTripTraveler(row: DbRow): TripTraveler {
  const displayName = asString(row.display_name);

  return {
    id: asString(row.id),
    tripId: asString(row.trip_id),
    name: displayName,
    displayName,
    displayOrder: Number(row.display_order ?? 0),
    isActive: asBoolean(row.is_active),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at)
  };
}

function mapTripRouteStop(row: DbRow): TripRouteStop {
  return {
    id: asString(row.id),
    tripId: asString(row.trip_id),
    city: asString(row.city),
    country: nullableString(row.country),
    startDate: row.start_date === null || row.start_date === undefined ? null : asDateOnly(row.start_date),
    endDate: row.end_date === null || row.end_date === undefined ? null : asDateOnly(row.end_date),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at)
  };
}

function isDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeDateInput(value: unknown, label: string) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  if (!isDateInput(text)) {
    throw new Error(`${label} must use YYYY-MM-DD.`);
  }

  return text;
}

function normalizeTripSettingsInput(input: Partial<TripSettingsInput>): TripSettingsInput {
  const tripInput = (input.trip ?? {}) as Partial<TripSettingsInput["trip"]>;
  const name = String(tripInput.name ?? "").trim();
  const destination = String(tripInput.destination ?? "").trim();
  const startDate = normalizeDateInput(tripInput.startDate, "Start date");
  const endDate = normalizeDateInput(tripInput.endDate, "End date");
  const defaultCurrencies = Array.isArray(tripInput.defaultCurrencies)
    ? Array.from(new Set(tripInput.defaultCurrencies.map((currency) => String(currency))))
    : [];
  const timezone = String(tripInput.timezone ?? "").trim() || "Europe/Rome";
  const notes = String(tripInput.notes ?? "").trim();

  if (!name) {
    throw new Error("Trip name is required.");
  }

  if (!destination) {
    throw new Error("Destination is required.");
  }

  if (startDate && endDate && startDate > endDate) {
    throw new Error("Start date must be before or equal to end date.");
  }

  if (
    defaultCurrencies.length === 0 ||
    defaultCurrencies.some((currency) => !(bookingCurrencies as readonly string[]).includes(currency))
  ) {
    throw new Error("Select at least one valid default currency.");
  }

  const normalizedTravelers = normalizeTripTravelerInputs(input.travelers);
  const normalizedRouteStops = normalizeTripRouteStopInputs(input.routeStops);

  return {
    trip: {
      name,
      destination,
      startDate,
      endDate,
      defaultCurrencies: defaultCurrencies as SharedCurrency[],
      timezone,
      notes: notes || null
    },
    travelers: normalizedTravelers,
    routeStops: normalizedRouteStops
  };
}

function normalizeTripTravelerInputs(value: unknown): TripSettingsInput["travelers"] {
  const inputs = Array.isArray(value) ? value : [];
  const travelersByName = new Set<string>();
  const normalized = inputs.map((travelerInput, index) => {
    const traveler = travelerInput as Partial<TripSettingsInput["travelers"][number]>;
    const id = String(traveler.id ?? "").trim();
    const displayName = String(traveler.displayName ?? "").trim();
    const displayOrder = Number(traveler.displayOrder ?? index + 1);
    const isActive = Boolean(traveler.isActive);

    if (id && !/^person_[a-z0-9_]+$/.test(id)) {
      throw new Error("Traveler id is invalid.");
    }

    if (!displayName) {
      throw new Error("Traveler display name is required.");
    }

    if (!Number.isInteger(displayOrder)) {
      throw new Error("Traveler display order must be a whole number.");
    }

    if (isActive) {
      const key = displayName.toLowerCase();
      if (travelersByName.has(key)) {
        throw new Error("Active traveler display names must be unique.");
      }
      travelersByName.add(key);
    }

    return {
      id: id || undefined,
      displayName,
      displayOrder,
      isActive
    };
  });

  if (!normalized.some((traveler) => traveler.isActive)) {
    throw new Error("At least one traveler must stay active.");
  }

  return normalized;
}

function normalizeTripRouteStopInputs(value: unknown): TripSettingsInput["routeStops"] {
  const inputs = Array.isArray(value) ? value : [];

  return inputs.map((stopInput, index) => {
    const stop = stopInput as Partial<TripSettingsInput["routeStops"][number]>;
    const id = String(stop.id ?? "").trim();
    const city = String(stop.city ?? "").trim();
    const country = String(stop.country ?? "").trim();
    const startDate = normalizeDateInput(stop.startDate, "Route start date");
    const endDate = normalizeDateInput(stop.endDate, "Route end date");
    const sortOrder = Number(stop.sortOrder ?? index + 1);

    if (id && !/^[A-Za-z0-9_-]{1,36}$/.test(id)) {
      throw new Error("Route stop id is invalid.");
    }

    if (!city) {
      throw new Error("Route city is required.");
    }

    if (startDate && endDate && startDate > endDate) {
      throw new Error("Route start date must be before or equal to route end date.");
    }

    if (!Number.isInteger(sortOrder)) {
      throw new Error("Route sort order must be a whole number.");
    }

    return {
      id: id || undefined,
      city,
      country: country || null,
      startDate,
      endDate,
      sortOrder
    };
  });
}

function mapReminder(row: DbRow): SharedReminder {
  return {
    id: asString(row.id),
    text: asString(row.text),
    priority: asString(row.priority) as SharedReminder["priority"],
    createdBy: asString(row.created_by),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at)
  };
}

function mapBooking(row: DbRow): SharedBooking {
  return {
    id: asString(row.id),
    category: asString(row.category) as SharedBooking["category"],
    description: asString(row.description),
    date: asDateOnly(row.booking_date),
    location: nullableString(row.location),
    bookedBy: asString(row.booked_by),
    amount: nullableNumber(row.amount),
    currency: nullableString(row.currency) as SharedBooking["currency"],
    notes: nullableString(row.notes),
    status: asString(row.status) as SharedBooking["status"],
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at)
  };
}

function mapItineraryItem(row: DbRow): SharedItineraryItem {
  return {
    id: asString(row.id),
    travelDate: asDateOnly(row.travel_date),
    city: asString(row.city),
    startTime: nullableTime(row.start_time),
    endTime: nullableTime(row.end_time),
    title: asString(row.title),
    location: nullableString(row.location),
    details: nullableString(row.details),
    transport: nullableString(row.transport),
    meal: nullableString(row.meal),
    costAmount: nullableNumber(row.cost_amount),
    currency: asString(row.currency) as SharedItineraryItem["currency"],
    notes: nullableString(row.notes),
    mapQuery: nullableString(row.map_query),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at)
  };
}

function mapExpense(row: DbRow, splitTravelerIds: string[]): SharedExpense {
  return {
    id: asString(row.id),
    sourceType: asString(row.source_type) as SharedExpense["sourceType"],
    sourceId: nullableString(row.source_id),
    title: asString(row.title),
    category: asString(row.category) as SharedExpense["category"],
    amount: Number(row.amount ?? 0),
    currency: asString(row.currency) as SharedExpense["currency"],
    paidByTravelerId: asString(row.paid_by_traveler_id),
    splitTravelerIds,
    settled: asBoolean(row.settled),
    expenseDate: asDateOnly(row.expense_date),
    notes: nullableString(row.notes),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at)
  };
}

function mapPackingItem(row: DbRow, statuses: SharedPackingItem["statuses"]): SharedPackingItem {
  return {
    id: asString(row.id),
    name: asString(row.name),
    category: asString(row.category) as SharedPackingItem["category"],
    priority: asString(row.priority) as SharedPackingItem["priority"],
    notes: nullableString(row.notes),
    quantity: nullableNumber(row.quantity),
    sortOrder: Number(row.sort_order ?? 0),
    statuses,
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at)
  };
}

function mapPackingStatus(row: DbRow): SharedPackingItem["statuses"][number] {
  return {
    travelerId: asString(row.traveler_id),
    status: asString(row.status) as PackingTravelerStatus,
    updatedAt: row.updated_at === null || row.updated_at === undefined ? null : asString(row.updated_at)
  };
}

function mapDocumentItem(row: DbRow, statuses: SharedDocumentItem["statuses"]): SharedDocumentItem {
  const requiresPasscode = asBoolean(row.requires_passcode);
  const externalUrl = nullableString(row.external_url);

  return {
    id: asString(row.id),
    title: asString(row.title),
    category: asString(row.category) as SharedDocumentItem["category"],
    priority: asString(row.priority) as SharedDocumentItem["priority"],
    status: asString(row.status) as SharedDocumentItem["status"],
    externalUrl: requiresPasscode ? null : externalUrl,
    hasExternalUrl: externalUrl !== null,
    requiresPasscode,
    notes: nullableString(row.notes),
    sortOrder: Number(row.sort_order ?? 0),
    statuses,
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at)
  };
}

function mapDocumentStatus(row: DbRow): SharedDocumentItem["statuses"][number] {
  return {
    travelerId: asString(row.traveler_id),
    status: asString(row.status) as DocumentTravelerStatus,
    updatedAt: row.updated_at === null || row.updated_at === undefined ? null : asString(row.updated_at)
  };
}

function sortReminders(reminders: SharedReminder[]) {
  return reminders.sort((a, b) => {
    const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

async function ensureDatabase() {
  const dbName = getDbName();
  assertSafeIdentifier(dbName);
  await getServerPool().execute(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
}

async function createTables() {
  const pool = getAppPool();

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS trips (
      id varchar(36) NOT NULL,
      name varchar(120) NOT NULL,
      destination varchar(120) NOT NULL,
      start_date date DEFAULT NULL,
      end_date date DEFAULT NULL,
      default_currencies json NOT NULL,
      timezone varchar(80) NOT NULL DEFAULT 'UTC',
      notes text,
      setup_completed_at timestamp NULL DEFAULT NULL,
      is_active tinyint(1) NOT NULL DEFAULT 1,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_trips_active (is_active, updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS trip_travelers (
      id varchar(80) NOT NULL,
      trip_id varchar(36) NOT NULL,
      display_name varchar(120) NOT NULL,
      display_order int NOT NULL DEFAULT 0,
      is_active tinyint(1) NOT NULL DEFAULT 1,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_trip_travelers_trip_order (trip_id, is_active, display_order),
      CONSTRAINT fk_trip_travelers_trip
        FOREIGN KEY (trip_id) REFERENCES trips (id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS trip_route_stops (
      id varchar(36) NOT NULL,
      trip_id varchar(36) NOT NULL,
      city varchar(120) NOT NULL,
      country varchar(120) DEFAULT NULL,
      start_date date DEFAULT NULL,
      end_date date DEFAULT NULL,
      sort_order int NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_trip_route_stops_order (trip_id, sort_order, city),
      CONSTRAINT fk_trip_route_stops_trip
        FOREIGN KEY (trip_id) REFERENCES trips (id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS trip_access_controls (
      trip_id varchar(36) NOT NULL,
      share_token_salt varchar(64) NOT NULL,
      share_token_hash varchar(128) NOT NULL,
      edit_passcode_salt varchar(64) NOT NULL,
      edit_passcode_hash varchar(128) NOT NULL,
      owner_recovery_token_salt varchar(64) NOT NULL,
      owner_recovery_token_hash varchar(128) NOT NULL,
      owner_recovery_token_used_at timestamp NULL DEFAULT NULL,
      editor_session_salt varchar(64) DEFAULT NULL,
      editor_session_hash varchar(128) DEFAULT NULL,
      editor_session_expires_at timestamp NULL DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (trip_id),
      KEY idx_trip_access_editor_session (editor_session_expires_at),
      CONSTRAINT fk_trip_access_trip
        FOREIGN KEY (trip_id) REFERENCES trips (id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS reminders (
      id varchar(36) NOT NULL,
      text varchar(500) NOT NULL,
      priority enum('High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
      created_by varchar(80) NOT NULL,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_reminders_priority_created (priority, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS booking_items (
      id varchar(36) NOT NULL,
      category enum('Flight', 'Hotel', 'Train', 'Attraction', 'Restaurant', 'Insurance', 'Other') NOT NULL,
      description varchar(255) NOT NULL,
      booking_date date NOT NULL,
      location varchar(255) DEFAULT NULL,
      booked_by varchar(80) NOT NULL,
      amount decimal(10,2) DEFAULT NULL,
      currency enum(${currencyEnumValues}) DEFAULT NULL,
      notes text,
      status enum('Not Booked', 'Pending', 'Booked', 'Paid', 'Cancelled', 'Need Confirmation') NOT NULL DEFAULT 'Pending',
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_booking_items_filters (category, status, booked_by, booking_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS itinerary_items (
      id varchar(36) NOT NULL,
      travel_date date NOT NULL,
      city varchar(80) NOT NULL,
      start_time time DEFAULT NULL,
      end_time time DEFAULT NULL,
      title varchar(255) NOT NULL,
      location varchar(255) DEFAULT NULL,
      details text,
      transport text,
      meal text,
      cost_amount decimal(10,2) DEFAULT NULL,
      currency enum(${currencyEnumValues}) NOT NULL DEFAULT 'EUR',
      notes text,
      map_query varchar(255) DEFAULT NULL,
      sort_order int NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_itinerary_items_order (travel_date, start_time, sort_order, id),
      KEY idx_itinerary_items_city (city, travel_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS expenses (
      id varchar(36) NOT NULL,
      source_type enum('itinerary', 'booking', 'misc') NOT NULL DEFAULT 'misc',
      source_id varchar(36) DEFAULT NULL,
      title varchar(255) NOT NULL,
      category enum('Flight', 'Accommodation', 'Transport', 'Food', 'Attraction', 'Insurance', 'Shopping', 'Other') NOT NULL,
      amount decimal(10,2) NOT NULL,
      currency enum(${currencyEnumValues}) NOT NULL,
      paid_by_traveler_id varchar(80) NOT NULL,
      settled tinyint(1) NOT NULL DEFAULT 0,
      expense_date date NOT NULL,
      notes text,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_expenses_source (source_type, source_id),
      KEY idx_expenses_date_currency (expense_date, currency),
      KEY idx_expenses_paid_by (paid_by_traveler_id, settled)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS expense_splits (
      id varchar(36) NOT NULL,
      expense_id varchar(36) NOT NULL,
      traveler_id varchar(80) NOT NULL,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_expense_split_traveler (expense_id, traveler_id),
      KEY idx_expense_splits_traveler (traveler_id),
      CONSTRAINT fk_expense_split_expense
        FOREIGN KEY (expense_id) REFERENCES expenses (id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS packing_items (
      id varchar(36) NOT NULL,
      name varchar(255) NOT NULL,
      category enum('Documents', 'Clothes', 'Electronics', 'Medicine', 'Toiletries', 'Travel Essentials', 'Shared Items', 'Personal Care', 'Other') NOT NULL,
      priority enum('High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
      notes text,
      quantity int DEFAULT NULL,
      sort_order int NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_packing_items_grouping (category, priority, sort_order, name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS packing_item_traveler_statuses (
      id varchar(36) NOT NULL,
      item_id varchar(36) NOT NULL,
      traveler_id varchar(80) NOT NULL,
      status enum('required', 'packed', 'not_needed') NOT NULL DEFAULT 'required',
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_packing_item_traveler (item_id, traveler_id),
      KEY idx_packing_traveler_status (traveler_id, status),
      CONSTRAINT fk_packing_status_item
        FOREIGN KEY (item_id) REFERENCES packing_items (id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS document_items (
      id varchar(36) NOT NULL,
      title varchar(255) NOT NULL,
      category enum('Passport', 'Flight', 'Hotel', 'Insurance', 'Visa / Entry', 'Transport', 'Booking', 'Other') NOT NULL,
      priority enum('High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
      status enum('Needed', 'Saved', 'Printed', 'Ready', 'Not needed') NOT NULL DEFAULT 'Needed',
      external_url varchar(1000) DEFAULT NULL,
      requires_passcode tinyint(1) NOT NULL DEFAULT 0,
      passcode_salt varchar(64) DEFAULT NULL,
      passcode_hash varchar(128) DEFAULT NULL,
      notes text,
      sort_order int NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_document_items_grouping (category, priority, status, sort_order, title),
      KEY idx_document_items_protected (requires_passcode)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS document_item_traveler_statuses (
      id varchar(36) NOT NULL,
      item_id varchar(36) NOT NULL,
      traveler_id varchar(80) NOT NULL,
      status enum('required', 'saved', 'not_needed') NOT NULL DEFAULT 'required',
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_document_item_traveler (item_id, traveler_id),
      KEY idx_document_traveler_status (traveler_id, status),
      CONSTRAINT fk_document_status_item
        FOREIGN KEY (item_id) REFERENCES document_items (id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function updateCurrencyEnums() {
  const pool = getAppPool();

  await pool.execute(`ALTER TABLE booking_items MODIFY currency enum(${currencyEnumValues}) DEFAULT NULL`);
  await pool.execute(`ALTER TABLE itinerary_items MODIFY currency enum(${currencyEnumValues}) NOT NULL DEFAULT 'EUR'`);
  await pool.execute(`ALTER TABLE expenses MODIFY currency enum(${currencyEnumValues}) NOT NULL`);
}

async function ensureTripSetupCompletedColumn() {
  try {
    await getAppPool().execute("ALTER TABLE trips ADD COLUMN setup_completed_at timestamp NULL DEFAULT NULL AFTER notes");
  } catch (error) {
    if ((error as { code?: string }).code !== "ER_DUP_FIELDNAME") {
      throw error;
    }
  }
}

function listText(label: string, items: string[]) {
  if (items.length === 0) {
    return "";
  }

  return [`**${label}**`, ...items.map((item) => `- ${item}`)].join("\n");
}

function seedDetails(day: (typeof itinerary)[number]) {
  return [
    day.highlight,
    listText("Morning", day.morning),
    listText("Afternoon", day.afternoon),
    listText("Evening", day.evening)
  ].filter(Boolean).join("\n\n");
}

function seedNotes(day: (typeof itinerary)[number]) {
  return [
    day.hotel ? `Base: ${day.hotel}` : "",
    listText("Tickets", day.tickets),
    day.notes
  ].filter(Boolean).join("\n\n");
}

function travelerIdFromName(name: string) {
  return travelers.find((traveler) => traveler.name === name)?.id ?? null;
}

function requireTravelerIdFromName(name: string) {
  const travelerId = travelerIdFromName(name);

  if (!travelerId) {
    throw new Error(`Unknown traveler name in seed data: ${name}`);
  }

  return travelerId;
}

function seedPackingStatuses(item: (typeof packingItems)[number]) {
  if (item.owner !== "Everyone") {
    const ownerId = travelerIdFromName(item.owner);
    return travelers.map((traveler) => ({
      travelerId: traveler.id,
      status:
        traveler.id === ownerId
          ? item.checked
            ? "packed"
            : "required"
          : "not_needed"
    }));
  }

  if (!item.required) {
    return travelers.map((traveler) => ({
      travelerId: traveler.id,
      status: "not_needed"
    }));
  }

  return travelers.map((traveler) => ({
    travelerId: traveler.id,
    status: item.checked ? "packed" : "required"
  }));
}

function seedDocumentCategory(category: (typeof documentLinks)[number]["category"]): DocumentCategory {
  if (category === "Train") {
    return "Transport";
  }

  if (category === "Attraction" || category === "Receipt") {
    return "Booking";
  }

  if ((documentCategories as readonly string[]).includes(category)) {
    return category as DocumentCategory;
  }

  return "Other";
}

function seedDocumentUrl(link: string) {
  const trimmed = link.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : null;
}

async function seedActiveTripSettings() {
  const pool = getAppPool();
  const [tripRows] = await pool.execute<DbRow[]>("SELECT COUNT(*) AS count FROM trips");
  const tripCount = Number(tripRows[0]?.count ?? 0);

  if (tripCount > 0) {
    return;
  }

  await pool.execute(
    `INSERT INTO trips
      (id, name, destination, start_date, end_date, default_currencies, timezone, notes, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      activeTripId,
      "Italy Trip 2026",
      "Italy",
      "2026-10-08",
      "2026-10-18",
      JSON.stringify(defaultTripCurrencies),
      "Europe/Rome",
      "Safe placeholder active trip settings for the private dashboard.",
      1
    ]
  );

  for (const traveler of travelers) {
    await pool.execute(
      `INSERT INTO trip_travelers
        (id, trip_id, display_name, display_order, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [traveler.id, activeTripId, traveler.name, traveler.displayOrder, 1]
    );
  }

  for (const [index, city] of defaultTripRouteStops.entries()) {
    await pool.execute(
      `INSERT INTO trip_route_stops
        (id, trip_id, city, country, start_date, end_date, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [`route-stop-${index + 1}`, activeTripId, city, "Italy", null, null, index + 1]
    );
  }
}

async function seedTables() {
  const pool = getAppPool();
  await seedActiveTripSettings();

  const [reminderRows] = await pool.execute<DbRow[]>("SELECT COUNT(*) AS count FROM reminders");
  const reminderCount = Number(reminderRows[0]?.count ?? 0);

  if (reminderCount === 0) {
    for (const [index, reminder] of tripInfo.reminders.entries()) {
      await pool.execute(
        "INSERT INTO reminders (id, text, priority, created_by) VALUES (?, ?, ?, ?)",
        [`seed-reminder-${index + 1}`, reminder, index < 2 ? "High" : "Medium", "Person A"]
      );
    }
  }

  const [bookingRows] = await pool.execute<DbRow[]>("SELECT COUNT(*) AS count FROM booking_items");
  const bookingCount = Number(bookingRows[0]?.count ?? 0);

  if (bookingCount === 0) {
    for (const booking of bookings) {
      await pool.execute(
        `INSERT INTO booking_items
          (id, category, description, booking_date, location, booked_by, amount, currency, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          booking.id,
          booking.category,
          booking.title,
          booking.date,
          booking.location ?? null,
          booking.bookedBy,
          booking.amount ?? null,
          booking.currency ?? null,
          booking.notes ?? null,
          booking.status
        ]
      );
    }
  }

  const [itineraryRows] = await pool.execute<DbRow[]>("SELECT COUNT(*) AS count FROM itinerary_items");
  const itineraryCount = Number(itineraryRows[0]?.count ?? 0);

  if (itineraryCount === 0) {
    for (const day of itinerary) {
      await pool.execute(
        `INSERT INTO itinerary_items
          (id, travel_date, city, title, location, details, transport, meal,
           cost_amount, currency, notes, map_query, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `seed-itinerary-day-${day.day}`,
          day.date,
          day.city,
          day.title,
          day.hotel ?? null,
          seedDetails(day),
          day.transport.map((item) => `- ${item}`).join("\n"),
          day.meals.map((item) => `- ${item}`).join("\n"),
          day.estimatedCost,
          day.currency,
          seedNotes(day),
          day.mapLinks[0]?.label ?? `${day.title} ${day.city}`,
          day.day
        ]
      );
    }
  }

  const [expenseRows] = await pool.execute<DbRow[]>("SELECT COUNT(*) AS count FROM expenses");
  const expenseCount = Number(expenseRows[0]?.count ?? 0);

  if (expenseCount === 0) {
    for (const expense of expenses) {
      const paidByTravelerId = requireTravelerIdFromName(expense.paidBy);
      await pool.execute(
        `INSERT INTO expenses
          (id, source_type, source_id, title, category, amount, currency,
           paid_by_traveler_id, settled, expense_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          expense.id,
          "misc",
          null,
          expense.item,
          expense.category,
          expense.amount,
          expense.currency,
          paidByTravelerId,
          expense.settled ? 1 : 0,
          expense.date,
          expense.notes ?? null
        ]
      );

      for (const splitName of expense.splitAmong) {
        await pool.execute(
          `INSERT INTO expense_splits
            (id, expense_id, traveler_id)
           VALUES (?, ?, ?)`,
          [randomUUID(), expense.id, requireTravelerIdFromName(splitName)]
        );
      }
    }
  }

  const [packingRows] = await pool.execute<DbRow[]>("SELECT COUNT(*) AS count FROM packing_items");
  const packingCount = Number(packingRows[0]?.count ?? 0);

  if (packingCount === 0) {
    for (const [index, item] of packingItems.entries()) {
      const id = `seed-packing-item-${index + 1}`;
      await pool.execute(
        `INSERT INTO packing_items
          (id, name, category, priority, notes, quantity, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          item.item,
          item.category,
          item.required ? "High" : "Medium",
          item.owner === "Everyone" ? null : `Owner placeholder: ${item.owner}`,
          null,
          index + 1
        ]
      );

      for (const status of seedPackingStatuses(item)) {
        await pool.execute(
          `INSERT INTO packing_item_traveler_statuses
            (id, item_id, traveler_id, status)
           VALUES (?, ?, ?, ?)`,
          [randomUUID(), id, status.travelerId, status.status]
        );
      }
    }
  }

  const [documentRows] = await pool.execute<DbRow[]>("SELECT COUNT(*) AS count FROM document_items");
  const documentCount = Number(documentRows[0]?.count ?? 0);

  if (documentCount === 0) {
    for (const [index, document] of documentLinks.entries()) {
      const id = `seed-document-item-${index + 1}`;
      await pool.execute(
        `INSERT INTO document_items
          (id, title, category, priority, status, external_url, requires_passcode,
           passcode_salt, passcode_hash, notes, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          document.title,
          seedDocumentCategory(document.category),
          document.sensitive ? "High" : "Medium",
          "Needed",
          seedDocumentUrl(document.link),
          0,
          null,
          null,
          document.notes ?? null,
          index + 1
        ]
      );

      for (const traveler of travelers) {
        await pool.execute(
          `INSERT INTO document_item_traveler_statuses
            (id, item_id, traveler_id, status)
           VALUES (?, ?, ?, ?)`,
          [randomUUID(), id, traveler.id, "required"]
        );
      }
    }
  }
}

export async function ensureSharedDataStore() {
  if (sharedDataStoreState.initialized) {
    return;
  }

  if (sharedDataStoreState.initializePromise) {
    return sharedDataStoreState.initializePromise;
  }

  sharedDataStoreState.initializePromise = (async () => {
    if (!usesManagedSchema()) {
      await ensureDatabase();
      await createTables();
      await ensureTripSetupCompletedColumn();
      await updateCurrencyEnums();
      await seedTables();
    }

    sharedDataStoreState.initialized = true;
  })();

  try {
    await sharedDataStoreState.initializePromise;
  } finally {
    sharedDataStoreState.initializePromise = null;
  }
}

export async function getActiveTripSettings(): Promise<TripSettingsResponse> {
  await ensureSharedDataStore();

  const [tripRows] = await getAppPool().execute<DbRow[]>(
    "SELECT * FROM trips WHERE is_active = 1 ORDER BY updated_at DESC, created_at DESC LIMIT 1"
  );
  const tripRow = tripRows[0];

  if (!tripRow) {
    throw new Error("Active trip settings were not found.");
  }

  const trip = mapTripSettings(tripRow);
  const [travelerRows] = await getAppPool().execute<DbRow[]>(
    `SELECT * FROM trip_travelers
     WHERE trip_id = ?
     ORDER BY is_active DESC, display_order ASC, display_name ASC, id ASC`,
    [trip.id]
  );
  const [routeRows] = await getAppPool().execute<DbRow[]>(
    `SELECT * FROM trip_route_stops
     WHERE trip_id = ?
     ORDER BY sort_order ASC, city ASC, id ASC`,
    [trip.id]
  );

  return {
    trip,
    travelers: travelerRows.map(mapTripTraveler),
    routeStops: routeRows.map(mapTripRouteStop)
  };
}

export async function listTripTravelersForBusinessData() {
  await ensureSharedDataStore();
  const [rows] = await getAppPool().execute<DbRow[]>(
    `SELECT * FROM trip_travelers
     WHERE trip_id = ?
     ORDER BY display_order ASC, display_name ASC, id ASC`,
    [activeTripId]
  );

  return rows.map(mapTripTraveler);
}

async function listTripTravelerIds() {
  const tripTravelers = await listTripTravelersForBusinessData();
  return new Set(tripTravelers.map((traveler) => traveler.id));
}

function generateTravelerId(existingIds: Set<string>) {
  for (let code = 97; code <= 122; code += 1) {
    const id = `person_${String.fromCharCode(code)}`;
    if (!existingIds.has(id)) {
      existingIds.add(id);
      return id;
    }
  }

  let id = `person_${randomUUID().slice(0, 8)}`;
  while (existingIds.has(id)) {
    id = `person_${randomUUID().slice(0, 8)}`;
  }
  existingIds.add(id);
  return id;
}

async function insertMissingChecklistStatuses(executor: MysqlConnection, travelerIds: string[]) {
  if (travelerIds.length === 0) {
    return;
  }

  const [packingRows] = await executor.execute<DbRow[]>("SELECT id, category FROM packing_items");
  for (const row of packingRows) {
    const itemId = asString(row.id);
    const status = defaultPackingStatusForCategory(asString(row.category) as PackingCategory);
    for (const travelerId of travelerIds) {
      await executor.execute(
        `INSERT IGNORE INTO packing_item_traveler_statuses
          (id, item_id, traveler_id, status)
         VALUES (?, ?, ?, ?)`,
        [randomUUID(), itemId, travelerId, status]
      );
    }
  }

  const [documentRows] = await executor.execute<DbRow[]>("SELECT id FROM document_items");
  for (const row of documentRows) {
    const itemId = asString(row.id);
    for (const travelerId of travelerIds) {
      await executor.execute(
        `INSERT IGNORE INTO document_item_traveler_statuses
          (id, item_id, traveler_id, status)
         VALUES (?, ?, ?, 'required')`,
        [randomUUID(), itemId, travelerId]
      );
    }
  }
}

export async function updateActiveTripSettings(rawInput: Partial<TripSettingsInput>) {
  await ensureSharedDataStore();
  const input = normalizeTripSettingsInput(rawInput);
  const connection = await getAppPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE trips
       SET name = ?, destination = ?, start_date = ?, end_date = ?,
           default_currencies = ?, timezone = ?, notes = ?, is_active = 1
       WHERE id = ?`,
      [
        input.trip.name,
        input.trip.destination,
        input.trip.startDate,
        input.trip.endDate,
        JSON.stringify(input.trip.defaultCurrencies),
        input.trip.timezone,
        input.trip.notes,
        activeTripId
      ]
    );

    const [existingTravelerRows] = await connection.execute<DbRow[]>(
      "SELECT id FROM trip_travelers WHERE trip_id = ?",
      [activeTripId]
    );
    const existingTravelerIds = new Set(existingTravelerRows.map((row) => asString(row.id)));
    const addedTravelerIds: string[] = [];

    for (const traveler of input.travelers) {
      const id = traveler.id || generateTravelerId(existingTravelerIds);
      if (!traveler.id) {
        addedTravelerIds.push(id);
      }

      await connection.execute(
        `INSERT INTO trip_travelers
          (id, trip_id, display_name, display_order, is_active)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          display_name = VALUES(display_name),
          display_order = VALUES(display_order),
          is_active = VALUES(is_active)`,
        [id, activeTripId, traveler.displayName, traveler.displayOrder, traveler.isActive ? 1 : 0]
      );
    }

    const submittedRouteIds = input.routeStops
      .map((stop) => stop.id)
      .filter((id): id is string => Boolean(id));
    if (submittedRouteIds.length > 0) {
      const placeholders = submittedRouteIds.map(() => "?").join(", ");
      await connection.execute(
        `DELETE FROM trip_route_stops
         WHERE trip_id = ? AND id NOT IN (${placeholders})`,
        [activeTripId, ...submittedRouteIds]
      );
    } else {
      await connection.execute("DELETE FROM trip_route_stops WHERE trip_id = ?", [activeTripId]);
    }

    for (const stop of input.routeStops) {
      const id = stop.id || randomUUID();
      await connection.execute(
        `INSERT INTO trip_route_stops
          (id, trip_id, city, country, start_date, end_date, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          city = VALUES(city),
          country = VALUES(country),
          start_date = VALUES(start_date),
          end_date = VALUES(end_date),
          sort_order = VALUES(sort_order)`,
        [
          id,
          activeTripId,
          stop.city,
          stop.country ?? null,
          stop.startDate ?? null,
          stop.endDate ?? null,
          stop.sortOrder
        ]
      );
    }

    await insertMissingChecklistStatuses(connection, addedTravelerIds);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getActiveTripSettings();
}

export async function generateStarterWorkspace(
  rawInput: Partial<SetupGenerationInput>
): Promise<SetupGenerationResponse> {
  await ensureSharedDataStore();
  if (!usesManagedSchema()) {
    await ensureTripSetupCompletedColumn();
  }
  const generated = buildStarterWorkspace(rawInput);
  const connection = await getAppPool().getConnection();

  try {
    await connection.beginTransaction();
    await resetStarterWorkspaceTables(connection);
    await insertGeneratedTripSettings(connection, generated);
    await insertGeneratedReminders(connection, generated);
    await insertGeneratedBookings(connection, generated);
    await insertGeneratedItinerary(connection, generated);
    await insertGeneratedPacking(connection, generated);
    await insertGeneratedDocuments(connection, generated);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return {
    settings: await getActiveTripSettings(),
    summary: generated.summary
  };
}

async function resetStarterWorkspaceTables(connection: MysqlConnection) {
  await connection.execute("DELETE FROM expense_splits");
  await connection.execute("DELETE FROM expenses");
  await connection.execute("DELETE FROM reminders");
  await connection.execute("DELETE FROM booking_items");
  await connection.execute("DELETE FROM itinerary_items");
  await connection.execute("DELETE FROM packing_item_traveler_statuses");
  await connection.execute("DELETE FROM packing_items");
  await connection.execute("DELETE FROM document_item_traveler_statuses");
  await connection.execute("DELETE FROM document_items");
  await connection.execute("DELETE FROM trip_route_stops WHERE trip_id = ?", [activeTripId]);
  await connection.execute("DELETE FROM trip_travelers WHERE trip_id = ?", [activeTripId]);
}

async function insertGeneratedTripSettings(connection: MysqlConnection, generated: GeneratedWorkspace) {
  const { trip, travelers, routeStops } = generated.settings;

  await connection.execute(
    `INSERT INTO trips
      (id, name, destination, start_date, end_date, default_currencies, timezone, notes, setup_completed_at, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
     ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      destination = VALUES(destination),
      start_date = VALUES(start_date),
      end_date = VALUES(end_date),
      default_currencies = VALUES(default_currencies),
      timezone = VALUES(timezone),
      notes = VALUES(notes),
      setup_completed_at = CURRENT_TIMESTAMP,
      is_active = 1`,
    [
      activeTripId,
      trip.name,
      trip.destination,
      trip.startDate ?? null,
      trip.endDate ?? null,
      JSON.stringify(trip.defaultCurrencies),
      trip.timezone,
      trip.notes ?? null
    ]
  );

  const travelerIds = new Set<string>();
  for (const traveler of travelers) {
    const travelerId = traveler.id || generateTravelerId(travelerIds);
    travelerIds.add(travelerId);
    await connection.execute(
      `INSERT INTO trip_travelers
        (id, trip_id, display_name, display_order, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [
        travelerId,
        activeTripId,
        traveler.displayName,
        traveler.displayOrder,
        traveler.isActive ? 1 : 0
      ]
    );
  }

  for (const stop of routeStops) {
    await connection.execute(
      `INSERT INTO trip_route_stops
        (id, trip_id, city, country, start_date, end_date, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        stop.id ?? randomUUID(),
        activeTripId,
        stop.city,
        stop.country ?? null,
        stop.startDate ?? null,
        stop.endDate ?? null,
        stop.sortOrder
      ]
    );
  }
}

async function insertGeneratedReminders(connection: MysqlConnection, generated: GeneratedWorkspace) {
  for (const [index, reminder] of generated.reminders.entries()) {
    await connection.execute(
      "INSERT INTO reminders (id, text, priority, created_by) VALUES (?, ?, ?, ?)",
      [`setup-reminder-${index + 1}`, reminder.text, reminder.priority, reminder.createdBy]
    );
  }
}

async function insertGeneratedBookings(connection: MysqlConnection, generated: GeneratedWorkspace) {
  for (const [index, booking] of generated.bookings.entries()) {
    await connection.execute(
      `INSERT INTO booking_items
        (id, category, description, booking_date, location, booked_by, amount, currency, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `setup-booking-${index + 1}`,
        booking.category,
        booking.description,
        booking.date,
        booking.location || null,
        booking.bookedBy,
        null,
        null,
        booking.notes || null,
        booking.status
      ]
    );
  }
}

async function insertGeneratedItinerary(connection: MysqlConnection, generated: GeneratedWorkspace) {
  for (const [index, item] of generated.itineraryItems.entries()) {
    await connection.execute(
      `INSERT INTO itinerary_items
        (id, travel_date, city, start_time, end_time, title, location, details,
         transport, meal, cost_amount, currency, notes, map_query, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `setup-itinerary-${index + 1}`,
        item.travelDate,
        item.city,
        item.startTime || null,
        item.endTime || null,
        item.title,
        item.location || null,
        item.details || null,
        item.transport || null,
        item.meal || null,
        null,
        item.currency ?? generated.settings.trip.defaultCurrencies[0],
        item.notes || null,
        item.mapQuery || null,
        item.sortOrder ?? index + 1
      ]
    );
  }
}

async function insertGeneratedPacking(connection: MysqlConnection, generated: GeneratedWorkspace) {
  for (const [index, item] of generated.packingItems.entries()) {
    const itemId = `setup-packing-${index + 1}`;
    await connection.execute(
      `INSERT INTO packing_items
        (id, name, category, priority, notes, quantity, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        itemId,
        item.name,
        item.category,
        item.priority,
        item.notes || null,
        item.quantity ?? null,
        item.sortOrder ?? index + 1
      ]
    );
    await insertPackingStatuses(connection, itemId, item.statuses);
  }
}

async function insertGeneratedDocuments(connection: MysqlConnection, generated: GeneratedWorkspace) {
  for (const [index, document] of generated.documents.entries()) {
    const documentId = `setup-document-${index + 1}`;
    await connection.execute(
      `INSERT INTO document_items
        (id, title, category, priority, status, external_url, requires_passcode,
         passcode_salt, passcode_hash, notes, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, ?)`,
      [
        documentId,
        document.title,
        document.category,
        document.priority,
        document.status,
        document.externalUrl || null,
        document.notes || null,
        document.sortOrder ?? index + 1
      ]
    );
    await insertDocumentStatuses(connection, documentId, document.statuses);
  }
}

export function validateReminderInput(input: Partial<ReminderInput>) {
  const text = String(input.text ?? "").trim();
  const priority = input.priority;
  const createdBy = String(input.createdBy ?? "").trim();

  if (!text) {
    throw new Error("Reminder text is required.");
  }

  if (!priority || !(reminderPriorities as readonly string[]).includes(priority)) {
    throw new Error("Reminder priority is invalid.");
  }

  if (!createdBy) {
    throw new Error("Created by is required.");
  }

  return { text, priority, createdBy };
}

export function validateBookingInput(input: Partial<BookingInput>) {
  const category = input.category;
  const description = String(input.description ?? "").trim();
  const date = String(input.date ?? "").trim();
  const location = String(input.location ?? "").trim();
  const bookedBy = String(input.bookedBy ?? "").trim();
  const rawAmount = input.amount as number | string | null | undefined;
  const amount = rawAmount === null || rawAmount === undefined || rawAmount === "" ? null : Number(rawAmount);
  const currency = input.currency || null;
  const notes = String(input.notes ?? "").trim();
  const status = input.status;
  const budgetPaidByTravelerId = String(input.budgetPaidByTravelerId ?? "").trim();
  const budgetSplitTravelerIds = Array.isArray(input.budgetSplitTravelerIds)
    ? Array.from(
        new Set(input.budgetSplitTravelerIds.map((travelerId) => String(travelerId).trim()).filter(Boolean))
      )
    : undefined;
  const budgetSettled = Boolean(input.budgetSettled);

  if (!category || !(bookingCategories as readonly string[]).includes(category)) {
    throw new Error("Booking category is invalid.");
  }

  if (!description) {
    throw new Error("Description is required.");
  }

  if (!date) {
    throw new Error("Date is required.");
  }

  if (!bookedBy) {
    throw new Error("Booked by is required.");
  }

  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
    throw new Error("Amount must be zero or greater.");
  }

  if (amount !== null && amount > 0 && !currency) {
    throw new Error("Currency is required when amount is set.");
  }

  if (currency !== null && !(bookingCurrencies as readonly string[]).includes(currency)) {
    throw new Error("Currency is invalid.");
  }

  if (!status || !(bookingStatuses as readonly string[]).includes(status)) {
    throw new Error("Booking status is invalid.");
  }

  return {
    category,
    description,
    date,
    location: location || undefined,
    bookedBy,
    amount,
    currency,
    notes: notes || undefined,
    status,
    budgetPaidByTravelerId: budgetPaidByTravelerId || undefined,
    budgetSplitTravelerIds,
    budgetSettled
  };
}

export function validateItineraryInput(input: Partial<ItineraryInput>) {
  const travelDate = String(input.travelDate ?? "").trim();
  const city = String(input.city ?? "").trim();
  const startTime = String(input.startTime ?? "").trim();
  const endTime = String(input.endTime ?? "").trim();
  const title = String(input.title ?? "").trim();
  const location = String(input.location ?? "").trim();
  const details = String(input.details ?? "").trim();
  const transport = String(input.transport ?? "").trim();
  const meal = String(input.meal ?? "").trim();
  const rawCostAmount = input.costAmount as number | string | null | undefined;
  const costAmount =
    rawCostAmount === null || rawCostAmount === undefined || rawCostAmount === ""
      ? null
      : Number(rawCostAmount);
  const currency = input.currency || "EUR";
  const notes = String(input.notes ?? "").trim();
  const mapQuery = String(input.mapQuery ?? "").trim();
  const rawSortOrder = input.sortOrder as number | string | null | undefined;
  const sortOrder =
    rawSortOrder === null || rawSortOrder === undefined || rawSortOrder === ""
      ? 0
      : Number(rawSortOrder);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(travelDate)) {
    throw new Error("Travel date is required.");
  }

  if (!city) {
    throw new Error("City is required.");
  }

  if (startTime && !/^\d{2}:\d{2}$/.test(startTime)) {
    throw new Error("Start time must use HH:MM.");
  }

  if (endTime && !/^\d{2}:\d{2}$/.test(endTime)) {
    throw new Error("End time must use HH:MM.");
  }

  if (!title) {
    throw new Error("Title is required.");
  }

  if (costAmount !== null && (!Number.isFinite(costAmount) || costAmount < 0)) {
    throw new Error("Cost amount must be zero or greater.");
  }

  if (!(bookingCurrencies as readonly string[]).includes(currency)) {
    throw new Error("Currency is invalid.");
  }

  if (!Number.isInteger(sortOrder)) {
    throw new Error("Sort order must be a whole number.");
  }

  return {
    travelDate,
    city,
    startTime: startTime || undefined,
    endTime: endTime || undefined,
    title,
    location: location || undefined,
    details: details || undefined,
    transport: transport || undefined,
    meal: meal || undefined,
    costAmount,
    currency,
    notes: notes || undefined,
    mapQuery: mapQuery || undefined,
    sortOrder
  };
}

function assertTravelerId(value: string, allowedTravelerIds: Set<string>, fieldLabel: string) {
  if (!allowedTravelerIds.has(value)) {
    throw new Error(`${fieldLabel} is invalid.`);
  }
}

export async function validateExpenseInput(input: Partial<ExpenseInput>) {
  const allowedTravelerIds = await listTripTravelerIds();
  const sourceType = input.sourceType;
  const sourceId = String(input.sourceId ?? "").trim();
  const title = String(input.title ?? "").trim();
  const category = input.category;
  const rawAmount = input.amount as number | string | null | undefined;
  const amount = rawAmount === null || rawAmount === undefined || rawAmount === "" ? NaN : Number(rawAmount);
  const currency = input.currency;
  const paidByTravelerId = String(input.paidByTravelerId ?? "").trim();
  const settled = Boolean(input.settled);
  const expenseDate = String(input.expenseDate ?? "").trim();
  const notes = String(input.notes ?? "").trim();
  const splitTravelerIds = Array.isArray(input.splitTravelerIds)
    ? input.splitTravelerIds.map((travelerId) => String(travelerId).trim())
    : [];
  const uniqueSplitTravelerIds = Array.from(new Set(splitTravelerIds));

  if (!sourceType || !(expenseSourceTypes as readonly string[]).includes(sourceType)) {
    throw new Error("Expense source type is invalid.");
  }

  if (!title) {
    throw new Error("Expense title is required.");
  }

  if (!category || !(expenseCategories as readonly string[]).includes(category)) {
    throw new Error("Expense category is invalid.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Expense amount must be greater than zero.");
  }

  if (!currency || !(bookingCurrencies as readonly string[]).includes(currency)) {
    throw new Error("Expense currency is invalid.");
  }

  assertTravelerId(paidByTravelerId, allowedTravelerIds, "Paid by traveler");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    throw new Error("Expense date must use YYYY-MM-DD.");
  }

  if (splitTravelerIds.length === 0) {
    throw new Error("At least one split traveler is required.");
  }

  if (uniqueSplitTravelerIds.length !== splitTravelerIds.length) {
    throw new Error("Split travelers must not contain duplicates.");
  }

  for (const travelerId of uniqueSplitTravelerIds) {
    assertTravelerId(travelerId, allowedTravelerIds, "Split traveler");
  }

  return {
    sourceType,
    sourceId: sourceId || null,
    title,
    category,
    amount,
    currency,
    paidByTravelerId,
    splitTravelerIds: uniqueSplitTravelerIds,
    settled,
    expenseDate,
    notes: notes || null
  };
}

function normalizePackingStatuses(
  category: PackingCategory,
  inputStatuses: PackingInput["statuses"] | undefined,
  tripTravelers: TripTraveler[]
) {
  const allowedTravelerIds = new Set(tripTravelers.map((traveler) => traveler.id));
  const defaultStatuses = new Map(
    tripTravelers
      .filter((traveler) => traveler.isActive)
      .map((traveler) => [traveler.id, defaultPackingStatusForCategory(category)])
  );

  for (const status of inputStatuses ?? []) {
    if (!allowedTravelerIds.has(status.travelerId)) {
      throw new Error("Packing traveler is invalid.");
    }

    if (!(packingTravelerStatuses as readonly string[]).includes(status.status)) {
      throw new Error("Packing traveler status is invalid.");
    }

    defaultStatuses.set(status.travelerId, status.status);
  }

  return tripTravelers
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .filter((traveler) => defaultStatuses.has(traveler.id))
    .map((traveler) => ({
      travelerId: traveler.id,
      status: defaultStatuses.get(traveler.id) ?? "required"
    }));
}

export async function validatePackingInput(input: Partial<PackingInput>) {
  const tripTravelers = await listTripTravelersForBusinessData();
  const name = String(input.name ?? "").trim();
  const category = input.category;
  const priority = input.priority;
  const notes = String(input.notes ?? "").trim();
  const rawQuantity = input.quantity as number | string | null | undefined;
  const quantity =
    rawQuantity === null || rawQuantity === undefined || rawQuantity === ""
      ? null
      : Number(rawQuantity);
  const rawSortOrder = input.sortOrder as number | string | null | undefined;
  const sortOrder =
    rawSortOrder === null || rawSortOrder === undefined || rawSortOrder === ""
      ? 0
      : Number(rawSortOrder);

  if (!name) {
    throw new Error("Item name is required.");
  }

  if (!category || !(packingCategories as readonly string[]).includes(category)) {
    throw new Error("Packing category is invalid.");
  }

  if (!priority || !(packingPriorities as readonly string[]).includes(priority)) {
    throw new Error("Packing priority is invalid.");
  }

  if (quantity !== null && (!Number.isInteger(quantity) || quantity < 0)) {
    throw new Error("Quantity must be a whole number zero or greater.");
  }

  if (!Number.isInteger(sortOrder)) {
    throw new Error("Sort order must be a whole number.");
  }

  return {
    name,
    category,
    priority,
    notes: notes || undefined,
    quantity,
    sortOrder,
    statuses: normalizePackingStatuses(category, input.statuses, tripTravelers)
  };
}

function normalizeDocumentStatuses(
  inputStatuses: DocumentInput["statuses"] | undefined,
  tripTravelers: TripTraveler[]
) {
  const allowedTravelerIds = new Set(tripTravelers.map((traveler) => traveler.id));
  const statusesByTraveler = new Map<string, DocumentTravelerStatus>(
    tripTravelers
      .filter((traveler) => traveler.isActive)
      .map((traveler) => [traveler.id, "required"])
  );

  for (const status of inputStatuses ?? []) {
    if (!allowedTravelerIds.has(status.travelerId)) {
      throw new Error("Document traveler is invalid.");
    }

    if (!(documentTravelerStatuses as readonly string[]).includes(status.status)) {
      throw new Error("Document traveler status is invalid.");
    }

    statusesByTraveler.set(status.travelerId, status.status);
  }

  return tripTravelers
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .filter((traveler) => statusesByTraveler.has(traveler.id))
    .map((traveler) => ({
      travelerId: traveler.id,
      status: statusesByTraveler.get(traveler.id) ?? "required"
    }));
}

function normalizeExternalUrl(value: unknown) {
  const externalUrl = String(value ?? "").trim();

  if (!externalUrl) {
    return null;
  }

  try {
    const url = new URL(externalUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("External folder link must start with http:// or https://.");
    }
    return url.toString();
  } catch {
    throw new Error("External folder link must be a valid http:// or https:// URL.");
  }
}

function hashPasscode(passcode: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(`${salt}:${passcode}`).digest("hex");
  return { salt, hash };
}

function verifyPasscode(passcode: string, salt: string, hash: string) {
  const attemptedHash = createHash("sha256").update(`${salt}:${passcode}`).digest("hex");
  const expected = Buffer.from(hash, "hex");
  const attempted = Buffer.from(attemptedHash, "hex");

  return expected.length === attempted.length && timingSafeEqual(expected, attempted);
}

function generateAccessToken() {
  return randomBytes(32).toString("base64url");
}

function normalizeSecret(value: unknown, label: string, minimumLength = 1) {
  const secret = String(value ?? "").trim();

  if (secret.length < minimumLength) {
    throw new Error(`${label} must be at least ${minimumLength} characters.`);
  }

  if (secret.length > 256) {
    throw new Error(`${label} is too long.`);
  }

  return secret;
}

function toMysqlDateTime(value: Date) {
  return value.toISOString().slice(0, 19).replace("T", " ");
}

function isFutureDate(value: unknown) {
  if (!value) {
    return false;
  }

  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isFinite(date.getTime()) && date.getTime() > Date.now();
}

function mapEditorExpiresAt(value: unknown) {
  return value === null || value === undefined ? null : asString(value);
}

async function getActiveTripAccessRow(executor: MysqlPool | MysqlConnection = getAppPool()) {
  const [rows] = await executor.execute<DbRow[]>(
    "SELECT * FROM trip_access_controls WHERE trip_id = ? LIMIT 1",
    [activeTripId]
  );
  return rows[0] ?? null;
}

function rowHasValidShareToken(row: DbRow, shareToken: string) {
  const salt = nullableString(row.share_token_salt);
  const hash = nullableString(row.share_token_hash);
  return Boolean(shareToken && salt && hash && verifyPasscode(shareToken, salt, hash));
}

function rowHasValidEditorSession(row: DbRow, editorToken: string) {
  const salt = nullableString(row.editor_session_salt);
  const hash = nullableString(row.editor_session_hash);

  return Boolean(
    editorToken &&
      salt &&
      hash &&
      isFutureDate(row.editor_session_expires_at) &&
      verifyPasscode(editorToken, salt, hash)
  );
}

async function storeEditorSession(
  executor: MysqlPool | MysqlConnection,
  tripId: string,
  editorToken: string,
  editorExpiresAt: Date
) {
  const editorParts = hashPasscode(editorToken);

  await executor.execute(
    `UPDATE trip_access_controls
     SET editor_session_salt = ?, editor_session_hash = ?, editor_session_expires_at = ?
     WHERE trip_id = ?`,
    [editorParts.salt, editorParts.hash, toMysqlDateTime(editorExpiresAt), tripId]
  );
}

async function createEditorSessionForActiveTrip(
  executor: MysqlPool | MysqlConnection = getAppPool()
): Promise<TripEditorSessionResult> {
  const editorToken = generateAccessToken();
  const editorExpiresAt = new Date(Date.now() + editorSessionDurationMs);
  await storeEditorSession(executor, activeTripId, editorToken, editorExpiresAt);

  return {
    editorToken,
    editorExpiresAt: editorExpiresAt.toISOString()
  };
}

export async function getActiveTripAccessStatus(
  shareToken = "",
  editorToken = ""
): Promise<TripAccessStatus> {
  await ensureSharedDataStore();

  const [row, travelers] = await Promise.all([
    getActiveTripAccessRow(),
    listTripTravelersForBusinessData()
  ]);

  if (!row) {
    return {
      configured: false,
      authorized: false,
      mode: null,
      editorExpiresAt: null,
      recoveryTokenAvailable: false,
      travelers
    };
  }

  const authorized = rowHasValidShareToken(row, shareToken);
  const editorAuthorized = authorized && rowHasValidEditorSession(row, editorToken);

  return {
    configured: true,
    authorized,
    mode: authorized ? (editorAuthorized ? "editor" : "viewer") : null,
    editorExpiresAt: editorAuthorized ? mapEditorExpiresAt(row.editor_session_expires_at) : null,
    recoveryTokenAvailable: !row.owner_recovery_token_used_at,
    travelers
  };
}

export async function setupActiveTripAccess(rawEditPasscode: unknown): Promise<TripAccessSetupResult> {
  await ensureSharedDataStore();
  const editPasscode = normalizeSecret(rawEditPasscode, "Edit passcode", 6);
  const shareToken = generateAccessToken();
  const ownerRecoveryToken = generateAccessToken();
  const shareParts = hashPasscode(shareToken);
  const editParts = hashPasscode(editPasscode);
  const recoveryParts = hashPasscode(ownerRecoveryToken);
  const connection = await getAppPool().getConnection();

  try {
    await connection.beginTransaction();
    const existing = await getActiveTripAccessRow(connection);

    if (existing) {
      throw new Error("Trip access has already been configured.");
    }

    await connection.execute(
      `INSERT INTO trip_access_controls
        (trip_id, share_token_salt, share_token_hash, edit_passcode_salt, edit_passcode_hash,
         owner_recovery_token_salt, owner_recovery_token_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        activeTripId,
        shareParts.salt,
        shareParts.hash,
        editParts.salt,
        editParts.hash,
        recoveryParts.salt,
        recoveryParts.hash
      ]
    );
    const editorSession = await createEditorSessionForActiveTrip(connection);
    await connection.commit();

    return {
      shareToken,
      ownerRecoveryToken,
      ...editorSession,
      travelers: await listTripTravelersForBusinessData()
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function verifyActiveTripShareToken(shareToken: string) {
  await ensureSharedDataStore();
  const row = await getActiveTripAccessRow();
  return Boolean(row && rowHasValidShareToken(row, shareToken));
}

export async function verifyActiveTripEditorToken(shareToken: string, editorToken: string) {
  await ensureSharedDataStore();
  const row = await getActiveTripAccessRow();
  return Boolean(row && rowHasValidShareToken(row, shareToken) && rowHasValidEditorSession(row, editorToken));
}

export async function createActiveTripEditorSession(
  shareToken: string,
  rawEditPasscode: unknown
): Promise<TripEditorSessionResult> {
  await ensureSharedDataStore();
  const editPasscode = normalizeSecret(rawEditPasscode, "Edit passcode", 1);
  const row = await getActiveTripAccessRow();

  if (!row || !rowHasValidShareToken(row, shareToken)) {
    throw new Error("Private trip link is invalid.");
  }

  const passcodeSalt = nullableString(row.edit_passcode_salt);
  const passcodeHash = nullableString(row.edit_passcode_hash);

  if (!passcodeSalt || !passcodeHash || !verifyPasscode(editPasscode, passcodeSalt, passcodeHash)) {
    throw new Error("Edit passcode is invalid.");
  }

  return createEditorSessionForActiveTrip();
}

export async function recoverActiveTripEditorAccess(
  shareToken: string,
  rawOwnerRecoveryToken: unknown,
  rawEditPasscode: unknown
): Promise<TripEditorSessionResult> {
  await ensureSharedDataStore();
  const ownerRecoveryToken = normalizeSecret(rawOwnerRecoveryToken, "Owner recovery token", 1);
  const editPasscode = normalizeSecret(rawEditPasscode, "New edit passcode", 6);
  const editParts = hashPasscode(editPasscode);
  const connection = await getAppPool().getConnection();

  try {
    await connection.beginTransaction();
    const row = await getActiveTripAccessRow(connection);

    if (!row || !rowHasValidShareToken(row, shareToken)) {
      throw new Error("Private trip link is invalid.");
    }

    if (row.owner_recovery_token_used_at) {
      throw new Error("Owner recovery token has already been used.");
    }

    const recoverySalt = nullableString(row.owner_recovery_token_salt);
    const recoveryHash = nullableString(row.owner_recovery_token_hash);

    if (
      !recoverySalt ||
      !recoveryHash ||
      !verifyPasscode(ownerRecoveryToken, recoverySalt, recoveryHash)
    ) {
      throw new Error("Owner recovery token is invalid.");
    }

    await connection.execute(
      `UPDATE trip_access_controls
       SET edit_passcode_salt = ?, edit_passcode_hash = ?, owner_recovery_token_used_at = CURRENT_TIMESTAMP
       WHERE trip_id = ?`,
      [editParts.salt, editParts.hash, activeTripId]
    );
    const editorSession = await createEditorSessionForActiveTrip(connection);
    await connection.commit();
    return editorSession;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function rotateActiveTripOwnerRecoveryToken() {
  await ensureSharedDataStore();
  const ownerRecoveryToken = generateAccessToken();
  const recoveryParts = hashPasscode(ownerRecoveryToken);

  await getAppPool().execute(
    `UPDATE trip_access_controls
     SET owner_recovery_token_salt = ?, owner_recovery_token_hash = ?, owner_recovery_token_used_at = NULL
     WHERE trip_id = ?`,
    [recoveryParts.salt, recoveryParts.hash, activeTripId]
  );

  return ownerRecoveryToken;
}

export async function validateDocumentInput(input: Partial<DocumentInput>) {
  const tripTravelers = await listTripTravelersForBusinessData();
  const title = String(input.title ?? "").trim();
  const category = input.category;
  const priority = input.priority;
  const status = input.status;
  const hasExternalUrlInput = Object.prototype.hasOwnProperty.call(input, "externalUrl");
  const externalUrl = hasExternalUrlInput ? normalizeExternalUrl(input.externalUrl) : undefined;
  const requiresPasscode = Boolean(input.requiresPasscode);
  const passcode = String(input.passcode ?? "").trim();
  const notes = String(input.notes ?? "").trim();
  const rawSortOrder = input.sortOrder as number | string | null | undefined;
  const sortOrder =
    rawSortOrder === null || rawSortOrder === undefined || rawSortOrder === ""
      ? 0
      : Number(rawSortOrder);

  if (!title) {
    throw new Error("Document title is required.");
  }

  if (!category || !(documentCategories as readonly string[]).includes(category)) {
    throw new Error("Document category is invalid.");
  }

  if (!priority || !(documentPriorities as readonly string[]).includes(priority)) {
    throw new Error("Document priority is invalid.");
  }

  if (!status || !(documentStatuses as readonly string[]).includes(status)) {
    throw new Error("Document status is invalid.");
  }

  if (!Number.isInteger(sortOrder)) {
    throw new Error("Sort order must be a whole number.");
  }

  return {
    title,
    category,
    priority,
    status,
    externalUrl,
    requiresPasscode,
    passcode,
    notes: notes || null,
    sortOrder,
    statuses: normalizeDocumentStatuses(input.statuses, tripTravelers)
  };
}

export async function listReminders() {
  await ensureSharedDataStore();
  const [rows] = await getAppPool().execute<DbRow[]>("SELECT * FROM reminders");
  return sortReminders(rows.map(mapReminder));
}

export async function createReminder(input: ReminderInput) {
  await ensureSharedDataStore();
  const id = randomUUID();
  await getAppPool().execute(
    "INSERT INTO reminders (id, text, priority, created_by) VALUES (?, ?, ?, ?)",
    [id, input.text, input.priority, input.createdBy]
  );
  return id;
}

export async function updateReminder(id: string, input: ReminderInput) {
  await ensureSharedDataStore();
  await getAppPool().execute(
    "UPDATE reminders SET text = ?, priority = ?, created_by = ? WHERE id = ?",
    [input.text, input.priority, input.createdBy, id]
  );
}

export async function deleteReminder(id: string) {
  await ensureSharedDataStore();
  await getAppPool().execute("DELETE FROM reminders WHERE id = ?", [id]);
}

export async function listBookings() {
  await ensureSharedDataStore();
  const [rows] = await getAppPool().execute<DbRow[]>(
    "SELECT * FROM booking_items ORDER BY booking_date ASC, created_at DESC"
  );
  return rows.map(mapBooking);
}

function bookingCategoryToExpenseCategory(category: SharedBooking["category"]): ExpenseCategory {
  switch (category) {
    case "Flight":
      return "Flight";
    case "Hotel":
      return "Accommodation";
    case "Train":
      return "Transport";
    case "Attraction":
      return "Attraction";
    case "Restaurant":
      return "Food";
    case "Insurance":
      return "Insurance";
    default:
      return "Other";
  }
}

function findTravelerByDisplayName(bookedBy: string, travelers: TripTraveler[]) {
  const normalizedBookedBy = bookedBy.trim().toLowerCase();

  return travelers.find((traveler) => {
    const names = [traveler.id, traveler.name, traveler.displayName].map((name) => name.trim().toLowerCase());
    return names.includes(normalizedBookedBy);
  });
}

async function getExpenseSplitTravelerIds(executor: MysqlConnection | MysqlPool, expenseId: string) {
  const [splitRows] = await executor.execute<DbRow[]>(
    "SELECT traveler_id FROM expense_splits WHERE expense_id = ? ORDER BY created_at ASC, traveler_id ASC",
    [expenseId]
  );

  return splitRows.map((row) => asString(row.traveler_id));
}

async function syncBookingBudgetExpense(
  executor: MysqlConnection | MysqlPool,
  bookingId: string,
  input: BookingInput,
  options: { preserveExistingBudgetFields?: boolean } = {}
) {
  const [existingExpenseRows] = await executor.execute<DbRow[]>(
    "SELECT * FROM expenses WHERE source_type = 'booking' AND source_id = ? ORDER BY created_at ASC, id ASC",
    [bookingId]
  );
  const primaryExpense = existingExpenseRows[0];

  if (!input.amount || input.amount <= 0 || !input.currency) {
    await executor.execute("DELETE FROM expenses WHERE source_type = 'booking' AND source_id = ?", [bookingId]);
    return;
  }

  const tripTravelers = await listTripTravelersForBusinessData();
  const fallbackTravelers = tripTravelers.filter((traveler) => traveler.isActive);
  const eligibleTravelers = fallbackTravelers.length > 0 ? fallbackTravelers : tripTravelers;
  const allowedTravelerIds = new Set(tripTravelers.map((traveler) => traveler.id));
  const matchedBookedByTraveler = findTravelerByDisplayName(input.bookedBy, eligibleTravelers);
  const existingSplitTravelerIds = primaryExpense
    ? (await getExpenseSplitTravelerIds(executor, asString(primaryExpense.id))).filter((travelerId) =>
        allowedTravelerIds.has(travelerId)
      )
    : [];
  const providedSplitTravelerIds = input.budgetSplitTravelerIds;
  const paidByTravelerId =
    input.budgetPaidByTravelerId && allowedTravelerIds.has(input.budgetPaidByTravelerId)
      ? input.budgetPaidByTravelerId
      : options.preserveExistingBudgetFields &&
          primaryExpense &&
          allowedTravelerIds.has(asString(primaryExpense.paid_by_traveler_id))
        ? asString(primaryExpense.paid_by_traveler_id)
        : matchedBookedByTraveler?.id ?? eligibleTravelers[0]?.id;
  const splitTravelerIds =
    providedSplitTravelerIds === undefined
      ? options.preserveExistingBudgetFields && existingSplitTravelerIds.length > 0
        ? existingSplitTravelerIds
        : eligibleTravelers.map((traveler) => traveler.id)
      : providedSplitTravelerIds;

  if (!paidByTravelerId) {
    throw new Error("Paid by traveler is required for booking budget sync.");
  }

  if (splitTravelerIds.length === 0) {
    throw new Error("Select at least one traveler to split this booking cost.");
  }

  for (const travelerId of splitTravelerIds) {
    assertTravelerId(travelerId, allowedTravelerIds, "Split traveler");
  }

  const expenseId = primaryExpense ? asString(primaryExpense.id) : randomUUID();
  const settled =
    input.budgetSettled ??
    (options.preserveExistingBudgetFields && primaryExpense ? asBoolean(primaryExpense.settled) : false);

  if (primaryExpense) {
    await executor.execute(
      `UPDATE expenses
       SET title = ?, category = ?, amount = ?, currency = ?,
           paid_by_traveler_id = ?, settled = ?, expense_date = ?, notes = ?
       WHERE id = ?`,
      [
        input.description,
        bookingCategoryToExpenseCategory(input.category),
        input.amount,
        input.currency,
        paidByTravelerId,
        settled ? 1 : 0,
        input.date,
        input.notes || null,
        expenseId
      ]
    );
    await executor.execute("DELETE FROM expenses WHERE source_type = 'booking' AND source_id = ? AND id <> ?", [
      bookingId,
      expenseId
    ]);
    await executor.execute("DELETE FROM expense_splits WHERE expense_id = ?", [expenseId]);
  } else {
    await executor.execute(
      `INSERT INTO expenses
        (id, source_type, source_id, title, category, amount, currency,
         paid_by_traveler_id, settled, expense_date, notes)
       VALUES (?, 'booking', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expenseId,
        bookingId,
        input.description,
        bookingCategoryToExpenseCategory(input.category),
        input.amount,
        input.currency,
        paidByTravelerId,
        settled ? 1 : 0,
        input.date,
        input.notes || null
      ]
    );
  }

  await insertExpenseSplits(executor, expenseId, splitTravelerIds);
}

export async function createBooking(input: BookingInput) {
  await ensureSharedDataStore();
  const id = randomUUID();
  const connection = await getAppPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO booking_items
        (id, category, description, booking_date, location, booked_by, amount, currency, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.category,
        input.description,
        input.date,
        input.location || null,
        input.bookedBy,
        input.amount ?? null,
        input.currency ?? null,
        input.notes || null,
        input.status
      ]
    );
    await syncBookingBudgetExpense(connection, id, input);
    await connection.commit();
    return id;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateBooking(id: string, input: BookingInput) {
  await ensureSharedDataStore();
  const connection = await getAppPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE booking_items
       SET category = ?, description = ?, booking_date = ?, location = ?, booked_by = ?,
           amount = ?, currency = ?, notes = ?, status = ?
       WHERE id = ?`,
      [
        input.category,
        input.description,
        input.date,
        input.location || null,
        input.bookedBy,
        input.amount ?? null,
        input.currency ?? null,
        input.notes || null,
        input.status,
        id
      ]
    );
    await syncBookingBudgetExpense(connection, id, input);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteBooking(id: string) {
  await ensureSharedDataStore();
  const connection = await getAppPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute("DELETE FROM expenses WHERE source_type = 'booking' AND source_id = ?", [id]);
    await connection.execute("DELETE FROM booking_items WHERE id = ?", [id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function listItineraryItems() {
  await ensureSharedDataStore();
  const [rows] = await getAppPool().execute<DbRow[]>(
    `SELECT * FROM itinerary_items
     ORDER BY travel_date ASC, start_time IS NULL ASC, start_time ASC, sort_order ASC, id ASC`
  );
  return rows.map(mapItineraryItem);
}

export async function createItineraryItem(input: ItineraryInput) {
  await ensureSharedDataStore();
  const id = randomUUID();
  await getAppPool().execute(
    `INSERT INTO itinerary_items
      (id, travel_date, city, start_time, end_time, title, location, details,
       transport, meal, cost_amount, currency, notes, map_query, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.travelDate,
      input.city,
      input.startTime || null,
      input.endTime || null,
      input.title,
      input.location || null,
      input.details || null,
      input.transport || null,
      input.meal || null,
      input.costAmount ?? null,
      input.currency ?? "EUR",
      input.notes || null,
      input.mapQuery || null,
      input.sortOrder ?? 0
    ]
  );
  return id;
}

export async function updateItineraryItem(id: string, input: ItineraryInput) {
  await ensureSharedDataStore();
  await getAppPool().execute(
    `UPDATE itinerary_items
     SET travel_date = ?, city = ?, start_time = ?, end_time = ?, title = ?,
         location = ?, details = ?, transport = ?, meal = ?, cost_amount = ?,
         currency = ?, notes = ?, map_query = ?, sort_order = ?
     WHERE id = ?`,
    [
      input.travelDate,
      input.city,
      input.startTime || null,
      input.endTime || null,
      input.title,
      input.location || null,
      input.details || null,
      input.transport || null,
      input.meal || null,
      input.costAmount ?? null,
      input.currency ?? "EUR",
      input.notes || null,
      input.mapQuery || null,
      input.sortOrder ?? 0,
      id
    ]
  );
}

export async function deleteItineraryItem(id: string) {
  await ensureSharedDataStore();
  await getAppPool().execute("DELETE FROM itinerary_items WHERE id = ?", [id]);
}

function sortTravelerIds(travelerIds: string[], tripTravelers: TripTraveler[]) {
  const displayOrder = new Map(tripTravelers.map((traveler) => [traveler.id, traveler.displayOrder]));

  return travelerIds.slice().sort((a, b) => {
    const orderDiff = (displayOrder.get(a) ?? 999) - (displayOrder.get(b) ?? 999);
    return orderDiff !== 0 ? orderDiff : a.localeCompare(b);
  });
}

export async function listExpenses() {
  await ensureSharedDataStore();
  const tripTravelers = await listTripTravelersForBusinessData();
  const [expenseRows] = await getAppPool().execute<DbRow[]>(
    "SELECT * FROM expenses ORDER BY expense_date DESC, created_at DESC, id ASC"
  );
  const [splitRows] = await getAppPool().execute<DbRow[]>(
    "SELECT * FROM expense_splits ORDER BY created_at ASC, traveler_id ASC"
  );
  const splitsByExpense = new Map<string, string[]>();

  for (const row of splitRows) {
    const expenseId = asString(row.expense_id);
    const current = splitsByExpense.get(expenseId) ?? [];
    current.push(asString(row.traveler_id));
    splitsByExpense.set(expenseId, current);
  }

  return expenseRows.map((row) =>
    mapExpense(row, sortTravelerIds(splitsByExpense.get(asString(row.id)) ?? [], tripTravelers))
  );
}

async function insertExpenseSplits(
  executor: MysqlConnection | MysqlPool,
  expenseId: string,
  splitTravelerIds: string[]
) {
  for (const travelerId of splitTravelerIds) {
    await executor.execute(
      `INSERT INTO expense_splits
        (id, expense_id, traveler_id)
       VALUES (?, ?, ?)`,
      [randomUUID(), expenseId, travelerId]
    );
  }
}

export async function createExpense(input: ExpenseInput) {
  await ensureSharedDataStore();
  const id = randomUUID();
  const connection = await getAppPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO expenses
        (id, source_type, source_id, title, category, amount, currency,
         paid_by_traveler_id, settled, expense_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.sourceType,
        input.sourceId || null,
        input.title,
        input.category,
        input.amount,
        input.currency,
        input.paidByTravelerId,
        input.settled ? 1 : 0,
        input.expenseDate,
        input.notes || null
      ]
    );
    await insertExpenseSplits(connection, id, input.splitTravelerIds);
    await connection.commit();
    return id;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateExpense(id: string, input: ExpenseInput) {
  await ensureSharedDataStore();
  const connection = await getAppPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE expenses
       SET source_type = ?, source_id = ?, title = ?, category = ?, amount = ?,
           currency = ?, paid_by_traveler_id = ?, settled = ?, expense_date = ?, notes = ?
       WHERE id = ?`,
      [
        input.sourceType,
        input.sourceId || null,
        input.title,
        input.category,
        input.amount,
        input.currency,
        input.paidByTravelerId,
        input.settled ? 1 : 0,
        input.expenseDate,
        input.notes || null,
        id
      ]
    );
    await connection.execute("DELETE FROM expense_splits WHERE expense_id = ?", [id]);
    await insertExpenseSplits(connection, id, input.splitTravelerIds);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteExpense(id: string) {
  await ensureSharedDataStore();
  await getAppPool().execute("DELETE FROM expenses WHERE id = ?", [id]);
}

export async function listPackingItems() {
  await ensureSharedDataStore();
  const tripTravelers = await listTripTravelersForBusinessData();
  const [itemRows] = await getAppPool().execute<DbRow[]>(
    "SELECT * FROM packing_items ORDER BY sort_order ASC, category ASC, name ASC, id ASC"
  );
  const [statusRows] = await getAppPool().execute<DbRow[]>(
    "SELECT * FROM packing_item_traveler_statuses ORDER BY traveler_id ASC"
  );
  const statusesByItem = new Map<string, SharedPackingItem["statuses"]>();

  for (const row of statusRows) {
    const itemId = asString(row.item_id);
    const existing = statusesByItem.get(itemId) ?? [];
    existing.push(mapPackingStatus(row));
    statusesByItem.set(itemId, existing);
  }

  return itemRows.map((row) => {
    const itemStatuses = statusesByItem.get(asString(row.id)) ?? [];
    const statusesByTraveler = new Map(itemStatuses.map((status) => [status.travelerId, status]));
    const orderedStatuses = tripTravelers
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .filter((traveler) => traveler.isActive || statusesByTraveler.has(traveler.id))
      .map((traveler) => statusesByTraveler.get(traveler.id) ?? {
        travelerId: traveler.id,
        status: "required" as PackingTravelerStatus,
        updatedAt: null
      });

    return mapPackingItem(row, orderedStatuses);
  });
}

async function insertPackingStatuses(
  executor: MysqlConnection,
  itemId: string,
  statuses: PackingInput["statuses"]
) {
  for (const status of statuses) {
    await executor.execute(
      `INSERT INTO packing_item_traveler_statuses
        (id, item_id, traveler_id, status)
       VALUES (?, ?, ?, ?)`,
      [randomUUID(), itemId, status.travelerId, status.status]
    );
  }
}

export async function createPackingItem(input: PackingInput) {
  await ensureSharedDataStore();
  const id = randomUUID();
  const connection = await getAppPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO packing_items
        (id, name, category, priority, notes, quantity, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.category,
        input.priority,
        input.notes || null,
        input.quantity ?? null,
        input.sortOrder ?? 0
      ]
    );
    await insertPackingStatuses(connection, id, input.statuses);
    await connection.commit();
    return id;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updatePackingItem(id: string, input: PackingInput) {
  await ensureSharedDataStore();
  const connection = await getAppPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE packing_items
       SET name = ?, category = ?, priority = ?, notes = ?, quantity = ?, sort_order = ?
       WHERE id = ?`,
      [
        input.name,
        input.category,
        input.priority,
        input.notes || null,
        input.quantity ?? null,
        input.sortOrder ?? 0,
        id
      ]
    );
    await connection.execute("DELETE FROM packing_item_traveler_statuses WHERE item_id = ?", [id]);
    await insertPackingStatuses(connection, id, input.statuses);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deletePackingItem(id: string) {
  await ensureSharedDataStore();
  await getAppPool().execute("DELETE FROM packing_items WHERE id = ?", [id]);
}

export async function updatePackingTravelerStatus(
  itemId: string,
  travelerId: string,
  status: PackingTravelerStatus
) {
  await ensureSharedDataStore();

  if (!(packingTravelerStatuses as readonly string[]).includes(status)) {
    throw new Error("Packing traveler status is invalid.");
  }

  const travelers = await listTripTravelersForBusinessData();
  const traveler = travelers.find((currentTraveler) => currentTraveler.id === travelerId);

  if (!traveler || !traveler.isActive) {
    throw new Error("Traveler identity is invalid.");
  }

  const [itemRows] = await getAppPool().execute<DbRow[]>("SELECT id FROM packing_items WHERE id = ?", [itemId]);

  if (!itemRows[0]) {
    throw new Error("Packing item was not found.");
  }

  await getAppPool().execute(
    `INSERT INTO packing_item_traveler_statuses
      (id, item_id, traveler_id, status)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = CURRENT_TIMESTAMP`,
    [randomUUID(), itemId, travelerId, status]
  );
}

export async function listDocumentItems() {
  await ensureSharedDataStore();
  const tripTravelers = await listTripTravelersForBusinessData();
  const [itemRows] = await getAppPool().execute<DbRow[]>(
    "SELECT * FROM document_items ORDER BY sort_order ASC, category ASC, title ASC, id ASC"
  );
  const [statusRows] = await getAppPool().execute<DbRow[]>(
    "SELECT * FROM document_item_traveler_statuses ORDER BY traveler_id ASC"
  );
  const statusesByItem = new Map<string, SharedDocumentItem["statuses"]>();

  for (const row of statusRows) {
    const itemId = asString(row.item_id);
    const existing = statusesByItem.get(itemId) ?? [];
    existing.push(mapDocumentStatus(row));
    statusesByItem.set(itemId, existing);
  }

  return itemRows.map((row) => {
    const itemStatuses = statusesByItem.get(asString(row.id)) ?? [];
    const statusesByTraveler = new Map(itemStatuses.map((status) => [status.travelerId, status]));
    const orderedStatuses = tripTravelers
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .filter((traveler) => traveler.isActive || statusesByTraveler.has(traveler.id))
      .map((traveler) => statusesByTraveler.get(traveler.id) ?? {
        travelerId: traveler.id,
        status: "required" as DocumentTravelerStatus,
        updatedAt: null
      });

    return mapDocumentItem(row, orderedStatuses);
  });
}

async function insertDocumentStatuses(
  executor: MysqlConnection,
  itemId: string,
  statuses: DocumentInput["statuses"]
) {
  for (const status of statuses) {
    await executor.execute(
      `INSERT INTO document_item_traveler_statuses
        (id, item_id, traveler_id, status)
       VALUES (?, ?, ?, ?)`,
      [randomUUID(), itemId, status.travelerId, status.status]
    );
  }
}

export async function createDocumentItem(input: DocumentInput) {
  await ensureSharedDataStore();
  const id = randomUUID();
  const passcodeParts = input.requiresPasscode
    ? input.passcode
      ? hashPasscode(input.passcode)
      : null
    : null;

  if (input.requiresPasscode && !passcodeParts) {
    throw new Error("Passcode is required for protected document links.");
  }

  const connection = await getAppPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO document_items
        (id, title, category, priority, status, external_url, requires_passcode,
         passcode_salt, passcode_hash, notes, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.title,
        input.category,
        input.priority,
        input.status,
        input.externalUrl || null,
        input.requiresPasscode ? 1 : 0,
        passcodeParts?.salt ?? null,
        passcodeParts?.hash ?? null,
        input.notes || null,
        input.sortOrder ?? 0
      ]
    );
    await insertDocumentStatuses(connection, id, input.statuses);
    await connection.commit();
    return id;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateDocumentItem(id: string, input: DocumentInput) {
  await ensureSharedDataStore();
  const [rows] = await getAppPool().execute<DbRow[]>(
    "SELECT external_url, passcode_salt, passcode_hash FROM document_items WHERE id = ?",
    [id]
  );
  const existing = rows[0];

  if (!existing) {
    throw new Error("Document item was not found.");
  }

  let passcodeSalt: string | null = null;
  let passcodeHash: string | null = null;
  const externalUrl =
    input.externalUrl === undefined ? nullableString(existing.external_url) : input.externalUrl;

  if (input.requiresPasscode) {
    if (input.passcode) {
      const passcodeParts = hashPasscode(input.passcode);
      passcodeSalt = passcodeParts.salt;
      passcodeHash = passcodeParts.hash;
    } else {
      passcodeSalt = nullableString(existing.passcode_salt);
      passcodeHash = nullableString(existing.passcode_hash);
    }

    if (!passcodeSalt || !passcodeHash) {
      throw new Error("Passcode is required for protected document links.");
    }
  }

  const connection = await getAppPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE document_items
       SET title = ?, category = ?, priority = ?, status = ?, external_url = ?,
           requires_passcode = ?, passcode_salt = ?, passcode_hash = ?,
           notes = ?, sort_order = ?
       WHERE id = ?`,
      [
        input.title,
        input.category,
        input.priority,
        input.status,
        externalUrl || null,
        input.requiresPasscode ? 1 : 0,
        passcodeSalt,
        passcodeHash,
        input.notes || null,
        input.sortOrder ?? 0,
        id
      ]
    );
    await connection.execute("DELETE FROM document_item_traveler_statuses WHERE item_id = ?", [id]);
    await insertDocumentStatuses(connection, id, input.statuses);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteDocumentItem(id: string) {
  await ensureSharedDataStore();
  await getAppPool().execute("DELETE FROM document_items WHERE id = ?", [id]);
}

export async function updateDocumentTravelerStatus(
  itemId: string,
  travelerId: string,
  status: DocumentTravelerStatus
) {
  await ensureSharedDataStore();

  if (!(documentTravelerStatuses as readonly string[]).includes(status)) {
    throw new Error("Document traveler status is invalid.");
  }

  const travelers = await listTripTravelersForBusinessData();
  const traveler = travelers.find((currentTraveler) => currentTraveler.id === travelerId);

  if (!traveler || !traveler.isActive) {
    throw new Error("Traveler identity is invalid.");
  }

  const [itemRows] = await getAppPool().execute<DbRow[]>("SELECT id FROM document_items WHERE id = ?", [itemId]);

  if (!itemRows[0]) {
    throw new Error("Document item was not found.");
  }

  await getAppPool().execute(
    `INSERT INTO document_item_traveler_statuses
      (id, item_id, traveler_id, status)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = CURRENT_TIMESTAMP`,
    [randomUUID(), itemId, travelerId, status]
  );
}

export async function unlockDocumentItem(id: string, passcode: string) {
  await ensureSharedDataStore();
  const trimmedPasscode = passcode.trim();

  if (!trimmedPasscode) {
    throw new Error("Passcode is required.");
  }

  const [rows] = await getAppPool().execute<DbRow[]>(
    `SELECT external_url, requires_passcode, passcode_salt, passcode_hash
     FROM document_items
     WHERE id = ?`,
    [id]
  );
  const row = rows[0];

  if (!row || !asBoolean(row.requires_passcode)) {
    throw new Error("Protected document link was not found.");
  }

  const externalUrl = nullableString(row.external_url);
  const salt = nullableString(row.passcode_salt);
  const hash = nullableString(row.passcode_hash);

  if (!externalUrl || !salt || !hash || !verifyPasscode(trimmedPasscode, salt, hash)) {
    return null;
  }

  return externalUrl;
}
