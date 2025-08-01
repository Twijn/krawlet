export type VerifiedEntry = {
	address: string;
	imageSrc?: string;
	name: string;
	description: string;
};

export const verified: Record<string, VerifiedEntry> = {
	serverwelf: {
		address: 'serverwelf',
		imageSrc: '/images/verified/serverwelf.png',
		name: 'ReconnectedCC',
		description: 'Verified as being the Kromer address for server welfare on reconnected.cc'
	}
};
