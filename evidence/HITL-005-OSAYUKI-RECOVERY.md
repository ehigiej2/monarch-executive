# HITL-005 — Osayuki source recovery and compatibility decision
Date: 2026-11-13
Authority: CROWN HOLD; isolated synthetic review engineering only.

## Verified source
Repository: ehigiej2/mauric-prototype-gallery
Branch: review/osayuki-six-button-acceptance-fix
File: osayuki-six-workflows-acceptance-review.html
Git blob SHA: 75645b00951f4214457b063ae489f4f816ddc4ef
PR: https://github.com/ehigiej2/mauric-prototype-gallery/pull/6
PR changed file inventory: osayuki-six-workflows-acceptance-review.html

## Existing source capabilities (verified by source inspection)
- Six research workflows: Check Route, Find Space, Find Buyers, Check Money, Check Safety, My Report.
- Fictional research-note forms and report generation.
- Device-local storage under key osayuki-research-v2, with session-only fallback.
- Explicit research simulation wording.
- Escaping of user-entered note values before HTML interpolation.
- Clipboard export with fallback message.
- Mobile full-height six-tile layout and safe-area padding.

## Compatibility analysis
The integrated OWOW candidate uses a different six-button taxonomy:
Transport Partners; Farmers & Cooperatives; Suppliers & Trade; Pets & Veterinary; Partnerships & Training; Ask Osayi.
Do NOT silently replace the existing six workflows or claim the two interfaces are equivalent. Preserve the recovered six workflows as reusable sub-workflows beneath the relevant Osayuki entrance after review.

The recovered source uses persistent localStorage, while the integrated candidate uses in-memory session-only synthetic drafts. Copying code without reconciling privacy, lifecycle, schemas and role isolation would be unsafe. Both are demonstrations, not authenticated access control.

## Recommended mapping — proposal, not yet integrated
- Transport Partners: Check Route + Find Space + Check Safety
- Farmers & Cooperatives: Find Buyers + Find Space
- Suppliers & Trade: Find Buyers + Check Money
- Pets & Veterinary: no evidenced matching workflow; remains NEW/UNKNOWN
- Partnerships & Training: My Report + explicit training workflow not evidenced
- Ask Osayi: no live voice evidenced; text-only fallback

## Release and acceptance blockers
- Genuine Safari/iPhone interaction and viewport testing
- Canonical shared request schema and provenance-preserving migration
- Authentication and server-side tenant/role authorisation for real data
- Cross-device sync and conflict handling for real users
- Security and privacy assurance, including storage and injection regression
- Canonical Profit Coach recovery
- Osayi conversational voice implementation and verification
- Founder approval for any public deployment or external tester invitations

No claim of release readiness. No production deployment or external action.
