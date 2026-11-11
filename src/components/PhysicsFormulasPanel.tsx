import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  computeNwAdvectionFlux,
  computeRadiativeInversionIndex,
  computePyrogenicStagnationIndex,
  computeCombustionDustPartition,
} from '../utils/igpPhysicsEngine';

export const PhysicsFormulasPanel: React.FC = () => {
  const [windSpeed, setWindSpeed] = useState<number>(3.2);
  const [windDir, setWindDir] = useState<number>(315);
  const [chdPm25Lag6, setChdPm25Lag6] = useState<number>(285);
  const [chdPm25Lag12, setChdPm25Lag12] = useState<number>(240);
  const [chdAodLag6, setChdAodLag6] = useState<number>(1.85);

  const [temp2m, setTemp2m] = useState<number>(13.5);
  const [humidity, setHumidity] = useState<number>(88);
  const [pressureMsl, setPressureMsl] = useState<number>(1016.4);
  const [solarRad, setSolarRad] = useState<number>(0);

  const [aod, setAod] = useState<number>(1.92);
  const [pmRatio, setPmRatio] = useState<number>(0.76);
  const [cropBurning, setCropBurning] = useState<number>(1);
  const [festivalPeriod, setFestivalPeriod] = useState<number>(1);

  const [delhiPm25, setDelhiPm25] = useState<number>(328);
  const [delhiPm10, setDelhiPm10] = useState<number>(430);
  const [dustUgm3, setDustUgm3] = useState<number>(38);
  const [coUgm3, setCoUgm3] = useState<number>(2450);
  const [no2Ugm3, setNo2Ugm3] = useState<number>(112);

  const windStagnation = windSpeed < 4.5 ? 1 : 0;

  const advResult = computeNwAdvectionFlux(
    windSpeed,
    windDir,
    chdPm25Lag6,
    chdPm25Lag12,
    chdAodLag6
  );
  const rniiVal = computeRadiativeInversionIndex(humidity, pressureMsl, temp2m, solarRad);
  const psaiVal = computePyrogenicStagnationIndex(
    aod,
    pmRatio,
    cropBurning,
    festivalPeriod,
    windStagnation,
    windSpeed
  );
  const cdcpVal = computeCombustionDustPartition(
    delhiPm25,
    dustUgm3,
    delhiPm10,
    coUgm3,
    no2Ugm3
  );

  const handleResetToNocturnalSpike = () => {
    setWindSpeed(3.2);
    setWindDir(315);
    setChdPm25Lag6(285);
    setChdPm25Lag12(240);
    setChdAodLag6(1.85);
    setTemp2m(13.5);
    setHumidity(88);
    setPressureMsl(1016.4);
    setSolarRad(0);
    setAod(1.92);
    setPmRatio(0.76);
    setCropBurning(1);
    setFestivalPeriod(1);
    setDelhiPm25(328);
    setDelhiPm10(430);
    setDustUgm3(38);
    setCoUgm3(2450);
    setNo2Ugm3(112);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Domain-Specific Atmospheric Physics & Spatiotemporal Feature Formulations
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Interactive verification of the 4 physical feature equations using Option 1 schema columns for target station `Delhi` and upwind node `Chandigarh`
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetToNocturnalSpike}
          className="px-3.5 py-2 text-xs font-medium bg-slate-100 text-slate-900 border border-slate-300 hover:bg-slate-200 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Nocturnal GRAP-IV Preset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Directional Corridor Plume Advection Vector */}
        <section className="bg-white border border-slate-200 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                01. Directional Corridor Plume Advection Vector (`feat_nw_advection_flux`)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Projects 10m wind onto the 315° NW-to-SE IGP axis & couples with 6h/12h lagged Chandigarh PM2.5 and AOD
              </p>
            </div>
            <div className="text-right font-mono tabular-nums shrink-0">
              <div className="text-xs text-slate-500">Advection Flux</div>
              <div className="text-xl font-bold text-sky-800">
                {advResult.feat_nw_advection_flux.toFixed(2)}
              </div>
            </div>
          </div>

          <pre className="p-3 bg-slate-950 text-slate-100 text-[11px] font-mono whitespace-pre-wrap leading-relaxed">
            <code>{`u_nw = Wind_Speed_10m_kmh * cos(radians(Wind_Dir_10m - 315))\nfeat_nw_advection_flux = max(0, u_nw) * (0.6*Chd_PM25_6h + 0.4*Chd_PM25_12h) * Chd_AOD_6h / 100`}</code>
          </pre>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <label className="block space-y-1">
              <span className="text-slate-700 font-medium flex justify-between">
                <span>Wind_Dir_10m (°)</span>
                <span className="font-mono">{windDir}°</span>
              </span>
              <input
                type="range"
                min={0}
                max={360}
                value={windDir}
                onChange={(e) => setWindDir(Number(e.target.value))}
                className="w-full accent-sky-700"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-slate-700 font-medium flex justify-between">
                <span>Wind_Speed_10m (km/h)</span>
                <span className="font-mono">{windSpeed.toFixed(1)}</span>
              </span>
              <input
                type="range"
                min={0.5}
                max={25}
                step={0.5}
                value={windSpeed}
                onChange={(e) => setWindSpeed(Number(e.target.value))}
                className="w-full accent-sky-700"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-slate-700 font-medium flex justify-between">
                <span>Chd PM2.5 (t-6h)</span>
                <span className="font-mono">{chdPm25Lag6} µg/m³</span>
              </span>
              <input
                type="range"
                min={30}
                max={450}
                step={5}
                value={chdPm25Lag6}
                onChange={(e) => setChdPm25Lag6(Number(e.target.value))}
                className="w-full accent-sky-700"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-slate-700 font-medium flex justify-between">
                <span>Chd AOD (t-6h)</span>
                <span className="font-mono">{chdAodLag6.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={0.2}
                max={3.2}
                step={0.05}
                value={chdAodLag6}
                onChange={(e) => setChdAodLag6(Number(e.target.value))}
                className="w-full accent-sky-700"
              />
            </label>
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs font-mono text-slate-600 flex justify-between">
            <span>Projected Velocity u_nw(315°): {advResult.u_nw_velocity.toFixed(2)} km/h</span>
            <span>6h Plume Component: {advResult.feat_nw_advection_flux_6h.toFixed(1)}</span>
          </div>
        </section>

        {/* 2. Radiative Nocturnal Boundary-Layer Inversion Index */}
        <section className="bg-white border border-slate-200 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                02. Radiative Nocturnal Boundary-Layer Inversion Index (`RNII`)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Models Planetary Boundary Layer (PBL) collapse after sunset when Solar_Radiation_Wm2 drops to zero
              </p>
            </div>
            <div className="text-right font-mono tabular-nums shrink-0">
              <div className="text-xs text-slate-500">RNII (×100)</div>
              <div className="text-xl font-bold text-rose-700">
                {(rniiVal * 100).toFixed(2)}
              </div>
            </div>
          </div>

          <pre className="p-3 bg-slate-950 text-slate-100 text-[11px] font-mono whitespace-pre-wrap leading-relaxed">
            <code>{`feat_radiative_inversion_index =\n  (Humidity_Percent * (Pressure_MSL_hPa - 990)) / ((Temp_2m_C + 273.15) * (Solar_Radiation_Wm2 + 10.0))`}</code>
          </pre>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <label className="block space-y-1">
              <span className="text-slate-700 font-medium flex justify-between">
                <span>Solar_Radiation (W/m²)</span>
                <span className="font-mono">{solarRad} W/m²</span>
              </span>
              <input
                type="range"
                min={0}
                max={650}
                step={10}
                value={solarRad}
                onChange={(e) => setSolarRad(Number(e.target.value))}
                className="w-full accent-sky-700"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-slate-700 font-medium flex justify-between">
                <span>Temp_2m_C (°C)</span>
                <span className="font-mono">{temp2m.toFixed(1)} °C</span>
              </span>
              <input
                type="range"
                min={5}
                max={35}
                step={0.5}
                value={temp2m}
                onChange={(e) => setTemp2m(Number(e.target.value))}
                className="w-full accent-sky-700"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-slate-700 font-medium flex justify-between">
                <span>Humidity_Percent (%)</span>
                <span className="font-mono">{humidity}%</span>
              </span>
              <input
                type="range"
                min={20}
                max={99}
                value={humidity}
                onChange={(e) => setHumidity(Number(e.target.value))}
                className="w-full accent-sky-700"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-slate-700 font-medium flex justify-between">
                <span>Pressure_MSL (hPa)</span>
                <span className="font-mono">{pressureMsl.toFixed(1)}</span>
              </span>
              <input
                type="range"
                min={995}
                max={1026}
                step={0.5}
                value={pressureMsl}
                onChange={(e) => setPressureMsl(Number(e.target.value))}
                className="w-full accent-sky-700"
              />
            </label>
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs font-mono text-slate-600 flex justify-between">
            <span>Raw RNII Value: {rniiVal.toFixed(5)}</span>
            <span>Regime: {solarRad === 0 ? 'Nocturnal Radiative Inversion' : 'Daytime Convective Mixing'}</span>
          </div>
        </section>

        {/* 3. Pyrogenic Stagnation Accumulation Index */}
        <section className="bg-white border border-slate-200 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                03. Pyrogenic Stagnation Accumulation Index (`PSAI`)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Combines satellite AOD, fine-mode fraction, and episodic crop/festival emissions under stagnant winds
              </p>
            </div>
            <div className="text-right font-mono tabular-nums shrink-0">
              <div className="text-xs text-slate-500">PSAI Score</div>
              <div className="text-xl font-bold text-amber-700">
                {psaiVal.toFixed(3)}
              </div>
            </div>
          </div>

          <pre className="p-3 bg-slate-950 text-slate-100 text-[11px] font-mono whitespace-pre-wrap leading-relaxed">
            <code>{`feat_pyrogenic_stagnation_index =\n  (AOD * PM_Ratio * (1 + 1.5*Crop_Burning_Season + 0.8*Festival_Period) * (1 + Wind_Stagnation)) / (Wind_Speed_10m_kmh + 1.0)`}</code>
          </pre>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <label className="block space-y-1">
              <span className="text-slate-700 font-medium flex justify-between">
                <span>Satellite AOD</span>
                <span className="font-mono">{aod.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={0.2}
                max={3.4}
                step={0.05}
                value={aod}
                onChange={(e) => setAod(Number(e.target.value))}
                className="w-full accent-sky-700"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-slate-700 font-medium flex justify-between">
                <span>Fine-Mode PM_Ratio</span>
                <span className="font-mono">{pmRatio.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={0.25}
                max={0.9}
                step={0.02}
                value={pmRatio}
                onChange={(e) => setPmRatio(Number(e.target.value))}
                className="w-full accent-sky-700"
              />
            </label>
            <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Crop_Burning_Season</span>
              <button
                type="button"
                onClick={() => setCropBurning(cropBurning === 1 ? 0 : 1)}
                className={`px-2.5 py-1 font-mono text-xs cursor-pointer ${
                  cropBurning === 1 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {cropBurning === 1 ? 'Active (1)' : 'Inactive (0)'}
              </button>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Festival_Period</span>
              <button
                type="button"
                onClick={() => setFestivalPeriod(festivalPeriod === 1 ? 0 : 1)}
                className={`px-2.5 py-1 font-mono text-xs cursor-pointer ${
                  festivalPeriod === 1 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {festivalPeriod === 1 ? 'Active (1)' : 'Inactive (0)'}
              </button>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs font-mono text-slate-600 flex justify-between">
            <span>Wind_Stagnation Flag: {windStagnation}</span>
            <span>Episodic Multiplier: {(1 + 1.5 * cropBurning + 0.8 * festivalPeriod).toFixed(1)}×</span>
          </div>
        </section>

        {/* 4. Combustion vs. Crustal Dust Partitioning Index */}
        <section className="bg-white border border-slate-200 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                04. Combustion vs. Crustal Dust Partitioning Index (`CDCP`)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Separates fine secondary/biomass smoke from coarse mineral desert dust using log1p(CO + NO2)
              </p>
            </div>
            <div className="text-right font-mono tabular-nums shrink-0">
              <div className="text-xs text-slate-500">CDCP Index</div>
              <div className="text-xl font-bold text-emerald-800">
                {cdcpVal.toFixed(3)}
              </div>
            </div>
          </div>

          <pre className="p-3 bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
            <code>{`feat_combustion_dust_partition =\n  ((PM2_5_ugm3 - 0.3 * Dust_ugm3) / (PM10_ugm3 + 1.0)) * log1p(CO_ugm3 + NO2_ugm3)`}</code>
          </pre>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <label className="block space-y-1">
              <span className="text-slate-700 font-medium flex justify-between">
                <span>PM2_5_ugm3</span>
                <span className="font-mono">{delhiPm25} µg/m³</span>
              </span>
              <input
                type="range"
                min={30}
                max={550}
                step={5}
                value={delhiPm25}
                onChange={(e) => setDelhiPm25(Number(e.target.value))}
                className="w-full accent-sky-700"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-slate-700 font-medium flex justify-between">
                <span>Dust_ugm3 (Mineral)</span>
                <span className="font-mono">{dustUgm3} µg/m³</span>
              </span>
              <input
                type="range"
                min={5}
                max={400}
                step={5}
                value={dustUgm3}
                onChange={(e) => setDustUgm3(Number(e.target.value))}
                className="w-full accent-sky-700"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-slate-700 font-medium flex justify-between">
                <span>CO_ugm3</span>
                <span className="font-mono">{coUgm3} µg/m³</span>
              </span>
              <input
                type="range"
                min={200}
                max={5000}
                step={50}
                value={coUgm3}
                onChange={(e) => setCoUgm3(Number(e.target.value))}
                className="w-full accent-sky-700"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-slate-700 font-medium flex justify-between">
                <span>NO2_ugm3</span>
                <span className="font-mono">{no2Ugm3} µg/m³</span>
              </span>
              <input
                type="range"
                min={10}
                max={240}
                step={2}
                value={no2Ugm3}
                onChange={(e) => setNo2Ugm3(Number(e.target.value))}
                className="w-full accent-sky-700"
              />
            </label>
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs font-mono text-slate-600 flex justify-between">
            <span>Gaseous Factor log1p(CO+NO2): {Math.log1p(coUgm3 + no2Ugm3).toFixed(2)}</span>
            <span>Aerosol Source: {cdcpVal > 3.5 ? 'Pyrogenic / Secondary Combustion' : 'Crustal / Mixed Dust'}</span>
          </div>
        </section>
      </div>
    </div>
  );
};
