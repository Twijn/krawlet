# Krawlet

The (nearly) fully-featured Kromer wallet, built in Svelte!

## Features

The web interface is the primary means to interact with Krawlet.
The web interface features:

- Viewing Kromer transactions and their metadata
- Viewing addresses, including their transactions and names purchased
- Listing addresses (including by the richest)
- Sending Kromer to addresses or online Minecraft players when provided a private key
- "Fill-ins" for known Minecraft addresses or verified addresses, making it easier to identify who is involved in transactions and other actions
- **Multi-language support** (English and Spanish) with easy extensibility
- **Progressive Web App (PWA)** with offline support and installability
- **Real-time updates** via WebSocket for live transaction notifications
- **Accessibility features** including keyboard navigation and screen reader support

In addition to the web interface, Krawlet also includes several chat-based commands that can be used. These include:

- `\balance [player]` - View another players (or your own) Kromer balance
- `\richest [page]` - View the richest addresses on Kromer
- `\names [page]` - View names registered on Kromer

To view an updated list of commands offered by Krawlet, use `\krawlet` in chat!

Krawlet is still in active development, so more features will be added soon!

## Architecture

Krawlet is built with:

- **SvelteKit** with Svelte 5 (Runes) for the UI framework
- **TypeScript** for type safety
- **Vite** for building and development
- **pnpm** for package management

For detailed architecture documentation, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### Key Documentation

- [Architecture Overview](docs/ARCHITECTURE.md) - Project structure and core concepts
- [Component Documentation](docs/COMPONENTS.md) - Reusable UI component reference
- [Internationalization Guide](docs/I18N.md) - Adding translations and new languages

## Public Version

Currently, the main public version for Krawlet is located on [Kromer.club](https://www.kromer.club).
Once a more official release of a Kromer wallet comes out, it will be moved to [Krawlet.kromer.club](https://krawlet.kromer.club)!

## Contributing

Contributions are welcome! Please see the [Contributing Guide](CONTRIBUTING.md) for more information.

## Setting up for Development

Setup for Krawlet is similar to most other Svelte kit applications!

First, fork the repo and clone your fork to your machine. Open in your favorite IDE!

Next, install dependencies with pnpm:

```shell
pnpm i
```

To run the development version of Krawlet, run:

```shell
pnpm run dev
```

### Building for Production

```shell
pnpm build
```

### Previewing the Production Build

```shell
pnpm preview
```
