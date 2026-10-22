export function requiredText(value, label, max = 120) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  if (value.trim().length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return value.trim();
}
export function positiveNumber(value, label, allowZero = false) {
  const n = Number(value);
  if (!Number.isFinite(n) || (allowZero ? n < 0 : n <= 0)) {
    throw new Error(`${label} must be a valid ${allowZero ? "non-negative" : "positive"} number.`);
  }
  return n;
}
export function optionalText(value, max = 250) {
  if (value == null) return null;
  if (typeof value !== "string") throw new Error("Text value is invalid.");
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`Text must be ${max} characters or fewer.`);
  return trimmed || null;
}
export function dateValue(value, label = "Date") {
  if (!value || Number.isNaN(Date.parse(value))) throw new Error(`${label} is invalid.`);
  return new Date(value).toISOString().slice(0, 10);
}
