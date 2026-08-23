(function () {
  "use strict";

  const form = document.getElementById("response-form");
  const rows = Array.from(form.querySelectorAll(".criterion-question"));

  function selectedInputs(row) {
    return Array.from(row.querySelectorAll('input[type="checkbox"]:checked'));
  }

  function renderRow(row) {
    const selected = selectedInputs(row);
    const count = row.querySelector(".selection-count b");
    count.textContent = String(selected.length);
    row.classList.toggle("is-complete", selected.length === 2);
  }

  rows.forEach((row) => {
    row.addEventListener("change", (event) => {
      const input = event.target.closest('input[type="checkbox"]');
      if (!input) return;
      if (input.checked && selectedInputs(row).length > 2) {
        input.checked = false;
      }
      renderRow(row);
    });
    renderRow(row);
  });
})();
