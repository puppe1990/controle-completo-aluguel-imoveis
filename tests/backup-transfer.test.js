import { describe, expect, it, vi } from "vitest";
import {
  readBackupFile,
  saveBackupFile,
} from "../resources/js/backup-transfer.js";

function createNeutralinoFileApi(overrides = {}) {
  return {
    os: {
      showOpenDialog: vi.fn(),
      showSaveDialog: vi.fn(),
      ...overrides.os,
    },
    filesystem: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      ...overrides.filesystem,
    },
  };
}

describe("backup transfer", () => {
  it("saves exported backup with Neutralino native APIs", async () => {
    const neutralino = createNeutralinoFileApi({
      os: {
        showSaveDialog: vi.fn().mockResolvedValue("/tmp/imobiliaria.json"),
      },
    });

    const hasExported = await saveBackupFile({ version: 1 }, neutralino);

    expect(hasExported).toBe(true);
    expect(neutralino.filesystem.writeFile).toHaveBeenCalledWith(
      "/tmp/imobiliaria.json",
      '{\n  "version": 1\n}'
    );
  });

  it("reads imported backup with Neutralino native APIs", async () => {
    const neutralino = createNeutralinoFileApi({
      os: {
        showOpenDialog: vi
          .fn()
          .mockResolvedValue(["/tmp/imobiliaria-backup.json"]),
      },
      filesystem: {
        readFile: vi.fn().mockResolvedValue('{"version":1,"snapshot":{}}'),
      },
    });

    const backup = await readBackupFile(neutralino);

    expect(backup).toEqual({ version: 1, snapshot: {} });
    expect(neutralino.filesystem.readFile).toHaveBeenCalledWith(
      "/tmp/imobiliaria-backup.json"
    );
  });

  it("returns null when import dialog is cancelled", async () => {
    const neutralino = createNeutralinoFileApi({
      os: {
        showOpenDialog: vi.fn().mockResolvedValue([]),
      },
    });

    const backup = await readBackupFile(neutralino);

    expect(backup).toBeNull();
    expect(neutralino.filesystem.readFile).not.toHaveBeenCalled();
  });
});
