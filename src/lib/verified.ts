export type VerifiedEntry = {
	type: 'official' | 'shop' | 'gamble' | 'service';
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
	krb1yie41o: {
		type: 'official',
		address: 'krb1yie41o',
		name: 'Soak',
		description: 'Verified as being the official address for Soak, see \\soak for more information'
	},
	// Shop addresses
	ktwinfarm4: {
		type: 'shop',
		address: 'ktwinfarm4',
		name: 'Twin Farm',
		description: "Official shop address for Twijn's Farm Store, located in /warp mall"
	},
	kquarryree: {
		type: 'shop',
		address: 'kquarryree',
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
	},
	k2god41s23: {
		type: 'shop',
		address: 'k2god41s23',
		name: 'SolidityPools',
		description: 'Official shop address for Solidity Pools, located north of /warp spawn'
	},
	// Gambling addresses
	kromerball: {
		type: 'gamble',
		address: 'kromerball',
		name: 'Kromer Ball',
		description: 'Official address for Kromer Ball, see \\kb for more information'
	},
	kromerflp0: {
		type: 'gamble',
		address: 'kromerflp0',
		name: 'Kromer Flip',
		description: 'Official address for Kromer Flip, see \\kf for more information'
	}
};
