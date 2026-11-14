(() => {
  "use strict";

  const form = document.getElementById("connection-input");
  const bInput = form.elements.namedItem("b");
  const e2Input = form.elements.namedItem("e2");
  const message = document.getElementById("input-message");
  const methodResults = document.getElementById("method-results");
  const literatureResults = document.getElementById("literature-results");
  const tables = document.getElementById("result-tables");
  const placeholder = document.getElementById("results-placeholder");
  const thicknessScope = "Comparison only (t > 4.7625 mm)";
  const modeNames = {
    NSR: "Net-section rupture",
    SOF: "Shear-out or end-distance-controlled branch",
    BF: "Bearing cap",
  };

  function resultRow(name, resistance) {
    const row = document.createElement("tr");
    const label = document.createElement("th");
    label.scope = "row";
    label.textContent = name;
    row.append(label);
    const value = row.insertCell();
    value.className = "resistance";
    value.textContent = resistance.toFixed(2);
    return row;
  }

  function methodRow({ name, resistance, mode, comparisonOnly }) {
    const row = resultRow(name, resistance);
    if (comparisonOnly) {
      const status = document.createElement("span");
      status.className = "scope-note";
      status.textContent = thicknessScope;
      row.cells[0].append(status);
    }
    const label = document.createElement("abbr");
    label.textContent = mode;
    label.title = modeNames[mode];
    label.className = `mode ${mode.toLowerCase()}`;
    row.insertCell().append(label);
    return row;
  }

  function literatureRow({ name, resistance, branch }) {
    const row = resultRow(name, resistance);
    row.insertCell().textContent = branch;
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
      literatureResults.replaceChildren(...prediction.literature.map(literatureRow));
      tables.hidden = false;
      placeholder.hidden = true;
      setMessage(prediction.warning, prediction.warning ? "warning" : "");
    } catch (error) {
      tables.hidden = true;
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

  const tabs = Array.from(document.querySelectorAll(".section-tabs [role='tab']"));

  function selectTab(selected) {
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !active;
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      let next;
      switch (event.key) {
        case "ArrowLeft": next = (index + tabs.length - 1) % tabs.length; break;
        case "ArrowRight": next = (index + 1) % tabs.length; break;
        case "Home": next = 0; break;
        case "End": next = tabs.length - 1; break;
        default: return;
      }
      event.preventDefault();
      selectTab(tabs[next]);
      tabs[next].focus();
    });
  });

  updatePrediction();
})();
