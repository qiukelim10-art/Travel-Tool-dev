"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { SectionHeader } from "@/components/SectionHeader";
import { useLanguage } from "@/lib/i18n";
import { bookingCurrencies, type TripSettingsInput, type TripSettingsResponse } from "@/lib/sharedDataTypes";
import { publishTripSettings } from "@/lib/useTripSettings";

type SettingsForm = TripSettingsInput;

const requestTimeoutMs = 10000;

const copy = {
  en: {
    eyebrow: "Trip setup",
    title: "Trip Settings",
    description: "Manage the active trip basics, travelers, route, and display defaults.",
    loading: "Loading trip settings...",
    loadError: "Unable to load trip settings.",
    saveError: "Unable to save trip settings.",
    saved: "Trip settings saved.",
    save: "Save settings",
    saving: "Saving...",
    noChanges: "No changes to save",
    basics: "Trip basics",
    currencies: "Defaults",
    travelers: "Travelers",
    route: "Route stops",
    name: "Trip name",
    destination: "Destination",
    startDate: "Start date",
    endDate: "End date",
    timezone: "Timezone",
    notes: "Notes",
    defaultCurrencies: "Default currencies",
    displayName: "Display name",
    active: "Active",
    inactive: "Inactive",
    addTraveler: "Add traveler",
    city: "City",
    country: "Country",
    addStop: "Add route stop",
    moveUp: "Up",
    moveDown: "Down",
    remove: "Remove",
    activeHint: "Inactive travelers stay available for historical records, but new forms use active travelers.",
    routeEmpty: "No route stops yet.",
    travelerEmpty: "Add at least one active traveler.",
    validationName: "Trip name is required.",
    validationDestination: "Destination is required.",
    validationCurrency: "Select at least one currency.",
    validationTraveler: "At least one active traveler is required.",
    validationRoute: "Route stop city is required."
  },
  zh: {
    eyebrow: "行程设置",
    title: "Trip Settings",
    description: "管理当前 active trip 的基础信息、成员、路线和默认显示。",
    loading: "正在加载行程设置...",
    loadError: "无法加载行程设置。",
    saveError: "无法保存行程设置。",
    saved: "行程设置已保存。",
    save: "保存设置",
    saving: "保存中...",
    noChanges: "没有需要保存的修改",
    basics: "行程基础信息",
    currencies: "默认设置",
    travelers: "成员",
    route: "路线城市",
    name: "行程名称",
    destination: "目的地",
    startDate: "开始日期",
    endDate: "结束日期",
    timezone: "时区",
    notes: "备注",
    defaultCurrencies: "默认币种",
    displayName: "显示名称",
    active: "启用",
    inactive: "停用",
    addTraveler: "新增成员",
    city: "城市",
    country: "国家",
    addStop: "新增路线城市",
    moveUp: "上移",
    moveDown: "下移",
    remove: "移除",
    activeHint: "停用成员仍会用于历史记录显示，新建表单只使用启用成员。",
    routeEmpty: "还没有路线城市。",
    travelerEmpty: "至少需要一个启用成员。",
    validationName: "请填写行程名称。",
    validationDestination: "请填写目的地。",
    validationCurrency: "请至少选择一个币种。",
    validationTraveler: "至少需要一个启用成员。",
    validationRoute: "请填写路线城市。"
  }
} as const;

type SettingsLabels = (typeof copy)[keyof typeof copy];

export default function SettingsPage() {
  const { language } = useLanguage();
  const labels = copy[language];
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const dirty = useMemo(() => (form ? JSON.stringify(normalizeForSave(form)) !== savedSnapshot : false), [form, savedSnapshot]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

    async function loadSettings() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/trip-settings", {
          cache: "no-store",
          signal: controller.signal
        });
        const data = (await response.json()) as Partial<TripSettingsResponse> & { error?: string };

        if (!response.ok || !data.trip || !Array.isArray(data.travelers) || !Array.isArray(data.routeStops)) {
          throw new Error(data.error ?? labels.loadError);
        }

        const nextForm = responseToForm(data as TripSettingsResponse);
        setForm(nextForm);
        setSavedSnapshot(JSON.stringify(normalizeForSave(nextForm)));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : labels.loadError);
      } finally {
        window.clearTimeout(timeoutId);
        setLoading(false);
      }
    }

    void loadSettings();

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [labels.loadError]);

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) {
      return;
    }

    const validationError = validateForm(form, labels);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/trip-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizeForSave(form))
      });
      const data = (await response.json()) as Partial<TripSettingsResponse> & { error?: string };

      if (!response.ok || !data.trip || !Array.isArray(data.travelers) || !Array.isArray(data.routeStops)) {
        throw new Error(data.error ?? labels.saveError);
      }

      const nextForm = responseToForm(data as TripSettingsResponse);
      publishTripSettings(data as TripSettingsResponse);
      setForm(nextForm);
      setSavedSnapshot(JSON.stringify(normalizeForSave(nextForm)));
      setNotice(labels.saved);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : labels.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-full min-w-0">
      <SectionHeader eyebrow={labels.eyebrow} title={labels.title} description={labels.description} />

      {loading ? <p className="text-sm text-zinc-600">{labels.loading}</p> : null}
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}

      {form ? (
        <form onSubmit={submitSettings} className="mobile-safe-form space-y-4">
          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">{labels.basics}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <TextField label={labels.name} value={form.trip.name} onChange={(value) => updateTrip(form, setForm, { name: value })} />
              <TextField label={labels.destination} value={form.trip.destination} onChange={(value) => updateTrip(form, setForm, { destination: value })} />
              <TextField label={labels.startDate} type="date" value={form.trip.startDate ?? ""} onChange={(value) => updateTrip(form, setForm, { startDate: value || null })} />
              <TextField label={labels.endDate} type="date" value={form.trip.endDate ?? ""} onChange={(value) => updateTrip(form, setForm, { endDate: value || null })} />
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">{labels.currencies}</h2>
            <fieldset className="mt-4 grid gap-2 sm:grid-cols-3">
              <legend className="sr-only">{labels.defaultCurrencies}</legend>
              {bookingCurrencies.map((currency) => (
                <label key={currency} className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={form.trip.defaultCurrencies.includes(currency)}
                    onChange={(event) => toggleCurrency(form, setForm, currency, event.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  {currency}
                </label>
              ))}
            </fieldset>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <TextField label={labels.timezone} value={form.trip.timezone} onChange={(value) => updateTrip(form, setForm, { timezone: value })} />
              <label className="block text-sm font-semibold text-ink">
                {labels.notes}
                <textarea
                  value={form.trip.notes ?? ""}
                  onChange={(event) => updateTrip(form, setForm, { notes: event.target.value || null })}
                  className="mt-2 block min-h-24 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
                />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink">{labels.travelers}</h2>
                <p className="mt-1 text-sm text-zinc-600">{labels.activeHint}</p>
              </div>
              <button type="button" onClick={() => addTraveler(form, setForm)} className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">
                {labels.addTraveler}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {form.travelers.length === 0 ? <p className="text-sm text-zinc-600">{labels.travelerEmpty}</p> : null}
              {form.travelers.map((traveler, index) => (
                <div key={traveler.id ?? `new-${index}`} className="grid gap-2 rounded-md bg-zinc-50 p-3 md:grid-cols-[1fr_auto]">
                  <TextField
                    label={labels.displayName}
                    value={traveler.displayName}
                    onChange={(value) => updateTraveler(form, setForm, index, { displayName: value })}
                  />
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink">
                      <input
                        type="checkbox"
                        checked={traveler.isActive}
                        onChange={(event) => updateTraveler(form, setForm, index, { isActive: event.target.checked })}
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      {traveler.isActive ? labels.active : labels.inactive}
                    </label>
                    <OrderButtons
                      index={index}
                      length={form.travelers.length}
                      onMove={(direction) => moveTraveler(form, setForm, index, direction)}
                      labels={labels}
                    />
                    {!traveler.id ? (
                      <button type="button" onClick={() => removeNewTraveler(form, setForm, index)} className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700">
                        {labels.remove}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-lg font-semibold text-ink">{labels.route}</h2>
              <button type="button" onClick={() => addRouteStop(form, setForm)} className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">
                {labels.addStop}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {form.routeStops.length === 0 ? <p className="text-sm text-zinc-600">{labels.routeEmpty}</p> : null}
              {form.routeStops.map((stop, index) => (
                <div key={stop.id ?? `new-${index}`} className="grid gap-2 rounded-md bg-zinc-50 p-3 md:grid-cols-[1fr_1fr_auto]">
                  <TextField label={labels.city} value={stop.city} onChange={(value) => updateRouteStop(form, setForm, index, { city: value })} />
                  <TextField label={labels.country} value={stop.country ?? ""} onChange={(value) => updateRouteStop(form, setForm, index, { country: value || null })} />
                  <div className="flex flex-wrap items-end gap-2">
                    <OrderButtons index={index} length={form.routeStops.length} onMove={(direction) => moveRouteStop(form, setForm, index, direction)} labels={labels} />
                    <button type="button" onClick={() => removeRouteStop(form, setForm, index)} className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700">
                      {labels.remove}
                    </button>
                  </div>
                  <TextField label={labels.startDate} type="date" value={stop.startDate ?? ""} onChange={(value) => updateRouteStop(form, setForm, index, { startDate: value || null })} />
                  <TextField label={labels.endDate} type="date" value={stop.endDate ?? ""} onChange={(value) => updateRouteStop(form, setForm, index, { endDate: value || null })} />
                </div>
              ))}
            </div>
          </section>

          <div className="sticky bottom-16 z-10 rounded-lg border border-zinc-200 bg-white/95 p-3 shadow-soft backdrop-blur md:bottom-4">
            <button
              type="submit"
              disabled={saving || !dirty}
              className="w-full rounded-md bg-moss px-3 py-2 text-base font-semibold text-white disabled:opacity-60 sm:w-auto sm:text-sm"
            >
              {saving ? labels.saving : dirty ? labels.save : labels.noChanges}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function responseToForm(response: TripSettingsResponse): SettingsForm {
  return {
    trip: {
      name: response.trip.name,
      destination: response.trip.destination,
      startDate: response.trip.startDate,
      endDate: response.trip.endDate,
      defaultCurrencies: response.trip.defaultCurrencies,
      timezone: response.trip.timezone || "Europe/Rome",
      notes: response.trip.notes
    },
    travelers: response.travelers
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((traveler) => ({
        id: traveler.id,
        displayName: traveler.displayName,
        displayOrder: traveler.displayOrder,
        isActive: traveler.isActive
      })),
    routeStops: response.routeStops
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((stop) => ({
        id: stop.id,
        city: stop.city,
        country: stop.country,
        startDate: stop.startDate,
        endDate: stop.endDate,
        sortOrder: stop.sortOrder
      }))
  };
}

function normalizeForSave(form: SettingsForm): SettingsForm {
  return {
    trip: {
      ...form.trip,
      name: form.trip.name.trim(),
      destination: form.trip.destination.trim(),
      timezone: form.trip.timezone.trim() || "Europe/Rome",
      notes: form.trip.notes?.trim() || null
    },
    travelers: form.travelers.map((traveler, index) => ({
      id: traveler.id,
      displayName: traveler.displayName.trim(),
      displayOrder: index + 1,
      isActive: traveler.isActive
    })),
    routeStops: form.routeStops.map((stop, index) => ({
      id: stop.id,
      city: stop.city.trim(),
      country: stop.country?.trim() || null,
      startDate: stop.startDate || null,
      endDate: stop.endDate || null,
      sortOrder: index + 1
    }))
  };
}

function validateForm(form: SettingsForm, labels: SettingsLabels) {
  if (!form.trip.name.trim()) {
    return labels.validationName;
  }
  if (!form.trip.destination.trim()) {
    return labels.validationDestination;
  }
  if (form.trip.defaultCurrencies.length === 0) {
    return labels.validationCurrency;
  }
  if (!form.travelers.some((traveler) => traveler.isActive)) {
    return labels.validationTraveler;
  }
  if (form.travelers.some((traveler) => !traveler.displayName.trim())) {
    return labels.travelerEmpty;
  }
  if (form.routeStops.some((stop) => !stop.city.trim())) {
    return labels.validationRoute;
  }
  return null;
}

function updateTrip(
  form: SettingsForm,
  setForm: (value: SettingsForm) => void,
  patch: Partial<SettingsForm["trip"]>
) {
  setForm({ ...form, trip: { ...form.trip, ...patch } });
}

function toggleCurrency(
  form: SettingsForm,
  setForm: (value: SettingsForm) => void,
  currency: SettingsForm["trip"]["defaultCurrencies"][number],
  checked: boolean
) {
  const currencies = checked
    ? Array.from(new Set([...form.trip.defaultCurrencies, currency]))
    : form.trip.defaultCurrencies.filter((current) => current !== currency);
  updateTrip(form, setForm, { defaultCurrencies: currencies });
}

function updateTraveler(
  form: SettingsForm,
  setForm: (value: SettingsForm) => void,
  index: number,
  patch: Partial<SettingsForm["travelers"][number]>
) {
  setForm({
    ...form,
    travelers: form.travelers.map((traveler, currentIndex) =>
      currentIndex === index ? { ...traveler, ...patch } : traveler
    )
  });
}

function addTraveler(form: SettingsForm, setForm: (value: SettingsForm) => void) {
  setForm({
    ...form,
    travelers: [
      ...form.travelers,
      {
        displayName: `Person ${form.travelers.length + 1}`,
        displayOrder: form.travelers.length + 1,
        isActive: true
      }
    ]
  });
}

function removeNewTraveler(form: SettingsForm, setForm: (value: SettingsForm) => void, index: number) {
  setForm({ ...form, travelers: form.travelers.filter((_, currentIndex) => currentIndex !== index) });
}

function moveTraveler(
  form: SettingsForm,
  setForm: (value: SettingsForm) => void,
  index: number,
  direction: -1 | 1
) {
  setForm({ ...form, travelers: moveItem(form.travelers, index, direction) });
}

function updateRouteStop(
  form: SettingsForm,
  setForm: (value: SettingsForm) => void,
  index: number,
  patch: Partial<SettingsForm["routeStops"][number]>
) {
  setForm({
    ...form,
    routeStops: form.routeStops.map((stop, currentIndex) =>
      currentIndex === index ? { ...stop, ...patch } : stop
    )
  });
}

function addRouteStop(form: SettingsForm, setForm: (value: SettingsForm) => void) {
  setForm({
    ...form,
    routeStops: [
      ...form.routeStops,
      {
        city: "",
        country: form.trip.destination,
        startDate: null,
        endDate: null,
        sortOrder: form.routeStops.length + 1
      }
    ]
  });
}

function removeRouteStop(form: SettingsForm, setForm: (value: SettingsForm) => void, index: number) {
  setForm({ ...form, routeStops: form.routeStops.filter((_, currentIndex) => currentIndex !== index) });
}

function moveRouteStop(
  form: SettingsForm,
  setForm: (value: SettingsForm) => void,
  index: number,
  direction: -1 | 1
) {
  setForm({ ...form, routeStops: moveItem(form.routeStops, index, direction) });
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }
  const next = items.slice();
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}

function OrderButtons({
  index,
  length,
  onMove,
  labels
}: {
  index: number;
  length: number;
  onMove: (direction: -1 | 1) => void;
  labels: SettingsLabels;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink disabled:opacity-50"
      >
        {labels.moveUp}
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === length - 1}
        className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink disabled:opacity-50"
      >
        {labels.moveDown}
      </button>
    </>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "date" | "text";
}) {
  return (
    <label className="block min-w-0 text-sm font-semibold text-ink">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
      />
    </label>
  );
}
