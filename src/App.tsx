import { useMemo, useState } from "react";
import Scene3D from "./components/Scene3D";
import { calculateAssessment, createScenario, expectedDecision } from "./engine/scenarioEngine";
import type {
  Classification,
  Difficulty,
  Environment,
  Lighting,
  ResponseDecision,
  ScenarioConfig,
  SimulatedTarget,
  TrainingSession,
  Visibility,
} from "./types/simulation";
import "./index.css";

const DEFAULT_CONFIG: ScenarioConfig = {
  environment: "Rural",
  lighting: "Day",
  visibility: "Clear",
  difficulty: "Standard",
  targetCount: 6,
};
const CLASSIFICATIONS: Classification[] = ["Drone", "Unknown object", "False alarm"];
const DECISIONS: ResponseDecision[] = ["Notify instructor", "Request verification", "Log false alarm"];
const HISTORY_KEY = "dts-training-history-v2";

function readHistory(): TrainingSession[] {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(value) ? value as TrainingSession[] : [];
  } catch {
    return [];
  }
}

function downloadCsv(rows: TrainingSession[]) {
  const headers = ["Date", "Scenario", "Environment", "Lighting", "Visibility", "Difficulty", "Score", "Classification accuracy", "Decision accuracy", "Average detection seconds", "Duration seconds", "Detected", "Total objects"];
  const lines = rows.map((r) => [r.date, r.scenarioName, r.environment, r.lighting, r.visibility, r.difficulty, r.score, r.accuracy, r.decisionAccuracy, r.averageDetectionSeconds ?? "N/A", r.durationSeconds, r.detectedTargets, r.totalTargets]);
  const csv = [headers, ...lines].map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "dronesim-after-action-review.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value, detail, accent = false }: { label: string; value: string; detail: string; accent?: boolean }) {
  return <article className={`stat-card ${accent ? "stat-accent" : ""}`}>
    <span className="stat-label">{label}</span>
    <strong>{value}</strong>
    <span className="stat-detail">{detail}</span>
  </article>;
}

export default function App() {
  const [config, setConfig] = useState<ScenarioConfig>(DEFAULT_CONFIG);
  const [targets, setTargets] = useState<SimulatedTarget[]>([]);
  const [scenarioName, setScenarioName] = useState("Awaiting scenario");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [classifications, setClassifications] = useState<Record<string, Classification>>({});
  const [decisions, setDecisions] = useState<Record<string, ResponseDecision>>({});
  const [firstDetectedAt, setFirstDetectedAt] = useState<Record<string, number>>({});
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [history, setHistory] = useState<TrainingSession[]>(readHistory);
  const [activeTab, setActiveTab] = useState<"simulation" | "aar">("simulation");
  const [showHelp, setShowHelp] = useState(false);

  const selected = targets.find((target) => target.id === selectedId) ?? null;
  const classifiedCount = Object.keys(classifications).length;
  const decisionCount = Object.keys(decisions).length;
  const sessionRunning = startedAt !== null && finishedAt === null;
  const result = useMemo(() => startedAt && finishedAt && targets.length
    ? calculateAssessment(targets, classifications, decisions, firstDetectedAt, startedAt, finishedAt)
    : null, [startedAt, finishedAt, targets, classifications, decisions, firstDetectedAt]);
  const latest = history[0];
  const averageScore = history.length ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / history.length) : 0;

  function updateConfig<K extends keyof ScenarioConfig>(key: K, value: ScenarioConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  function startSession() {
    const scenario = createScenario(config);
    setTargets(scenario.targets);
    setScenarioName(scenario.scenarioName);
    setSelectedId(null);
    setClassifications({});
    setDecisions({});
    setFirstDetectedAt({});
    setStartedAt(scenario.targets[0]?.appearedAt ?? Date.now());
    setFinishedAt(null);
    setActiveTab("simulation");
  }

  function selectTarget(id: string) {
    if (!sessionRunning) return;
    setSelectedId(id);
    setFirstDetectedAt((current) => current[id] === undefined ? { ...current, [id]: Date.now() } : current);
  }

  function finishSession() {
    if (!startedAt || finishedAt || !targets.length) return;
    const end = Date.now();
    const metrics = calculateAssessment(targets, classifications, decisions, firstDetectedAt, startedAt, end);
    const session: TrainingSession = {
      id: crypto.randomUUID(),
      date: new Date(end).toLocaleString(),
      scenarioName,
      environment: config.environment,
      lighting: config.lighting,
      visibility: config.visibility,
      difficulty: config.difficulty,
      score: metrics.score,
      accuracy: metrics.accuracy,
      decisionAccuracy: metrics.decisionAccuracy,
      averageDetectionSeconds: metrics.averageDetectionSeconds,
      durationSeconds: metrics.durationSeconds,
      totalTargets: targets.length,
      detectedTargets: metrics.detectedTargets,
    };
    const updated = [session, ...history].slice(0, 100);
    setHistory(updated);
    setFinishedAt(end);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch { /* browser storage may be disabled */ }
    setActiveTab("aar");
  }

  function clearHistory() {
    setHistory([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch { /* browser storage may be disabled */ }
  }

  const radarPoints = targets.map((target) => ({
    target,
    left: Math.max(5, Math.min(95, 50 + target.x * 1.75)),
    top: Math.max(5, Math.min(95, 50 + target.z * 1.75)),
  }));

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-mark"><span>DS</span><i /></div>
          <div><p className="brand-eyebrow">TRAINING SYSTEM / 26247</p><h1>DroneSim <span>Academy</span></h1></div>
        </div>
        <div className="header-right">
          <span className="offline-pill"><i /> LOCAL SIMULATION</span>
          <button className="icon-button" onClick={() => setShowHelp((value) => !value)} aria-label="Help" title="Help">?</button>
        </div>
      </header>

      {showHelp && <section className="help-banner"><strong>How to use:</strong> choose scenario settings, start a session, select each object in the 3D scene or radar, assign a classification and a safe training response, then finish to review the AAR. All targets and labels are synthetic. <button onClick={() => setShowHelp(false)}>Dismiss</button></section>}

      <section className="page-heading">
        <div><div className="breadcrumb">SIMULATION <span>/</span> TRAINING CONSOLE</div><h2>Threat Recognition Trainer</h2><p>Scenario-based observation, classification and decision assessment.</p></div>
        <div className="heading-actions"><span className="version-label">PROTOTYPE · v1.0</span><button className="button button-primary" onClick={startSession}><span className="button-symbol">▶</span>{sessionRunning ? "Restart session" : "New training session"}</button></div>
      </section>

      <section className="stats-grid">
        <StatCard label="TRAINING SESSIONS" value={String(history.length).padStart(2, "0")} detail="Saved on this browser" />
        <StatCard label="AVERAGE SCORE" value={history.length ? `${averageScore}%` : "—"} detail={history.length ? "Across completed sessions" : "Complete a session to begin"} accent />
        <StatCard label="LAST SESSION" value={latest ? `${latest.score}%` : "—"} detail={latest ? latest.date : "No session recorded"} />
        <StatCard label="CURRENT OBJECTS" value={String(targets.length).padStart(2, "0")} detail={`${classifiedCount} classified · ${decisionCount} decisions`} />
      </section>

      <nav className="workspace-tabs" aria-label="Workspace tabs">
        <button className={activeTab === "simulation" ? "tab active" : "tab"} onClick={() => setActiveTab("simulation")}> <span>◈</span> Simulation workspace</button>
        <button className={activeTab === "aar" ? "tab active" : "tab"} onClick={() => setActiveTab("aar")}> <span>▤</span> After-action review <span className="tab-count">{history.length}</span></button>
      </nav>

      {activeTab === "simulation" ? <section className="main-grid">
        <aside className="panel scenario-panel">
          <div className="panel-heading"><div><span className="section-kicker">01 / CONFIGURE</span><h3>Scenario setup</h3></div><span className="step-badge">01</span></div>
          <label className="field"><span>Environment</span><select value={config.environment} onChange={(e) => updateConfig("environment", e.target.value as Environment)}><option value="Rural">Rural landscape</option><option value="Urban">Urban district</option></select></label>
          <label className="field"><span>Lighting conditions</span><select value={config.lighting} onChange={(e) => updateConfig("lighting", e.target.value as Lighting)}><option value="Day">Daylight</option><option value="Night">Night</option></select></label>
          <label className="field"><span>Sensor visibility</span><select value={config.visibility} onChange={(e) => updateConfig("visibility", e.target.value as Visibility)}><option value="Clear">Clear</option><option value="Haze">Haze</option><option value="Low visibility">Low visibility</option></select></label>
          <label className="field"><span>Training difficulty</span><select value={config.difficulty} onChange={(e) => updateConfig("difficulty", e.target.value as Difficulty)}><option value="Easy">Foundation</option><option value="Standard">Standard</option><option value="Advanced">Advanced</option></select></label>
          <div className="field"><div className="field-row"><span>Simulated objects</span><strong>{config.targetCount}</strong></div><input type="range" min="1" max="12" value={config.targetCount} onChange={(e) => updateConfig("targetCount", Number(e.target.value))} /></div>
          <div className="config-summary"><span className="summary-icon">✦</span><div><strong>Scenario variation enabled</strong><p>Object mix and positions are randomized each session.</p></div></div>
          <button className="button button-primary full-button" onClick={startSession}><span className="button-symbol">▶</span> {sessionRunning ? "Regenerate scenario" : "Generate scenario"}</button>
          <p className="small-note">A new scenario replaces the current unsaved session.</p>
        </aside>

        <section className="panel scene-panel">
          <div className="scene-toolbar"><div><span className={`live-indicator ${sessionRunning ? "is-live" : ""}`} /><div><h3>3D environment</h3><p>{sessionRunning ? "SESSION ACTIVE · Select an object to assess" : "READY · Generate a scenario to begin"}</p></div></div><div className="scene-tags"><span>{config.environment.toUpperCase()}</span><span>{config.lighting.toUpperCase()}</span><span>{config.visibility.toUpperCase()}</span></div></div>
          <div className="scene-viewport">
            <Scene3D targets={targets} selectedId={selectedId} night={config.lighting === "Night"} urban={config.environment === "Urban"} visibility={config.visibility} onSelect={selectTarget} />
            {!targets.length && <div className="scene-placeholder"><div className="placeholder-symbol">⌁</div><strong>Simulation environment ready</strong><span>Generate a scenario to populate the 3D world.</span><button className="button button-primary" onClick={startSession}>Generate first scenario</button></div>}
            {sessionRunning && <div className="scene-overlay scene-top-left"><span className="overlay-dot" /> TRAINING MODE</div>}
            <div className="scene-overlay scene-bottom-left">DRAG TO ORBIT <span>·</span> SCROLL TO ZOOM</div>
            <div className="scene-overlay scene-bottom-right">SYNTHETIC ENVIRONMENT</div>
          </div>
          <div className="scene-statusbar"><div><span className="status-key">OBJECTS</span><strong>{targets.length}</strong></div><div><span className="status-key">CLASSIFIED</span><strong>{classifiedCount}/{targets.length}</strong></div><div><span className="status-key">DETECTED</span><strong>{Object.keys(firstDetectedAt).length}/{targets.length}</strong></div><div><span className="status-key">SESSION</span><strong>{finishedAt ? "COMPLETE" : sessionRunning ? "RUNNING" : "IDLE"}</strong></div></div>
          <div className="radar-section"><div className="radar-title"><div><span className="section-kicker">LIVE OVERVIEW</span><h4>Object map</h4></div><span className="muted-label">Select a point to inspect</span></div><div className="radar-map"><div className="radar-ring ring-one"/><div className="radar-ring ring-two"/><div className="radar-cross horizontal"/><div className="radar-cross vertical"/><div className="radar-center"/>{radarPoints.map(({ target, left, top }) => <button key={target.id} className={`radar-point ${selectedId === target.id ? "selected" : ""} ${firstDetectedAt[target.id] ? "detected" : ""}`} style={{ left: `${left}%`, top: `${top}%` }} title={target.id} onClick={() => selectTarget(target.id)} aria-label={`Select ${target.id}`} />)}</div><div className="radar-legend"><span><i className="legend-dot unobserved"/> Unobserved</span><span><i className="legend-dot observed"/> Observed</span><span><i className="legend-dot selected-legend"/> Selected</span></div></div>
        </section>

        <aside className="panel assessment-panel">
          <div className="panel-heading"><div><span className="section-kicker">02 / ASSESS</span><h3>Object assessment</h3></div><span className="step-badge">02</span></div>
          {!selected ? <div className="assessment-empty"><div className="empty-target">◎</div><strong>No object selected</strong><p>Start a scenario, then select a 3D object or point on the object map.</p></div> : <>
            <div className="selected-object"><div className="object-avatar">⌁</div><div><span className="section-kicker">SELECTED OBJECT</span><strong>{selected.id}</strong><span className="object-meta">Synthetic observation · {firstDetectedAt[selected.id] ? "Observed" : "Not yet observed"}</span></div><span className="selection-dot"/></div>
            <div className="assessment-block"><div className="field-row"><span className="assessment-label">Classification</span><span className="required-label">REQUIRED</span></div>{CLASSIFICATIONS.map((item) => <button key={item} className={`option-button ${classifications[selected.id] === item ? "option-selected" : ""}`} disabled={!sessionRunning} onClick={() => setClassifications((current) => ({ ...current, [selected.id]: item }))}><span className="option-radio"/>{item}<span className="option-check">{classifications[selected.id] === item ? "✓" : ""}</span></button>)}</div>
            <div className="assessment-block"><div className="field-row"><span className="assessment-label">Training response</span><span className="required-label">REQUIRED</span></div>{DECISIONS.map((item) => <button key={item} className={`option-button ${decisions[selected.id] === item ? "option-selected" : ""}`} disabled={!sessionRunning} onClick={() => setDecisions((current) => ({ ...current, [selected.id]: item }))}><span className="option-radio"/>{item}<span className="option-check">{decisions[selected.id] === item ? "✓" : ""}</span></button>)}<p className="small-note">Training responses are procedural examples, not operational engagement instructions.</p></div>
            {finishedAt && <div className="truth-reveal"><span>REFERENCE LABEL</span><strong>{selected.truth}</strong><p>Expected response: {expectedDecision(selected.truth)}</p></div>}
          </>}
          <div className="assessment-footer"><div className="completion-line"><span>Assessment progress</span><strong>{targets.length ? Math.round((classifiedCount / targets.length) * 100) : 0}%</strong></div><div className="progress-track"><div style={{ width: `${targets.length ? (classifiedCount / targets.length) * 100 : 0}%` }}/></div><button className="button button-dark full-button" onClick={finishSession} disabled={!sessionRunning || targets.length === 0}>Finish & review <span>→</span></button><p className="small-note">Unanswered objects count as incorrect in the final assessment.</p></div>
        </aside>
      </section> : <section className="aar-page">
        <div className="aar-header"><div><span className="section-kicker">PERFORMANCE & LEARNING</span><h3>After-action review</h3><p>Review completed sessions and export results for reporting.</p></div><div className="aar-actions"><button className="button button-secondary" onClick={() => downloadCsv(history)} disabled={!history.length}>↓ Export CSV</button><button className="button button-secondary" onClick={clearHistory} disabled={!history.length}>Clear history</button></div></div>
        {result && <div className="result-banner"><div><span className="section-kicker">LATEST SESSION · {scenarioName.toUpperCase()}</span><h3>Session assessment complete</h3><p>Score uses a transparent training rubric: 60% classification accuracy and 40% response-decision accuracy.</p></div><div className="big-score"><strong>{result.score}</strong><span>/ 100</span></div></div>}
        <div className="aar-metrics"><StatCard label="CLASSIFICATION ACCURACY" value={result ? `${result.accuracy}%` : latest ? `${latest.accuracy}%` : "—"} detail="Correct labels / all objects"/><StatCard label="DECISION ACCURACY" value={result ? `${result.decisionAccuracy}%` : latest ? `${latest.decisionAccuracy}%` : "—"} detail="Correct training responses"/><StatCard label="AVG. DETECTION TIME" value={result ? (result.averageDetectionSeconds === null ? "N/A" : `${result.averageDetectionSeconds}s`) : latest ? (latest.averageDetectionSeconds === null ? "N/A" : `${latest.averageDetectionSeconds}s`) : "—"} detail="First selection from scenario start"/><StatCard label="OBJECTS OBSERVED" value={result ? `${result.detectedTargets}/${targets.length}` : latest ? `${latest.detectedTargets}/${latest.totalTargets}` : "—"} detail="Selected at least once"/></div>
        {(result || latest) && <div className="coach-card"><div className="coach-icon">✦</div><div><span className="section-kicker">EXPLAINABLE TRAINING COACH</span><strong>{(result?.accuracy ?? latest?.accuracy ?? 0) < 70 ? "Focus on consistent object classification" : (result?.decisionAccuracy ?? latest?.decisionAccuracy ?? 0) < 70 ? "Review the response decision rules" : ((result?.averageDetectionSeconds ?? latest?.averageDetectionSeconds ?? 0) > 12) ? "Practice a more systematic observation pass" : "Good balance across the assessed skills"}</strong><p>{(result?.accuracy ?? latest?.accuracy ?? 0) < 70 ? "Classification accuracy is the clearest improvement area in this session. Review the synthetic reference labels after each run and compare uncertain observations before committing to a label." : (result?.decisionAccuracy ?? latest?.decisionAccuracy ?? 0) < 70 ? "The response-selection score is lower than the classification score. Revisit the simulator's procedural rules: notify an instructor for a drone label, request verification for an unknown object, and log a false alarm." : ((result?.averageDetectionSeconds ?? latest?.averageDetectionSeconds ?? 0) > 12) ? "Average first-selection latency is relatively high. Try scanning the full scene and object map before focusing on individual objects." : "The latest recorded results are reasonably balanced. Keep changing environments and visibility settings to avoid relying on one familiar scenario."}</p><small>Offline rule-based feedback · Not a machine-learning diagnosis or an official training standard.</small></div></div>}
        <div className="panel history-panel"><div className="panel-heading history-panel-heading"><div><span className="section-kicker">SESSION LOG</span><h3>Training history</h3></div><span className="history-count">{history.length} records</span></div>{history.length ? <div className="table-wrap"><table className="history-table"><thead><tr><th>Session / date</th><th>Scenario</th><th>Score</th><th>Classification</th><th>Decisions</th><th>Detection</th><th>Duration</th></tr></thead><tbody>{history.map((session) => <tr key={session.id}><td><strong>{session.id.slice(0, 8).toUpperCase()}</strong><span>{session.date}</span></td><td>{session.environment} · {session.lighting}<span>{session.difficulty} / {session.visibility}</span></td><td><span className={`score-pill ${session.score >= 80 ? "score-good" : session.score >= 60 ? "score-mid" : "score-low"}`}>{session.score}%</span></td><td>{session.accuracy}%</td><td>{session.decisionAccuracy}%</td><td>{session.averageDetectionSeconds === null ? "N/A" : `${session.averageDetectionSeconds}s`}</td><td>{session.durationSeconds}s</td></tr>)}</tbody></table></div> : <div className="empty-history"><div>▤</div><strong>No completed sessions yet</strong><p>Run a training scenario and choose “Finish & review” to create your first AAR record.</p><button className="button button-primary" onClick={startSession}>Start a training session</button></div>}</div>
        <div className="rubric-note"><strong>Assessment rubric</strong><span>Classification accuracy × 60% + training-response accuracy × 40% = final score. Detection time is reported separately. This is a configurable demonstration rubric, not an official or validated military standard.</span></div>
      </section>}

      <footer className="app-footer"><div><span className="footer-mark">DS</span><span>DroneSim Academy <b>·</b> Problem Statement 26247</span></div><span>Educational prototype · Synthetic scenarios · Local-only data</span></footer>
    </main>
  );
}
