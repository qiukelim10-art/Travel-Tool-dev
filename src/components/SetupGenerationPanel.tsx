"use client";

import { useEffect, useMemo, useState } from "react";
import { useTripAccess } from "@/lib/access";
import { useLanguage } from "@/lib/i18n";
import {
  buildStarterWorkspace,
  getSetupTemplateOption,
  recommendedCurrenciesForTemplate,
  setupAccommodationModes,
  setupLuggageModes,
  setupTemplateOptions,
  setupTransportModes,
  setupTripStyles,
  type SetupAccommodationMode,
  type SetupGenerationInput,
  type SetupGenerationResponse,
  type SetupLuggageMode,
  type SetupTemplateId,
  type SetupTransportMode,
  type SetupTripStyle
} from "@/lib/setupTemplates";
import { bookingCurrencies, type SharedCurrency, type TripSettingsResponse } from "@/lib/sharedDataTypes";
import { publishTripSettings } from "@/lib/useTripSettings";

export type SetupGenerationBase = {
  tripName: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  timezone: string;
  defaultCurrencies: SharedCurrency[];
  travelerNames: string[];
  routeCities: string[];
  routeStops?: Array<{
    city: string;
    country?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }>;
};

type SetupGenerationPanelProps = {
  base: SetupGenerationBase;
  loadingBase?: boolean;
  surface?: "dashboard" | "settings" | "gate";
  onGenerated?: (settings: TripSettingsResponse, summary: SetupGenerationResponse["summary"]) => void;
};

type SetupFormState = {
  template: SetupTemplateId;
  tripName: string;
  destination: string;
  startDate: string;
  endDate: string;
  timezone: string;
  routeText: string;
  overnightText: string;
  dayTripText: string;
  travelerCount: number;
  travelerNames: string[];
  mainCurrency: SharedCurrency;
  additionalCurrencies: SharedCurrency[];
  tripStyle: SetupTripStyle;
  transportMode: SetupTransportMode;
  accommodationMode: SetupAccommodationMode;
  luggageMode: SetupLuggageMode;
  expenseSplittingEnabled: boolean;
};

const maxTravelers = 8;

const copy = {
  en: {
    titleDashboard: "Start with guided setup",
    titleGate: "Set up this trip workspace",
    titleSettings: "Guided setup generation",
    descriptionDashboard:
      "Choose the destination template, route, dates, travelers, style, transport, accommodation, luggage, budget mode, and currencies before filling the workspace.",
    descriptionGate:
      "Answer these starter questions first. After generation, the workspace opens with the selected destination template and planning defaults.",
    descriptionSettings:
      "Regenerate a safe starter workspace from the current trip basics, travelers, route, and rule-based destination template.",
    basics: "Trip basics",
    template: "Destination template",
    tripName: "Trip name",
    destination: "Destination country / region",
    route: "Cities / route",
    routeEmpty: "No route stops yet.",
    routePlaceholder: "Shanghai -> Hangzhou -> Suzhou",
    routeHelp: "Use arrows, commas, slash, semicolons, or line breaks. Examples: Shanghai, Tokyo, Seoul, Osaka -> Kyoto -> Nara.",
    routeDerivedHelp: "Generated from the Route stops section above. Edit route stops there to change this route.",
    overnightCities: "Overnight cities",
    overnightPlaceholder: "Osaka -> Kyoto",
    overnightHelp: "Leave blank to use route cities as overnight stops, except day trip cities.",
    dayTripCities: "Day trip cities",
    dayTripPlaceholder: "Nara / Kamakura",
    dayTripHelp: "Day trip cities get return transport planning, not accommodation.",
    startDate: "Start date",
    endDate: "End date",
    duration: "Duration",
    durationValue: "{days} days / {nights} nights",
    dateSummary: "Selected dates: {start} to {end}",
    dateHelp: "Dates are summarized as YYYY-MM-DD to avoid day/month confusion.",
    travelers: "Travelers",
    travelerCount: "Traveler count",
    travelerName: "Traveler {index}",
    travelerHint: "Blank names will become Traveler 1, Traveler 2, and so on. Person A/B/C/D is not used.",
    preferences: "Trip preferences",
    tripStyle: "Trip style",
    transport: "Transport mode",
    accommodation: "Accommodation",
    luggage: "Luggage",
    budget: "Budget setup",
    expenseSplitting: "Expense splitting",
    expenseSplittingYes: "Yes, enable shared splitting",
    expenseSplittingNo: "No, keep money planning light",
    mainCurrency: "Main currency",
    additionalCurrencies: "Destination / additional currencies",
    previewTitle: "Preview before generation",
    previewIntro: "This starter workspace will create:",
    previewPacking: "{count} packing items",
    previewDocuments: "{count} document checklist items",
    previewBookings: "{count} booking checklist items",
    previewReminders: "{count} reminders",
    previewItinerary: "{count} itinerary shell days",
    previewEmergency: "1 emergency card placeholder",
    previewMoney: "{count} budget categories and an empty expense ledger",
    previewDates: "Dates: {start} to {end} ({duration})",
    previewRouteCities: "detected route cities: {value}",
    previewRouteLegs: "route legs: {value}",
    previewOvernights: "{count} overnight accommodation city/cities",
    previewDayTrips: "{count} day trip planning city/cities",
    previewSeason: "season profile: {value}; seasonal packing included: {flag}",
    flagYes: "yes",
    flagNo: "no",
    previewSplitOn: "shared expense splitting fields enabled",
    previewSplitOff: "light money planning without emphasizing settlements",
    impactTitle: "Confirm generation",
    impact:
      "This will regenerate the starter workspace based on your setup. Existing starter checklists, booking checklist, packing list, documents checklist, reminders, itinerary shell, budget category plan, and expense ledger will be replaced.",
    confirm: "I understand this will replace the current active workspace starter content.",
    run: "Generate starter workspace",
    running: "Generating...",
    loading: "Loading current trip settings before generation...",
    disabled: "Editor mode is required to run setup generation.",
    validationPreview: "Complete the setup questions before generation.",
    validationConfirm: "Confirm replacement before running setup generation.",
    validationTemplate: "Choose a destination template before generation.",
    validationTripName: "Trip name is required before generation.",
    validationDestination: "Destination country / region is required before generation.",
    validationDates: "Start date and end date are required in YYYY-MM-DD format.",
    validationDateRange: "End date must be on or after start date. Current range: {start} to {end}.",
    validationTravelerCount: "Traveler count must be between 1 and 8.",
    success: "Starter workspace generated.",
    successGate: "Starter workspace generated. Opening the dashboard...",
    summary: "Generated",
    optionBalanced: "Balanced",
    optionRelaxed: "Relaxed",
    optionPacked: "Packed",
    optionShopping: "Shopping focused",
    optionFood: "Food focused",
    optionFamily: "Family friendly",
    optionPublicTransport: "Public transport",
    optionRail: "Rail / train",
    optionCarRental: "Car rental",
    optionMixedTransport: "Mixed",
    optionUndecided: "Undecided",
    optionHotel: "Hotel",
    optionAirbnb: "Airbnb",
    optionMixedAccommodation: "Mixed",
    optionCarryOn: "Carry-on only",
    optionCheckedLuggage: "Checked luggage",
    optionMixedLuggage: "Mixed",
    templateChinaCity: "China city general / 中国城市通用",
    templateChinaMulti: "China multi-city / 中国多城市",
    templateJapan: "Japan general / 日本通用",
    templateKorea: "Korea general / 韩国通用",
    templateGeneric: "Generic international / 国际旅行通用"
  },
  zh: {
    titleDashboard: "先用引导式模板生成",
    titleGate: "先设置这个 trip workspace",
    titleSettings: "引导式模板生成",
    descriptionDashboard: "先选择目的地模板、路线、日期、成员、行程偏好、交通、住宿、行李、分账和币种，再生成 workspace 初始内容。",
    descriptionGate: "先回答这些 starter 问题。生成完成后，系统会带你进入已经套用目的地模板和规划默认值的首页。",
    descriptionSettings: "基于当前行程基础信息、成员、路线和目的地规则模板，重新生成安全的 starter workspace。",
    basics: "行程基础",
    template: "目的地模板",
    tripName: "行程名称",
    destination: "目的地国家 / 地区",
    route: "城市 / 路线",
    routeEmpty: "还没有路线城市。",
    routePlaceholder: "上海 -> 杭州 -> 苏州",
    routeHelp: "支持箭头、逗号、斜杠、分号、顿号或换行。例如：上海、东京、首尔、大阪 -> 京都 -> 奈良。",
    routeDerivedHelp: "这里会根据上方 Route stops 自动生成。需要修改路线时，请编辑上方路线城市。",
    overnightCities: "过夜城市",
    overnightPlaceholder: "大阪 -> 京都",
    overnightHelp: "留空时会按路线城市生成住宿，但会排除当天往返城市。",
    dayTripCities: "当天往返城市",
    dayTripPlaceholder: "奈良 / 镰仓",
    dayTripHelp: "当天往返城市只生成往返交通规划，不生成住宿。",
    startDate: "开始日期",
    endDate: "结束日期",
    duration: "天数",
    durationValue: "{days} 天 / {nights} 晚",
    dateSummary: "已选日期：{start} 至 {end}",
    dateHelp: "日期会用 YYYY-MM-DD 摘要显示，避免日/月顺序混淆。",
    travelers: "旅客",
    travelerCount: "旅客人数",
    travelerName: "旅客 {index}",
    travelerHint: "名字留空时会生成 Traveler 1、Traveler 2 等默认名，不再使用 Person A/B/C/D。",
    preferences: "行程偏好",
    tripStyle: "行程风格",
    transport: "交通模式",
    accommodation: "住宿模式",
    luggage: "行李模式",
    budget: "预算设置",
    expenseSplitting: "是否启用分账",
    expenseSplittingYes: "启用共同分账",
    expenseSplittingNo: "不启用，只保留轻量预算规划",
    mainCurrency: "主要币种",
    additionalCurrencies: "目的地 / 额外币种",
    previewTitle: "生成前预览",
    previewIntro: "将生成：",
    previewPacking: "{count} 个 packing items",
    previewDocuments: "{count} 个 document checklist items",
    previewBookings: "{count} 个 booking checklist items",
    previewReminders: "{count} 个 reminders",
    previewItinerary: "{count} 天 itinerary shell",
    previewEmergency: "1 张 emergency card placeholder",
    previewMoney: "{count} 个预算分类，并保留空的费用账本",
    previewDates: "日期：{start} 至 {end}（{duration}）",
    previewRouteCities: "识别到的路线城市：{value}",
    previewRouteLegs: "路线段：{value}",
    previewOvernights: "{count} 个过夜住宿城市",
    previewDayTrips: "{count} 个当天往返规划城市",
    previewSeason: "季节：{value}；已包含季节 packing：{flag}",
    flagYes: "是",
    flagNo: "否",
    previewSplitOn: "启用 paid by / split between 分账字段",
    previewSplitOff: "轻量预算规划，不强调结算建议",
    impactTitle: "确认生成",
    impact:
      "这会根据你的设置重新生成 starter workspace。现有的 starter checklist、booking checklist、packing list、documents checklist、reminders、itinerary shell、预算分类计划和费用账本会被替换。",
    confirm: "我确认要替换当前 active workspace 的 starter 内容。",
    run: "生成 starter workspace",
    running: "生成中...",
    loading: "正在读取当前行程设置，读取完成后才能生成模板。",
    disabled: "需要 editor mode 才能运行模板生成。",
    validationPreview: "请先补全 setup 问题再生成。",
    validationConfirm: "运行前请先确认替换当前内容。",
    validationTemplate: "请先选择目的地模板。",
    validationTripName: "请先填写行程名称。",
    validationDestination: "请先填写目的地国家 / 地区。",
    validationDates: "请用 YYYY-MM-DD 格式填写开始日期和结束日期。",
    validationDateRange: "结束日期必须晚于或等于开始日期。当前范围：{start} 至 {end}。",
    validationTravelerCount: "旅客人数必须在 1 到 8 之间。",
    success: "Starter workspace 已生成。",
    successGate: "Starter workspace 已生成，正在打开首页...",
    summary: "已生成",
    optionBalanced: "均衡",
    optionRelaxed: "轻松",
    optionPacked: "紧凑",
    optionShopping: "购物为主",
    optionFood: "美食为主",
    optionFamily: "家庭友好",
    optionPublicTransport: "公共交通",
    optionRail: "铁路 / 高铁",
    optionCarRental: "自驾",
    optionMixedTransport: "混合",
    optionUndecided: "还没决定",
    optionHotel: "酒店",
    optionAirbnb: "民宿",
    optionMixedAccommodation: "混合",
    optionCarryOn: "随身行李",
    optionCheckedLuggage: "托运行李",
    optionMixedLuggage: "混合",
    templateChinaCity: "China city general / 中国城市通用",
    templateChinaMulti: "China multi-city / 中国多城市",
    templateJapan: "Japan general / 日本通用",
    templateKorea: "Korea general / 韩国通用",
    templateGeneric: "Generic international / 国际旅行通用"
  }
} as const;

type Labels = (typeof copy)[keyof typeof copy];

export function SetupGenerationPanel({
  base,
  loadingBase = false,
  surface = "settings",
  onGenerated
}: SetupGenerationPanelProps) {
  const { language } = useLanguage();
  const { mode } = useTripAccess();
  const canEdit = mode === "editor";
  const labels = copy[language];
  const [form, setForm] = useState<SetupFormState>(() => buildInitialForm(base, surface));
  const [initializedFromBase, setInitializedFromBase] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const title = surface === "gate" ? labels.titleGate : surface === "dashboard" ? labels.titleDashboard : labels.titleSettings;
  const description =
    surface === "gate" ? labels.descriptionGate : surface === "dashboard" ? labels.descriptionDashboard : labels.descriptionSettings;
  const derivedRouteText = useMemo(() => buildRouteTextFromBase(base), [base]);

  useEffect(() => {
    if (!loadingBase && !initializedFromBase) {
      setForm(buildInitialForm(base, surface));
      setInitializedFromBase(true);
    }
  }, [base, initializedFromBase, loadingBase, surface]);

  useEffect(() => {
    if (surface !== "settings" || loadingBase || !initializedFromBase) {
      return;
    }

    setForm((current) =>
      current.routeText === derivedRouteText ? current : { ...current, routeText: derivedRouteText }
    );
  }, [derivedRouteText, initializedFromBase, loadingBase, surface]);

  const generationInput = useMemo(() => buildGenerationInput(form), [form]);
  const formValidationError = useMemo(() => validateSetupForm(form, labels), [form, labels]);
  const preview = useMemo(() => {
    if (formValidationError) {
      return { workspace: null, error: formValidationError };
    }
    try {
      return { workspace: buildStarterWorkspace(generationInput), error: null as string | null };
    } catch (previewError) {
      return {
        workspace: null,
        error: previewError instanceof Error ? previewError.message : labels.validationPreview
      };
    }
  }, [formValidationError, generationInput, labels.validationPreview]);
  const duration = getDurationInfo(form.startDate, form.endDate);
  const canRunGeneration = canEdit && !loadingBase && !submitting && confirmed && Boolean(preview.workspace) && !preview.error;

  async function runSetupGeneration() {
    if (!canEdit) {
      setError(labels.disabled);
      return;
    }
    if (loadingBase) {
      setError(labels.loading);
      return;
    }
    if (preview.error || !preview.workspace) {
      setError(preview.error ?? labels.validationPreview);
      return;
    }
    if (!confirmed) {
      setError(labels.validationConfirm);
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/setup-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...generationInput, confirmReplaceStarterContent: true })
      });
      const data = (await response.json()) as Partial<SetupGenerationResponse> & { error?: string };

      if (!response.ok || !data.settings || !data.summary) {
        throw new Error(data.error ?? "Unable to generate starter workspace.");
      }

      publishTripSettings(data.settings);
      setConfirmed(false);
      setNotice(surface === "gate" ? labels.successGate : formatGenerationNotice(data.summary, labels));
      onGenerated?.(data.settings, data.summary);
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : "Unable to generate starter workspace.");
    } finally {
      setSubmitting(false);
    }
  }

  function updateTemplate(value: string) {
    const nextTemplate = value as SetupTemplateId;
    const option = getSetupTemplateOption(nextTemplate);
    setForm((current) => ({
      ...current,
      template: nextTemplate,
      destination: option.defaultDestination,
      routeText: surface === "settings" ? derivedRouteText : option.defaultCities.join(" -> "),
      overnightText: "",
      dayTripText: "",
      timezone: option.defaultTimezone,
      mainCurrency: recommendedCurrenciesForTemplate(nextTemplate)[0],
      additionalCurrencies: recommendedCurrenciesForTemplate(nextTemplate).slice(1)
    }));
  }

  return (
    <section
      className={
        surface === "gate"
          ? "rounded-lg border border-zinc-200 bg-white p-5 shadow-soft sm:p-6"
          : "rounded-lg border border-zinc-200 bg-white p-4 shadow-soft"
      }
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="text-sm leading-6 text-zinc-600">{description}</p>
      </div>

      {loadingBase ? (
        <p role="status" aria-live="polite" className="mt-3 rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
          {labels.loading}
        </p>
      ) : null}

      <div className="mt-4 space-y-4">
        <fieldset className="rounded-md border border-zinc-200 p-3">
          <legend className="px-1 text-sm font-semibold text-ink">{labels.basics}</legend>
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              name={`${surface}-setup-template`}
              label={labels.template}
              value={form.template}
              options={setupTemplateOptions.map((option) => option.id)}
              optionLabels={setupTemplateLabels(labels)}
              onChange={updateTemplate}
            />
            <TextField
              name={`${surface}-setup-trip-name`}
              label={labels.tripName}
              value={form.tripName}
              onChange={(value) => setForm((current) => ({ ...current, tripName: value }))}
            />
            <TextField
              name={`${surface}-setup-destination`}
              label={labels.destination}
              value={form.destination}
              onChange={(value) => setForm((current) => ({ ...current, destination: value }))}
            />
            <TextField
              name={`${surface}-setup-start-date`}
              label={labels.startDate}
              type="date"
              value={form.startDate}
              onChange={(value) => setForm((current) => ({ ...current, startDate: value }))}
            />
            <TextField
              name={`${surface}-setup-end-date`}
              label={labels.endDate}
              type="date"
              value={form.endDate}
              onChange={(value) => setForm((current) => ({ ...current, endDate: value }))}
            />
            <div className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2">
              <p className="text-sm font-semibold text-ink">{labels.duration}</p>
              <p className="mt-1 text-sm text-zinc-600">
                {duration.valid ? formatDurationLabel(duration, labels) : "-"}
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {duration.hasBothDates
                  ? labels.dateSummary
                      .replace("{start}", formatIsoDate(form.startDate))
                      .replace("{end}", formatIsoDate(form.endDate))
                  : labels.dateHelp}
              </p>
            </div>
          </div>
          {surface === "settings" ? (
            <div className="mt-3 block text-sm font-semibold text-ink">
              <span>{labels.route}</span>
              <p className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-base font-normal text-zinc-700 sm:text-sm">
                {form.routeText || labels.routeEmpty}
              </p>
              <span className="mt-1 block text-xs font-normal leading-5 text-zinc-500">{labels.routeDerivedHelp}</span>
            </div>
          ) : (
            <label className="mt-3 block text-sm font-semibold text-ink">
              {labels.route}
              <textarea
                name={`${surface}-setup-route`}
                value={form.routeText}
                onChange={(event) => setForm((current) => ({ ...current, routeText: event.target.value }))}
                placeholder={labels.routePlaceholder}
                rows={2}
                className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
              />
              <span className="mt-1 block text-xs font-normal leading-5 text-zinc-500">{labels.routeHelp}</span>
            </label>
          )}
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-semibold text-ink">
              {labels.overnightCities}
              <textarea
                name={`${surface}-setup-overnight-cities`}
                value={form.overnightText}
                onChange={(event) => setForm((current) => ({ ...current, overnightText: event.target.value }))}
                placeholder={labels.overnightPlaceholder}
                rows={2}
                className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
              />
              <span className="mt-1 block text-xs font-normal leading-5 text-zinc-500">{labels.overnightHelp}</span>
            </label>
            <label className="block text-sm font-semibold text-ink">
              {labels.dayTripCities}
              <textarea
                name={`${surface}-setup-day-trip-cities`}
                value={form.dayTripText}
                onChange={(event) => setForm((current) => ({ ...current, dayTripText: event.target.value }))}
                placeholder={labels.dayTripPlaceholder}
                rows={2}
                className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
              />
              <span className="mt-1 block text-xs font-normal leading-5 text-zinc-500">{labels.dayTripHelp}</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-md border border-zinc-200 p-3">
          <legend className="px-1 text-sm font-semibold text-ink">{labels.travelers}</legend>
          <div className="grid gap-3 md:grid-cols-2">
            <NumberField
              name={`${surface}-setup-traveler-count`}
              label={labels.travelerCount}
              value={form.travelerCount}
              min={1}
              max={maxTravelers}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  travelerCount: value,
                  travelerNames: resizeTravelerNames(current.travelerNames, value)
                }))
              }
            />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {Array.from({ length: form.travelerCount }, (_, index) => (
              <TextField
                key={index}
                name={`${surface}-setup-traveler-${index + 1}`}
                label={labels.travelerName.replace("{index}", String(index + 1))}
                value={form.travelerNames[index] ?? ""}
                onChange={(value) =>
                  setForm((current) => {
                    const nextNames = resizeTravelerNames(current.travelerNames, current.travelerCount);
                    nextNames[index] = value;
                    return { ...current, travelerNames: nextNames };
                  })
                }
              />
            ))}
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-500">{labels.travelerHint}</p>
        </fieldset>

        <fieldset className="rounded-md border border-zinc-200 p-3">
          <legend className="px-1 text-sm font-semibold text-ink">{labels.preferences}</legend>
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              name={`${surface}-setup-trip-style`}
              label={labels.tripStyle}
              value={form.tripStyle}
              options={setupTripStyles}
              optionLabels={setupTripStyleLabels(labels)}
              onChange={(value) => setForm((current) => ({ ...current, tripStyle: value as SetupTripStyle }))}
            />
            <SelectField
              name={`${surface}-setup-transport`}
              label={labels.transport}
              value={form.transportMode}
              options={setupTransportModes}
              optionLabels={setupTransportLabels(labels)}
              onChange={(value) => setForm((current) => ({ ...current, transportMode: value as SetupTransportMode }))}
            />
            <SelectField
              name={`${surface}-setup-accommodation`}
              label={labels.accommodation}
              value={form.accommodationMode}
              options={setupAccommodationModes}
              optionLabels={setupAccommodationLabels(labels)}
              onChange={(value) => setForm((current) => ({ ...current, accommodationMode: value as SetupAccommodationMode }))}
            />
            <SelectField
              name={`${surface}-setup-luggage`}
              label={labels.luggage}
              value={form.luggageMode}
              options={setupLuggageModes}
              optionLabels={setupLuggageLabels(labels)}
              onChange={(value) => setForm((current) => ({ ...current, luggageMode: value as SetupLuggageMode }))}
            />
          </div>
        </fieldset>

        <fieldset className="rounded-md border border-zinc-200 p-3">
          <legend className="px-1 text-sm font-semibold text-ink">{labels.budget}</legend>
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              name={`${surface}-setup-expense-splitting`}
              label={labels.expenseSplitting}
              value={form.expenseSplittingEnabled ? "yes" : "no"}
              options={["yes", "no"]}
              optionLabels={new Map([
                ["yes", labels.expenseSplittingYes],
                ["no", labels.expenseSplittingNo]
              ])}
              onChange={(value) => setForm((current) => ({ ...current, expenseSplittingEnabled: value === "yes" }))}
            />
            <SelectField
              name={`${surface}-setup-main-currency`}
              label={labels.mainCurrency}
              value={form.mainCurrency}
              options={bookingCurrencies}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  mainCurrency: value as SharedCurrency,
                  additionalCurrencies: current.additionalCurrencies.filter((currency) => currency !== value)
                }))
              }
            />
          </div>
          <CurrencyChecklist
            label={labels.additionalCurrencies}
            mainCurrency={form.mainCurrency}
            values={form.additionalCurrencies}
            onChange={(values) => setForm((current) => ({ ...current, additionalCurrencies: values }))}
          />
        </fieldset>
      </div>

      <PreviewBox labels={labels} preview={preview} />

      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
        <p className="text-sm font-semibold text-amber-900">{labels.impactTitle}</p>
        <p className="mt-1 text-sm leading-6 text-amber-800">{labels.impact}</p>
        <label className="mt-3 flex gap-2 text-sm font-semibold text-amber-900">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-amber-300"
          />
          <span>{labels.confirm}</span>
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          {notice}
        </p>
      ) : null}

      {!canEdit ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {labels.disabled}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void runSetupGeneration()}
        disabled={!canRunGeneration}
        className="mt-4 w-full rounded-md bg-moss px-3 py-2 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 sm:w-auto sm:text-sm"
      >
        {submitting ? labels.running : labels.run}
      </button>
    </section>
  );
}

function buildInitialForm(base: SetupGenerationBase, surface: SetupGenerationPanelProps["surface"] = "settings"): SetupFormState {
  const template = inferTemplate(base);
  const currencies = base.defaultCurrencies.length > 0 ? base.defaultCurrencies : recommendedCurrenciesForTemplate(template);
  const travelerCount = clampTravelerCount(base.travelerNames.length || 4);
  const templateOption = getSetupTemplateOption(template);
  const routeText = buildRouteTextFromBase(base);

  return {
    template,
    tripName: base.tripName || "New trip workspace",
    destination: base.destination || templateOption.defaultDestination,
    startDate: base.startDate ?? "",
    endDate: base.endDate ?? "",
    timezone: base.timezone || templateOption.defaultTimezone,
    routeText: routeText || (surface === "settings" ? "" : templateOption.defaultCities.join(" -> ")),
    overnightText: "",
    dayTripText: "",
    travelerCount,
    travelerNames: resizeTravelerNames(base.travelerNames, travelerCount),
    mainCurrency: currencies[0] ?? "SGD",
    additionalCurrencies: currencies.slice(1),
    tripStyle: "balanced",
    transportMode: template === "china-multi-city" || template === "japan-general" ? "rail" : "public-transport",
    accommodationMode: "hotel",
    luggageMode: "checked-luggage",
    expenseSplittingEnabled: true
  };
}

function buildRouteTextFromBase(base: SetupGenerationBase) {
  const stopCities = base.routeStops
    ?.map((stop) => stop.city.trim())
    .filter(Boolean);
  const routeCities = stopCities?.length ? stopCities : base.routeCities.map((city) => city.trim()).filter(Boolean);

  return routeCities.join(" -> ");
}

function buildGenerationInput(form: SetupFormState): SetupGenerationInput {
  return {
    templateId: form.template,
    tripName: form.tripName,
    destination: form.destination,
    startDate: form.startDate,
    endDate: form.endDate,
    timezone: form.timezone,
    defaultCurrencies: Array.from(new Set([form.mainCurrency, ...form.additionalCurrencies])),
    travelerCount: form.travelerCount,
    travelerNames: normalizeTravelerNames(form.travelerNames, form.travelerCount),
    routeCities: parseRouteText(form.routeText),
    overnightCities: parseRouteText(form.overnightText),
    dayTripCities: parseRouteText(form.dayTripText),
    tripStyle: form.tripStyle,
    transportMode: form.transportMode,
    accommodationMode: form.accommodationMode,
    luggageMode: form.luggageMode,
    expenseSplittingEnabled: form.expenseSplittingEnabled
  };
}

function normalizeTravelerNames(names: string[], count: number) {
  return Array.from({ length: count }, (_, index) => names[index]?.trim() || `Traveler ${index + 1}`);
}

function parseRouteText(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\s*(?:->|→|,|，|\/|、|;|；|\r?\n)\s*/g)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ).slice(0, 8);
}

function resizeTravelerNames(names: string[], count: number) {
  return Array.from({ length: count }, (_, index) => names[index] ?? "");
}

function clampTravelerCount(value: number) {
  return Math.min(maxTravelers, Math.max(1, Math.floor(value)));
}

function validateSetupForm(form: SetupFormState, labels: Labels) {
  if (!setupTemplateOptions.some((template) => template.id === form.template)) {
    return labels.validationTemplate;
  }
  if (!form.tripName.trim()) {
    return labels.validationTripName;
  }
  if (!form.destination.trim()) {
    return labels.validationDestination;
  }
  if (!isIsoDateInput(form.startDate) || !isIsoDateInput(form.endDate)) {
    return labels.validationDates;
  }
  if (form.startDate > form.endDate) {
    return labels.validationDateRange
      .replace("{start}", formatIsoDate(form.startDate))
      .replace("{end}", formatIsoDate(form.endDate));
  }
  if (form.travelerCount < 1 || form.travelerCount > maxTravelers) {
    return labels.validationTravelerCount;
  }

  return null;
}

function inferTemplate(base: SetupGenerationBase): SetupTemplateId {
  const destination = base.destination.toLowerCase();
  if (destination.includes("japan")) {
    return "japan-general";
  }
  if (destination.includes("korea") || destination.includes("seoul")) {
    return "korea-general";
  }
  if (destination.includes("china") || destination.includes("shanghai") || destination.includes("beijing")) {
    return base.routeCities.length > 1 ? "china-multi-city" : "china-city-general";
  }
  return "generic-international";
}

function getDurationInfo(startDate: string, endDate: string) {
  const hasBothDates = isIsoDateInput(startDate) && isIsoDateInput(endDate);
  if (!hasBothDates || startDate > endDate) {
    return { days: 0, nights: 0, valid: false, hasBothDates };
  }
  const start = Date.UTC(Number(startDate.slice(0, 4)), Number(startDate.slice(5, 7)) - 1, Number(startDate.slice(8, 10)));
  const end = Date.UTC(Number(endDate.slice(0, 4)), Number(endDate.slice(5, 7)) - 1, Number(endDate.slice(8, 10)));
  const days = Math.floor((end - start) / 86400000) + 1;
  return { days, nights: Math.max(0, days - 1), valid: true, hasBothDates };
}

function formatDurationLabel(duration: ReturnType<typeof getDurationInfo>, labels: Labels) {
  return labels.durationValue.replace("{days}", String(duration.days)).replace("{nights}", String(duration.nights));
}

function isIsoDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatIsoDate(value: string) {
  return isIsoDateInput(value) ? value : "YYYY-MM-DD";
}

function formatGenerationNotice(summary: SetupGenerationResponse["summary"], labels: Labels) {
  return `${labels.success} ${labels.summary}: ${summary.routeStopCount} route stops, ${summary.reminderCount} reminders, ${summary.bookingCount} bookings, ${summary.itineraryCount} itinerary items, ${summary.packingCount} packing items, ${summary.documentCount} documents.`;
}

function PreviewBox({
  labels,
  preview
}: {
  labels: Labels;
  preview: { workspace: ReturnType<typeof buildStarterWorkspace> | null; error: string | null };
}) {
  if (preview.error || !preview.workspace) {
    return (
      <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
        <p className="text-sm font-semibold text-ink">{labels.previewTitle}</p>
        <p className="mt-1 text-sm text-zinc-600">{preview.error ?? labels.validationPreview}</p>
      </div>
    );
  }

  const { summary } = preview.workspace;
  const settings = preview.workspace.settings.trip;
  const previewStartDate = settings.startDate ?? "";
  const previewEndDate = settings.endDate ?? "";
  const duration = getDurationInfo(previewStartDate, previewEndDate);
  const items = [
    labels.previewDates
      .replace("{start}", formatIsoDate(previewStartDate))
      .replace("{end}", formatIsoDate(previewEndDate))
      .replace("{duration}", formatDurationLabel(duration, labels)),
    labels.previewRouteCities.replace("{value}", summary.routeCities.length > 0 ? summary.routeCities.join(" -> ") : "-"),
    labels.previewRouteLegs.replace("{value}", summary.routeLegs.length > 0 ? summary.routeLegs.join("; ") : "-"),
    labels.previewOvernights.replace("{count}", String(summary.overnightCityCount)),
    labels.previewDayTrips.replace("{count}", String(summary.dayTripCityCount)),
    labels.previewSeason
      .replace("{value}", summary.seasonLabel)
      .replace("{flag}", summary.seasonalPackingIncluded ? labels.flagYes : labels.flagNo),
    labels.previewPacking.replace("{count}", String(summary.packingCount)),
    labels.previewDocuments.replace("{count}", String(summary.documentCount)),
    labels.previewBookings.replace("{count}", String(summary.bookingCount)),
    labels.previewReminders.replace("{count}", String(summary.reminderCount)),
    labels.previewItinerary.replace("{count}", String(summary.itineraryDayCount)),
    labels.previewEmergency,
    labels.previewMoney.replace("{count}", String(summary.budgetCategoryCount)),
    summary.expenseSplittingEnabled ? labels.previewSplitOn : labels.previewSplitOff
  ];

  return (
    <div className="mt-4 rounded-md border border-sky/70 bg-sky/25 px-3 py-3">
      <p className="text-sm font-semibold text-ink">{labels.previewTitle}</p>
      <p className="mt-1 text-sm text-zinc-600">{labels.previewIntro}</p>
      <ul className="mt-2 grid gap-1 text-sm leading-6 text-zinc-700 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

function setupTemplateLabels(labels: Labels) {
  return new Map<string, string>([
    ["china-city-general", labels.templateChinaCity],
    ["china-multi-city", labels.templateChinaMulti],
    ["japan-general", labels.templateJapan],
    ["korea-general", labels.templateKorea],
    ["generic-international", labels.templateGeneric]
  ]);
}

function setupTripStyleLabels(labels: Labels) {
  return new Map<string, string>([
    ["balanced", labels.optionBalanced],
    ["relaxed", labels.optionRelaxed],
    ["packed", labels.optionPacked],
    ["shopping", labels.optionShopping],
    ["food", labels.optionFood],
    ["family", labels.optionFamily]
  ]);
}

function setupTransportLabels(labels: Labels) {
  return new Map<string, string>([
    ["public-transport", labels.optionPublicTransport],
    ["rail", labels.optionRail],
    ["car-rental", labels.optionCarRental],
    ["mixed", labels.optionMixedTransport],
    ["undecided", labels.optionUndecided]
  ]);
}

function setupAccommodationLabels(labels: Labels) {
  return new Map<string, string>([
    ["hotel", labels.optionHotel],
    ["airbnb", labels.optionAirbnb],
    ["mixed", labels.optionMixedAccommodation],
    ["undecided", labels.optionUndecided]
  ]);
}

function setupLuggageLabels(labels: Labels) {
  return new Map<string, string>([
    ["carry-on", labels.optionCarryOn],
    ["checked-luggage", labels.optionCheckedLuggage],
    ["mixed", labels.optionMixedLuggage],
    ["undecided", labels.optionUndecided]
  ]);
}

function TextField({
  name,
  label,
  value,
  type = "text",
  onChange
}: {
  name: string;
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <input
        type={type}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
      />
    </label>
  );
}

function NumberField({
  name,
  label,
  value,
  min,
  max,
  onChange
}: {
  name: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <input
        type="number"
        name={name}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(clampTravelerCount(Number(event.target.value)))}
        className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
      />
    </label>
  );
}

function SelectField({
  name,
  label,
  value,
  options,
  optionLabels,
  onChange
}: {
  name: string;
  label: string;
  value: string;
  options: readonly string[];
  optionLabels?: Map<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels?.get(option) ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CurrencyChecklist({
  label,
  mainCurrency,
  values,
  onChange
}: {
  label: string;
  mainCurrency: SharedCurrency;
  values: SharedCurrency[];
  onChange: (values: SharedCurrency[]) => void;
}) {
  const selected = new Set(values);
  return (
    <fieldset className="mt-3 rounded-md border border-zinc-100 p-3">
      <legend className="px-1 text-sm font-semibold text-ink">{label}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {bookingCurrencies
          .filter((currency) => currency !== mainCurrency)
          .map((currency) => (
            <label key={currency} className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={selected.has(currency)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? Array.from(new Set([...values, currency]))
                    : values.filter((value) => value !== currency);
                  onChange(next);
                }}
                className="h-4 w-4 shrink-0 rounded border-zinc-300"
              />
              <span>{currency}</span>
            </label>
          ))}
      </div>
    </fieldset>
  );
}
