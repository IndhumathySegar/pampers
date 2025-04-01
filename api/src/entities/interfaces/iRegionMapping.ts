import type { Document } from "mongoose";

export interface RegionMapping {
    region: string;
    markets: [];
}

export interface IRegionMapping extends RegionMapping, Document {}
