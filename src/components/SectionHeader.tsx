type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <header className="travel-page-header mb-5">
      {eyebrow ? (
        <p className="relative text-xs font-semibold uppercase tracking-[0.1em] text-stamp">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="relative mt-1 max-w-3xl text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
      {description ? <p className="relative mt-2 max-w-3xl text-sm leading-6 text-zinc-600">{description}</p> : null}
    </header>
  );
}
