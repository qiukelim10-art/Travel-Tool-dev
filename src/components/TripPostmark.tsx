type TripPostmarkProps = {
  countryCode: string;
  countryName: string;
  cityName?: string | null;
  date?: string | null;
  compact?: boolean;
  className?: string;
};

type PostmarkVariant = {
  shape: "circle" | "oval";
  className: string;
  rotation: number;
  divider: "waves" | "laurel" | "line";
};

const postmarkVariants: Record<string, PostmarkVariant> = {
  AT: { shape: "circle", className: "trip-postmark--at", rotation: -7, divider: "laurel" },
  CH: { shape: "circle", className: "trip-postmark--ch", rotation: -6, divider: "line" },
  CN: { shape: "circle", className: "trip-postmark--cn", rotation: -8, divider: "waves" },
  CZ: { shape: "oval", className: "trip-postmark--cz", rotation: -6, divider: "line" },
  ES: { shape: "circle", className: "trip-postmark--es", rotation: -8, divider: "waves" },
  FR: { shape: "circle", className: "trip-postmark--fr", rotation: -7, divider: "waves" },
  GB: { shape: "circle", className: "trip-postmark--gb", rotation: -8, divider: "line" },
  HU: { shape: "oval", className: "trip-postmark--hu", rotation: -7, divider: "line" },
  JP: { shape: "circle", className: "trip-postmark--jp", rotation: -8, divider: "waves" },
  KR: { shape: "oval", className: "trip-postmark--kr", rotation: -6, divider: "line" },
  IT: { shape: "circle", className: "trip-postmark--it", rotation: -9, divider: "laurel" },
  UK: { shape: "circle", className: "trip-postmark--gb", rotation: -8, divider: "line" },
  DEFAULT: { shape: "circle", className: "trip-postmark--default", rotation: -7, divider: "line" }
};

export function TripPostmark({
  cityName,
  className = "",
  compact = false,
  countryCode,
  countryName,
  date
}: TripPostmarkProps) {
  const code = countryCode.toUpperCase();
  const variant = postmarkVariants[code] ?? postmarkVariants.DEFAULT;
  const countryLabel = formatCountryLabel(code, countryName);
  const cityLabel = formatDetailLabel(cityName);
  const dateLabel = formatPostmarkDate(date);
  const classes = [
    "trip-postmark",
    compact ? "trip-postmark--compact" : "",
    variant.className,
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} aria-label={`${countryLabel} ${cityLabel} travel stamp`.trim()}>
      <svg viewBox="0 0 128 96" role="img" aria-hidden="true" focusable="false">
        <g transform={`rotate(${variant.rotation} 64 48)`}>
          {variant.shape === "oval" ? <OvalFrame /> : <CircleFrame />}
          <Divider variant={variant.divider} />
          <text className="trip-postmark__country" x="64" y="43">
            {countryLabel}
          </text>
          <text className="trip-postmark__city" x="64" y="58">
            {cityLabel}
          </text>
          {dateLabel ? (
            <text className="trip-postmark__date" x="64" y="72">
              {dateLabel}
            </text>
          ) : null}
        </g>
      </svg>
    </div>
  );
}

function CircleFrame() {
  return (
    <>
      <circle className="trip-postmark__outer" cx="64" cy="48" r="39" />
      <circle className="trip-postmark__inner" cx="64" cy="48" r="33" />
    </>
  );
}

function OvalFrame() {
  return (
    <>
      <ellipse className="trip-postmark__outer" cx="64" cy="48" rx="47" ry="31" />
      <ellipse className="trip-postmark__inner" cx="64" cy="48" rx="40" ry="25" />
    </>
  );
}

function Divider({ variant }: { variant: PostmarkVariant["divider"] }) {
  if (variant === "waves") {
    return (
      <g className="trip-postmark__waves">
        <path d="M 19 30 C 30 23 40 37 51 30 C 62 23 72 37 83 30 C 94 23 104 37 115 30" />
        <path d="M 19 79 C 30 72 40 86 51 79 C 62 72 72 86 83 79 C 94 72 104 86 115 79" />
      </g>
    );
  }

  if (variant === "laurel") {
    return (
      <g className="trip-postmark__laurel">
        <path d="M 31 67 C 42 78 51 79 60 75" />
        <path d="M 97 67 C 86 78 77 79 68 75" />
        <path d="M 36 68 L 31 77 M 43 72 L 39 82 M 51 74 L 49 84" />
        <path d="M 92 68 L 97 77 M 85 72 L 89 82 M 77 74 L 79 84" />
      </g>
    );
  }

  return (
    <g className="trip-postmark__lines">
      <path d="M 24 31 H 104" />
      <path d="M 28 75 H 100" />
    </g>
  );
}

function formatCountryLabel(countryCode: string, countryName: string) {
  if (countryCode === "GB" || countryCode === "UK") {
    return "UK";
  }

  if (countryCode === "KR") {
    return "KOREA";
  }

  if (countryCode === "GENERIC") {
    return "TRIP";
  }

  const [firstWord] = countryName.split(/\s+/);
  return (firstWord || countryCode).toUpperCase();
}

function formatDetailLabel(value?: string | null) {
  const label = value?.trim();
  if (!label) {
    return "ROUTE";
  }

  return /^[\x00-\x7F]+$/.test(label) ? label.toUpperCase() : label;
}

function formatPostmarkDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  const day = String(parsedDate.getDate()).padStart(2, "0");
  const month = parsedDate.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = parsedDate.getFullYear();
  return `${day} ${month} ${year}`;
}
