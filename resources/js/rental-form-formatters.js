function digitsOnly(value = "") {
  return String(value).replace(/\D+/g, "");
}

function trimText(value = "") {
  return String(value).trim();
}

function formatCpf(value) {
  return value
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatCnpj(value) {
  return value
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatDocumentValue(value = "") {
  const digits = digitsOnly(value).slice(0, 14);
  if (digits.length <= 11) {
    return formatCpf(digits);
  }
  return formatCnpj(digits);
}

export function formatPhoneValue(value = "") {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 6) {
    return digits.replace(/^(\d{2})(\d+)/, "($1) $2");
  }
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
  }
  return digits.replace(/^(\d{2})(\d{5})(\d+)/, "($1) $2-$3");
}

function numericCents(value = "") {
  return digitsOnly(value).slice(0, 12);
}

export function formatCurrencyInputValue(value = "") {
  const cents = numericCents(value);
  if (!cents) {
    return "";
  }
  const amount = Number(cents) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export function parseCurrencyInputValue(value = "") {
  const cents = numericCents(value);
  if (!cents) {
    return 0;
  }
  return Number(cents) / 100;
}

export function normalizeStateValue(value = "") {
  return trimText(value).toUpperCase().slice(0, 2);
}

export function normalizeCodeValue(value = "") {
  return trimText(value).toUpperCase();
}

function normalizeBasePayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, trimText(value)])
  );
}

function normalizeOwnerPayload(payload) {
  return {
    ...normalizeBasePayload(payload),
    document: formatDocumentValue(payload.document),
    phone: formatPhoneValue(payload.phone),
  };
}

function normalizeTenantPayload(payload) {
  return {
    ...normalizeBasePayload(payload),
    document: formatDocumentValue(payload.document),
    phone: formatPhoneValue(payload.phone),
  };
}

function normalizePropertyPayload(payload) {
  return {
    ...normalizeBasePayload(payload),
    code: normalizeCodeValue(payload.code),
    state: normalizeStateValue(payload.state),
    monthly_rent: parseCurrencyInputValue(payload.monthly_rent),
  };
}

function normalizeContractPayload(payload) {
  return {
    ...normalizeBasePayload(payload),
    due_day: Number(payload.due_day),
    rent_amount: parseCurrencyInputValue(payload.rent_amount),
    deposit_amount: parseCurrencyInputValue(payload.deposit_amount),
  };
}

export function normalizeFormPayload(formId, payload) {
  if (formId === "owner-form") {
    return normalizeOwnerPayload(payload);
  }
  if (formId === "tenant-form") {
    return normalizeTenantPayload(payload);
  }
  if (formId === "property-form") {
    return normalizePropertyPayload(payload);
  }
  if (formId === "contract-form") {
    return normalizeContractPayload(payload);
  }
  return normalizeBasePayload(payload);
}

export function applyInputMask(field) {
  if (field.dataset.mask === "document") {
    field.value = formatDocumentValue(field.value);
    return;
  }
  if (field.dataset.mask === "phone") {
    field.value = formatPhoneValue(field.value);
    return;
  }
  if (field.dataset.mask === "currency") {
    field.value = formatCurrencyInputValue(field.value);
    return;
  }
  if (field.dataset.mask === "state") {
    field.value = normalizeStateValue(field.value);
    return;
  }
  if (field.dataset.mask === "code") {
    field.value = normalizeCodeValue(field.value);
  }
}

export function applyInputMasks(root = document) {
  root.querySelectorAll("[data-mask]").forEach(applyInputMask);
}
