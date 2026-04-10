import type { Transaction } from 'kromer';
import type { Listing, ListingPrice, Shop } from '$lib/types/shops';

export type RelatedShopSyncListing = {
	listing: Listing;
	shop: Shop;
	price: ListingPrice;
};

export function getTransactionDestinationAliases(tx: Transaction): string[] {
	const aliases: string[] = [];

	const addAlias = (alias: string | null | undefined) => {
		if (!alias) return;
		const lowered = alias.toLowerCase();
		if (!aliases.includes(lowered)) {
			aliases.push(lowered);
		}
	};

	addAlias(tx.to);

	if (tx.sent_name) {
		const sentName = tx.sent_name.toLowerCase();
		addAlias(sentName);
		addAlias(`${sentName}.kro`);

		if (tx.sent_metaname) {
			const sentMetaName = tx.sent_metaname.toLowerCase();
			addAlias(`${sentMetaName}@${sentName}`);
			addAlias(`${sentMetaName}@${sentName}.kro`);
		}
	}

	return aliases;
}

export function getListingAddresses(listing: Listing): string[] {
	const addresses: string[] = [];

	const addAddress = (value: string | null | undefined) => {
		if (!value) return;
		const lowered = value.toLowerCase();
		if (!addresses.includes(lowered)) {
			addresses.push(lowered);
		}
	};

	(listing.addresses ?? []).forEach((address) => {
		addAddress(address);
	});

	(listing.prices ?? []).forEach((price) => {
		addAddress(price.address);
	});

	return addresses;
}

export function addressesMatchTransaction(tx: Transaction, addresses: string[]): boolean {
	if (addresses.length === 0) return false;
	const txDestinations = getTransactionDestinationAliases(tx);
	return addresses.some((address) => txDestinations.includes(address.toLowerCase()));
}

export function findBestRelatedShopSyncListing(
	tx: Transaction,
	shops: Shop[],
	valueOnlyMeta: string[]
): RelatedShopSyncListing | null {
	const metadataAddressHints = valueOnlyMeta.filter((entry) => entry.includes('@'));
	const txDestinations = getTransactionDestinationAliases(tx);

	const candidates = shops.reduce(
		(acc, shop) => {
			if (!shop.items?.length) return acc;

			shop.items.forEach((listing) => {
				const listingAddresses = getListingAddresses(listing);
				const matchesListingAddress = addressesMatchTransaction(tx, listingAddresses);
				const matchesListingAddressHint = listingAddresses.some((address) =>
					metadataAddressHints.includes(address)
				);
				const matchesShopAddress = addressesMatchTransaction(tx, shop.addresses ?? []);

				if (!matchesListingAddress && !matchesListingAddressHint && !matchesShopAddress) return;

				const matchingPrice = listing.prices?.find((price) => {
					if (price.currency.toLowerCase() !== 'kro') return false;

					const priceAddress = price.address?.toLowerCase();
					if (
						priceAddress &&
						!txDestinations.includes(priceAddress) &&
						!metadataAddressHints.includes(priceAddress)
					) {
						return false;
					}

					const requiredMeta = price.requiredMeta?.toLowerCase();
					if (!requiredMeta) return true;
					return valueOnlyMeta.includes(requiredMeta);
				});

				if (!matchingPrice) return;

				acc.push({
					listing,
					shop,
					price: matchingPrice,
					score:
						(matchesListingAddress ? 2 : 0) +
						(matchesListingAddressHint ? 2 : 0) +
						(matchesShopAddress ? 1 : 0)
				});
			});

			return acc;
		},
		[] as Array<{ listing: Listing; shop: Shop; price: ListingPrice; score: number }>
	);

	if (candidates.length === 0) return null;

	candidates.sort((a, b) => b.score - a.score);
	const topScore = candidates[0].score;
	const topCandidates = candidates.filter((candidate) => candidate.score === topScore);

	if (topCandidates.length > 1) {
		console.warn('Ambiguous listings found for transaction metadata:', tx, topCandidates);
		return null;
	}

	const [winner] = topCandidates;
	return winner ? { listing: winner.listing, shop: winner.shop, price: winner.price } : null;
}
