import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { BatchStatus, FiringBatch } from '../types/kiln';

interface BatchLedgerViewProps {
  batches: FiringBatch[];
  selectedBatch: FiringBatch | null;
  onSelectBatch: (batch: FiringBatch | null) => void;
  onUpdateBatchStatus: (batchId: string, newStatus: BatchStatus) => void;
  onOpenNewBatchModal: () => void;
}

type StatusFilter = 'All' | BatchStatus;

export const BatchLedgerView: React.FC<BatchLedgerViewProps> = ({
  batches,
  selectedBatch,
  onSelectBatch,
  onUpdateBatchStatus,
  onOpenNewBatchModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sampleImgFailed, setSampleImgFailed] = useState(false);

  const filteredBatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return batches.filter((b) => {
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      const matchesQuery =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.ceramicBody.toLowerCase().includes(q) ||
        b.orderRef.toLowerCase().includes(q) ||
        b.kilnName.toLowerCase().includes(q) ||
        b.facilityName.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [batches, searchQuery, statusFilter]);

  const handleDownloadCsv = () => {
    const headers = [
      'Batch ID',
      'Order Ref',
      'Ceramic Body',
      'Facility',
      'Kiln',
      'Cone',
      'Peak Temp (C)',
      'Cycle Hours',
      'Predicted Yield (%)',
      'Actual Yield (%)',
      'Shrinkage (%)',
      'Porosity (%)',
      'Energy (MWh)',
      'Status',
    ];
    const rows = filteredBatches.map((b) => [
      b.id,
      b.orderRef,
      `"${b.ceramicBody}"`,
      b.facilityName,
      b.kilnName,
      b.coneTarget,
      b.peakTempC,
      b.cycleDurationHrs,
      b.predictedYieldPct.toFixed(1),
      b.actualYieldPct !== null ? b.actualYieldPct.toFixed(1) : 'In Progress',
      b.shrinkagePct.toFixed(1),
      b.porosityPct.toFixed(2),
      b.energyMWh.toFixed(1),
      b.status,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kiln-ai-batch-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filterOptions: StatusFilter[] = [
    'All',
    BatchStatus.FIRING,
    BatchStatus.COOLING,
    BatchStatus.PASSED_QC,
    BatchStatus.HOLD_REVIEW,
  ];

  const getStatusTextClass = (status: BatchStatus) => {
    switch (status) {
      case BatchStatus.FIRING:
        return 'text-[#e06d3b]';
      case BatchStatus.COOLING:
        return 'text-[#2563eb]';
      case BatchStatus.PASSED_QC:
        return 'text-[#15803d]';
      case BatchStatus.HOLD_REVIEW:
        return 'text-[#ba1a1a]';
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar: Search + Segmented Filter + CSV Export */}
      <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-xs min-w-[210px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search batch, PO, ceramic body..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#9f3c16] text-[#0b1c30]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#eff4ff] border border-slate-200 rounded-md">
            {filterOptions.map((opt) => {
              const active = statusFilter === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStatusFilter(opt)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-[#0b1c30] font-semibold border border-slate-200'
                      : 'text-slate-600 hover:text-[#0b1c30]'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#0b1c30] bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewBatchModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#9f3c16] hover:bg-[#822801] rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Firing Batch</span>
          </button>
        </div>
      </div>

      {/* Main Split: Ledger Table + Optional Side Inspection Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div
          className={`${
            selectedBatch ? 'xl:col-span-8' : 'xl:col-span-12'
          } bg-white border border-slate-200 rounded-md overflow-hidden`}
        >
          {filteredBatches.length === 0 ? (
            <div className="py-14 px-6 text-center">
              <p className="text-base font-display font-semibold text-[#0b1c30]">
                No firing batches match the active filter
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Clear the search query or log a new ceramic firing lot into the ledger.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('All');
                  }}
                  className="px-4 py-2 text-xs font-medium text-[#0b1c30] border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={onOpenNewBatchModal}
                  className="px-4 py-2 text-xs font-medium text-white bg-[#9f3c16] rounded-md hover:bg-[#822801] cursor-pointer"
                >
                  Log First Batch
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 tracking-wide">
                    <th className="py-2.5 px-5">Batch</th>
                    <th className="py-2.5 px-4">Ceramic Formulation</th>
                    <th className="py-2.5 px-4">Kiln Unit</th>
                    <th className="py-2.5 px-4 text-right">Peak °C</th>
                    <th className="py-2.5 px-4 text-right">Duration</th>
                    <th className="py-2.5 px-4 text-right">AI Pred. Yield</th>
                    <th className="py-2.5 px-4 text-right">Actual Yield</th>
                    <th className="py-2.5 px-5 text-right">QC Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredBatches.map((batch) => {
                    const isSelected = selectedBatch?.id === batch.id;
                    return (
                      <tr
                        key={batch.id}
                        onClick={() => onSelectBatch(batch)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#eff4ff]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-5 font-mono font-semibold text-[#0b1c30] tabular-nums whitespace-nowrap">
                          {batch.id}
                          <span className="block text-[11px] font-normal text-slate-500">
                            {batch.startedAt}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#0b1c30]">
                          {batch.ceramicBody}
                          <span className="block text-xs font-normal text-slate-500">
                            {batch.orderRef} · {batch.coneTarget}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                          {batch.kilnName}
                          <span className="block text-xs text-slate-500">{batch.facilityName}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#0b1c30] whitespace-nowrap">
                          {batch.peakTempC}°C
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                          {batch.elapsedHrs.toFixed(1)} / {batch.cycleDurationHrs.toFixed(1)}h
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#2563eb] whitespace-nowrap">
                          {batch.predictedYieldPct.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#0b1c30] whitespace-nowrap">
                          {batch.actualYieldPct !== null ? `${batch.actualYieldPct.toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-3 px-5 text-right whitespace-nowrap">
                          <span className={`text-xs font-semibold ${getStatusTextClass(batch.status)}`}>
                            {batch.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Batch Inspection & QC Side Sheet */}
        {selectedBatch && (
          <aside className="xl:col-span-4 bg-white border border-slate-200 rounded-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-500">
                  {selectedBatch.orderRef} · {selectedBatch.facilityName}
                </div>
                <h3 className="text-base font-display font-bold text-[#0b1c30] font-mono">
                  Batch {selectedBatch.id} Inspection
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close batch inspection panel"
                onClick={() => onSelectBatch(null)}
                className="p-1.5 text-slate-500 hover:text-[#0b1c30] hover:bg-slate-100 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative h-44 bg-slate-100 border-b border-slate-200">
              {!sampleImgFailed ? (
                <img
                  src="/src/assets/images/ceramic_batch_samples_1794549848271.jpg"
                  alt={`Ceramic test specimens for ${selectedBatch.ceramicBody}`}
                  referrerPolicy="no-referrer"
                  onError={() => setSampleImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs text-slate-600">
                  QC Specimen Surface Inspection
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b1c30]/85 to-transparent p-3.5 text-white">
                <div className="text-xs font-medium text-slate-200">
                  {selectedBatch.ceramicBody}
                </div>
                <div className="text-[11px] font-mono text-slate-300">
                  {selectedBatch.kilnName} · {selectedBatch.coneTarget} ({selectedBatch.peakTempC}°C)
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block">AI Predicted Yield</span>
                  <span className="mt-1 block text-lg font-mono font-bold tabular-nums text-[#2563eb]">
                    {selectedBatch.predictedYieldPct.toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block">Measured QC Yield</span>
                  <span className="mt-1 block text-lg font-mono font-bold tabular-nums text-[#0b1c30]">
                    {selectedBatch.actualYieldPct !== null
                      ? `${selectedBatch.actualYieldPct.toFixed(1)}%`
                      : 'Firing'}
                  </span>
                </div>
              </div>

              <dl className="divide-y divide-slate-200 text-xs">
                <div className="py-2 flex items-center justify-between">
                  <dt className="text-slate-500">Linear Shrinkage</dt>
                  <dd className="font-mono font-semibold tabular-nums text-[#0b1c30]">
                    {selectedBatch.shrinkagePct.toFixed(1)}%
                  </dd>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <dt className="text-slate-500">Apparent Porosity</dt>
                  <dd className="font-mono font-semibold tabular-nums text-[#0b1c30]">
                    {selectedBatch.porosityPct.toFixed(2)}%
                  </dd>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <dt className="text-slate-500">Thermal Energy Consumed</dt>
                  <dd className="font-mono font-semibold tabular-nums text-[#0b1c30]">
                    {selectedBatch.energyMWh.toFixed(1)} MWh
                  </dd>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <dt className="text-slate-500">Estimated Defect Rate</dt>
                  <dd className="font-mono font-semibold tabular-nums text-[#0b1c30]">
                    {selectedBatch.defectRatePct.toFixed(1)}%
                  </dd>
                </div>
              </dl>

              <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-3">
                {selectedBatch.notes}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateBatchStatus(selectedBatch.id, BatchStatus.PASSED_QC)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve QC Release</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateBatchStatus(selectedBatch.id, BatchStatus.HOLD_REVIEW)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-[#ba1a1a] text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Flag Hold</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
