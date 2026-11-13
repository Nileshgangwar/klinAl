import React, { useState } from 'react';
import { X } from 'lucide-react';
import { BatchStatus, FiringBatch, KilnUnit } from '../types/kiln';

interface LogBatchModalProps {
  isOpen: boolean;
  kilns: KilnUnit[];
  onClose: () => void;
  onCreateBatch: (batch: FiringBatch) => void;
}

export const LogBatchModal: React.FC<LogBatchModalProps> = ({
  isOpen,
  kilns,
  onClose,
  onCreateBatch,
}) => {
  const [kilnId, setKilnId] = useState(kilns[0]?.id ?? 'tk-01');
  const [ceramicBody, setCeramicBody] = useState('Structural Terracotta Cladding');
  const [orderRef, setOrderRef] = useState('PO-88365');
  const [coneTarget, setConeTarget] = useState('Cone 6');
  const [peakTempC, setPeakTempC] = useState(1205);
  const [cycleDurationHrs, setCycleDurationHrs] = useState(20);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const selectedKiln = kilns.find((k) => k.id === kilnId) || kilns[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKiln) return;

    const randomNum = 4100 + Math.floor(Math.random() * 85);
    const newBatch: FiringBatch = {
      id: `B-${randomNum}`,
      orderRef: orderRef.trim() || 'PO-88370',
      ceramicBody: ceramicBody.trim() || 'Custom Ceramic Body',
      facilityId: selectedKiln.facilityId,
      facilityName: selectedKiln.facilityName,
      kilnId: selectedKiln.id,
      kilnName: selectedKiln.name,
      coneTarget,
      peakTempC,
      cycleDurationHrs,
      elapsedHrs: 0.4,
      predictedYieldPct: Number((95.8 + Math.random() * 2.4).toFixed(1)),
      actualYieldPct: null,
      defectRatePct: 2.5,
      shrinkagePct: 10.2,
      porosityPct: 1.4,
      energyMWh: Number((cycleDurationHrs * 0.78).toFixed(1)),
      status: BatchStatus.FIRING,
      startedAt: 'Nov 12, Just now',
      notes: notes.trim() || 'Logged directly from plant dispatch console.',
    };

    onCreateBatch(newBatch);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-batch-title"
    >
      <div className="bg-white border border-slate-200 rounded-md w-full max-w-lg overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 id="log-batch-title" className="text-base font-display font-bold text-[#0b1c30]">
            Log New Firing Batch
          </h2>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-[#0b1c30] hover:bg-slate-100 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Assigned Kiln
              </label>
              <select
                value={kilnId}
                onChange={(e) => setKilnId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-[#0b1c30] focus:outline-none focus:border-[#9f3c16]"
              >
                {kilns.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({k.facilityName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Customer Order Ref
              </label>
              <input
                type="text"
                required
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-mono text-[#0b1c30] focus:outline-none focus:border-[#9f3c16]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ceramic Formulation
            </label>
            <select
              value={ceramicBody}
              onChange={(e) => setCeramicBody(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-[#0b1c30] focus:outline-none focus:border-[#9f3c16]"
            >
              <option value="Structural Terracotta Cladding">Structural Terracotta Cladding</option>
              <option value="96% Technical Alumina Rings">96% Technical Alumina Rings</option>
              <option value="Vitreous Sanitary Porcelain">Vitreous Sanitary Porcelain</option>
              <option value="Zirconia Thermal Substrates">Zirconia Thermal Substrates</option>
              <option value="SiC Kiln Furniture Beams">SiC Kiln Furniture Beams</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Orton Cone
              </label>
              <input
                type="text"
                value={coneTarget}
                onChange={(e) => setConeTarget(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-[#0b1c30] focus:outline-none focus:border-[#9f3c16]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Peak Temp (°C)
              </label>
              <input
                type="number"
                min={900}
                max={1650}
                value={peakTempC}
                onChange={(e) => setPeakTempC(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-mono text-[#0b1c30] focus:outline-none focus:border-[#9f3c16]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Cycle (hrs)
              </label>
              <input
                type="number"
                min={6}
                max={48}
                step={0.5}
                value={cycleDurationHrs}
                onChange={(e) => setCycleDurationHrs(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-mono text-[#0b1c30] focus:outline-none focus:border-[#9f3c16]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Operator Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Glaze lot, moisture reading, or car loading notes..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-[#0b1c30] focus:outline-none focus:border-[#9f3c16]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-[#0b1c30] border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-[#9f3c16] hover:bg-[#822801] rounded-md cursor-pointer"
            >
              Start Firing Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
