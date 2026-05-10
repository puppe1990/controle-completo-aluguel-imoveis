import { spawn } from "node:child_process";
import process from "node:process";
import chokidar from "chokidar";
import {
  getRestartWatchPaths,
  shouldRestartNeutralinoApp,
} from "./dev-runner-config.js";

const childProcesses = new Set();
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
let neutralinoProcess = null;
let restartTimer = null;

function spawnProcess(args) {
  const child = spawn(npmCommand, args, { stdio: "inherit" });
  childProcesses.add(child);
  child.on("exit", () => childProcesses.delete(child));
  return child;
}

function runScript(scriptName) {
  return spawnProcess(["run", scriptName]);
}

function runScriptAndWait(scriptName) {
  return new Promise((resolve, reject) => {
    const child = runScript(scriptName);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Script ${scriptName} falhou com codigo ${code}.`));
    });
  });
}

function startCssWatcher() {
  return runScript("dev:css");
}

function startNeutralinoApp() {
  neutralinoProcess = runScript("dev:app");
}

function stopNeutralinoApp() {
  if (!neutralinoProcess || neutralinoProcess.killed) {
    return;
  }
  neutralinoProcess.kill("SIGTERM");
}

function restartNeutralinoApp() {
  stopNeutralinoApp();
  startNeutralinoApp();
}

function scheduleNeutralinoRestart(filePath) {
  if (!shouldRestartNeutralinoApp(filePath)) {
    return;
  }
  clearTimeout(restartTimer);
  restartTimer = setTimeout(restartNeutralinoApp, 150);
}

function startBackendWatcher() {
  const watcher = chokidar.watch(getRestartWatchPaths(), {
    ignoreInitial: true,
  });
  watcher.on("all", (_eventName, filePath) =>
    scheduleNeutralinoRestart(filePath)
  );
  return watcher;
}

function shutdownProcess(child) {
  if (child && !child.killed) {
    child.kill("SIGTERM");
  }
}

function registerShutdown(watcher, cssWatcher) {
  const shutdown = () => {
    watcher.close();
    shutdownProcess(cssWatcher);
    shutdownProcess(neutralinoProcess);
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function main() {
  await runScriptAndWait("copy:neutralino");
  const cssWatcher = startCssWatcher();
  startNeutralinoApp();
  const watcher = startBackendWatcher();
  registerShutdown(watcher, cssWatcher);
}

main().catch((error) => {
  console.error(error.message);
  for (const child of childProcesses) {
    shutdownProcess(child);
  }
  process.exit(1);
});
