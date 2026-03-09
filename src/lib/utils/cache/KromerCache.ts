import type { KromerApi } from "kromer";


export class KromerCache {
    protected api: KromerApi;

    constructor(api: KromerApi) {
        this.api = api;
    }
}