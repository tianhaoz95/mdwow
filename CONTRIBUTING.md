# Contributing to mdwow

First off, thank you for considering contributing to `mdwow`! It's people like you that make the open-source community such a great place to learn, inspire, and create.

## Code of Conduct

Please be respectful and professional in all interactions within this project.

## Development Workflow

The `main` branch is protected. All development must occur on feature branches and be merged via Pull Requests.

1.  **Fork and Clone**: Fork the repository and clone it to your local machine.
2.  **Create a Feature Branch**: `git checkout -b feature/your-feature-name`
3.  **Implement and Test**: Make your changes and ensure all tests pass.
4.  **Commit**: Use clear and concise commit messages.
5.  **Push and PR**: Push your branch and open a Pull Request against `main`.

## Local Setup

```bash
# Install dependencies
npm install

# Run in development mode (auto-reloads)
npm run dev -- README.md

# Run the comprehensive test preview
npm run preview

# Build the project
npm run build
```

## Testing

We use [Vitest](https://vitest.dev/) for testing. Please ensure your changes include relevant tests.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

The test suite covers:
- **Unit tests**: Individual utility functions and parsers.
- **Component tests**: Ink components for rendering Markdown nodes.
- **UI tests**: Visual output verification using `ink-testing-library`.

## Visual Previews

When you open a Pull Request, a GitHub Action will automatically:
1.  Launch `mdwow` in a headless terminal.
2.  Record an **animated GIF** of the app scrolling through `TEST.md`.
3.  Comment on your PR with the preview.

**Please check this preview** to ensure your changes look correct in a real terminal environment.

## Code Style

- We use **TypeScript** in strict mode.
- Lines should generally be kept under 100 characters.
- Follow existing patterns in the codebase for naming and structure.
- Run `npm test` before submitting to ensure no regressions.

## Commit Messages

We prefer clear, descriptive commit messages. While not strictly enforced, following [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`, `docs:`) is encouraged.

## Submitting a Pull Request

- Provide a clear description of the changes.
- Link any related issues.
- Ensure the CI (tests and build) passes.
- Respond to reviewer feedback.

Happy coding!
