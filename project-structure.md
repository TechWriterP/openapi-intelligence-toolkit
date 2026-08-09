openapi-intelligence-toolkit/
│
├── README.md
├── PROJECT_CHARTER.md
├── LICENSE
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── CHANGELOG.md
│
├── package.json
├── tsconfig.json
├── eslint.config.js
├── .gitignore
├── .editorconfig
├── .env.example
│
├── apps/
│   ├── cli/
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── validate.ts
│   │   │   │   ├── review.ts
│   │   │   │   ├── score.ts
│   │   │   │   ├── improve.ts
│   │   │   │   ├── diff.ts
│   │   │   │   ├── release-notes.ts
│   │   │   │   └── create.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── mcp-server/
│       ├── src/
│       │   ├── tools/
│       │   │   ├── validate.ts
│       │   │   ├── review.ts
│       │   │   ├── score.ts
│       │   │   ├── improve.ts
│       │   │   ├── compare.ts
│       │   │   └── release-notes.ts
│       │   └── server.ts
│       ├── package.json
│       └── README.md
│
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── errors/
│   │   │   ├── config/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── parser/
│   │   ├── src/
│   │   │   ├── parse.ts
│   │   │   ├── version.ts
│   │   │   ├── normalize.ts
│   │   │   └── resolve-refs.ts
│   │   └── package.json
│   │
│   ├── validator/
│   │   ├── src/
│   │   │   ├── validate.ts
│   │   │   └── validation-result.ts
│   │   └── package.json
│   │
│   ├── rules/
│   │   ├── src/
│   │   │   ├── engine.ts
│   │   │   ├── rule.ts
│   │   │   ├── severity.ts
│   │   │   └── registry.ts
│   │   └── package.json
│   │
│   ├── scoring/
│   │   ├── src/
│   │   │   ├── scorer.ts
│   │   │   ├── weights.ts
│   │   │   └── quality-gate.ts
│   │   └── package.json
│   │
│   ├── reviewer/
│   │   ├── src/
│   │   │   ├── reviewer.ts
│   │   │   ├── findings.ts
│   │   │   └── recommendations.ts
│   │   └── package.json
│   │
│   ├── enhancer/
│   │   ├── src/
│   │   │   ├── enhancer.ts
│   │   │   ├── contract-guard.ts
│   │   │   ├── suggestions.ts
│   │   │   └── overlay.ts
│   │   └── package.json
│   │
│   ├── diff/
│   │   ├── src/
│   │   │   ├── compare.ts
│   │   │   ├── change.ts
│   │   │   ├── breaking-change.ts
│   │   │   └── classifier.ts
│   │   └── package.json
│   │
│   ├── release-notes/
│   │   ├── src/
│   │   │   ├── generator.ts
│   │   │   ├── categories.ts
│   │   │   └── migration-guidance.ts
│   │   └── package.json
│   │
│   ├── creator/
│   │   ├── src/
│   │   │   ├── creator.ts
│   │   │   ├── requirements.ts
│   │   │   └── sme-questions.ts
│   │   └── package.json
│   │
│   ├── ai/
│   │   ├── src/
│   │   │   ├── providers/
│   │   │   │   ├── provider.ts
│   │   │   │   ├── openai.ts
│   │   │   │   └── anthropic.ts
│   │   │   ├── prompts/
│   │   │   ├── schemas/
│   │   │   ├── guardrails/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── reporting/
│       ├── src/
│       │   ├── json.ts
│       │   ├── markdown.ts
│       │   ├── console.ts
│       │   └── sarif.ts
│       └── package.json
│
├── rulesets/
│   ├── default/
│   │   ├── documentation.yaml
│   │   ├── schemas.yaml
│   │   ├── responses.yaml
│   │   ├── security.yaml
│   │   └── governance.yaml
│   │
│   ├── documentation/
│   │   └── rules.yaml
│   │
│   └── strict/
│       └── rules.yaml
│
├── skills/
│   ├── create-openapi/
│   │   ├── SKILL.md
│   │   └── resources/
│   │
│   ├── review-openapi/
│   │   ├── SKILL.md
│   │   └── resources/
│   │
│   ├── score-openapi/
│   │   └── SKILL.md
│   │
│   ├── improve-openapi/
│   │   ├── SKILL.md
│   │   └── resources/
│   │
│   └── generate-release-notes/
│       ├── SKILL.md
│       └── resources/
│
├── evals/
│   ├── datasets/
│   │   ├── documentation-quality/
│   │   ├── hallucination/
│   │   ├── contract-protection/
│   │   ├── breaking-changes/
│   │   └── release-notes/
│   │
│   ├── runners/
│   ├── scorers/
│   └── README.md
│
├── test-data/
│   ├── openapi-3.0/
│   ├── openapi-3.1/
│   ├── openapi-3.2/
│   ├── invalid/
│   ├── poorly-documented/
│   ├── well-documented/
│   └── version-pairs/
│       ├── breaking/
│       └── nonbreaking/
│
├── tests/
│   ├── integration/
│   ├── regression/
│   ├── security/
│   └── e2e/
│
├── examples/
│   ├── petstore/
│   │   ├── before.yaml
│   │   ├── after.yaml
│   │   └── improvements.overlay.yaml
│   │
│   ├── release-notes/
│   └── scoring/
│
├── docs/
│   ├── requirements/
│   │   ├── PRD.md
│   │   ├── FUNCTIONAL_REQUIREMENTS.md
│   │   └── NONFUNCTIONAL_REQUIREMENTS.md
│   │
│   ├── architecture/
│   │   ├── SYSTEM_ARCHITECTURE.md
│   │   ├── AI_ARCHITECTURE.md
│   │   ├── SECURITY_ARCHITECTURE.md
│   │   └── diagrams/
│   │
│   ├── quality-model/
│   │   ├── QUALITY_MODEL.md
│   │   └── RULE_CATALOG.md
│   │
│   ├── adr/
│   │   ├── ADR-001-use-typescript.md
│   │   ├── ADR-002-monorepo.md
│   │   └── ADR-003-deterministic-ai-boundary.md
│   │
│   ├── guides/
│   └── contributing/
│
├── scripts/
│   ├── build.ts
│   ├── generate-rule-docs.ts
│   └── verify-test-data.ts
│
└── .github/
    ├── workflows/
    │   ├── ci.yml
    │   ├── test.yml
    │   ├── security.yml
    │   └── release.yml
    │
    ├── ISSUE_TEMPLATE/
    │   ├── bug.yml
    │   ├── feature.yml
    │   └── new-rule.yml
    │
    └── pull_request_template.md