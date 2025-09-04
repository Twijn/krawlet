# Contributing to Krawlet

Thank you for your interest in contributing to Krawlet! This document provides guidelines for contributing to the
project.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/krawlet.git`
3. Install dependencies: `pnpm i`
4. Start development server: `pnpm run dev`
5. Open `http://localhost:5173` in your browser. (Port may vary)

## Commonly Edited Files

Some files are frequently updated as part of normal maintenance:

- `src/lib/verified.ts`: Contains the list of verified shops and services. Add new verified entities here.
- `src/routes/`: Contains page routes and their components
- `src/lib/components/`: Reusable Svelte components

## Making Changes

1. Create a new branch for your changes
2. Make your changes
3. Test your changes locally
4. Submit a pull request

## Code Style

- Use TypeScript wherever possible for type safety
- Follow the existing code style
- Run `pnpm run format` to format and lint your code. Solve any issues prior to committing

## Pull Request Process

1. Ensure your code follows the style guidelines
2. Update documentation if needed
3. Test your changes thoroughly
4. Submit a pull request with a clear description of changes

## Questions?

Feel free to open an issue for any questions or concerns.
