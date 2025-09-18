import type { Style } from './Style';
import type { Port } from './Port';

export type ShapeType = string; // enum/category can be refined later

export interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // 0..360
}

export interface TextStyle {
  value?: string;
  font?: string;
  size?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export interface Shape {
  id: string;
  type: ShapeType;
  geometry: Geometry;
  style?: Style;
  text?: TextStyle;
  ports?: Port[];
  layerId?: string;
  locked?: boolean;
}
