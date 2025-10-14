declare const __VERSION__: string;

export const VERSION = __VERSION__;

export const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

export type SyncNode = {
    official: boolean;
    name: string;
    url: string;
    internalKey?: string;
}

export const SYNC_NODES: SyncNode[] = [
    {
        official: true,
        name: 'ReconnectedCC Kromer',
        url: 'https://kromer.reconnected.cc/api/krist/',
    },
    {
        official: false,
        name: 'Sad.ovh',
        url: 'https://kromer.sad.ovh/api/krist/',
        internalKey: 'anndemeulemeester',
    },
];

export const SYNC_NODE: SyncNode = SYNC_NODES[1];
