import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { bookings, documentLinks, expenses, itinerary, packingItems, travelers, tripInfo } from "@/data/tripData";
import {
  bookingCategories,
  bookingCurrencies,
  bookingStatuses,
  buildDefaultPackingStatuses,
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
  type ExpenseInput,
  type PackingCategory,
  type PackingInput,
  type PackingTravelerStatus,
  type SharedItineraryItem,
  type SharedDocumentItem,
  type SharedExpense,
  type SharedPackingItem,
  type ReminderInput,
  type SharedBooking,
  type SharedReminder
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

type MysqlModule = {
  createPool(config: Record<string, unknown>): MysqlPool;
};

let serverPool: MysqlPool | null = null;
let appPool: MysqlPool | null = null;
let initialized = false;

const priorityRank: Record<string, number> = {
  High: 1,
  Medium: 2,
  Low: 3
};

function getMysql(): MysqlModule {
  try {
    const requireFunc = eval("require") as NodeRequire;
    return requireFunc("mysql2/promise") as MysqlModule;
  } catch {
    throw new Error("mysql2 is not installed. Run `npm install` or `corepack pnpm install` before using shared data APIs.");
  }
}

function getDbName() {
  return process.env.MYSQL_DATABASE || "italy_trip_2026";
}

function assertSafeIdentifier(value: string) {
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error("MYSQL_DATABASE may only contain letters, numbers, and underscores.");
  }
}

function baseConfig() {
  return {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    waitForConnections: true,
    connectionLimit: 5,
    namedPlaceholders: false
  };
}

function getServerPool() {
  if (!serverPool) {
    serverPool = getMysql().createPool(baseConfig());
  }

  return serverPool;
}

function getAppPool() {
  if (!appPool) {
    appPool = getMysql().createPool({
      ...baseConfig(),
      database: getDbName()
    });
  }

  return appPool;
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
      currency enum('EUR', 'SGD', 'MYR') DEFAULT NULL,
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
      currency enum('EUR', 'SGD', 'MYR') NOT NULL DEFAULT 'EUR',
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
      currency enum('EUR', 'SGD', 'MYR') NOT NULL,
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

  await pool.execute("ALTER TABLE booking_items MODIFY currency enum('EUR', 'SGD', 'MYR') DEFAULT NULL");
  await pool.execute("ALTER TABLE itinerary_items MODIFY currency enum('EUR', 'SGD', 'MYR') NOT NULL DEFAULT 'EUR'");
  await pool.execute("ALTER TABLE expenses MODIFY currency enum('EUR', 'SGD', 'MYR') NOT NULL");
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

async function seedTables() {
  const pool = getAppPool();
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
  if (initialized) {
    return;
  }

  await ensureDatabase();
  await createTables();
  await updateCurrencyEnums();
  await seedTables();
  initialized = true;
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
    status
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

function assertTravelerId(value: string, fieldLabel: string) {
  if (!travelers.some((traveler) => traveler.id === value)) {
    throw new Error(`${fieldLabel} is invalid.`);
  }
}

export function validateExpenseInput(input: Partial<ExpenseInput>) {
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

  assertTravelerId(paidByTravelerId, "Paid by traveler");

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
    assertTravelerId(travelerId, "Split traveler");
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
  inputStatuses: PackingInput["statuses"] | undefined
) {
  const allowedTravelerIds = new Set(travelers.map((traveler) => traveler.id));
  const defaultStatuses = new Map(
    buildDefaultPackingStatuses(category).map((status) => [status.travelerId, status.status])
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

  return travelers
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((traveler) => ({
      travelerId: traveler.id,
      status: defaultStatuses.get(traveler.id) ?? "required"
    }));
}

export function validatePackingInput(input: Partial<PackingInput>) {
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
    statuses: normalizePackingStatuses(category, input.statuses)
  };
}

function normalizeDocumentStatuses(inputStatuses: DocumentInput["statuses"] | undefined) {
  const allowedTravelerIds = new Set(travelers.map((traveler) => traveler.id));
  const statusesByTraveler = new Map<string, DocumentTravelerStatus>(
    travelers.map((traveler) => [traveler.id, "required"])
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

  return travelers
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
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

export function validateDocumentInput(input: Partial<DocumentInput>) {
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
    statuses: normalizeDocumentStatuses(input.statuses)
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

export async function createBooking(input: BookingInput) {
  await ensureSharedDataStore();
  const id = randomUUID();
  await getAppPool().execute(
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
  return id;
}

export async function updateBooking(id: string, input: BookingInput) {
  await ensureSharedDataStore();
  await getAppPool().execute(
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
}

export async function deleteBooking(id: string) {
  await ensureSharedDataStore();
  await getAppPool().execute("DELETE FROM booking_items WHERE id = ?", [id]);
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

function sortTravelerIds(travelerIds: string[]) {
  const displayOrder = new Map(travelers.map((traveler) => [traveler.id, traveler.displayOrder]));

  return travelerIds.slice().sort((a, b) => {
    const orderDiff = (displayOrder.get(a) ?? 999) - (displayOrder.get(b) ?? 999);
    return orderDiff !== 0 ? orderDiff : a.localeCompare(b);
  });
}

export async function listExpenses() {
  await ensureSharedDataStore();
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
    mapExpense(row, sortTravelerIds(splitsByExpense.get(asString(row.id)) ?? []))
  );
}

async function insertExpenseSplits(
  executor: MysqlConnection,
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
    const orderedStatuses = travelers
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
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

export async function listDocumentItems() {
  await ensureSharedDataStore();
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
    const orderedStatuses = travelers
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
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
