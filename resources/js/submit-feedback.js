const ENTITY_LABELS = {
  owners: "Proprietario",
  tenants: "Inquilino",
  properties: "Imovel",
  contracts: "Contrato",
};

function commandParts(command = "") {
  return String(command).split(".");
}

function commandEntity(command = "") {
  return commandParts(command)[0];
}

function commandAction(command = "") {
  return commandParts(command)[1];
}

export function submitFeedback(command = "") {
  const entity = ENTITY_LABELS[commandEntity(command)] ?? "Registro";
  const action = commandAction(command);

  if (action === "update") {
    return {
      pending: `Salvando ${entity.toLowerCase()}...`,
      success: `${entity} atualizado com sucesso.`,
    };
  }

  return {
    pending: `Salvando ${entity.toLowerCase()}...`,
    success: `${entity} salvo com sucesso.`,
  };
}
