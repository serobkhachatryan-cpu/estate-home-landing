# Oriel · product stages (homework)

Discussion takeaway: build for **Timur’s home** first. Marketing landing is secondary.

## Stage 1 — now (updated from Timur’s spend sketch)

- One real home: Timur
- Spend ledger: **Plan · Fact · Forecast**
- **Parameters:** occupancy, staff, utilities, transportation, renovation, inventory (policies inside), insurance, livestock (garden inside)
- **Utilities · energy:** Revolut-style weekly tape — 52 weeks plan/fact back, 52 weeks forecast/cashflow forward, scrollable, with efficiency + house notes
- **Cash flow** strip with period draws
- Paid → received for energy/water remains as a supporting view
- **Out of scope now:** cameras as a surveillance product (security spend can still appear as a cost line)

## Stage 2 — next

- Methodology for natural wear
- Stronger trust in Plan vs Fact drivers
- Investment / upgrade results over time

## Stage 3 — later

- Video surveillance / people-tracking product surfaces
- Broad multi-system estate console
- Marketing-led push

## Working routes

| Route                         | Role                                      |
| ----------------------------- | ----------------------------------------- |
| `/app`                        | Home · Plan/Fact/Forecast + parameters    |
| `/app/spending`               | Full spend ledger                         |
| `/app/spending/[parameter]`   | Parameter + diagram + subparameters        |
| `/app/spending/[parameter]/[sub]` | Subparameter Plan/Fact/Forecast + diagram |
| `/app/spending/utilities`     | Utilities drill-in (sketch expansion)     |
| `/app/electricity`            | Energy detail (from utilities → energy)   |
| `/app/water`                  | Water detail                              |
| `/app/value`                  | Paid → received board                     |
| `/app/stages`                 | This plan in the product                  |
