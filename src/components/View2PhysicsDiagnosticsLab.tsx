import React, { useRef, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
} from 'recharts';
import { Upload, FileSpreadsheet, AlertCircle, Download, Copy, Check } from 'lucide-react';
import {
  PerturbationState,
  NodeLiveTelemetry,
  ReactivePhysicsIndices,
  DiurnalHysteresisPoint,
  SmokeDustScatterPoint,
  ParsedCsvTelemetrySummary,
  parseCorridorCsvText,
  generateSampleCorridorCsvString,
} from '../utils/corridorTelemetryEngine';
import {
  EDA_PIPELINE_STAGES,
  EDA_IMPUTATION_AUDIT_ROWS,
  EDA_CORRIDOR_LAG_CORRELATIONS,
  EDA_PREPROCESSING_NOTEBOOK_CELLS,
  EDA_LATEX_TABLES,
  buildEdaIpynbJsonString,
} from '../data/edaPreprocessingNotebookData';

interface View2PhysicsDiagnosticsLabProps {
  perturbation: PerturbationState;
  activeNode: NodeLiveTelemetry;
  indices: ReactivePhysicsIndices;
  diurnalHysteresis: DiurnalHysteresisPoint[];
  smokeDustScatter: SmokeDustScatterPoint[];
  parsedCsv: ParsedCsvTelemetrySummary | null;
  onCsvLoaded: (summary: ParsedCsvTelemetrySummary) => void;
  onDownloadEdaNotebook?: () => void;
}

export const View2PhysicsDiagnosticsLab: React.FC<View2PhysicsDiagnosticsLabProps> = ({
  perturbation,
  activeNode,
  indices,
  diurnalHysteresis,
  smokeDustScatter,
  parsedCsv,
  onCsvLoaded,
  onDownloadEdaNotebook,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [edaSubTab, setEdaSubTab] = useState<'tables-pipeline' | 'notebook-cells' | 'latex-eda'>(
    'tables-pipeline'
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleTriggerEdaDownload = () => {
    if (onDownloadEdaNotebook) {
      onDownloadEdaNotebook();
      return;
    }
    const jsonStr = buildEdaIpynbJsonString();
    const blob = new Blob([jsonStr], { type: 'application/x-ipynb+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'igp_eda_preprocessing_ieee.ipynb';
    a.click();
    URL.revokeObjectURL(url);
  };

  const winterSmokePoints = smokeDustScatter.filter(
    (d) => d.regime === 'Winter Pyrogenic Smoke'
  );
  const summerDustPoints = smokeDustScatter.filter(
    (d) => d.regime === 'Summer Crustal Dust'
  );

  const handleFileObject = (file: File) => {
    setCsvError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = String(ev.target?.result || '');
        const summary = parseCorridorCsvText(text, file.name);
        onCsvLoaded(summary);
      } catch (err) {
        setCsvError(err instanceof Error ? err.message : 'Failed to parse CSV file.');
      }
    };
    reader.onerror = () => {
      setCsvError('Browser FileReader encountered an error reading the file.');
    };
    reader.readAsText(file);
  };

  const handleLoadSampleCsv = () => {
    setCsvError(null);
    const sampleText = generateSampleCorridorCsvString();
    const summary = parseCorridorCsvText(
      sampleText,
      'INDIA_AQI_COMPLETE_20251126_sample200.csv'
    );
    onCsvLoaded(summary);
  };

  return (
    <div className="space-y-6">
      {/* SPACIOUS 2x2 MATHEMATICAL FORMULA & LIVE TELEMETRY SPECIFICATION GRID */}
      <section aria-label="Atmospheric Physics Formulations">
        <div className="border border-[#1C1C1C] bg-[#FAF9F5] rounded-none shadow-none">
          <div className="bg-[#EAE8E0] p-6 border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-serif font-bold tracking-tight text-[#111111]">
              § 2.1 Domain-Specific Atmospheric Physics Feature Formulations (Live Reactive State)
            </h2>
            <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-[#FAF9F5] border border-[#1C1C1C] text-[#111111] whitespace-nowrap">
              Receptor: {activeNode.nodeId.toUpperCase()} ({activeNode.pm25} µg/m³)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1C1C1C]">
            {/* Left Pair of Equations */}
            <div className="divide-y divide-[#1C1C1C]">
              {/* Equation 01: Corridor Plume Advection Flux */}
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#111111]">
                      EQ. 01 // PLUME ADVECTION FLUX
                    </span>
                    <span className="px-2 py-0.5 text-xs font-mono border border-[#D4D2C8] bg-[#EAE8E0] text-[#1D4ED8] font-semibold whitespace-nowrap">
                      315° AXIS
                    </span>
                  </div>
                  <div className="mt-3 bg-[#EAE8E0] border border-[#D4D2C8] p-3 font-mono text-xs text-[#111111] overflow-x-auto">
                    Φ_adv = max(0, v₁₀ₘ·cos(θ - 315°)) × PM₂.₅,up(t-6h) × 0.01
                  </div>
                  <p className="mt-3 text-xs text-stone-700 leading-relaxed">
                    Projects surface wind onto the 315° NW-to-SE Indo-Gangetic transport axis and
                    couples it with 6h-lagged Punjab/Chandigarh source load ({perturbation.upwindPm25} µg/m³).
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2E0D8]">
                  <div className="flex items-baseline justify-between font-mono">
                    <span className="text-2xl font-bold text-[#1D4ED8] tabular-nums">
                      {indices.phiAdvectionFlux.toFixed(2)} units
                    </span>
                    <span className="text-xs text-[#18181B] font-semibold tabular-nums">
                      P{indices.phiPercentile} Corridor Rank
                    </span>
                  </div>
                  <div className="mt-2 w-full h-1.5 bg-[#EAE8E0] border border-[#D4D2C8]">
                    <div
                      className="h-full bg-[#1D4ED8]"
                      style={{ width: `${indices.phiPercentile}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Equation 02: Radiative Nocturnal Boundary-Layer Inversion Index (RNII) */}
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#111111]">
                      EQ. 02 // RADIATIVE INVERSION (RNII)
                    </span>
                    <span className="px-2 py-0.5 text-xs font-mono border border-[#D4D2C8] bg-[#EAE8E0] text-[#111111] font-semibold whitespace-nowrap">
                      PBL COLLAPSE
                    </span>
                  </div>
                  <div className="mt-3 bg-[#EAE8E0] border border-[#D4D2C8] p-3 font-mono text-xs text-[#111111] overflow-x-auto">
                    RNII = [RH% · max(1, P - 990)] / [(T + 273.15)·(R_rad + 10)] × 100
                  </div>
                  <p className="mt-3 text-xs text-stone-700 leading-relaxed">
                    Quantifies nocturnal Planetary Boundary Layer (PBL) collapse after sunset when
                    shortwave radiation drops to {perturbation.solarRadiationWm2} W/m² under high surface pressure.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2E0D8]">
                  <div className="flex items-baseline justify-between font-mono">
                    <span className="text-2xl font-bold text-[#111111] tabular-nums">
                      {indices.rniiIndex.toFixed(3)} idx
                    </span>
                    <span className="text-xs text-[#18181B] font-semibold tabular-nums">
                      P{indices.rniiPercentile} Corridor Rank
                    </span>
                  </div>
                  <div className="mt-2 w-full h-1.5 bg-[#EAE8E0] border border-[#D4D2C8]">
                    <div
                      className="h-full bg-[#111111]"
                      style={{ width: `${indices.rniiPercentile}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Pair of Equations */}
            <div className="divide-y divide-[#1C1C1C]">
              {/* Equation 03: Pyrogenic Stagnation Accumulation Index (PSAI) */}
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#111111]">
                      EQ. 03 // PYROGENIC STAGNATION (PSAI)
                    </span>
                    <span className="px-2 py-0.5 text-xs font-mono border border-[#D4D2C8] bg-[#EAE8E0] text-[#B91C1C] font-semibold whitespace-nowrap">
                      BIOMASS PLUME
                    </span>
                  </div>
                  <div className="mt-3 bg-[#EAE8E0] border border-[#D4D2C8] p-3 font-mono text-xs text-[#111111] overflow-x-auto">
                    PSAI = [AOD·(PM₂.₅/PM₁₀)·(1+1.5I_crop+0.8I_fest)·(1+I_stag)] / (v₁₀ₘ+1) × 100
                  </div>
                  <p className="mt-3 text-xs text-stone-700 leading-relaxed">
                    Couples column aerosol optical depth (AOD={perturbation.aod.toFixed(2)}) and fine
                    fraction with agricultural stubble-burning and calm wind trapping.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2E0D8]">
                  <div className="flex items-baseline justify-between font-mono">
                    <span className="text-2xl font-bold text-[#B91C1C] tabular-nums">
                      {indices.psaiIndex.toFixed(2)} idx
                    </span>
                    <span className="text-xs text-[#18181B] font-semibold tabular-nums">
                      P{indices.psaiPercentile} Corridor Rank
                    </span>
                  </div>
                  <div className="mt-2 w-full h-1.5 bg-[#EAE8E0] border border-[#D4D2C8]">
                    <div
                      className="h-full bg-[#B91C1C]"
                      style={{ width: `${indices.psaiPercentile}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Equation 04: Combustion vs. Crustal Dust Partitioning (CDCP) */}
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#111111]">
                      EQ. 04 // COMBUSTION PARTITION (CDCP)
                    </span>
                    <span className="px-2 py-0.5 text-xs font-mono border border-[#D4D2C8] bg-[#EAE8E0] text-[#15803D] font-semibold whitespace-nowrap">
                      SMOKE VS. DUST
                    </span>
                  </div>
                  <div className="mt-3 bg-[#EAE8E0] border border-[#D4D2C8] p-3 font-mono text-xs text-[#111111] overflow-x-auto">
                    CDCP = [max(0, PM₂.₅ - 0.3·Dust) / (PM₁₀ + 1)] · ln(1 + CO + NO₂)
                  </div>
                  <p className="mt-3 text-xs text-stone-700 leading-relaxed">
                    Separates toxic winter secondary/pyrogenic smoke (high CO+NO₂, high PM₂.₅/PM₁₀)
                    from coarse Thar desert mineral dust intrusions.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2E0D8]">
                  <div className="flex items-baseline justify-between font-mono">
                    <span className="text-2xl font-bold text-[#15803D] tabular-nums">
                      {indices.cdcpIndex.toFixed(3)} idx
                    </span>
                    <span className="text-xs text-[#18181B] font-semibold tabular-nums">
                      P{indices.cdcpPercentile} Corridor Rank
                    </span>
                  </div>
                  <div className="mt-2 w-full h-1.5 bg-[#EAE8E0] border border-[#D4D2C8]">
                    <div
                      className="h-full bg-[#15803D]"
                      style={{ width: `${indices.cdcpPercentile}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DUAL DIAGNOSTIC CHARTS: CHART A (HYSTERESIS LOOP) & CHART B (SMOKE VS DUST SCATTER) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Diurnal Radiative Inversion Hysteresis Loop */}
        <div className="bg-[#FAF9F5] border border-[#1C1C1C] rounded-none shadow-none">
          <div className="bg-[#EAE8E0] p-6 border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-serif font-bold tracking-tight text-[#111111]">
                Fig. 2A — 24-Hour Diurnal Radiative Inversion & PBL Collapse Hysteresis
              </h2>
              <p className="text-xs text-stone-600 font-mono mt-1">
                Solar_Radiation_Wm2 & PBL Mixing Height vs. Nocturnal PM2.5 Accumulation ({activeNode.nodeId.toUpperCase()})
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-[#FAF9F5] border border-[#1C1C1C] text-[#B91C1C] whitespace-nowrap">
              21:00–07:00 IST TRAP
            </span>
          </div>

          <div className="p-6">
            <div className="w-full h-[330px] bg-[#FAF9F5] border border-[#D4D2C8] p-3">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={diurnalHysteresis}
                  margin={{ top: 14, right: 18, left: 6, bottom: 8 }}
                >
                  <CartesianGrid stroke="#D4D2C8" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hourIst"
                    stroke="#1C1C1C"
                    tick={{ fill: '#18181B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    interval={2}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#B91C1C"
                    tick={{ fill: '#B91C1C', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    label={{
                      value: 'PM2.5 (µg/m³)',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#B91C1C',
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#1D4ED8"
                    tick={{ fill: '#1D4ED8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    label={{
                      value: 'Solar Rad (W/m²) / PBL (m)',
                      angle: 90,
                      position: 'insideRight',
                      fill: '#1D4ED8',
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FAF9F5',
                      borderColor: '#1C1C1C',
                      borderRadius: '0px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      color: '#111111',
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      paddingTop: '6px',
                      color: '#111111',
                    }}
                  />

                  <ReferenceArea
                    yAxisId="left"
                    x1="00:00"
                    x2="07:00"
                    fill="#B91C1C"
                    fillOpacity={0.07}
                  />
                  <ReferenceArea
                    yAxisId="left"
                    x1="21:00"
                    x2="23:00"
                    fill="#B91C1C"
                    fillOpacity={0.07}
                  />

                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="pblMixingHeightM"
                    name="Planetary Boundary Layer Height (m)"
                    fill="#1D4ED8"
                    fillOpacity={0.12}
                    stroke="#1D4ED8"
                    strokeWidth={1.6}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="solarRadiationWm2"
                    name="Solar Shortwave Radiation (W/m²)"
                    fill="#D97706"
                    fillOpacity={0.45}
                    barSize={10}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="pm25Ugm3"
                    name="Receptor PM2.5 (µg/m³)"
                    stroke="#B91C1C"
                    strokeWidth={2.4}
                    dot={{ r: 2.5, fill: '#B91C1C' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart B: Pyrogenic Smoke vs. Crustal Dust Partitioning Scatter */}
        <div className="bg-[#FAF9F5] border border-[#1C1C1C] rounded-none shadow-none">
          <div className="bg-[#EAE8E0] p-6 border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-serif font-bold tracking-tight text-[#111111]">
                Fig. 2B — Pyrogenic Biomass Smoke vs. Crustal Dust Partitioning
              </h2>
              <p className="text-xs text-stone-600 font-mono mt-1">
                Fine-Mode Fraction (PM2.5/PM10) vs. Combustion Partition Index (CDCP), sized by AOD
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-[#FAF9F5] border border-[#1C1C1C] text-[#15803D] whitespace-nowrap">
              REGIME SEPARABILITY
            </span>
          </div>

          <div className="p-6">
            <div className="w-full h-[330px] bg-[#FAF9F5] border border-[#D4D2C8] p-3">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 14, right: 18, left: 6, bottom: 8 }}>
                  <CartesianGrid stroke="#D4D2C8" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="pmRatio"
                    name="PM2.5 / PM10 Ratio"
                    domain={[0.2, 0.95]}
                    stroke="#1C1C1C"
                    tick={{ fill: '#18181B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    label={{
                      value: 'Fine-Mode Aerosol Fraction (PM2.5 / PM10)',
                      position: 'insideBottom',
                      offset: -4,
                      fill: '#111111',
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="cdcpIndex"
                    name="CDCP Index"
                    domain={[0, 'auto']}
                    stroke="#1C1C1C"
                    tick={{ fill: '#18181B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    label={{
                      value: 'Combustion Partition Index (CDCP)',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#111111',
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                    }}
                  />
                  <ZAxis type="number" dataKey="aod" range={[45, 220]} name="Satellite AOD" />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: '#FAF9F5',
                      borderColor: '#1C1C1C',
                      borderRadius: '0px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      color: '#111111',
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      paddingTop: '6px',
                      color: '#111111',
                    }}
                  />
                  <Scatter
                    name="Winter Pyrogenic Smoke (Crop Burning + Secondary)"
                    data={winterSmokePoints}
                    fill="#B91C1C"
                  />
                  <Scatter
                    name="Summer Crustal Dust (Coarse Mineral Aerosol)"
                    data={summerDustPoints}
                    fill="#1D4ED8"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* CLIENT-SIDE CSV TELEMETRY INSPECTOR (FILEREADER DRAG-AND-DROP) */}
      <div className="bg-[#FAF9F5] border border-[#1C1C1C] rounded-none shadow-none">
        <div className="bg-[#EAE8E0] p-6 border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-serif font-bold tracking-tight text-[#111111]">
              § 2.2 Client-Side Local CSV Telemetry Inspector (Browser FileReader Engine)
            </h2>
            <p className="text-xs text-stone-600 font-mono mt-1">
              Drop INDIA_AQI_COMPLETE_20251126.csv or aqi_india_38cols_knn_final.csv to parse up to
              5,000 IGP corridor records directly in browser memory
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleLoadSampleCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-semibold bg-[#FAF9F5] hover:bg-[#111111] hover:text-[#FAF9F5] text-[#111111] border border-[#1C1C1C] rounded-none cursor-pointer transition-colors whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              LOAD SAMPLE 200-ROW CORRIDOR CSV
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-semibold bg-[#111111] hover:bg-[#B91C1C] text-[#FAF9F5] border border-[#1C1C1C] rounded-none cursor-pointer transition-colors whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              BROWSE LOCAL CSV...
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileObject(file);
              }}
            />
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileObject(file);
            }}
            className={`border border-dashed p-6 text-center rounded-none transition-colors ${
              isDragging
                ? 'border-[#B91C1C] bg-[#FEE2E2]/40'
                : 'border-[#1C1C1C] bg-[#F4F3EE]'
            }`}
          >
            <p className="text-xs font-mono text-[#18181B]">
              Drag & drop <span className="font-bold underline">INDIA_AQI_COMPLETE_20251126.csv</span> or{' '}
              <span className="font-bold underline">aqi_india_38cols_knn_final.csv</span> here, or use the
              buttons above.
            </p>
            {csvError && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-mono text-[#B91C1C] font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                {csvError}
              </div>
            )}
          </div>

          {/* Parsed CSV Summary & Monospace Data Grid */}
          {parsedCsv && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-mono text-xs">
                <div className="p-4 bg-[#F4F3EE] border border-[#1C1C1C]">
                  <div className="text-[11px] text-stone-600 uppercase">01 // Active File</div>
                  <div
                    className="text-[#111111] font-bold truncate mt-1"
                    title={parsedCsv.fileName}
                  >
                    {parsedCsv.fileName}
                  </div>
                </div>
                <div className="p-4 bg-[#F4F3EE] border border-[#1C1C1C]">
                  <div className="text-[11px] text-stone-600 uppercase">02 // Corridor Rows</div>
                  <div className="text-[#1D4ED8] font-bold text-base mt-1 tabular-nums">
                    {parsedCsv.corridorRowsMatched.toLocaleString()} rows
                  </div>
                </div>
                <div className="p-4 bg-[#F4F3EE] border border-[#1C1C1C]">
                  <div className="text-[11px] text-stone-600 uppercase">03 // Detected Schema</div>
                  <div className="text-[#111111] font-bold text-base mt-1 tabular-nums">
                    {parsedCsv.detectedColumns.length} columns
                  </div>
                </div>
                <div className="p-4 bg-[#F4F3EE] border border-[#1C1C1C]">
                  <div className="text-[11px] text-stone-600 uppercase">04 // Mean / Peak PM2.5</div>
                  <div className="text-[#B91C1C] font-bold text-base mt-1 tabular-nums">
                    {parsedCsv.meanPm25} / {parsedCsv.maxPm25} µg/m³
                  </div>
                </div>
                <div className="p-4 bg-[#F4F3EE] border border-[#1C1C1C]">
                  <div className="text-[11px] text-stone-600 uppercase">05 // Mean Column AOD</div>
                  <div className="text-[#15803D] font-bold text-base mt-1 tabular-nums">
                    {parsedCsv.meanAod.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Missingness Audit Strip */}
              <div className="bg-[#F4F3EE] border border-[#D4D2C8] p-4">
                <div className="text-xs font-mono uppercase tracking-wider text-stone-600 font-semibold mb-2">
                  Column Missingness Audit (First 14 Detected Features)
                </div>
                <div className="flex flex-wrap gap-2">
                  {parsedCsv.missingnessAudit.map((m) => (
                    <span
                      key={m.column}
                      className="px-2.5 py-1 text-xs font-mono bg-[#FAF9F5] border border-[#D4D2C8] text-[#18181B] tabular-nums"
                    >
                      {m.column}:{' '}
                      <span
                        className={
                          m.missingPct > 0
                            ? 'text-[#B91C1C] font-bold'
                            : 'text-[#15803D] font-semibold'
                        }
                      >
                        {m.missingPct}% null
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Dense Monospace Data Grid Preview (Top 25 Rows) */}
              <div className="bg-[#FAF9F5] border border-[#1C1C1C] overflow-x-auto max-h-[280px]">
                <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                  <thead className="bg-[#EAE8E0] sticky top-0 border-b border-[#1C1C1C]">
                    <tr className="divide-x divide-[#D4D2C8]">
                      <th className="py-2 px-3 text-[#111111] font-bold">#</th>
                      {parsedCsv.detectedColumns.slice(0, 11).map((col) => (
                        <th key={col} className="py-2 px-3 text-[#111111] font-bold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D4D2C8]">
                    {parsedCsv.rows.slice(0, 25).map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="divide-x divide-[#D4D2C8] hover:bg-[#EAE8E0]/60"
                      >
                        <td className="py-1.5 px-3 text-stone-500">{rIdx + 1}</td>
                        {parsedCsv.detectedColumns.slice(0, 11).map((col) => (
                          <td
                            key={col}
                            className="py-1.5 px-3 text-[#18181B] whitespace-nowrap"
                          >
                            {String(row[col] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* § 2.3 PREPROCESSING & EXPLORATORY DATA ANALYSIS (EDA) PIPELINE & NOTEBOOK INSPECTOR */}
      <section
        aria-label="Preprocessing and Exploratory Data Analysis Notebook Inspector"
        className="bg-[#FAF9F5] border border-[#1C1C1C] rounded-none shadow-none"
      >
        <div className="bg-[#EAE8E0] p-6 border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-serif font-bold tracking-tight text-[#111111]">
              § 2.3 Companion Preprocessing & Exploratory Data Analysis (EDA) Notebook Inspector (
              <span className="font-mono text-sm">igp_eda_preprocessing_ieee.ipynb</span>)
            </h2>
            <p className="text-xs text-stone-600 font-mono mt-1">
              End-to-End Raw-to-Clean Pipeline: INDIA_AQI_COMPLETE_20251126.csv (21 cols) → Physical
              Bounds & Hybrid KNN Imputation → 38-Column Physics Feature Matrix (
              aqi_india_38cols_knn_final.csv)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center border border-[#1C1C1C] bg-[#FAF9F5]">
              <button
                type="button"
                onClick={() => setEdaSubTab('tables-pipeline')}
                className={`px-3.5 py-2 text-xs font-mono uppercase cursor-pointer transition-colors whitespace-nowrap ${
                  edaSubTab === 'tables-pipeline'
                    ? 'bg-[#111111] text-[#FAF9F5] font-bold'
                    : 'text-[#111111] hover:bg-[#EAE8E0]'
                }`}
              >
                01. Pipeline & Imputation Audit
              </button>
              <button
                type="button"
                onClick={() => setEdaSubTab('notebook-cells')}
                className={`px-3.5 py-2 text-xs font-mono uppercase border-l border-[#1C1C1C] cursor-pointer transition-colors whitespace-nowrap ${
                  edaSubTab === 'notebook-cells'
                    ? 'bg-[#111111] text-[#FAF9F5] font-bold'
                    : 'text-[#111111] hover:bg-[#EAE8E0]'
                }`}
              >
                02. Inspect 13 EDA Notebook Cells
              </button>
              <button
                type="button"
                onClick={() => setEdaSubTab('latex-eda')}
                className={`px-3.5 py-2 text-xs font-mono uppercase border-l border-[#1C1C1C] cursor-pointer transition-colors whitespace-nowrap ${
                  edaSubTab === 'latex-eda'
                    ? 'bg-[#111111] text-[#FAF9F5] font-bold'
                    : 'text-[#111111] hover:bg-[#EAE8E0]'
                }`}
              >
                03. EDA LaTeX Manuscript Tables
              </button>
            </div>

            <button
              type="button"
              onClick={handleTriggerEdaDownload}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold bg-[#15803D] hover:bg-[#111111] text-[#FAF9F5] border border-[#1C1C1C] rounded-none cursor-pointer transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD EDA .IPYNB</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 5-Stage Raw-to-38-Col Pipeline Strip */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {EDA_PIPELINE_STAGES.map((st) => (
              <div
                key={st.stageNumber}
                className="p-4 bg-[#F4F3EE] border border-[#1C1C1C] flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#B91C1C] font-bold uppercase">
                    <span>{st.stageNumber}</span>
                    <span className="text-stone-600">{st.outputShape}</span>
                  </div>
                  <div className="text-sm font-serif font-bold text-[#111111] mt-1">
                    {st.title}
                  </div>
                  <p className="text-xs text-stone-700 mt-1 leading-relaxed">{st.keyMethod}</p>
                </div>
                <div className="pt-2 border-t border-[#D4D2C8] text-[11px] font-mono text-[#15803D] font-semibold">
                  {st.keyMetric}
                </div>
              </div>
            ))}
          </div>

          {edaSubTab === 'tables-pipeline' && (
            <div className="space-y-6">
              {/* Table E1: Sensor Missingness, Physical Bounds & Before/After KNN Imputation Verification */}
              <div className="border border-[#1C1C1C] bg-[#FAF9F5]">
                <div className="bg-[#EAE8E0] px-5 py-3.5 border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-serif font-bold text-[#111111]">
                      Table E1: Sensor Missingness Audit, Hardware Bounds Screening & Two-Stage
                      Hybrid KNN Imputation Verification
                    </h3>
                    <p className="text-xs font-mono text-stone-600">
                      Two-sample Kolmogorov-Smirnov (KS) test confirms non-significant distribution
                      drift (p &gt; 0.88) and Augmented Dickey-Fuller (ADF) confirms stationarity
                      (p &lt; 1e-12)
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#15803D]">
                    POST-IMPUTATION NULLS: 0 / 60,000 ROWS
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                    <thead className="bg-[#F4F3EE] border-b border-[#1C1C1C]">
                      <tr className="divide-x divide-[#D4D2C8]">
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">Variable</th>
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">Raw Missing</th>
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">Physical Bounds</th>
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">Glitches Masked</th>
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">Raw Mean ± SD</th>
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">
                          Imputed Mean ± SD
                        </th>
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">
                          KS Invariance (D, p)
                        </th>
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">
                          ADF Stationarity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4D2C8]">
                      {EDA_IMPUTATION_AUDIT_ROWS.map((row) => (
                        <tr
                          key={row.variable}
                          className="divide-x divide-[#D4D2C8] hover:bg-[#EAE8E0]/50"
                        >
                          <td className="py-2 px-3.5 font-bold text-[#111111]">
                            {row.variable}{' '}
                            <span className="text-stone-500 font-normal">({row.unit})</span>
                          </td>
                          <td className="py-2 px-3.5 text-[#B91C1C] font-semibold">
                            {row.rawMissingCount.toLocaleString()} ({row.rawMissingPct}%)
                          </td>
                          <td className="py-2 px-3.5 text-stone-700">{row.physicalBounds}</td>
                          <td className="py-2 px-3.5 text-stone-700">{row.outliersCapped}</td>
                          <td className="py-2 px-3.5 text-[#18181B]">{row.rawMeanStd}</td>
                          <td className="py-2 px-3.5 text-[#1D4ED8] font-semibold">
                            {row.imputedMeanStd}
                          </td>
                          <td className="py-2 px-3.5 text-[#15803D] font-semibold">
                            {row.ksStatPVal}
                          </td>
                          <td className="py-2 px-3.5 text-[#18181B]">{row.adfStatPVal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table E2: Spatio-Temporal Cross-Corridor Lagged Correlation Matrix */}
              <div className="border border-[#1C1C1C] bg-[#FAF9F5]">
                <div className="bg-[#EAE8E0] px-5 py-3.5 border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-serif font-bold text-[#111111]">
                      Table E2: Spatio-Temporal Cross-Corridor PM₂.₅ Lagged Pearson Correlation (0h
                      to 24h Plume Transit Window)
                    </h3>
                    <p className="text-xs font-mono text-stone-600">
                      Empirically validates the 6h–12h 315° NW-to-SE upwind advection lag features (
                      Upwind_Chd_PM25_lag6h &amp; lag12h)
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                    <thead className="bg-[#F4F3EE] border-b border-[#1C1C1C]">
                      <tr className="divide-x divide-[#D4D2C8]">
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">
                          Upwind → Receptor Corridor Pair
                        </th>
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">Distance</th>
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">Lag 0h</th>
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">Lag +3h</th>
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">Lag +6h</th>
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">Lag +9h</th>
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">Lag +12h</th>
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">Lag +18h</th>
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">Lag +24h</th>
                        <th className="py-2.5 px-3.5 font-bold text-[#111111]">
                          Physical Transit Peak
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4D2C8]">
                      {EDA_CORRIDOR_LAG_CORRELATIONS.map((row) => (
                        <tr
                          key={row.upwindPair}
                          className="divide-x divide-[#D4D2C8] hover:bg-[#EAE8E0]/50"
                        >
                          <td className="py-2.5 px-3.5 font-bold text-[#111111]">
                            {row.upwindPair}
                          </td>
                          <td className="py-2.5 px-3.5 text-stone-700">{row.distanceKm} km</td>
                          <td className="py-2.5 px-3.5">{row.rLag0h.toFixed(3)}</td>
                          <td className="py-2.5 px-3.5">{row.rLag3h.toFixed(3)}</td>
                          <td className="py-2.5 px-3.5 font-bold text-[#B91C1C]">
                            {row.rLag6h.toFixed(3)}
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-[#B91C1C]">
                            {row.rLag9h.toFixed(3)}
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-[#1D4ED8]">
                            {row.rLag12h.toFixed(3)}
                          </td>
                          <td className="py-2.5 px-3.5">{row.rLag18h.toFixed(3)}</td>
                          <td className="py-2.5 px-3.5">{row.rLag24h.toFixed(3)}</td>
                          <td className="py-2.5 px-3.5 font-bold text-[#15803D]">
                            {row.optimalLagHrs}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {edaSubTab === 'notebook-cells' && (
            <div className="space-y-4">
              {EDA_PREPROCESSING_NOTEBOOK_CELLS.map((cell, idx) => (
                <div key={cell.id} className="border border-[#1C1C1C] bg-[#F4F3EE]">
                  <div className="bg-[#EAE8E0] px-4 py-2.5 border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 font-mono text-xs">
                      <span className="font-bold text-[#B91C1C]">
                        CELL {idx + 1} [{cell.cellType.toUpperCase()}]
                      </span>
                      <span>·</span>
                      <span className="font-bold text-[#111111]">{cell.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(cell.id, cell.content)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-[#FAF9F5] hover:bg-[#111111] hover:text-[#FAF9F5] text-[#111111] border border-[#1C1C1C] cursor-pointer transition-colors"
                    >
                      {copiedId === cell.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#15803D]" />
                          <span>COPIED CELL</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>COPY CELL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-[#111111] overflow-x-auto leading-relaxed bg-[#FAF9F5]">
                    {cell.content}
                  </pre>
                  {cell.executionOutput && (
                    <div className="border-t border-[#D4D2C8] bg-[#F4F3EE] p-4">
                      <div className="text-[11px] font-mono uppercase text-[#15803D] font-bold mb-1">
                        STDOUT EXECUTION TRACE //
                      </div>
                      <pre className="text-xs font-mono text-stone-800 overflow-x-auto leading-relaxed">
                        {cell.executionOutput}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {edaSubTab === 'latex-eda' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-[#1C1C1C] bg-[#F4F3EE]">
                <div className="bg-[#EAE8E0] px-4 py-3 border-b border-[#1C1C1C] flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-[#111111]">
                    table_eda_imputation_audit.tex (\label&#123;tab:eda_missingness_imputation&#125;)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText('latex-imp', EDA_LATEX_TABLES.imputationAuditTex)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono bg-[#FAF9F5] hover:bg-[#111111] hover:text-[#FAF9F5] text-[#111111] border border-[#1C1C1C] cursor-pointer"
                  >
                    {copiedId === 'latex-imp' ? 'COPIED LATEX' : 'COPY LATEX'}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-[#111111] overflow-x-auto leading-relaxed bg-[#FAF9F5]">
                  {EDA_LATEX_TABLES.imputationAuditTex}
                </pre>
              </div>

              <div className="border border-[#1C1C1C] bg-[#F4F3EE]">
                <div className="bg-[#EAE8E0] px-4 py-3 border-b border-[#1C1C1C] flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-[#111111]">
                    table_eda_corridor_lags.tex (\label&#123;tab:eda_stationarity_corridor_lags&#125;)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText('latex-lag', EDA_LATEX_TABLES.corridorLagTex)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono bg-[#FAF9F5] hover:bg-[#111111] hover:text-[#FAF9F5] text-[#111111] border border-[#1C1C1C] cursor-pointer"
                  >
                    {copiedId === 'latex-lag' ? 'COPIED LATEX' : 'COPY LATEX'}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-[#111111] overflow-x-auto leading-relaxed bg-[#FAF9F5]">
                  {EDA_LATEX_TABLES.corridorLagTex}
                </pre>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

