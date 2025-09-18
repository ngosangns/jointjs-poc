import type { Layer } from './Layer';
import type { Shape } from './Shape';
import type { Link } from './Link';
import type { PageSize } from './DocumentSettings';

export interface GridSettings {
  enabled?: boolean;
  spacing?: number;
}

export interface PageBackground {
  color?: string;
  grid?: GridSettings;
}

export interface Page {
  id: string;
  name: string;
  size?: PageSize;
  background?: PageBackground;
  layers?: Layer[];
  elements?: Shape[];
  links?: Link[];
}
