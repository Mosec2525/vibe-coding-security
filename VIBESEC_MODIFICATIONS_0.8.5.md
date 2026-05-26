# VibeSec v0.8.5 modifications

This build changes the policy activation model so VibeSec can keep one normal policy and one taint policy active at the same time.

## Policy activation model
- The Rules page now supports two active slots:
  - one active normal/default policy
  - one active taint policy
- Activating a normal policy only replaces the previous active normal policy.
- Activating a taint policy only replaces the previous active taint policy.
- Normal and taint policies can now run together in the same scan.

## Workspace selector file
The workspace `.vibesec.yaml` can now store:

```yaml
activeNormalPolicyFile: rules/default.yaml
activeTaintPolicyFile: rules/taint.yaml
presets:
  - vibesec:default
  - vibesec:taint
```

Custom policies stored inside the tool can also be selected:

```yaml
activeNormalPolicyFile: rules/policies/normal-my-policy.yaml
activeTaintPolicyFile: rules/policies/taint-my-policy.yaml
```

## Backward compatibility
- Older `.vibesec.yaml` files that use only `presets:` still work.
- Older files that use `activePolicyFile:` still load and are migrated by the Rules page when a new policy is activated.

## Scanner behavior
- The scanner now merges the active normal policy and active taint policy before running Semgrep.
- Disabled rules and file exclusions are combined from the selected policy files and the workspace selector file.
