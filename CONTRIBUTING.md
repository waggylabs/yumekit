# Contributing to Yumekit

Yumekit is an open-source project and contributions of all kinds are welcome, including bug reports, feature requests, documentation improvements, and code changes.

- All development happens on [GitHub](https://github.com/waggylabs/Yumekit).
- Before starting a large change, open an issue to discuss it so we can align on approach before you invest time.
- We follow a standard fork-and-pull-request workflow.

## Reporting Issues

Found a bug or unexpected behavior? Please open a GitHub issue.

- Search existing issues first to avoid duplicates.
- Include a minimal reproduction. A CodeSandbox or Stackblitz link is ideal.
- Describe what you expected vs. what actually happened.
- Include your browser, OS, and Yumekit version.

## Pull Requests

We welcome pull requests for bug fixes, improvements, and new features.

1. Fork the repository and create a new branch from `main`.
2. Make your changes with clear, focused commits.
3. Add or update tests to cover your change.
4. Ensure `npm run build` and `npm test` pass locally.
5. Open a pull request with a description of what changed and why.
6. A maintainer will review your PR and may request changes.

## Code Style

Yumekit is authored in plain JavaScript. Please follow the conventions already present in the codebase.

- The library is **plain JavaScript** with no TypeScript in the component source. Type declarations (`.d.ts` files) are maintained separately and ship alongside the JS build.
- Components are standard Custom Elements with no external framework dependencies.
- Use `kebab-case` for element names and attribute names.
- Keep components self-contained: styles live in the Shadow DOM, logic in the class, no shared global state.
- Run the linter before submitting: `npm run lint`.

## AI Assistance

AI tools can be helpful for brainstorming and prototyping, but they are not a substitute for human judgment and expertise.

- If you use AI tools to assist with code or documentation, please disclose that in your PR description for transparency.
- AI-generated content should be carefully reviewed and edited by a human before submission.
- We value the unique creativity and critical thinking that humans bring to the project, and AI should be viewed as a tool to augment that rather than replace it.

## Code of Conduct

We are committed to providing a welcoming, respectful community for everyone.

- Be kind and constructive in all interactions.
- Respect differing opinions and experience levels.
- Harassment or abusive behavior of any kind will not be tolerated and may result in removal from the project.
