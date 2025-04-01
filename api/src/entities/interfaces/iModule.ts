import type { Document } from "mongoose";

export interface Module {
    name: string;
    uniqueResourceName: string;
    default_landing_page: string;
}

export interface IModule extends Module, Document {}
