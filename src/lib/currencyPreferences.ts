import { bookingCurrencies, type SharedCurrency } from "@/lib/sharedDataTypes";

export const fallbackCurrency: SharedCurrency = "EUR";

export function activeTripCurrencies(currencies: readonly SharedCurrency[] | null | undefined): SharedCurrency[] {
  const supported = new Set<SharedCurrency>(bookingCurrencies);
  const uniqueCurrencies = Array.from(new Set((currencies ?? []).filter((currency) => supported.has(currency))));
  return uniqueCurrencies.length > 0 ? uniqueCurrencies : [fallbackCurrency];
}

export function primaryTripCurrency(currencies: readonly SharedCurrency[] | null | undefined) {
  return activeTripCurrencies(currencies)[0];
}

export function currencyInTripDefaults(
  currency: SharedCurrency | string | null | undefined,
  currencies: readonly SharedCurrency[] | null | undefined
) {
  if (!currency) {
    return false;
  }

  return activeTripCurrencies(currencies).includes(currency as SharedCurrency);
}

