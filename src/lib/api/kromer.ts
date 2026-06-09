import { SYNC_NODE } from '$lib/consts';
import { KromerApi, type KromerApiOptions } from 'kromer';

type KromerApiInitOptions = Partial<Omit<KromerApiOptions, 'syncNode'>>;

export function getKromerApi(options?: KromerApiInitOptions) {
	return new KromerApi({
		...options,
		syncNode: SYNC_NODE
	});
}

export default getKromerApi();
