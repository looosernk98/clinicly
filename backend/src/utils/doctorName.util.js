/**
 * Split a display name into first + last for doctor documents.
 * Last whitespace-separated token becomes last_name; the rest is first_name.
 */
export function splitFullNameToFirstLast(fullName) {
  if (!fullName || typeof fullName !== "string") {
    return { first_name: "Unknown", last_name: "" };
  }
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "Unknown", last_name: "" };
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  return {
    first_name: parts.slice(0, -1).join(" "),
    last_name: parts.at(-1),
  };
}
