# WAAM Stainless Steel Bolted Connection Calculator

Calculation tools for WAAM austenitic and duplex stainless steel single-bolt,
bearing-type connections.

## Online edition

- [Double shear calculator](https://wenkang-zuo.github.io/waam-bolted-connection-calculator/)
- [Single shear calculator](https://wenkang-zuo.github.io/waam-bolted-connection-calculator/single-lap/)

The online edition requires no installation and supports rapid single-case
prediction. All calculations run locally in the browser, and no input data are
uploaded.

## Local edition

Both local editions support single-case prediction, Excel or CSV batch input,
and Excel result export. The single shear edition can read the
`Single_lap_batch` worksheet directly.

- [Download the double shear local edition](downloads/WAAM-Bolted-Connection-Calculator-local.zip)
- [Download the single shear local edition](downloads/WAAM-Bolted-Connection-Calculator-single-shear-local.zip)

Extract the ZIP and read its `README.md` for installation instructions. Python
3.10 or later is required. No third-party Python packages are needed.

## Double shear methods

- ANSI/AISC 360-22
- ANSI/AISC 370-25
- ASCE/SEI 8-22
- EN 1993-1-8:2024
- EN 1993-1-4:2025
- Literature method
- Proposed-gv
- Proposed-av

The reported outputs are the nominal ultimate resistance and governing plate
failure mode: net-section rupture, shear-out failure, or bearing failure.

## Single shear methods

The single-lap calculator compares the five standards above using the study's
single-shear equations, together with Proposed-nv and Proposed-gv. The in-app
Methodology & Scope tab documents the equations, applicability and references,
including the experimental studies on 316L austenitic and ER2209 duplex
stainless steel single-lap connections.

## Scope

The calculators evaluate plate-related resistance. The double-lap calculator
evaluates the inner WAAM stainless steel plate. The single-lap calculator
evaluates the WAAM plate in a single-shear connection with a standard round
hole and no washers. Bolt failure, frictional slip, and failure of companion or
cover plates are outside the scope of these calculations.
