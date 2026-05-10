import { normalizeSelectedPath } from "./dialog-file-path.js";

const JSON_FILE_FILTERS = [
  {
    name: "Arquivos JSON",
    extensions: ["json"],
  },
];

function formatBackupContent(backup) {
  return JSON.stringify(backup, null, 2);
}

function backupPreview(value) {
  return String(value).slice(0, 80);
}

function parseBackupContent(content) {
  try {
    return JSON.parse(content);
  } catch {
    throw new Error(
      `Backup invalido: value="${backupPreview(content)}" expected="JSON serializado pelo app"`
    );
  }
}

/**
 * Saves a backup file using Neutralino native dialogs and filesystem APIs.
 * Example: await saveBackupFile(backup, Neutralino);
 */
export async function saveBackupFile(backup, neutralino) {
  const filePath = normalizeSelectedPath(
    await neutralino.os.showSaveDialog("Salvar backup", {
      defaultPath: "imobiliaria-backup.json",
      filters: JSON_FILE_FILTERS,
      forceOverwrite: true,
    })
  );
  if (!filePath) {
    return false;
  }
  await neutralino.filesystem.writeFile(filePath, formatBackupContent(backup));
  return true;
}

/**
 * Opens a backup file using Neutralino native dialogs and returns its JSON.
 * Example: const backup = await readBackupFile(Neutralino);
 */
export async function readBackupFile(neutralino) {
  const filePath = normalizeSelectedPath(
    await neutralino.os.showOpenDialog("Selecionar backup", {
      filters: JSON_FILE_FILTERS,
    })
  );
  if (!filePath) {
    return null;
  }
  const content = await neutralino.filesystem.readFile(filePath);
  return parseBackupContent(content);
}
