const LOCALE = "en-US";

const numberFormat = new Intl.NumberFormat(LOCALE);

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatDate(isoDate: string): string {
  return dateFormat.format(new Date(isoDate));
}
