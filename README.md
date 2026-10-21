# CUT-Master-Pro

A professional bar cutting optimization web application built for **Acier d'Armature Lafrance Inc**.

Import a list of pieces (quantity + length) and CUT-Master-Pro computes a cutting plan that uses as few stock bars as possible while minimizing waste.

## Features

- **File import**: Excel (`.xlsx`) or CSV, via drag & drop or file picker
- **Validation**: clear, row-by-row error messages (invalid quantity, invalid length, piece longer than the bar)
- **Configurable bar length** (default 6000 mm)
- **Optimization engine**: First Fit Decreasing + Best Fit Decreasing, followed by local improvement
- **Statistics**: total demanded length, theoretical minimum bars, bars used, total waste, average waste per bar, waste rate (2 decimals)
- **Summary by used length** (e.g. `137 bars × 6000 mm`)
- **Grouped visualization**: identical bars are shown once with an `N×` count, the calculation formula (e.g. `4650 + 1220 = 5870 mm`) and a collapsible list of bar numbers
- **Filters**: all bars / full bars / bars with waste, with totals per filter
- **Sort by waste** (descending, ascending, default)
- **Data preview** with a "Show more" button for large files
- **Export** of the cutting plan to CSV or Excel

## Input file format

The file must contain at least two columns. Each row is one piece type.

| Column   | Accepted names                                         |
|----------|--------------------------------------------------------|
| Quantity | `Quantité`, `quantite`, `qty`, `quantity`, `qté`, `qte` |
| Length   | `Longueur`, `longueur_mm`, `length`, `Longueur (mm)`, `long` |

Example:

```csv
Quantité,Longueur
3,1200
2,2500
5,610
```

Lengths are in millimeters. Quantities must be positive integers.

## Optimization algorithm

1. All pieces are expanded individually and sorted by decreasing length.
2. Two heuristics run in parallel:
   - **First Fit Decreasing (FFD)**: place each piece in the first bar where it fits.
   - **Best Fit Decreasing (BFD)**: place each piece in the bar that leaves the smallest remainder.
3. The best plan is chosen: **fewest bars first, then least total waste**.
4. **Local improvement** refines the plan by:
   - eliminating bars (redistributing their pieces into others),
   - moving pieces to tighter-fitting bars,
   - swapping pieces between bars to concentrate waste.

The strategy used is displayed in the results. New strategies (e.g. an exact solver) can be added through the `OptimizerStrategy` interface.

## Architecture

```text
src/
├── lib/
│   ├── types.ts        # TypeScript types
│   ├── parser.ts       # CSV / XLSX parsing
│   ├── validator.ts    # Validation and normalization
│   ├── optimizer.ts    # Optimization engine
│   ├── statistics.ts   # Metrics computation
│   └── exporter.ts     # CSV / Excel export
├── components/
│   ├── FileDropzone.tsx
│   ├── ValidationErrors.tsx
│   ├── DataPreview.tsx
│   ├── StatsCards.tsx
│   └── CuttingPlan.tsx
└── pages/
    └── Index.tsx       # Main page
```

Business logic (`src/lib`) is fully separated from the UI (`src/components`).

## Getting started

Prerequisites: Node.js 18+ and npm.

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:8080)
npm run build    # production build
npm test         # run tests
```

## Tech stack

React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, SheetJS (`xlsx`), PapaParse.

## Author

© Cadi M Riadh — Acier d'Armature Lafrance Inc. All rights reserved.
