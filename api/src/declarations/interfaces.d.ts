interface ContentfulRequestHeaders {
  authorization?: string;
  "content-type"?: string;
}

interface ContentFulProjectPayload {
  name: string;
  data: any;
  method: string;
  auth: boolean;
  sendJSON?: boolean;
  spaceId?: string;
}

interface LogPayload {
  action: string;
  data: {
    reason: string;
    type: string;
    user: string;
  };
  type: string;
  userId: string;
  programcode?: string;
  application?: string;
}

interface LogFilter {
  action: any;
  "data.type": string;
  "data.user"?: string;
  _id?: any;
}

interface ExportFilter {
  role?: string;
  userId?: string;
}

interface HttpHeaders {
  [prop: string]: string;
}

interface JanrainConfig {
  client_id: string;
  flow: string;
  flow_version: string;
  language?: string;
  locale: string;
  redirect_uri: string;
}

interface JanrainCustomConfig {
  apiUri: string;
  clientId: string;
  clientSecret: string;
}

interface PaperStatuses {
  classification: string;
  threshold: number;
  status: string;
}
