export interface Coordinates {
  lat: number;
  lng: number;
}

export type PlatformName = 'Zepto' | 'Blinkit' | 'Swiggy Instamart';

export type FeasibilityStatus = 'Highly Feasible' | 'Borderline' | 'Unlikely' | 'Unknown';

export interface DeliveryEstimate {
  platform: PlatformName;
  storeName: string;
  storeAddress: string; // New: Actual address found
  distanceKm: number;
  estimatedTravelTimeMin: number;
  feasibility: FeasibilityStatus;
  color: string;
  source: 'Live Search' | 'Not Found';
  evidenceLink?: string; // New: URL to the source found
}

export interface SimulationResult {
  userLocation: Coordinates | null;
  addressLabel: string;
  estimates: DeliveryEstimate[];
  timestamp: Date;
}

export interface AnalysisResponse {
  summary: string;
  riskFactors: string[];
}