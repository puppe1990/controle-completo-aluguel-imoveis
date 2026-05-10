function selectionPreview(value) {
  return String(value).slice(0, 80);
}

/**
 * Normalizes the file selection returned by Neutralino dialogs.
 * Example: const filePath = normalizeSelectedPath(selection);
 */
export function normalizeSelectedPath(selection) {
  if (!selection) {
    return null;
  }
  if (typeof selection === "string") {
    return selection;
  }
  if (Array.isArray(selection)) {
    if (!selection.length) {
      return null;
    }
    if (typeof selection[0] === "string") {
      return selection[0];
    }
  }
  throw new Error(
    `Selecao de arquivo invalida: value="${selectionPreview(JSON.stringify(selection))}" expected="string ou string[]"`
  );
}
