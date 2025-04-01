import type { Document } from "mongoose";

export enum STATUS {
  "SUCCESS" = "success",
  "FAILED" = "failed",
  "STARTED" = "started",
  "REGION_UPDATE" = "region updating",
  "PENDING" = "pending",
}

export interface ContentfulRegionMapping {
  email: string;
  createdBy: string;
  contentModels: any;
  tags: any;
  regions: any;
  project: string;
  spaceId: string;
  status: "pending" | "failed" | "started" | "success" | "region updating";
  error?: string;
  errorDetails?: any[];
  isCountry: string;
}

export interface IContentfulRegionMapping
  extends ContentfulRegionMapping,
    Document {}
