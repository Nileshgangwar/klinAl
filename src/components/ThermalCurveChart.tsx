import React, { useState } from 'react';
import { ThermalZone } from '../types/kiln';

interface ThermalCurveChartProps {
  zones: ThermalZone[];
  kilnName: string;
  showAiOptimal?: boolean;
  onSelectZone?: (zoneNumber: number) => void;
  selectedZoneNumber?: number | null;
}

export const ThermalCurveChart: React.FC<ThermalCurveChartProps> = ({
  zones,
  kilnName,
  showAiOptimal = true,
  onSelectZone,
  selectedZoneNumber,
}) => {
  const [hoveredZone, setHoveredZone] = useState<number | null>(null);

  const width = 760;
  const height = 270;
  const padLeft = 52;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 42;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxTemp = Math.max(
    1600,
    ...zones.map((z) => Math.max(z.actualTempC, z.targetTempC, z.aiOptimalTempC) + 120)
  );
  const roundedMax = Math.ceil(maxTemp / 200) * 200;
  const minTemp = 0;

  const getX = (index: number) => {
    if (zones.length <= 1) return padLeft;
    return padLeft + (index / (zones.length - 1)) * plotW;
  };

  const getY = (temp: number) => {
    const ratio = (temp - minTemp) / (roundedMax - minTemp);
    return padTop + plotH - ratio * plotH;
  };

  const buildPath = (accessor: (z: ThermalZone) => number) => {
    return zones
      .map((z, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(accessor(z)).toFixed(1)}`)
      .join(' ');
  };

  const buildAreaPath = (accessor: (z: ThermalZone) => number) => {
    if (zones.length === 0) return '';
    const topLine = buildPath(accessor);
    const lastX = getX(zones.length - 1).toFixed(1);
    const firstX = getX(0).toFixed(1);
    const baseY = (padTop + plotH).toFixed(1);
    return `${topLine} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  const yTicks = [0, roundedMax * 0.25, roundedMax * 0.5, roundedMax * 0.75, roundedMax];
  const activeIdx =
    hoveredZone !== null
      ? zones.findIndex((z) => z.zoneNumber === hoveredZone)
      : selectedZoneNumber
      ? zones.findIndex((z) => z.zoneNumber === selectedZoneNumber)
      : 3;

  const activeZone = zones[activeIdx >= 0 ? activeIdx : 0];

  return (
    <div className="w-full">
      {/* Inline Legend & Active Zone Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80 mb-4">
        <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-0.5 bg-[#e06d3b]" />
            <span className="font-medium text-[#0b1c30]">Actual Sensor Curve</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-0.5 border-t-2 border-dashed border-slate-500" />
            <span>Target Firing Recipe</span>
          </div>
          {showAiOptimal && (
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-0.5 bg-[#2563eb]" />
              <span className="font-medium text-[#2563eb]">AI Optimal Trajectory</span>
            </div>
          )}
        </div>

        {activeZone && (
          <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-700">
            <span className="font-sans font-semibold text-[#0b1c30]">
              Z0{activeZone.zoneNumber} · {activeZone.name}
            </span>
            <span className="text-[#e06d3b] font-semibold">
              {activeZone.actualTempC}°C actual
            </span>
            <span className="text-slate-500">/</span>
            <span>{activeZone.targetTempC}°C target</span>
            {showAiOptimal && (
              <>
                <span className="text-slate-500">/</span>
                <span className="text-[#2563eb] font-semibold">
                  {activeZone.aiOptimalTempC}°C AI
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* SVG Thermal Profile */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[540px] h-auto select-none"
          role="img"
          aria-label={`Thermal firing curve across 8 zones for ${kilnName}`}
        >
          <defs>
            <linearGradient id="emberFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e06d3b" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#e06d3b" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px] font-mono tabular-nums"
                >
                  {Math.round(tick)}°
                </text>
              </g>
            );
          })}

          {/* Firing Stage Subtle Column Shading (Zones 4-5 Peak Firing) */}
          {zones.length >= 5 && (
            <rect
              x={getX(3) - 18}
              y={padTop}
              width={getX(4) - getX(3) + 36}
              height={plotH}
              fill="#fff7ed"
              opacity="0.7"
            />
          )}

          {/* Hover Vertical Guide */}
          {activeZone && (
            <line
              x1={getX(activeIdx >= 0 ? activeIdx : 0)}
              y1={padTop}
              x2={getX(activeIdx >= 0 ? activeIdx : 0)}
              y2={padTop + plotH}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* Ember Area Fill */}
          <path d={buildAreaPath((z) => z.actualTempC)} fill="url(#emberFill)" />

          {/* Target Recipe Dashed Line */}
          <path
            d={buildPath((z) => z.targetTempC)}
            fill="none"
            stroke="#64748b"
            strokeWidth="1.75"
            strokeDasharray="5 4"
          />

          {/* AI Optimal Curve */}
          {showAiOptimal && (
            <path
              d={buildPath((z) => z.aiOptimalTempC)}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Actual Sensor Curve */}
          <path
            d={buildPath((z) => z.actualTempC)}
            fill="none"
            stroke="#e06d3b"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Zone Data Nodes & Interactive Hit Columns */}
          {zones.map((zone, idx) => {
            const cx = getX(idx);
            const cyActual = getY(zone.actualTempC);
            const cyAi = getY(zone.aiOptimalTempC);
            const isSelected = activeZone?.zoneNumber === zone.zoneNumber;

            return (
              <g
                key={zone.zoneNumber}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredZone(zone.zoneNumber)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => onSelectZone?.(zone.zoneNumber)}
              >
                <rect
                  x={cx - plotW / (zones.length * 2)}
                  y={padTop}
                  width={plotW / zones.length}
                  height={plotH + 34}
                  fill="transparent"
                />
                {showAiOptimal && (
                  <circle
                    cx={cx}
                    cy={cyAi}
                    r={isSelected ? 4.5 : 3}
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cyActual}
                  r={isSelected ? 5.5 : 4}
                  fill="#e06d3b"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  y={height - 16}
                  textAnchor="middle"
                  className={`text-[11px] font-mono tabular-nums ${
                    isSelected ? 'fill-[#0b1c30] font-semibold' : 'fill-slate-500'
                  }`}
                >
                  Z0{zone.zoneNumber}
                </text>
                <text
                  x={cx}
                  y={height - 4}
                  textAnchor="middle"
                  className="fill-slate-400 text-[9px] font-mono tabular-nums"
                >
                  {zone.positionMeters}m
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
