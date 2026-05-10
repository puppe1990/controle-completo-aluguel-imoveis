import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { RentalRepository } from "../../src/backend/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databasePath = path.resolve(__dirname, "../../.data/imobiliaria.sqlite");
const repository = new RentalRepository(databasePath);
const processInput = JSON.parse(fs.readFileSync(0, "utf8") || "{}");

const client = new WebSocket(
  `ws://localhost:${processInput.nlPort}?extensionId=${processInput.nlExtensionId}&connectToken=${processInput.nlConnectToken}`
);

function reply(type, payload) {
  client.send(
    JSON.stringify({
      id: crypto.randomUUID(),
      method: "app.broadcast",
      accessToken: processInput.nlToken,
      data: {
        event: "backend:response",
        data: {
          type,
          payload,
        },
      },
    })
  );
}

function handleCommand(command, payload = {}) {
  switch (command) {
    case "bootstrap":
      return repository.snapshot(payload.today);
    case "seedDemo":
      return repository.seedDemoData();
    case "owners.create":
      repository.createOwner(payload);
      return repository.snapshot();
    case "tenants.create":
      repository.createTenant(payload);
      return repository.snapshot();
    case "properties.create":
      repository.createProperty(payload);
      return repository.snapshot();
    case "contracts.create":
      repository.createContract(payload);
      return repository.snapshot();
    case "receivables.pay":
      repository.recordPayment(payload.id, payload);
      return repository.snapshot();
    case "settings.export":
      return repository.exportData(payload.today);
    case "settings.import":
      return repository.importData(payload.backup);
    default:
      throw new Error(`Comando desconhecido: ${command}`);
  }
}

client.addEventListener("open", () => {
  reply("backend:ready", { ok: true });
});

client.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.event !== "backend:request") {
    return;
  }

  try {
    const result = handleCommand(message.data.command, message.data.payload);
    reply("backend:success", {
      requestId: message.data.requestId,
      result,
    });
  } catch (error) {
    reply("backend:error", {
      requestId: message.data.requestId,
      message: error.message,
    });
  }
});

client.addEventListener("close", () => {
  process.exit(0);
});
