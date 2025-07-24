export type AddressQuery = {
	address: string;
	fetchNames?: boolean;
};

export type Address = {
	address: string;
	balance: number;
	totalin: number;
	totalout: number;
};

export type AddressResponse = {
	address: Address;
};
