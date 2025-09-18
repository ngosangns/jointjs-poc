import type { Page } from './Page';
import type { DocumentSettings } from './DocumentSettings';

export interface DiagramMetadata {
  createdAt?: number;
  updatedAt?: number;
  author?: string;
}

export interface Diagram {
  id: string;
  title?: string;
  pages: Page[];
  settings?: DocumentSettings;
  metadata?: DiagramMetadata;
}
