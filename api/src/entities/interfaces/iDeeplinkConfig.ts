import type { Document } from "mongoose";

export interface DeeplinkConfig {
    type: string;
    deeplinks: {
        DE: object[];
        US: object[];
        CA: object[];
        JP: object[];
        BR: object[];
        ES: object[];
        FR: object[];
        UK: object[];
    };
}

export interface IDeeplinkConfig extends DeeplinkConfig, Document { }
