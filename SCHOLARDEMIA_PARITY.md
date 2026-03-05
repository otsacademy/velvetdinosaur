# Scholardemia Parity

This document defines the parity scope and acceptance criteria for matching Scholardemia's Puck editor shell UX and installer workflows in this repo.

## Puck editor parity (acceptance)
- Shell layout matches Scholardemia: top bar actions, bottom dock, left/right sheets.
- Save, publish, reset, and close workflows mirror Scholardemia (labels, disabled/loading states, and toast feedback).
- Properties panel only renders fields when a block is selected.
- Draft vs published semantics: editor loads draft when present; public pages render published; reset restores draft from published.
- Image block supports inline upload + replace UX with progress.
- Editor loads `@measured/puck/no-external.css` with no visual regressions.
- REST endpoints exist and work: `/api/cms/pages/[slug]`, `/api/cms/pages/[slug]/publish`, `/api/cms/pages/[slug]/reset-draft`.
- Legacy endpoints `/api/puck/*` remain functional.

## Installer parity (acceptance)
- UX and workflow parity with Scholardemia's installer (domain-service, Postmark, nginx/certbot, PM2, validation, status feedback).
- If no Scholardemia installer flow is present in the reference repo, record that limitation and keep parity checklist ready for when a source-of-truth is provided.

## Verification
- `bun run lint`
- Manual edit flow: load, save draft, publish, reset, close.
- Inline image upload/replace for Image block with progress.
