import type { Document, PassportLocalDocument, ObjectId } from "mongoose";

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  market: string[];
  region?: string[];
  markets?: string[];
  locales?: string[];
  modules?: string[];
  // deleted?: boolean;
  provider?: string;
  enabled: boolean;
  defaultPage: string;
  landingPage: string;
  canDelete: boolean;
  organization: string;
  fulfilmentProvider: string;
  translationRole: string;
  lastLoginDate: Date;
  sessionId: ObjectId;
  TCConsent? : boolean;
  TCConsentDate? : Date;
}

export interface IUser extends User, PassportLocalDocument, Document {}
