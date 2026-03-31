#!/bin/bash
cd "$(dirname "$0")/.." || exit 1

echo "=== Cleaning up Ralphy worktrees ==="

count_ralphy_worktrees() {
    git worktree list --porcelain | awk '/^worktree / && /\.ralphy-worktrees/ { count++ } END { print count + 0 }'
}

# Count worktrees before
BEFORE=$(count_ralphy_worktrees)
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
AFTER=$(count_ralphy_worktrees)
echo "Worktrees after cleanup: $AFTER"
echo "=== Cleanup complete ==="
