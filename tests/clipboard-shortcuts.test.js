import { describe, expect, it, vi } from "vitest";
import {
  getTextField,
  handleClipboardShortcut,
  isClipboardShortcutEvent,
  replaceSelectedText,
} from "../resources/js/clipboard-shortcuts.js";

function createField(overrides = {}) {
  return {
    tagName: "INPUT",
    type: "text",
    value: "abc123",
    selectionStart: 1,
    selectionEnd: 4,
    readOnly: false,
    disabled: false,
    dispatchedEvents: [],
    dispatchEvent(event) {
      this.dispatchedEvents.push(event.type);
    },
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
    ...overrides,
  };
}

describe("clipboard shortcuts", () => {
  it("detects supported clipboard shortcut events", () => {
    expect(
      isClipboardShortcutEvent({ key: "v", ctrlKey: true, metaKey: false })
    ).toBe(true);
    expect(
      isClipboardShortcutEvent({
        key: "v",
        ctrlKey: true,
        metaKey: false,
        altKey: true,
      })
    ).toBe(false);
  });

  it("accepts only text inputs and textareas", () => {
    expect(getTextField(createField())).toBeTruthy();
    expect(getTextField({ tagName: "TEXTAREA" })).toBeTruthy();
    expect(getTextField(createField({ type: "checkbox" }))).toBeNull();
    expect(getTextField({ tagName: "DIV" })).toBeNull();
  });

  it("replaces the current selection and moves the caret", () => {
    const field = createField();

    replaceSelectedText(field, "Z");

    expect(field.value).toBe("aZ23");
    expect(field.selectionStart).toBe(2);
    expect(field.selectionEnd).toBe(2);
    expect(field.dispatchedEvents).toEqual(["input"]);
  });

  it("copies, cuts, and pastes through the Neutralino clipboard bridge", async () => {
    const writes = [];
    const clipboard = {
      readText: vi.fn().mockResolvedValue("COLA"),
      writeText: vi.fn(async (text) => writes.push(text)),
    };
    const field = createField();
    const preventDefault = vi.fn();

    await handleClipboardShortcut(
      {
        key: "c",
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        target: field,
        preventDefault,
      },
      clipboard
    );
    await handleClipboardShortcut(
      {
        key: "x",
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        target: field,
        preventDefault,
      },
      clipboard
    );
    field.selectionStart = 1;
    field.selectionEnd = 1;
    await handleClipboardShortcut(
      {
        key: "v",
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        target: field,
        preventDefault,
      },
      clipboard
    );

    expect(writes).toEqual(["bc1", "bc1"]);
    expect(field.value).toBe("aCOLA23");
    expect(preventDefault).toHaveBeenCalledTimes(3);
  });
});
