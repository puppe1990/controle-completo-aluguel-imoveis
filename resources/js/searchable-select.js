export function normalizeSearchableText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function selectOptionRecord(option) {
  return {
    value: option.value,
    label: option.textContent?.trim() ?? "",
    disabled: Boolean(option.disabled),
  };
}

export function selectOptionsSnapshot(select) {
  return Array.from(select.options).map(selectOptionRecord);
}

function isSearchableChoice(option) {
  return !option.disabled && option.value !== "";
}

export function filterSearchableOptions(options, query = "") {
  const term = normalizeSearchableText(query);
  if (!term) {
    return options.filter(isSearchableChoice);
  }
  return options
    .filter((option) => {
      return isSearchableChoice(option);
    })
    .filter((option) => {
      return normalizeSearchableText(option.label).includes(term);
    });
}

export function selectedSearchableLabel(options, value) {
  return (
    options.find((option) => option.value === String(value ?? ""))?.label ?? ""
  );
}

function isFreeTextSearchable(container) {
  return container?.dataset.searchableFreeText === "true";
}

function searchableParts(container) {
  return {
    input: container.querySelector("[data-searchable-input]"),
    menu: container.querySelector("[data-searchable-menu]"),
    select: container.querySelector("[data-searchable-native]"),
  };
}

function renderSearchableOption(menu, option) {
  const optionButton = document.createElement("button");
  optionButton.type = "button";
  optionButton.className = "search-select__option";
  optionButton.dataset.searchableOption = option.value;
  optionButton.textContent = option.label;
  menu.append(optionButton);
}

function renderSearchableEmptyState(menu, query) {
  const emptyState = document.createElement("div");
  emptyState.className = "search-select__empty";
  emptyState.textContent = `Nenhum resultado para "${query}".`;
  menu.append(emptyState);
}

function syncSearchableInput(container) {
  const { input, select } = searchableParts(container);
  const options = selectOptionsSnapshot(select);
  const selectedLabel = selectedSearchableLabel(options, select.value);
  container.dataset.selectedLabel = selectedLabel;
  if (isFreeTextSearchable(container)) {
    input.value = container.dataset.freeTextValue ?? "";
    input.placeholder = input.dataset.searchPlaceholder || "";
    return;
  }
  input.value = selectedLabel;
  input.placeholder = input.dataset.searchPlaceholder || "";
}

export function closeSearchableSelects(root = document) {
  root.querySelectorAll("[data-searchable-select]").forEach((container) => {
    container.dataset.open = "false";
  });
}

export function renderSearchableOptions(container, query = "") {
  const { menu, select } = searchableParts(container);
  const options = filterSearchableOptions(selectOptionsSnapshot(select), query);
  menu.replaceChildren();
  if (!options.length) {
    renderSearchableEmptyState(menu, query);
    return;
  }
  options.forEach((option) => renderSearchableOption(menu, option));
}

export function openSearchableSelect(container) {
  const { input } = searchableParts(container);
  input.value = isFreeTextSearchable(container)
    ? (container.dataset.freeTextValue ?? "")
    : "";
  input.placeholder = input.dataset.searchPlaceholder || "";
  renderSearchableOptions(container, input.value);
  container.dataset.open = "true";
}

export function clearSearchableSelection(container) {
  const { input, select } = searchableParts(container);
  select.value = "";
  container.dataset.selectedLabel = "";
  if (isFreeTextSearchable(container)) {
    container.dataset.freeTextValue = input.value;
    input.placeholder = input.dataset.searchPlaceholder || "";
    return;
  }
  input.placeholder = input.dataset.searchPlaceholder || "";
}

export function selectSearchableOption(container, value) {
  const { input, select } = searchableParts(container);
  const options = selectOptionsSnapshot(select);
  select.value = value;
  container.dataset.selectedLabel = selectedSearchableLabel(options, value);
  if (isFreeTextSearchable(container)) {
    container.dataset.freeTextValue = container.dataset.selectedLabel;
  }
  input.value = container.dataset.selectedLabel;
  input.placeholder = input.dataset.searchPlaceholder || "";
  container.dataset.open = "false";
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

export function restoreSearchableInput(container) {
  const { input } = searchableParts(container);
  if (isFreeTextSearchable(container)) {
    input.value = container.dataset.freeTextValue ?? "";
    input.placeholder = input.dataset.searchPlaceholder || "";
    return;
  }
  input.value = container.dataset.selectedLabel || "";
  input.placeholder = input.dataset.searchPlaceholder || "";
}

/**
 * Stores the current free-text value for searchable inputs that are not bound
 * to a strict selection.
 * Example: setSearchableFreeTextValue(container, "Ana")
 */
export function setSearchableFreeTextValue(container, value) {
  if (!isFreeTextSearchable(container)) {
    return;
  }
  container.dataset.freeTextValue = String(value ?? "");
}

export function enhanceSearchableSelects(root = document) {
  root.querySelectorAll("[data-searchable-select]").forEach((container) => {
    syncSearchableInput(container);
    container.dataset.open = "false";
  });
}
