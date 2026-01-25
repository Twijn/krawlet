# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Krawlet is a SvelteKit-based cryptocurrency wallet for Kromer, a currency on the Reconnected.CC Minecraft server. It's a Progressive Web App (PWA) with offline support, real-time transaction updates via WebSocket, multi-language support (English/Spanish), and encrypted wallet storage.

## Technology Stack

- **Framework:** SvelteKit 2.x with Svelte 5 (Runes-based reactivity)
- **Language:** TypeScript 5
- **Build Tool:** Vite 7
- **Package Manager:** pnpm (required)
- **Deployment:** Vercel (using @sveltejs/adapter-vercel)
- **Key Libraries:**
  - `krawlet-js` - API client for Krawlet-specific endpoints (shops, reports, metadata)
  - `kromer` - Blockchain API client for Kromer network operations
  - `crypto-js` - Client-side encryption (AES-256-GCM for wallet private keys)
  - `@fortawesome/svelte-fontawesome` - Icon system

## Development Commands

```bash
# Install dependencies (use pnpm)
pnpm i

# Start development server (usually on http://localhost:5173)
pnpm run dev

# Type checking
pnpm run check

# Watch mode for type checking
pnpm run check:watch

# Format and lint
pnpm run format

# Lint only
pnpm run lint

# Build for production
pnpm build

# Preview production build locally
pnpm preview

# Clean build artifacts
pnpm run clean

# Generate screenshots (internal script)
pnpm run screenshots
```

## Architecture Overview

### Directory Structure

```
src/
├── lib/
│   ├── api/                    # API clients (krawlet.ts, kromer.ts, shopsync-reports.ts)
│   ├── components/
│   │   ├── dialogs/            # Modal components (Alert, Confirm, Prompt, Notifications)
│   │   ├── form/               # Form inputs (address, private key, toggle checkbox)
│   │   ├── ui/                 # UI primitives (Button, Section, Pagination, Skeleton)
│   │   └── widgets/            # Domain-specific widgets (transactions, addresses, shops)
│   ├── i18n/
│   │   ├── index.ts            # i18n system with locale store and t() function
│   │   └── locales/            # Translation files (en.ts, es.ts)
│   ├── stores/
│   │   ├── FetchedStore.ts     # Base class for data stores with periodic fetching
│   │   ├── settings.ts         # Encrypted settings & wallet storage
│   │   ├── websocket.ts        # Real-time transaction updates
│   │   ├── pwa.ts              # PWA features (install, offline status)
│   │   └── [domain].ts         # Domain stores (knownAddresses, playerWallets, etc.)
│   ├── types/                  # TypeScript interfaces
│   ├── utils/                  # Helper utilities
│   ├── consts.ts               # App constants (SYNC_NODES, version)
│   ├── paramState.svelte.ts    # URL parameter state synchronization
│   └── util.ts                 # General utilities (relativeTime, formatCurrency)
├── routes/                     # File-based routing
│   ├── addresses/              # Address browsing with [addressStr] dynamic route
│   ├── shops/                  # Shop catalog
│   ├── wallets/                # Wallet management
│   ├── transactions/           # Transaction history
│   ├── names/                  # Name registry
│   ├── settings/               # User preferences
│   └── internal/               # Developer endpoints
└── service-worker.ts           # PWA service worker with caching strategies
```

### State Management Pattern

**Svelte 5 Runes** - Use modern reactive primitives in components:

```typescript
let state = $state(initialValue);
const computed = $derived(state * 2);
$effect(() => {
	/* runs when dependencies change */
});
```

**Svelte Stores** - For shared application state:

- `writable` - Mutable stores
- `derived` - Computed stores
- `get()` - Synchronous value retrieval

**FetchedStore Pattern** - Reusable base class for data fetching:

- Periodic updates with configurable intervals
- Automatic localStorage persistence and hydration
- Store subscription interface
- Timestamp tracking for data freshness

### API Integration

The application uses two primary API clients:

1. **`kromer`** (`src/lib/api/kromer.ts`) - Blockchain operations:
   - Address lookups and balance queries
   - Transaction creation and submission
   - Name registry operations
   - Direct interaction with Kromer sync nodes

2. **`krawlet`** (`src/lib/api/krawlet.ts`) - Application services:
   - Shop catalog and listings
   - Report data (ShopSync integration)
   - Known addresses and player wallets
   - Metadata enrichment

Both are singleton instances exported for use throughout the app.

### Data Fetching Strategy

1. **SvelteKit Load Functions** - Server-side data loading in `+page.ts` or `+layout.ts`:

   ```typescript
   export async function load({ params }) {
   	const data = await fetchData(params.id);
   	return { data };
   }
   ```

2. **Client-side Stores** - For reactive, auto-updating data:

   ```typescript
   import { knownAddresses } from '$lib/stores/knownAddresses';
   // Automatically fetches and updates every 30s
   ```

3. **WebSocket** - Real-time transaction notifications via `websocket` store

### Encryption & Security

- **Wallet Storage:** Private keys encrypted with AES-256-GCM using master password
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **Client-side Only:** All crypto operations happen in browser (Web Crypto API)
- **No Server Storage:** Private keys never leave the client

### Internationalization (i18n)

**Adding Translations:**

1. Create/edit locale file in `src/lib/i18n/locales/` (e.g., `fr.ts`)
2. Copy structure from `en.ts` and translate all strings
3. Register in `src/lib/i18n/index.ts`:
   ```typescript
   import fr from './locales/fr';
   export const locales = { en, es, fr };
   export const availableLocales = ['en', 'es', 'fr'];
   ```

**Usage in Components:**

```svelte
<script>
	import { t } from '$lib/i18n';
</script>

<h1>{$t('nav.home')}</h1><p>{$t('greeting', { name: userName })}</p>
```

### PWA Features

**Service Worker** (`service-worker.ts`):

- Cache-first strategy for static assets
- Network-first for API requests with cache fallback
- Automatic cache versioning and cleanup
- Push notification handling

**PWA Store** (`src/lib/stores/pwa.ts`):

- Install prompt management
- Online/offline status tracking
- Service worker update detection

### Component Patterns

**Svelte 5 Props:**

```typescript
type Props = {
	title: string;
	count?: number;
};
const { title, count = 0 }: Props = $props();
```

**Component Reference Format:**
When discussing code locations, use `file_path:line_number` format for easy navigation.

### URL State Synchronization

Use `paramState.svelte.ts` to sync component state with URL search parameters:

```typescript
import { paramState } from '$lib/paramState.svelte';

const page = paramState<number>('page', 1, {
	parse: (v) => parseInt(v) || 1,
	serialize: (v) => v.toString()
});
```

## Key Patterns to Follow

### File Operations

- **Editing:** ALWAYS prefer editing existing files over creating new ones
- **Reading First:** Read files before modifying them to understand current structure
- **Component Creation:** Only create new components when absolutely necessary

### Code Style

- Use TypeScript for all new code
- Follow Svelte 5 runes syntax (`$state`, `$derived`, `$props`, `$effect`)
- Use existing UI components from `src/lib/components/ui/`
- Follow component organization: dialogs, forms, widgets, UI primitives

### Common Modifications

**Frequently Updated Files:**

- `src/lib/verified.ts` - List of verified shops/services
- `src/routes/` - Page components and routing
- `src/lib/components/` - Reusable components
- `src/lib/i18n/locales/` - Translations

**Version Management:**

- Version number in `package.json` is injected globally as `__VERSION__`
- Used in service worker for cache versioning
- Displayed in UI settings

### Testing & Quality

Run before committing:

```bash
pnpm run format  # Formats with Prettier and runs ESLint
pnpm run check   # TypeScript type checking
```

## Deployment

- **Platform:** Vercel
- **Adapter:** @sveltejs/adapter-vercel configured in `svelte.config.js`
- **Build Output:** `.vercel/output/` directory
- **Environment:** Production uses HTTPS (required for PWA features)

## External Resources

- [SvelteKit Documentation](https://svelte.dev/docs/kit)
- [Svelte 5 Runes Guide](https://svelte.dev/docs/svelte/what-are-runes)
- Detailed docs in `docs/`:
  - `ARCHITECTURE.md` - Detailed architecture overview
  - `COMPONENTS.md` - Component API reference
  - `I18N.md` - Internationalization system details
