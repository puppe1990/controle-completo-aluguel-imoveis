import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  copyRuntimeSource,
  getRuntimeSourcePaths,
} from "../scripts/copy-runtime-source.js";

const temporaryDirectories = [];

function createTemporaryProjectRoot() {
  const temporaryProjectRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "imobiliaria-build-")
  );
  temporaryDirectories.push(temporaryProjectRoot);
  return temporaryProjectRoot;
}

function createRuntimeSourceFixture(projectRoot) {
  const sourceFilePath = path.join(
    projectRoot,
    "src",
    "backend",
    "database.js"
  );
  fs.mkdirSync(path.dirname(sourceFilePath), { recursive: true });
  fs.writeFileSync(sourceFilePath, "export const runtime = true;\n");
  return sourceFilePath;
}

afterEach(() => {
  for (const temporaryDirectory of temporaryDirectories.splice(0)) {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

describe("copy runtime source", () => {
  it("copies src into the Neutralino dist folder for packaged extensions", () => {
    const projectRoot = createTemporaryProjectRoot();
    createRuntimeSourceFixture(projectRoot);

    const copiedTargetPath = copyRuntimeSource(projectRoot);
    const { targetPath } = getRuntimeSourcePaths(projectRoot);
    const copiedFilePath = path.join(targetPath, "backend", "database.js");

    expect(copiedTargetPath).toBe(targetPath);
    expect(fs.readFileSync(copiedFilePath, "utf8")).toContain("runtime = true");
  });
});
