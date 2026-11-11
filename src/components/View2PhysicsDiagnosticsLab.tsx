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
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
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

interface View2PhysicsDiagnosticsLabProps {
  perturbation: PerturbationState;
  activeNode: NodeLiveTelemetry;
  indices: ReactivePhysicsIndices;
  diurnalHysteresis: DiurnalHysteresisPoint[];
  smokeDustScatter: SmokeDustScatterPoint[];
  parsedCsv: ParsedCsvTelemetrySummary | null;
  onCsvLoaded: (summary: ParsedCsvTelemetrySummary) => void;
}

export const View2PhysicsDiagnosticsLab: React.FC<View2PhysicsDiagnosticsLabProps> = ({
  perturbation,
  activeNode,
  indices,
  diurnalHysteresis,
  smokeDustScatter,
  parsedCsv,
  onCsvLoaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
    </div>
  );
};
