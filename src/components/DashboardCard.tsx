type DashboardCardProps = {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "warm" | "urgent";
};

const toneClass = {
  default: "border-zinc-200 bg-white",
  warm: "border-amberline/35 bg-[#fffaf0]",
  urgent: "border-red-200 bg-red-50"
};

export function DashboardCard({
  label,
  value,
  detail,
  tone = "default"
}: DashboardCardProps) {
  return (
    <section className={`rounded-lg border p-4 shadow-soft ${toneClass[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-zinc-600">{detail}</p> : null}
    </section>
  );
}
