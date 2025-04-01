import type { BlobService } from "azure-storage";

export interface IBlobPushOpts {
    filename: string;
    blobService: BlobService;
    container: string;
    data?: any;
}
