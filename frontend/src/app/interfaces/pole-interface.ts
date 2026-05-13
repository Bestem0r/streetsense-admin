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
  roadCategory?: string;
  roadNumber?: number;
  distanceFromRoad?: number;
  fieldOfView?: number;
  satellitesUsed?: number;
  images?: {
    imageId: string;
    capturedDate: number;
    inspectionDate?: number;
    inspectionStatus?: string;
    action?: string;
    dueDate?: number;
    notes?: string;
  }[];
  assignedInspector?: string;
  lastModified?: number;
}
