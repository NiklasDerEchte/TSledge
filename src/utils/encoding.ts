/**
 * Encodes any object into a base64 string.
 * @param obj The object to encode.
 * @returns Encoded string in base64 format.
 */
export function encodeToBase64(obj: any): string {
  return btoa(encodeURIComponent(JSON.stringify(obj)));
}
