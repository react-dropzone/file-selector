# AGENTS.md

Guidance for AI coding agents in this repo. Human contributors: see the
[Contribute](./README.md#contribute) section of the README.

This is `file-selector`: it converts a `DragEvent`, a file `input`, a paste, or a File System
Access API selection into a flat list of `File` objects (`fromEvent`). It is a small, published npm
library written in TypeScript with no runtime dependencies; keep it that way. The full MIME table is
split into the `file-selector/mime` subpath export so it stays out of the core bundle - a
`size-limit` budget guards against it leaking back in.

The toolchain is the Rust-based oxc stack: [oxlint](https://oxc.rs/) to lint,
[oxfmt](https://oxc.rs/) to format, [tsdown](https://tsdown.dev/) (Rolldown + oxc) to build and emit
declarations, and [Vitest](https://vitest.dev/) to test; TypeScript (`tsc --noEmit`) type-checks and
`size-limit` budgets the bundle. Browser behaviour is covered by [Playwright](https://playwright.dev/)
(library e2e), and the [Vocs](https://vocs.dev/) docs site has its own Playwright smoke test. There
is no Babel, ESLint, Prettier, or Rollup; do not reintroduce them.

## Workflow

- Clarify the design before implementing. For anything non-trivial, agree on the approach first.
- One unit of change per commit. Never mix unrelated changes. Present the change for review before
  committing.
- Every change ships with tests. Run local CI before calling it done, and do not claim it passes
  without running it.
- Verify against the code and the tools: read before you answer, run before you assert.

Local CI (must be green before review):

```shell
npm run type-check      # tsc --noEmit
npm run lint            # oxlint
npm run lint:type-aware # oxlint --type-aware (non-blocking in CI, but run it)
npm run format:check    # oxfmt --check
npm run build           # tsdown -> dist/
npm run test:cov        # vitest with coverage
npm run size            # size-limit bundle budget
```

The prek git hooks (installed via `npm install`) auto-run oxfmt and oxlint on staged code and
validate the commit message, but they do not run type-check, the build, or the tests, and they do
not format Markdown. Run the commands above yourself, and run `npm run format` after editing
docs/Markdown or CI's `format:check` will fail on it.

Browser tests need Chromium (`npx playwright install --with-deps chromium`):

```shell
npm run test:e2e        # library: file-input selection + CDP drag-and-drop in real Chromium
npm run test:docs:e2e   # docs hydration smoke (run when you touch the docs or a docs dependency)
```

## Writing: code, comments, docs, commits

- Concise and to the point. No fluff. Explain the non-obvious; do not narrate the obvious.
- ASCII only. No em-dash and no `--`; write `-`. Use `->` not the arrow glyph, `!=` not the
  not-equal glyph, and so on.
- Comments justify _why_, not _what_. Delete any comment that restates the code.
- Formatting is not a matter of taste: oxfmt owns it. Run `npm run format` rather than
  hand-formatting. House style (`.oxfmtrc.json`) is double quotes, two-space indent, semicolons, no
  trailing commas, no bracket spacing (`{a, b}`), arrow parens omitted when possible, and a
  120-column print width.

## Commits

- [Conventional Commits](https://www.conventionalcommits.org/); the type set is enforced by a
  commit-msg hook and consumed by semantic-release. Write the subject in the present tense,
  imperative voice: `fix: handle empty DataTransfer`, not `fixed` or `fixes`.
- `feat:`/`fix:`/`perf:` cut a release; `feat!:` or a `BREAKING CHANGE:` footer cuts a major.
  `chore:`/`ci:`/`docs:`/`test:`/`refactor:`/`style:`/`build:` do not. Pick the type with that in
  mind.
- Keep the body minimal, or omit it. A good subject plus the diff is usually enough; add a body only
  for what the code cannot show (why, a trade-off, a non-obvious consequence). Never restate the
  change or narrate the diff.
- Disclose AI with an `Assisted-by: Claude:claude-opus-4-8` trailer. Never `Co-Authored-By`, and
  never add a human's `Signed-off-by`.

## Tests

- Unit tests live beside the source as `src/*.spec.ts` and run under Vitest with the jsdom
  environment. Assert on real `File`/`DataTransfer` shapes rather than mocking the DOM where a real
  object will do.
- `e2e/*.e2e.ts` are Playwright tests for library behaviour that only a real browser exercises:
  file-input selection and CDP-driven drag-and-drop against a fixture page that imports the built
  `dist/` (so `npm run build` runs first via `pretest:e2e`).
- `e2e-docs/*.e2e.ts` are Playwright smoke tests for the docs _site_ (hydration), run through the
  separate `playwright.docs.config.ts`. See "Docs site" below.
- Coverage must not drop. New code ships with tests that hold or raise it. Measure with
  `npm run test:cov`.

## Code conventions

- Source is TypeScript (ESM); no JSX - this is a DOM utility, not a UI component.
- The published API is exactly what `src/index.ts` re-exports, plus the `file-selector/mime` subpath
  (the MIME table). Keep the MIME table on that subpath so `size-limit` stays green, and keep the
  README usage examples in step with any public change.

## Build and publish

- `npm run build` bundles with tsdown into `dist/` (ESM `.js`, CJS `.cjs`, and `.d.ts` emitted from
  source), with two entries: the core (`index`) and the MIME table (`mime`). Do not hand-edit
  anything in `dist/` - it is generated.
- What ships to npm is the `files` allowlist in `package.json` (`dist` and `src`, minus specs); keep
  it accurate. The `size-limit` budget in `package.json` fails the build if the core entry grows -
  usually a sign the MIME table leaked out of its subpath.
- Releases are automated by semantic-release from the commit history; the repo version stays
  `0.0.0-development` and is set at publish time. Never bump the version by hand. Runtime is Node
  `>= 22` (`engines`).

## Docs site

- Docs are MDX under `docs/` with `vocs.config.ts`; `npm run docs:build` emits fully static HTML to
  `site/` (gitignored) under the `/file-selector` basePath, and the Pages workflow (`pages.yml`)
  deploys it to https://react-dropzone.github.io/file-selector/.
- Vocs runs on waku, whose `unstable_*` router APIs break between beta releases. `waku` is pinned
  (and ignored in Dependabot) to the version Vocs supports; bumping it can white-screen the site
  (regressed by #177). Do not unpin without re-running the docs smoke test.
- `e2e-docs/docs-smoke.e2e.ts` loads key routes in headless Chromium and fails on a hydration crash
  or a blank page. The `docs-e2e` CI job runs it on every PR; `docs-monitor.yml` runs it on a
  schedule against production. This is the guardrail for the failure class above - keep it working.

## CI workflows

- GitHub Actions live in `.github/workflows` (`test.yml` runs lint/test/size/e2e/docs-e2e;
  `pages.yml` builds and deploys the docs; `release.yml`; `docs-monitor.yml`). Write the workflow
  `name:`, every job name, and every named step in Sentence case (match the existing files).
- Dependabot groups patch/minor bumps and auto-merges patches on green CI (`.github/dependabot.yml`,
  `dependabot-auto-merge.yml`). Auto-merge trusts CI, so any check that must gate a dependency bump
  has to run in CI - that is why the docs smoke test exists.
- Keep workflows minimal and scoped to one purpose; prefer the built-in `GITHUB_TOKEN` over a
  personal access token.
