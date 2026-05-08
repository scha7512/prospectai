// Parse OSM opening_hours and return current open status
// Returns null if unparseable
export function isOpenNow(ohString: string | undefined): boolean | null {
  if (!ohString) return null;
  if (ohString.trim() === "24/7") return true;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const OpeningHours = require("opening_hours");
    const oh = new OpeningHours(ohString);
    return oh.getState() as boolean;
  } catch {
    return null;
  }
}
