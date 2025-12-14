# Component Documentation

This document provides detailed documentation for the reusable components in Krawlet.

## UI Components

### Button

**Location**: `src/lib/components/ui/Button.svelte`

A versatile button component with various states and styles.

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `disabled` | `boolean` | `false` | Disables the button |
| `loading` | `boolean` | `false` | Shows loading state |
| `onclick` | `() => void` | - | Click handler |

**Accessibility**:

- Uses `aria-disabled` when disabled
- Uses `aria-busy` when loading
- Supports keyboard activation (Enter, Space)

**Usage**:

```svelte
<Button onclick={handleSubmit} loading={isSubmitting}>Submit</Button>
```

---

### Section

**Location**: `src/lib/components/ui/Section.svelte`

A container component for grouping related content with consistent styling.

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | - | Optional ID for anchor linking |

**Usage**:

```svelte
<Section id="wallet-info">
	<h2>Wallet Information</h2>
	<p>Content here...</p>
</Section>
```

---

### Pagination

**Location**: `src/lib/components/ui/Pagination.svelte`

Pagination controls for navigating through lists.

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | `number` | - | Current page number |
| `totalPages` | `number` | - | Total number of pages |
| `onPageChange` | `(page: number) => void` | - | Page change handler |

**Accessibility**:

- Uses `aria-label` for navigation landmark
- Announces current page to screen readers

---

### Navigation

**Location**: `src/lib/components/ui/Navigation.svelte`

The main navigation component with responsive menu.

**Accessibility**:

- Uses `<nav>` element with `aria-label`
- Keyboard navigable menu items
- Mobile menu toggle with proper ARIA states

---

### ButtonSelect

**Location**: `src/lib/components/ui/ButtonSelect.svelte`

A button-based selection component for choosing between options.

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `{ value: string; label: string }[]` | - | Available options |
| `value` | `string` | - | Current selected value |
| `onchange` | `(value: string) => void` | - | Selection change handler |

---

## Skeleton Components

Loading placeholder components that show before data is loaded.

### Skeleton

**Location**: `src/lib/components/ui/Skeleton.svelte`

Base skeleton component with shimmer animation.

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `string` | `'100%'` | Element width |
| `height` | `string` | `'1rem'` | Element height |
| `borderRadius` | `string` | `'4px'` | Border radius |

---

### SkeletonTransaction

**Location**: `src/lib/components/ui/SkeletonTransaction.svelte`

Skeleton placeholder for transaction list items.

---

### SkeletonAddress

**Location**: `src/lib/components/ui/SkeletonAddress.svelte`

Skeleton placeholder for address displays.

---

### SkeletonWallet

**Location**: `src/lib/components/ui/SkeletonWallet.svelte`

Skeleton placeholder for wallet cards.

---

### SkeletonTable

**Location**: `src/lib/components/ui/SkeletonTable.svelte`

Skeleton placeholder for table rows.

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `number` | `5` | Number of skeleton rows |
| `columns` | `number` | `4` | Number of columns per row |

---

## Dialog Components

### Confirm

**Location**: `src/lib/components/dialogs/Confirm.svelte`

A confirmation dialog for user actions.

**Accessibility**:

- Uses `role="dialog"` and `aria-modal="true"`
- Focus trapped within dialog when open
- Escape key closes dialog
- Focus returns to trigger element on close

---

### Prompt

**Location**: `src/lib/components/dialogs/Prompt.svelte`

A dialog for collecting user input.

**Accessibility**:

- Same accessibility features as Confirm
- Auto-focuses input field when opened

---

### Alert

**Location**: `src/lib/components/dialogs/Alert.svelte`

A simple alert dialog for messages.

---

### Notifications

**Location**: `src/lib/components/dialogs/Notifications.svelte`

Toast notification system.

**Accessibility**:

- Uses `aria-live` regions
- Success/info use `polite` (non-interruptive)
- Errors use `assertive` (immediate announcement)
- Each notification has close button with `aria-label`

---

## Widget Components

### Wallets

**Location**: `src/lib/components/widgets/Wallets.svelte`

Displays user's wallets with balances.

---

### Motd

**Location**: `src/lib/components/widgets/Motd.svelte`

Message of the day component.

---

### WhatsNew

**Location**: `src/lib/components/widgets/WhatsNew.svelte`

Displays recent updates and changes.

---

### InstallPrompt

**Location**: `src/lib/components/widgets/InstallPrompt.svelte`

PWA installation prompt banner.

**Behavior**:

- Shows when app can be installed
- Dismissable (hides for session)
- Triggers native install prompt

---

### ConnectionStatus

**Location**: `src/lib/components/widgets/ConnectionStatus.svelte`

WebSocket connection status indicator.

**States**:

- 🟢 Green: Connected
- 🟡 Yellow: Connecting/Reconnecting
- 🔴 Red: Disconnected

---

## Form Components

### Address Input Components

Located in `src/lib/components/form/address/`:

- **AddressInputMethod.svelte**: Toggle between input methods
- **PlayerAddressInput.svelte**: Input by player name
- **RawAddressInput.svelte**: Direct address input
- **ShopAddressInput.svelte**: Select from shops

### Private Key Input Components

Located in `src/lib/components/form/privatekey/`:

- **PrivateKeyInputMethod.svelte**: Toggle between input methods
- **RawPrivateKeyInput.svelte**: Direct private key input
- **SavedWalletSelector.svelte**: Select from saved wallets

---

## Creating New Components

When creating new components, follow these patterns:

### TypeScript Props

```svelte
<script lang="ts">
	type Props = {
		required: string;
		optional?: number;
	};

	const { required, optional = 0 }: Props = $props();
</script>
```

### Accessibility

- Add appropriate ARIA attributes
- Ensure keyboard navigation works
- Test with screen readers
- Use semantic HTML elements

### Styling

- Use CSS custom properties for theming
- Follow existing naming conventions
- Ensure responsive design
- Support focus-visible states

### Documentation

- Add JSDoc comments for complex components
- Document all props
- Include usage examples
