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
