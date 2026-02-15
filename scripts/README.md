# Build Scripts

This directory contains TypeScript build scripts for the Awana Labs Showcase project.

## Available Scripts

### fetch-projects.ts

Fetches all issues from `luandro/awana-labs-showcase` with the `publish:yes` label using the GitHub API via @octokit/core.

**Usage:**

```bash
# Using the npm script
bun run fetch:projects

# Direct execution
bun scripts/fetch-projects.ts
```

**Environment Variables:**

- `GITHUB_TOKEN` (required): GitHub Personal Access Token with `public_repo` scope
- `GITHUB_REPOSITORY` (optional): Repository in format "owner/repo" (auto-detected in GitHub Actions)

**Setup:**

1. Create a Personal Access Token at https://github.com/settings/tokens
2. Grant the `public_repo` scope (for accessing public repositories)
3. Set the environment variable:
   ```bash
   export GITHUB_TOKEN=your_token_here
   export GITHUB_REPOSITORY=owner/repo  # Optional, auto-detected in GitHub Actions
   ```

**Output:**

The script returns raw issue data including:

- `number`: Issue number
- `title`: Issue title
- `body`: Issue body/description (Markdown)
- `labels`: Array of labels
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `state`: Issue state (open/closed)
- `html_url`: URL to the issue on GitHub
- `user`: Creator information

**Programmatic Usage:**

```typescript
import { fetchPublishableIssues } from "./scripts/fetch-projects.ts";

const issues = await fetchPublishableIssues();
console.log(`Found ${issues.length} publishable issues`);
```

**Features:**

- Uses official @octokit/core SDK for GitHub API
- Automatic pagination handling (fetches all issues using Octokit's paginate iterator)
- Rate limit detection with helpful messages
- Authentication error handling
- Network error handling with clear messages
- Progress logging for large result sets
- Can be used as a module or executed standalone
- JSON output for piping to other tools

**Implementation Details:**

The script uses `@octokit/core` instead of raw fetch calls for improved:

- Type safety with GitHub API responses
- Built-in pagination support via `octokit.paginate.iterator()`
- Automatic retry logic and error handling
- Better authentication management
- Consistent API versioning
