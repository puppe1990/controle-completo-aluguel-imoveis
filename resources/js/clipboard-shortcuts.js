const BLOCKED_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

export function isClipboardShortcutEvent(event) {
  const key = event.key?.toLowerCase();
  return (
    (event.metaKey || event.ctrlKey) && !event.altKey && "cxv".includes(key)
  );
}

export function getTextField(target) {
  if (!target?.tagName) {
    return null;
  }
  if (target.tagName === "TEXTAREA") {
    return target;
  }
  if (target.tagName !== "INPUT") {
    return null;
  }
  return BLOCKED_INPUT_TYPES.has(target.type?.toLowerCase()) ? null : target;
}

export function replaceSelectedText(field, text) {
  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? field.value.length;
  field.value = `${field.value.slice(0, start)}${text}${field.value.slice(end)}`;
  const caret = start + text.length;
  field.setSelectionRange?.(caret, caret);
  field.dispatchEvent?.(new Event("input", { bubbles: true }));
}

export async function handleClipboardShortcut(event, clipboard) {
  if (!isClipboardShortcutEvent(event)) {
    return false;
  }
  const field = getTextField(event.target);
  if (!field) {
    return false;
  }
  const key = event.key.toLowerCase();
  const start = field.selectionStart ?? 0;
  const end = field.selectionEnd ?? field.value.length;
  if ((key === "x" || key === "v") && (field.readOnly || field.disabled)) {
    return false;
  }
  event.preventDefault();
  if (key === "c" || key === "x") {
    await clipboard.writeText(field.value.slice(start, end));
  }
  if (key === "x") {
    replaceSelectedText(field, "");
  }
  if (key === "v") {
    replaceSelectedText(field, await clipboard.readText());
  }
  return true;
}
