export enum GameState {
  IDLE,
  DRAGGING,
  THROWN,
  LANDED,
  MISSED
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Wind {
  speed: number; // Positive is right, negative is left
  label: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type ImageSize = '1K' | '2K' | '4K';

export interface GeneratedBackground {
  dataUrl: string;
  prompt: string;
}