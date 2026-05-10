import { describe, expect, it } from "vitest";
import { buildReceivablesSchedule } from "../src/domain/receivables.js";

describe("buildReceivablesSchedule", () => {
  it("creates one receivable per contract month", () => {
    const schedule = buildReceivablesSchedule({
      start_date: "2026-01-01",
      end_date: "2026-03-31",
      due_day: 5,
      rent_amount: 3200
    });

    expect(schedule).toEqual([
      {
        reference_month: "2026-01",
        due_date: "2026-01-05",
        amount: 3200,
        status: "pending"
      },
      {
        reference_month: "2026-02",
        due_date: "2026-02-05",
        amount: 3200,
        status: "pending"
      },
      {
        reference_month: "2026-03",
        due_date: "2026-03-05",
        amount: 3200,
        status: "pending"
      }
    ]);
  });

  it("falls back to a single receivable when the due day is outside the date range", () => {
    const schedule = buildReceivablesSchedule({
      start_date: "2026-01-28",
      end_date: "2026-01-31",
      due_day: 5,
      rent_amount: 900
    });

    expect(schedule).toEqual([
      {
        reference_month: "2026-01",
        due_date: "2026-01-28",
        amount: 900,
        status: "pending"
      }
    ]);
  });
});
