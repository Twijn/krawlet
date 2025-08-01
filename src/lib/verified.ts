export type VerifiedEntry = {
	type: 'official' | 'shop';
	address: string;
	imageSrc?: string;
	name: string;
	description: string;
};

export const verified: Record<string, VerifiedEntry> = {
	serverwelf: {
		type: 'official',
		address: 'serverwelf',
		imageSrc: '/images/verified/serverwelf.png',
		name: 'ReconnectedCC',
		description: 'Verified as being the Kromer address for server welfare on reconnected.cc'
	},
	// Shop addresses
	koissi9ji8: {
		type: 'shop',
		address: 'koissi9ji8',
		name: 'Twin Farm',
		description: "Official shop address for Twijn's Farm Store, located in /warp mall"
	},
	k75w1utsbr: {
		type: 'shop',
		address: 'k75w1utsbr',
		name: 'Twin Quarry',
		description: "Official shop address for Twijn's Quarry Store, located in /warp mall"
	},
	kfemstoree: {
		type: 'shop',
		address: 'kfemstoree',
		name: 'Femcorp',
		description: 'Official shop address for Femcorp Store, located in /warp mall'
	},
	ksugarcane: {
		type: 'shop',
		address: 'ksugarcane',
		name: "Sophie's General Store",
		description: "Official shop address for hartbreix's general store, located in /warp mall"
	},
	kromerluvr: {
		type: 'shop',
		address: 'kromerluvr',
		name: "Sophie's Enchant Store",
		description: "Official shop address for hartbreix's enchant store, located in /warp mall"
	},
	krillionss: {
		type: 'shop',
		address: 'krillionss',
		name: "Hellscaped's Store",
		description: "Official shop address for Hellscaped's store, located near /warp spawn"
	},
	ka78ea8qv7: {
		type: 'shop',
		address: 'ka78ea8qv7',
		name: "Emily's Enchant Store",
		description: "Official shop address for Emily's enchant store, located near /warp spawn"
	}
};
