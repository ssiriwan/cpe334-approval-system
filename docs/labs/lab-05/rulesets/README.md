# Required-check rulesets (R-06)

The merge gate for Lab 5 is a GitHub **repository ruleset**, not a local habit.
Two rulesets are needed so a failing check cannot enter the release path:

| File | Applies to | Effect |
| :--- | :--- | :--- |
| `main.json` | default branch (`main`) | Pull request + 1 approval, required status check **`CI quality gate`**, no force push, no deletion |
| `sprint-1-staging.json` | `refs/heads/sprint-1-staging` | Same gate on the integration branch |

`CI quality gate` is the job name in `.github/workflows/ci-docker.yml`, which is the
check context GitHub reports on the commit.

## Apply (repository owner only)

Creating or editing a ruleset needs **admin** permission on the repository, so the
owner applies it once:

```bash
gh api --method POST repos/ssiriwan/cpe334-approval-system/rulesets \
  --input docs/labs/lab-05/rulesets/main.json

gh api --method POST repos/ssiriwan/cpe334-approval-system/rulesets \
  --input docs/labs/lab-05/rulesets/sprint-1-staging.json
```

Verify:

```bash
gh api repos/ssiriwan/cpe334-approval-system/rulesets \
  --jq '.[] | "\(.name)\t\(.enforcement)\ttarget=\(.target)"'
```

Or use the UI: **Settings -> Rules -> Rulesets -> New branch ruleset**, add the
same conditions and rules, and tick **Require status checks to pass** with
`CI quality gate`.

## Why this is evidence, not configuration trivia

R-06 / C-02 require a demonstration: a temporary branch with one failing test
opens a pull request, the required check fails, and the merge button is blocked.
Without an active ruleset that demonstration cannot exist - `main` would accept
the merge. The captured blocked-merge screenshot in the Lab 5 PDF is only
meaningful because this gate is enforced by the repository, not by discipline.

## Notes

- `require_last_push_approval` is left `false` so a reviewer can push a small fix
  and keep an existing approval; `dismiss_stale_reviews_on_push` is `true`, so a
  new push does drop an old approval.
- No bypass actors are configured. The owner is subject to the same gate, which
  is what makes the evidence credible.
- GitHub Free supports rulesets on public repositories, which is why R-12
  (public repository) and R-06 are linked requirements.
