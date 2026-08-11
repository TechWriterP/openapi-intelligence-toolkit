# OpenAPI Intelligence Toolkit (OAIT)

OpenAPI Intelligence Toolkit (OAIT) is an open-source toolkit for analyzing,
reviewing, scoring, improving, comparing, and generating intelligence from
OpenAPI specifications.

## Project status

🚧 Early Production Implementation / Pre-v0.1

Architecture discovery and parser-validator technical validation are complete.
Production implementation is beginning with the repository and source-processing
foundation.

## Core principle

> Use deterministic software for facts; AI for interpretation.

## Planned capabilities

- Validate OpenAPI specifications
- Review documentation quality
- Score OpenAPI quality
- Improve OpenAPI documentation safely
- Compare OpenAPI versions
- Identify breaking changes
- Generate developer-facing release notes
- Create OpenAPI specifications from requirements

## Production workspace

The production codebase uses npm workspaces with a strict shared TypeScript
baseline.

```bash
npm install
npm run type-check
npm run build
npm test
```

The initial workspace boundaries are:

```text
apps/cli
packages/core
packages/parser
packages/validator
packages/rules
packages/reporting
```

These workspaces currently contain boundary-only entry points. Product behavior
is added incrementally through the implementation roadmap.

The `experiments/` directory is intentionally excluded from the root workspace.
Each spike retains its own package metadata, lockfile, dependencies, and commands.
Root build, type-check, and test commands do not process experiment sources.

No production test framework has been selected yet. Until test infrastructure is
introduced, `npm test` truthfully succeeds without executing feature tests because
the workspaces define no test scripts.

## Architecture and planning

See:

- `project-charter.md`
- `docs/requirements/`
- `docs/quality-model/`
- `docs/architecture/`
- `docs/architecture/adr/`
- `docs/architecture/spikes/`

## License

Apache License 2.0
