export enum ExtractionMode {
  AUTO = 'AUTO', // Tries to find everything within the selector
  LINKS = 'LINKS', // Only <a> tags
  IMAGES = 'IMAGES', // Only <img> tags
  TEXT = 'TEXT', // Only text content
}

export interface ExtractedItem {
  id: number;
  name?: string; // Text content or Alt text
  href?: string; // Link URL
  src?: string; // Image Source
}

export interface ExtractionResult {
  items: ExtractedItem[];
  totalFound: number;
  requested: number;
  message?: string;
}

export interface ParseConfig {
  html: string;
  selector: string;
  mode: ExtractionMode;
  limit: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  config: ParseConfig;
  lastResult: ExtractionResult | null;
}

export interface DetectedClass {
  className: string;
  count: number;
  type: 'img' | 'parent'; // Is this class on the img tag or the wrapper div?
  example?: string;
}