# Vercel Skills -> ChatGPT Connector Isomorphism

Observed: 2026-09-03.

## Goal

Reuse mature Vercel agent-skill procedures without pretending that a ChatGPT Vercel connector is a shell or Vercel CLI session.

The adaptation rule is:

```text
skill intent / ordering / safety invariant
            -> preserve
CLI command / token plumbing / local-link assumption
            -> replace with connector-native action or mark unsupported
```

## Sources reviewed

### Vercel official Agent Skills

Repository: https://github.com/vercel-labs/agent-skills

Relevant skills:

- `deploy-to-vercel` v3.0.0
- `vercel-optimize` v1.2.0
- `vercel-cli-with-tokens` v1.0.0

### OpenAI Vercel plugin skills

Repository: https://github.com/openai/plugins/tree/main/plugins/vercel/skills

Relevant skills:

- `bootstrap`
- `cron-jobs`
- `deployments-cicd`

These are especially useful because they describe Vercel procedures around a plugin-oriented environment rather than only generic application code.

## Current ChatGPT Vercel connector surface

Observed available actions include:

- list teams
- list/get projects
- deploy current project
- list/get deployments
- deployment build logs
- runtime logs
- grouped runtime errors
- Agent Runs project/run/trace observability
- protected deployment fetch/share access
- official Vercel documentation search

Current connector surface does **not** expose direct actions for:

- environment-variable mutation
- Vercel token management
- explicit project create/delete
- promote/rollback
- direct Cron create/list/run control
- full `vercel metrics`, `vercel usage`, or `vercel contract` equivalents

Treat this list as observed connector capability, not permanent product specification.

---

## Mapping 1: `deploy-to-vercel`

### Preserve

1. Gather project/account state before deployment.
2. Resolve exact team/project instead of guessing scope.
3. Default to preview/non-production behavior unless production is explicit.
4. Deploy, then inspect deployment state rather than treating submission as success.
5. Return a concrete deployment URL and status.

### Connector-native translation

```text
CLI: vercel teams list
 -> connector: list_teams

CLI: vercel projects/list/link state
 -> connector: list_projects + get_project
    plus repository-local `.vercel/` inspection only when local runtime actually has it

CLI: vercel deploy
 -> connector: deploy_to_vercel

CLI: vercel ls / inspect
 -> connector: list_deployments + get_deployment

CLI: inspect/logs
 -> connector: get_deployment_build_logs + get_runtime_logs/get_runtime_errors
```

### Important unresolved point

`deploy_to_vercel` does not expose a preview/production argument in the current connector schema. Therefore the official skill's "preview by default" invariant cannot yet be assumed from the connector call itself. The canary must empirically establish deployment target semantics before production use.

---

## Mapping 2: `vercel-optimize`

The most valuable part is not the scripts; it is the doctrine:

```text
collect signals first
 -> deterministic gate
 -> inspect only implicated routes/files
 -> verify recommendation
```

This maps strongly to Theseus methodology.

### Available connector signals

- project metadata
- deployment history/state
- build logs
- runtime logs
- grouped runtime errors
- Agent Runs and traces where applicable

### Missing signals

The current connector does not expose direct equivalents for the official skill's full metrics/usage/contract collection. Therefore connector-based optimization must be classified as:

`PARTIAL_OBSERVABILITY_ONLY`

unless those signals become available later.

Never silently replace missing metrics with repo-wide grep and call the result equivalent to `vercel-optimize`.

---

## Mapping 3: `vercel-cli-with-tokens`

Do **not** port token discovery or token export procedures into the ChatGPT connector workflow.

The connector's authorized session is itself the authentication boundary.

Translation:

```text
CLI skill: locate VERCEL_TOKEN
connector adaptation: forbidden / not needed

CLI skill: pass account/project scope explicitly
connector adaptation: list_teams -> list_projects/get_project -> use exact IDs

CLI skill: do not leak token on command line
connector adaptation: never request, print, or persist connector credentials at all
```

This is an intentional semantic difference, not a missing feature.

---

## Mapping 4: OpenAI `bootstrap`

Preserve the strict ordering:

```text
resolve account/team
 -> resolve project
 -> verify deployment/link state
 -> verify configuration requirements
 -> only then run app/resource mutations
```

For connector-managed projects, API-side project identity should be treated as stronger than a guessed local directory name.

The current connector cannot mutate env vars or integrations directly, so bootstrap must stop at an explicit authority boundary rather than pretending those steps happened.

---

## Mapping 5: OpenAI `cron-jobs`

Current skill guidance records Hobby constraints:

- maximum 2 cron jobs
- Hobby schedules no more frequently than once per day
- cron invokes production deployments, not previews
- protect cron handlers with `CRON_SECRET`

For the CI watcher canary this strengthens the original architecture:

```text
GitHub-like event -> webhook/function   # primary
once-daily Vercel cron -> reconcile     # safety net only
```

Do not design a 5-minute or hourly Vercel-native reconciliation loop on the current Hobby account.

A particularly important failure mode to test: invalid Hobby cron frequency can block deployment validation before a normal deployment record becomes visible. This should become a field note if reproduced or independently verified in the canary.

---

## Mapping 6: OpenAI `deployments-cicd`

Useful invariants:

1. Separate deploy submission from deploy verification.
2. Inspect build logs on failure.
3. After production deployment, inspect runtime errors rather than assuming READY means healthy application behavior.
4. Prefer immutable preview evidence before production promotion when the surface supports it.

Current connector supports points 1-3 well through deployment and log actions. It does not currently expose promote/rollback directly, so those remain `CLI_OR_DASHBOARD_REQUIRED` unless the connector grows them.

---

## Proposed connector-native operating procedure

```text
1. list_teams
2. choose exact team
3. list_projects
4. get_project when project exists
5. deploy_to_vercel
6. list_deployments / get_deployment
7. if build failure -> get_deployment_build_logs(errorsOnly=true)
8. if deployed -> get_runtime_errors + bounded get_runtime_logs
9. persist sanitized receipt
```

For a new project, the connector's exact project-creation semantics must be discovered by the canary before this sequence is promoted to a reusable recipe.

## Evidence classifications

- `DIRECT_CONNECTOR_EQUIVALENT`
- `PARTIAL_CONNECTOR_EQUIVALENT`
- `CONNECTOR_AUTH_REPLACES_CLI_SECRET_FLOW`
- `CLI_OR_DASHBOARD_REQUIRED`
- `UNKNOWN_NEEDS_CANARY`

## Next canaries

1. Determine what `deploy_to_vercel` creates when team has zero projects.
2. Record preview/production semantics of that deployment.
3. Verify project appears through `list_projects` after deployment.
4. Verify build-log and runtime-log readback.
5. Deploy one valid once-daily cron configuration on Hobby.
6. Separately test invalid higher-frequency cron only in a disposable branch/project if safe, to determine whether failure surfaces through connector logs/state.
