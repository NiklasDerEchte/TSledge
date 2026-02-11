/**
 * Validates that the input is a non-empty object or array.
 * @param value
 * @returns boolean
 */
export function isNonEmptyObjectOrArray(value: any): boolean {
  return (
    value != null &&
    value != undefined &&
    ((Array.isArray(value) && value.length > 0) ||
      (typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.keys(value as object).length > 0))
  );
}

/**
 * Validates a string value, returning it if it's not empty, undefined, or null.
 * Returns the fallback value otherwise.
 *
 * @param value - The value to validate.
 * @param fallback - The value to return if validation fails.
 * @returns The validated string or the fallback.
 */
export function validateString(value: string | undefined | null, fallback: any = null): string | null | any {
  if (
    value !== undefined &&
    value !== null &&
    value !== '' &&
    value !== 'undefined' &&
    value !== 'null'
  ) {
    return value;
  }
  return fallback;
}
