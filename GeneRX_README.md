# GeneRX
**Finding your generic medicine — fast, free, and in your language.**

A civic technology mobile app that helps low-income Filipino patients find FDA-registered generic medicine alternatives, compare prices, and locate nearby pharmacies. Built for SolutionsFest 2026 — Governance & Civic Technology Track.

---

## What It Does

GeneRX solves a single, documented problem: the Philippine Generics Act (RA 6675) has existed since 1988, yet only 41% of patients are offered a generic alternative at the pharmacy counter. When pharmacies fail to offer one, 75% of patients do not ask. The information exists — it has just never been made usable for the people it was meant to serve.

GeneRX bridges that gap with three core features:

1. **Prescription Scanner** — Point your camera at a medicine box, blister pack, or doctor's prescription. PaddleOCR extracts the medicine name offline. Fuse.js fuzzy matching corrects OCR errors and maps the result to the correct generic equivalent in the local database.
2. **Generic Drug Lookup** — Search by brand name (typed or spoken) and instantly see FDA-registered generic equivalents, active ingredients, dosage, manufacturer, and the DOH Maximum Drug Retail Price (MDRP) ceiling.
3. **Pharmacy Locator** — A list of nearby pharmacies sorted by distance, with stock status and operating hours. Tapping a pharmacy deep-links directly to Google Maps for navigation — no embedded map required.

---

## Architecture

```
Prescription Image
       │
       ▼
Image Preprocessing (OpenCV)
- grayscale, noise removal
- contrast enhancement
- deskew / perspective correction
       │
       ▼
Offline OCR Engine (PaddleOCR)
       │
       ▼
Medicine Name Extraction
       │
       ▼
Fuzzy Matching (Fuse.js)
       │
       ▼
Local Medicine Database (SQLite / JSON)
       │
       ▼
Generic Alternative Suggestions + MDRP Price
```

---

## Confidence Scoring

GeneRX does not guess. Every match produces a confidence score combining OCR confidence and fuzzy match similarity:

| Score | Behavior |
|-------|----------|
| > 90% | Result displayed automatically |
| 70–90% | User asked to confirm |
| < 70% | User prompted to type manually |

---

## Data Sources

| Dataset | Purpose |
|---------|---------|
| Philippine FDA Drug Registry (PFDA) | Core generic drug matching |
| DOH National Drug Formulary (PNDF) | ~600 essential medicines |
| DOH Maximum Drug Retail Price (MDRP) | Price ceiling per drug |
| DOH Botika ng Barangay Directory | Pharmacy map data |
| Brand name alias table | Maps 50+ brand names per generic |
| NTI drug list | Safety flags for ~30 high-risk drugs |
| PDEA Controlled Substances list | Rx classification and scheduling |

MDRP data is bundled at install time and updated silently in the background when an internet connection is available. The app checks a remote version manifest — if the version has changed, the new dataset downloads automatically. Users never manage this manually.

---

## Pharmacy Locator — Deep Link Pattern

GeneRX does not render an embedded map. Instead it displays a scrollable pharmacy list with distance, stock status, and operating hours. Tapping **Get Directions** fires a deep link:

```javascript
// Priority: Google Place ID → coordinates → name search
const nativeUrl  = `geo:${lat},${lng}?q=${encodeURIComponent(name)}`;
const coordsUrl  = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
const placeUrl   = `https://www.google.com/maps/search/?api=1&query_place_id=${placeId}`;

Linking.canOpenURL(nativeUrl)
  .then(supported => Linking.openURL(supported ? nativeUrl : coordsUrl));
```

This approach reduces app size, works on low-end Android devices, and keeps the pharmacy list fully cacheable for offline use.

---

## Safety

- **NTI Warning Flags** — ~30 Narrow Therapeutic Index drugs (Warfarin, Digoxin, Lithium, Phenytoin, etc.) trigger a red banner: *"Consult your pharmacist or doctor before switching brands."*
- **Rx / OTC Badge** — every result shows whether a prescription is required.
- **Source badges** — every price and drug result shows its data source and last-updated date.
- GeneRX is a decision-support tool. It does not replace medical advice.

---

## Offline Support

- Top 100 most-prescribed medicines pre-cached at first launch.
- Pharmacy list cached to AsyncStorage on first load.
- NetInfo detects connectivity on app open — stale data is labeled with its last-updated date.
- Google Maps deep link fires independently of GeneRX's connectivity state.

---

## Languages

Filipino · Cebuano · English (with code-switching support)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo (Android + Web) |
| OCR | PaddleOCR (offline) |
| Image processing | OpenCV |
| Fuzzy matching | Fuse.js |
| Local database | SQLite / JSON |
| Pharmacy navigation | Google Maps deep link (Linking API) |
| Offline caching | AsyncStorage + NetInfo |

---

## Pilot Plan

| Period | Milestone |
|--------|-----------|
| Months 1–2 | MVP build — drug lookup, PFDA integration, pharmacy map |
| Month 3 | Soft launch in 3 pilot barangays, Cebu City |
| Month 4 | User feedback, Cebuano language layer |
| Months 5–6 | Expanded rollout, MDRP sync live, outcome report to DOH Region 7 |

---

## Team

**Leandro & Psalm** — BS Computer Science
SolutionsFest 2026 · Governance & Civic Technology Track · Cebu City, Philippines

---

> *"GeneRX is not asking the government to build something new. It is asking them to let the people it already built something for — actually use it."*
