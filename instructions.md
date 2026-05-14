# Workflow Permissions & Timeouts Audit

You are auditing GitHub Actions workflows in a single repository. The repository's absolute path will be provided in the dispatcher prompt; treat it as the working directory for every git/gh/file operation. All file edits, git commands, and `gh` commands MUST be scoped to that repository (use the `working_directory` parameter for shell calls or `cd` into it first).

## Your job

- Search for all GitHub Actions workflow files located in the `.github/workflows` directory of the working directory above.
- If the directory doesn't exist or no workflows are found then stop and fail loudly (return a clear failure message and do nothing else).
- Work through the following remediation steps in order.

### Permissions

Ensure every workflow file includes the following empty top-level `permissions` directive and comment immediately preceding the `jobs:` directive:

```yaml
# Disable permissions for all available scopes by default.
# Any needed permissions should be configured at the job level.
permissions: {}
```

Carefully assess each step in each workflow to determine which permissions are required for the GitHub token granted to the job if it uses the token to interact with a GitHub service. In particular, identify steps that:

- Use the `github` client inside `actions/github-script`
- Use the `gh` command
- Use Octokit or any other library to send requests to the GitHub API
- Directly send a request to the GitHub API via curl, wget, or any other HTTP client
- Pass `GITHUB_TOKEN` or `github.token` to an action, for example via a `token` input
- Call actions, external scripts, or reusable workflows that do any of the above

Fetch the GitHub documentation on workflow permissions at <https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions> and use it as the basis to identify the minimal permissions required for each step. Fetch and assess any called actions, scripts, or reusable workflows if necessary, and prefer re-fetching them instead of using your existing memory of their behaviour.

Ensure each job includes a correct and minimally-scoped `permissions` directive with a trailing comment on each permission explaining why it's necessary. This may involve adding a new `permissions` directive or tightening an existing one. Make sure to verify any pre-existing ones that are already defined to confirm that the specified permissions are accurate to adhere to the principle of least privilege.

Assume that the current working repo is a private one. This means you will need to be explicit about using `contents: read` in jobs that check out the repo.

Example format for `permissions` directives for jobs (note that the beginning `#` characters designating an inline comment for each specified permission should be aligned):

```yaml
permissions:
  contents: write      # Required to push the new branch
  pull-requests: write # Required to create the pull request
```

```yaml
permissions:
  contents: read # Required to clone the repo.
```

When the given job requires no permissions at all (for example, a small bash script that runs without having to access the repository or any GitHub feature), an explicit `permissions: {}` directive should be included.

The `permissions:` directive for each job should be placed immediately after the `runs-on:` or `uses:` setting for each job (only one can exist per job).

**Note:** The repository linter `scripts/check_github_workflows_compliance.py` (in the parent `newfold-labs` checkout) requires that for jobs that *call* a reusable workflow (`uses: org/repo/.github/workflows/...`), the `permissions:` block appears *before* `uses:` in the YAML key order.

### Timeouts

Ensure every job in each GitHub Actions workflow file includes a `timeout-minutes` setting with a reasonable value to prevent runaway workflows consuming a large number of GitHub Actions minutes. A common value is 30 minutes, but use your judgement based on the expected runtime of the job.

For this task, you are forbidden from changing the `timeout-minutes` value for any job that already has one. You are only to add them to jobs missing the setting.

### Change management

If you discover that changes are necessary, you should use git/`gh` cli to:

- Create a new branch called `add/scoped-workflow-permissions` (use `git checkout -b add/scoped-workflow-permissions`; if the branch already exists locally, check it out and continue from it).
- Commit all of the changes related to adding or adjusting `permissions:` in a single commit. Suggested message: `chore(workflows): scope GitHub Actions permissions`.
- Commit any `timeout-minutes:` additions separately. Suggested message: `chore(workflows): add timeout-minutes to jobs`.
- DO NOT publish the branch (no `git push`, no `gh pr create`). Only commit locally.
- NEVER update git config. Use existing local git identity.

### Compliance verifier

From the `newfold-labs` organization repository root (adjust paths to your machine):

```bash
python3 scripts/check_github_workflows_compliance.py "/absolute/path/to/wp-module-insights"
```

### Final report (return this verbatim as your last message)

Return a concise markdown report with this exact structure:

```markdown
# Workflow Audit: <repo-name>

## Status
- Workflows scanned: <N> (`file1.yml`, `file2.yml`, ...)
- Branch: `add/scoped-workflow-permissions` (created | already existed | not created — no changes needed)
- Permissions commit: <short SHA or "none">
- Timeouts commit: <short SHA or "none">

## Top-level `permissions: {}`
- Workflows that were missing the top-level `permissions: {}` directive (added in this run):
  - `<file>.yml`
  - ...

## Job-level `permissions:` additions
- `<file>.yml`: <count> jobs were missing a scoped `permissions:` directive
  - Detail (job name -> permissions added) [confidence: 1-3]:
    - `<job>` -> `contents: read` [3]
- ...

## Permissions corrections (previously incorrect)
- `<file>.yml` :: `<job>`: BEFORE `<old>` -> AFTER `<new>` -- reason -- [confidence 1-3]
- (or "None" if nothing was incorrect)

## `timeout-minutes` additions
- `<file>.yml` :: `<job>` -> `<value>` -- 1-2 sentence rationale
- ...

## Notes / blockers
- Anything that needs human review (ambiguous permission scope, third-party actions you couldn't fully verify, etc.)
```

Confidence guide:

- 3 = very confident
- 2 = uncertain
- 1 = educated guess (if any change ends up at 1, repeat the discovery steps to verify before finalizing)

Do not include any other content in your final message besides this report.
