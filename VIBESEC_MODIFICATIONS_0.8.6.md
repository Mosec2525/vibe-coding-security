# VibeSec v0.8.6 — Multi-policy activation fix

## What changed

- Replaced the old one-normal + one-taint selector with `activePolicyFiles`, allowing any number of active policy files.
- Normal and taint policies can now be active together in any combination.
- All policy files can be turned OFF. When zero policies are active, scans return zero findings instead of silently running `rules/default.yaml`.
- Fixed the fallback bug where an empty active policy caused the default rules to run.
- Added Delete buttons for custom policy files from the Rules list and detail page.
- Deleting an active custom policy removes it from `activePolicyFiles` instead of falling back to default rules.
- New normal/taint policy templates now start empty (`presets: []`) so a zero-rule policy really scans with zero rules.

## New workspace selector shape

```yaml
activePolicyFiles:
  - rules/default.yaml
  - rules/taint.yaml
  - rules/policies/custom-extra.yaml
presets:
  - vibesec:default
  - vibesec:taint
severity:
  minSeverity: warning
disabledRules: []
```

`presets` is kept only as a mirror for bundled default/taint compatibility. The real source of truth is `activePolicyFiles`.
