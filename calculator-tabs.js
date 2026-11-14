const calculatorTabs = Array.from(document.querySelectorAll(".calculator-tabs [role='tab']"));

function selectCalculatorTab(selected) {
  for (const tab of calculatorTabs) {
    const active = tab === selected;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !active;
  }
}

calculatorTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectCalculatorTab(tab));
  tab.addEventListener("keydown", (event) => {
    let next;
    switch (event.key) {
      case "ArrowLeft": next = (index + calculatorTabs.length - 1) % calculatorTabs.length; break;
      case "ArrowRight": next = (index + 1) % calculatorTabs.length; break;
      case "Home": next = 0; break;
      case "End": next = calculatorTabs.length - 1; break;
      default: return;
    }
    event.preventDefault();
    selectCalculatorTab(calculatorTabs[next]);
    calculatorTabs[next].focus();
  });
});
