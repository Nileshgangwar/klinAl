import React from 'react';
import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  Check,
  Flame,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  AIAdvisory,
  AppScreen,
  BatchStatus,
  FiringBatch,
  KilnState,
  KilnUnit,
} from '../types/kiln';
import { ThermalCurveChart } from './ThermalCurveChart';
import { formatInr } from '../utils/currency';

interface OperationsOverviewProps {
  kilns: KilnUnit[];
  selectedKilnId: string;
  onSelectKiln: (kilnId: string) => void;
  advisories: AIAdvisory[];
  onApplyAdvisory: (advisoryId: string) => void;
  onDismissAdvisory: (advisoryId: string) => void;
  batches: FiringBatch[];
  onInspectBatch: (batch: FiringBatch) => void;
  onNavigate: (screen: AppScreen) => void;
  onOpenChatbot: () => void;
}

export const OperationsOverview: React.FC<OperationsOverviewProps> = ({
  kilns,
  selectedKilnId,
  onSelectKiln,
  advisories,
  onApplyAdvisory,
  onDismissAdvisory,
  batches,
  onInspectBatch,
  onNavigate,
  onOpenChatbot,
}) => {
  const selectedKiln = kilns.find((k) => k.id === selectedKilnId) || kilns[0];
  const activeAdvisories = advisories.filter((a) => !a.resolved);

  const activeKilnsCount = kilns.filter((k) => k.state !== KilnState.STANDBY).length;
  const avgEfficiency =
    kilns.reduce((acc, k) => acc + k.thermalEfficiencyPct, 0) / (kilns.length || 1);
  const avgPredictedYield =
    kilns.reduce((acc, k) => acc + k.predictedYieldPct, 0) / (kilns.length || 1);
  const totalGasFlow = kilns.reduce((acc, k) => acc + k.gasFlowM3Hr, 0);
  const energyCostPerTonInr = (148.2 - (avgEfficiency - 82) * 2.4) * 84;

  const activeBatches = batches.filter(
    (b) => b.status === BatchStatus.FIRING || b.status === BatchStatus.COOLING
  );

  return (
    <div className="space-y-6">
      {/* 4-Column Operational KPI Strip */}
      <section aria-label="Plant Telemetry Summary" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Active Kilns Firing</span>
            <Flame className="w-4 h-4 text-[#9f3c16]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold tracking-tight text-[#0b1c30] font-mono tabular-nums">
              {activeKilnsCount} / {kilns.length}
            </span>
            <span className="text-xs text-slate-500">units online</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 font-mono tabular-nums">
            {totalGasFlow.toFixed(1)} m³/hr aggregate gas load
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Mean Thermal Efficiency</span>
            <Activity className="w-4 h-4 text-[#e06d3b]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold tracking-tight text-[#0b1c30] font-mono tabular-nums">
              {avgEfficiency.toFixed(1)}%
            </span>
            <span className="text-xs font-medium text-[#15803d]">+1.8% vs baseline</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Recuperative heat recovery active across 5 lines
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#2563eb]">
            <span>AI-Predicted First-Pass Yield</span>
            <BrainCircuit className="w-4 h-4 text-[#2563eb]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold tracking-tight text-[#2563eb] font-mono tabular-nums">
              {avgPredictedYield.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500">across active lots</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {activeAdvisories.length} prescriptive zone trims available
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Energy Cost / Metric Ton</span>
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold tracking-tight text-[#0b1c30] font-mono tabular-nums">
              {formatInr(energyCostPerTonInr, 0)}
            </span>
            <span className="text-xs font-medium text-[#15803d]">-4.2% off-peak</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Spot natural gas + off-peak shuttle dispatch
          </p>
        </div>
      </section>

      {/* Main 12-Column Split: Thermal Curve (8 cols) + AI Advisories (4 cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left 8 Cols: Kiln Fleet Selector & Live Zone Profile */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-md p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-display font-semibold text-[#0b1c30]">
                  Thermal Fleet Matrix & Zone Profile
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a kiln unit to compare live sensor telemetry against AI firing trajectories
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(AppScreen.KILN_CONTROL)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9f3c16] hover:text-[#822801] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Open Zone Controls</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Kiln Selection Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
              {kilns.map((kiln) => {
                const isSelected = kiln.id === selectedKiln?.id;
                return (
                  <button
                    key={kiln.id}
                    type="button"
                    onClick={() => onSelectKiln(kiln.id)}
                    className={`text-left p-2.5 rounded border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#eff4ff] border-[#9f3c16] text-[#0b1c30]'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold font-mono">{kiln.shortCode}</span>
                      <span
                        className={`text-[11px] font-medium ${
                          kiln.state === KilnState.FIRING
                            ? 'text-[#e06d3b]'
                            : kiln.state === KilnState.SOAKING
                            ? 'text-[#9f3c16]'
                            : 'text-[#2563eb]'
                        }`}
                      >
                        {kiln.state}
                      </span>
                    </div>
                    <div className="mt-1 text-base font-mono font-bold tabular-nums text-[#0b1c30]">
                      {kiln.peakTempC}°C
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {kiln.facilityName} · {kiln.activeBatchId}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedKiln && (
              <ThermalCurveChart
                zones={selectedKiln.zones}
                kilnName={selectedKiln.name}
                showAiOptimal={true}
              />
            )}
          </div>

          {/* Authoritative Dark Telemetry Bar at Footer of Chart */}
          {selectedKiln && (
            <div className="mt-4 bg-[#0b1c30] text-[#eaf1ff] rounded px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold text-white">{selectedKiln.name}</span>
                <span className="text-slate-400">·</span>
                <span>{selectedKiln.ceramicBody}</span>
                <span className="text-slate-400">·</span>
                <span>Batch {selectedKiln.activeBatchId}</span>
              </div>
              <div className="flex flex-wrap items-center gap-5 font-mono tabular-nums">
                <span>Draft: {selectedKiln.draftPressurePa} Pa</span>
                <span>Exhaust O₂: {selectedKiln.exhaustO2Pct}%</span>
                <span>Flow: {selectedKiln.gasFlowM3Hr} m³/hr</span>
                <span className="text-[#93c5fd] font-semibold">
                  AI Yield: {selectedKiln.predictedYieldPct.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Predictive AI Advisories (AI Electric Blue #2563EB) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-md p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#2563eb]" />
              <h2 className="text-base font-display font-semibold text-[#0b1c30]">
                Predictive Advisories
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono tabular-nums text-[#2563eb] font-semibold">
                {activeAdvisories.length} open
              </span>
              <button
                type="button"
                onClick={onOpenChatbot}
                className="text-xs font-medium text-[#2563eb] hover:text-[#0051d5] underline underline-offset-2 cursor-pointer whitespace-nowrap"
              >
                Ask Copilot
              </button>
            </div>
          </div>

          <div className="mt-3 flex-1 space-y-3 overflow-y-auto max-h-[430px] pr-0.5">
            {advisories.length === 0 || activeAdvisories.length === 0 ? (
              <div className="py-10 text-center">
                <Check className="w-6 h-6 text-[#2563eb] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#0b1c30]">All thermal zones synchronized</p>
                <p className="text-xs text-slate-500 mt-1">
                  Active kilns are tracking within 0.4% of AI optimal firing trajectories.
                </p>
              </div>
            ) : (
              advisories.map((adv) => (
                <div
                  key={adv.id}
                  className={`p-3.5 rounded border transition-colors ${
                    adv.resolved
                      ? 'bg-slate-50 border-slate-200 opacity-70'
                      : 'bg-[#eff4ff]/55 border-[#bfdbfe]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] font-medium">
                    <span className="text-[#2563eb]">
                      {adv.kilnName} · {adv.zoneLabel}
                    </span>
                    <span className="text-slate-500">{adv.severity}</span>
                  </div>

                  <p className="mt-1.5 text-sm font-semibold text-[#0b1c30] leading-snug">
                    {adv.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{adv.rationale}</p>

                  <div className="mt-2.5 text-xs font-mono tabular-nums font-semibold text-[#0051d5]">
                    {adv.impactMetric}
                  </div>

                  {!adv.resolved ? (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onApplyAdvisory(adv.id)}
                        className="px-3 py-1.5 bg-[#2563eb] hover:bg-[#0051d5] text-white text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Apply AI Trim
                      </button>
                      <button
                        type="button"
                        onClick={() => onDismissAdvisory(adv.id)}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-[#0b1c30] hover:bg-slate-100 rounded transition-colors cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Dismiss</span>
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-[#15803d]">
                      <Check className="w-3.5 h-3.5" />
                      <span>Applied to kiln PLC setpoint</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Active Firing Schedule Compact Data Grid */}
      <section className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-display font-semibold text-[#0b1c30]">
              Active Firing Schedule
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any live batch row to inspect shrinkage, porosity, and thermal curve adherence
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(AppScreen.BATCH_LEDGER)}
            className="text-xs font-medium text-[#9f3c16] hover:text-[#822801] inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Full Batch Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 tracking-wide">
                <th className="py-2.5 px-5">Batch</th>
                <th className="py-2.5 px-4">Ceramic Formulation</th>
                <th className="py-2.5 px-4">Facility / Kiln</th>
                <th className="py-2.5 px-4 text-right">Peak Temp</th>
                <th className="py-2.5 px-4">Cycle Progress</th>
                <th className="py-2.5 px-4 text-right">AI Yield</th>
                <th className="py-2.5 px-5 text-right">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {activeBatches.map((batch) => {
                const progressPct = Math.min(
                  100,
                  Math.round((batch.elapsedHrs / batch.cycleDurationHrs) * 100)
                );
                const remainingHrs = Math.max(0, batch.cycleDurationHrs - batch.elapsedHrs);

                return (
                  <tr
                    key={batch.id}
                    onClick={() => onInspectBatch(batch)}
                    className="hover:bg-[#eff4ff]/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-5 font-mono font-semibold text-[#0b1c30] tabular-nums whitespace-nowrap">
                      {batch.id}
                      <span className="block text-[11px] font-normal text-slate-500">
                        {batch.orderRef}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#0b1c30]">
                      {batch.ceramicBody}
                      <span className="block text-xs font-normal text-slate-500">
                        {batch.coneTarget} · Target porosity {batch.porosityPct}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {batch.kilnName}
                      <span className="block text-xs text-slate-500">{batch.facilityName}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[#0b1c30] tabular-nums whitespace-nowrap">
                      {batch.peakTempC}°C
                    </td>
                    <td className="py-3 px-4 min-w-[170px]">
                      <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-600 mb-1">
                        <span>{progressPct}%</span>
                        <span>{remainingHrs.toFixed(1)}h left</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            batch.status === BatchStatus.COOLING ? 'bg-[#2563eb]' : 'bg-[#e06d3b]'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[#2563eb] tabular-nums whitespace-nowrap">
                      {batch.predictedYieldPct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold ${
                          batch.status === BatchStatus.FIRING
                            ? 'text-[#e06d3b]'
                            : 'text-[#2563eb]'
                        }`}
                      >
                        {batch.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
