function pad(value) {
  return String(value).padStart(2, "0");
}

export function normalizeDate(value) {
  return new Date(`${value}T00:00:00`);
}

export function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toMonthKey(dateString) {
  return dateString.slice(0, 7);
}

export function clampDay(year, monthIndex, day) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, lastDay);
}
