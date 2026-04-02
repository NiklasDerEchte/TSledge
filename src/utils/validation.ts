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

/**
 * Merges the properties of object `input` into object `target`.
 * @param input The source object whose properties will be merged into `target`.
 * @param target The target object that will receive the properties from `input`.
 * @param prefix An optional prefix to prepend to each key in the merged object.
 * @returns The merged object.
 */
export function mergeObjects<T = any>(input: any, target: any, prefix: string | undefined = undefined): T {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    if (target && typeof target === 'object' && !Array.isArray(target)) {
      Object.entries(input).forEach(([key, value]) => {
        if (value != undefined && value != null) {
          if (prefix) {
            target[`${prefix}.${key}`] = value;
          } else {
            target[key] = value;
          }
        }
      });
    }
  }
  return target;
}

/**
 * Parses a list from various formats (array, JSON string, or CSV string) into a standardized array of strings.
 * @param list 
 * @param [delimiter=','] 
 * @returns 
 */
export function parseList(list: any, delimiter = ','): string[] {
  if (!list) return [];
  if (Array.isArray(list)) return list.map((s: any) => String(s).trim()).filter(Boolean);
  if (typeof list === 'string') {
    try {
      const parsed = JSON.parse(list);
      if (Array.isArray(parsed)) return parsed.map((s: any) => String(s).trim()).filter(Boolean);
    } catch {}
    return list
      .split(delimiter)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Parses a string into a number, returning null if the parsing fails.
 * @param value The value to parse.
 * @returns The parsed number or null.
 */
export function parseNumber(value: any): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsedValue = String(value).trim();
  if (
    parsedValue === '' ||
    parsedValue === 'undefined' ||
    parsedValue === 'null'
  ) {
    return null;
  }
  if (!/^[-+]?(?:\d+|\d*\.\d+)$/.test(parsedValue)) {
    return null;
  }
  if (parsedValue.includes('.')) {
    return parseFloat(parsedValue);
  }
  return parseInt(parsedValue, 10);
}

/**
 * Checks if a value is a number within a specified range (inclusive).
 * @param value The value to check.
 * @param from The lower bound of the range (default: 0).
 * @param to The upper bound of the range (default: 1).
 * @returns True if the value is a number within the range, false otherwise.
 */
export function isNumberInRange(value: any, from: number = 0, to: number = 1): boolean {
  value = parseNumber(value);
  if(value == null) {
    return false;
  }
  return !isNaN(value) && value >= from && value <= to;
}

/**
 * Clamps a number to be within a specified range.
 * @param value 
 * @param from 
 * @param to 
 * @returns 
 */
export function clamp(value: any, from: number = 0, to: number = 1): number {
  value = parseNumber(value);
  if (value == null) {
    return from;
  }
  if (isNaN(value)) return from;
  return Math.min(Math.max(value, from), to);
}

/**
 * Parses a value into a boolean
 * @param value The value to parse.
 * @returns The parsed boolean
 */
export function parseBoolean(value: any): boolean {
  if (value === undefined || value === null) return false;

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const parsedValue = value.trim().toLowerCase();
    if (parsedValue === 'true' || parsedValue === '1' || parsedValue == 'yes') return true;
    return false;
  }

  if (typeof value === 'object') {
    if (value instanceof Boolean) {
      return value.valueOf();
    }
    return false;
  }

  if (typeof value === 'number') {
    if (value > 0) return true;
  }
  try {
    return Boolean(value.trim().toLowerCase());
  } catch {}
  return false;
}