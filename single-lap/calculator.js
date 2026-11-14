(function (factory) {
  const calculator = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = calculator;
  } else {
    window.WAAMSingleLap = calculator;
  }
})(function () {
  "use strict";

  const ASCE_THICKNESS_LIMIT_MM = 4.7625;
  const fieldLabels = {
    fy: "Yield strength fᵧ",
    fu: "Ultimate strength fᵤ",
    t: "Plate thickness t",
    db: "Nominal bolt diameter dᵦ",
    dh: "Bolt-hole diameter dₕ",
    e1: "End distance e₁",
    e2: "Edge distance e₂",
    b: "Plate width b",
  };

  class ValidationError extends Error {
    constructor(errors) {
      super(errors.join(" "));
      this.name = "ValidationError";
      this.errors = errors;
    }
  }

  function normalizeInputs(data) {
    const errors = [];
    const material = String(data.material ?? "").trim().toUpperCase();
    if (material !== "ASS" && material !== "DSS") {
      errors.push("Select ASS or DSS for the WAAM plate.");
    }

    const inputs = { material };
    for (const [key, label] of Object.entries(fieldLabels)) {
      const raw = data[key];
      const missing = raw == null || (typeof raw === "string" && raw.trim() === "");
      if (missing && (key === "b" || key === "e2")) continue;

      const value = typeof raw === "number" || typeof raw === "string" ? Number(raw) : NaN;
      if (!Number.isFinite(value) || value <= 0) {
        errors.push(`${label} must be a positive number.`);
      } else {
        inputs[key] = value;
      }
    }
    if (errors.length) throw new ValidationError(errors);

    if (inputs.b === undefined && inputs.e2 === undefined) {
      errors.push("Enter either plate width b or edge distance e₂.");
    } else if (inputs.b === undefined) {
      inputs.b = 2 * inputs.e2;
      if (!Number.isFinite(inputs.b)) errors.push("The calculated plate width must be finite.");
    } else if (inputs.e2 === undefined) {
      inputs.e2 = inputs.b / 2;
    } else if (Math.abs(inputs.b / 2 - inputs.e2) > 1e-9 * inputs.e2) {
      errors.push("Plate width and edge distance must satisfy b = 2e₂.");
    }

    const { fy, fu, db, dh, e1, e2, b } = inputs;
    if (fy > fu) errors.push("Yield strength fᵧ must not exceed ultimate strength fᵤ.");
    if (!Number.isInteger(db) || db > 30) {
      errors.push("Nominal bolt diameter dᵦ must be a positive whole number up to 30 mm.");
    } else {
      const [min, max] = db < 12 ? [0.5, 1.5] : db <= 23 ? [1.5, 2.5] : [2.5, 3.5];
      if (dh - db < min || dh - db > max) {
        errors.push(`For dᵦ = ${db} mm, the hole clearance dₕ − dᵦ must be ${min} to ${max} mm.`);
      }
    }
    if (e1 <= dh / 2) errors.push("End distance e₁ must be greater than dₕ / 2.");
    if (b <= dh || e2 <= dh / 2) {
      errors.push("Edge distance e₂ must be greater than dₕ / 2 so that b exceeds dₕ.");
    }
    if (errors.length) throw new ValidationError(errors);
    return inputs;
  }

  function governingMethod(key, name, NSR, SOF, BF) {
    const candidates = { NSR, SOF, BF };
    const resistance = Math.min(NSR, SOF, BF);
    // Use the workbook's NSR, SOF, BF order for ties within floating-point precision.
    const mode = Object.keys(candidates).find(
      (branch) => Math.abs(candidates[branch] - resistance) <= 8 * Number.EPSILON * resistance,
    );
    return { key, name, resistance, mode, candidates };
  }

  // The same nominal equations apply to the workbook's measured hole diameters.
  // The public form uses calculate() to enforce its standard-hole input rules.
  function evaluatePlateResistance({ fy, fu, t, db, dh, e1, e2, b }) {
    const scale = (t * fu) / 1000;
    const netSection = (b - dh) * scale;
    const bearing = db * scale;
    const endRatio = e1 / dh;
    const netShear = 2 * (e1 - dh / 2) * scale;
    const grossShear = endRatio * bearing;
    const wideEdge = e2 / dh > 1.5;
    const thinPlate = t <= 4;

    const aisc360Shear = 0.75 * netShear;
    const aisc370Shear = (5 / 6) * grossShear;
    const aisc370Bearing = (wideEdge ? 2.5 : 2) * bearing;
    const asceNetSection = (0.9 + 0.1 * db / b) * netSection;
    const km = fy <= 460 ? 1 : 0.9;
    const k1 = wideEdge ? 1 : 0.8;
    const ec34Shear = thinPlate ? 0.8 * grossShear : k1 * aisc370Shear;
    const ec34Bearing = thinPlate ? 1.6 * bearing : aisc370Bearing;
    const proposedNetSection = (0.85 + 0.15 * dh / b) * netSection;
    const proposedBearing = 2.2 * bearing;

    const methods = [
      governingMethod("AISC360", "ANSI/AISC 360-22", netSection, aisc360Shear, 3 * bearing),
      governingMethod("AISC370", "ANSI/AISC 370-25", netSection, aisc370Shear, aisc370Bearing),
      {
        ...governingMethod("ASCE8", "ASCE/SEI 8-22", asceNetSection, 0.6 * netShear, 2.65 * 0.75 * bearing),
        comparisonOnly: t > ASCE_THICKNESS_LIMIT_MM,
      },
      governingMethod("EC3-8", "EN 1993-1-8:2024", netSection, km * grossShear, 1.5 * bearing),
      governingMethod("EC3-4", "EN 1993-1-4:2025", netSection, ec34Shear, ec34Bearing),
      governingMethod("pro,nv", "Proposed-nv", proposedNetSection, aisc360Shear, proposedBearing),
      governingMethod("pro,gv", "Proposed-gv", proposedNetSection, 1.1 * grossShear, proposedBearing),
    ];

    return { methods };
  }

  function calculate(data) {
    const inputs = normalizeInputs(data);
    const { methods } = evaluatePlateResistance(inputs);

    if (methods.some(({ candidates }) => Object.values(candidates).some(invalidResistance))) {
      throw new ValidationError(["The entered values exceed the numerical range of the calculator."]);
    }

    const { e1, e2, dh, t } = inputs;
    const outside = [];
    if (e1 / dh < 1.2) outside.push("e₁ / dₕ < 1.2");
    if (e2 / dh < 1.2) outside.push("e₂ / dₕ < 1.2");
    if (t > 5) outside.push("t > 5 mm");
    const warning = outside.length
      ? `Outside the recommended range for the proposed methods (${outside.join(", ")}).`
      : "";

    return { inputs, methods, warning };
  }

  function invalidResistance(value) {
    return !Number.isFinite(value) || value <= 0;
  }

  return { calculate, evaluatePlateResistance, ValidationError };
});
