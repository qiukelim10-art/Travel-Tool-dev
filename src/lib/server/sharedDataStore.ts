import { randomUUID } from "crypto";
import { bookings, tripInfo } from "@/data/tripData";
import {
  bookingCategories,
  bookingCurrencies,
  bookingStatuses,
  reminderPriorities,
  type BookingInput,
  type ReminderInput,
  type SharedBooking,
  type SharedReminder
} from "@/lib/sharedDataTypes";

type DbRow = Record<string, unknown>;

type MysqlPool = {
  execute<T = DbRow[]>(sql: string, values?: unknown[]): Promise<[T, unknown]>;
  end(): Promise<void>;
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
    return value.toISOString().slice(0, 10);
  }

  return String(value ?? "");
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
      currency enum('EUR', 'SGD') DEFAULT NULL,
      notes text,
      status enum('Not Booked', 'Pending', 'Booked', 'Paid', 'Cancelled', 'Need Confirmation') NOT NULL DEFAULT 'Pending',
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_booking_items_filters (category, status, booked_by, booking_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
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
}

export async function ensureSharedDataStore() {
  if (initialized) {
    return;
  }

  await ensureDatabase();
  await createTables();
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
