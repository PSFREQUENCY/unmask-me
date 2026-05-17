export interface UserState {
  peacePoints: number;
  telomereTokens: number;
  regulationScore: number; // 0 (Dysregulated) to 100 (Regulated)
  progressionTier: "Seeker" | "Regulated Guide" | "Mindful Master";
}

export interface AbyssalRift {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  radius: number;
  smogLevel: number; // 0 to 100
}

export interface VEILog {
  id: string;
  date: string;
  type: "Relational" | "Self-Reflection";
  text: string;
}
