(function () {
  "use strict";

  const rows = Array.from(document.querySelectorAll(".criterion"));

  function choices(row) {
    return Array.from(row.querySelectorAll(".choice"));
  }

  function renderRow(row) {
    const buttons = choices(row);
    const selected = buttons.filter((button) => button.getAttribute("aria-pressed") === "true");
    const atLimit = selected.length === 2;
    const status = row.querySelector(".selection-status");

    buttons.forEach((button) => {
      const isSelected = button.getAttribute("aria-pressed") === "true";
      button.disabled = atLimit && !isSelected;
    });

    row.classList.toggle("is-complete", selected.length === 2);
    status.textContent = selected.length === 0
      ? "No results selected."
      : `${selected.length} of 2 results selected: ${selected.map((button) => button.textContent.trim()).join(", ")}.`;
  }

  rows.forEach((row) => {
    row.addEventListener("click", (event) => {
      const button = event.target.closest(".choice");
      if (!button || button.disabled) return;

      const isSelected = button.getAttribute("aria-pressed") === "true";
      button.setAttribute("aria-pressed", String(!isSelected));
      renderRow(row);
    });

    renderRow(row);
  });
})();
