(() => {
  "use strict";

  const form = document.getElementById("calculator-form");
  const resultsBody = document.getElementById("results-body");
  const summary = document.getElementById("result-summary");
  const range = document.getElementById("result-range");
  const table = document.getElementById("result-table");
  const placeholder = document.getElementById("results-placeholder");
  const message = document.getElementById("message-box");
  const bInput = document.getElementById("b-input");
  const e2Input = document.getElementById("e2-input");
  const modeNames = {
    NSR: "Net-section rupture",
    SOF: "Shear-out or end-distance-controlled branch",
    BF: "Bearing failure",
  };

  function methodRow({ method, resistance, mode }, maximum) {
    const row = document.createElement("tr");
    const label = document.createElement("th");
    label.scope = "row";
    label.textContent = method;
    row.append(label);

    const value = row.insertCell();
    value.className = "resistance";
    value.textContent = resistance.toFixed(2);

    const modeLabel = document.createElement("abbr");
    modeLabel.textContent = mode;
    modeLabel.title = modeNames[mode];
    modeLabel.className = `mode-badge ${mode.toLowerCase()}`;
    row.insertCell().append(modeLabel);

    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("span");
    fill.className = "bar-fill";
    fill.style.width = maximum ? `${100 * resistance / maximum}%` : "0%";
    track.append(fill);
    row.insertCell().append(track);
    return row;
  }

  function setMessage(messages, kind) {
    const text = messages.join(" ");
    if (message.textContent !== text) message.textContent = text;
    message.dataset.kind = kind;
  }

  function updatePrediction() {
    try {
      const inputs = Object.fromEntries(new FormData(form));
      const { methods, warnings } = WAAMCalculator.calculate(inputs);
      const values = methods.map(({ resistance }) => resistance);
      const maximum = Math.max(...values);
      range.textContent = `${Math.min(...values).toFixed(2)} – ${maximum.toFixed(2)} kN`;
      resultsBody.replaceChildren(...methods.map((method) => methodRow(method, maximum)));
      summary.hidden = false;
      table.hidden = false;
      placeholder.hidden = true;
      setMessage(warnings, "warning");
    } catch (error) {
      summary.hidden = true;
      table.hidden = true;
      placeholder.hidden = false;
      const errors = error instanceof WAAMCalculator.ValidationError
        ? error.errors
        : [`Calculation failed: ${error.message}`];
      setMessage(errors, "error");
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

  document.getElementById("reset-button").addEventListener("click", () => {
    form.reset();
    updatePrediction();
  });

  updatePrediction();
})();
