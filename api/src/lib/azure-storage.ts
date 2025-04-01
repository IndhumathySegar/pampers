import { Writable } from "stream";
import { IBlobPushOpts } from "../interfaces/iLib.azure-storage";

class AzureStorage {
    /**
     * Push Text to Azure Blob Storage
     * @param {IBlobPushOpts} opts Options
     * @return {Promise<void>}
     */
    pushTextToBlob(opts: IBlobPushOpts): Promise<void> {
        return new Promise((resolve, reject) => {
            opts.blobService.createBlockBlobFromText(opts.container, opts.filename, opts.data, (err: any): void => {
                if (err) {
                    return reject(err);
                }

                return resolve();
            });
        });
    }

    /**
     * Writable Blob Stream
     * @param {IBlobPushOpts} opts Blob Options
     * @returns {Writable} Writable Blob Stream
     */
    codegenActivationWritable(opts: IBlobPushOpts): Writable {
        return opts.blobService.createWriteStreamToBlockBlob(opts.container, opts.filename);
    }

    /**
     * Appendable Blob Stream
     * @param {IBlobPushOpts} opts Blob Options
     * @param {number} codeIdCount Code ID counter
     * @returns {Writable} Writable Blob Stream
     */
    codegenActivationAppendable(opts: IBlobPushOpts, codeIdCount: number): Writable {
        if (codeIdCount === 0){
            return opts.blobService.createWriteStreamToNewAppendBlob(
                opts.container,
                opts.filename,
                { contentSettings: {
                        contentType: "application/octet-stream"
                    }},
                async (err, res) => {
                    if (err) {
                        return console.log("Error: " + err);
                    }
                    console.log("Append create successful");
                });
        }
        else {
            return opts.blobService.createWriteStreamToExistingAppendBlob(
              opts.container,
              opts.filename,
              { contentSettings: {
                    contentType: "application/octet-stream"
                }},
              async (err, res) => {
                if (err) {
                    return console.log("Error: " + err);
                }
                console.log("Append existing successful");
            });
        }
    }
}

export default new AzureStorage();
