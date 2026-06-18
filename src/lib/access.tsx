"use client";

import {
  createContext,
  type FormEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { TripTraveler } from "@/lib/sharedDataTypes";

type TripAccessMode = "viewer" | "editor";

type TripAccessStatusResponse = {
  configured?: boolean;
  authorized?: boolean;
  mode?: TripAccessMode | null;
  editorExpiresAt?: string | null;
  recoveryTokenAvailable?: boolean;
  travelers?: TripTraveler[];
  error?: string;
};

type TripAccessSetupResponse = {
  shareToken?: string;
  ownerRecoveryToken?: string;
  editorToken?: string;
  editorExpiresAt?: string;
  travelers?: TripTraveler[];
  error?: string;
};

type TripEditorSessionResponse = {
  editorToken?: string;
  editorExpiresAt?: string;
  error?: string;
};

type RecoveryTokenResponse = {
  ownerRecoveryToken?: string;
  error?: string;
};

type TripAccessContextValue = {
  configured: boolean;
  authorized: boolean;
  loading: boolean;
  mode: TripAccessMode | null;
  shareToken: string;
  selectedTravelerId: string;
  travelers: TripTraveler[];
  recoveryTokenAvailable: boolean;
  setPrivateToken: (token: string) => Promise<void>;
  setSelectedTravelerId: (travelerId: string) => void;
  initializeAccess: (editPasscode: string) => Promise<TripAccessSetupResult>;
  enterEditorMode: (passcode: string) => Promise<void>;
  exitEditorMode: () => void;
  recoverEditorMode: (ownerRecoveryToken: string, newEditPasscode: string) => Promise<void>;
  rotateRecoveryToken: () => Promise<string>;
};

type TripAccessSetupResult = {
  privateLink: string;
  shareToken: string;
  ownerRecoveryToken: string;
};

const TripAccessContext = createContext<TripAccessContextValue | null>(null);

const shareTokenStorageKey = "trip-dashboard-share-token";
const editorTokenStorageKey = "trip-dashboard-editor-token";
const travelerIdStorageKey = "trip-dashboard-selected-traveler-id";
const tripQueryParam = "trip";
const shareTokenHeader = "x-trip-share-token";
const editorTokenHeader = "x-trip-editor-token";
const travelerIdHeader = "x-trip-traveler-id";

export function TripAccessProvider({ children }: { children: ReactNode }) {
  const [configured, setConfigured] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<TripAccessMode | null>(null);
  const [shareToken, setShareTokenState] = useState("");
  const [editorToken, setEditorTokenState] = useState("");
  const [selectedTravelerId, setSelectedTravelerIdState] = useState("");
  const [travelers, setTravelers] = useState<TripTraveler[]>([]);
  const [recoveryTokenAvailable, setRecoveryTokenAvailable] = useState(false);
  const shareTokenRef = useRef("");
  const editorTokenRef = useRef("");
  const travelerIdRef = useRef("");

  const setShareToken = useCallback((token: string) => {
    shareTokenRef.current = token;
    setShareTokenState(token);
    writeStorage(shareTokenStorageKey, token);
  }, []);

  const setEditorToken = useCallback((token: string) => {
    editorTokenRef.current = token;
    setEditorTokenState(token);
    writeStorage(editorTokenStorageKey, token);
  }, []);

  const clearEditorToken = useCallback(() => {
    editorTokenRef.current = "";
    setEditorTokenState("");
    window.localStorage.removeItem(editorTokenStorageKey);
  }, []);

  const setSelectedTravelerId = useCallback((travelerId: string) => {
    travelerIdRef.current = travelerId;
    setSelectedTravelerIdState(travelerId);
    writeStorage(travelerIdStorageKey, travelerId);
  }, []);

  const applyStatus = useCallback(
    (status: TripAccessStatusResponse, nextShareToken: string, nextEditorToken: string) => {
      const nextTravelers = Array.isArray(status.travelers) ? status.travelers : [];
      const nextMode = status.mode ?? null;
      setConfigured(Boolean(status.configured));
      setAuthorized(Boolean(status.authorized));
      setMode(nextMode);
      setTravelers(nextTravelers);
      setRecoveryTokenAvailable(Boolean(status.recoveryTokenAvailable));

      if (!status.authorized) {
        setMode(null);
      }

      if (status.authorized && nextMode !== "editor" && nextEditorToken) {
        clearEditorToken();
      }

      const activeTravelerIds = new Set(nextTravelers.filter((traveler) => traveler.isActive).map((traveler) => traveler.id));
      if (travelerIdRef.current && !activeTravelerIds.has(travelerIdRef.current)) {
        setSelectedTravelerId("");
      }

      if (nextShareToken && status.authorized) {
        setShareToken(nextShareToken);
      }
    },
    [clearEditorToken, setSelectedTravelerId, setShareToken]
  );

  const refreshStatus = useCallback(
    async (nextShareToken = shareTokenRef.current, nextEditorToken = editorTokenRef.current) => {
      const response = await fetch("/api/access/status", {
        cache: "no-store",
        headers: accessHeaders(nextShareToken, nextEditorToken, travelerIdRef.current)
      });
      const data = (await response.json()) as TripAccessStatusResponse;

      if (!response.ok && response.status !== 401) {
        throw new Error(data.error ?? "Unable to load trip access.");
      }

      applyStatus(data, nextShareToken, nextEditorToken);
      return data;
    },
    [applyStatus]
  );

  useEffect(() => {
    const urlToken = readTripTokenFromUrl();
    const storedShareToken = urlToken || window.localStorage.getItem(shareTokenStorageKey) || "";
    const storedEditorToken = window.localStorage.getItem(editorTokenStorageKey) || "";
    const storedTravelerId = window.localStorage.getItem(travelerIdStorageKey) || "";

    shareTokenRef.current = storedShareToken;
    editorTokenRef.current = storedEditorToken;
    travelerIdRef.current = storedTravelerId;
    setShareTokenState(storedShareToken);
    setEditorTokenState(storedEditorToken);
    setSelectedTravelerIdState(storedTravelerId);

    if (urlToken) {
      writeStorage(shareTokenStorageKey, urlToken);
      removeTripTokenFromUrl();
    }

    let active = true;
    setLoading(true);

    refreshStatus(storedShareToken, storedEditorToken)
      .catch(() => {
        if (active) {
          setConfigured(true);
          setAuthorized(false);
          setMode(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [refreshStatus]);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    const patchedFetch: typeof window.fetch = (input, init) => {
      if (!isSameOriginApiRequest(input)) {
        return originalFetch(input, init);
      }

      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      const currentShareToken = shareTokenRef.current;
      const currentEditorToken = editorTokenRef.current;
      const currentTravelerId = travelerIdRef.current;

      if (currentShareToken && !headers.has(shareTokenHeader)) {
        headers.set(shareTokenHeader, currentShareToken);
      }
      if (currentEditorToken && !headers.has(editorTokenHeader)) {
        headers.set(editorTokenHeader, currentEditorToken);
      }
      if (currentTravelerId && !headers.has(travelerIdHeader)) {
        headers.set(travelerIdHeader, currentTravelerId);
      }

      return originalFetch(input, { ...init, headers });
    };

    window.fetch = patchedFetch;

    return () => {
      if (window.fetch === patchedFetch) {
        window.fetch = originalFetch;
      }
    };
  }, []);

  const setPrivateToken = useCallback(
    async (token: string) => {
      const trimmedToken = token.trim();
      if (!trimmedToken) {
        throw new Error("Private trip token is required.");
      }
      setShareToken(trimmedToken);
      await refreshStatus(trimmedToken, editorTokenRef.current);
    },
    [refreshStatus, setShareToken]
  );

  const initializeAccess = useCallback(
    async (editPasscode: string) => {
      const response = await fetch("/api/access/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editPasscode })
      });
      const data = (await response.json()) as TripAccessSetupResponse;

      if (!response.ok || !data.shareToken || !data.ownerRecoveryToken || !data.editorToken) {
        throw new Error(data.error ?? "Unable to configure trip access.");
      }

      setShareToken(data.shareToken);
      setEditorToken(data.editorToken);
      applyStatus(
        {
          configured: true,
          authorized: true,
          mode: "editor",
          recoveryTokenAvailable: true,
          travelers: data.travelers ?? []
        },
        data.shareToken,
        data.editorToken
      );

      return {
        privateLink: buildPrivateLink(data.shareToken),
        shareToken: data.shareToken,
        ownerRecoveryToken: data.ownerRecoveryToken
      };
    },
    [applyStatus, setEditorToken, setShareToken]
  );

  const enterEditorMode = useCallback(
    async (passcode: string) => {
      const response = await fetch("/api/access/editor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...accessHeaders(shareTokenRef.current, "", travelerIdRef.current)
        },
        body: JSON.stringify({ passcode })
      });
      const data = (await response.json()) as TripEditorSessionResponse;

      if (!response.ok || !data.editorToken) {
        throw new Error(data.error ?? "Unable to enter editor mode.");
      }

      setEditorToken(data.editorToken);
      await refreshStatus(shareTokenRef.current, data.editorToken);
    },
    [refreshStatus, setEditorToken]
  );

  const exitEditorMode = useCallback(() => {
    clearEditorToken();
    setMode(authorized ? "viewer" : null);
  }, [authorized, clearEditorToken]);

  const recoverEditorMode = useCallback(
    async (ownerRecoveryToken: string, newEditPasscode: string) => {
      const response = await fetch("/api/access/recover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...accessHeaders(shareTokenRef.current, "", travelerIdRef.current)
        },
        body: JSON.stringify({ ownerRecoveryToken, newEditPasscode })
      });
      const data = (await response.json()) as TripEditorSessionResponse;

      if (!response.ok || !data.editorToken) {
        throw new Error(data.error ?? "Unable to recover editor access.");
      }

      setEditorToken(data.editorToken);
      await refreshStatus(shareTokenRef.current, data.editorToken);
    },
    [refreshStatus, setEditorToken]
  );

  const rotateRecoveryToken = useCallback(async () => {
    const response = await fetch("/api/access/recovery-token", {
      method: "POST",
      headers: accessHeaders(shareTokenRef.current, editorTokenRef.current, travelerIdRef.current)
    });
    const data = (await response.json()) as RecoveryTokenResponse;

    if (!response.ok || !data.ownerRecoveryToken) {
      throw new Error(data.error ?? "Unable to create recovery token.");
    }

    setRecoveryTokenAvailable(true);
    return data.ownerRecoveryToken;
  }, []);

  const value = useMemo<TripAccessContextValue>(
    () => ({
      configured,
      authorized,
      loading,
      mode,
      shareToken,
      selectedTravelerId,
      travelers,
      recoveryTokenAvailable,
      setPrivateToken,
      setSelectedTravelerId,
      initializeAccess,
      enterEditorMode,
      exitEditorMode,
      recoverEditorMode,
      rotateRecoveryToken
    }),
    [
      authorized,
      configured,
      enterEditorMode,
      exitEditorMode,
      initializeAccess,
      loading,
      mode,
      recoverEditorMode,
      recoveryTokenAvailable,
      rotateRecoveryToken,
      selectedTravelerId,
      setPrivateToken,
      setSelectedTravelerId,
      shareToken,
      travelers
    ]
  );

  return <TripAccessContext.Provider value={value}>{children}</TripAccessContext.Provider>;
}

export function TripAccessGate({ children }: { children: ReactNode }) {
  const access = useTripAccess();
  const [setupResult, setSetupResult] = useState<TripAccessSetupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (access.loading) {
    return <AccessFrame title="Loading private trip access" description="Checking the private trip link..." />;
  }

  if (!access.configured) {
    return (
      <AccessSetup
        onSetup={async (editPasscode) => {
          setError(null);
          const result = await access.initializeAccess(editPasscode);
          setSetupResult(result);
          return result;
        }}
        setupResult={setupResult}
        error={error}
        onError={setError}
      />
    );
  }

  if (setupResult) {
    return <SetupResult result={setupResult} onContinue={() => setSetupResult(null)} />;
  }

  if (!access.authorized) {
    return <PrivateLinkGate onSubmit={access.setPrivateToken} />;
  }

  return children;
}

export function TripAccessToolbar() {
  const access = useTripAccess();
  const [passcode, setPasscode] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [oneTimeRecoveryToken, setOneTimeRecoveryToken] = useState("");
  const [manualCopyValue, setManualCopyValue] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const activeTravelers = access.travelers.filter((traveler) => traveler.isActive);

  if (!access.authorized) {
    return null;
  }

  async function submitEditorPasscode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passcode.trim()) {
      setError("Enter the planner edit passcode.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await access.enterEditorMode(passcode);
      setPasscode("");
      setNotice("Editor mode enabled.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to enter editor mode.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recoveryToken.trim() || newPasscode.trim().length < 6) {
      setError("Enter the recovery token and a new edit passcode with at least 6 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await access.recoverEditorMode(recoveryToken, newPasscode);
      setRecoveryToken("");
      setNewPasscode("");
      setNotice("Editor access recovered. Generate a new recovery token from editor mode.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to recover editor access.");
    } finally {
      setSubmitting(false);
    }
  }

  async function createRecoveryToken() {
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const token = await access.rotateRecoveryToken();
      setOneTimeRecoveryToken(token);
      setNotice("New one-time owner recovery token created. Store it outside this app.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create recovery token.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyPrivateLink() {
    const privateLink = buildPrivateLink(access.shareToken);
    setManualCopyValue("");
    const copied = await copyText(privateLink, setNotice, setError);
    if (!copied) {
      setManualCopyValue(privateLink);
    }
  }

  return (
    <section className="border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-moss/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-moss">
              {access.mode === "editor" ? "Editor mode" : "Viewer mode"}
            </span>
            <button
              type="button"
              onClick={() => void copyPrivateLink()}
              className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink"
            >
              Copy private link
            </button>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Viewer mode can only update your own low-risk checklist status after selecting a traveler identity.
          </p>
          <label className="mt-2 block max-w-sm text-sm font-semibold text-ink">
            Traveler identity
            <select
              value={access.selectedTravelerId}
              onChange={(event) => access.setSelectedTravelerId(event.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
            >
              <option value="">Select traveler</option>
              {activeTravelers.map((traveler) => (
                <option key={traveler.id} value={traveler.id}>
                  {traveler.displayName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-2 md:min-w-80">
          {access.mode === "editor" ? (
            <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
              <button
                type="button"
                onClick={createRecoveryToken}
                disabled={submitting}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink disabled:opacity-60"
              >
                New recovery token
              </button>
              <button
                type="button"
                onClick={() => {
                  access.exitEditorMode();
                  setNotice("Returned to viewer mode.");
                }}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
              >
                Exit editor
              </button>
            </div>
          ) : (
            <form onSubmit={submitEditorPasscode} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                type="password"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                placeholder="Planner edit passcode"
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? "Checking..." : "Enter editor"}
              </button>
            </form>
          )}

          {access.mode !== "editor" ? (
            <details className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-ink">Recover editor access</summary>
              <form onSubmit={submitRecovery} className="mt-3 grid gap-2">
                <input
                  type="password"
                  value={recoveryToken}
                  onChange={(event) => setRecoveryToken(event.target.value)}
                  placeholder="Owner recovery token"
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                />
                <input
                  type="password"
                  value={newPasscode}
                  onChange={(event) => setNewPasscode(event.target.value)}
                  placeholder="New edit passcode"
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Reset passcode
                </button>
              </form>
            </details>
          ) : null}

          {oneTimeRecoveryToken ? (
            <TokenBox
              label="One-time owner recovery token"
              value={oneTimeRecoveryToken}
              onCopy={() => void copyText(oneTimeRecoveryToken, setNotice, setError)}
            />
          ) : null}
          {manualCopyValue ? (
            <p className="break-all rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs leading-5 text-zinc-700">
              {manualCopyValue}
            </p>
          ) : null}
          {notice ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}

export function useTripAccess() {
  const context = useContext(TripAccessContext);

  if (!context) {
    throw new Error("useTripAccess must be used within TripAccessProvider");
  }

  return context;
}

function AccessSetup({
  error,
  onError,
  onSetup,
  setupResult
}: {
  error: string | null;
  onError: (error: string | null) => void;
  onSetup: (editPasscode: string) => Promise<TripAccessSetupResult>;
  setupResult: TripAccessSetupResult | null;
}) {
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passcode.length < 6) {
      onError("Use an edit passcode with at least 6 characters.");
      return;
    }
    if (passcode !== confirmPasscode) {
      onError("Edit passcodes do not match.");
      return;
    }

    setSubmitting(true);
    onError(null);

    try {
      await onSetup(passcode);
      setPasscode("");
      setConfirmPasscode("");
    } catch (setupError) {
      onError(setupError instanceof Error ? setupError.message : "Unable to configure trip access.");
    } finally {
      setSubmitting(false);
    }
  }

  if (setupResult) {
    return <SetupResult result={setupResult} onContinue={() => window.location.reload()} />;
  }

  return (
    <AccessFrame
      title="Create private trip access"
      description="This creates one unguessable private trip link, one planner edit passcode, and one owner recovery token."
    >
      <form onSubmit={submitSetup} className="mt-5 grid gap-3">
        <input
          type="password"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          placeholder="Planner edit passcode"
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700"
        />
        <input
          type="password"
          value={confirmPasscode}
          onChange={(event) => setConfirmPasscode(event.target.value)}
          placeholder="Confirm edit passcode"
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create private access"}
        </button>
      </form>
      {error ? <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </AccessFrame>
  );
}

function SetupResult({ result, onContinue }: { result: TripAccessSetupResult; onContinue: () => void }) {
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <AccessFrame
      title="Private access is ready"
      description="Copy these now. The owner recovery token is shown once and is not stored in plaintext."
    >
      <div className="mt-5 grid gap-3">
        <TokenBox label="Private trip link" value={result.privateLink} onCopy={() => void copyText(result.privateLink, setNotice, setError)} />
        <TokenBox label="Owner recovery token" value={result.ownerRecoveryToken} onCopy={() => void copyText(result.ownerRecoveryToken, setNotice, setError)} />
        <button
          type="button"
          onClick={onContinue}
          className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white"
        >
          Continue to dashboard
        </button>
        {notice ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      </div>
    </AccessFrame>
  );
}

function PrivateLinkGate({ onSubmit }: { onSubmit: (token: string) => Promise<void> }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.trim()) {
      setError("Paste the private trip token or open the private trip link.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Private trip link is invalid.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AccessFrame
      title="Private trip link required"
      description="Open the private unguessable trip link, or paste its token here."
    >
      <form onSubmit={submitToken} className="mt-5 grid gap-3">
        <input
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Private trip token"
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Checking..." : "Open trip"}
        </button>
      </form>
      {error ? <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </AccessFrame>
  );
}

function AccessFrame({
  children,
  description,
  title
}: {
  children?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-paper px-4 py-10 text-ink">
      <section className="mx-auto max-w-lg rounded-lg border border-zinc-200 bg-white p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
          Italy Trip 2026
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
        {children}
      </section>
    </main>
  );
}

function TokenBox({ label, onCopy, value }: { label: string; onCopy: () => void; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink"
        >
          Copy
        </button>
      </div>
      <p className="mt-2 break-all rounded-md bg-white px-3 py-2 text-xs leading-5 text-zinc-700">{value}</p>
    </div>
  );
}

function accessHeaders(shareToken: string, editorToken: string, travelerId: string) {
  const headers: Record<string, string> = {};
  if (shareToken) {
    headers[shareTokenHeader] = shareToken;
  }
  if (editorToken) {
    headers[editorTokenHeader] = editorToken;
  }
  if (travelerId) {
    headers[travelerIdHeader] = travelerId;
  }
  return headers;
}

function isSameOriginApiRequest(input: RequestInfo | URL) {
  const rawUrl = input instanceof Request ? input.url : input.toString();
  try {
    const url = new URL(rawUrl, window.location.origin);
    return url.origin === window.location.origin && url.pathname.startsWith("/api/");
  } catch {
    return false;
  }
}

function readTripTokenFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get(tripQueryParam)?.trim() ?? "";
}

function removeTripTokenFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete(tripQueryParam);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function buildPrivateLink(token: string) {
  const url = new URL(window.location.origin);
  url.searchParams.set(tripQueryParam, token);
  return url.toString();
}

async function copyText(
  value: string,
  setNotice: (notice: string | null) => void,
  setError: (error: string | null) => void
) {
  const copied = await copyToClipboard(value);
  if (copied) {
    setNotice("Copied.");
    setError(null);
    return true;
  }

  setNotice(null);
  setError("Clipboard copy is unavailable in this browser. Select and copy the value shown manually.");
  return false;
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the textarea fallback used by constrained browser shells.
    }
  }

  return copyWithTextarea(value);
}

function copyWithTextarea(value: string) {
  if (!document.body) {
    return false;
  }

  const textarea = document.createElement("textarea");
  const selection = document.getSelection();
  const selectedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
    if (selection && selectedRange) {
      selection.removeAllRanges();
      selection.addRange(selectedRange);
    }
  }
}

function writeStorage(key: string, value: string) {
  if (!value) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, value);
}
