import type { Document } from "mongoose";

export interface TranslationHistory {
  initiatedBy: string;
  spaceId: string;
  project: string;
  cloned: boolean;
  byTags?: boolean;
  content_type: string;
  includedTags?: any[];
  excludedTags?: any[];
  entries?: any[];
  sourceLocale: any;
  targetLocale: any;
  status?: "started" | "enqueued" | "stopped" | "completed" | "error";
  error?: any;
  eta?: number;
  total_entries: number;
  remaining_entries: number;
  total_time_taken?: number;
}

export interface ITranslationHistory extends TranslationHistory, Document {}
