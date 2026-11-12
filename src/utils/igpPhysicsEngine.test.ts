import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeNwAdvectionFlux,
  computeRadiativeInversionIndex,
  computePyrogenicStagnationIndex,
  computeCombustionDustPartition,
  computeSplitConformalCalibration,
  evaluateForecastMetrics,
  generateIgpCorridorSimulation,
} from './igpPhysicsEngine';
import {
  buildIpynbJsonString,
  getNotebookLineStats,
  JUPYTER_NOTEBOOK_CELLS,
} from '../data/jupyterNotebookData';

test('Directional Corridor Plume Advection Vector projects onto 315 deg NW axis and zeroes SE winds', () => {
  // Exact 315 deg NW wind: cos(0) = 1.0
  const nwAligned = computeNwAdvectionFlux(10.0, 315.0, 200.0, 150.0, 1.2);
  assert.equal(nwAligned.u_nw_velocity, 10.0);
  assert.ok(nwAligned.feat_nw_advection_flux > 0);

  // Opposite 135 deg SE wind: cos(180 deg) = -1.0 -> clamped to 0 via max(0, u_nw)
  const seOpposed = computeNwAdvectionFlux(15.0, 135.0, 300.0, 280.0, 1.5);
  assert.ok(seOpposed.u_nw_velocity < 0);
  assert.equal(seOpposed.feat_nw_advection_flux_6h, 0);
  assert.equal(seOpposed.feat_nw_advection_flux_12h, 0);
  assert.equal(seOpposed.feat_nw_advection_flux, 0);
});

test('Radiative Nocturnal Boundary-Layer Inversion Index increases sharply when Solar Radiation drops to zero', () => {
  const daytimeMixing = computeRadiativeInversionIndex(55.0, 1014.0, 26.0, 520.0);
  const nocturnalInversion = computeRadiativeInversionIndex(88.0, 1016.0, 14.0, 0.0);
  assert.ok(
    nocturnalInversion > daytimeMixing * 40,
    `Expected nocturnal RNII (${nocturnalInversion}) >> daytime RNII (${daytimeMixing})`
  );
});

test('Pyrogenic Stagnation Accumulation Index amplifies during Crop_Burning_Season and Wind_Stagnation', () => {
  const baseline = computePyrogenicStagnationIndex(0.6, 0.5, 0, 0, 0, 12.0);
  const pyrogenicStagnant = computePyrogenicStagnationIndex(1.8, 0.78, 1, 1, 1, 1.5);
  assert.ok(pyrogenicStagnant > baseline * 30);
});

test('Combustion vs Crustal Dust Partitioning Index separates fine biomass smoke from coarse mineral dust', () => {
  const biomassSmoke = computeCombustionDustPartition(310.0, 25.0, 360.0, 2400.0, 110.0);
  const mineralDustStorm = computeCombustionDustPartition(140.0, 420.0, 520.0, 400.0, 25.0);
  assert.ok(biomassSmoke > 5.0);
  assert.ok(biomassSmoke > mineralDustStorm * 10);
});

test('Split Conformal Calibration computes finite-sample quantile offset and improves empirical tail coverage', () => {
  const yCal = Array.from({ length: 100 }, (_, i) => 150 + i * 2);
  // Suppose uncalibrated Q90 consistently under-predicts by 18 ug/m3 on top 20%
  const q90Cal = yCal.map((y, i) => (i >= 80 ? y - 18.0 : y + 10.0));
  const cal = computeSplitConformalCalibration(yCal, q90Cal, 0.9);
  assert.equal(cal.conformalOffsetQHat, 18.0);

  // Verify calibrated predictions achieve >= 90% coverage on calibration set
  const calibratedPreds = q90Cal.map((q) => q + cal.conformalOffsetQHat);
  const metrics = evaluateForecastMetrics(yCal, calibratedPreds, 250.0, 0.9);
  assert.ok(metrics.empiricalCoveragePct >= 90.0);
});

test('Simulation engine generates complete 168-hour episode, 7 benchmarks, 5 ablation stages, and cost frontier', () => {
  const sim = generateIgpCorridorSimulation({
    targetCoverage: 0.9,
    costRatioK: 5.0,
    decisionThresholdTau: 220.0,
  });
  assert.equal(sim.episodeSeries.length, 168);
  assert.equal(sim.table1Benchmarks.length, 7);
  assert.equal(sim.table2Ablation.length, 5);
  assert.ok(sim.costFrontier.length >= 15);
  assert.ok(sim.optimalThresholdTauStar >= 170 && sim.optimalThresholdTauStar <= 270);
});

test('buildIpynbJsonString generates valid nbformat v4.5 .ipynb JSON with 13 cells within 500-600 total lines', () => {
  const rawJson = buildIpynbJsonString();
  const parsed = JSON.parse(rawJson);
  assert.equal(parsed.nbformat, 4);
  assert.equal(parsed.nbformat_minor, 5);
  assert.equal(parsed.cells.length, 13);
  assert.equal(parsed.cells[0].cell_type, 'markdown');
  assert.equal(parsed.cells[1].cell_type, 'code');
  assert.ok(Array.isArray(parsed.cells[1].source));
  assert.ok(Array.isArray(parsed.cells[1].outputs));

  const stats = getNotebookLineStats();
  assert.ok(
    stats.totalContentLines >= 500 && stats.totalContentLines <= 600,
    `Expected totalContentLines (${stats.totalContentLines}) to be between 500 and 600`
  );
});

test('Cell 5.2 and Cell 5.3 use raw Python strings (r"...") for LaTeX commands to prevent ASCII Bell (\\a) and Tab (\\t) ParseExceptions', () => {
  const figCell = JUPYTER_NOTEBOOK_CELLS.find((c) => c.id === 'cell-12-figures-code');
  assert.ok(figCell, 'Expected cell-12-figures-code to exist');

  // Verify no non-raw string literal in cell-12 contains \alpha, \tau, \times, or \mu
  const nonRawLatexAssign = /(?:label|title|xlabel|ylabel)=f?"[^"]*\\(?:alpha|tau|times|mu|hat|delta)/;
  assert.equal(
    nonRawLatexAssign.test(figCell.content),
    false,
    'Found non-raw string literal with LaTeX backslash command in cell-12-figures-code'
  );
  assert.ok(figCell.content.includes('label=r"Uncalibrated Quantile ($\\alpha=0.90$)"'));
  assert.ok(figCell.content.includes('label=rf"Optimal $\\tau^* = {TAU_STAR:.0f}\\,\\mu$g/m$^3$"'));
  assert.ok(figCell.content.includes('title=r"(b) Non-Linear SHAP Interaction: RNII $\\times$ PSAI"'));
});

test('Corridor Telemetry Engine computes exact 4 reactive physics equations, CPCB severity scale, and CSV parsing', async () => {
  const {
    getCpcbSeverity,
    computeReactivePhysicsIndices,
    EPISODE_PRESETS,
    buildReactiveSystemState,
    parseCorridorCsvText,
    generateSampleCorridorCsvString,
  } = await import('./corridorTelemetryEngine');

  assert.equal(getCpcbSeverity(22).category, 'Good');
  assert.equal(getCpcbSeverity(285).category, 'CAQM GRAP Stage-IV Severe+');

  const indices = computeReactivePhysicsIndices(
    EPISODE_PRESETS['nov-2024-stubble'].perturbation,
    290,
    380
  );
  assert.ok(indices.phiAdvectionFlux > 0);
  assert.ok(indices.rniiIndex > 1.0);
  assert.ok(indices.psaiIndex > 20.0);
  assert.ok(indices.cdcpIndex > 1.0);

  const state = buildReactiveSystemState(
    EPISODE_PRESETS['nov-2024-stubble'].perturbation,
    'delhi',
    5.0,
    null
  );
  assert.equal(state.forecast72h.length, 72);
  assert.equal(state.shapWaterfall.length, 6);
  assert.ok(state.optimalTauStar >= 120 && state.optimalTauStar <= 320);

  const csvStr = generateSampleCorridorCsvString();
  const parsedCsv = parseCorridorCsvText(csvStr, 'sample_corridor.csv');
  assert.equal(parsedCsv.corridorRowsMatched, 200);
  assert.ok(parsedCsv.detectedColumns.includes('PM2_5_ugm3'));
});

test('EDA & Preprocessing Notebook generator produces valid nbformat v4.5 .ipynb JSON with 13 cells and 38-column pipeline', async () => {
  const {
    buildEdaIpynbJsonString,
    EDA_PREPROCESSING_NOTEBOOK_CELLS,
    EDA_PIPELINE_STAGES,
    EDA_IMPUTATION_AUDIT_ROWS,
  } = await import('../data/edaPreprocessingNotebookData');

  assert.equal(EDA_PREPROCESSING_NOTEBOOK_CELLS.length, 13);
  assert.equal(EDA_PIPELINE_STAGES.length, 5);
  assert.ok(EDA_IMPUTATION_AUDIT_ROWS.length >= 8);

  const jsonStr = buildEdaIpynbJsonString();
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.nbformat, 4);
  assert.equal(parsed.nbformat_minor, 5);
  assert.equal(parsed.cells.length, 13);
  assert.ok(jsonStr.includes('INDIA_AQI_COMPLETE_20251126.csv'));
  assert.ok(jsonStr.includes('KNNImputer'));
  assert.ok(jsonStr.includes('igp_corridor_cleaned_38cols.csv'));
});



