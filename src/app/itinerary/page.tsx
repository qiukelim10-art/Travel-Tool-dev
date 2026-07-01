"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { EmergencyQuickAccess } from "@/components/EmergencyQuickAccess";
import { useTripAccess } from "@/lib/access";
import { formatMoney } from "@/lib/budget";
import { activeTripCurrencies, fallbackCurrency } from "@/lib/currencyPreferences";
import { getDestinationVisualIdentity } from "@/lib/destinationVisuals";
import { useLanguage, type Language } from "@/lib/i18n";
import { translateOption } from "@/lib/localize";
import {
  expenseCategories,
  type ExpenseCategory,
  type ExpenseInput,
  type ItineraryInput,
  type SharedCurrency,
  type SharedExpense,
  type SharedItineraryItem
} from "@/lib/sharedDataTypes";
import { useTripSettingsView, type TripSettingsRouteStopView, type TripSettingsView } from "@/lib/useTripSettings";
import type { Traveler } from "@/data/tripData";

const requestTimeoutMs = 10000;
const routeStopImageBaseUrl = "https://commons.wikimedia.org/wiki/Special:FilePath/";

type RouteStopVisual = {
  alt: string;
  image: string;
};

function routeStopImage(fileName: string) {
  return `${routeStopImageBaseUrl}${encodeURIComponent(fileName)}?width=1200`;
}

type PlanStop = {
  key: string;
  city: string;
  country: string | null;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
};

type PlanDayChip = {
  key: string;
  label: string;
  subLabel: string;
  value: string;
  active: boolean;
};

type PlanDayGroup = {
  key: string;
  dayLabel: string;
  dateLabel: string;
  weekdayLabel: string;
  cityLabel: string;
  items: SharedItineraryItem[];
};

type ItineraryApiResponse = {
  itineraryItems?: SharedItineraryItem[];
  error?: string;
};

type ExpensesApiResponse = {
  expenses?: SharedExpense[];
  travelers?: Traveler[];
  error?: string;
};

type ExpenseFormState = {
  title: string;
  amount: string;
  currency: SharedCurrency;
  category: ExpenseCategory;
  expenseDate: string;
  paidByTravelerId: string;
  splitTravelerIds: string[];
  settled: boolean;
  notes: string;
};

type DateFilter = "All" | string;

const itineraryIconOptions = [
  { key: "general", icon: "event_note", label: { en: "General", zh: "通用" } },
  { key: "flight", icon: "flight_land", label: { en: "Flight", zh: "航班" } },
  { key: "transport", icon: "train", label: { en: "Transport", zh: "交通" } },
  { key: "food", icon: "restaurant", label: { en: "Food", zh: "用餐" } },
  { key: "sightseeing", icon: "photo_camera", label: { en: "Sightseeing", zh: "观光" } },
  { key: "hotel", icon: "hotel", label: { en: "Hotel", zh: "住宿" } },
  { key: "shopping", icon: "shopping_bag", label: { en: "Shopping", zh: "购物" } }
] as const;

type ItineraryIconOption = (typeof itineraryIconOptions)[number];
type ItineraryIconKey = ItineraryIconOption["key"];

const itineraryIconKeys = itineraryIconOptions.map((option) => option.key) as ItineraryIconKey[];
const defaultItineraryIconOption = itineraryIconOptions[0]!;

const fallbackRouteStopVisual: RouteStopVisual = {
  alt: "The Colosseum in Rome, Italy.",
  image: routeStopImage("Colosseum_in_Rome,_Italy_-_April_2007.jpg")
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
  florence: {
    alt: "Florence Cathedral seen from Piazzale Michelangelo.",
    image: routeStopImage("2024_04_Florence_Duomo_from_Piazzale_Michelangelo_6869.jpg")
  },
  firenze: {
    alt: "Florence Cathedral seen from Piazzale Michelangelo.",
    image: routeStopImage("2024_04_Florence_Duomo_from_Piazzale_Michelangelo_6869.jpg")
  },
  italy: fallbackRouteStopVisual,
  italia: fallbackRouteStopVisual,
  milan: {
    alt: "Milan Cathedral from Piazza del Duomo.",
    image: routeStopImage("Milan_Cathedral_from_Piazza_del_Duomo.jpg")
  },
  milano: {
    alt: "Milan Cathedral from Piazza del Duomo.",
    image: routeStopImage("Milan_Cathedral_from_Piazza_del_Duomo.jpg")
  },
  mykonos: {
    alt: "The windmills of Mykonos.",
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Windmills_of_Mykonos.jpg"
  },
  rome: fallbackRouteStopVisual,
  roma: fallbackRouteStopVisual,
  santorini: {
    alt: "Three blue domes in Oia, Santorini.",
    image: routeStopImage("1000_Three_domes_of_Oia_in_Santorini_Photo_by_Giles_Laurent.jpg")
  },
  venice: {
    alt: "The Grand Canal and Rialto Bridge in Venice.",
    image: routeStopImage("Panorama_of_Canal_Grande_and_Ponte_di_Rialto,_Venice_-_September_2017.jpg")
  },
  venezia: {
    alt: "The Grand Canal and Rialto Bridge in Venice.",
    image: routeStopImage("Panorama_of_Canal_Grande_and_Ponte_di_Rialto,_Venice_-_September_2017.jpg")
  },
  vienna: {
    alt: "St. Stephen's Cathedral in Vienna.",
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Spire_Cathedral_St_Stephen_Vienna_Wien_Steffl_1.jpg"
  },
  wien: {
    alt: "St. Stephen's Cathedral in Vienna.",
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Spire_Cathedral_St_Stephen_Vienna_Wien_Steffl_1.jpg"
  }
};

const planCopy = {
  en: {
    workspace: "Trip Workspace",
    sanctuary: "Private Sanctuary",
    languageLabel: "Switch to Chinese",
    sosLabel: "Emergency",
    navLabel: "Workspace navigation",
    mobileNavLabel: "Mobile navigation",
    home: "Home",
    plan: "Plan",
    book: "Book",
    money: "Money",
    documents: "Documents",
    today: "Today",
    more: "More",
    routeOverview: "Route Overview",
    dailyPlan: "Daily Plan",
    routeFallback: "Trip route",
    datePending: "Dates pending",
    flexibleTime: "Flexible",
    dayLabel: "Day",
    allDates: "All",
    addPlan: "Add",
    closeForm: "Close",
    edit: "Edit",
    delete: "Delete",
    manage: "Manage",
    map: "Map",
    expense: "Expense",
    expenses: "Expenses",
    loading: "Loading plan...",
    retry: "Retry",
    empty: "No itinerary items yet.",
    itemSaved: "Plan item saved.",
    itemDeleted: "Plan item deleted.",
    expenseAdded: "Expense saved to Money.",
    expenseDeleted: "Expense deleted.",
    date: "Date",
    city: "City",
    location: "Location",
    startTime: "Start time",
    endTime: "End time",
    title: "Title",
    icon: "Icon",
    info: "Info",
    infoPlaceholder: "Write anything the group needs to know.",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    amount: "Amount",
    currency: "Currency",
    category: "Category",
    paidBy: "Paid by",
    splitAmong: "Split among",
    settled: "Settled",
    notes: "Notes",
    noExpenses: "No expenses yet.",
    validationItem: "Date, city, and title are required.",
    validationExpense: "Title, positive amount, payer, and at least one split member are required.",
    errorLoad: "Unable to load itinerary.",
    errorSave: "Unable to save itinerary item.",
    errorDelete: "Unable to delete itinerary item.",
    errorExpense: "Unable to save expense.",
    errorExpenseDelete: "Unable to delete expense."
  },
  zh: {
    workspace: "行程工作区",
    sanctuary: "私人协作空间",
    languageLabel: "切换到英文",
    sosLabel: "紧急联系",
    navLabel: "工作区导航",
    mobileNavLabel: "手机导航",
    home: "首页",
    plan: "计划",
    book: "预订",
    money: "预算",
    documents: "文件",
    today: "今日",
    more: "更多",
    routeOverview: "路线概览",
    dailyPlan: "每日计划",
    routeFallback: "行程路线",
    datePending: "日期待定",
    flexibleTime: "灵活",
    dayLabel: "第",
    allDates: "全部",
    addPlan: "新增",
    closeForm: "关闭",
    edit: "编辑",
    delete: "删除",
    manage: "管理",
    map: "地图",
    expense: "费用",
    expenses: "费用",
    loading: "正在加载行程...",
    retry: "重试",
    empty: "还没有行程项目。",
    itemSaved: "行程已保存。",
    itemDeleted: "行程已删除。",
    expenseAdded: "费用已接入预算页。",
    expenseDeleted: "费用已删除。",
    date: "日期",
    city: "城市",
    location: "地点",
    startTime: "开始时间",
    endTime: "结束时间",
    title: "标题",
    info: "信息",
    infoPlaceholder: "写下同行成员需要知道的任何信息。",
    save: "保存",
    saving: "保存中...",
    cancel: "取消",
    amount: "金额",
    currency: "币种",
    category: "分类",
    paidBy: "付款人",
    splitAmong: "分摊成员",
    settled: "已结算",
    notes: "备注",
    noExpenses: "还没有费用。",
    validationItem: "日期、城市和标题必填。",
    validationExpense: "请填写标题、正数金额、日期、付款人，并至少选择一位分摊成员。",
    errorLoad: "无法加载行程。",
    errorSave: "无法保存行程。",
    errorDelete: "无法删除行程。",
    errorExpense: "无法保存费用。",
    errorExpenseDelete: "无法删除费用。"
  }
} as const satisfies Record<Language, Record<string, string>>;

type PlanCopy = (typeof planCopy)[Language];

export default function ItineraryPage() {
  const { language, toggleLanguage } = useLanguage();
  const { mode } = useTripAccess();
  const { trip } = useTripSettingsView();
  const canEdit = mode === "editor";
  const copy = planCopy[language];
  const desktopNavItems = getDesktopNavItems(copy);
  const mobileNavItems = getMobileNavItems(copy);
  const currencyOptions = useMemo(() => activeTripCurrencies(trip.defaultCurrencies), [trip.defaultCurrencies]);
  const primaryCurrency = currencyOptions[0] ?? fallbackCurrency;
  const stops = getPlanStops(trip);
  const primaryStop = stops[0] ?? null;
  const dateRangeLabel = formatTripDateRange(trip.startDate, trip.endDate, trip.dateRangeLabel, language);
  const routeLabel = trip.routeLabel || trip.destination || copy.routeFallback;
  const summaryDetail = [dateRangeLabel, formatRouteLabel(routeLabel)].filter(Boolean).join(" - ");
  const heroTitle = primaryStop?.city || routeLabel;
  const heroDateLabel = primaryStop ? formatStopDate(primaryStop, dateRangeLabel, language, copy) : dateRangeLabel;
  const heroVisual = getRouteStopVisual(primaryStop, heroTitle);
  const destinationVisual = useMemo(
    () =>
      getDestinationVisualIdentity({
        destination: trip.destination,
        routeCities: trip.routeCities,
        routeLabel: trip.routeLabel,
        routeStops: trip.routeStops,
        tripName: trip.name
      }),
    [trip.destination, trip.name, trip.routeCities, trip.routeLabel, trip.routeStops]
  );
  const sosCountries = getSosCountries(destinationVisual);
  const [items, setItems] = useState<SharedItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [travelers, setTravelers] = useState<Traveler[]>(trip.travelers);
  const [selectedDate, setSelectedDate] = useState<DateFilter>("All");
  const [form, setForm] = useState<ItineraryInput>(() => emptyItineraryForm(primaryCurrency, trip, "All"));
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expensePanelItemId, setExpensePanelItemId] = useState<string | null>(null);
  const [expenseFormItemId, setExpenseFormItemId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const orderedItems = useMemo(() => items.slice().sort(compareItineraryItems), [items]);
  const dateOptions = useMemo(
    () => Array.from(new Set(orderedItems.map((item) => item.travelDate))).sort(),
    [orderedItems]
  );
  const visibleItems = useMemo(
    () => orderedItems.filter((item) => selectedDate === "All" || item.travelDate === selectedDate),
    [orderedItems, selectedDate]
  );
  const visibleDayGroups = useMemo(
    () => buildDayGroups(visibleItems, dateOptions, language, copy),
    [copy, dateOptions, language, visibleItems]
  );
  const dayChips = useMemo(
    () => buildDateChips(dateOptions, selectedDate, language, copy),
    [copy, dateOptions, language, selectedDate]
  );
  const orderedTravelers = useMemo(() => orderTravelers(travelers), [travelers]);
  const activeTravelers = useMemo(
    () => orderedTravelers.filter((traveler) => traveler.isActive !== false),
    [orderedTravelers]
  );
  const travelerNameById = useMemo(
    () => new Map(orderedTravelers.map((traveler) => [traveler.id, traveler.name])),
    [orderedTravelers]
  );
  const expenseFormTravelers = useMemo(
    () => (expenseForm ? mergeExpenseFormTravelers(activeTravelers, orderedTravelers, expenseForm) : activeTravelers),
    [activeTravelers, expenseForm, orderedTravelers]
  );
  const linkedExpensesByItem = useMemo(() => {
    const groups = new Map<string, SharedExpense[]>();
    const allowedCurrencies = new Set(currencyOptions);

    for (const expense of expenses) {
      if (expense.sourceType !== "itinerary" || !expense.sourceId || !allowedCurrencies.has(expense.currency)) {
        continue;
      }

      const group = groups.get(expense.sourceId) ?? [];
      group.push(expense);
      groups.set(expense.sourceId, group);
    }

    return groups;
  }, [currencyOptions, expenses]);

  async function loadPlan() {
    setLoading(true);
    setError(null);

    try {
      const [itineraryData, expenseData] = await Promise.all([
        fetchItineraryJson("/api/itinerary", undefined, copy.errorLoad),
        fetchExpensesJson("/api/expenses", undefined, copy.errorLoad)
      ]);
      setItems((itineraryData.itineraryItems ?? []).filter(isItineraryItem));
      setExpenses(expenseData.expenses);
      setTravelers(expenseData.travelers.length > 0 ? expenseData.travelers : trip.travelers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.errorLoad);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPlan();
  }, []);

  useEffect(() => {
    setForm((current) => withAllowedItineraryCurrency(current, currencyOptions));
    setExpenseForm((current) => (current ? withAllowedExpenseCurrency(current, currencyOptions) : current));
  }, [currencyOptions]);

  useEffect(() => {
    if (selectedDate !== "All" && !dateOptions.includes(selectedDate)) {
      setSelectedDate("All");
    }
  }, [dateOptions, selectedDate]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyItineraryForm(primaryCurrency, trip, selectedDate));
    setFormOpen(false);
  }

  function openAddForm() {
    setEditingId(null);
    setForm(emptyItineraryForm(primaryCurrency, trip, selectedDate));
    setFormOpen(true);
    setNotice(null);
    setError(null);
  }

  function startEditing(item: SharedItineraryItem) {
    setEditingId(item.id);
      setForm({
        travelDate: item.travelDate,
        city: item.city,
        startTime: item.startTime ?? "",
        endTime: item.endTime ?? "",
        title: item.title,
        location: item.location ?? "",
        details: item.details ?? "",
      transport: itineraryIconToken(getItineraryIconOption(item).key),
        meal: item.meal ?? "",
        costAmount: item.costAmount,
        currency: item.currency,
        notes: item.notes ?? "",
        mapQuery: item.mapQuery ?? "",
      sortOrder: item.sortOrder
    });
    setFormOpen(false);
    setNotice(null);
    setError(null);
  }

  async function submitItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit) {
      return;
    }

    if (!form.travelDate || !form.city?.trim() || !form.title?.trim()) {
      setError(copy.validationItem);
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchItineraryJson(
        editingId ? `/api/itinerary/${editingId}` : "/api/itinerary",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        },
        copy.errorSave
      );
      setItems((data.itineraryItems ?? []).filter(isItineraryItem));
      setSelectedDate(form.travelDate);
      setNotice(copy.itemSaved);
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : copy.errorSave);
    } finally {
      setSubmitting(false);
    }
  }

  async function removeItem(item: SharedItineraryItem) {
    if (!canEdit || !window.confirm(copy.delete)) {
      return;
    }

    setDeletingId(item.id);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchItineraryJson(`/api/itinerary/${item.id}`, { method: "DELETE" }, copy.errorDelete);
      setItems((data.itineraryItems ?? []).filter(isItineraryItem));
      setNotice(copy.itemDeleted);
      if (editingId === item.id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : copy.errorDelete);
    } finally {
      setDeletingId(null);
    }
  }

  function resetExpenseForm() {
    setExpenseFormItemId(null);
    setEditingExpenseId(null);
    setExpenseForm(null);
  }

  function openExpenseForm(item: SharedItineraryItem) {
    if (!canEdit) {
      return;
    }

    setExpensePanelItemId(item.id);
    setExpenseFormItemId(item.id);
    setEditingExpenseId(null);
    setExpenseForm(emptyExpenseForm(item, activeTravelers, primaryCurrency));
    setError(null);
    setNotice(null);
  }

  function startExpenseEditing(expense: SharedExpense) {
    if (!canEdit || expense.sourceType !== "itinerary" || !expense.sourceId) {
      return;
    }

    setExpensePanelItemId(expense.sourceId);
    setExpenseFormItemId(expense.sourceId);
    setEditingExpenseId(expense.id);
    setExpenseForm({
      title: expense.title,
      amount: String(expense.amount),
      currency: currencyOptions.includes(expense.currency) ? expense.currency : primaryCurrency,
      category: expense.category,
      expenseDate: expense.expenseDate,
      paidByTravelerId: expense.paidByTravelerId,
      splitTravelerIds: expense.splitTravelerIds,
      settled: expense.settled,
      notes: expense.notes ?? ""
    });
    setError(null);
    setNotice(null);
  }

  async function submitExpense(item: SharedItineraryItem, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit || !expenseForm) {
      return;
    }

    const input = buildExpenseInput(item, expenseForm);
    if (
      !input.title ||
      !Number.isFinite(input.amount) ||
      input.amount <= 0 ||
      !input.expenseDate ||
      !input.paidByTravelerId ||
      input.splitTravelerIds.length === 0
    ) {
      setError(copy.validationExpense);
      return;
    }

    setExpenseSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchExpensesJson(
        editingExpenseId ? `/api/expenses/${editingExpenseId}` : "/api/expenses",
        {
          method: editingExpenseId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input)
        },
        copy.errorExpense
      );
      setExpenses(data.expenses);
      setTravelers(data.travelers);
      setNotice(copy.expenseAdded);
      resetExpenseForm();
      setExpensePanelItemId(item.id);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : copy.errorExpense);
    } finally {
      setExpenseSubmitting(false);
    }
  }

  async function removeExpense(expense: SharedExpense) {
    if (!canEdit || expense.sourceType !== "itinerary" || !window.confirm(copy.delete)) {
      return;
    }

    setDeletingExpenseId(expense.id);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchExpensesJson(`/api/expenses/${expense.id}`, { method: "DELETE" }, copy.errorExpenseDelete);
      setExpenses(data.expenses);
      setTravelers(data.travelers);
      setNotice(copy.expenseDeleted);
      if (editingExpenseId === expense.id) {
        resetExpenseForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : copy.errorExpenseDelete);
    } finally {
      setDeletingExpenseId(null);
    }
  }

  return (
    <div className="stitch-today-page stitch-plan-page">
      <header className="stitch-top-appbar stitch-budget-topbar">
        <div className="stitch-budget-top-title">
          <h1>{trip.name}</h1>
          <p>{summaryDetail}</p>
        </div>
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

      <main className="stitch-main-canvas stitch-plan-main">
        <section className="stitch-trip-heading" aria-label={copy.routeOverview}>
          <div>
            <h1>{trip.name}</h1>
            <p>{summaryDetail}</p>
          </div>
          <div className="stitch-desktop-actions">
            <IconButton icon="language" label={copy.languageLabel} onClick={toggleLanguage} surface />
            <SosIconButton countries={sosCountries} label={copy.sosLabel} surface />
          </div>
        </section>

        <div className="stitch-dashboard-grid stitch-plan-grid">
          <div className="stitch-main-stack">
            <DestinationCard dateLabel={heroDateLabel} imageAlt={heroVisual.alt} imageSrc={heroVisual.image} title={formatPlaceLabel(heroTitle)} />
            <DailyPlanCard
              copy={copy}
              canEdit={canEdit}
              currencyOptions={currencyOptions}
            dayChips={dayChips}
            deletingExpenseId={deletingExpenseId}
            deletingId={deletingId}
            dayGroups={visibleDayGroups}
            editingExpenseId={editingExpenseId}
            editingId={editingId}
            error={error}
              expenseForm={expenseForm}
              expenseFormItemId={expenseFormItemId}
              expenseFormTravelers={expenseFormTravelers}
              expensePanelItemId={expensePanelItemId}
              expenseSubmitting={expenseSubmitting}
              form={form}
              formOpen={formOpen}
              items={visibleItems}
              language={language}
              linkedExpensesByItem={linkedExpensesByItem}
              loading={loading}
              notice={notice}
              selectedDate={selectedDate}
              submitting={submitting}
              travelerNameById={travelerNameById}
              travelers={orderedTravelers}
              onAdd={openAddForm}
              onCancelEdit={resetForm}
              onCancelExpense={resetExpenseForm}
              onDateChange={setSelectedDate}
              onDelete={(item) => void removeItem(item)}
              onDeleteExpense={(expense) => void removeExpense(expense)}
              onEdit={startEditing}
              onEditExpense={startExpenseEditing}
              onExpenseFormChange={(updater) => setExpenseForm((current) => (current ? updater(current) : current))}
              onFormChange={setForm}
              onOpenExpense={openExpenseForm}
              onReload={() => void loadPlan()}
              onSubmit={submitItem}
              onSubmitExpense={(item, event) => void submitExpense(item, event)}
              onToggleExpensePanel={(itemId) => setExpensePanelItemId((current) => (current === itemId ? null : itemId))}
            />
          </div>
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

function DailyPlanCard({
  copy,
  canEdit,
  currencyOptions,
  dayChips,
  dayGroups,
  deletingExpenseId,
  deletingId,
  editingExpenseId,
  editingId,
  error,
  expenseForm,
  expenseFormItemId,
  expenseFormTravelers,
  expensePanelItemId,
  expenseSubmitting,
  form,
  formOpen,
  items,
  language,
  linkedExpensesByItem,
  loading,
  notice,
  selectedDate,
  submitting,
  travelerNameById,
  travelers,
  onAdd,
  onCancelEdit,
  onCancelExpense,
  onDateChange,
  onDelete,
  onDeleteExpense,
  onEdit,
  onEditExpense,
  onExpenseFormChange,
  onFormChange,
  onOpenExpense,
  onReload,
  onSubmit,
  onSubmitExpense,
  onToggleExpensePanel
}: {
  copy: PlanCopy;
  canEdit: boolean;
  currencyOptions: readonly SharedCurrency[];
  dayChips: PlanDayChip[];
  dayGroups: PlanDayGroup[];
  deletingExpenseId: string | null;
  deletingId: string | null;
  editingExpenseId: string | null;
  editingId: string | null;
  error: string | null;
  expenseForm: ExpenseFormState | null;
  expenseFormItemId: string | null;
  expenseFormTravelers: Traveler[];
  expensePanelItemId: string | null;
  expenseSubmitting: boolean;
  form: ItineraryInput;
  formOpen: boolean;
  items: SharedItineraryItem[];
  language: Language;
  linkedExpensesByItem: Map<string, SharedExpense[]>;
  loading: boolean;
  notice: string | null;
  selectedDate: DateFilter;
  submitting: boolean;
  travelerNameById: Map<string, string>;
  travelers: Traveler[];
  onAdd: () => void;
  onCancelEdit: () => void;
  onCancelExpense: () => void;
  onDateChange: (date: DateFilter) => void;
  onDelete: (item: SharedItineraryItem) => void;
  onDeleteExpense: (expense: SharedExpense) => void;
  onEdit: (item: SharedItineraryItem) => void;
  onEditExpense: (expense: SharedExpense) => void;
  onExpenseFormChange: (updater: (current: ExpenseFormState) => ExpenseFormState) => void;
  onFormChange: (updater: (current: ItineraryInput) => ItineraryInput) => void;
  onOpenExpense: (item: SharedItineraryItem) => void;
  onReload: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitExpense: (item: SharedItineraryItem, event: FormEvent<HTMLFormElement>) => void;
  onToggleExpensePanel: (itemId: string) => void;
}) {
  return (
    <section className="stitch-card stitch-section-card stitch-plan-section-card" aria-label={copy.dailyPlan}>
      <div className="stitch-plan-card-header">
        <div>
          <h2>{copy.dailyPlan}</h2>
        </div>
        <div className="stitch-plan-header-actions">
          {canEdit ? (
            <button type="button" className="stitch-plan-pill-button" onClick={formOpen ? onCancelEdit : onAdd}>
              <MaterialIcon icon="add" />
              <span>{formOpen ? copy.closeForm : copy.addPlan}</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="stitch-plan-day-strip" role="list" aria-label={copy.dailyPlan}>
        <button
          type="button"
          className={`stitch-plan-day-chip ${selectedDate === "All" ? "stitch-plan-day-chip--active" : ""}`}
          onClick={() => onDateChange("All")}
        >
          <span>{copy.allDates}</span>
          <strong>{items.length}</strong>
        </button>
        {dayChips.map((day) => (
          <button
            key={day.key}
            type="button"
            className={`stitch-plan-day-chip ${day.active ? "stitch-plan-day-chip--active" : ""}`}
            onClick={() => onDateChange(day.value)}
          >
            <span>{day.label}</span>
            <strong>{day.subLabel}</strong>
          </button>
        ))}
      </div>

      {formOpen ? (
        <PlanItemForm
          copy={copy}
          form={form}
          language={language}
          submitting={submitting}
          onCancel={onCancelEdit}
          onChange={onFormChange}
          onSubmit={onSubmit}
        />
      ) : null}

      {notice ? <p className="stitch-plan-status stitch-plan-status--success">{notice}</p> : null}
      {error ? (
        <div className="stitch-plan-status stitch-plan-status--error">
          <span>{error}</span>
          <button type="button" onClick={onReload}>
            {copy.retry}
          </button>
        </div>
      ) : null}
      {loading ? <p className="stitch-plan-status">{copy.loading}</p> : null}
      {!loading && items.length === 0 ? <p className="stitch-plan-status">{copy.empty}</p> : null}

      <div className="stitch-plan-agenda-list">
        {dayGroups.map((group) => (
          <section key={group.key} className="stitch-plan-day-group" aria-label={`${group.dayLabel} ${group.dateLabel}`}>
            <div className="stitch-plan-day-heading">
              <span aria-hidden="true" />
              <div>
                <h3>{`${group.dayLabel} - ${group.dateLabel}`}</h3>
                <p>{[group.weekdayLabel, group.cityLabel].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            <div className="stitch-plan-day-items">
              {group.items.map((item) => {
                const itemExpenses = linkedExpensesByItem.get(item.id) ?? [];
                const expensePanelOpen = expensePanelItemId === item.id || expenseFormItemId === item.id;
                return (
                  <PlanAgendaItem
                    key={item.id}
                    canEdit={canEdit}
                    copy={copy}
                    currencyOptions={currencyOptions}
                    deletingExpenseId={deletingExpenseId}
                    deletingId={deletingId}
                    editing={editingId === item.id}
                    editingExpenseId={expenseFormItemId === item.id ? editingExpenseId : null}
                    expenseForm={expenseFormItemId === item.id ? expenseForm : null}
                    expensePanelOpen={expensePanelOpen}
                    expenseSubmitting={expenseSubmitting}
                    expenses={itemExpenses}
                    iconOption={getItineraryIconOption(item)}
                    item={item}
                    language={language}
                    form={form}
                    submitting={submitting}
                    travelerNameById={travelerNameById}
                    travelers={travelers}
                    expenseFormTravelers={expenseFormTravelers}
                    onCancelEdit={onCancelEdit}
                    onCancelExpense={onCancelExpense}
                    onDelete={onDelete}
                    onDeleteExpense={onDeleteExpense}
                    onEdit={onEdit}
                    onEditExpense={onEditExpense}
                    onExpenseFormChange={onExpenseFormChange}
                    onFormChange={onFormChange}
                    onOpenExpense={onOpenExpense}
                    onSubmit={onSubmit}
                    onSubmitExpense={onSubmitExpense}
                    onToggleExpensePanel={onToggleExpensePanel}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function PlanAgendaItem({
  canEdit,
  copy,
  currencyOptions,
  deletingExpenseId,
  deletingId,
  editing,
  editingExpenseId,
  expenseForm,
  expensePanelOpen,
  expenseSubmitting,
  expenses,
  iconOption,
  item,
  language,
  form,
  submitting,
  travelerNameById,
  travelers,
  expenseFormTravelers,
  onCancelEdit,
  onCancelExpense,
  onDelete,
  onDeleteExpense,
  onEdit,
  onEditExpense,
  onExpenseFormChange,
  onFormChange,
  onOpenExpense,
  onSubmit,
  onSubmitExpense,
  onToggleExpensePanel
}: {
  canEdit: boolean;
  copy: PlanCopy;
  currencyOptions: readonly SharedCurrency[];
  deletingExpenseId: string | null;
  deletingId: string | null;
  editing: boolean;
  editingExpenseId: string | null;
  expenseForm: ExpenseFormState | null;
  expensePanelOpen: boolean;
  expenseSubmitting: boolean;
  expenses: SharedExpense[];
  iconOption: ItineraryIconOption;
  item: SharedItineraryItem;
  language: Language;
  form: ItineraryInput;
  submitting: boolean;
  travelerNameById: Map<string, string>;
  travelers: Traveler[];
  expenseFormTravelers: Traveler[];
  onCancelEdit: () => void;
  onCancelExpense: () => void;
  onDelete: (item: SharedItineraryItem) => void;
  onDeleteExpense: (expense: SharedExpense) => void;
  onEdit: (item: SharedItineraryItem) => void;
  onEditExpense: (expense: SharedExpense) => void;
  onExpenseFormChange: (updater: (current: ExpenseFormState) => ExpenseFormState) => void;
  onFormChange: (updater: (current: ItineraryInput) => ItineraryInput) => void;
  onOpenExpense: (item: SharedItineraryItem) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitExpense: (item: SharedItineraryItem, event: FormEvent<HTMLFormElement>) => void;
  onToggleExpensePanel: (itemId: string) => void;
}) {
  const mapQuery = item.mapQuery || item.location || `${item.title} ${item.city}`;
  const expenseSummary = formatExpenseSummary(expenses, copy.noExpenses);
  const [managementOpen, setManagementOpen] = useState(false);

  return (
    <article className="stitch-plan-agenda-item stitch-plan-agenda-item--editable">
      <div className="stitch-plan-agenda-content">
        <div className="stitch-plan-agenda-main">
          <div>
            <h3>{item.title}</h3>
            <p>{formatItemMeta(item, copy.flexibleTime, language)}</p>
            <small>{[item.location, item.city].filter(Boolean).join(" · ")}</small>
          </div>
          <span className="stitch-plan-agenda-icon" title={itineraryIconLabel(iconOption, language)}>
            <MaterialIcon icon={iconOption.icon} />
          </span>
        </div>
        <div className="stitch-plan-agenda-actions">
          <a href={googleMapsSearchUrl(mapQuery)} target="_blank" rel="noopener noreferrer" className="stitch-plan-icon-action" aria-label={copy.map}>
            <MaterialIcon icon="map" />
            <span>{copy.map}</span>
          </a>
          <button type="button" className="stitch-plan-icon-action" onClick={() => onOpenExpense(item)} disabled={!canEdit}>
            <MaterialIcon icon="payments" />
            <span>{copy.expense}</span>
          </button>
          {canEdit ? (
            <>
              <button
                type="button"
                className="stitch-plan-icon-action"
                aria-expanded={managementOpen}
                onClick={() => setManagementOpen((current) => !current)}
              >
                <MaterialIcon icon="more_horiz" />
                <span>{copy.manage}</span>
              </button>
              {managementOpen ? (
                <div className="stitch-plan-manage-menu">
                  <button type="button" className="stitch-plan-icon-action" onClick={() => onEdit(item)}>
                    <MaterialIcon icon="edit" />
                    <span>{copy.edit}</span>
                  </button>
                  <button
                    type="button"
                    className="stitch-plan-icon-action stitch-plan-icon-action--danger"
                    onClick={() => onDelete(item)}
                    disabled={deletingId === item.id}
                  >
                    <MaterialIcon icon="delete" />
                    <span>{copy.delete}</span>
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
        <button type="button" className="stitch-plan-expense-summary" onClick={() => onToggleExpensePanel(item.id)}>
          <span>{copy.expenses}</span>
          <strong>{expenseSummary}</strong>
        </button>

        {editing ? (
          <PlanItemForm
            copy={copy}
            form={form}
            language={language}
            submitting={submitting}
            onCancel={onCancelEdit}
            onChange={onFormChange}
            onSubmit={onSubmit}
          />
        ) : null}

        {expensePanelOpen ? (
          <section className="stitch-plan-expense-panel" aria-label={copy.expenses}>
            {expenseForm ? (
              <ExpenseForm
                copy={copy}
                currencyOptions={currencyOptions}
                editingExpenseId={editingExpenseId}
                form={expenseForm}
                item={item}
                language={language}
                submitting={expenseSubmitting}
                travelers={expenseFormTravelers}
                onCancel={onCancelExpense}
                onChange={onExpenseFormChange}
                onSubmit={onSubmitExpense}
              />
            ) : null}
            <div className="stitch-plan-expense-list">
              {expenses.length === 0 ? <p>{copy.noExpenses}</p> : null}
              {expenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  copy={copy}
                  deletingExpenseId={deletingExpenseId}
                  expense={expense}
                  language={language}
                  travelerNameById={travelerNameById}
                  canEdit={canEdit}
                  onDelete={onDeleteExpense}
                  onEdit={onEditExpense}
                />
              ))}
            </div>
          </section>
        ) : null}

        {item.details ? <p className="stitch-plan-info-box">{item.details}</p> : null}
      </div>
    </article>
  );
}

function PlanItemForm({
  copy,
  form,
  language,
  submitting,
  onCancel,
  onChange,
  onSubmit
}: {
  copy: PlanCopy;
  form: ItineraryInput;
  language: Language;
  submitting: boolean;
  onCancel: () => void;
  onChange: (updater: (current: ItineraryInput) => ItineraryInput) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="stitch-plan-editor-form" onSubmit={onSubmit}>
      <div className="stitch-plan-form-grid">
        <TextField name="plan-date" label={copy.date} type="date" value={form.travelDate} onChange={(value) => onChange((current) => ({ ...current, travelDate: value }))} />
        <TextField name="plan-city" label={copy.city} value={form.city ?? ""} onChange={(value) => onChange((current) => ({ ...current, city: value }))} />
        <TextField name="plan-start" label={copy.startTime} type="time" value={form.startTime ?? ""} onChange={(value) => onChange((current) => ({ ...current, startTime: value }))} />
        <TextField name="plan-end" label={copy.endTime} type="time" value={form.endTime ?? ""} onChange={(value) => onChange((current) => ({ ...current, endTime: value }))} />
        <TextField name="plan-title" label={copy.title} value={form.title ?? ""} onChange={(value) => onChange((current) => ({ ...current, title: value }))} />
        <TextField name="plan-location" label={copy.location} value={form.location ?? ""} onChange={(value) => onChange((current) => ({ ...current, location: value, mapQuery: current.mapQuery || value }))} />
        <SelectField
          name="plan-icon"
          label={language === "zh" ? "图样" : "Icon"}
          value={formIconKey(form)}
          options={itineraryIconKeys}
          formatOption={(value) => itineraryIconLabel(getItineraryIconOptionByKey(value), language)}
          onChange={(value) => onChange((current) => ({ ...current, transport: itineraryIconToken(value) }))}
        />
      </div>
      <TextareaField
        name="plan-info"
        label={copy.info}
        value={form.details ?? ""}
        placeholder={copy.infoPlaceholder}
        onChange={(value) => onChange((current) => ({ ...current, details: value }))}
      />
      <div className="stitch-plan-form-actions">
        <button type="submit" disabled={submitting} className="stitch-plan-pill-button stitch-plan-pill-button--primary">
          {submitting ? copy.saving : copy.save}
        </button>
        <button type="button" disabled={submitting} className="stitch-plan-pill-button" onClick={onCancel}>
          {copy.cancel}
        </button>
      </div>
    </form>
  );
}

function ExpenseForm({
  copy,
  currencyOptions,
  editingExpenseId,
  form,
  item,
  language,
  submitting,
  travelers,
  onCancel,
  onChange,
  onSubmit
}: {
  copy: PlanCopy;
  currencyOptions: readonly SharedCurrency[];
  editingExpenseId: string | null;
  form: ExpenseFormState;
  item: SharedItineraryItem;
  language: Language;
  submitting: boolean;
  travelers: Traveler[];
  onCancel: () => void;
  onChange: (updater: (current: ExpenseFormState) => ExpenseFormState) => void;
  onSubmit: (item: SharedItineraryItem, event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="stitch-plan-editor-form" onSubmit={(event) => onSubmit(item, event)}>
      <div className="stitch-plan-form-grid">
        <TextField name={`${item.id}-expense-title`} label={copy.title} value={form.title} onChange={(value) => onChange((current) => ({ ...current, title: value }))} />
        <TextField name={`${item.id}-expense-amount`} label={copy.amount} type="number" value={form.amount} onChange={(value) => onChange((current) => ({ ...current, amount: value }))} />
        <SelectField name={`${item.id}-expense-currency`} label={copy.currency} value={form.currency} options={currencyOptions} onChange={(value) => onChange((current) => ({ ...current, currency: value as SharedCurrency }))} />
        <SelectField
          name={`${item.id}-expense-category`}
          label={copy.category}
          value={form.category}
          options={expenseCategories}
          formatOption={(option) => translateOption(language, option)}
          onChange={(value) => onChange((current) => ({ ...current, category: value as ExpenseCategory }))}
        />
        <SelectField
          name={`${item.id}-expense-paid-by`}
          label={copy.paidBy}
          value={form.paidByTravelerId}
          options={travelers.map((traveler) => traveler.id)}
          formatOption={(travelerId) => travelers.find((traveler) => traveler.id === travelerId)?.name ?? travelerId}
          onChange={(value) => onChange((current) => ({ ...current, paidByTravelerId: value }))}
        />
      </div>
      <fieldset className="stitch-plan-check-group">
        <legend>{copy.splitAmong}</legend>
        <div>
          {travelers.map((traveler) => (
            <label key={traveler.id}>
              <input
                type="checkbox"
                checked={form.splitTravelerIds.includes(traveler.id)}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    splitTravelerIds: event.target.checked
                      ? [...current.splitTravelerIds, traveler.id]
                      : current.splitTravelerIds.filter((travelerId) => travelerId !== traveler.id)
                  }))
                }
              />
              <span>{traveler.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="stitch-plan-settled-toggle">
        <input
          type="checkbox"
          checked={form.settled}
          onChange={(event) => onChange((current) => ({ ...current, settled: event.target.checked }))}
        />
        <span>{copy.settled}</span>
      </label>
      <TextareaField name={`${item.id}-expense-notes`} label={copy.notes} value={form.notes} onChange={(value) => onChange((current) => ({ ...current, notes: value }))} />
      <div className="stitch-plan-form-actions">
        <button type="submit" disabled={submitting} className="stitch-plan-pill-button stitch-plan-pill-button--primary">
          {submitting ? copy.saving : editingExpenseId ? copy.save : copy.expense}
        </button>
        <button type="button" disabled={submitting} className="stitch-plan-pill-button" onClick={onCancel}>
          {copy.cancel}
        </button>
      </div>
    </form>
  );
}

function ExpenseRow({
  copy,
  deletingExpenseId,
  expense,
  language,
  travelerNameById,
  canEdit,
  onDelete,
  onEdit
}: {
  copy: PlanCopy;
  deletingExpenseId: string | null;
  expense: SharedExpense;
  language: Language;
  travelerNameById: Map<string, string>;
  canEdit: boolean;
  onDelete: (expense: SharedExpense) => void;
  onEdit: (expense: SharedExpense) => void;
}) {
  return (
    <article className="stitch-plan-expense-row">
      <div>
        <strong>{expense.title}</strong>
        <span>
          {translateOption(language, expense.category)} · {travelerNameById.get(expense.paidByTravelerId) ?? expense.paidByTravelerId}
        </span>
      </div>
      <p>{formatMoney(expense.amount, expense.currency)}</p>
      {canEdit ? (
        <div>
          <button type="button" onClick={() => onEdit(expense)}>
            {copy.edit}
          </button>
          <button type="button" onClick={() => onDelete(expense)} disabled={deletingExpenseId === expense.id}>
            {copy.delete}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function TextField({
  name,
  label,
  value,
  onChange,
  type = "text"
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "date" | "number" | "text" | "time";
}) {
  return (
    <label className="stitch-plan-field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        autoComplete="off"
        inputMode={type === "number" ? "decimal" : undefined}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextareaField({
  name,
  label,
  value,
  onChange,
  placeholder
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="stitch-plan-field">
      <span>{label}</span>
      <textarea name={name} autoComplete="off" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
  formatOption
}: {
  name: string;
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  formatOption?: (value: T) => string;
}) {
  return (
    <label className="stitch-plan-field">
      <span>{label}</span>
      <select name={name} value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOption ? formatOption(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
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
    <article className="stitch-card stitch-destination-card stitch-plan-hero-card">
      <div className="stitch-destination-media">
        <img alt={imageAlt} src={imageSrc} />
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

function getDesktopNavItems(copy: PlanCopy) {
  return [
    { href: "/", icon: "home", label: copy.home, active: false },
    { href: "/itinerary", icon: "event_note", label: copy.plan, active: true },
    { href: "/bookings", icon: "confirmation_number", label: copy.book, active: false },
    { href: "/budget", icon: "payments", label: copy.money, active: false },
    { href: "/documents", icon: "description", label: copy.documents, active: false }
  ];
}

function getMobileNavItems(copy: PlanCopy) {
  return [
    { href: "/", icon: "today", label: copy.today, active: false },
    { href: "/itinerary", icon: "event_note", label: copy.plan, active: true },
    { href: "/bookings", icon: "confirmation_number", label: copy.book, active: false },
    { href: "/budget", icon: "payments", label: copy.money, active: false },
    { href: "/more", icon: "more_horiz", label: copy.more, active: false }
  ];
}

function IconButton({ icon, label, onClick, surface = false }: { icon: string; label: string; onClick?: () => void; surface?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`stitch-icon-button ${surface ? "stitch-icon-button--surface" : ""}`} aria-label={label}>
      <MaterialIcon icon={icon} />
    </button>
  );
}

function SosIconButton({ countries, label, surface = false }: { countries: { code: string; name: string }[]; label: string; surface?: boolean }) {
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

async function fetchItineraryJson(url: string, options: RequestInit | undefined, fallbackMessage: string): Promise<ItineraryApiResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = (await response.json()) as ItineraryApiResponse;

    if (!response.ok) {
      throw new Error(data.error ?? fallbackMessage);
    }

    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`${fallbackMessage} Request timed out. Please retry.`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchExpensesJson(
  url: string,
  options: RequestInit | undefined,
  fallbackMessage: string
): Promise<{ expenses: SharedExpense[]; travelers: Traveler[] }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = (await response.json()) as ExpensesApiResponse;

    if (!response.ok) {
      throw new Error(data.error ?? fallbackMessage);
    }

    return {
      expenses: Array.isArray(data.expenses) ? data.expenses.filter(isSharedExpense) : [],
      travelers: Array.isArray(data.travelers) ? data.travelers.filter(isTraveler) : []
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`${fallbackMessage} Request timed out. Please retry.`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function emptyItineraryForm(currency: SharedCurrency, trip: TripSettingsView, selectedDate: DateFilter): ItineraryInput {
  const firstStop = trip.routeStops[0];
  return {
    travelDate: selectedDate !== "All" ? selectedDate : trip.startDate ?? todayLocalDate(),
    city: firstStop?.city || trip.routeCities[0] || trip.destination || "",
    startTime: "",
    endTime: "",
    title: "",
    location: "",
    details: "",
    transport: itineraryIconToken("general"),
    meal: "",
    costAmount: null,
    currency,
    notes: "",
    mapQuery: "",
    sortOrder: 0
  };
}

function emptyExpenseForm(item: SharedItineraryItem, travelers: Traveler[], currency: SharedCurrency): ExpenseFormState {
  const orderedTravelers = orderTravelers(travelers);
  return {
    title: item.title,
    amount: "",
    currency,
    category: "Other",
    expenseDate: item.travelDate,
    paidByTravelerId: orderedTravelers[0]?.id ?? "person_a",
    splitTravelerIds: orderedTravelers.map((traveler) => traveler.id),
    settled: false,
    notes: ""
  };
}

function buildExpenseInput(item: SharedItineraryItem, form: ExpenseFormState): ExpenseInput {
  return {
    sourceType: "itinerary",
    sourceId: item.id,
    title: form.title.trim(),
    category: form.category,
    amount: Number(form.amount),
    currency: form.currency,
    paidByTravelerId: form.paidByTravelerId,
    splitTravelerIds: Array.from(new Set(form.splitTravelerIds)),
    settled: form.settled,
    expenseDate: item.travelDate,
    notes: form.notes.trim() || null
  };
}

function compareItineraryItems(left: SharedItineraryItem, right: SharedItineraryItem) {
  return (
    left.travelDate.localeCompare(right.travelDate) ||
    (left.startTime ?? "").localeCompare(right.startTime ?? "") ||
    (left.endTime ?? "").localeCompare(right.endTime ?? "") ||
    left.sortOrder - right.sortOrder ||
    left.title.localeCompare(right.title)
  );
}

function buildDateChips(dates: string[], selectedDate: DateFilter, language: Language, copy: PlanCopy): PlanDayChip[] {
  return dates.map((date, index) => ({
    key: date,
    label: formatDayLabel(index + 1, language, copy),
    subLabel: shortDate(date, language),
    value: date,
    active: selectedDate === date
  }));
}

function formatItemMeta(item: SharedItineraryItem, flexibleLabel: string, language: Language) {
  const time = item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : item.startTime || flexibleLabel;
  return `${formatDisplayDate(item.travelDate, language)} · ${time}`;
}

function formatExpenseSummary(expenses: SharedExpense[], emptyLabel: string) {
  if (expenses.length === 0) {
    return emptyLabel;
  }

  const totals = new Map<SharedCurrency, number>();
  for (const expense of expenses) {
    totals.set(expense.currency, (totals.get(expense.currency) ?? 0) + expense.amount);
  }

  return Array.from(totals.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, amount]) => formatMoney(amount, currency))
    .join(" / ");
}

function googleMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/${encodeURIComponent(query.trim())}`;
}

function buildDayGroups(
  items: SharedItineraryItem[],
  dateOptions: string[],
  language: Language,
  copy: PlanCopy
): PlanDayGroup[] {
  const groups = new Map<string, SharedItineraryItem[]>();

  for (const item of items.slice().sort(compareItineraryItems)) {
    const group = groups.get(item.travelDate) ?? [];
    group.push(item);
    groups.set(item.travelDate, group);
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, groupItems], fallbackIndex) => {
      const dateIndex = dateOptions.indexOf(date);
      const dayNumber = (dateIndex >= 0 ? dateIndex : fallbackIndex) + 1;

      return {
        key: date,
        dayLabel: formatDayLabel(dayNumber, language, copy),
        dateLabel: shortDate(date, language),
        weekdayLabel: formatWeekday(date, language),
        cityLabel: firstCityLabel(groupItems),
        items: groupItems
      };
    });
}

function firstCityLabel(items: SharedItineraryItem[]) {
  return items.find((item) => item.city.trim())?.city.trim() ?? "";
}

function formatDayLabel(dayNumber: number, language: Language, copy: PlanCopy) {
  return language === "zh" ? `第${formatChineseDayNumber(dayNumber)}天` : `${copy.dayLabel} ${dayNumber}`;
}

function formatChineseDayNumber(value: number) {
  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

  if (value <= 10) {
    return value === 10 ? "十" : digits[value] ?? String(value);
  }

  if (value < 20) {
    return `十${digits[value - 10] ?? ""}`;
  }

  if (value < 100) {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return `${digits[tens] ?? tens}十${ones === 0 ? "" : digits[ones] ?? ones}`;
  }

  return String(value);
}

function formatWeekday(value: string, language: Language) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return "";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en", {
    weekday: "long"
  }).format(new Date(year, month - 1, day));
}

function itineraryIconToken(key: ItineraryIconKey) {
  return `icon:${key}`;
}

function parseItineraryIconKey(value: string | null | undefined): ItineraryIconKey | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  const key = normalized.startsWith("icon:") ? normalized.slice(5) : normalized;
  return itineraryIconKeys.includes(key as ItineraryIconKey) ? (key as ItineraryIconKey) : null;
}

function formIconKey(form: ItineraryInput): ItineraryIconKey {
  return parseItineraryIconKey(form.transport) ?? "general";
}

function getItineraryIconOption(item: SharedItineraryItem) {
  return getItineraryIconOptionByKey(parseItineraryIconKey(item.transport) ?? inferItineraryIconKey(item));
}

function getItineraryIconOptionByKey(key: ItineraryIconKey): ItineraryIconOption {
  return itineraryIconOptions.find((option) => option.key === key) ?? defaultItineraryIconOption;
}

function itineraryIconLabel(option: ItineraryIconOption, language: Language) {
  return option.label[language] ?? option.label.en;
}

function inferItineraryIconKey(item: SharedItineraryItem): ItineraryIconKey {
  const text = [item.transport, item.title, item.location, item.details, item.meal, item.notes]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\b(flight|airport|arrival|departure|plane|terminal)\b/.test(text)) {
    return "flight";
  }

  if (/\b(train|bus|ferry|taxi|metro|transfer|transport|car|rail)\b/.test(text)) {
    return "transport";
  }

  if (/\b(food|meal|breakfast|lunch|dinner|restaurant|cafe|coffee)\b/.test(text)) {
    return "food";
  }

  if (/\b(hotel|resort|stay|check-in|check in|accommodation|lodging)\b/.test(text)) {
    return "hotel";
  }

  if (/\b(museum|tour|sight|sightseeing|attraction|cathedral|temple|park|gallery)\b/.test(text)) {
    return "sightseeing";
  }

  if (/\b(shop|shopping|market|mall|store)\b/.test(text)) {
    return "shopping";
  }

  return "general";
}

function withAllowedItineraryCurrency(form: ItineraryInput, currencies: readonly SharedCurrency[]) {
  if (form.currency && currencies.includes(form.currency)) {
    return form;
  }

  return { ...form, currency: currencies[0] };
}

function withAllowedExpenseCurrency(form: ExpenseFormState, currencies: readonly SharedCurrency[]) {
  if (currencies.includes(form.currency)) {
    return form;
  }

  return { ...form, currency: currencies[0] };
}

function orderTravelers(travelers: Traveler[]) {
  return travelers.slice().sort((left, right) => left.displayOrder - right.displayOrder);
}

function mergeExpenseFormTravelers(activeTravelers: Traveler[], allTravelers: Traveler[], form: ExpenseFormState) {
  const included = new Set(activeTravelers.map((traveler) => traveler.id));
  const selected = new Set([form.paidByTravelerId, ...form.splitTravelerIds]);
  const extra = allTravelers.filter((traveler) => selected.has(traveler.id) && !included.has(traveler.id));
  return orderTravelers([...activeTravelers, ...extra]);
}

function getPlanStops(trip: TripSettingsView): PlanStop[] {
  const routeStops = trip.routeStops
    .filter((stop) => stop.city || stop.country)
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((stop, index) => toPlanStop(stop, index));

  if (routeStops.length > 0) {
    return routeStops;
  }

  const routeCities = trip.routeCities.length > 0 ? trip.routeCities : splitRouteLabel(trip.routeLabel || trip.destination);
  const fallbackCities = routeCities.length > 0 ? routeCities : [trip.destination || "Trip route"];

  return fallbackCities.map((city, index) => ({
    key: `fallback-${index}-${city}`,
    city,
    country: null,
    startDate: index === 0 ? trip.startDate : null,
    endDate: index === fallbackCities.length - 1 ? trip.endDate : null,
    sortOrder: index
  }));
}

function toPlanStop(stop: TripSettingsRouteStopView, index: number): PlanStop {
  return {
    key: `${index}-${stop.city || stop.country || "route"}`,
    city: stop.city,
    country: stop.country,
    startDate: stop.startDate,
    endDate: stop.endDate,
    sortOrder: stop.sortOrder
  };
}

function getRouteStopVisual(stop: PlanStop | null, fallbackLabel: string) {
  const candidates = [stop?.city, stop?.country, fallbackLabel].filter(Boolean);

  for (const candidate of candidates) {
    const visual = routeStopVisuals[normalizeRouteStopKey(candidate ?? "")];
    if (visual) {
      return visual;
    }
  }

  return fallbackRouteStopVisual;
}

function getSosCountries(visual: ReturnType<typeof getDestinationVisualIdentity>) {
  const codes = visual.countryCodes.length > 0 ? visual.countryCodes : [visual.countryCode];
  const names = visual.countryNames.length > 0 ? visual.countryNames : [visual.countryName];
  const seen = new Set<string>();
  const countries = codes
    .map((code, index) => ({
      code: code.toUpperCase() === "UK" ? "GB" : code.toUpperCase(),
      name: names[index] ?? code
    }))
    .filter((country) => {
      if (!country.code || country.code === "GENERIC" || seen.has(country.code)) {
        return false;
      }

      seen.add(country.code);
      return true;
    });

  return countries.length > 0 ? countries : [{ code: "IT", name: "Italy" }];
}

function isItineraryItem(value: unknown): value is SharedItineraryItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<SharedItineraryItem>;
  return typeof item.id === "string" && typeof item.travelDate === "string" && typeof item.city === "string" && typeof item.title === "string";
}

function isSharedExpense(value: unknown): value is SharedExpense {
  if (!value || typeof value !== "object") {
    return false;
  }

  const expense = value as Partial<SharedExpense>;
  return (
    typeof expense.id === "string" &&
    typeof expense.sourceType === "string" &&
    typeof expense.title === "string" &&
    typeof expense.category === "string" &&
    typeof expense.amount === "number" &&
    typeof expense.currency === "string" &&
    typeof expense.paidByTravelerId === "string" &&
    Array.isArray(expense.splitTravelerIds) &&
    typeof expense.settled === "boolean" &&
    typeof expense.expenseDate === "string"
  );
}

function isTraveler(value: unknown): value is Traveler {
  if (!value || typeof value !== "object") {
    return false;
  }

  const traveler = value as Partial<Traveler>;
  return typeof traveler.id === "string" && typeof traveler.name === "string" && typeof traveler.displayOrder === "number";
}

function todayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function splitRouteLabel(value: string) {
  return value
    .split(/,|->|→|·/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeRouteStopKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formatStopDate(stop: PlanStop, fallback: string, language: Language, copy: PlanCopy) {
  if (stop.startDate && stop.endDate && stop.startDate !== stop.endDate) {
    return `${formatDisplayDate(stop.startDate, language)} - ${formatDisplayDate(stop.endDate, language)}`;
  }

  if (stop.startDate || stop.endDate) {
    return formatDisplayDate(stop.startDate ?? stop.endDate ?? "", language);
  }

  return fallback || copy.datePending;
}

function formatTripDateRange(startDate: string | null, endDate: string | null, fallback: string, language: Language) {
  if (startDate && endDate && startDate !== endDate) {
    return `${formatDisplayDate(startDate, language)} - ${formatDisplayDate(endDate, language)}`;
  }

  if (startDate || endDate) {
    return formatDisplayDate(startDate ?? endDate ?? "", language);
  }

  return fallback;
}

function shortDate(value: string, language: Language) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return value;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en", {
    day: "numeric",
    month: "short"
  }).format(new Date(year, month - 1, day));
}

function formatDisplayDate(value: string, language: Language) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return value;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function formatRouteLabel(value: string) {
  return value
    .split(/(,|·|->|→)/)
    .map((part) => (/^(,|·|->|→)$/.test(part) ? ` ${part.trim()} ` : formatPlaceLabel(part.trim())))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPlaceLabel(value: string) {
  return value
    .split(/(\s+|-|\/)/)
    .map((part) => {
      if (/^(\s+|-|\/)$/.test(part) || !part) {
        return part;
      }

      if (part.length <= 3 && part === part.toUpperCase()) {
        return part;
      }

      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}
