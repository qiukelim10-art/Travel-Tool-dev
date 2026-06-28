"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { EmergencyQuickAccess } from "@/components/EmergencyQuickAccess";
import { useTripAccess } from "@/lib/access";
import { getDestinationVisualIdentity } from "@/lib/destinationVisuals";
import { useLanguage, type Language } from "@/lib/i18n";
import type {
  ReminderInput,
  ReminderPriority,
  SharedBooking,
  SharedDocumentItem,
  SharedExpense,
  SharedItineraryItem,
  SharedReminder
} from "@/lib/sharedDataTypes";
import { useTripSettingsView, type TripSettingsRouteStopView, type TripSettingsView } from "@/lib/useTripSettings";

const destinationImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA73oKwav7wqr2-QdGzU4FCTO_3e_EFxaDRy4eVmLmzuVr79UCTV5f03drhT8Ye3fkPbk9GeajlszwevFesXaIw6R3RcwAqi8ze8b8zBCcxXFASjyFKYGQapw7xZxdwYSth-UbTggS6UN-80U-5jopSvAN7qwGUN-oabqJMqQGVJspgC3QI8sc8fPbNejBWQLx7FWIeitHLWEFuf8EitcbpLkZeSjvQ2iW2UcLv9Vwdj2HAUaH65vR0BCeGNK1hTeS_vF1DUGvotTbg";
const itineraryRequestTimeoutMs = 12000;
const tripShareTokenHeader = "x-trip-share-token";

type ItineraryApiResponse = {
  itineraryItems?: SharedItineraryItem[];
  error?: string;
};

type BookingsApiResponse = {
  bookings?: SharedBooking[];
  error?: string;
};

type RemindersApiResponse = {
  reminders?: SharedReminder[];
  error?: string;
};

type ExpensesApiResponse = {
  expenses?: SharedExpense[];
  error?: string;
};

type DocumentsApiResponse = {
  documents?: SharedDocumentItem[];
  error?: string;
};

type SosCountry = {
  code: string;
  name: string;
};

type RouteStopVisual = {
  alt: string;
  image: string;
};

const fallbackRouteStopVisual: RouteStopVisual = {
  alt: "Aegean Sea view from Santorini with whitewashed buildings and a blue dome.",
  image: destinationImage
};

const routeStopVisuals: Record<string, RouteStopVisual> = {
  athens: {
    alt: "The Acropolis and Parthenon above Athens.",
    image: "https://upload.wikimedia.org/wikipedia/commons/c/c6/Attica_06-13_Athens_50_View_from_Philopappos_-_Acropolis_Hill.jpg"
  },
  barcelona: {
    alt: "La Sagrada Familia in Barcelona.",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/74/Sagrada_Familia_March_2015-10a.jpg"
  },
  london: {
    alt: "Big Ben and the Elizabeth Tower in London.",
    image: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Big_Ben_Elizabeth_Tower_London_2023_01.jpg"
  },
  mykonos: {
    alt: "The windmills of Mykonos.",
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Windmills_of_Mykonos.jpg"
  },
  santorini: fallbackRouteStopVisual,
  vienna: {
    alt: "St. Stephen's Cathedral in Vienna.",
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Spire_Cathedral_St_Stephen_Vienna_Wien_Steffl_1.jpg"
  },
  wien: {
    alt: "St. Stephen's Cathedral in Vienna.",
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Spire_Cathedral_St_Stephen_Vienna_Wien_Steffl_1.jpg"
  }
};

const bookingStatusPriority: Record<SharedBooking["status"], number> = {
  "Not Booked": 0,
  "Need Confirmation": 1,
  Pending: 2,
  Booked: 3,
  Paid: 4,
  Cancelled: 5
};

const reminderPriorities: ReminderPriority[] = ["High", "Medium", "Low"];

const todayCopy = {
  en: {
    workspace: "Trip Workspace",
    sanctuary: "Private Sanctuary",
    languageLabel: "Switch to Chinese",
    sosLabel: "Open SOS",
    addLabel: "Add Item",
    tripSummaryLabel: "Trip summary",
    navLabel: "Workspace navigation",
    sidePanelLabel: "Trip side panel",
    mobileNavLabel: "Mobile navigation",
    home: "Home",
    plan: "Plan",
    book: "Book",
    money: "Money",
    documents: "Documents",
    today: "Today",
    more: "More",
    nextUp: "Next Up",
    viewItinerary: "View Itinerary",
    nextUpLoading: "Loading next itinerary",
    nextUpEmpty: "No upcoming itinerary yet",
    nextUpError: "Unable to load itinerary",
    flexibleTime: "Flexible time",
    openItineraryPrompt: "Open itinerary to review or add items",
    needsAttention: "Needs Attention",
    viewAll: "View All",
    bookingsLoading: "Loading bookings",
    bookingsEmpty: "No bookings yet",
    bookingsError: "Unable to load bookings",
    reminders: "Reminders",
    reminderLoading: "Loading reminders",
    reminderEmpty: "No reminders yet",
    reminderError: "Unable to load reminders",
    addReminder: "Add",
    editReminder: "Edit",
    saveReminder: "Save",
    savingReminder: "Saving",
    cancel: "Cancel",
    reminderPlaceholder: "New reminder",
    reminderRequired: "Reminder text is required.",
    tripMembers: "Trip Members",
    notBooked: "Not Booked",
    pending: "Pending",
    booked: "Booked",
    paid: "Paid",
    cancelled: "Cancelled",
    needConfirmation: "Need Confirmation",
    highPriority: "High",
    mediumPriority: "Medium",
    lowPriority: "Low",
    overdue: "Overdue",
    moneySummaryEmpty: "No expenses",
    moneySummaryError: "Unable to load",
    moneySummaryLoading: "Loading",
    moneySummaryOutstanding: "Open",
    documentsSummaryEmpty: "No documents",
    documentsSummaryError: "Unable to load",
    documentsSummaryLoading: "Loading",
    documentsSummaryReady: "Ready",
    documentsSummaryNeeded: "Need attention"
  },
  zh: {
    workspace: "行程工作区",
    sanctuary: "私人协作空间",
    languageLabel: "切换到英文",
    sosLabel: "打开 SOS",
    addLabel: "添加项目",
    tripSummaryLabel: "行程概览",
    navLabel: "工作区导航",
    sidePanelLabel: "行程侧栏",
    mobileNavLabel: "手机导航",
    home: "首页",
    plan: "计划",
    book: "预订",
    money: "预算",
    documents: "文件",
    today: "今日",
    more: "更多",
    nextUp: "下一项",
    viewItinerary: "查看行程",
    nextUpLoading: "正在加载下一项行程",
    nextUpEmpty: "暂无接下来的行程",
    nextUpError: "无法加载行程",
    flexibleTime: "时间待定",
    openItineraryPrompt: "打开行程页查看或添加项目",
    needsAttention: "需要处理",
    viewAll: "查看全部",
    bookingsLoading: "正在加载预订",
    bookingsEmpty: "暂无预订",
    bookingsError: "无法加载预订",
    reminders: "提醒事项",
    reminderLoading: "正在加载提醒",
    reminderEmpty: "暂无提醒",
    reminderError: "无法加载提醒",
    addReminder: "新增",
    editReminder: "编辑",
    saveReminder: "保存",
    savingReminder: "保存中",
    cancel: "取消",
    reminderPlaceholder: "新的提醒",
    reminderRequired: "请输入提醒内容。",
    tripMembers: "同行成员",
    notBooked: "未预订",
    pending: "待处理",
    booked: "已预订",
    paid: "已支付",
    cancelled: "已取消",
    needConfirmation: "需要确认",
    highPriority: "高",
    mediumPriority: "中",
    lowPriority: "低",
    overdue: "已逾期",
    moneySummaryEmpty: "暂无费用",
    moneySummaryError: "无法加载",
    moneySummaryLoading: "加载中",
    moneySummaryOutstanding: "未结清",
    documentsSummaryEmpty: "暂无文件",
    documentsSummaryError: "无法加载",
    documentsSummaryLoading: "加载中",
    documentsSummaryReady: "已就绪",
    documentsSummaryNeeded: "需处理"
  }
} as const satisfies Record<Language, Record<string, string>>;

export default function DashboardPage() {
  const { language, toggleLanguage } = useLanguage();
  const { mode, shareToken } = useTripAccess();
  const { trip } = useTripSettingsView();
  const canEdit = mode === "editor";
  const [itineraryItems, setItineraryItems] = useState<SharedItineraryItem[]>([]);
  const [itineraryLoading, setItineraryLoading] = useState(true);
  const [itineraryError, setItineraryError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<SharedBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [sharedReminders, setSharedReminders] = useState<SharedReminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [remindersError, setRemindersError] = useState<string | null>(null);
  const [reminderFormOpen, setReminderFormOpen] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [reminderForm, setReminderForm] = useState<ReminderInput>(() => emptyReminderForm("Today"));
  const [reminderSubmitting, setReminderSubmitting] = useState(false);
  const [reminderDeletingId, setReminderDeletingId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<SharedDocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const copy = todayCopy[language];
  const desktopNavItems = getDesktopNavItems(copy);
  const mobileNavItems = getMobileNavItems(copy);
  const defaultReminderCreatedBy = trip.activeTravelers[0]?.name ?? trip.travelerDisplayNames[0] ?? "Today";
  const tripDateRangeLabel = formatTripDateRange(
    trip.startDate,
    trip.endDate,
    trip.dateRangeLabel,
    language
  );
  const tripLocationLabel = trip.routeLabel || trip.destination;
  const tripSummaryDetail = [tripDateRangeLabel, tripLocationLabel].filter(Boolean).join(" - ");
  const activeRouteStop = selectActiveRouteStop(trip.routeStops);
  const destinationTitle = formatRouteStopTitle(activeRouteStop, tripLocationLabel);
  const destinationDateLabel = formatRouteStopDate(activeRouteStop, tripDateRangeLabel, language);
  const destinationVisual = getRouteStopVisual(activeRouteStop, destinationTitle);
  const sosCountries = useMemo(
    () => getSosCountries(trip, activeRouteStop),
    [activeRouteStop, trip]
  );
  const nextItineraryItem = useMemo(() => selectNextItineraryItem(itineraryItems), [itineraryItems]);
  const topBookings = useMemo(() => selectTopBookings(bookings), [bookings]);
  const topReminders = useMemo(() => selectTopReminders(sharedReminders), [sharedReminders]);
  const moneySummary = useMemo(
    () => getMoneySummary(expenses, expensesLoading, expensesError, copy),
    [copy, expenses, expensesError, expensesLoading]
  );
  const documentsSummary = useMemo(
    () => getDocumentsSummary(documents, documentsLoading, documentsError, copy),
    [copy, documents, documentsError, documentsLoading]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), itineraryRequestTimeoutMs);

    async function loadItinerary() {
      setItineraryLoading(true);
      setItineraryError(null);

      try {
        const response = await fetch("/api/itinerary", {
          cache: "no-store",
          headers: shareToken ? { [tripShareTokenHeader]: shareToken } : undefined,
          signal: controller.signal
        });
        const data = (await response.json()) as ItineraryApiResponse;

        if (!response.ok) {
          throw new Error(data.error ?? copy.nextUpError);
        }

        setItineraryItems(Array.isArray(data.itineraryItems) ? data.itineraryItems.filter(isSharedItineraryItem) : []);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          setItineraryError(`${copy.nextUpError}.`);
          return;
        }

        setItineraryError(loadError instanceof Error ? loadError.message : copy.nextUpError);
      } finally {
        window.clearTimeout(timeoutId);
        setItineraryLoading(false);
      }
    }

    void loadItinerary();

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [copy.nextUpError, shareToken]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), itineraryRequestTimeoutMs);

    async function loadBookings() {
      setBookingsLoading(true);
      setBookingsError(null);

      try {
        const response = await fetch("/api/bookings", {
          cache: "no-store",
          headers: shareToken ? { [tripShareTokenHeader]: shareToken } : undefined,
          signal: controller.signal
        });
        const data = (await response.json()) as BookingsApiResponse;

        if (!response.ok) {
          throw new Error(data.error ?? copy.bookingsError);
        }

        setBookings(Array.isArray(data.bookings) ? data.bookings.filter(isSharedBooking) : []);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          setBookingsError(`${copy.bookingsError}.`);
          return;
        }

        setBookingsError(loadError instanceof Error ? loadError.message : copy.bookingsError);
      } finally {
        window.clearTimeout(timeoutId);
        setBookingsLoading(false);
      }
    }

    void loadBookings();

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [copy.bookingsError, shareToken]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), itineraryRequestTimeoutMs);

    async function loadReminders() {
      setRemindersLoading(true);
      setRemindersError(null);

      try {
        const response = await fetch("/api/reminders", {
          cache: "no-store",
          headers: shareToken ? { [tripShareTokenHeader]: shareToken } : undefined,
          signal: controller.signal
        });
        const data = (await response.json()) as RemindersApiResponse;

        if (!response.ok) {
          throw new Error(data.error ?? copy.reminderError);
        }

        setSharedReminders(Array.isArray(data.reminders) ? data.reminders.filter(isSharedReminder) : []);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          setRemindersError(`${copy.reminderError}.`);
          return;
        }

        setRemindersError(loadError instanceof Error ? loadError.message : copy.reminderError);
      } finally {
        window.clearTimeout(timeoutId);
        setRemindersLoading(false);
      }
    }

    void loadReminders();

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [copy.reminderError, shareToken]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), itineraryRequestTimeoutMs);

    async function loadExpenses() {
      setExpensesLoading(true);
      setExpensesError(null);

      try {
        const response = await fetch("/api/expenses", {
          cache: "no-store",
          headers: shareToken ? { [tripShareTokenHeader]: shareToken } : undefined,
          signal: controller.signal
        });
        const data = (await response.json()) as ExpensesApiResponse;

        if (!response.ok) {
          throw new Error(data.error ?? copy.moneySummaryError);
        }

        setExpenses(Array.isArray(data.expenses) ? data.expenses.filter(isSharedExpense) : []);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          setExpensesError(copy.moneySummaryError);
          return;
        }

        setExpensesError(loadError instanceof Error ? loadError.message : copy.moneySummaryError);
      } finally {
        window.clearTimeout(timeoutId);
        setExpensesLoading(false);
      }
    }

    void loadExpenses();

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [copy.moneySummaryError, shareToken]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), itineraryRequestTimeoutMs);

    async function loadDocuments() {
      setDocumentsLoading(true);
      setDocumentsError(null);

      try {
        const response = await fetch("/api/documents", {
          cache: "no-store",
          headers: shareToken ? { [tripShareTokenHeader]: shareToken } : undefined,
          signal: controller.signal
        });
        const data = (await response.json()) as DocumentsApiResponse;

        if (!response.ok) {
          throw new Error(data.error ?? copy.documentsSummaryError);
        }

        setDocuments(Array.isArray(data.documents) ? data.documents.filter(isSharedDocumentItem) : []);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          setDocumentsError(copy.documentsSummaryError);
          return;
        }

        setDocumentsError(loadError instanceof Error ? loadError.message : copy.documentsSummaryError);
      } finally {
        window.clearTimeout(timeoutId);
        setDocumentsLoading(false);
      }
    }

    void loadDocuments();

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [copy.documentsSummaryError, shareToken]);

  function resetReminderForm() {
    setEditingReminderId(null);
    setReminderForm(emptyReminderForm(defaultReminderCreatedBy));
    setReminderFormOpen(false);
  }

  function openReminderForm() {
    setEditingReminderId(null);
    setReminderForm(emptyReminderForm(defaultReminderCreatedBy));
    setReminderFormOpen(true);
    setRemindersError(null);
  }

  function startEditingReminder(reminder: SharedReminder) {
    setEditingReminderId(reminder.id);
    setReminderForm({
      text: reminder.text,
      priority: reminder.priority,
      createdBy: reminder.createdBy || defaultReminderCreatedBy
    });
    setReminderFormOpen(true);
    setRemindersError(null);
  }

  async function submitReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit) {
      setRemindersError(copy.reminderError);
      return;
    }

    const input: ReminderInput = {
      ...reminderForm,
      text: reminderForm.text.trim(),
      createdBy: reminderForm.createdBy || defaultReminderCreatedBy
    };

    if (!input.text) {
      setRemindersError(copy.reminderRequired);
      return;
    }

    setReminderSubmitting(true);
    setRemindersError(null);

    try {
      const response = await fetch(editingReminderId ? `/api/reminders/${editingReminderId}` : "/api/reminders", {
        method: editingReminderId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(shareToken ? { [tripShareTokenHeader]: shareToken } : {})
        },
        body: JSON.stringify(input)
      });
      const data = (await response.json()) as RemindersApiResponse;

      if (!response.ok) {
        throw new Error(data.error ?? copy.reminderError);
      }

      setSharedReminders(Array.isArray(data.reminders) ? data.reminders.filter(isSharedReminder) : []);
      resetReminderForm();
    } catch (submitError) {
      setRemindersError(submitError instanceof Error ? submitError.message : copy.reminderError);
    } finally {
      setReminderSubmitting(false);
    }
  }

  async function completeReminder(reminder: SharedReminder) {
    if (!canEdit) {
      setRemindersError(copy.reminderError);
      return;
    }

    setReminderDeletingId(reminder.id);
    setRemindersError(null);

    try {
      const response = await fetch(`/api/reminders/${reminder.id}`, {
        method: "DELETE",
        headers: shareToken ? { [tripShareTokenHeader]: shareToken } : undefined
      });
      const data = (await response.json()) as RemindersApiResponse;

      if (!response.ok) {
        throw new Error(data.error ?? copy.reminderError);
      }

      setSharedReminders(Array.isArray(data.reminders) ? data.reminders.filter(isSharedReminder) : []);
      if (editingReminderId === reminder.id) {
        resetReminderForm();
      }
    } catch (deleteError) {
      setRemindersError(deleteError instanceof Error ? deleteError.message : copy.reminderError);
    } finally {
      setReminderDeletingId(null);
    }
  }

  return (
    <div className="stitch-today-page">
      <header className="stitch-top-appbar">
        <div className="stitch-app-title">{copy.workspace}</div>
        <div className="stitch-top-actions">
          <IconButton icon="language" label={copy.languageLabel} onClick={toggleLanguage} />
          <SosIconButton countries={sosCountries} label={copy.sosLabel} />
        </div>
      </header>

      <nav className="stitch-side-nav" aria-label={copy.navLabel}>
        <div className="stitch-side-brand">
          <strong>{copy.workspace}</strong>
          <span>{copy.sanctuary}</span>
        </div>
        <div className="stitch-side-links">
          {desktopNavItems.map((item) => (
            <a
              key={item.href}
              className={`stitch-side-link ${item.active ? "stitch-side-link--active" : ""}`}
              href={item.href}
            >
              <MaterialIcon icon={item.icon} fill={item.active} />
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </nav>

      <main className="stitch-main-canvas">
        <section className="stitch-trip-heading" aria-label={copy.tripSummaryLabel}>
          <div>
            <h1>{trip.name}</h1>
            <p>{tripSummaryDetail}</p>
          </div>
          <div className="stitch-desktop-actions">
            <IconButton icon="language" label={copy.languageLabel} onClick={toggleLanguage} surface />
            <SosIconButton countries={sosCountries} label={copy.sosLabel} surface />
          </div>
        </section>

        <div className="stitch-dashboard-grid">
          <div className="stitch-main-stack">
            <DestinationCard
              dateLabel={destinationDateLabel}
              imageAlt={destinationVisual.alt}
              imageSrc={destinationVisual.image}
              title={destinationTitle}
            />
            <NextUpCard
              copy={copy}
              item={nextItineraryItem}
              language={language}
              loading={itineraryLoading}
              error={itineraryError}
            />
            <AttentionCard
              bookings={topBookings}
              copy={copy}
              error={bookingsError}
              language={language}
              loading={bookingsLoading}
            />
            <RemindersCard
              canEdit={canEdit}
              copy={copy}
              deletingId={reminderDeletingId}
              editingId={editingReminderId}
              error={remindersError}
              form={reminderForm}
              formOpen={reminderFormOpen}
              loading={remindersLoading}
              onCancel={resetReminderForm}
              onComplete={completeReminder}
              onEdit={startEditingReminder}
              onFormChange={setReminderForm}
              onOpenForm={openReminderForm}
              onSubmit={submitReminder}
              reminders={topReminders}
              submitting={reminderSubmitting}
            />
          </div>

          <aside className="stitch-right-rail" aria-label={copy.sidePanelLabel}>
            <TripMembersCard copy={copy} names={trip.travelerDisplayNames} />
            <QuickActions copy={copy} documentsSummary={documentsSummary} moneySummary={moneySummary} />
          </aside>
        </div>
      </main>

      <nav className="stitch-bottom-nav" aria-label={copy.mobileNavLabel}>
        {mobileNavItems.map((item) => (
          <a
            key={item.href}
            className={`stitch-bottom-link ${item.active ? "stitch-bottom-link--active" : ""}`}
            href={item.href}
          >
            <MaterialIcon icon={item.icon} fill={item.active} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

type TodayCopy = (typeof todayCopy)[Language];

function getDesktopNavItems(copy: TodayCopy) {
  return [
    { href: "/", icon: "home", label: copy.home, active: true },
    { href: "/itinerary", icon: "event_note", label: copy.plan, active: false },
    { href: "/bookings", icon: "confirmation_number", label: copy.book, active: false },
    { href: "/budget", icon: "payments", label: copy.money, active: false },
    { href: "/documents", icon: "description", label: copy.documents, active: false }
  ];
}

function getMobileNavItems(copy: TodayCopy) {
  return [
    { href: "/", icon: "today", label: copy.today, active: true },
    { href: "/itinerary", icon: "event_note", label: copy.plan, active: false },
    { href: "/bookings", icon: "confirmation_number", label: copy.book, active: false },
    { href: "/budget", icon: "payments", label: copy.money, active: false },
    { href: "/more", icon: "more_horiz", label: copy.more, active: false }
  ];
}

function DestinationCard({
  dateLabel,
  imageAlt,
  imageSrc,
  title
}: {
  dateLabel: string;
  imageAlt: string;
  imageSrc: string;
  title: string;
}) {
  return (
    <article className="stitch-card stitch-destination-card">
      <div className="stitch-destination-media">
        <img
          alt={imageAlt}
          src={imageSrc}
        />
        <button type="button" className="stitch-image-edit" aria-label="Edit destination">
          <MaterialIcon icon="edit" />
        </button>
      </div>
      <div className="stitch-destination-body">
        <h2>{title}</h2>
        <p>
          <MaterialIcon icon="calendar_today" />
          <span>{dateLabel}</span>
        </p>
      </div>
    </article>
  );
}

function NextUpCard({
  copy,
  error,
  item,
  language,
  loading
}: {
  copy: TodayCopy;
  error: string | null;
  item: SharedItineraryItem | null;
  language: Language;
  loading: boolean;
}) {
  const content = getNextUpContent({ copy, error, item, language, loading });

  return (
    <article className="stitch-card stitch-section-card">
      <div className="stitch-card-heading">
        <h2>{copy.nextUp}</h2>
        <a href="/itinerary">
          {copy.viewItinerary}
          <MaterialIcon icon="chevron_right" />
        </a>
      </div>
      <div className="stitch-next-item">
        <div className="stitch-next-icon">
          <MaterialIcon icon="event_note" />
        </div>
        <div>
          <h3>{content.title}</h3>
          <p>
            <MaterialIcon icon="schedule" />
            <span>{content.timeLabel}</span>
          </p>
          {content.meta ? <small>{content.meta}</small> : null}
        </div>
      </div>
    </article>
  );
}

function AttentionCard({
  bookings,
  copy,
  error,
  language,
  loading
}: {
  bookings: SharedBooking[];
  copy: TodayCopy;
  error: string | null;
  language: Language;
  loading: boolean;
}) {
  return (
    <article className="stitch-card stitch-section-card">
      <div className="stitch-card-heading">
        <h2>{copy.needsAttention}</h2>
        <a href="/bookings">{copy.viewAll}</a>
      </div>
      <div className="stitch-attention-list">
        {loading ? <p className="stitch-card-message">{copy.bookingsLoading}</p> : null}
        {!loading && error ? <p className="stitch-card-message stitch-card-message--error">{error}</p> : null}
        {!loading && !error && bookings.length === 0 ? <p className="stitch-card-message">{copy.bookingsEmpty}</p> : null}
        {!loading && !error
          ? bookings.map((booking) => (
              <div className="stitch-attention-row" key={booking.id}>
                <div className="stitch-attention-copy">
                  <div className="stitch-attention-icon">
                    <MaterialIcon icon={iconForBooking(booking)} />
                  </div>
                  <div>
                    <h3>{booking.description}</h3>
                    <p>{formatBookingDate(booking, language)}</p>
                  </div>
                </div>
                <span className={`stitch-status-pill stitch-status-pill--${statusToneForBooking(booking)}`}>
                  {formatBookingStatus(booking.status, copy)}
                </span>
              </div>
            ))
          : null}
      </div>
    </article>
  );
}

function RemindersCard({
  canEdit,
  copy,
  deletingId,
  editingId,
  error,
  form,
  formOpen,
  loading,
  onCancel,
  onComplete,
  onEdit,
  onFormChange,
  onOpenForm,
  onSubmit,
  reminders,
  submitting
}: {
  canEdit: boolean;
  copy: TodayCopy;
  deletingId: string | null;
  editingId: string | null;
  error: string | null;
  form: ReminderInput;
  formOpen: boolean;
  loading: boolean;
  onCancel: () => void;
  onComplete: (reminder: SharedReminder) => Promise<void>;
  onEdit: (reminder: SharedReminder) => void;
  onFormChange: (updater: (current: ReminderInput) => ReminderInput) => void;
  onOpenForm: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  reminders: SharedReminder[];
  submitting: boolean;
}) {
  return (
    <section className="stitch-card stitch-reminders-card" aria-label={copy.reminders}>
      <div className="stitch-reminders-heading">
        <h2>{copy.reminders}</h2>
        {canEdit ? (
          <button type="button" onClick={formOpen ? onCancel : onOpenForm}>
            {formOpen ? copy.cancel : copy.addReminder}
          </button>
        ) : null}
      </div>
      {formOpen ? (
        <form className="stitch-reminder-form" onSubmit={(event) => void onSubmit(event)}>
          <input
            aria-label={copy.reminderPlaceholder}
            value={form.text}
            onChange={(event) => onFormChange((current) => ({ ...current, text: event.target.value }))}
            placeholder={copy.reminderPlaceholder}
          />
          <select
            aria-label="Reminder priority"
            value={form.priority}
            onChange={(event) =>
              onFormChange((current) => ({ ...current, priority: event.target.value as ReminderPriority }))
            }
          >
            {reminderPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {formatReminderPriority(priority, copy)}
              </option>
            ))}
          </select>
          <button type="submit" disabled={submitting}>
            {submitting ? copy.savingReminder : editingId ? copy.saveReminder : copy.addReminder}
          </button>
        </form>
      ) : null}
      {error ? <p className="stitch-card-message stitch-card-message--error">{error}</p> : null}
      {loading ? <p className="stitch-card-message">{copy.reminderLoading}</p> : null}
      {!loading && reminders.length === 0 ? <p className="stitch-card-message">{copy.reminderEmpty}</p> : null}
      <div className="stitch-reminder-list">
        {reminders.map((reminder) => (
          <label className="stitch-reminder-row" key={reminder.id}>
            <input
              type="checkbox"
              checked={deletingId === reminder.id}
              disabled={!canEdit || deletingId === reminder.id}
              onChange={() => void onComplete(reminder)}
            />
            <span>
              <strong>{reminder.text}</strong>
              {reminder.priority === "High" ? (
                <small>
                  <MaterialIcon icon="error" />
                  {formatReminderPriority(reminder.priority, copy)}
                </small>
              ) : null}
            </span>
            {canEdit ? (
              <button
                type="button"
                className="stitch-reminder-edit"
                onClick={(event) => {
                  event.preventDefault();
                  onEdit(reminder);
                }}
              >
                {copy.editReminder}
              </button>
            ) : null}
          </label>
        ))}
      </div>
    </section>
  );
}

function TripMembersCard({ copy, names }: { copy: TodayCopy; names: string[] }) {
  const displayNames = names.length > 0 ? names : ["Traveler"];

  return (
    <section className="stitch-card stitch-members-card" aria-label={copy.tripMembers}>
      <h2>{copy.tripMembers}</h2>
      <div className="stitch-members-row">
        <div className="stitch-avatar-stack" aria-hidden="true">
          {displayNames.slice(0, 4).map((name) => (
            <span key={name}>{initialsForName(name)}</span>
          ))}
        </div>
        <p>{displayNames.join(", ")}</p>
      </div>
    </section>
  );
}

function QuickActions({
  copy,
  documentsSummary,
  moneySummary
}: {
  copy: TodayCopy;
  documentsSummary: string;
  moneySummary: string;
}) {
  return (
    <div className="stitch-quick-grid" aria-label="Quick actions">
      <a className="stitch-quick-card" href="/budget">
        <span className="stitch-quick-icon">
          <MaterialIcon icon="account_balance_wallet" />
        </span>
        <strong>{copy.money}</strong>
        <small>{moneySummary}</small>
      </a>
      <a className="stitch-quick-card" href="/documents">
        <span className="stitch-quick-icon">
          <MaterialIcon icon="folder" />
        </span>
        <strong>{copy.documents}</strong>
        <small>{documentsSummary}</small>
      </a>
    </div>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  surface = false,
  tone
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  surface?: boolean;
  tone?: "error";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`stitch-icon-button ${surface ? "stitch-icon-button--surface" : ""} ${
        tone === "error" ? "stitch-icon-button--error" : ""
      }`}
      aria-label={label}
    >
      <MaterialIcon icon={icon} />
    </button>
  );
}

function SosIconButton({
  countries,
  label,
  surface = false
}: {
  countries: SosCountry[];
  label: string;
  surface?: boolean;
}) {
  return (
    <EmergencyQuickAccess
      countries={countries}
      triggerAriaLabel={label}
      triggerClassName={`stitch-icon-button ${surface ? "stitch-icon-button--surface" : ""} stitch-icon-button--error`}
      triggerChildren={<MaterialIcon icon="emergency_home" />}
    />
  );
}

function MaterialIcon({ icon, fill = false }: { icon: string; fill?: boolean }) {
  return (
    <span className={`material-symbols-outlined ${fill ? "stitch-icon-fill" : ""}`} aria-hidden="true">
      {icon}
    </span>
  );
}

function emptyReminderForm(createdBy: string): ReminderInput {
  return {
    text: "",
    priority: "Medium",
    createdBy
  };
}

function getSosCountries(
  trip: TripSettingsView,
  activeRouteStop: TripSettingsRouteStopView | null
): SosCountry[] {
  const routeStops = trip.routeStops.map((stop) => ({
    city: stop.city,
    country: stop.country,
    startDate: stop.startDate,
    endDate: stop.endDate
  }));
  const routeVisual = getDestinationVisualIdentity({
    destination: trip.destination,
    routeCities: trip.routeCities,
    routeLabel: trip.routeLabel,
    routeStops,
    tripName: trip.name
  });
  const activeVisual = activeRouteStop
    ? getDestinationVisualIdentity({
        destination: trip.destination,
        routeCities: [activeRouteStop.city].filter(Boolean),
        routeLabel: activeRouteStop.city || activeRouteStop.country || trip.routeLabel,
        routeStops: [
          {
            city: activeRouteStop.city,
            country: activeRouteStop.country,
            startDate: activeRouteStop.startDate,
            endDate: activeRouteStop.endDate
          }
        ],
        tripName: trip.name
      })
    : null;

  const activeCountries = activeVisual
    ? uniqueSosCountries(zipSosCountries(activeVisual.countryCodes, activeVisual.countryNames), false)
    : [];

  if (activeCountries.length > 0) {
    return activeCountries;
  }

  return uniqueSosCountries(
    [
      ...zipSosCountries(routeVisual.countryCodes, routeVisual.countryNames),
      ...(routeVisual.countryCode !== "GENERIC"
        ? [{ code: routeVisual.countryCode, name: routeVisual.countryName }]
        : [])
    ],
    true
  );
}

function zipSosCountries(codes: string[], names: string[]) {
  return codes.map((code, index) => ({
    code,
    name: names[index] ?? code
  }));
}

function uniqueSosCountries(countries: SosCountry[], useFallback: boolean) {
  const seen = new Set<string>();
  const result: SosCountry[] = [];

  for (const country of countries) {
    const code = normalizeSosCountryCode(country.code);
    if (!code || code === "GENERIC" || seen.has(code)) {
      continue;
    }

    seen.add(code);
    result.push({
      code,
      name: country.name || code
    });
  }

  return result.length > 0 || !useFallback ? result : [{ code: "IT", name: "Italy" }];
}

function normalizeSosCountryCode(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  return normalizedCode === "UK" ? "GB" : normalizedCode;
}

function selectTopBookings(bookings: SharedBooking[]) {
  return bookings
    .slice()
    .sort((left, right) => {
      const statusDifference = bookingStatusPriority[left.status] - bookingStatusPriority[right.status];
      if (statusDifference !== 0) {
        return statusDifference;
      }

      const dateDifference = (dateKeyFromString(left.date) ?? Number.MAX_SAFE_INTEGER) - (dateKeyFromString(right.date) ?? Number.MAX_SAFE_INTEGER);
      if (dateDifference !== 0) {
        return dateDifference;
      }

      return left.description.localeCompare(right.description);
    })
    .slice(0, 3);
}

function selectTopReminders(reminders: SharedReminder[]) {
  return reminders
    .slice()
    .sort((left, right) => {
      const priorityDifference = reminderPriorityRank(left.priority) - reminderPriorityRank(right.priority);
      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      const updatedDifference = Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
      if (Number.isFinite(updatedDifference) && updatedDifference !== 0) {
        return updatedDifference;
      }

      return left.text.localeCompare(right.text);
    })
    .slice(0, 3);
}

function reminderPriorityRank(priority: ReminderPriority) {
  return reminderPriorities.indexOf(priority);
}

function iconForBooking(_booking: SharedBooking) {
  return "confirmation_number";
}

function statusToneForBooking(booking: SharedBooking) {
  return booking.status === "Not Booked" || booking.status === "Need Confirmation" ? "error" : "pending";
}

function formatBookingDate(booking: SharedBooking, language: Language) {
  const dateLabel = formatDisplayDate(booking.date, language);
  return booking.location ? `${dateLabel} - ${booking.location}` : dateLabel;
}

function formatBookingStatus(status: SharedBooking["status"], copy: TodayCopy) {
  switch (status) {
    case "Not Booked":
      return copy.notBooked;
    case "Pending":
      return copy.pending;
    case "Booked":
      return copy.booked;
    case "Paid":
      return copy.paid;
    case "Cancelled":
      return copy.cancelled;
    case "Need Confirmation":
      return copy.needConfirmation;
  }
}

function formatReminderPriority(priority: ReminderPriority, copy: TodayCopy) {
  switch (priority) {
    case "High":
      return copy.highPriority;
    case "Medium":
      return copy.mediumPriority;
    case "Low":
      return copy.lowPriority;
  }
}

function getMoneySummary(
  expenses: SharedExpense[],
  loading: boolean,
  error: string | null,
  copy: TodayCopy
) {
  if (loading) {
    return copy.moneySummaryLoading;
  }

  if (error) {
    return copy.moneySummaryError;
  }

  if (expenses.length === 0) {
    return copy.moneySummaryEmpty;
  }

  const outstanding = expenses.filter((expense) => !expense.settled);
  if (outstanding.length === 0) {
    return `${expenses.length} ${copy.paid}`;
  }

  return `${copy.moneySummaryOutstanding} ${formatCurrencySummary(outstanding)}`;
}

function getDocumentsSummary(
  documents: SharedDocumentItem[],
  loading: boolean,
  error: string | null,
  copy: TodayCopy
) {
  if (loading) {
    return copy.documentsSummaryLoading;
  }

  if (error) {
    return copy.documentsSummaryError;
  }

  if (documents.length === 0) {
    return copy.documentsSummaryEmpty;
  }

  const needsAttentionCount = documents.filter((documentItem) => documentNeedsAttention(documentItem)).length;
  return needsAttentionCount > 0
    ? `${needsAttentionCount} ${copy.documentsSummaryNeeded}`
    : `${documents.length} ${copy.documentsSummaryReady}`;
}

function formatCurrencySummary(expenses: SharedExpense[]) {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    totals.set(expense.currency, (totals.get(expense.currency) ?? 0) + expense.amount);
  }

  const [firstCurrency, firstAmount] = Array.from(totals.entries()).sort(([left], [right]) => left.localeCompare(right))[0];
  const extraCurrencies = totals.size > 1 ? ` +${totals.size - 1}` : "";
  return `${firstCurrency} ${formatCompactAmount(firstAmount)}${extraCurrencies}`;
}

function formatCompactAmount(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: value >= 100 ? 0 : 2,
    minimumFractionDigits: 0
  }).format(value);
}

function documentNeedsAttention(documentItem: SharedDocumentItem) {
  return (
    documentItem.status === "Needed" ||
    documentItem.status === "Saved" ||
    documentItem.status === "Printed" ||
    documentItem.statuses.some((status) => status.status === "required")
  );
}

function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function selectActiveRouteStop(routeStops: TripSettingsRouteStopView[]) {
  const sortedStops = routeStops
    .filter((stop) => stop.city || stop.country)
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder);

  if (sortedStops.length === 0) {
    return null;
  }

  const todayKey = dateKeyFromDate(new Date());
  const activeStop = sortedStops.find((stop) => {
    const startKey = dateKeyFromString(stop.startDate ?? stop.endDate);
    const endKey = dateKeyFromString(stop.endDate ?? stop.startDate);

    return startKey !== null && endKey !== null && startKey <= todayKey && todayKey <= endKey;
  });

  if (activeStop) {
    return activeStop;
  }

  const nextStop = sortedStops.find((stop) => {
    const startKey = dateKeyFromString(stop.startDate ?? stop.endDate);
    const endKey = dateKeyFromString(stop.endDate ?? stop.startDate);
    const comparisonKey = endKey ?? startKey;

    return comparisonKey === null || comparisonKey >= todayKey;
  });

  return nextStop ?? sortedStops[sortedStops.length - 1];
}

function formatRouteStopTitle(stop: TripSettingsRouteStopView | null, fallback: string) {
  return stop?.city || stop?.country || fallback || "Trip route";
}

function formatRouteStopDate(
  stop: TripSettingsRouteStopView | null,
  fallback: string,
  language: Language
) {
  if (!stop) {
    return fallback;
  }

  return formatTripDateRange(stop.startDate, stop.endDate, fallback, language);
}

function getRouteStopVisual(stop: TripSettingsRouteStopView | null, fallbackLabel: string) {
  const candidates = [stop?.city, stop?.country, fallbackLabel].filter(Boolean);

  for (const candidate of candidates) {
    const visual = routeStopVisuals[normalizeRouteStopKey(candidate ?? "")];
    if (visual) {
      return visual;
    }
  }

  return fallbackRouteStopVisual;
}

function normalizeRouteStopKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function selectNextItineraryItem(items: SharedItineraryItem[]) {
  const now = new Date();
  const todayKey = dateKeyFromDate(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let selectedItem: SharedItineraryItem | null = null;
  let selectedRank: ItineraryRank | null = null;

  for (const item of items) {
    const travelDateKey = dateKeyFromString(item.travelDate);

    if (travelDateKey === null || travelDateKey < todayKey) {
      continue;
    }

    const startMinutes = timeMinutesFromString(item.startTime);
    const endMinutes = timeMinutesFromString(item.endTime);

    if (travelDateKey === todayKey) {
      const currentItemMinutes = endMinutes ?? startMinutes;

      if (currentItemMinutes !== null && currentItemMinutes < currentMinutes) {
        continue;
      }
    }

    const rank = {
      dateKey: travelDateKey,
      minutes: startMinutes ?? 0,
      sortOrder: item.sortOrder,
      id: item.id
    };

    if (!selectedRank || compareItineraryRank(rank, selectedRank) < 0) {
      selectedRank = rank;
      selectedItem = item;
    }
  }

  return selectedItem;
}

type ItineraryRank = {
  dateKey: number;
  minutes: number;
  sortOrder: number;
  id: string;
};

function compareItineraryRank(left: ItineraryRank, right: ItineraryRank) {
  if (left.dateKey !== right.dateKey) {
    return left.dateKey - right.dateKey;
  }

  if (left.minutes !== right.minutes) {
    return left.minutes - right.minutes;
  }

  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  return left.id.localeCompare(right.id);
}

function getNextUpContent({
  copy,
  error,
  item,
  language,
  loading
}: {
  copy: TodayCopy;
  error: string | null;
  item: SharedItineraryItem | null;
  language: Language;
  loading: boolean;
}) {
  if (loading) {
    return {
      title: copy.nextUpLoading,
      timeLabel: copy.flexibleTime,
      meta: ""
    };
  }

  if (error) {
    return {
      title: copy.nextUpError,
      timeLabel: copy.openItineraryPrompt,
      meta: error
    };
  }

  if (!item) {
    return {
      title: copy.nextUpEmpty,
      timeLabel: copy.openItineraryPrompt,
      meta: ""
    };
  }

  return {
    title: item.title,
    timeLabel: formatNextUpTime(item, copy.flexibleTime, language),
    meta: formatNextUpMeta(item)
  };
}

function formatNextUpTime(item: SharedItineraryItem, fallback: string, language: Language) {
  const timeLabel = formatTimeRange(item.startTime, item.endTime, fallback, language);
  const dateLabel = formatDisplayDate(item.travelDate, language);

  return `${dateLabel} · ${timeLabel}`;
}

function formatTimeRange(
  startTime: string | null,
  endTime: string | null,
  fallback: string,
  language: Language
) {
  const startLabel = formatClockTime(startTime, language);
  const endLabel = formatClockTime(endTime, language);

  if (startLabel && endLabel) {
    return `${startLabel} - ${endLabel}`;
  }

  return startLabel || endLabel || fallback;
}

function formatClockTime(value: string | null, language: Language) {
  const minutes = timeMinutesFromString(value);

  if (minutes === null) {
    return value?.trim() ?? "";
  }

  const date = new Date(2026, 0, 1, Math.floor(minutes / 60), minutes % 60);

  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatNextUpMeta(item: SharedItineraryItem) {
  const places = [item.city, item.location].filter(
    (place, index, list) =>
      Boolean(place) && list.findIndex((candidate) => normalizeRouteStopKey(candidate ?? "") === normalizeRouteStopKey(place ?? "")) === index
  );
  const placeLabel = places.join(" - ");

  return placeLabel || item.transport || item.meal || item.details || "";
}

function formatTripDateRange(
  startDate: string | null,
  endDate: string | null,
  fallback: string,
  language: Language
) {
  if (startDate && endDate && startDate !== endDate) {
    return `${formatDisplayDate(startDate, language)} - ${formatDisplayDate(endDate, language)}`;
  }

  if (startDate || endDate) {
    return formatDisplayDate(startDate ?? endDate ?? "", language);
  }

  return fallback;
}

function formatDisplayDate(value: string, language: Language) {
  const key = dateKeyFromString(value);
  if (key === null) {
    return value;
  }

  const year = Math.floor(key / 10000);
  const month = Math.floor((key % 10000) / 100);
  const day = key % 100;

  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function dateKeyFromDate(date: Date) {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

function timeMinutesFromString(value?: string | null) {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return null;
  }

  const twelveHourMatch = /^(\d{1,2}):(\d{2})\s*([ap]m)$/i.exec(trimmedValue);
  if (twelveHourMatch) {
    const hour = Number(twelveHourMatch[1]);
    const minute = Number(twelveHourMatch[2]);
    const period = twelveHourMatch[3].toLowerCase();

    if (hour < 1 || hour > 12 || minute > 59) {
      return null;
    }

    return ((hour % 12) + (period === "pm" ? 12 : 0)) * 60 + minute;
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmedValue);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour > 23 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}

function dateKeyFromString(value?: string | null) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) {
    return null;
  }

  return Number(match[1]) * 10000 + Number(match[2]) * 100 + Number(match[3]);
}

function isSharedItineraryItem(value: unknown): value is SharedItineraryItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<SharedItineraryItem>;

  return (
    typeof item.id === "string" &&
    typeof item.travelDate === "string" &&
    typeof item.city === "string" &&
    typeof item.title === "string" &&
    typeof item.sortOrder === "number"
  );
}

function isSharedBooking(value: unknown): value is SharedBooking {
  if (!value || typeof value !== "object") {
    return false;
  }

  const booking = value as Partial<SharedBooking>;

  return (
    typeof booking.id === "string" &&
    typeof booking.category === "string" &&
    typeof booking.description === "string" &&
    typeof booking.date === "string" &&
    typeof booking.status === "string"
  );
}

function isSharedReminder(value: unknown): value is SharedReminder {
  if (!value || typeof value !== "object") {
    return false;
  }

  const reminder = value as Partial<SharedReminder>;

  return (
    typeof reminder.id === "string" &&
    typeof reminder.text === "string" &&
    typeof reminder.priority === "string" &&
    typeof reminder.createdBy === "string"
  );
}

function isSharedExpense(value: unknown): value is SharedExpense {
  if (!value || typeof value !== "object") {
    return false;
  }

  const expense = value as Partial<SharedExpense>;

  return (
    typeof expense.id === "string" &&
    typeof expense.title === "string" &&
    typeof expense.amount === "number" &&
    typeof expense.currency === "string" &&
    typeof expense.settled === "boolean"
  );
}

function isSharedDocumentItem(value: unknown): value is SharedDocumentItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const documentItem = value as Partial<SharedDocumentItem>;

  return (
    typeof documentItem.id === "string" &&
    typeof documentItem.title === "string" &&
    typeof documentItem.status === "string" &&
    Array.isArray(documentItem.statuses)
  );
}
