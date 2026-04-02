<!--
This site-level AGENTS.md is derived from template/AGENTS.md.
Keep baseline constraints aligned with the template; put site-specific differences only in the "Site Overrides" section.
-->

## Baseline (from template)

# AI Agent Guide

This file provides a concise, machine-readable overview of how to work in this codebase.

## Required Technology Choices

- **Puck Editor:** Use `@measured/puck` for page composition and editing (`/edit` route). Keep Puck config in `puck/`.
- **shadcn/ui only:** UI components must be shadcn-based. Use the local shadcn registry (`registry/…`) and/or the site’s installed component store (`components/blocks/store`) for primitives and blocks. Wrap components for Puck when needed.
- **Lucide React icons only:** Use `lucide-react` for icons. Do not add other icon libraries.
- **Tailwind v4 + tokens:** Styling uses Tailwind CSS v4 and CSS variables defined in `app/globals.css`. Use OKLCH tokens (e.g., `--primary`, `--accent`) and map to `--vd-*` variables.
- **MongoDB only:** Persist data in MongoDB. Use `MONGODB_URI` from environment and BetterAuth's MongoDB adapter.
- **BetterAuth:** Auth is handled via BetterAuth; do not replace with another auth provider.
- **Theme generator (tweakcn):** Use the built-in tweakcn-based theme editor/service for theme generation and persistence; keep theme integration via `tweakcn-ui`.
- **Figma MCP (Make Designs):** When asked to create or refine designs, use the Figma MCP tools and keep the design and implementation in sync.

## Syntax & Compatibility Hints

- **Tailwind v4:** Prefer CSS variables and OKLCH tokens. Use `@theme` only when introducing new tokens. Avoid adding `tailwind.config.*` unless absolutely necessary.
- **React 19:** Default to Server Components; use client components only when needed. Prefer Server Actions and `useActionState` for form workflows when appropriate.

## Domain + Email Management (Installer)

- The installer can integrate with **domain-service** for DNS records, domain registration/import, nameserver migration, and Postmark email setup.
- If using the installer flow, manage DNS and Postmark via domain-service instead of ad-hoc scripts.

## Infrastructure Notes

- **nginx + certbot:** The installer writes nginx site configs and obtains TLS certificates via certbot.
- **systemd or PM2:** Sites may run under systemd or PM2. Prefer direct in-place build + restart unless a site override documents a different production model.

## Tooling Requirements

- **bun only:** Use `bun` for installs, scripts, and runtime tooling. Do not switch to npm/yarn/pnpm.

## Operations Guardrails

- Release locally. Do not depend on GitHub Actions for the primary build/test/deploy path.
- Use `main` as the default long-lived branch. Validate locally, commit intentionally, and push the exact commit you plan to deploy to GitHub.
- Prefer `bun run deploy:manual` for the full local quality + deploy path and `bun run deploy:safe` for direct rebuild/restart of the current checkout.
- GitHub push-triggered deploy loops are not allowed. If GitHub workflows exist, keep them manual-only unless there is a documented exception.
- Legacy PM2 sites may still exist during migration. When a site override explicitly documents legacy PM2 operation, follow that override until the site is migrated.

## Modularity Rules

- Build the website as a **modular system**: reuse components and layouts across pages (e.g., a travel site should share hero, cards, and itinerary sections instead of duplicating code).
- Prefer small focused files, reusable components, and shared utilities in `lib/`.
- **Hard limit:** no code file should exceed **600 lines**. Split into smaller modules if needed.

## Design Parity

- When adapting or cloning an existing website, achieve **100% pixel parity** with the source design while still following all constraints in this AGENTS.md (tech choices, shadcn-only UI, tokens, etc.).

## Workflow Safety

- Complete required local quality gates before deploying from `main`.
- Never deploy if Lighthouse or visual snapshot gates fail for targets that require them.
- Production deploys must use an already-created commit. Do not create a fresh commit as part of the deploy itself.
- Push the same deployable commit to GitHub so remote history stays aligned with production.

## Quality Gates (Required)

- **Quality manifest (source of truth):** Gates are declared in `quality/gates.json` and enforced locally via `bun run quality`. CI, when configured, should mirror local checks rather than replace them.
- **Site targets (kind: `site`):** When the manifest includes the `lighthouse` gate, Lighthouse CI must be **100/100** on mobile and desktop for configured key URLs (use **3 runs** to reduce variance). When the manifest includes `visual`, visual snapshots must match for configured routes; store baselines under `tests/visual/__screenshots__`.
- **Admin targets (kind: `admin`):** Lighthouse is not required and is not run when the manifest omits it. Follow the gates listed for the target (e.g., lint, typecheck, build, visual).
- **Package targets (kind: `package`):** Follow the gates listed for the target (e.g., lint, typecheck, test, build).
- **Local scripts (when present):** Use `bun run lighthouse`, `bun run visual:test`, and `bun run visual:update` only if those scripts exist for the target.

## Robots + Indexing Defaults

- New sites must ship `app/robots.ts` (or `app/robots.txt`) that **disallows** `/edit`, `/admin`, `/preview` and other non-public routes.
- Public pages are crawlable by default.
- Defense-in-depth: add `X-Robots-Tag: noindex` for `/edit`, `/admin`, `/preview` (and their subpaths) via middleware or route headers.
- If a sitemap route exists, include it in robots; otherwise provide a minimal sitemap route for public pages.

## Snapshot MCP (Visual Baselines)

- Use Snapshot MCP when you need pixel-level verification of UI changes or regression checks.
- Store baselines in `tests/visual/__screenshots__` and update intentionally with `bun run visual:update`.
- Local deploy automation must run `bun run visual:test` and fail on any diff.
- Capture both mobile and desktop viewports for key URLs (minimum `/` plus one stable secondary route).

## When Checks Fail

- **Lighthouse 99s (when the `lighthouse` gate is present):** Common causes are CLS (missing fixed image sizes/aspect ratios), webfont swaps (ensure `display: swap` or `next/font`), LCP images without dimensions or priority, and late-loading scripts. Fix the root cause; do not relax thresholds.
- **Visual diffs:** Run `bun run visual:update` only after confirming the UI change is intentional. Commit the updated baselines.

## v0 MCP (Design Drafts)

- Use v0 MCP for rapid UI drafts or component exploration when design intent is clear.
- Always refactor v0 output into repo conventions: shadcn/ui, Tailwind tokens, modular components, and Puck blocks when appropriate.
- Run full quality gates (lint, typecheck, build, Lighthouse, visual snapshots) after integrating v0 output.

## Figma MCP (Make → site sections)
- When to use Figma MCP:
  - Use Figma MCP "Make resources" when the input is a Figma Make link and you need underlying source code/assets.
- Resource template + file key:
  - Resource URI template: `file://figma/make/source/{file_key}/{+file_path}`.
  - Extract the file key from a Make URL as the segment immediately after `/make/`.
- Minimal-MCP workflow (discovery via App.tsx):
  - Start from `src/app/App.tsx` in the Make project: read `file://figma/make/source/<KEY>/src/app/App.tsx`.
  - Follow imports to locate the exact source components that implement `<SectionA>` and `<SectionB>`.
  - Fetch ONLY the relevant component files and their direct local imports to minimize MCP calls.
- Implementing locally in the target app:
  - Implement the extracted sections as reusable, editable React components inside the target app directory (the directory containing this `AGENTS.md`), following existing patterns.
  - Default location: `components/sections/` (create if missing) or `components/blocks/store/` for Puck blocks.
  - If an existing pattern exists (e.g., a local `registry/` or app-specific blocks directory), follow that instead.
  - Prefer composition and reuse; don’t duplicate code across pages.
  - Wire sections into the appropriate page(s) under `/srv/apps/<slug>/` (App Router or Pages Router as used in that app).
- Styling remap rules:
  - Preserve layout/structure/spacing/typography closely.
  - DO NOT copy source palette classes or hardcoded colors.
  - Replace any palette utilities (slate/gray/zinc/neutral/stone/etc) and any hex/rgb/hsl with token/theme-based classes used by this repo.
  - If gradients/overlays are required, use token classes + opacity rather than fixed colors.
- Verification commands (manifest-driven):
  - `bun install` (root)
  - `bun run quality --only <target>`
  - `bun run quality:validate`
  - If the target app defines additional scripts, run them as needed (e.g., `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`).
- “Use Figma MCP Make resources for file key <KEY>. Locate the exact source components for <SectionA> and <SectionB> by following src/app/App.tsx imports. Then implement them as Puck blocks in `components/blocks/store/` in the target app, keeping layout/structure but remapping all color classes to Tailwind token classes (no slate/gray/etc). Update `puck/store-block-schemas.json` defaults/fields accordingly.”

## Definition of Done (Non-Negotiable)

- All required local quality checks for the target are green (per `quality/gates.json` or the target's local quality manifest).
- When the manifest includes the `lighthouse` gate, Lighthouse CI scores are 100/100 on mobile and desktop for configured URLs.
- When the manifest includes the `visual` gate, visual snapshot tests pass with no diffs (or baselines intentionally updated).
- For site targets, robots indexing defaults are present and non-public routes are noindexed.
- Changes are documented and follow repo conventions.

## End of Task Checklist

- `bun run quality --only <target>` (or `bun run quality --all`)
- `bun run quality:validate`
- `bun run sync:agents` (if `template/AGENTS.md` changed)
- If releasing: validate locally on `main`, push the deployable commit to GitHub, run `bun run deploy:manual`, then verify health

## Site Overrides

- Site slug: velvetdinosaur
- Primary domain: velvetdinosaur.com
- Branch + deploy flow override:
  - `main` is the only long-lived branch for this site.
  - GitHub (`git@github.com:otsacademy/velvetdinosaur.git`) is the canonical remote for shared history.
  - Use `bun run deploy:manual` from a clean `main` checkout for the full local quality + deploy path.
  - Use `bun run deploy:safe` when you intentionally want a faster in-place rebuild/restart of the current checkout.
- Notes: This site no longer uses a `develop -> main` promotion step or blue/green slot switching.
