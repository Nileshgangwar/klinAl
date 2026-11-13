import React, { useState } from 'react';
import { BrainCircuit, Check, Package, Zap } from 'lucide-react';
import { ENERGY_SCHEDULE_24H } from '../data/kilnData';
import { RawMaterialSilo } from '../types/kiln';
import { formatInr } from '../utils/currency';

interface EnergySupplyViewProps {
  silos: RawMaterialSilo[];
  onIssueRestockPo: (siloId: string) => void;
}

export const EnergySupplyView: React.FC<EnergySupplyViewProps> = ({
  silos,
  onIssueRestockPo,
}) => {
  const [aiTariffShiftEnabled, setAiTariffShiftEnabled] = useState(true);

  const maxLoad = 22;
  const estimatedDailySavingsInr = aiTariffShiftEnabled ? 154560 : 0;

  return (
    <div className="space-y-6">
      {/* 24-Hour Natural Gas & Tariff Load Balancing */}
      <section className="bg-white border border-slate-200 rounded-md p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Zap className="w-4 h-4 text-[#e06d3b]" />
              <span>Energy & Tariff Dispatch</span>
            </div>
            <h2 className="mt-1 text-lg font-display font-semibold text-[#0b1c30]">
              24-Hour Natural Gas & Spot Tariff Profile
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right">
              <span className="block text-[11px] text-slate-500">AI Off-Peak Dispatch Savings</span>
              <span className="font-mono font-bold text-lg tabular-nums text-[#2563eb]">
                {formatInr(estimatedDailySavingsInr)} / day
              </span>
            </div>

            <button
              type="button"
              onClick={() => setAiTariffShiftEnabled((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                aiTariffShiftEnabled
                  ? 'bg-[#2563eb] text-white hover:bg-[#0051d5]'
                  : 'bg-white border border-slate-300 text-[#0b1c30] hover:bg-slate-50'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              <span>
                {aiTariffShiftEnabled ? 'AI Off-Peak Shifting Active' : 'Enable AI Tariff Shift'}
              </span>
            </button>
          </div>
        </div>

        {/* 12-Interval Load Bar Grid */}
        <div className="mt-5 grid grid-cols-6 sm:grid-cols-12 gap-2.5 items-end h-52 pt-4">
          {ENERGY_SCHEDULE_24H.map((slot) => {
            const effectiveMWh = aiTariffShiftEnabled
              ? slot.gasMWh
              : slot.tariffTier === 'Peak'
              ? slot.gasMWh + 4.4
              : slot.tariffTier === 'Off-Peak'
              ? slot.gasMWh - 2.6
              : slot.gasMWh;
            const heightPct = Math.min(100, Math.round((effectiveMWh / maxLoad) * 100));

            const barColor =
              slot.aiShiftedLoad && aiTariffShiftEnabled
                ? 'bg-[#2563eb]'
                : slot.tariffTier === 'Peak'
                ? 'bg-[#e06d3b]'
                : 'bg-slate-400';

            return (
              <div key={slot.hour} className="flex flex-col items-center h-full justify-end">
                <div className="text-[11px] font-mono tabular-nums text-slate-600 mb-1">
                  {effectiveMWh.toFixed(1)}
                </div>
                <div className="w-full bg-slate-100 rounded-t h-32 flex items-end overflow-hidden border border-slate-200/70">
                  <div
                    className={`w-full transition-all duration-200 ${barColor}`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] font-mono tabular-nums font-semibold text-[#0b1c30]">
                  {slot.hour}
                </div>
                <div className="text-[10px] font-mono tabular-nums text-slate-500">
                  ₹{slot.rateInrMWh.toLocaleString('en-IN')}/MWh
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#2563eb] inline-block" />
            <span>AI-Shifted Off-Peak Shuttle Cycle</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#e06d3b] inline-block" />
            <span>Peak Tariff Window (₹5,120–₹5,380/MWh)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-slate-400 inline-block" />
            <span>Standard Continuous Tunnel Baseload</span>
          </div>
        </div>
      </section>

      {/* Raw Material Silo Inventory */}
      <section className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-display font-semibold text-[#0b1c30]">
              Ceramic Raw Material Silos
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live gravimetric hopper telemetry, moisture levels, and automated reorder thresholds
            </p>
          </div>
          <Package className="w-4 h-4 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 tracking-wide">
                <th className="py-2.5 px-5">Material / Grade</th>
                <th className="py-2.5 px-4">Facility</th>
                <th className="py-2.5 px-4">Silo Level</th>
                <th className="py-2.5 px-4 text-right">Daily Burn</th>
                <th className="py-2.5 px-4 text-right">Days Cover</th>
                <th className="py-2.5 px-4 text-right">Moisture</th>
                <th className="py-2.5 px-5 text-right">Procurement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {silos.map((silo) => {
                const fillPct = Math.round((silo.currentTons / silo.capacityTons) * 100);
                const daysCover = silo.currentTons / silo.dailyBurnTons;
                const belowThreshold = silo.currentTons <= silo.reorderThresholdTons;

                return (
                  <tr key={silo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-semibold text-[#0b1c30]">{silo.materialName}</span>
                      <span className="block text-xs text-slate-500">{silo.grade}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                      {silo.facilityName}
                    </td>
                    <td className="py-3.5 px-4 min-w-[180px]">
                      <div className="flex justify-between text-xs font-mono tabular-nums mb-1">
                        <span className="font-semibold text-[#0b1c30]">
                          {silo.currentTons.toFixed(1)} t
                        </span>
                        <span className="text-slate-500">{fillPct}% of {silo.capacityTons}t</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            belowThreshold ? 'bg-[#ba1a1a]' : 'bg-[#9f3c16]'
                          }`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {silo.dailyBurnTons.toFixed(1)} t/d
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                        belowThreshold ? 'text-[#ba1a1a]' : 'text-[#0b1c30]'
                      }`}
                    >
                      {daysCover.toFixed(1)} days
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {silo.moisturePct.toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      {silo.poIssued ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#15803d]">
                          <Check className="w-3.5 h-3.5" />
                          <span>PO Dispatched</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onIssueRestockPo(silo.id)}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                            belowThreshold
                              ? 'bg-[#9f3c16] hover:bg-[#822801] text-white'
                              : 'bg-white border border-slate-200 text-[#0b1c30] hover:bg-slate-50'
                          }`}
                        >
                          Issue Restock PO
                        </button>
                      )}
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
