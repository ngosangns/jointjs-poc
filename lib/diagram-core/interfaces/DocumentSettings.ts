import type { Style } from './Style';

export type PageSize = 'A4' | 'Letter' | { width: number; height: number; units?: string };

export interface DocumentSettings {
  gridEnabled?: boolean;
  gridSpacing?: number;
  defaultStyle?: Style;
  pageSize?: PageSize;
  backgroundColor?: string;
}
