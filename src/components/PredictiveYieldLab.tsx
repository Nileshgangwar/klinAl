import React, { useMemo, useState } from 'react';
import { BrainCircuit, Check, RotateCcw, Save, Wrench } from 'lucide-react';
import { FiringRecipePreset, RefractoryAsset } from '../types/kiln';
import { formatInr } from '../utils/currency';

interface PredictiveYieldLabProps {
  recipes: FiringRecipePreset[];
  onSaveRecipe: (recipe: FiringRecipePreset) => void;
  refractoryAssets: RefractoryAsset[];
  onToggleMaintenance: (assetId: string) => void;
}

export const PredictiveYieldLab: React.FC<PredictiveYieldLabProps> = ({
  recipes,
  onSaveRecipe,
  refractoryAssets,
  onToggleMaintenance,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(recipes[0]?.id ?? 'rec-alumina');
  const activePreset = recipes.find((r) => r.id === selectedPresetId) || recipes[0];

  const [peakTempC, setPeakTempC] = useState<number>(activePreset.peakTempC);
  const [rampRateCPerHr, setRampRateCPerHr] = useState<number>(activePreset.rampRateCPerHr);
  const [soakMinutes, setSoakMinutes] = useState<number>(activePreset.soakMinutes);
  const [oxygenPct, setOxygenPct] = useState<number>(activePreset.oxygenPct);
  const [customName, setCustomName] = useState<string>('');
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  const loadPreset = (preset: FiringRecipePreset) => {
    setSelectedPresetId(preset.id);
    setPeakTempC(preset.peakTempC);
    setRampRateCPerHr(preset.rampRateCPerHr);
    setSoakMinutes(preset.soakMinutes);
    setOxygenPct(preset.oxygenPct);
    setSavedFeedback(false);
  };

  const simulation = useMemo(() => {
    const tempDelta = Math.abs(peakTempC - activePreset.peakTempC);
    const rampPenalty = Math.max(0, (rampRateCPerHr - activePreset.rampRateCPerHr) * 0.045);
    const soakBonus = Math.min(0.8, Math.max(-2.2, (soakMinutes - activePreset.soakMinutes) * 0.012));
    const o2Penalty = Math.abs(oxygenPct - activePreset.oxygenPct) * 0.42;

    const rawYield =
      activePreset.baselineYieldPct - tempDelta * 0.038 - rampPenalty + soakBonus - o2Penalty;
    const predictedYield = Math.min(99.2, Math.max(76.5, rawYield));

    const warpageRisk = Math.min(
      18.0,
      Math.max(0.8, 1.4 + rampPenalty * 1.15 + Math.max(0, peakTempC - activePreset.peakTempC) * 0.04)
    );

    const specificEnergyKwhKg =
      2.1 + (peakTempC / 1400) * 1.45 + (soakMinutes / 120) * 0.35 - (rampRateCPerHr / 180) * 0.18;

    const cycleCostInr = Math.round((specificEnergyKwhKg * 420 + (soakMinutes / 60) * 115) * 84);

    return {
      predictedYield,
      warpageRisk,
      specificEnergyKwhKg,
      cycleCostInr,
    };
  }, [peakTempC, rampRateCPerHr, soakMinutes, oxygenPct, activePreset]);

  const handleSave = () => {
    const newRecipe: FiringRecipePreset = {
      id: `rec-${Date.now()}`,
      name: customName.trim() || `${activePreset.ceramicBody} (${peakTempC}°C)`,
      ceramicBody: activePreset.ceramicBody,
      peakTempC,
      rampRateCPerHr,
      soakMinutes,
      oxygenPct,
      baselineYieldPct: Number(simulation.predictedYield.toFixed(1)),
    };
    onSaveRecipe(newRecipe);
    setSelectedPresetId(newRecipe.id);
    setCustomName('');
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2600);
  };

  // Build simulated thermal curve SVG coordinates (Time 0..16h vs Temp 20..1650C)
  const svgW = 640;
  const svgH = 220;
  const padL = 48;
  const padR = 20;
  const padT = 20;
  const padB = 34;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const rampHours = (peakTempC - 80) / Math.max(30, rampRateCPerHr);
  const soakHours = soakMinutes / 60;
  const coolHours = (peakTempC - 120) / 140;
  const totalHours = Math.max(12, rampHours + soakHours + coolHours);

  const toX = (hrs: number) => padL + (hrs / totalHours) * plotW;
  const toY = (temp: number) => padT + plotH - (temp / 1700) * plotH;

  const simPath = [
    `M ${toX(0).toFixed(1)} ${toY(60).toFixed(1)}`,
    `L ${toX(rampHours * 0.45).toFixed(1)} ${toY(580).toFixed(1)}`,
    `L ${toX(rampHours).toFixed(1)} ${toY(peakTempC).toFixed(1)}`,
    `L ${toX(rampHours + soakHours).toFixed(1)} ${toY(peakTempC).toFixed(1)}`,
    `L ${toX(rampHours + soakHours + coolHours * 0.5).toFixed(1)} ${toY(peakTempC * 0.52).toFixed(1)}`,
    `L ${toX(totalHours).toFixed(1)} ${toY(120).toFixed(1)}`,
  ].join(' ');

  // Safe vitrification band
  const bandTop = toY(activePreset.peakTempC + 18);
  const bandBottom = toY(activePreset.peakTempC - 18);

  return (
    <div className="space-y-6">
      {/* Recipe Selector Header */}
      <div className="bg-white border border-slate-200 rounded-md p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#2563eb]">
              <BrainCircuit className="w-4 h-4" />
              <span>Machine Intelligence Simulation</span>
            </div>
            <h2 className="mt-1 text-lg font-display font-semibold text-[#0b1c30]">
              Predictive Firing Recipe Simulator
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#eff4ff] border border-slate-200 rounded-md">
            {recipes.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => loadPreset(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  r.id === selectedPresetId
                    ? 'bg-white text-[#2563eb] font-semibold border border-[#bfdbfe]'
                    : 'text-slate-600 hover:text-[#0b1c30]'
                }`}
              >
                {r.ceramicBody}
              </button>
            ))}
          </div>
        </div>

        {/* 12-Col Simulator Split */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 5 Cols: Sliders & Inputs */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="peak-temp" className="font-medium text-[#0b1c30]">
                  Peak Sintering Temperature
                </label>
                <span className="font-mono font-semibold tabular-nums text-[#2563eb]">
                  {peakTempC}°C
                </span>
              </div>
              <input
                id="peak-temp"
                type="range"
                min={1100}
                max={1580}
                step={2}
                value={peakTempC}
                onChange={(e) => setPeakTempC(Number(e.target.value))}
                className="w-full accent-[#2563eb] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>1,100°C</span>
                <span>Baseline {activePreset.peakTempC}°C</span>
                <span>1,580°C</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="ramp-rate" className="font-medium text-[#0b1c30]">
                  Heating Ramp Rate
                </label>
                <span className="font-mono font-semibold tabular-nums text-[#2563eb]">
                  {rampRateCPerHr} °C/hr
                </span>
              </div>
              <input
                id="ramp-rate"
                type="range"
                min={45}
                max={180}
                step={5}
                value={rampRateCPerHr}
                onChange={(e) => setRampRateCPerHr(Number(e.target.value))}
                className="w-full accent-[#2563eb] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>45 °C/hr</span>
                <span>180 °C/hr</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="soak-duration" className="font-medium text-[#0b1c30]">
                  Isothermal Soak Duration
                </label>
                <span className="font-mono font-semibold tabular-nums text-[#2563eb]">
                  {soakMinutes} min
                </span>
              </div>
              <input
                id="soak-duration"
                type="range"
                min={30}
                max={240}
                step={5}
                value={soakMinutes}
                onChange={(e) => setSoakMinutes(Number(e.target.value))}
                className="w-full accent-[#2563eb] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>30 min</span>
                <span>240 min</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="o2-atmos" className="font-medium text-[#0b1c30]">
                  Kiln Atmosphere O₂
                </label>
                <span className="font-mono font-semibold tabular-nums text-[#2563eb]">
                  {oxygenPct.toFixed(1)}%
                </span>
              </div>
              <input
                id="o2-atmos"
                type="range"
                min={1.5}
                max={8.5}
                step={0.1}
                value={oxygenPct}
                onChange={(e) => setOxygenPct(Number(e.target.value))}
                className="w-full accent-[#2563eb] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>1.5% Reducing</span>
                <span>8.5% Oxidizing</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Custom recipe label..."
                className="flex-1 min-w-[160px] px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#2563eb]"
              />
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563eb] hover:bg-[#0051d5] text-white text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {savedFeedback ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{savedFeedback ? 'Recipe Saved' : 'Save Optimal Recipe'}</span>
              </button>
              <button
                type="button"
                onClick={() => loadPreset(activePreset)}
                aria-label="Reset parameters to preset"
                className="p-2 text-slate-500 hover:text-[#0b1c30] border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right 7 Cols: Predicted Metrics + Vitrification Curve SVG */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-[#eff4ff]/65 border border-[#bfdbfe] rounded">
                <span className="text-[11px] font-medium text-[#2563eb] block">
                  Predicted Yield
                </span>
                <span className="mt-1 block text-xl font-mono font-bold tabular-nums text-[#2563eb]">
                  {simulation.predictedYield.toFixed(1)}%
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Warpage Risk
                </span>
                <span
                  className={`mt-1 block text-xl font-mono font-bold tabular-nums ${
                    simulation.warpageRisk > 5 ? 'text-[#ba1a1a]' : 'text-[#0b1c30]'
                  }`}
                >
                  {simulation.warpageRisk.toFixed(1)}%
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Specific Energy
                </span>
                <span className="mt-1 block text-xl font-mono font-bold tabular-nums text-[#0b1c30]">
                  {simulation.specificEnergyKwhKg.toFixed(2)}
                  <span className="text-xs font-normal text-slate-500 ml-1">kWh/kg</span>
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Est. Cycle Cost
                </span>
                <span className="mt-1 block text-xl font-mono font-bold tabular-nums text-[#0b1c30]">
                  {formatInr(simulation.cycleCostInr)}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded p-4 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-3">
                <span className="font-medium text-[#0b1c30]">
                  Simulated Time-Temperature Trajectory ({totalHours.toFixed(1)}h cycle)
                </span>
                <span className="text-[#2563eb] font-mono tabular-nums">
                  Target Vitrification Window: {activePreset.peakTempC - 18}°C –{' '}
                  {activePreset.peakTempC + 18}°C
                </span>
              </div>

              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
                {[400, 800, 1200, 1600].map((t) => (
                  <g key={t}>
                    <line
                      x1={padL}
                      y1={toY(t)}
                      x2={svgW - padR}
                      y2={toY(t)}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                    <text
                      x={padL - 8}
                      y={toY(t) + 4}
                      textAnchor="end"
                      className="fill-slate-400 text-[10px] font-mono tabular-nums"
                    >
                      {t}°
                    </text>
                  </g>
                ))}

                {/* Optimal Sintering Band */}
                <rect
                  x={padL}
                  y={bandTop}
                  width={plotW}
                  height={Math.max(4, bandBottom - bandTop)}
                  fill="#dbeafe"
                  opacity="0.7"
                />

                {/* Simulated Curve */}
                <path
                  d={simPath}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Peak Hold Highlight */}
                <circle
                  cx={toX(rampHours)}
                  cy={toY(peakTempC)}
                  r="4.5"
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <circle
                  cx={toX(rampHours + soakHours)}
                  cy={toY(peakTempC)}
                  r="4.5"
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                <text
                  x={padL}
                  y={svgH - 8}
                  className="fill-slate-500 text-[10px] font-mono tabular-nums"
                >
                  0h Start
                </text>
                <text
                  x={toX(rampHours)}
                  y={svgH - 8}
                  textAnchor="middle"
                  className="fill-[#2563eb] text-[10px] font-mono tabular-nums"
                >
                  {rampHours.toFixed(1)}h Soak Start
                </text>
                <text
                  x={svgW - padR}
                  y={svgH - 8}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px] font-mono tabular-nums"
                >
                  {totalHours.toFixed(1)}h Unload
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Refractory Wear & Maintenance Forecast Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-display font-semibold text-[#0b1c30]">
              Refractory & Thermocouple Lifespan Forecast
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Predictive wear modeling based on cumulative thermal shock cycles and peak soak hours
            </p>
          </div>
          <Wrench className="w-4 h-4 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 tracking-wide">
                <th className="py-2.5 px-5">Kiln Unit</th>
                <th className="py-2.5 px-4">Refractory / Sensor Asset</th>
                <th className="py-2.5 px-4">Cycle Usage</th>
                <th className="py-2.5 px-4 text-right">Est. Remaining</th>
                <th className="py-2.5 px-4">Recommended Window</th>
                <th className="py-2.5 px-5 text-right">Work Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {refractoryAssets.map((asset) => {
                const pctUsed = Math.round((asset.cyclesCompleted / asset.ratedCycles) * 100);
                return (
                  <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-5 font-medium text-[#0b1c30] whitespace-nowrap">
                      {asset.kilnName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-[#0b1c30]">{asset.component}</span>
                      <span className="block text-xs text-slate-500">{asset.materialSpec}</span>
                    </td>
                    <td className="py-3 px-4 min-w-[160px]">
                      <div className="flex justify-between text-xs font-mono tabular-nums text-slate-600 mb-1">
                        <span>
                          {asset.cyclesCompleted} / {asset.ratedCycles} cycles
                        </span>
                        <span>{pctUsed}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pctUsed > 85 ? 'bg-[#e06d3b]' : 'bg-[#2563eb]'
                          }`}
                          style={{ width: `${pctUsed}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-[#0b1c30] whitespace-nowrap">
                      {asset.remainingDays} days
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{asset.scheduledAction}</td>
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onToggleMaintenance(asset.id)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          asset.maintenanceBooked
                            ? 'bg-[#eff4ff] text-[#2563eb] border border-[#bfdbfe]'
                            : 'bg-white border border-slate-200 text-[#0b1c30] hover:bg-slate-50'
                        }`}
                      >
                        {asset.maintenanceBooked ? 'Work Order Scheduled' : 'Schedule Swap'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
