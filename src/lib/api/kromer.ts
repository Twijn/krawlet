import { getSyncNode } from '$lib/consts';
import { KromerApi } from 'kromer';

console.log('Using sync node ' + getSyncNode().name);

export default new KromerApi({
	syncNode: getSyncNode().url
});
