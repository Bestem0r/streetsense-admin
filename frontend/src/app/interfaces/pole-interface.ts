export interface PoleInterface {
  id: string;
  altitude?: number;
  speed?: number;
  fixType?: number;
  courseOverGround?: number;
  hdop?: number;
  capturedDate?: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  county?: string;
  municipality?: string;
  images?: { imageId: string; capturedDate: number }[];
}
