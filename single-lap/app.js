(() => {
  "use strict";

  const form = document.getElementById("connection-input");
  const bInput = form.elements.namedItem("b");
  const e2Input = form.elements.namedItem("e2");
  const message = document.getElementById("input-message");
  const methodResults = document.getElementById("method-results");
  const table = document.getElementById("result-table");
  const placeholder = document.getElementById("results-placeholder");
  const thicknessScope = "Comparison only (t > 4.7625 mm)";
  const modeNames = {
    NSR: "Net-section rupture",
    SOF: "Shear-out or end-distance-controlled branch",
    BF: "Bearing cap",
  };

  function methodRow({ name, resistance, mode, comparisonOnly }) {
    const row = document.createElement("tr");
    const label = document.createElement("th");
    label.scope = "row";
    label.textContent = name;
    row.append(label);
    if (comparisonOnly) {
      const status = document.createElement("span");
      status.className = "scope-note";
      status.textContent = thicknessScope;
      label.append(status);
    }

    const value = row.insertCell();
    value.className = "resistance";
    value.textContent = resistance.toFixed(2);

    const modeLabel = document.createElement("abbr");
    modeLabel.textContent = mode;
    modeLabel.title = modeNames[mode];
    modeLabel.className = `mode-badge ${mode.toLowerCase()}`;
    row.insertCell().append(modeLabel);
    return row;
  }

  function setMessage(text, kind = "") {
    if (message.textContent !== text) message.textContent = text;
    message.dataset.kind = kind;
  }

  function updatePrediction() {
    try {
      const inputs = Object.fromEntries(new FormData(form));
      const prediction = WAAMSingleLap.calculate(inputs);
      methodResults.replaceChildren(...prediction.methods.map(methodRow));
      table.hidden = false;
      placeholder.hidden = true;
      setMessage(prediction.warning, prediction.warning ? "warning" : "");
    } catch (error) {
      table.hidden = true;
      placeholder.hidden = false;
      if (error instanceof WAAMSingleLap.ValidationError) {
        setMessage(error.errors.join(" "), "error");
      } else {
        setMessage("The calculation could not be completed. Restore the example or reload the page.", "error");
        console.error(error);
      }
    }
  }

  function linkDimension(input, output, factor) {
    const value = input.valueAsNumber * factor;
    output.value = Number.isFinite(value) ? value.toString() : "";
  }

  form.addEventListener("input", (event) => {
    if (event.target === e2Input) linkDimension(e2Input, bInput, 2);
    if (event.target === bInput) linkDimension(bInput, e2Input, 0.5);
    updatePrediction();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updatePrediction();
  });

  document.getElementById("restore-example").addEventListener("click", () => {
    form.reset();
    updatePrediction();
  });

  updatePrediction();
})();
