import {
  clampDay,
  formatDate,
  normalizeDate,
  toMonthKey,
} from "./date-utils.js";

export function buildReceivablesSchedule(contract) {
  const startDate = normalizeDate(contract.start_date);
  const endDate = normalizeDate(contract.end_date);
  const schedule = [];
  let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (cursor <= endDate) {
    const dueDate = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      clampDay(cursor.getFullYear(), cursor.getMonth(), contract.due_day)
    );
    if (dueDate >= startDate && dueDate <= endDate) {
      schedule.push({
        reference_month: toMonthKey(formatDate(dueDate)),
        due_date: formatDate(dueDate),
        amount: Number(contract.rent_amount),
        status: "pending",
      });
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  if (schedule.length === 0) {
    schedule.push({
      reference_month: toMonthKey(contract.start_date),
      due_date: contract.start_date,
      amount: Number(contract.rent_amount),
      status: "pending",
    });
  }

  return schedule;
}
