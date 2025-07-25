import type { MotdResponse } from '$lib/api/types/Motd';
import type {
	Transaction,
	TransactionLookup,
	TransactionQuery,
	TransactionsResponse
} from '$lib/api/types/Transaction';
import type {
	Address,
	AddressNamesQuery,
	AddressNamesResponse,
	AddressQuery,
	AddressResponse,
	AddressTransactionQuery
} from '$lib/api/types/Address';
import type { LoginResponse } from '$lib/api/types/Login';
import type { Name, NameResponse } from '$lib/api/types/Name';
import type { MakeTransactionBody, MakeTransactionResponse } from '$lib/api/types/MakeTransaction';
import type { APIResponse } from '$lib/api/types/APIResponse';
import type { APIError } from '$lib/api/types/APIError';

export interface KromerApiOptions {
	syncNode: string;
}

export class KromerApi {
	public options: KromerApiOptions = {
		syncNode: 'https://kromer.reconnected.cc/api/krist/'
	};

	constructor(options: Partial<KromerApiOptions> = {}) {
		this.options = {
			...this.options,
			...options
		};

		if (!this.options.syncNode.endsWith('/')) {
			this.options.syncNode += '/';
		}
	}

	private async get(uri: string, query: unknown = null): Promise<unknown> {
		if (query) {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(query)) {
				if (value !== null && value !== undefined) {
					params.append(key, String(value));
				}
			}
			uri += '?' + params.toString();
		}

		const response = await fetch(this.options.syncNode + uri);
		const data: unknown = await response.json();

		if (!response.ok || !(data as APIResponse).ok) {
			if (!(data as APIResponse).ok) {
				throw data as APIError;
			} else {
				throw {
					ok: false,
					error: "api_error",
					message: "Unknown API error",
				} as APIError;
			}
		}

		return data;
	}

	private async post(uri: string, body: unknown): Promise<unknown> {
		return await fetch(this.options.syncNode + uri, {
			method: 'POST',
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json'
			}
		}).then((res) => res.json());
	}

	public async login(privatekey: string): Promise<LoginResponse> {
		return (await this.post('login', { privatekey })) as LoginResponse;
	}

	public async motd(): Promise<MotdResponse> {
		const motd: MotdResponse = (await this.get('motd')) as MotdResponse;
		motd.motd_set = new Date(motd.motd_set);
		return motd;
	}

	public async resolve(addrOrName: string): Promise<Address> {
		addrOrName = addrOrName.toLowerCase();
		//TODO: Make these go off of motd values
		if (addrOrName.length === 10 &&
			(addrOrName.startsWith('k') || addrOrName === 'serverwelf')) {
			return await this.address({
				address: addrOrName,
			});
		} else if (addrOrName.length > 4 && addrOrName.endsWith('.kro')) {
			const name = await this.name(addrOrName);
			return await this.address({
				address: name.owner
			});
		} else {
			throw {
				ok: false,
				error: "invalid_format",
				message: "Must be either an address (ks0d5iqb6p) or a name (reconnected.kro)"
			} as APIError;
		}
	}

	public async address(query: AddressQuery): Promise<Address> {
		const response: AddressResponse = (await this.get(
			`addresses/${query.address}`,
			query
		)) as AddressResponse;
		if (response.address?.firstseen) {
			response.address.firstseen = new Date(response.address.firstseen);
		}
		return response.address;
	}

	public async addressNames(query: AddressNamesQuery): Promise<AddressNamesResponse> {
		const response: AddressNamesResponse = (await this.get(
			`addresses/${query.address}/names`,
			query
		)) as AddressNamesResponse;
		response.names = response.names.map((x) => {
			return {
				...x,
				registered: new Date(x.registered),
				updated: new Date(x.updated),
				transferred: x.transferred ? new Date(x.transferred) : undefined
			};
		});
		return response;
	}

	public async addressTransactions(query: AddressTransactionQuery): Promise<TransactionsResponse> {
		const response = (await this.get(
			`addresses/${query.address}/transactions`,
			query
		)) as TransactionsResponse;
		return this.wrapTransactionResponse(response);
	}

	public async name(name: string): Promise<Name> {
		name = name.toLowerCase().replace(".kro", "");
		const response: NameResponse = (await this.get(`names/${name}`)) as NameResponse;
		return response.name;
	}

	private wrapTransactionResponse(response: TransactionsResponse): TransactionsResponse {
		response.transactions.forEach((t) => {
			t.time = new Date(t.time);
		});
		return response;
	}

	public async allTransactions(
		query: TransactionQuery | null = null
	): Promise<TransactionsResponse> {
		const response: TransactionsResponse = (await this.get(
			`transactions${query?.latest ? '/latest' : ''}`,
			query
		)) as TransactionsResponse;
		return this.wrapTransactionResponse(response);
	}

	public async send(body: MakeTransactionBody): Promise<Transaction> {
		const response: MakeTransactionResponse = (await this.post(
			'transactions',
			body
		)) as MakeTransactionResponse;
		return response.transaction ?? null;
	}
}
