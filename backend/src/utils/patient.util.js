const GENDER_ENUM = new Set(["male", "female", "other", "prefer_not_to_say"]);

/** Parse legacy or API dob strings (ISO, Date, dd_mm_yyyy) to Date or null. */
export function parsePatientDob(value) {
  if (value == null || value === "" || value === "Not Selected") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string") {
    const iso = new Date(value);
    if (!Number.isNaN(iso.getTime())) return iso;
    const m = value.trim().match(/^(\d{1,2})_(\d{1,2})_(\d{4})$/);
    if (m) {
      const d = new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

/** Map display / legacy gender values to patient schema enum. */
export function mapPatientGender(raw) {
  if (raw == null || raw === "") return "prefer_not_to_say";
  const s = String(raw).trim().toLowerCase();
  if (s === "male" || s === "m") return "male";
  if (s === "female" || s === "f") return "female";
  if (s === "other") return "other";
  if (s === "not selected" || s === "prefer_not_to_say") return "prefer_not_to_say";
  if (GENDER_ENUM.has(s)) return s;
  return "prefer_not_to_say";
}
