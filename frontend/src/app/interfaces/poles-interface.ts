export interface PolesInterface {
  id?: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  poleId: string;
  speed?: number;
  hdop?: number;
  altitude?: number;
  fixType?: number;
  courseOverGround?: number;
  capturedDate?: string;
  images?: { imageId: string; capturedDate: string }[];
}
