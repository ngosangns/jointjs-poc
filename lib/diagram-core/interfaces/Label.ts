import type { Style } from './Style';

export interface LabelPosition {
  distance?: number; // 0..1 relative along link
  offset?: number; // px offset from path
}

export interface Label {
  id: string;
  text: string;
  position?: LabelPosition;
  style?: Style;
}
