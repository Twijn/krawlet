# Krawlet Architecture

This document provides an overview of the Krawlet application architecture.

## Overview

Krawlet is a SvelteKit-based web application for managing Kromer cryptocurrency on the Reconnected.CC Minecraft server. It provides wallet management, transaction handling, name registration, and shop browsing capabilities.

## Technology Stack

- **Framework**: SvelteKit with Svelte 5 (Runes)
- **Language**: TypeScript
- **Styling**: CSS with CSS Custom Properties (Variables)
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Icons**: FontAwesome via @fortawesome/svelte-fontawesome

## Project Structure

```
src/
├── lib/
│   ├── api/              # API client for Kromer endpoints
│   ├── components/       # Reusable Svelte components
│   │   ├── dialogs/      # Modal dialogs (Alert, Confirm, Prompt)
│   │   ├── form/         # Form input components
│   │   ├── ui/           # UI primitives (Button, Section, etc.)
│   │   └── widgets/      # Feature widgets
│   ├── i18n/             # Internationalization system
│   │   ├── index.ts      # Core i18n functions
│   │   └── locales/      # Translation files (en, es)
│   ├── stores/           # Svelte stores for state management
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── app.css           # Global styles
│   ├── consts.ts         # Application constants
│   ├── paramState.svelte.ts  # URL parameter state management
│   └── util.ts           # General utility functions
├── routes/               # SvelteKit file-based routing
│   ├── addresses/        # Address browsing and search
│   ├── internal/         # Internal endpoints (wallet creation, etc.)
│   ├── names/            # Name management
│   ├── shops/            # Shop browsing
│   ├── transactions/     # Transaction handling
│   ├── wallets/          # Wallet management
│   ├── settings/         # User settings
│   ├── help/             # Help and documentation
│   └── offline/          # Offline fallback page
├── service-worker.ts     # PWA service worker
├── app.html              # HTML template
└── app.d.ts              # TypeScript declarations
```

## Core Concepts

### State Management

The application uses Svelte stores for global state management:

- **settings.ts**: User preferences (language, display options, sync node)
- **playerWallets.ts**: Encrypted wallet storage
- **knownAddresses.ts**: Address book with labels
- **notifications.ts**: Toast notification system
- **pwa.ts**: PWA installation and online status
- **websocket.ts**: Real-time updates connection

### Svelte 5 Runes

Components use Svelte 5's runes syntax:

```svelte
<script lang="ts">
	type Props = {
		title: string;
		count?: number;
	};

	const { title, count = 0 }: Props = $props();

	let internalState = $state(false);
	const computed = $derived(count * 2);
</script>
```

### API Layer

The `src/lib/api/kromer.ts` file contains the API client for communicating with Kromer sync nodes. It handles:

- Address lookups
- Transaction creation and retrieval
- Name management
- Shop data fetching

### Internationalization

The i18n system (`src/lib/i18n/`) provides:

- `locale` store for current language
- `t()` function for translations with interpolation
- Translation files in `locales/` directory

See [I18N.md](./I18N.md) for detailed i18n documentation.

### Progressive Web App

PWA features include:

- Service worker for offline caching
- Install prompt for adding to home screen
- Offline fallback page
- Background sync support

### Accessibility

Accessibility features are implemented throughout:

- Skip navigation link
- ARIA landmarks and labels
- Focus management in dialogs
- Screen reader announcements
- Keyboard navigation support

See [COMPONENTS.md](./COMPONENTS.md) for component-specific accessibility details.

## Data Flow

1. **User Interaction** → Component event handlers
2. **State Updates** → Svelte stores or component state
3. **API Calls** → Kromer API client
4. **Response Processing** → Store updates, notifications
5. **UI Updates** → Reactive Svelte bindings

## Real-time Updates

WebSocket connections provide real-time updates for:

- New transactions
- Block confirmations
- Network status

The `websocket.ts` store manages connection lifecycle, automatic reconnection, and subscription handling.

## Security Considerations

- Private keys are encrypted with a master password before storage
- All crypto operations happen client-side
- No sensitive data is sent to external servers (except the Kromer sync node)
- HTTPS is required for production deployment

## Build and Deployment

```bash
# Development
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

The build outputs to the configured adapter (typically `@sveltejs/adapter-static` or `@sveltejs/adapter-auto`).
