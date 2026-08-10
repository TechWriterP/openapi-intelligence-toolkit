# SPIKE-007: Performance and Operational Suitability

## 1. Objective and prior-spike constraints

Determine whether the pinned candidates are operationally reasonable in the roles established by SPIKE-001–006. Speed does not override semantic evidence: Scalar retains strong schema/runtime fidelity and sparse source diagnostics; Redocly retains strong source locations and known structural false positives/negatives; IBM remains CLI-only evidence for OAS 3.0/3.1 with OAS 3.2 NOT_SUPPORTED; ADR-004/005 keep source loading and identity OAIT-owned. No production adapter, cache, telemetry, CLI, or CI workflow was built.

## 2. Environment and exact versions

- 2026-08-10T15:39:44.796Z; macOS 26.5.2 (Darwin), arm64, Apple M4, 10 logical CPUs, 16 GiB RAM.
- Node v24.18.0; npm 11.16.0; TypeScript 5.9.2; power mode NOT_IDENTIFIABLE.
- Scalar parser 0.28.10 / json-magic 0.12.19; Redocly 2.40.0; IBM 1.37.15.
- Local desktop invocation was noninteractive. Other applications, OS scheduling, filesystem caches, thermal state, and candidate execution order can affect timings; these are engineering observations, not laboratory-grade or universal SLAs.

## 3. Methodology and reproduction

Fixtures are deterministic YAML generated from code. Each operation has descriptions, query/header parameters, request bodies where applicable, two responses, reusable nested schemas, local refs, and API-key security. Single-file workloads contain 12, 100, and 500 operations. Multi-file medium/large equivalents shard paths and components without remote refs. Recursive controls retain a legal reference boundary. No candidate rewrites fixtures.

Warm in-process scenarios use one warm-up plus ten measured iterations in one loaded process. Cold Scalar/Redocly scenarios use three fresh Node processes and include module startup. IBM uses one warm-up plus ten measured CLI subprocess invocations; “warm IBM” is NOT_APPLICABLE. Durations use parent-side process.hrtime.bigint(). All raw samples are retained; no outliers were removed and GC was not forced. In-process memory records before, observed maximum after-sample values, after, and delta for RSS/heapUsed/heapTotal/external. IBM child peak RSS is NOT_AVAILABLE because no defensible portable measurement was available.

Execution order is recorded in result JSON and rotated between candidates/sizes. Numeric evidence is MEASURED except IBM validator-only duration (DERIVED as total CLI minus median empty-Node startup) and composite costs below (DERIVED). Semantic signatures, counts, and shapes—not timings—must repeat exactly.

Executed commands:

```bash
npm install
npm run fixtures
node --import tsx shared/collect-operational.ts
npm run typecheck
npm run benchmark:scalar
npm run benchmark:redocly
npm run benchmark:ibm
node --import tsx shared/augment-operational.ts
npm run refresh:operational
node --import tsx shared/generate-readme.ts
npx tsc --noEmit --skipLibCheck false
shasum -a 256 fixtures/**/*.yaml results/*.json
```

Reproduce the core experiment with `npm ci && npm run fixtures && npm run operational && npm run benchmark`, then refresh shared operational evidence and regenerate the README.

## 4. Workload inventory

| Mode | Size/version | Operations | Schemas | refs | Files | Bytes |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| single | medium / 3.1.2 | 100 | 21 | 371 | 1 | 85778 |
| single | medium / 3.0.4 | 100 | 21 | 371 | 1 | 85778 |
| single | medium / 3.2.0 | 100 | 21 | 371 | 1 | 85778 |
| single | small / 3.1.2 | 12 | 7 | 49 | 1 | 12725 |
| single | small / 3.0.4 | 12 | 7 | 49 | 1 | 12725 |
| single | small / 3.2.0 | 12 | 7 | 49 | 1 | 12725 |
| single | large / 3.1.2 | 500 | 51 | 1801 | 1 | 402323 |
| single | large / 3.0.4 | 500 | 51 | 1801 | 1 | 402323 |
| single | large / 3.2.0 | 500 | 51 | 1801 | 1 | 402323 |
| multi | medium / 3.1.2 | 100 | 21 | 422 | 4 | 82908 |
| multi | medium / 3.0.4 | 100 | 21 | 422 | 4 | 82908 |
| multi | medium / 3.2.0 | 100 | 21 | 422 | 4 | 82908 |
| multi | large / 3.1.2 | 500 | 51 | 2052 | 12 | 390773 |
| multi | large / 3.0.4 | 500 | 51 | 2052 | 12 | 390773 |
| multi | large / 3.2.0 | 500 | 51 | 2052 | 12 | 390773 |

Recursive controls use the 12-operation workload plus one tree operation and a self-referential schema. Controlled failure fixtures cover malformed YAML and an unresolved local ref. Three later evidence-review probe files compare IBM's inline and referenced handling of the same required-false path-parameter violation; their hashes are recorded separately and do not alter the established timing corpus.

## 5. Complete benchmark matrix

Every value is milliseconds except bytes and RSS. NFR applies only to large single-file parser/validation stages.

| Candidate | Version | Size | Layout | Stage | Ops | Bytes | Temperature | n | Min | Median | Mean | p95 | Max | Stddev | Memory | NFR |
| --- | --- | --- | --- | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Scalar | 3.1.2 | medium | single | load | 100 | 85778 | warm | 10 | 14.64 | 16.83 | 16.91 | 19.90 | 19.90 | 1.65 | 197.5 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | medium | single | load | 100 | 85778 | cold | 3 | 180.90 | 181.19 | 181.64 | 182.84 | 182.84 | 0.85 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | medium | single | validate | 100 | 85778 | warm | 10 | 31.83 | 33.07 | 34.46 | 45.24 | 45.24 | 3.81 | 273.8 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | medium | single | validate | 100 | 85778 | cold | 3 | 216.44 | 217.13 | 219.10 | 223.72 | 223.72 | 3.28 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | medium | single | bundle | 100 | 85778 | warm | 10 | 16.43 | 19.06 | 21.86 | 43.55 | 43.55 | 7.71 | 274.9 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | medium | single | bundle | 100 | 85778 | cold | 3 | 169.80 | 172.58 | 184.37 | 210.72 | 210.72 | 18.67 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | medium | single | load | 100 | 85778 | warm | 10 | 14.32 | 14.86 | 14.83 | 15.39 | 15.39 | 0.33 | 257.6 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | medium | single | load | 100 | 85778 | cold | 3 | 167.87 | 169.62 | 169.89 | 172.19 | 172.19 | 1.77 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | medium | single | validate | 100 | 85778 | warm | 10 | 30.95 | 32.29 | 33.64 | 45.08 | 45.08 | 3.96 | 272.0 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | medium | single | validate | 100 | 85778 | cold | 3 | 217.45 | 218.04 | 217.89 | 218.19 | 218.19 | 0.32 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | medium | single | bundle | 100 | 85778 | warm | 10 | 15.67 | 16.29 | 16.50 | 18.89 | 18.89 | 0.83 | 272.3 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | medium | single | bundle | 100 | 85778 | cold | 3 | 170.97 | 173.55 | 184.04 | 207.60 | 207.60 | 16.69 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | medium | single | load | 100 | 85778 | warm | 10 | 14.19 | 14.82 | 14.87 | 15.86 | 15.86 | 0.53 | 271.6 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | medium | single | load | 100 | 85778 | cold | 3 | 166.50 | 168.77 | 169.12 | 172.09 | 172.09 | 2.30 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | medium | single | validate | 100 | 85778 | warm | 10 | 33.23 | 34.52 | 36.82 | 47.49 | 47.49 | 4.84 | 302.6 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | medium | single | validate | 100 | 85778 | cold | 3 | 216.64 | 220.71 | 225.31 | 238.58 | 238.58 | 9.53 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | medium | single | bundle | 100 | 85778 | warm | 10 | 15.71 | 16.10 | 16.67 | 20.25 | 20.25 | 1.35 | 302.8 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | medium | single | bundle | 100 | 85778 | cold | 3 | 168.71 | 173.25 | 172.58 | 175.76 | 175.76 | 2.92 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | small | single | load | 12 | 12725 | warm | 10 | 2.05 | 2.12 | 2.21 | 2.90 | 2.90 | 0.24 | 302.8 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | small | single | load | 12 | 12725 | cold | 3 | 150.30 | 153.61 | 153.01 | 155.11 | 155.11 | 2.01 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | small | single | validate | 12 | 12725 | warm | 10 | 17.27 | 17.69 | 18.25 | 21.17 | 21.17 | 1.11 | 304.4 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | small | single | validate | 12 | 12725 | cold | 3 | 193.03 | 197.60 | 196.23 | 198.04 | 198.04 | 2.27 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | small | single | bundle | 12 | 12725 | warm | 10 | 2.35 | 2.51 | 2.57 | 3.27 | 3.27 | 0.26 | 304.5 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | small | single | bundle | 12 | 12725 | cold | 3 | 151.94 | 152.02 | 154.39 | 159.22 | 159.22 | 3.41 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | small | single | load | 12 | 12725 | warm | 10 | 2.04 | 2.24 | 2.28 | 2.97 | 2.97 | 0.26 | 304.6 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | small | single | load | 12 | 12725 | cold | 3 | 148.61 | 151.65 | 151.41 | 153.98 | 153.98 | 2.20 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | small | single | validate | 12 | 12725 | warm | 10 | 16.03 | 17.35 | 17.24 | 18.96 | 18.96 | 0.77 | 305.0 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | small | single | validate | 12 | 12725 | cold | 3 | 193.23 | 195.13 | 195.46 | 198.03 | 198.03 | 1.97 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | small | single | bundle | 12 | 12725 | warm | 10 | 2.36 | 2.59 | 2.81 | 4.06 | 4.06 | 0.55 | 305.2 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | small | single | bundle | 12 | 12725 | cold | 3 | 152.09 | 154.13 | 158.94 | 170.60 | 170.60 | 8.29 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | small | single | load | 12 | 12725 | warm | 10 | 2.07 | 2.12 | 2.21 | 2.65 | 2.65 | 0.20 | 305.2 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | small | single | load | 12 | 12725 | cold | 3 | 150.32 | 150.49 | 151.14 | 152.62 | 152.62 | 1.05 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | small | single | validate | 12 | 12725 | warm | 10 | 18.03 | 19.26 | 19.18 | 20.23 | 20.23 | 0.60 | 305.4 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | small | single | validate | 12 | 12725 | cold | 3 | 193.73 | 197.39 | 197.46 | 201.25 | 201.25 | 3.07 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | small | single | bundle | 12 | 12725 | warm | 10 | 2.38 | 2.54 | 2.52 | 2.81 | 2.81 | 0.12 | 305.0 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | small | single | bundle | 12 | 12725 | cold | 3 | 152.76 | 152.95 | 153.62 | 155.16 | 155.16 | 1.09 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | large | single | load | 500 | 402323 | warm | 10 | 67.02 | 71.13 | 70.57 | 76.13 | 76.13 | 2.84 | 344.7 MiB RSS | PASS |
| Scalar | 3.1.2 | large | single | load | 500 | 402323 | cold | 3 | 239.72 | 241.64 | 241.84 | 244.15 | 244.15 | 1.81 | N/A child RSS | PASS |
| Scalar | 3.1.2 | large | single | validate | 500 | 402323 | warm | 10 | 91.29 | 94.82 | 95.50 | 103.27 | 103.27 | 3.28 | 371.4 MiB RSS | PASS |
| Scalar | 3.1.2 | large | single | validate | 500 | 402323 | cold | 3 | 298.19 | 301.31 | 300.99 | 303.48 | 303.48 | 2.17 | N/A child RSS | PASS |
| Scalar | 3.1.2 | large | single | bundle | 500 | 402323 | warm | 10 | 71.45 | 77.29 | 77.62 | 91.17 | 91.17 | 5.37 | 417.0 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | large | single | bundle | 500 | 402323 | cold | 3 | 247.42 | 248.86 | 248.42 | 248.99 | 248.99 | 0.71 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | large | single | load | 500 | 402323 | warm | 10 | 67.76 | 70.04 | 70.16 | 73.04 | 73.04 | 1.71 | 410.3 MiB RSS | PASS |
| Scalar | 3.0.4 | large | single | load | 500 | 402323 | cold | 3 | 241.60 | 242.42 | 242.82 | 244.45 | 244.45 | 1.20 | N/A child RSS | PASS |
| Scalar | 3.0.4 | large | single | validate | 500 | 402323 | warm | 10 | 93.32 | 96.70 | 97.74 | 105.35 | 105.35 | 4.04 | 410.8 MiB RSS | PASS |
| Scalar | 3.0.4 | large | single | validate | 500 | 402323 | cold | 3 | 303.94 | 306.96 | 307.32 | 311.06 | 311.06 | 2.92 | N/A child RSS | PASS |
| Scalar | 3.0.4 | large | single | bundle | 500 | 402323 | warm | 10 | 71.96 | 77.07 | 77.81 | 92.85 | 92.85 | 5.80 | 417.6 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | large | single | bundle | 500 | 402323 | cold | 3 | 247.00 | 247.10 | 247.96 | 249.77 | 249.77 | 1.28 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | large | single | load | 500 | 402323 | warm | 10 | 67.98 | 69.32 | 70.12 | 73.62 | 73.62 | 1.83 | 411.0 MiB RSS | PASS |
| Scalar | 3.2.0 | large | single | load | 500 | 402323 | cold | 3 | 240.86 | 244.14 | 243.73 | 246.19 | 246.19 | 2.19 | N/A child RSS | PASS |
| Scalar | 3.2.0 | large | single | validate | 500 | 402323 | warm | 10 | 89.33 | 97.89 | 96.62 | 108.44 | 108.44 | 6.40 | 412.6 MiB RSS | PASS |
| Scalar | 3.2.0 | large | single | validate | 500 | 402323 | cold | 3 | 282.67 | 283.22 | 285.57 | 290.81 | 290.81 | 3.72 | N/A child RSS | PASS |
| Scalar | 3.2.0 | large | single | bundle | 500 | 402323 | warm | 10 | 67.36 | 71.15 | 72.09 | 85.02 | 85.02 | 4.72 | 420.2 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | large | single | bundle | 500 | 402323 | cold | 3 | 228.42 | 228.53 | 229.70 | 232.15 | 232.15 | 1.73 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | medium | multi-file | bundle | 100 | 82908 | warm | 10 | 16.67 | 17.49 | 17.76 | 20.74 | 20.74 | 1.24 | 413.2 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | medium | multi-file | bundle | 100 | 82908 | cold | 3 | 162.67 | 164.76 | 164.87 | 167.19 | 167.19 | 1.85 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | medium | multi-file | bundle | 100 | 82908 | warm | 10 | 16.47 | 16.83 | 16.83 | 17.50 | 17.50 | 0.30 | 415.3 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | medium | multi-file | bundle | 100 | 82908 | cold | 3 | 162.51 | 164.13 | 164.11 | 165.68 | 165.68 | 1.29 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | medium | multi-file | bundle | 100 | 82908 | warm | 10 | 16.51 | 16.88 | 16.99 | 18.85 | 18.85 | 0.64 | 415.3 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | medium | multi-file | bundle | 100 | 82908 | cold | 3 | 163.43 | 163.47 | 164.04 | 165.22 | 165.22 | 0.84 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | large | multi-file | bundle | 500 | 390773 | warm | 10 | 77.28 | 77.86 | 77.98 | 79.10 | 79.10 | 0.55 | 421.1 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.1.2 | large | multi-file | bundle | 500 | 390773 | cold | 3 | 235.72 | 240.56 | 244.07 | 255.93 | 255.93 | 8.62 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | large | multi-file | bundle | 500 | 390773 | warm | 10 | 76.53 | 77.65 | 78.50 | 82.48 | 82.48 | 2.09 | 418.7 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.0.4 | large | multi-file | bundle | 500 | 390773 | cold | 3 | 236.29 | 236.98 | 237.39 | 238.90 | 238.90 | 1.10 | N/A child RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | large | multi-file | bundle | 500 | 390773 | warm | 10 | 76.65 | 77.90 | 81.29 | 113.77 | 113.77 | 10.87 | 420.7 MiB RSS | NOT_APPLICABLE |
| Scalar | 3.2.0 | large | multi-file | bundle | 500 | 390773 | cold | 3 | 235.76 | 235.90 | 236.37 | 237.44 | 237.44 | 0.76 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.2.0 | small | single | bundle | 12 | 12725 | warm | 10 | 1.42 | 1.78 | 1.85 | 2.70 | 2.70 | 0.36 | 152.5 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.2.0 | small | single | bundle | 12 | 12725 | cold | 3 | 245.56 | 249.72 | 250.87 | 257.33 | 257.33 | 4.87 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.2.0 | small | single | lint | 12 | 12725 | warm | 10 | 1.48 | 1.67 | 1.69 | 2.41 | 2.41 | 0.26 | 154.9 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.2.0 | small | single | lint | 12 | 12725 | cold | 3 | 247.22 | 247.37 | 254.97 | 270.34 | 270.34 | 10.86 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.0.4 | small | single | bundle | 12 | 12725 | warm | 10 | 1.00 | 1.13 | 1.17 | 1.55 | 1.55 | 0.16 | 155.8 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.0.4 | small | single | bundle | 12 | 12725 | cold | 3 | 245.56 | 245.74 | 246.54 | 248.31 | 248.31 | 1.26 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.0.4 | small | single | lint | 12 | 12725 | warm | 10 | 1.09 | 1.22 | 1.24 | 1.48 | 1.48 | 0.10 | 156.0 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.0.4 | small | single | lint | 12 | 12725 | cold | 3 | 246.79 | 247.03 | 247.08 | 247.42 | 247.42 | 0.26 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.1.2 | small | single | bundle | 12 | 12725 | warm | 10 | 1.12 | 1.21 | 1.24 | 1.44 | 1.44 | 0.11 | 156.6 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.1.2 | small | single | bundle | 12 | 12725 | cold | 3 | 246.70 | 247.06 | 247.33 | 248.22 | 248.22 | 0.65 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.1.2 | small | single | lint | 12 | 12725 | warm | 10 | 1.25 | 1.36 | 1.37 | 1.57 | 1.57 | 0.11 | 156.7 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.1.2 | small | single | lint | 12 | 12725 | cold | 3 | 246.61 | 247.50 | 247.49 | 248.35 | 248.35 | 0.71 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.2.0 | large | single | bundle | 500 | 402323 | warm | 10 | 26.49 | 27.28 | 27.62 | 29.70 | 29.70 | 1.15 | 291.6 MiB RSS | PASS |
| Redocly | 3.2.0 | large | single | bundle | 500 | 402323 | cold | 3 | 293.39 | 293.94 | 294.14 | 295.09 | 295.09 | 0.71 | N/A child RSS | PASS |
| Redocly | 3.2.0 | large | single | lint | 500 | 402323 | warm | 10 | 29.48 | 29.75 | 29.85 | 30.43 | 30.43 | 0.32 | 309.1 MiB RSS | PASS |
| Redocly | 3.2.0 | large | single | lint | 500 | 402323 | cold | 3 | 293.68 | 295.06 | 294.78 | 295.61 | 295.61 | 0.81 | N/A child RSS | PASS |
| Redocly | 3.0.4 | large | single | bundle | 500 | 402323 | warm | 10 | 23.38 | 23.89 | 25.50 | 34.78 | 34.78 | 3.65 | 348.3 MiB RSS | PASS |
| Redocly | 3.0.4 | large | single | bundle | 500 | 402323 | cold | 3 | 292.53 | 296.60 | 297.55 | 303.53 | 303.53 | 4.54 | N/A child RSS | PASS |
| Redocly | 3.0.4 | large | single | lint | 500 | 402323 | warm | 10 | 26.62 | 26.99 | 26.98 | 27.76 | 27.76 | 0.32 | 341.9 MiB RSS | PASS |
| Redocly | 3.0.4 | large | single | lint | 500 | 402323 | cold | 3 | 291.72 | 291.90 | 291.86 | 291.97 | 291.97 | 0.10 | N/A child RSS | PASS |
| Redocly | 3.1.2 | large | single | bundle | 500 | 402323 | warm | 10 | 25.51 | 25.91 | 25.98 | 26.57 | 26.57 | 0.27 | 347.3 MiB RSS | PASS |
| Redocly | 3.1.2 | large | single | bundle | 500 | 402323 | cold | 3 | 291.20 | 291.34 | 292.86 | 296.04 | 296.04 | 2.25 | N/A child RSS | PASS |
| Redocly | 3.1.2 | large | single | lint | 500 | 402323 | warm | 10 | 29.00 | 29.45 | 29.39 | 29.69 | 29.69 | 0.18 | 351.5 MiB RSS | PASS |
| Redocly | 3.1.2 | large | single | lint | 500 | 402323 | cold | 3 | 291.94 | 293.32 | 293.18 | 294.27 | 294.27 | 0.96 | N/A child RSS | PASS |
| Redocly | 3.2.0 | medium | single | bundle | 100 | 85778 | warm | 10 | 5.71 | 5.92 | 5.99 | 6.77 | 6.77 | 0.29 | 351.6 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.2.0 | medium | single | bundle | 100 | 85778 | cold | 3 | 255.44 | 256.26 | 256.03 | 256.37 | 256.37 | 0.42 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.2.0 | medium | single | lint | 100 | 85778 | warm | 10 | 6.52 | 6.66 | 6.73 | 7.17 | 7.17 | 0.19 | 351.8 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.2.0 | medium | single | lint | 100 | 85778 | cold | 3 | 256.90 | 260.44 | 259.99 | 262.61 | 262.61 | 2.35 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.0.4 | medium | single | bundle | 100 | 85778 | warm | 10 | 4.92 | 5.08 | 5.13 | 5.61 | 5.61 | 0.24 | 356.1 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.0.4 | medium | single | bundle | 100 | 85778 | cold | 3 | 254.28 | 255.89 | 255.88 | 257.48 | 257.48 | 1.31 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.0.4 | medium | single | lint | 100 | 85778 | warm | 10 | 5.70 | 5.81 | 5.90 | 6.28 | 6.28 | 0.20 | 356.7 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.0.4 | medium | single | lint | 100 | 85778 | cold | 3 | 256.20 | 256.66 | 256.74 | 257.36 | 257.36 | 0.48 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.1.2 | medium | single | bundle | 100 | 85778 | warm | 10 | 5.70 | 5.90 | 5.93 | 6.37 | 6.37 | 0.21 | 361.2 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.1.2 | medium | single | bundle | 100 | 85778 | cold | 3 | 254.82 | 257.01 | 256.73 | 258.37 | 258.37 | 1.46 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.1.2 | medium | single | lint | 100 | 85778 | warm | 10 | 6.30 | 6.54 | 6.55 | 7.06 | 7.06 | 0.22 | 361.7 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.1.2 | medium | single | lint | 100 | 85778 | cold | 3 | 256.12 | 256.31 | 258.11 | 261.89 | 261.89 | 2.67 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.2.0 | large | multi-file | bundle | 500 | 390773 | warm | 10 | 26.43 | 27.62 | 27.38 | 28.24 | 28.24 | 0.52 | 419.9 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.2.0 | large | multi-file | bundle | 500 | 390773 | cold | 3 | 291.52 | 292.19 | 292.13 | 292.68 | 292.68 | 0.48 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.2.0 | large | multi-file | lint | 500 | 390773 | warm | 10 | 29.67 | 30.15 | 31.09 | 39.53 | 39.53 | 2.83 | 433.2 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.2.0 | large | multi-file | lint | 500 | 390773 | cold | 3 | 288.85 | 289.61 | 290.10 | 291.82 | 291.82 | 1.26 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.0.4 | large | multi-file | bundle | 500 | 390773 | warm | 10 | 22.93 | 24.15 | 24.77 | 32.22 | 32.22 | 2.54 | 414.6 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.0.4 | large | multi-file | bundle | 500 | 390773 | cold | 3 | 292.98 | 293.73 | 295.02 | 298.36 | 298.36 | 2.38 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.0.4 | large | multi-file | lint | 500 | 390773 | warm | 10 | 26.55 | 26.98 | 27.02 | 27.67 | 27.67 | 0.33 | 415.0 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.0.4 | large | multi-file | lint | 500 | 390773 | cold | 3 | 290.95 | 290.98 | 291.58 | 292.79 | 292.79 | 0.86 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.1.2 | large | multi-file | bundle | 500 | 390773 | warm | 10 | 25.50 | 25.69 | 25.84 | 26.47 | 26.47 | 0.34 | 415.6 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.1.2 | large | multi-file | bundle | 500 | 390773 | cold | 3 | 290.41 | 293.56 | 292.58 | 293.76 | 293.76 | 1.53 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.1.2 | large | multi-file | lint | 500 | 390773 | warm | 10 | 28.80 | 29.19 | 29.27 | 30.16 | 30.16 | 0.42 | 416.1 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.1.2 | large | multi-file | lint | 500 | 390773 | cold | 3 | 290.60 | 291.14 | 291.11 | 291.58 | 291.58 | 0.40 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.2.0 | medium | multi-file | bundle | 100 | 82908 | warm | 10 | 5.78 | 6.00 | 6.04 | 6.63 | 6.63 | 0.26 | 416.1 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.2.0 | medium | multi-file | bundle | 100 | 82908 | cold | 3 | 252.97 | 256.71 | 255.48 | 256.76 | 256.76 | 1.78 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.2.0 | medium | multi-file | lint | 100 | 82908 | warm | 10 | 6.48 | 6.78 | 6.71 | 6.94 | 6.94 | 0.16 | 416.1 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.2.0 | medium | multi-file | lint | 100 | 82908 | cold | 3 | 258.46 | 269.76 | 266.77 | 272.07 | 272.07 | 5.95 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.0.4 | medium | multi-file | bundle | 100 | 82908 | warm | 10 | 4.94 | 5.51 | 5.53 | 6.62 | 6.62 | 0.46 | 414.8 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.0.4 | medium | multi-file | bundle | 100 | 82908 | cold | 3 | 253.27 | 253.83 | 254.22 | 255.56 | 255.56 | 0.98 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.0.4 | medium | multi-file | lint | 100 | 82908 | warm | 10 | 5.84 | 6.02 | 6.15 | 6.95 | 6.95 | 0.33 | 414.8 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.0.4 | medium | multi-file | lint | 100 | 82908 | cold | 3 | 254.74 | 255.06 | 256.06 | 258.39 | 258.39 | 1.65 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.1.2 | medium | multi-file | bundle | 100 | 82908 | warm | 10 | 5.65 | 5.93 | 6.36 | 8.20 | 8.20 | 0.88 | 414.8 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.1.2 | medium | multi-file | bundle | 100 | 82908 | cold | 3 | 256.04 | 256.69 | 257.25 | 259.01 | 259.01 | 1.27 | N/A child RSS | NOT_APPLICABLE |
| Redocly | 3.1.2 | medium | multi-file | lint | 100 | 82908 | warm | 10 | 6.55 | 6.74 | 6.77 | 7.06 | 7.06 | 0.17 | 414.5 MiB RSS | NOT_APPLICABLE |
| Redocly | 3.1.2 | medium | multi-file | lint | 100 | 82908 | cold | 3 | 255.68 | 258.51 | 263.93 | 277.60 | 277.60 | 9.73 | N/A child RSS | NOT_APPLICABLE |
| IBM | 3.0.4 | medium | single | cli-validation | 100 | 85778 | cold CLI | 10 | 504.11 | 507.38 | 506.83 | 510.65 | 510.65 | 1.84 | N/A child RSS | NOT_APPLICABLE |
| IBM | 3.1.2 | medium | single | cli-validation | 100 | 85778 | cold CLI | 10 | 508.17 | 512.76 | 515.24 | 531.07 | 531.07 | 7.51 | N/A child RSS | NOT_APPLICABLE |
| IBM | 3.0.4 | large | single | cli-validation | 500 | 402323 | cold CLI | 10 | 2390.61 | 2407.92 | 2411.08 | 2447.14 | 2447.14 | 16.17 | N/A child RSS | PASS |
| IBM | 3.1.2 | large | single | cli-validation | 500 | 402323 | cold CLI | 10 | 2390.15 | 2408.45 | 2408.28 | 2428.44 | 2428.44 | 11.01 | N/A child RSS | PASS |
| IBM | 3.0.4 | small | single | cli-validation | 12 | 12725 | cold CLI | 10 | 342.70 | 344.67 | 345.07 | 348.59 | 348.59 | 2.03 | N/A child RSS | NOT_APPLICABLE |
| IBM | 3.1.2 | small | single | cli-validation | 12 | 12725 | cold CLI | 10 | 340.27 | 345.87 | 344.89 | 347.45 | 347.45 | 2.23 | N/A child RSS | NOT_APPLICABLE |
| IBM | 3.0.4 | large | multi-file | cli-entry-processing-with-resolution-errors | 500 | 390773 | cold CLI | 10 | 557.00 | 575.72 | 573.99 | 586.88 | 586.88 | 10.21 | N/A child RSS | NOT_APPLICABLE |
| IBM | 3.1.2 | large | multi-file | cli-entry-processing-with-resolution-errors | 500 | 390773 | cold CLI | 10 | 554.44 | 563.33 | 579.39 | 653.57 | 653.57 | 37.06 | N/A child RSS | NOT_APPLICABLE |
| IBM | 3.0.4 | medium | multi-file | cli-entry-processing-with-resolution-errors | 100 | 82908 | cold CLI | 10 | 363.80 | 369.31 | 368.77 | 373.46 | 373.46 | 2.76 | N/A child RSS | NOT_APPLICABLE |
| IBM | 3.1.2 | medium | multi-file | cli-entry-processing-with-resolution-errors | 100 | 82908 | cold CLI | 10 | 358.87 | 378.24 | 395.26 | 544.26 | 544.26 | 51.22 | N/A child RSS | NOT_APPLICABLE |

## 6. Key single-file, cold/warm, and NFR findings

- Scalar OAS 3.1 large: warm load 71.13 ms, warm validate 94.82 ms; cold medians 241.64 / 301.31 ms. Parsing and validation PASS the 2 s/5 s targets for all three versions.
- Redocly OAS 3.1 large: warm bundle/load 25.91 ms and struct lint 29.45 ms; cold medians 291.34 / 293.32 ms. Both targets PASS, without changing prior diagnostic correctness limitations.
- IBM OAS 3.1 large: total CLI median 2408.45 ms; empty Node startup median 19.91 ms; derived validator/ruleset work 2388.54 ms. Total CLI validation PASSes 5 s but is much less suitable for repeated interactive calls. OAS 3.2 is NOT_SUPPORTED and unbenchmarked.

## 7. Multi-file, recursion, failures, and repeated processing

Scalar and Redocly completed their applicable medium/large multi-file operations within bounded time; Redocly lint retains its source-rich role. IBM's main multi-file timing corpus did **not** complete equivalent successful validation: it exited nonzero with 304 errors on the large OAS 3.1 case (53 invalid-ref, 251 oas3-schema). Shard-local component references resolve against the shard rather than the entry document, and the whole Components Object reference is rejected. Its 563.33 ms value is retained as MEASURED diagnostic-heavy entry processing, not equivalent full-validation performance, and must not be compared to the 2408.45 ms successful single-file validation as if semantic work were equal.

The targeted IBM probe uses a path parameter with required false, detected reliably inline in SPIKE-006. IBM reports path-params for both the inline document and the externally referenced Path Item. This proves that the external file is resolved, loaded, traversed, and checked for this violation class; it does not establish universally complete referenced-file conformance. The main corpus's speed difference is explained by its invalid reference topology/nonzero diagnostic path, not demonstrated multi-file efficiency.

All candidates terminated on legal recursion. Scalar dereference also terminated but remains explicitly noncanonical and cyclic per prior evidence. Malformed and unresolved cases produced controlled results/errors; no hangs, infinite expansion, or uncontrolled subprocess spawning occurred.

Separate Scalar load/validate/bundle and Redocly bundle/lint calls repeat parsing/loading. IBM repeats process startup, ruleset loading, parsing, and validation every invocation. OAIT should retain appropriate source/candidate intermediates within one logical workflow where public API boundaries safely permit it, satisfying the direction of NFR-PERF-003; no cache was implemented.

## 8. Scaling matrix

Ratios use OAS 3.1 single-file primary stages. RSS ratios are observed whole-process maxima and are order/cache affected; they are not isolated retained-memory ratios.

| Candidate | Stage | Range | Operation ratio | Duration ratio | RSS ratio | Throughput at destination ops/s |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Scalar | load | small→medium | 8.33 | 7.95 | 0.65 | 5942.51 |
| Scalar | load | medium→large | 5.00 | 4.23 | 1.75 | 7029.10 |
| Scalar | load | small→large | 41.67 | 33.60 | 1.14 | 7029.10 |
| Scalar | validate | small→medium | 8.33 | 1.87 | 0.90 | 3024.15 |
| Scalar | validate | medium→large | 5.00 | 2.87 | 1.36 | 5273.02 |
| Scalar | validate | small→large | 41.67 | 5.36 | 1.22 | 5273.02 |
| Scalar | bundle | small→medium | 8.33 | 7.59 | 0.90 | 5247.92 |
| Scalar | bundle | medium→large | 5.00 | 4.06 | 1.52 | 6469.39 |
| Scalar | bundle | small→large | 41.67 | 30.78 | 1.37 | 6469.39 |
| Redocly | bundle | small→medium | 8.33 | 4.86 | 2.31 | 16937.43 |
| Redocly | bundle | medium→large | 5.00 | 4.39 | 0.96 | 19297.75 |
| Redocly | bundle | small→large | 41.67 | 21.33 | 2.22 | 19297.75 |
| Redocly | lint | small→medium | 8.33 | 4.81 | 2.31 | 15298.71 |
| Redocly | lint | medium→large | 5.00 | 4.51 | 0.97 | 16978.94 |
| Redocly | lint | small→large | 41.67 | 21.69 | 2.24 | 16978.94 |
| IBM | cli | small→medium | 8.33 | 1.48 | NOT_AVAILABLE | 195.02 |
| IBM | cli | medium→large | 5.00 | 4.70 | NOT_AVAILABLE | 207.60 |
| IBM | cli | small→large | 41.67 | 6.96 | NOT_AVAILABLE | 207.60 |

No unexplained runaway or severe superlinear trend was observed. IBM duration approaches operation-linear growth once fixed subprocess/ruleset overhead is amortized; Scalar and Redocly scale predictably for this corpus.

## 9. Memory evidence

Scalar's maximum observed RSS across all warm single- and multi-file scenarios was 421.1 MiB (multi-file large OAS 3.1.2 bundle). Redocly's was 433.2 MiB (multi-file large OAS 3.2.0 lint). These are high-water observations in long-lived candidate processes run in recorded order, not per-scenario isolated peaks. Heap/RSS/external raw values and deltas are retained per sample. No forced GC, infinite growth, or process failure occurred. IBM memory is PARTIAL evidence: process termination was bounded, but child peak RSS is not available and no approximation is fabricated.

## 10. Derived composite costs

Direct hybrid integration would be premature. For OAS 3.1 large, Scalar load + Redocly lint is DERIVED as 100.58 ms from constituent warm medians; Scalar load + IBM total CLI is DERIVED as 2479.59 ms. These exclude future OAIT SourceIndex/normalization/rule costs and are not MEASURED end-to-end workflows.

## 11. Dependency inventory, footprint, audit, and licenses

The shared installed graph is 155.4 MiB; lockfile 165456 bytes, SHA-256 733e28a19131d8081d69865b8d5ebc3d4a6ad9ee9be97cd756b7e41102981d8b. Hoisting prevents precise candidate-attributable disk claims.

| Item | Scalar | Redocly | IBM |
| --- | --- | --- | --- |
| Version | 0.28.10 + json-magic 0.12.19 | 2.40.0 | 1.37.15 |
| Integration | ESM programmatic | ESM programmatic | CommonJS CLI subprocess |
| Manifest direct runtime deps | 10 + 3 | 11 | 18 |
| Installed tree nodes (npm tree method) | 12 + 3 | 25 | 658 |
| Candidate-attributable disk | AMBIGUOUS (hoisted) | AMBIGUOUS (hoisted) | AMBIGUOUS (hoisted) |
| Audit C/H/M/L | 0/0/0/0 on named audit paths | 0/0/0/0 on named audit paths | 0/8/0/0 through IBM/Spectral graph |
| Direct license | MIT / MIT | MIT | Apache-2.0 |
| Node engine | >=22 | >=22.12 or >=20.19 <21 | >=16 |
| Native/platform concern | none direct; esbuild is dev tooling | none direct; esbuild is dev tooling | none observed direct |
| Security risk | LOW_CONCERN | LOW_CONCERN | SIGNIFICANT_CONCERN |

Audit was captured 2026-08-10T15:39:45.103Z with npm 11.16.0: critical 0, high 8, moderate 0, low 0. It reproduces SPIKE-006. Paths include IBM, @ibm-cloud/openapi-ruleset, Spectral CLI/core/functions, js-yaml, lodash, and minimatch. They are runtime-relevant to the documented IBM CLI chain; exploitability was not established. npm reports IBM 1.38.2 as an available mitigation route, which changes the pinned baseline and was not applied. No audit fix, override, or upgrade occurred.

Installed license counts are Apache-2.0:33, MIT:275, 0BSD:3, ISC:21, Python-2.0:1, UNKNOWN:2, BSD-3-Clause:3, Unlicense:3, BlueOak-1.0.0:1, BSD-2-Clause:1. Two manifests were UNKNOWN and therefore REVIEW_REQUIRED; this is evidence, not legal approval. Direct licenses present no known blocker. Duplicated majors are recorded machine-readably. The only optional native concern observed is esbuild's platform binary for tsx development tooling, not a candidate runtime addon.

## 12. Runtime, TypeScript/ESM, CI, and portability

All workflows ran headlessly with no prompts, GUI, or user-specific state. Scalar and Redocly public ESM APIs work on Node 24; IBM's documented CommonJS CLI exits cleanly on valid files and predictably on controlled failures. Normal typecheck passes. Strict dependency checking with skipLibCheck false reproduces prior Scalar extension/missing-type and Redocly React/Markdoc declaration failures; these do not fail runtime benchmarks.

macOS arm64 is VERIFIED. Linux and Windows are NOT_VERIFIED; their standard Node/filesystem/subprocess architecture is SUPPORTED_BY_ARCHITECTURE, but benchmark equivalence and IBM shell/process details are not claimed. CI suitability: Scalar PASS, Redocly PASS, IBM PASS with subprocess/time/security constraints.

## 13. Candidate comparison

| Capability | Scalar | Redocly | IBM |
| --- | --- | --- | --- |
| Small/medium/large | PASS | PASS | PASS supported versions |
| Large parse target | PASS | PASS bundle proxy | NOT_APPLICABLE |
| Large validation target | PASS | PASS | PASS total CLI |
| Cold start | low hundreds ms | high hundreds ms | subprocess/ruleset dominated |
| Warm execution | PASS | PASS | NOT_APPLICABLE |
| Memory | PASS bounded observation | PASS bounded observation | PARTIAL child peak unavailable |
| Scaling | PASS | PASS | PASS with fixed startup cost |
| Multi-file | PASS bundle | PASS bundle/lint | PARTIAL: targeted traversal shown; main corpus non-equivalent/nonzero |
| Recursive safety | PASS | PASS | PASS |
| Programmatic API | PASS | PASS | NOT_SUPPORTED |
| Interactive fit | PASS | PASS | PARTIAL |
| CI/batch fit | PASS | PASS | PASS with constraints |
| TypeScript/ESM | PARTIAL declarations | PARTIAL declarations | N/A CLI |
| Dependency footprint | modest tree | moderate tree | large tree |
| Vulnerability posture | LOW_CONCERN observed | LOW_CONCERN observed | SIGNIFICANT_CONCERN |
| License | PASS direct / review transitive unknowns | PASS direct / review transitive unknowns | PASS direct / review transitive unknowns |
| Replaceability | PASS | PASS | PASS subprocess adapter |

## 14. NFR mapping

| NFR | Result | Evidence |
| --- | --- | --- |
| NFR-PERF-001 | PASS | Large parser and applicable validation medians meet 2 s/5 s desktop targets. |
| NFR-PERF-002 | PASS | Automated raw-sample benchmark harness covers parse/load, bundle and validation. |
| NFR-PERF-003 | PARTIAL | Repeated work identified; intermediate retention recommended but not implemented. |
| NFR-PERF-007 | PARTIAL | Reproducible baseline exists; production regression CI not implemented. |
| NFR-SEC-008 | PASS | npm audit exposes current advisories. |
| NFR-MNT-001 | PASS | Candidate roles remain modular adapter boundaries. |
| NFR-COM-001 | PARTIAL | Scalar/Redocly cover 3.0/3.1/3.2; IBM is bounded to 3.0/3.1. |
| NFR-COM-005 | PASS | Equivalent medium/large multi-file workloads execute. |
| NFR-POR-001 | PARTIAL | macOS verified; Windows/Linux not verified. |
| NFR-POR-003 | PASS | Standard Node runtime; no candidate direct native runtime addon observed. |
| NFR-POR-004 | PASS | All paths headless/noninteractive. |
| NFR-REP-002 | PASS | Environment, versions, raw samples, order, hashes and methodology persisted. |
| NFR-SCL-008 | PARTIAL | No runaway observed; IBM child peak RSS unavailable. |
| NFR-DEP-001 | PARTIAL | Clear value exists, but IBM has a large transitive tree. |
| NFR-DEP-002 | PARTIAL | Pinned packages run; IBM mitigation implies a later version review. |
| NFR-DEP-003 | PARTIAL | Direct licenses known; two transitive UNKNOWN manifests require review. |
| NFR-DEP-004 | PASS | npm lock/tree inventory persisted. |
| NFR-DEP-005 | PASS | Time-stamped npm audit persisted; automation belongs in production CI. |

## 15. Exactly 12 operational gates

| Gate | Scalar | Redocly | IBM |
| --- | --- | --- | --- |
| OG-01 | PASS | PASS | NOT_APPLICABLE |
| OG-02 | PASS | PASS | PASS |
| OG-03 | PASS | PASS | PASS |
| OG-04 | PASS | PASS | PARTIAL |
| OG-05 | PASS | PASS | PARTIAL |
| OG-06 | PASS | PASS | PASS |
| OG-07 | PASS | PASS | PASS |
| OG-08 | PASS | PASS | PASS |
| OG-09 | PASS | PASS | PARTIAL |
| OG-10 | PASS | PASS | PASS |
| OG-11 | PASS | PASS | PASS |
| OG-12 | PASS | PASS | PASS |

PARTIAL explanations: IBM OG-04 lacks defensible child peak RSS; IBM OG-05 has targeted referenced-file traversal evidence but the main timing corpus is a nonzero, reference-invalid workload and cannot establish equivalent valid multi-file suitability; IBM OG-09 is CLI-only and costly for repeated interactive use. All other non-PASS entries are NOT_APPLICABLE parser-role evidence, not hidden failures.

## 16. Operational classifications

- Scalar: OPERATIONALLY_SUITABLE for in-process parsing/schema preservation and its bounded validation-evidence role.
- Redocly: OPERATIONALLY_SUITABLE for in-process bundle/transformation and source-rich diagnostic evidence, subject to prior semantic limitations.
- IBM: SUITABLE_WITH_CONSTRAINTS for bounded CI/batch and occasional interactive OAS 3.0/3.1 validation; repeated interactive subprocess use and the current security graph are material constraints.

## 17. Architecture answers and implications

1. Scalar meets the parser target; Redocly meets bundle/transformation targets. All applicable validator roles meet 5 s on this machine.
2. IBM's ~2408.45 ms large total and ~345.87 ms small total make bounded CI/batch reasonable but repeated interactive invocation unattractive.
3. Scaling and legal recursion do not change viability. IBM multi-file suitability is constrained because the established timing corpus is not semantically equivalent successful validation; memory is bounded observationally, with IBM peak unknown.
4. OAIT should retain safe intermediates to avoid duplicate parsing/resolution, without treating transformed pointers as source truth.
5. Scalar and Redocly suit interactive and CI roles. IBM suits CI/batch with subprocess and security constraints.
6. No verified platform-specific runtime blocker exists; only macOS performance is verified.
7. IBM's audit posture is significant but not automatically blocking. Mitigation needs a separately tested baseline upgrade/override/replacement decision.
8. Direct licenses show no known blocker; two unknown transitive manifests require distribution review.
9. The hybrid parser/external-validator/OAIT-rule architecture remains operationally reasonable. External speed cannot repair prior diagnostic or semantic gaps.
10. All candidates proceed to the final weighted technology evaluation in their evidenced roles. No earlier semantic conclusion changes.
11. Evidence is sufficient to produce the parser-validator evaluation summary, with IBM memory/cross-platform/security follow-ups explicitly bounded.
12. After that summary, ADRs are justified for parser selection, validator/hybrid strategy, candidate diagnostic adaptation, and dependency-risk acceptance/mitigation. No ADR is created here.

## 18. Limitations and follow-up

This is one desktop/macOS run, YAML-only performance input, safe rather than adversarial failure testing, whole-process sampled memory, and no production SourceIndex/normalization/rules cost. Cold sample count is three for in-process candidates; warm distributions use ten. IBM internal timing is derived, not measured. Audit data is time-sensitive. Candidate-specific disk footprints are ambiguous under npm hoisting.

Follow up with the final parser-validator summary, weighted decision, Linux/Windows CI confirmation, legal review of UNKNOWN transitive licenses, IBM baseline/mitigation retest, isolated child-memory instrumentation if IBM remains shortlisted, and production benchmark/regression design after ADRs.

## Result provenance

Machine results retain environment, roles, exact versions, fixture inventory/hashes, raw timing and memory samples, cold/warm evidence, recursion, scaling, NFRs, dependency/audit/license/runtime/CI evidence, exactly 12 gates, classifications, and internal hashes.

```text
results/scalar.json  52cf5202795ede4d2ea4186e301d1ee1c832d590ff4855c01fa3d66523207da6
results/redocly.json 968accac7f71717315bb3fe5234f0be419fdfae42b7a91b3b10ea8aef84a0571
results/ibm.json     6553abea943779ac24dcfbde8dcc88ecb89f5f37740208f050cc895f4040ef02
results/ibm-multifile-probe.json a4a14375356af93882b6d73ff96ca0c65b82f708bddd29deb6ee59f7c5cd923e
```
