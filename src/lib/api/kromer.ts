import { SYNC_NODE } from '$lib/consts';
import { KromerApi } from 'kromer';

export default new KromerApi({
	syncNode: SYNC_NODE.url
});
