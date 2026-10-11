# Transaction Metadata Reference

This file documents all metadata keys currently recognized or emitted by Krawlet, plus where they are used in the UI.

Kromer transaction metadata is a semicolon-delimited string of key-value pairs.
Entries without `=` are treated as value-only flags.

Format:

```
key1=value1;key2=value2;flag_key
```

Parsing uses `kromer.transactions.parseMetadata()`. Krawlet key matching is case-insensitive via `toLowerCase()`.

---

## Where Metadata Is Parsed and Rendered

### Main parsing entry points

- `src/lib/components/widgets/transactions/ParsedMetadata.svelte`
  - Shared compact renderer used by transaction list tables.
- `src/routes/transactions/[id]/+page.svelte`
  - Dedicated full transaction detail renderer.
- `src/lib/components/widgets/transactions/RefundTransactionModal.svelte`
  - Parses metadata on referenced/original transactions inside refund UI.
- `src/lib/cache/TransactionCache.ts`
  - Pre-parses transaction metadata for cached transaction lists.
- `src/lib/cache/NameHistoryCache.ts`
  - Pre-parses metadata for name history transaction lists.

### Surfaces that show parsed metadata

- Transaction list/table views:
  - `src/lib/components/widgets/transactions/AdvancedTransactions.svelte`
  - `src/lib/components/widgets/names/NameTransactions.svelte`
- Transaction detail page:
  - `src/routes/transactions/[id]/+page.svelte`

### Surfaces that compose/send metadata

- Send flow metadata builder:
  - `src/lib/components/widgets/transactions/MetadataMode.svelte`
  - Used by `src/lib/components/widgets/transactions/Send.svelte`
- Quick refund modal sender:
  - `src/lib/components/dialogs/RefundModal.svelte`
- Klog purchase sender:
  - `src/lib/components/dialogs/KlogPurchaseModal.svelte`
- Raw metadata textarea input:
  - `src/lib/components/widgets/transactions/MetaInput.svelte`
  - Used by `src/lib/components/widgets/transactions/ItemPurchase.svelte`

---

## Key Matrix (Current Implementation)

Legend:

- Compose: where Krawlet emits this key
- Parse/Display: where Krawlet interprets or renders it

| Key                | Type          | Meaning                                                                     | Compose                                                                                                  | Parse/Display                                                                                                                 |
| ------------------ | ------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `useruuid`         | string        | Minecraft UUID for player-related tx metadata                               | `MetadataMode.svelte` (player mode), `KlogPurchaseModal.svelte`                                          | `ParsedMetadata.svelte` (player badge/avatar), transaction detail page (`[id]/+page.svelte`)                                  |
| `username`         | string        | Minecraft username for player metadata                                      | `MetadataMode.svelte` (player mode), `KlogPurchaseModal.svelte`                                          | `ParsedMetadata.svelte`, transaction detail page                                                                              |
| `return`           | string        | Return/refund destination address                                           | `MetadataMode.svelte` (player mode)                                                                      | `ParsedMetadata.svelte` (linked address), transaction detail page                                                             |
| `message`          | string        | Informational message                                                       | `MetadataMode.svelte` (message mode), `RefundModal.svelte`, `MetadataMode.svelte` (refund mode optional) | `ParsedMetadata.svelte`, transaction detail page (Message section), `RefundTransactionModal.svelte`                           |
| `msg`              | string        | Alias for message                                                           | Raw/user-provided only                                                                                   | `ParsedMetadata.svelte`, transaction detail page (`message` fallback), `RefundTransactionModal.svelte`                        |
| `error`            | string        | Error message                                                               | Raw/user-provided only                                                                                   | `ParsedMetadata.svelte` (priority over message), transaction detail page (Error section), `RefundTransactionModal.svelte`     |
| `success`          | string        | Success message                                                             | Raw/user-provided only                                                                                   | `ParsedMetadata.svelte` (refund branch), transaction detail page (Success section)                                            |
| `type`             | string        | Metadata subtype marker; currently interpreted as refund when `type=refund` | `MetadataMode.svelte` (refund mode), `RefundModal.svelte`                                                | `ParsedMetadata.svelte` (`isRefund`), transaction detail page (`isRefund`)                                                    |
| `ref`              | string/number | Referenced transaction ID (used by refunds)                                 | `MetadataMode.svelte` (refund mode), `RefundModal.svelte`                                                | `ParsedMetadata.svelte` (refund badge + modal), transaction detail page (refund note + link), `RefundTransactionModal.svelte` |
| `original`         | number        | Original transaction amount for refund percentage                           | `MetadataMode.svelte` (refund mode optional), `RefundModal.svelte`                                       | transaction detail page (refund percentage), `RefundTransactionModal.svelte`                                                  |
| `shop_name`        | string        | Set shop display name                                                       | `MetadataMode.svelte` (actions mode)                                                                     | `ParsedMetadata.svelte` (shop action), transaction detail page (shop section)                                                 |
| `shop_description` | string        | Set shop description                                                        | `MetadataMode.svelte` (actions mode)                                                                     | `ParsedMetadata.svelte` (shop action), transaction detail page (shop section)                                                 |
| `shop_delete`      | flag          | Delete shop metadata for sender                                             | `MetadataMode.svelte` (actions mode)                                                                     | `ParsedMetadata.svelte` (delete-shop badge), transaction detail page (delete warning)                                         |
| `winner`           | string        | Game result label                                                           | External/raw                                                                                             | `ParsedMetadata.svelte` (styled chip). On detail page, appears under "Metadata Table" fallback.                               |
| `loser`            | string        | Game result label                                                           | External/raw                                                                                             | `ParsedMetadata.svelte` (styled chip). On detail page, appears under "Metadata Table" fallback.                               |
| `payout`           | number        | Game payout amount                                                          | External/raw                                                                                             | `ParsedMetadata.svelte` (formatted KRO chip). On detail page, appears under "Metadata Table" fallback.                        |
| `klog`             | flag          | Marker flag for Klog purchases                                              | `KlogPurchaseModal.svelte`                                                                               | No dedicated branch. Treated as generic/value-only metadata (or purchase matching input).                                     |

---

## Value-Only Flags and Unknown Keys

Any value-only token (for example `oak_log_x64`, `@myshop`, `klog`) may be used as purchase-matching metadata.

- Used by ShopSync matching logic in `src/lib/utils/shopsyncMatching.ts`.
- Consumed by compact list rendering in `ParsedMetadata.svelte` when purchase matching is enabled.
- On the transaction detail page, unmatched/unfiltered keys appear in the "Metadata Table" fallback.

Example:

```
useruuid=550e8400-e29b-41d4-a716-446655440000;username=Steve;return=kst_abc123;@myshop;oak_log_x64
```

---

## ParsedMetadata.svelte Display Priority (Compact List Views)

`ParsedMetadata.svelte` uses a single branch chain in this order:

1. Refund branch (`type=refund` and `ref` present)
2. Shop action branch (`shop_name`, `shop_description`, or `shop_delete`)
3. Player data branch (`useruuid` or `username`)
4. Special/game branch (`winner`, `loser`, `payout`)
5. ShopSync related listing branch (value-only meta match)
6. Generic display meta branch (`error` -> `message` -> `msg` -> first value-only)
7. Placeholder: `[No message]`

Important: because this is an if/else chain, only one branch renders per transaction row.

---

## Transaction Detail Page Behavior (`/transactions/[id]`)

The detail page does not use the same single-branch chain as `ParsedMetadata.svelte`.
It renders multiple independent sections when available:

- Refund note/summary
- Shop action section
- Player data section
- Message section
- Error section
- Success section
- Item purchase section (ShopSync listing match)
- Metadata Table fallback for remaining entries
- Raw metadata `<details>` block

This means detail-page output can include several metadata sections at the same time.

---

## Internal Filter Lists

### Detail page "internal" keys

`src/routes/transactions/[id]/+page.svelte` excludes these from "Metadata Table":

```
type, ref, original, shop_name, shop_description, shop_delete,
useruuid, username, return, message, msg, error, success
```

If a ShopSync listing match is found, value-only purchase tokens are also excluded from the table.

### Refund-only internal keys

`ParsedMetadata.svelte` and `RefundTransactionModal.svelte` use:

```
ref, type, original
```

for refund-specific fallback filtering.

---

## Settings That Affect Metadata Rendering

- `showMetadata` / `parseTransactionMessage`
  - Used by legacy/simple `Transactions.svelte` table and display settings page.
- `parsePurchaseItem`
  - Enables/disables ShopSync purchase matching in `ParsedMetadata.svelte`.
- `parsePurchaseItemQuantity`
  - Enables quantity calculation display in `ParsedMetadata.svelte` when listing price is known.

Settings UI: `src/routes/settings/display/+page.svelte`

---

## Canonical Examples

Player metadata:

```
useruuid=550e8400-e29b-41d4-a716-446655440000;username=Steve;return=kst_abc123
```

Message metadata:

```
message=Thanks for shopping!
```

Error metadata:

```
error=Insufficient stock
```

Refund metadata:

```
ref=12345;type=refund;original=50;message=Sorry about that!
```

Shop info update:

```
shop_name=Steve's Emporium;shop_description=Best prices on the server
```

Shop delete:

```
shop_delete
```

Klog purchase metadata (current sender format):

```
<requiredMeta>;useruuid=<uuid>;username=<name>;klog
```

---

## Notes

- `ref` is currently interpreted as a refund reference in current UI logic (`type=refund`).
- Unknown keys are preserved and may surface in generic/fallback displays.
- Raw metadata is always available on transaction detail pages under "View Raw Metadata".
