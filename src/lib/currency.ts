// Country-to-currency mapping based on onboarding country values

export interface CurrencyConfig {
  locale: string;
  currency: string;
  symbol: string;
}

const COUNTRY_CURRENCY_MAP: Record<string, CurrencyConfig> = {
  united_kingdom: { locale: 'en-GB', currency: 'GBP', symbol: '£' },
  ireland: { locale: 'en-IE', currency: 'EUR', symbol: '€' },
  united_states: { locale: 'en-US', currency: 'USD', symbol: '$' },
  canada: { locale: 'en-CA', currency: 'CAD', symbol: '$' },
  australia: { locale: 'en-AU', currency: 'AUD', symbol: '$' },
  new_zealand: { locale: 'en-NZ', currency: 'NZD', symbol: '$' },
  germany: { locale: 'de-DE', currency: 'EUR', symbol: '€' },
  france: { locale: 'fr-FR', currency: 'EUR', symbol: '€' },
  netherlands: { locale: 'nl-NL', currency: 'EUR', symbol: '€' },
  spain: { locale: 'es-ES', currency: 'EUR', symbol: '€' },
  italy: { locale: 'it-IT', currency: 'EUR', symbol: '€' },
};

const DEFAULT_CURRENCY: CurrencyConfig = { locale: 'en-US', currency: 'USD', symbol: '$' };

export function getCurrencyConfig(country: string | null | undefined): CurrencyConfig {
  if (!country) return DEFAULT_CURRENCY;
  return COUNTRY_CURRENCY_MAP[country] || DEFAULT_CURRENCY;
}
