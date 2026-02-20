#!/bin/bash
cd "$(dirname "$0")/.." || exit 1

echo "=== Cleaning up Ralphy worktrees ==="

# Count worktrees before
BEFORE=$(git worktree list | grep -c ".ralphy-worktrees" || echo "0")
echo "Worktrees before cleanup: $BEFORE"

# Remove each worktree
for worktree in .ralphy-worktrees/agent-*; do
    if [ -d "$worktree" ]; then
        echo "Removing: $worktree"
        git worktree remove --force "$worktree" 2>/dev/null || true
        rm -rf "$worktree" 2>/dev/null || true
    fi
done

echo "=== Pruning stale worktree references ==="
git worktree prune

# Count worktrees after
AFTER=$(git worktree list | grep -c ".ralphy-worktrees" || echo "0")
echo "Worktrees after cleanup: $AFTER"
echo "=== Cleanup complete ==="
