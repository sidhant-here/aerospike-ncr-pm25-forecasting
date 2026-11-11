import React, { useState, useMemo, useEffect } from 'react';
import {
  Download,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import {
  IGP_CORRIDOR_NODES,
  CorridorNodeId,
  EpisodeStreamMode,
  PerturbationState,
  NodeLiveTelemetry,
  ParsedCsvTelemetrySummary,
  EPISODE_PRESETS,
  buildReactiveSystemState,
  fetchLiveOpenMeteoCorridor,
  getCpcbSeverity,
} from './utils/corridorTelemetryEngine';
import { generateIgpCorridorSimulation } from './utils/igpPhysicsEngine';
import { buildIpynbJsonString } from './data/jupyterNotebookData';
import { View1CorridorConsole } from './components/View1CorridorConsole';
import { View2PhysicsDiagnosticsLab } from './components/View2PhysicsDiagnosticsLab';
import { View3BenchmarksAndLatex } from './components/View3BenchmarksAndLatex';
import { View4ShapAndCostOptimizer } from './components/View4ShapAndCostOptimizer';

type WorkspaceViewId = 'view1-console' | 'view2-physics' | 'view3-benchmarks' | 'view4-shap-cost';

export function App() {
  const [activeView, setActiveView] = useState<WorkspaceViewId>('view1-console');
  const [streamMode, setStreamMode] = useState<EpisodeStreamMode>('nov-2024-stubble');
  const [selectedNodeId, setSelectedNodeId] = useState<CorridorNodeId>('delhi');

  // Perturbation state initialized to Nov 2024 Stubble-Burning Episode
  const [perturbation, setPerturbation] = useState<PerturbationState>(
    EPISODE_PRESETS['nov-2024-stubble'].perturbation
  );
  const [costRatioK, setCostRatioK] = useState<number>(5.0);

  // Live Open-Meteo API state
  const [liveNodesData, setLiveNodesData] = useState<Record<
    CorridorNodeId,
    NodeLiveTelemetry
  > | null>(null);
  const [isLoadingLiveApi, setIsLoadingLiveApi] = useState<boolean>(false);
  const [liveApiError, setLiveApiError] = useState<string | null>(null);

  // Local CSV Parser state
  const [parsedCsv, setParsedCsv] = useState<ParsedCsvTelemetrySummary | null>(null);

  const handleUpdatePerturbation = (patch: Partial<PerturbationState>) => {
    setPerturbation((prev) => ({ ...prev, ...patch }));
  };

  const handleSwitchStreamMode = async (mode: EpisodeStreamMode) => {
    setStreamMode(mode);
    setLiveApiError(null);

    if (mode === 'nov-2024-stubble' || mode === 'dec-2024-inversion') {
      setPerturbation(EPISODE_PRESETS[mode].perturbation);
      return;
    }

    if (mode === 'live-open-meteo') {
      setIsLoadingLiveApi(true);
      try {
        const fetched = await fetchLiveOpenMeteoCorridor();
        setLiveNodesData(fetched);
        const target = fetched[selectedNodeId] || fetched.delhi;
        const upwind = fetched.ludhiana || fetched.chandigarh;
        setPerturbation((prev) => ({
          ...prev,
          upwindPm25: upwind.pm25,
          aod: target.aod,
          windSpeedKmh: target.windSpeedKmh,
          windDirDeg: target.windDirDeg,
          solarRadiationWm2: target.solarRadWm2,
          temp2mC: target.tempC,
          humidityPct: target.humidityPct,
          pressureHpa: target.pressureHpa,
          dustUgm3: target.dust,
          coUgm3: target.co,
          no2Ugm3: target.no2,
        }));
      } catch (err) {
        setLiveApiError(
          err instanceof Error
            ? `Open-Meteo fallback active (${err.message})`
            : 'Open-Meteo connection fallback active'
        );
      } finally {
        setIsLoadingLiveApi(false);
      }
    }
  };

  // Sync perturbation when a local CSV is loaded
  const handleCsvLoaded = (summary: ParsedCsvTelemetrySummary) => {
    setParsedCsv(summary);
    setStreamMode('local-csv-stream');
    setPerturbation((prev) => ({
      ...prev,
      upwindPm25: Math.round(summary.meanPm25 * 1.15),
      aod: summary.meanAod,
    }));
  };

  // Re-sync perturbation if user clicks another corridor node while in Live Open-Meteo mode
  useEffect(() => {
    if (streamMode === 'live-open-meteo' && liveNodesData) {
      const target = liveNodesData[selectedNodeId];
      if (target) {
        setPerturbation((prev) => ({
          ...prev,
          aod: target.aod,
          windSpeedKmh: target.windSpeedKmh,
          windDirDeg: target.windDirDeg,
          solarRadiationWm2: target.solarRadWm2,
          temp2mC: target.tempC,
          humidityPct: target.humidityPct,
          pressureHpa: target.pressureHpa,
          dustUgm3: target.dust,
          coUgm3: target.co,
          no2Ugm3: target.no2,
        }));
      }
    }
  }, [selectedNodeId, streamMode, liveNodesData]);

  // Core Reactive Physics & Conformal State
  const reactiveState = useMemo(
    () =>
      buildReactiveSystemState(
        perturbation,
        selectedNodeId,
        costRatioK,
        streamMode === 'live-open-meteo' ? liveNodesData : null
      ),
    [perturbation, selectedNodeId, costRatioK, streamMode, liveNodesData]
  );

  // Benchmark & Ablation Tables from igpPhysicsEngine
  const benchmarkSim = useMemo(
    () =>
      generateIgpCorridorSimulation({
        targetCoverage: perturbation.targetConformalCoverage,
        costRatioK,
        decisionThresholdTau: reactiveState.optimalTauStar,
      }),
    [perturbation.targetConformalCoverage, costRatioK, reactiveState.optimalTauStar]
  );

  const handleDownloadNotebook = () => {
    const jsonString = buildIpynbJsonString();
    const blob = new Blob([jsonString], { type: 'application/x-ipynb+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'igp_cqr_pm25_forecasting_ieee.ipynb';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Numbered Academic Journal Section Tabs (No Decorative Icons)
  const navTabs: Array<{
    id: WorkspaceViewId;
    label: string;
  }> = [
    {
      id: 'view1-console',
      label: '§ 1.0 CORRIDOR & CQR CONSOLE',
    },
    {
      id: 'view2-physics',
      label: '§ 2.0 PHYSICS & CSV LAB',
    },
    {
      id: 'view3-benchmarks',
      label: '§ 3.0 BENCHMARKS & LATEX',
    },
    {
      id: 'view4-shap-cost',
      label: '§ 4.0 SHAP & GRAP-IV OPTIMIZER',
    },
  ];

  const activeSeverity = getCpcbSeverity(reactiveState.activeNode.pm25);

  return (
    <div className="min-h-screen bg-[#F4F3EE] text-[#111111] flex flex-col">
      {/* SWISS EDITORIAL & IEEE / NATURE RESEARCH WORKBENCH MASTHEAD */}
      <header className="bg-[#FAF9F5] border-b border-[#1C1C1C] sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-8 pt-4 pb-0 flex flex-col gap-3">
          {/* Top Row: Editorial Masthead Title & .ipynb Archive CTA */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#D4D2C8]">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-stone-600">
                <span className="font-bold text-[#B91C1C]">IEEE / NATURE ATMOSPHERIC TELEMETRY WORKBENCH</span>
                <span>•</span>
                <span>MANUSCRIPT SUPPL. ARCHIVE // IGP-CQR v2.4</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#111111] mt-1">
                Indo-Gangetic Plain Advection & Conformal PM₂.₅ Spike Forecasting System
              </h1>
            </div>

            {/* Primary CTA (.ipynb Download) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadNotebook}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold bg-[#111111] hover:bg-[#B91C1C] text-[#FAF9F5] border border-[#1C1C1C] rounded-none shadow-none cursor-pointer transition-colors whitespace-nowrap"
                title="Download standalone 572-line Jupyter Notebook (.ipynb)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD .IPYNB (572 LINES)</span>
              </button>
            </div>
          </div>

          {/* Bottom Row of Header: Numbered Academic Section Tabs (No Icons, 3px Solid #111111 Bottom Border When Active) */}
          <nav
            className="flex flex-wrap items-center gap-8 -mb-[1px]"
            aria-label="Academic Journal Sections"
          >
            {navTabs.map((tab) => {
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveView(tab.id)}
                  className={`py-3 text-xs font-mono tracking-wider uppercase cursor-pointer rounded-none transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-b-[3px] border-[#111111] font-bold text-[#111111]'
                      : 'border-b-[3px] border-transparent text-stone-600 hover:text-[#111111]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* MAIN WORKSPACE CONTAINER WITH SPACIOUS BREATHING ROOM */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-8 py-6 space-y-6">
        {/* WELL-SPACED CONTROL BAR: STREAM SOURCE & IGP CORRIDOR NODES */}
        <section
          aria-label="Stream Source and Corridor Node Selector"
          className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#FAF9F5] border border-[#1C1C1C] rounded-none shadow-none"
        >
          {/* Left: Episode / Data Stream Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] whitespace-nowrap">
              STREAM SOURCE //
            </span>

            <select
              aria-label="Select Atmospheric Telemetry Data Stream"
              value={streamMode}
              onChange={(e) => handleSwitchStreamMode(e.target.value as EpisodeStreamMode)}
              className="bg-[#F4F3EE] border border-[#1C1C1C] text-xs font-mono text-[#111111] px-3.5 py-1.5 rounded-none focus:outline-none cursor-pointer"
            >
              <option value="nov-2024-stubble">
                Nov 2024 Peak Stubble-Burning Episode (Historical Test Window)
              </option>
              <option value="dec-2024-inversion">
                Dec 2024 Nocturnal Radiative Inversion Episode
              </option>
              <option value="live-open-meteo">
                Live Open-Meteo REST API Stream (Keyless Real-Time Corridor)
              </option>
              <option value="local-csv-stream">
                Local CSV File Stream (Browser FileReader Engine)
              </option>
            </select>

            {streamMode === 'live-open-meteo' && (
              <button
                type="button"
                onClick={() => handleSwitchStreamMode('live-open-meteo')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold bg-[#F4F3EE] text-[#1D4ED8] border border-[#1C1C1C] rounded-none cursor-pointer whitespace-nowrap"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoadingLiveApi ? 'animate-spin' : ''}`}
                />
                <span>{isLoadingLiveApi ? 'FETCHING OPEN-METEO...' : 'REFRESH LIVE API'}</span>
              </button>
            )}

            {streamMode === 'local-csv-stream' && (
              <button
                type="button"
                onClick={() => setActiveView('view2-physics')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold bg-[#F4F3EE] text-[#15803D] border border-[#1C1C1C] rounded-none cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>
                  {parsedCsv
                    ? `${parsedCsv.fileName} (${parsedCsv.corridorRowsMatched} rows)`
                    : 'OPEN CSV INSPECTOR (§ 2.0)'}
                </span>
              </button>
            )}

            {liveApiError && (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#B91C1C] font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                {liveApiError}
              </span>
            )}
          </div>

          {/* Right: 5 IGP Corridor Node Buttons with gap-2 and px-3.5 py-1.5 text-xs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] mr-1 whitespace-nowrap">
              IGP CORRIDOR NODES //
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {IGP_CORRIDOR_NODES.map((node) => {
                const tel = reactiveState.nodeReadouts[node.id];
                const sev = getCpcbSeverity(tel.pm25);
                const isSelected = node.id === selectedNodeId;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`px-3.5 py-1.5 text-xs font-mono border border-[#1C1C1C] flex items-center gap-2 cursor-pointer rounded-none transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#111111] text-[#FAF9F5] font-bold'
                        : 'bg-[#F4F3EE] text-[#18181B] hover:bg-[#EAE8E0]'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 inline-block border border-[#1C1C1C]"
                      style={{ backgroundColor: sev.colorHex }}
                    />
                    <span>{node.shortLabel}</span>
                    <span
                      className="tabular-nums font-bold"
                      style={{ color: isSelected ? '#FAF9F5' : sev.colorHex }}
                    >
                      {tel.pm25}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ACTIVE WORKSPACE VIEW */}
        {activeView === 'view1-console' && (
          <View1CorridorConsole
            perturbation={perturbation}
            onUpdatePerturbation={handleUpdatePerturbation}
            onResetPreset={() => {
              const resetMode =
                streamMode === 'dec-2024-inversion' ? 'dec-2024-inversion' : 'nov-2024-stubble';
              setPerturbation(EPISODE_PRESETS[resetMode].perturbation);
            }}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            nodeReadouts={reactiveState.nodeReadouts}
            activeNode={reactiveState.activeNode}
            indices={reactiveState.indices}
            conformalOffsetQHat={reactiveState.conformalOffsetQHat}
            forecast72h={reactiveState.forecast72h}
            peakMse24h={reactiveState.peakMse24h}
            peakCqr24h={reactiveState.peakCqr24h}
            leadTimeGainHrs={reactiveState.leadTimeGainHrs}
          />
        )}

        {activeView === 'view2-physics' && (
          <View2PhysicsDiagnosticsLab
            perturbation={perturbation}
            activeNode={reactiveState.activeNode}
            indices={reactiveState.indices}
            diurnalHysteresis={reactiveState.diurnalHysteresis}
            smokeDustScatter={reactiveState.smokeDustScatter}
            parsedCsv={parsedCsv}
            onCsvLoaded={handleCsvLoaded}
          />
        )}

        {activeView === 'view3-benchmarks' && (
          <View3BenchmarksAndLatex
            table1Benchmarks={benchmarkSim.table1Benchmarks}
            table2Ablation={benchmarkSim.table2Ablation}
            onDownloadNotebook={handleDownloadNotebook}
          />
        )}

        {activeView === 'view4-shap-cost' && (
          <View4ShapAndCostOptimizer
            shapWaterfall={reactiveState.shapWaterfall}
            baseExpectation={reactiveState.baseExpectation}
            peakCqr24h={reactiveState.peakCqr24h}
            costRatioK={costRatioK}
            onChangeCostRatioK={setCostRatioK}
            costCurve={reactiveState.costCurve}
            optimalTauStar={reactiveState.optimalTauStar}
            minCostAtTauStar={reactiveState.minCostAtTauStar}
          />
        )}
      </main>

      {/* TECHNICAL FOOTER WITH OFFICIAL CPCB / CAQM SEVERITY SCALE LEGEND */}
      <footer className="bg-[#FAF9F5] border-t border-[#1C1C1C] px-8 py-3.5 text-xs font-mono text-[#18181B]">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="uppercase tracking-wider text-[#111111] font-bold">
              CPCB / CAQM PM₂.₅ SEVERITY SCALE (µg/m³):
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 inline-block bg-[#15803D] border border-[#1C1C1C]" />
              Good (0–30)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 inline-block bg-[#4D7C0F] border border-[#1C1C1C]" />
              Satisfactory (31–60)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 inline-block bg-[#B45309] border border-[#1C1C1C]" />
              Moderate (61–90)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 inline-block bg-[#C2410C] border border-[#1C1C1C]" />
              Poor (91–120)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 inline-block bg-[#B91C1C] border border-[#1C1C1C]" />
              Very Poor (121–250)
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#B91C1C] font-bold">
              <span className="w-2.5 h-2.5 inline-block bg-[#B91C1C] border border-[#1C1C1C]" />
              CAQM GRAP Stage-IV Severe+ (&gt;250)
            </span>
          </div>

          <div className="flex items-center gap-3 text-stone-700">
            <span>
              ACTIVE RECEPTOR: <strong>{reactiveState.activeNode.nodeId.toUpperCase()}</strong> (
              <strong style={{ color: activeSeverity.colorHex }}>
                {reactiveState.activeNode.pm25} µg/m³
              </strong>
              )
            </span>
            <span>|</span>
            <span>TIMESTAMP: {reactiveState.activeNode.updatedAtIst}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
