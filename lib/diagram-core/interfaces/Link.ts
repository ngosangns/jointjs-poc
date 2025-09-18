import type { Style } from './Style';
import type { Label } from './Label';

export interface LinkEndpoint {
  elementId: string;
  portId?: string;
}

export type LinkRouter = 'orthogonal' | 'manhattan' | 'straight';

export interface Point {
  x: number;
  y: number;
}

export interface Link {
  id: string;
  source: LinkEndpoint;
  target: LinkEndpoint;
  router?: LinkRouter;
  vertices?: Point[];
  labels?: Label[];
  style?: Style;
  layerId?: string;
  locked?: boolean;
}
