# Mobile Reconciliation — Carry-Over Note

**Created:** 2026-05-28
**Next session target:** by end of week (mobile brought up to date)
**Repo:** `PeriGinsberg/wrnsignal-mobile` (private, GitHub) — newly pushed this session
**Local path:** `C:\Users\perig\wrnsignal-api\signal-mobile` (own git repo, nested under backend but decoupled; backend `.gitignore`s it)

---

## What this session accomplished

1. **signal-mobile is now backed up off-machine.** It had no git remote — the entire post-1.2.0 source lived only on the local Windows machine. Created `PeriGinsberg/wrnsignal-mobile` (private), pushed `master`. Biggest risk closed.
2. **All uncommitted WIP backed up three independent ways** (see Backup Locations below).
3. **Inventoried what's uncommitted** — see WIP Inventory. Short version: a ~5-week-old onboarding feature + an in-flight auth-flow change + 3 backend-wiring edits, all entangled.

**No mobile build shipped this session.** Decision: do NOT ship a mobile EAS release on top of the current working tree until the 18 files are reviewed. App is live and working at 1.2.0; shipping broken is worse than shipping nothing. Today's planned work is web/backend only.

---

## Backup Locations (recoverable independent of git stash)

- **GitHub remote:** `PeriGinsberg/wrnsignal-mobile` — `master` at commit `f41defe` (the live 1.2.0 source). NOTE: no release tags exist; 1.2.0 was never tagged.
- **Tracked-file edits patch:** `C:\Users\perig\mobile-wip-tracked-diff-2026-05-28.patch` (117,836 bytes — substantial)
- **Untracked file copies:** `C:\Users\perig\mobile-wip-untracked-2026-05-28\` (6 files, verified count match)
- **Status snapshot:** `C:\Users\perig\mobile-wip-status-2026-05-28.txt`
- **Untracked file list:** `C:\Users\perig\mobile-wip-untracked-list-2026-05-28.txt`

---

## WIP Inventory (18 files uncommitted since 2026-04-24)

Last commit on master: **2026-04-24** — everything below accumulated over ~5 weeks.

### The 3 backend-wiring files (original ship target)
- `lib/api.ts`
- `app/(tabs)/positioning.tsx`
- `app/(tabs)/coverletter.tsx`

Purpose: pass jobfit_result → positioning, and positioning → cover letter. These are what depend on the production backend promote.

**Entanglement found:** `positioning.tsx` and `coverletter.tsx` both now `import { EmptyToolState } from "@/components/EmptyToolState"` — which is an *untracked* file. The wiring cannot be committed cleanly alone; it pulls in EmptyToolState (which itself is clean — imports only react-native, expo-router, @/constants/theme — no deeper chain).

### Modified core/state files (need careful review)
- `lib/auth-context.tsx` — **HIGHEST STAKES.** Auth flow change: `verifyOtp`, email trim/lowercase, code trim. This is a behavior change to login/signup verification. Unknown whether finished/safe. **Gates everything** — do not ship until resolved.
- `lib/job-context.tsx` — core state, modified
- `app/(tabs)/jobfit.tsx`
- `app/(tabs)/networking.tsx`
- `app/(tabs)/tracker.tsx`
- `app/application/[id].tsx`
- `components/RunButton.tsx`
- `package.json` + `package-lock.json` — one new dep: `@react-native-community/datetimepicker@^9.1.0` (belongs to the untracked DatePickerField → onboarding feature, NOT the wiring)

### Untracked files (coherent onboarding feature set)
- `app/onboarding.tsx` — whole onboarding screen
- `app/add-job.tsx` — whole add-job screen
- `components/DatePickerField.tsx` — needs the datetimepicker dep above
- `components/EmptyToolState.tsx` — **also a dependency of the 3 wiring files**
- `components/QuoteRotator.tsx`
- `lib/quotes.ts`

This is a deliberate, dependency-complete feature build — not scratch work.

---

## Open Questions for the End-of-Week Session

1. **Auth-flow change (`auth-context.tsx`) — finished and safe?** Highest stakes. verifyOtp/email-trim rework. If half-finished it can lock users out. Resolve this first; it gates whether anything else ships.
2. **Onboarding feature set — finish or abandon?** Coherent and complete-looking (onboarding, add-job, datepicker, quote rotator). Abandoning throws away real work; only Peri knows if it still fits product direction.
3. **Ship wiring ahead of, or bundled with, the feature work?** The 3 wiring edits are entangled with EmptyToolState. Likely simplest to review + ship the whole vetted bundle at once rather than untangle a minimal wiring-only release.

---

## Hard Constraints / Decisions

- **NO coaches-center functionality on mobile** (Peri, 2026-05-28). During the read-through, flag and strip any coaches-center code if present in these 18 files. (Not yet checked whether the onboarding/auth work touched anything coaches-related.)
- **Backend promote prerequisite:** mobile points at prod (`wrnsignal-api.vercel.app`). Positioning bullet-eval + networking changes must be promoted to prod before the mobile build benefits from them. (Cover-letter positioning backend was already in prod.)

---

## When the build finally happens (EAS mechanics — already verified ready)

- `eas.json` production profile: `autoIncrement: true` + `appVersionSource: "remote"` → EAS bumps iOS build number automatically.
- `ascAppId` set (`6761784351`) → `--auto-submit` works.
- Current version: `1.2.0`.
- Build command (Peri runs — interactive, Apple/Expo account): `eas build --platform ios --profile production --auto-submit`
- Commit WIP via **explicit paths only** — never `git add -A` (would sweep unfinished work into the build).
- Consider retroactively tagging the current live commit (`f41defe`) as `v1.2.0` for a clean release marker.
