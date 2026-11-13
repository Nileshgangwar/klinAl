import React, { useState } from 'react';
import {
  BrainCircuit,
  Flame,
  Gauge,
  Minus,
  Plus,
  RotateCcw,
  Wind,
} from 'lucide-react';
import { KilnState, KilnUnit } from '../types/kiln';
import { ThermalCurveChart } from './ThermalCurveChart';

interface KilnControlViewProps {
  kilns: KilnUnit[];
  selectedKilnId: string;
  onSelectKiln: (kilnId: string) => void;
  onAdjustZoneSetpoint: (kilnId: string, zoneNumber: number, deltaC: number) => void;
  onToggleZoneAiTrim: (kilnId: string, zoneNumber: number) => void;
  onSyncAllAiOptimal: (kilnId: string) => void;
}

export const KilnControlView: React.FC<KilnControlViewProps> = ({
  kilns,
  selectedKilnId,
  onSelectKiln,
  onAdjustZoneSetpoint,
  onToggleZoneAiTrim,
  onSyncAllAiOptimal,
}) => {
  const [selectedZone, setSelectedZone] = useState<number | null>(4);
  const [imgFailed, setImgFailed] = useState(false);

  const kiln = kilns.find((k) => k.id === selectedKilnId) || kilns[0];
  if (!kiln) return null;

  const autoTrimCount = kiln.zones.filter((z) => z.aiAutoTrim).length;

  return (
    <div className="space-y-6">
      {/* Kiln Unit Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#eff4ff] border border-slate-200 rounded-md">
          {kilns.map((unit) => {
            const active = unit.id === kiln.id;
            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => onSelectKiln(unit.id)}
                className={`px-3.5 py-2 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white text-[#0b1c30] border border-slate-200 font-semibold'
                    : 'text-slate-600 hover:text-[#0b1c30]'
                }`}
              >
                <span className="font-mono">{unit.shortCode}</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span>{unit.facilityName}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onSyncAllAiOptimal(kiln.id)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] hover:bg-[#0051d5] text-white text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <BrainCircuit className="w-4 h-4" />
          <span>Sync All Zones to AI Optimal</span>
        </button>
      </div>

      {/* Kiln Facility Header Banner + Live Instrument Readouts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5 relative rounded-md overflow-hidden border border-slate-200 min-h-[220px] bg-[#0b1c30]">
          {!imgFailed ? (
            <img
              src="/src/assets/images/kiln_tunnel_facility_1794549848426.jpg"
              alt={`${kiln.name} industrial refractory hall`}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover min-h-[220px]"
            />
          ) : (
            <div className="w-full h-full min-h-[220px] bg-gradient-to-br from-[#0b1c30] via-[#213145] to-[#57423b] flex items-center justify-center">
              <Flame className="w-12 h-12 text-[#e06d3b]/70" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c30]/90 via-[#0b1c30]/45 to-transparent flex flex-col justify-end p-5 text-white">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>{kiln.facilityName} Facility</span>
              <span aria-hidden="true">·</span>
              <span>{kiln.type}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#ffb598] font-medium">{kiln.state}</span>
            </div>
            <h2 className="mt-1 text-xl font-display font-bold tracking-tight text-white">
              {kiln.name} — {kiln.ceramicBody}
            </h2>
            <p className="mt-1 text-xs text-slate-300 font-mono tabular-nums">
              Active Lot {kiln.activeBatchId} · {autoTrimCount}/8 zones under AI autonomous trim
            </p>
          </div>
        </div>

        {/* 4 Segmented Hardware Telemetry Blocks */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-display font-semibold text-[#0b1c30]">
              PLC Burner & Draft Instrumentation
            </h3>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              Peak Zone: {kiln.peakTempC}°C
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Flame className="w-3.5 h-3.5 text-[#e06d3b]" />
                <span>Natural Gas Flow</span>
              </div>
              <div className="mt-2 text-xl font-mono font-bold tabular-nums text-[#0b1c30]">
                {kiln.gasFlowM3Hr.toFixed(1)}
                <span className="text-xs font-normal text-slate-500 ml-1">m³/hr</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Gauge className="w-3.5 h-3.5 text-[#9f3c16]" />
                <span>Tunnel Draft</span>
              </div>
              <div className="mt-2 text-xl font-mono font-bold tabular-nums text-[#0b1c30]">
                {kiln.draftPressurePa.toFixed(1)}
                <span className="text-xs font-normal text-slate-500 ml-1">Pa</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Wind className="w-3.5 h-3.5 text-slate-500" />
                <span>Exhaust O₂</span>
              </div>
              <div className="mt-2 text-xl font-mono font-bold tabular-nums text-[#0b1c30]">
                {kiln.exhaustO2Pct.toFixed(1)}%
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#2563eb]">
                <BrainCircuit className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>Predicted Yield</span>
              </div>
              <div className="mt-2 text-xl font-mono font-bold tabular-nums text-[#2563eb]">
                {kiln.predictedYieldPct.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <span>
              Thermal Efficiency:{' '}
              <strong className="font-mono tabular-nums text-[#0b1c30]">
                {kiln.thermalEfficiencyPct.toFixed(1)}%
              </strong>
            </span>
            <span>
              Kiln State:{' '}
              <strong
                className={
                  kiln.state === KilnState.FIRING
                    ? 'text-[#e06d3b]'
                    : kiln.state === KilnState.COOLING
                    ? 'text-[#2563eb]'
                    : 'text-[#9f3c16]'
                }
              >
                {kiln.state}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Thermal Curve Inspection */}
      <div className="bg-white border border-slate-200 rounded-md p-5">
        <ThermalCurveChart
          zones={kiln.zones}
          kilnName={kiln.name}
          showAiOptimal={true}
          selectedZoneNumber={selectedZone}
          onSelectZone={setSelectedZone}
        />
      </div>

      {/* 8-Zone Interactive Burner & Setpoint Matrix */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-display font-semibold text-[#0b1c30]">
              Zone Burner & Setpoint Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust manual PLC setpoints in 5°C increments or delegate individual zones to AI Autonomous Trim
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            8 thermocouple zones active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 tracking-wide">
                <th className="py-2.5 px-5">Zone</th>
                <th className="py-2.5 px-4">Thermal Stage</th>
                <th className="py-2.5 px-4 text-right">Measured</th>
                <th className="py-2.5 px-4 text-center">Target Setpoint</th>
                <th className="py-2.5 px-4 text-right">AI Optimal</th>
                <th className="py-2.5 px-4">Burner Duty</th>
                <th className="py-2.5 px-4 text-right">O₂ %</th>
                <th className="py-2.5 px-5 text-right">AI Auto-Trim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {kiln.zones.map((zone) => {
                const delta = zone.actualTempC - zone.targetTempC;
                const isSelected = selectedZone === zone.zoneNumber;

                return (
                  <tr
                    key={zone.zoneNumber}
                    onClick={() => setSelectedZone(zone.zoneNumber)}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#eff4ff]/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-5 whitespace-nowrap">
                      <span className="font-mono font-semibold text-[#0b1c30]">
                        Z0{zone.zoneNumber}
                      </span>
                      <span className="ml-2 text-slate-700 font-medium">{zone.name}</span>
                      <span className="block text-[11px] font-mono text-slate-400">
                        {zone.positionMeters}m station
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {zone.stage}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                      <span className="font-semibold text-[#0b1c30]">{zone.actualTempC}°C</span>
                      <span
                        className={`block text-[11px] ${
                          Math.abs(delta) > 8
                            ? 'text-[#ba1a1a]'
                            : delta > 0
                            ? 'text-[#e06d3b]'
                            : 'text-slate-500'
                        }`}
                      >
                        {delta >= 0 ? `+${delta}°C` : `${delta}°C`} drift
                      </span>
                    </td>
                    <td
                      className="py-3 px-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Decrease Zone ${zone.zoneNumber} target by 5°C`}
                          onClick={() => onAdjustZoneSetpoint(kiln.id, zone.zoneNumber, -5)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-16 text-center font-mono font-semibold tabular-nums text-[#0b1c30]">
                          {zone.targetTempC}°C
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase Zone ${zone.zoneNumber} target by 5°C`}
                          onClick={() => onAdjustZoneSetpoint(kiln.id, zone.zoneNumber, 5)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[#2563eb] tabular-nums whitespace-nowrap">
                      {zone.aiOptimalTempC}°C
                    </td>
                    <td className="py-3 px-4 min-w-[130px]">
                      <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-600 mb-1">
                        <span>{zone.burnerDutyPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#e06d3b] rounded-full"
                          style={{ width: `${zone.burnerDutyPct}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {zone.oxygenPct.toFixed(1)}%
                    </td>
                    <td
                      className="py-3 px-5 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleZoneAiTrim(kiln.id, zone.zoneNumber)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          zone.aiAutoTrim
                            ? 'bg-[#eff4ff] text-[#2563eb] border border-[#bfdbfe]'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {zone.aiAutoTrim ? (
                          <>
                            <BrainCircuit className="w-3.5 h-3.5" />
                            <span>Autonomous</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Manual</span>
                          </>
                        )}
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
