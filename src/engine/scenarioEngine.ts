import type {
  Classification,
  ResponseDecision,
  ScenarioConfig,
  SimulatedTarget,
} from "../types/simulation";

export function createScenario(config: ScenarioConfig) {
  const now = Date.now();
  const count = Math.max(1, Math.min(12, config.targetCount));
  const spread = config.difficulty === "Easy" ? 13 : config.difficulty === "Standard" ? 18 : 23;
  const targets: SimulatedTarget[] = Array.from({ length: count }, (_, index) => {
    const roll = Math.random();
    const truth: Classification = roll < 0.58 ? "Drone" : roll < 0.82 ? "Unknown object" : "False alarm";
    return {
      id: `OBJ-${String(index + 1).padStart(2, "0")}-${Math.floor(Math.random() * 90 + 10)}`,
      x: (Math.random() - 0.5) * spread,
      y: 2.5 + Math.random() * (config.difficulty === "Advanced" ? 6 : 4),
      z: (Math.random() - 0.5) * spread,
      speed: config.difficulty === "Easy" ? 0.35 + Math.random() * 0.25 : config.difficulty === "Standard" ? 0.55 + Math.random() * 0.45 : 0.8 + Math.random() * 0.65,
      truth,
      appearedAt: now,
    };
  });
  const scenarioName = `${config.environment} ${config.lighting.toLowerCase()} · ${config.difficulty}`;
  return { id: crypto.randomUUID(), scenarioName, config, targets, startedAt: now };
}

export function expectedDecision(classification: Classification): ResponseDecision {
  switch (classification) {
    case "Drone": return "Notify instructor";
    case "Unknown object": return "Request verification";
    case "False alarm": return "Log false alarm";
  }
}

export function calculateAssessment(
  targets: SimulatedTarget[],
  classifications: Record<string, Classification>,
  decisions: Record<string, ResponseDecision>,
  firstDetectedAt: Record<string, number>,
  startedAt: number,
  endedAt: number,
) {
  const total = targets.length;
  const correctClassifications = targets.filter((t) => classifications[t.id] === t.truth).length;
  const correctDecisions = targets.filter((t) => decisions[t.id] === expectedDecision(t.truth)).length;
  const detected = targets.filter((t) => firstDetectedAt[t.id] !== undefined);
  const averageDetectionSeconds = detected.length
    ? detected.reduce((sum, target) => sum + (firstDetectedAt[target.id] - startedAt) / 1000, 0) / detected.length
    : null;
  const accuracy = total ? Math.round((correctClassifications / total) * 100) : 0;
  const decisionAccuracy = total ? Math.round((correctDecisions / total) * 100) : 0;
  // Transparent demonstration rubric: classification 60%, response choice 40%.
  const score = Math.round(accuracy * 0.6 + decisionAccuracy * 0.4);
  return {
    score,
    accuracy,
    decisionAccuracy,
    averageDetectionSeconds: averageDetectionSeconds === null ? null : Math.round(averageDetectionSeconds * 10) / 10,
    durationSeconds: Math.max(1, Math.round((endedAt - startedAt) / 1000)),
    detectedTargets: detected.length,
    correctClassifications,
    correctDecisions,
  };
}
