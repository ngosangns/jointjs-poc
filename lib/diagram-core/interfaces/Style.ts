export interface Style {
  strokeColor?: string;
  strokeWidth?: number;
  strokeDash?: string | number[];
  fillColor?: string;
  opacity?: number; // 0..1
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: 'normal' | 'italic' | 'oblique' | 'bold' | 'bold italic';
  textColor?: string;
  markerStart?: string;
  markerEnd?: string;
}
