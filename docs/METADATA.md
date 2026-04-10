# Transaction Metadata Reference

Kromer transaction metadata is a semicolon-delimited string of `key=value` pairs.
Entries without a `=` sign are **value-only / flag entries** (the full token is treated as the key with no value).

**Format:**

```
key1=value1;key2=value2;flag_key
```

Parsing is handled by `kromer.transactions.parseMetadata()`. All key lookups are case-insensitive.

---

## Player Data Keys

Populated by rcc-kromer.

| Key        | Type     | Description                                                                                                                                         |
| ---------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useruuid` | `string` | Minecraft player UUID. Extracted into `minecraftPlayer.uuid` by the parser and removed from the `entries` array. Renders a player avatar in the UI. |
| `username` | `string` | Minecraft player display name. Extracted into `minecraftPlayer.name` and removed from `entries`.                                                    |
| `return`   | `string` | Kromer address to send change/refunds back to the player. Displayed as a linked address.                                                            |

**Example:**

```
useruuid=550e8400-e29b-41d4-a716-446655440000;username=Steve;return=kst_abc123
```

---

## Message Keys

| Key       | Type     | Description                                                                                                     |
| --------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `message` | `string` | Generic informational message. Displayed in transaction list rows and detail views.                             |
| `msg`     | `string` | Alias for `message`. Parsed identically; `message` takes precedence when both are present.                      |
| `error`   | `string` | Error message. Displayed with red styling. Takes precedence over `message`/`msg` in the display priority chain. |
| `success` | `string` | Success confirmation message. Displayed after a refund badge in the transaction detail view.                    |

Display priority order: `error` → `message` → `msg` → first value-only entry.

---

## Refund Keys

Set automatically by Krawlet when issuing a refund via **Refund Modal** or the **Metadata Builder** (refund mode).

| Key        | Type     | Description                                                                                                    |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `type`     | `string` | Set to `refund` to mark this transaction as a refund. Triggers the refund badge and referenced-transaction UI. |
| `ref`      | `string` | ID of the original transaction being refunded. Used to fetch and link the source transaction.                  |
| `original` | `number` | KRO value of the original transaction. Used to compute the refund percentage displayed in the UI.              |

**Example (full refund with message):**

```
ref=12345;type=refund;original=50;message=Sorry about that!
```

> **Note:** `ref` is currently only parsed in the context of `type=refund`. See [Proposed Additions](#proposed-additions) below for plans to extend its use.

---

## Shop Action Keys

Sent to the ShopSync server address (`kkrawletii` or equivalent) to register or remove shop metadata. Only meaningful when the recipient is the sync server.

| Key                | Type     | Description                                                                                                                                                  |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `shop_name`        | `string` | Sets the human-readable shop name for the sender address.                                                                                                    |
| `shop_description` | `string` | Sets the shop description text shown in the shop catalog.                                                                                                    |
| `shop_delete`      | flag     | **Value-only entry** (no `=value`). Presence marks the transaction as a "delete shop info" action, removing all stored shop metadata for the sender address. |

**Examples:**

```
shop_name=Steve's Emporium;shop_description=Best prices on the server
```

```
shop_delete
```

---

## Special / Game Keys

Recognised by Krawlet for display purposes only; not constructed by the app.

| Key      | Type     | Description                                                               |
| -------- | -------- | ------------------------------------------------------------------------- |
| `winner` | `string` | Displayed with a styled badge. Used by game/lottery scripts.              |
| `loser`  | `string` | Displayed with a styled badge.                                            |
| `payout` | `number` | Parsed as a numeric KRO amount and formatted with the currency formatter. |

---

## ShopSync Purchase Matching

Value-only (flag) entries that don't match any of the keys above are treated as **item identifiers** for ShopSync purchase matching. They are compared against a listing's `requiredMeta` field to associate a transaction with a specific shop listing.

- Entries containing `@` are treated as address hints (e.g. `item@shop.kro`).
- Matching logic lives in `src/lib/utils/shopsyncMatching.ts`.

**Example raw metadata from a ShopSync purchase:**

```
useruuid=550e8400-e29b-41d4-a716-446655440000;username=Steve;return=kst_abc123;@myshop;oak_log_x64
```

---

## Internal Meta Filter

The following keys are considered "internal" and are stripped before rendering the **Other Metadata** fallback section, to avoid double-displaying them:

```
type, ref, original, shop_name, shop_description, shop_delete,
useruuid, username, return, message, msg, error, success
```

The narrower `REFUND_INTERNAL_META` list (`ref`, `type`, `original`) is used inside the refund detail block specifically.

---

## Proposed Additions

### `ref=` — General Transaction Reference

Currently `ref` is only interpreted when `type=refund` is also present. It would be useful to treat `ref` as a **general-purpose transaction reference** in other contexts too:

| Proposed use                                                                              | Metadata example                                    | Notes                                                                   |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| **Order confirmation** — link a "payment received" transaction back to a quote/invoice tx | `ref=99887;message=Order confirmed`                 | The referenced tx would be shown as "In response to transaction #99887" |
| **Chained payments** — multi-leg purchases that each reference a root order tx            | `ref=99887;type=payment;message=Installment 2 of 3` | Would need a new `type` value to distinguish from refunds               |
| **Payout reference** — lottery/game payouts that reference the original bet tx            | `ref=99887;type=payout;payout=500`                  | Combines with the existing `payout` special key                         |

**Suggested implementation:** extract `ref` display into a reusable "Referenced Transaction" component independent of `type=refund`, and render it whenever `ref` is present — with the badge text determined by `type` (defaults to a neutral "references" label when `type` is absent or unrecognised).

---

### `type=` — Extended Transaction Types

Extending the `type` key beyond just `refund`:

| Value      | Proposed meaning                                                                        |
| ---------- | --------------------------------------------------------------------------------------- |
| `refund`   | Existing — marks a refund payment                                                       |
| `payment`  | Explicit purchase/payment marker (distinguishes from gifts/transfers)                   |
| `payout`   | Game/lottery payout (pairs with `payout=` amount key and optional `ref=` to the bet tx) |
| `tip`      | Discretionary tip with no expected return                                               |
| `donation` | Directed donation to a service/address                                                  |
