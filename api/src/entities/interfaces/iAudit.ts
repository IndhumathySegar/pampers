export interface IAudit {
    email: string;
    module: string;
    seen: boolean;
    action: string;
    data: any;
    user : any;
    submodule : string;
    _id: any;
    status : string;
    errorDetails : string;
    actionDetails : string;
    reqPayload : any;
}
