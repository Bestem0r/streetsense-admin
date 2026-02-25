/**
 * Takes a unix timestamp (number) and normalizes them to 'YYYY-MM-DD' format.
 * @param input - The date input which is a number (Unix timestamp)
 * @returns  A string in 'YYYY-MM-DD' format or null if the input is invalid.
 */
export function normalizeDate(input: string): string | null {
  if (!input) return null;

  const value = String(input);

  // Unix timestamp in milliseconds
  if (/^\d{13}$/.test(value)) {
    const milliseconds = parseInt(value, 10);
    return new Date(milliseconds).toISOString().split('T')[0];
  }

  const d = new Date(value);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];

  return null;
}
