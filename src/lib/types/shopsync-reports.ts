/**
 * Types for ShopSync Reports API
 */

// ============================================================================
// Common Types
// ============================================================================

export interface ShopChangeField {
	field: string;
	previousValue: unknown;
	newValue: unknown;
}

export interface ShopSyncReportError {
	ok: false;
	error: string;
	message?: string;
}

// ============================================================================
// Stats Types
// ============================================================================

export interface ReporterStats {
	validationFailures: number;
	successfulPosts: number;
	shopChanges: number;
	itemChanges: number;
	oldestRecord: string | null;
	newestRecord: string | null;
	persistent: {
		shopChanges: number;
		itemChanges: number;
		priceChanges: number;
		total: number;
	};
}

export interface StatsResponse {
	ok: boolean;
	data: ReporterStats;
}

// ============================================================================
// Validation Failures Types
// ============================================================================

export interface ValidationFailureRecord {
	id: string;
	timestamp: string;
	rawData: unknown;
	errors: string[];
	shopName?: string;
	computerId?: number;
}

export interface ValidationFailuresResponse {
	ok: boolean;
	count: number;
	data: ValidationFailureRecord[];
}

// ============================================================================
// Successful Posts Types
// ============================================================================

export interface SuccessfulPostRecord {
	id: string;
	timestamp: string;
	shopId: string;
	shopName: string;
	rawData: unknown;
	itemCount: number;
}

export interface SuccessfulPostsResponse {
	ok: boolean;
	count: number;
	data: SuccessfulPostRecord[];
}

// ============================================================================
// Shop Changes Types
// ============================================================================

export interface ShopChangeRecord {
	id: string;
	timestamp: string;
	shopId: string;
	shopName: string;
	changes: ShopChangeField[];
	isNewShop: boolean;
}

export interface ShopChangeLog {
	id: number;
	shopId: string;
	shopName: string;
	field: string;
	previousValue: string | null;
	newValue: string | null;
	isNewShop: boolean;
	createdAt: string;
}

export interface ShopChangesResponse {
	ok: boolean;
	recent: ShopChangeRecord[];
	recentCount: number;
	history: ShopChangeLog[];
	historyCount: number;
}

// ============================================================================
// Item Changes Types
// ============================================================================

export interface ItemSummary {
	name: string;
	displayName: string;
	hash: string;
}

export interface ItemUpdateSummary extends ItemSummary {
	changes: ShopChangeField[];
}

export interface ItemChangeRecord {
	id: string;
	timestamp: string;
	shopId: string;
	shopName: string;
	added: ItemSummary[];
	removed: ItemSummary[];
	updated: ItemUpdateSummary[];
}

export interface ItemChangeLog {
	id: number;
	shopId: string;
	shopName: string;
	changeType: 'added' | 'removed';
	itemName: string;
	itemDisplayName: string;
	itemHash: string;
	createdAt: string;
}

export interface ItemChangesResponse {
	ok: boolean;
	recent: ItemChangeRecord[];
	recentCount: number;
	history: ItemChangeLog[];
	historyCount: number;
}

// ============================================================================
// Price Changes Types
// ============================================================================

export interface PriceChangeLog {
	id: number;
	shopId: string;
	shopName: string;
	itemName: string;
	itemDisplayName: string;
	itemHash: string;
	field: string;
	previousValue: string | null;
	newValue: string | null;
	createdAt: string;
}

export interface PriceChangesResponse {
	ok: boolean;
	count: number;
	data: PriceChangeLog[];
}

// ============================================================================
// Query Parameter Types
// ============================================================================

export interface BaseQueryParams {
	limit?: number;
	offset?: number;
}

export interface ShopChangesParams extends BaseQueryParams {
	shopId?: string;
	since?: string;
	until?: string;
	source?: 'memory' | 'persistent' | 'both';
}

export interface ItemChangesParams extends BaseQueryParams {
	shopId?: string;
	changeType?: 'added' | 'removed';
	since?: string;
	until?: string;
	source?: 'memory' | 'persistent' | 'both';
}

export interface PriceChangesParams extends BaseQueryParams {
	shopId?: string;
	itemHash?: string;
	since?: string;
	until?: string;
}

// Legacy aliases for backwards compatibility
export type ItemChange = ShopChangeField;
export type ChangedItem = ItemSummary;
export type ItemChangeEvent = ItemChangeRecord;
