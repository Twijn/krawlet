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

## Adding Translations

To add a new language or update existing translations:

1. **Create or edit a locale file** in `src/lib/i18n/locales/`
   - For a new language: Create a new file (e.g., `fr.ts` for French)
   - Copy the structure from `en.ts` and translate all strings

2. **Register the new language** in `src/lib/i18n/index.ts`
   - Import your locale file
   - Add it to the `locales` object
   - Add the language code to the `availableLocales` array

3. **Test your translations**
   - Run the development server: `pnpm run dev`
   - Change the language in Settings to verify all translations appear correctly
   - Check that parameter interpolation works (e.g., transaction notifications)

**Important**: Keep the exact same structure and keys as `en.ts` - only translate the values.

For more details about the i18n system, see [docs/I18N.md](docs/I18N.md).

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
