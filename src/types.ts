export interface Question {
  id: string;
  type: 'qcm';
  level: string;
  subject: string;
  chapter: string;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface Chapter {
  level: string;
  subject: string;
  title: string;
}

export interface VehicleCustomize {
  paintColor: string;
  paintFinish: string;
  wheelType: string;
  hasBullbar: boolean;
  hasSpoiler: boolean;
  hasRunningBoard: boolean;
  hasVisor: boolean;
  hasBeacons: boolean;
  hasLightBar: boolean;
  hasXenon: boolean;
  cabinStripe: string | null;
  cabinSticker: string | null;
  trailerColor: string;
  trailerLogo: string | null;
}

export interface User {
  id: string;
  pseudo: string;
  password: string;
  level: string;
  points: number;
  fuel: number;
  vehicleOwned: boolean;
  vehicleType: string;
  vehicleModel: string;
  answeredQuestions: Record<string, number>;
  ownedItems: string[];
  customize: VehicleCustomize;
  completedChapters: string[];
}
