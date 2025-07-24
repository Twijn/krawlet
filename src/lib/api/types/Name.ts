export type Name = {
	name: string;
	owner: string;
	original_owner: string;
	registered: Date;
	updated: Date;
	transferred?: Date;
	a?: string;
	unpaid: number;
}

export type NameResponse = {
	ok: boolean;
	name: Name;
}
