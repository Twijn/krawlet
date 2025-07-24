export type VerifiedEntry = {
	address: string;
	description: string;
};

export const verified: Record<string, VerifiedEntry> = {
	serverwelf: {
		address: 'serverwelf',
		description: 'Verified as being the Kromer address for server welfare on reconnected.cc'
	}
};
