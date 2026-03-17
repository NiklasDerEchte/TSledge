/**
 * Encodes any object into a base64 string.
 * @param obj The object to encode.
 * @returns Encoded string in base64 format.
 */
export function encodeToBase64(obj: any): string {
  return btoa(encodeURIComponent(JSON.stringify(obj)));
}

/**
 * Decodes a base64 string back into an object.
 * @param str The base64 string to decode.
 * @returns Decoded object or undefined if the input string is invalid.
 */
export function decodeFromBase64<T = any>(str: string | null | undefined): T | undefined {
  if(str == null || str == undefined) {
    return undefined;
  }
  let decoded = str ? decodeURIComponent(atob(str)) : undefined;
  return decoded ? JSON.parse(decoded) : undefined;
}