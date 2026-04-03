export type QuestionType = 'qcm' | 'vf' | 'calc' | 'situ';

export interface Question {
  id: string;
  type: QuestionType;
  level: string;
  subject: string;
  chapter: string;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
  context?: string;
}

export interface Chapter {
  level: string;
  subject: string;
  title: string;
}

export interface User {
  id: string;
  pseudo: string;
  password?: string;
  level: string;
  points: number;
  fuel: number;
  vehicleOwned: boolean;
  vehicleType: 'none' | 'car' | 'truck' | 'articulated';
  vehicleModel: string;
  answeredQuestions: Record<string, number>;
  ownedItems: string[];
  customize: VehicleCustomize;
  completedChapters: string[];
  vehicleImageUrl?: string;
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
  hasTuningBumper: boolean;
  hasNeonKit: boolean;
  hasWideBodyKit: boolean;
  hasHood: boolean;
  hasExhaust: boolean;
  cabinStripe: string | null;
  cabinSticker: string | null;
  trailerColor: string;
  trailerLogo: string | null;
}
