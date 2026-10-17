export type Environment = "Rural" | "Urban";
export type Lighting = "Day" | "Night";
export type Visibility = "Clear" | "Haze" | "Low visibility";
export type Difficulty = "Easy" | "Standard" | "Advanced";
export type Classification = "Drone" | "Unknown object" | "False alarm";
export type ResponseDecision = "Notify instructor" | "Request verification" | "Log false alarm";

export interface ScenarioConfig {
  environment: Environment;
  lighting: Lighting;
  visibility: Visibility;
  difficulty: Difficulty;
  targetCount: number;
}

export interface SimulatedTarget {
  id: string;
  x: number;
  y: number;
  z: number;
  speed: number;
  truth: Classification;
  appearedAt: number;
}

export interface TrainingSession {
  id: string;
  date: string;
  scenarioName: string;
  environment: Environment;
  lighting: Lighting;
  visibility: Visibility;
  difficulty: Difficulty;
  score: number;
  accuracy: number;
  decisionAccuracy: number;
  averageDetectionSeconds: number | null;
  durationSeconds: number;
  totalTargets: number;
  detectedTargets: number;
}
