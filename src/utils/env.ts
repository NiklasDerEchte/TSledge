/**
 * Utility function to check if the application is in debug mode based on the DEBUG environment variable.
 * @param func Optional function to execute if debug mode is enabled.
 * @returns True if debug mode is enabled, false otherwise.
 */
export function isDebug(func: ((() => void) | undefined) = undefined): boolean {
  const dbg = process.env.DEBUG;
  if (dbg !== undefined) {
    const v = dbg.toString().trim().toLowerCase();
    let validation = v === '1' || v === 'true' || v === 'yes' || v === 'on';
    if(validation && func != undefined) {
      func();
    }
    return validation;
  }
  return false;
}
