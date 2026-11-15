# FlameWise data verification — 15 November 2026

## Result and scope

The audit covers **all 136 records currently included in FlameWise**, all ten investigation entries, seven source-located paraphrases, their source references and export units. It does not certify the physical accuracy of NASA sensor readings or verify every file in the PSI repository.

**Transcription and local data checks pass. Scientific interpretation remains partial where the underlying documentation is unavailable.**

## BASS-II: complete included-table check

The NASA PSI-25 Version 4 live experimental table was inspected through its two pages (100 and 30 displayed rows). The final entry has 17 empty cells. Thus the repository's display count of 130 comprises **129 nonempty tests and one blank trailing row**. No nonempty record is missing from FlameWise.

All 129 rows and 2,193 fields were compared against the local original CSV through per-row checksums after whitespace normalization and decoding CSV-escaped quotes. The NASA page retains literal CSV quoting around some inch-based material descriptions; a standards-compliant CSV parser correctly removes that serialization syntax. After this normalization, no row checksum differed. The combined FNV-1a comparison fingerprint is `0571bfdf`. This is a comparison checksum, not a cryptographic authentication claim.

The unchanged original local CSV SHA256 is:

`71e792bf6b5fb5ea620c5dd70fbbac05515992e12aefcf5dff47312caa48c042`

The automated audit independently reads the CSV using Python's standard library and compares every original field with the JavaScript records. It also checks **774 numeric sensor mappings**, row locations, unique IDs, source references and finite values. A local SHA256 establishes reproducibility of the retained file, not a NASA-issued signature.

### Quality findings retained, not repaired

| Issue | Records | Treatment |
|---|---:|---|
| Negative initial CO readings | 13 | Raw and numeric readings preserved; explicit flag |
| Initial-to-final oxygen change greater than 5 percentage points | 5 | Preserved and flagged; this screening rule is not a validated rejection criterion |
| Material chemistry incomplete in the raw description | 57 | No PMMA identity inferred from neighboring rows or PI |
| Nonnumeric/changing/empty air-display entries | 104 | Raw settings preserved; no scalar cm/s conversion |
| Empty air display | 4 | Explicit missing flag; subset of the preceding 104 |
| Date versus GMT day-of-year inconsistency | 1 (O10) | Source date and day preserved; not automatically corrected |
| Dates in 2018, unlike the dominant 2014/2016 records | 2 (T9, T18) | Flagged as year outliers, not declared wrong |

Missing or non-scalar normalized sensor values: final oxygen 2; initial CO 3; final CO 9; initial CO2 2; final CO2 6. Initial oxygen has no missing numeric values. Examples include `none`, `OR`, `over`, and `>500`. The latter is censored, not an exact reading of 500; its scalar value stays null and its original string remains available.

B2's final oxygen 1.6, P22a's 0.6, P22b's 39.1, T28a's 0.9 and T28b's 40.4 are confirmed transcriptions from the live source. Their scientific meaning is not established by this audit. No values were interpolated, shifted between columns or replaced with presumed corrections.

The CSV labels its oxygen fields **calibrated**. Earlier app language could imply that NASA had supplied uncalibrated readings; it now distinguishes the source's calibration label from FlameWise's incomplete independent interpretation. One air-display cell includes an explicit cm/s annotation together with other settings; this does not establish a scalar velocity for the whole test or a global conversion.

## Saffire: all seven included records checked

Reference: *Results of Large-Scale Spacecraft Flammability Tests*, 2017 NASA presentation, PDF pages 9, 12, 14, 16–17 and Table I on page 29.

| Record | Thickness mm | Flow cm/s | Initial ISS oxygen % | Spread mm/s | Burn duration s |
|---|---:|---:|---:|---:|---:|
| S1-main | 0.37 | 20 | 21.7 | 1.8 | 420 |
| S2-1 | 0.27 | 20 | 22.1 | Not reported | Not reported |
| S2-2 | 0.61 | 20 | 22.1 | Not reported | Not reported |
| S2-3 | 1.03 | 20 | 22.1 | Not reported | Not reported |
| S2-4 | 0.37 | 20 | 22.1 | Not reported | Not reported |
| S2-5 | 0.37 | 20 | 22.1 | 2.1 | 145 |
| S2-6 | 0.37 | 25 | 22.1 | 2.6 | 115 |

Three previously missing fabric thicknesses were filled from Table I. S2-4 is opposed flow; other included Saffire-II configurations are concurrent. Silicone residual flames did not spread after igniter power ended. “Insignificant” burn duration and “n/a” spread rate are not converted to numerical zeros.

Initial oxygen entries are identified as ISS atmosphere readings. Table I contains approximate/CO2-derived per-test oxygen entries, which must not be mistaken for a complete continuous atmosphere measurement. Field-level references and this qualification are now included in each record.

S1's subsequent opposed burn used remaining fabric; it is not represented as a fresh independent replicate. Saffire-II had nine samples; only six are currently ingested. No outcomes for the missing samples were invented. Saffire-III remains objective-level coverage using the selected 2017 source, despite later reports existing.

## Investigation and finding audit

| Entry | Audited evidence and disposition |
|---|---|
| BASS-II | PSI-25 metadata/DOI/license and complete included table checked; technical-report abstract supports stated aggregate findings; full report remains unavailable |
| BASS | NASA overview/guide support scope and glovebox context; PSI-26 is shown only as a supplied related identifier; no test-level measurements ingested |
| Saffire-I | Included conditions, ventilation shutoff observation, rate and duration checked |
| Saffire-II | Six included records and outcomes checked; differing flow/material/geometry remain explicit |
| Saffire-III | Objective distinguished from an observed outcome; no numerical record ingested |
| SAME | Corrected attribution: the 2013 report defines “SAME” to include SAME-1 (2007) and SAME-2 (2010); combined conclusions are not exclusive original-flight results |
| SAME-R | Reflight metadata and DOI checked; original-flight and reflight measurements are not substituted; shared report scope disclosed |
| FLEX | PSI-69 liquid-droplet scope and DOI checked; NASA cool-flame finding supported; no solid-fire suppressant dose inferred |
| ACME/BRE | Clarified that ACME is a programme and BRE one constituent investigation; gas-fed emulator methods are not direct solid-fuel outcomes |
| DAFT | NASA overview supports modified P-Trak instrumentation feasibility; not a certified detector-performance result |

All seven displayed source paraphrases were rechecked at the stated locations. Objectives and method statements are not relabeled as experimental findings. The 2015 guide is historical background, not a statement of current mission specifications. Apollo/Mir and Spinoff examples remain contextual sources, separate from numerical experiments.

## Unresolved scientific verification

1. The full BASS-II technical report is about 49 MB and exceeds the web retrieval limit. Abstract confirmation cannot replace table/calibration review.
2. Current PSI lists a BASS-II ReadMe, test-matrix workbook and fan-calibration workbook. Their presence was verified, but the readme download timed out; these files have not been reviewed. They are unavailable **to this audit**, not claimed absent from NASA.
3. The five unusual oxygen changes, 13 negative CO readings, censored readings, date inconsistency and material identities require source-specific interpretation. No universal “clean” subset or training-ready label is claimed.
4. Individual numerical SAME/SAME-R/FLEX datasets are not ingested. Their summaries cannot stand in for those datasets.
5. The introductory video remains unreviewed and supplies no findings or numerical data.

These unresolved items prevent calling the dataset fully scientifically validated. They do not undermine the verified transcription of the records actually included.

## Reproduce and inspect

Run `npm run verify:data`, `npm run check`, `npm run build`, and `npm test` from the project folder. Local checks do not automatically repeat the browser source comparison. Re-run the source review if NASA updates the table.

- `data/source-verification.json`: live-table observation, scope, row resolution and comparison fingerprint.
- `data/verification-results.json`: complete local audit, missingness and quality-flag counts.
- `data/source-audit.json`: source-by-source review scope and URLs.
- `data/ingestion-audit.json`: original-file SHA256, PI counts and resolved row count.
- `tests/data-verification.test.mjs`: report-reference assertions and source-anomaly regression checks.

### Principal references

- [NASA PSI-25 BASS-II](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25), DOI 10.60555/4qc4-de67.
- [BASS-II technical-report abstract](https://ntrs.nasa.gov/citations/20210011385).
- [Saffire presentation](https://ntrs.nasa.gov/api/citations/20170008805/downloads/20170008805.pdf), PDF pages 9, 12, 14, 16, 17, 29.
- [SAME combined-flight paper](https://ntrs.nasa.gov/api/citations/20140006579/downloads/20140006579.pdf), PDF pages 2 and 12.
- [NASA FLEX finding](https://www.nasa.gov/missions/station/iss-research/youre-hot-then-youre-cold/), “Discovering cool flames.”
- [NASA BRE description](https://science.nasa.gov/biological-physical/investigations/bre/).


## Follow-up review attempt, 15 November 2026

The full report link was resolved to `TM-20210011385.pdf` (48,972,416 bytes). The web reader rejected its size. Direct shell download failed DNS resolution; browser download did not provide a readable local file. The PSI page again listed the ReadMe (21.03 KB), test matrix (28.28 KB), and fan-calibration workbook (23.41 KB), but the selected-file download timed out. These documents have **not** been reviewed in full, and no flags have been cleared on that basis.

The Data laboratory now shows issue counts and conservative handling for negative CO, unusual oxygen changes, changing fan settings, incomplete material descriptions, and date conflicts. These descriptions explain data handling; they are not instrument-specific calibration conclusions. Original values and flags are preserved in exports.

## Additional report findings

Three quantitative findings are stored separately from individual test rows: combined-flight SAME average particle sizes (200–400 nm), the reported average-mass diameter ratio (1.7 under zero external flow versus standard flow), and the Saffire-III reported 320 s burn at 25 cm/s. Each includes scope, conditions, page location, and limitations. The 400/420 s Saffire-I source discrepancy remains explicit. FLEX quantitative extinction datasets remain unverified.
