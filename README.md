# DroneSim Academy — Problem Statement 26247

**Al-Enabled Drone & Counter-Drone Threat Simulation Trainer**  
A polished browser-based 3D training prototype for synthetic object observation, classification, safe procedural response selection, and after-action review (AAR).

## What's included

- Interactive 3D rural and urban scenes built with Three.js / React Three Fiber.
- Day/night lighting and clear, haze, and low-visibility scene conditions.
- Randomized synthetic object positions and adjustable scenario size/difficulty.
- Clickable 3D objects plus a compact overview map.
- Classification and procedural training-response assessment.
- Transparent sample score: 60% classification accuracy + 40% response-decision accuracy.
- Offline, explainable rule-based coaching notes derived from the assessment metrics (not a machine-learning model).
- First-observation latency tracking, session duration, and detected-object counts.
- Local AAR history with CSV export.
- Responsive interface and custom app branding.
- No API key, cloud service, VR headset, or special hardware required for this prototype.

## Requirements

- Node.js 20.19+ (Node 22 LTS recommended)
- npm
- Internet access for first-time package installation

## Easiest Windows launch

1. Extract the ZIP completely.
2. Open the extracted **`DroneSim_Academy_PS26247`** folder. `package.json` must be directly inside this folder.
3. Double-click `START-HERE-WINDOWS.bat`.
4. On the first run, wait while npm installs dependencies.
5. Open the URL shown in the terminal, usually `http://localhost:5173`.

## Run manually in VS Code

Open the folder containing `package.json`, then choose **Terminal → New Terminal**. Run:

```powershell
npm install
npm run dev
```

Do not run `npm run dev` from the parent folder that only contains the project folder. The terminal's current folder must be `DroneSim_Academy_PS26247` and `dir package.json` must find the file.

## Production build

```powershell
npm run build
npm run preview
```

## Use the simulator

1. Choose environment, lighting, visibility, difficulty, and number of synthetic objects.
2. Select **Generate scenario**.
3. Select an object in the 3D view or overview map.
4. Choose a classification and a procedural training response.
5. Finish the session to open AAR results.
6. Export session history as CSV when needed.

## Assessment notes

The sample rubric is `classification accuracy × 60% + training-response accuracy × 40%`. First-observation latency is reported separately. The rubric is configurable and illustrative; it is not an official or validated military standard. Synthetic reference labels are revealed only after the session ends.

## Data and limitations

- Session history is stored in this browser's local storage. It is not a shared, multi-user database.
- The objects and labels are synthetic. This is not a validated sensor simulator or operational counter-drone system and does not connect to real sensors, weapons, or targeting systems.
- Google Fonts are loaded remotely when internet access is available; local system fonts remain available as fallbacks.

## Suggested future phase

Add a FastAPI + SQLite service for instructor accounts and shared unit-level reporting, reproducible scenario packs, and a configurable rubric reviewed by domain experts before formal training use.
