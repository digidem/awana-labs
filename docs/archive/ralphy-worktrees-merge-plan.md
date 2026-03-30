# Ralphy Worktrees Merge Plan

## Intended Merge Policy

**Policy**: Standard Merge Commits (non-squash, non-fast-forward when diverged)

## Rationale

The project uses standard merge commits to preserve the complete history of agent worktrees. Each merge creates a merge commit that explicitly records:

1. **Branch Name**: The source agent branch (e.g., `ralphy/agent-11-1770227830941-wda4yl-identify-missing-validation-schema-typing-and-prop`)
2. **Merge Point**: The exact point where the agent's work was integrated
3. **Commit History**: The full commit history from the agent's worktree is preserved

## Evidence

Recent merge commits from `git log` confirm this policy:

```
c0b2e5c Merge ralphy/agent-11-1770227830941-wda4yl-identify-missing-validation-schema-typing-and-prop into main
fdbafb2 Merge ralphy/agent-25-1770230214011-0bm79y-add-npm-run-typecheck-if-missing-run-and-resolve-a into main
4f03874 Merge ralphy/agent-24-1770229875065-mmngzq-update-github-issues-and-sample-project-entries-to into main
```

## Merge Procedure

1. **Checkout main branch**:

   ```bash
   git checkout main
   git pull origin main
   ```

2. **Merge the agent worktree branch**:

   ```bash
   git merge ralphy/agent-XX-<timestamp>-<branch-slug>
   ```

3. **Resolve any conflicts** (if they arise):
   - Edit conflicted files
   - `git add <resolved-files>`
   - `git commit` (to complete the merge)

4. **Push to origin**:
   ```bash
   git push origin main
   ```

## Alternative Policies Considered

| Policy           | Status   | Reason                                                                            |
| ---------------- | -------- | --------------------------------------------------------------------------------- |
| **Squash Merge** | Rejected | Would flatten agent work history, losing traceability of individual agent commits |
| **Fast-Forward** | Rejected | Not applicable when branches have diverged; would not record merge metadata       |

## Worktree Merge Checklist

### Pre-Merge Checklist

#### 1. Branch Preparation

- [ ] **Ensure main branch is up-to-date**
  ```bash
  git checkout main
  git pull origin main
  ```
- [ ] **Verify the agent worktree branch exists**
  ```bash
  git branch -a | grep ralphy/agent-XX
  ```
- [ ] **Rebase the agent branch onto latest main** (optional but recommended)
  ```bash
  git checkout ralphy/agent-XX-<timestamp>-<branch-slug>
  git rebase main
  ```

  - If conflicts occur during rebase, resolve them before proceeding
  - Force push the rebased branch if needed: `git push --force-with-lease`

#### 2. Code Quality Verification

- [ ] **Run typecheck**
  ```bash
  npm run typecheck
  ```
  Expected: No TypeScript errors
- [ ] **Run linting**
  ```bash
  npm run lint
  ```
  Expected: No ESLint errors (warnings are acceptable if justified)
- [ ] **Run unit tests**
  ```bash
  npm run test
  ```
  Expected: All tests pass
- [ ] **Run E2E tests** (if applicable)
  ```bash
  npm run test:e2e
  ```
  Expected: All E2E tests pass

#### 3. Build Verification

- [ ] **Run production build**
  ```bash
  npm run build
  ```
  Expected: Clean build to `dist/` with no errors
- [ ] **Verify build output** (optional but recommended)
  ```bash
  npm run preview
  ```
  Expected: Application starts successfully

#### 4. Documentation Updates

- [ ] **Check if README.md needs updates**
  - New features or changes should be documented
  - Installation/usage instructions updated if needed
- [ ] **Check if AGENTS.md needs updates**
  - New procedures or workflows documented
  - Agent guidelines updated if applicable
- [ ] **Verify inline documentation**
  - Complex code has comments where needed
  - Public APIs have JSDoc/TSDoc comments
- [ ] **Update CHANGELOG.md** (if it exists)
  - Add entry for the changes being merged

#### 5. Review Commit History

- [ ] **Review commits on the agent branch**
  ```bash
  git log main..ralphy/agent-XX-<timestamp>-<branch-slug> --oneline
  ```
  Expected: Commits follow conventional commit format (`feat:`, `fix:`, `chore:`, etc.)
- [ ] **Verify commit messages are descriptive**
  - Each commit should have a clear purpose
  - Related changes grouped together

### Merge Procedure

#### 6. Execute Merge

- [ ] **Checkout main branch**
  ```bash
  git checkout main
  ```
- [ ] **Merge the agent worktree branch**
  ```bash
  git merge ralphy/agent-XX-<timestamp>-<branch-slug> --no-ff
  ```

  - `--no-ff` ensures a merge commit is created even if fast-forward is possible
  - This preserves the agent's branch history

#### 7. Resolve Conflicts (if any)

- [ ] **If conflicts occur, resolve them systematically**
  - Review each conflict marker (`<<<<<<<`, `=======`, `>>>>>>>`)
  - Choose the correct resolution (main's version, agent's version, or manual merge)
  - Test the resolution locally
- [ ] **Stage resolved files**
  ```bash
  git add <resolved-files>
  ```
- [ ] **Complete the merge commit**
  ```bash
  git commit
  ```

  - The default merge message is usually acceptable
  - Edit if additional context is needed

### Post-Merge Checklist

#### 8. Post-Merge Verification

- [ ] **Run typecheck again**
  ```bash
  npm run typecheck
  ```
- [ ] **Run linting again**
  ```bash
  npm run lint
  ```
- [ ] **Run tests again**
  ```bash
  npm run test
  ```
- [ ] **Run build again**
  ```bash
  npm run build
  ```
  Expected: All checks pass after merge

#### 9. Documentation Finalization

- [ ] **Update merge records** (if maintaining merge logs)
  - Document the merge date and branch name
  - Note any significant changes or conflicts
- [ ] **Verify project documentation is accurate**
  - No broken references or outdated information

#### 10. Push and Cleanup

- [ ] **Push to origin**
  ```bash
  git push origin main
  ```
- [ ] **Verify push succeeded**
  ```bash
  git log --oneline -5
  ```
  Expected: Merge commit is visible in recent history
- [ ] **Delete the merged agent branch** (optional, after successful merge)
  ```bash
  git branch -d ralphy/agent-XX-<timestamp>-<branch-slug>
  git push origin --delete ralphy/agent-XX-<timestamp>-<branch-slug>
  ```

#### 11. Optional: Worktree Cleanup

- [ ] **Remove the worktree if no longer needed**
  ```bash
  git worktree list
  git worktree remove <worktree-path>
  ```

### Merge Conflict Resolution Guidelines

When conflicts arise during merge:

1. **Understand the conflict**: Review what changed on both sides
2. **Communicate**: If unsure, ask for context from the agent or team
3. **Test thoroughly**: After resolution, run all verification steps
4. **Document**: Add comments if the resolution is non-obvious

### Rollback Procedure

If a merge causes issues:

1. **Revert the merge commit**:
   ```bash
   git revert -m 1 <merge-commit-sha>
   ```
2. **Or reset to previous state** (if not yet pushed):
   ```bash
   git reset --hard HEAD~1
   ```
3. **Investigate the issue** before attempting merge again

## Notes

- This policy applies specifically to merging Ralphy agent worktrees into main
- The branch naming convention `ralphy/agent-XX-<timestamp>-<slug>` provides traceability
- Merge commit messages follow the pattern: `Merge <branch-name> into main`
- All checklist items should be completed unless marked as optional
- When in doubt, err on the side of caution and run additional verification
