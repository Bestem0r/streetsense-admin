/**
 * Takes a unix timestamp (number) and normalizes them to 'YYYY-MM-DD' format.
 * @param input - The date input which is a number (Unix timestamp)
 * @returns  A string in 'YYYY-MM-DD' format or null if the input is invalid.
 */
export function normalizeDate(input: string): string | null {
  if (!input) return null;

  const value = String(input);

  // Unix timestamp seconds
  if (/^\d+(\.\d+)?$/.test(value)) {
    const seconds = parseFloat(value);
    return new Date(seconds * 1000).toISOString().split('T')[0];
  }

  const d = new Date(value);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];

  return null;
}
