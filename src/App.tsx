import React, { useMemo, useState } from 'react';
import {
  Activity,
  BrainCircuit,
  ChevronRight,
  ClipboardList,
  Flame,
  Menu,
  Plus,
  X,
  Zap,
} from 'lucide-react';
import {
  FACILITIES,
  INITIAL_ADVISORIES,
  INITIAL_BATCHES,
  INITIAL_KILNS,
  INITIAL_SILOS,
  RECIPE_PRESETS,
  REFRACTORY_ASSETS,
} from './data/kilnData';
import {
  AIAdvisory,
  AppScreen,
  BatchStatus,
  FacilityId,
  FiringBatch,
  FiringRecipePreset,
  KilnUnit,
  RawMaterialSilo,
  RefractoryAsset,
} from './types/kiln';
import { OperationsOverview } from './components/OperationsOverview';
import { KilnControlView } from './components/KilnControlView';
import { BatchLedgerView } from './components/BatchLedgerView';
import { PredictiveYieldLab } from './components/PredictiveYieldLab';
import { EnergySupplyView } from './components/EnergySupplyView';
import { LogBatchModal } from './components/LogBatchModal';
import { KilnChatbot } from './components/KilnChatbot';

const NAV_ITEMS: {
  id: AppScreen;
  label: string;
  icon: React.FC<{ className?: string }>;
  isAiSection?: boolean;
}[] = [
  { id: AppScreen.OVERVIEW, label: 'Operations Overview', icon: Activity },
  { id: AppScreen.KILN_CONTROL, label: 'Kiln Thermal Control', icon: Flame },
  { id: AppScreen.BATCH_LEDGER, label: 'Batch & Yield Ledger', icon: ClipboardList },
  { id: AppScreen.PREDICTIVE_LAB, label: 'Predictive Yield Lab', icon: BrainCircuit, isAiSection: true },
  { id: AppScreen.ENERGY_SUPPLY, label: 'Supply & Energy', icon: Zap },
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>(AppScreen.OVERVIEW);
  const [facilityFilter, setFacilityFilter] = useState<FacilityId>('all');
  const [kilns, setKilns] = useState<KilnUnit[]>(INITIAL_KILNS);
  const [selectedKilnId, setSelectedKilnId] = useState<string>(INITIAL_KILNS[0].id);
  const [advisories, setAdvisories] = useState<AIAdvisory[]>(INITIAL_ADVISORIES);
  const [batches, setBatches] = useState<FiringBatch[]>(INITIAL_BATCHES);
  const [inspectedBatchId, setInspectedBatchId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<FiringRecipePreset[]>(RECIPE_PRESETS);
  const [refractoryAssets, setRefractoryAssets] = useState<RefractoryAsset[]>(REFRACTORY_ASSETS);
  const [silos, setSilos] = useState<RawMaterialSilo[]>(INITIAL_SILOS);

  const [isNewBatchOpen, setIsNewBatchOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const visibleKilns = useMemo(() => {
    if (facilityFilter === 'all') return kilns;
    return kilns.filter((k) => k.facilityId === facilityFilter);
  }, [kilns, facilityFilter]);

  const effectiveSelectedKilnId = useMemo(() => {
    if (visibleKilns.some((k) => k.id === selectedKilnId)) return selectedKilnId;
    return visibleKilns[0]?.id ?? kilns[0].id;
  }, [visibleKilns, selectedKilnId, kilns]);

  const visibleBatches = useMemo(() => {
    if (facilityFilter === 'all') return batches;
    return batches.filter((b) => b.facilityId === facilityFilter);
  }, [batches, facilityFilter]);

  const visibleAdvisories = useMemo(() => {
    if (facilityFilter === 'all') return advisories;
    const kilnIds = new Set(visibleKilns.map((k) => k.id));
    return advisories.filter((a) => kilnIds.has(a.kilnId));
  }, [advisories, facilityFilter, visibleKilns]);

  const selectedBatch = useMemo(
    () => batches.find((b) => b.id === inspectedBatchId) ?? null,
    [batches, inspectedBatchId]
  );

  const activeNavMeta = NAV_ITEMS.find((n) => n.id === activeScreen) || NAV_ITEMS[0];
  const activeFacilityMeta =
    FACILITIES.find((f) => f.id === facilityFilter) || FACILITIES[0];

  const chatbotTelemetryContext = useMemo(
    () => ({
      currency: 'INR (Indian Rupee)',
      facilityScope: activeFacilityMeta.label,
      kilns: visibleKilns.map((k) => ({
        id: k.shortCode,
        name: k.name,
        facility: k.facilityName,
        state: k.state,
        activeBatch: k.activeBatchId,
        ceramicBody: k.ceramicBody,
        peakTempC: k.peakTempC,
        thermalEfficiencyPct: k.thermalEfficiencyPct,
        predictedYieldPct: k.predictedYieldPct,
        gasFlowM3Hr: k.gasFlowM3Hr,
      })),
      openAdvisories: visibleAdvisories
        .filter((a) => !a.resolved)
        .map((a) => ({
          kiln: a.kilnName,
          zone: a.zoneLabel,
          title: a.title,
          impact: a.impactMetric,
        })),
      activeBatches: visibleBatches.slice(0, 6).map((b) => ({
        id: b.id,
        body: b.ceramicBody,
        kiln: b.kilnName,
        peakTempC: b.peakTempC,
        predictedYieldPct: b.predictedYieldPct,
        status: b.status,
      })),
      silos: silos.map((s) => ({
        material: s.materialName,
        facility: s.facilityName,
        currentTons: s.currentTons,
        reorderThresholdTons: s.reorderThresholdTons,
        poIssued: s.poIssued,
      })),
    }),
    [facilityFilter, visibleKilns, visibleAdvisories, visibleBatches, silos]
  );

  const handleApplyAdvisory = (advisoryId: string) => {
    const target = advisories.find((a) => a.id === advisoryId);
    if (!target || target.resolved) return;

    setAdvisories((prev) =>
      prev.map((a) => (a.id === advisoryId ? { ...a, resolved: true } : a))
    );

    setKilns((prev) =>
      prev.map((k) => {
        if (k.id !== target.kilnId) return k;
        const updatedZones = k.zones.map((z) => {
          if (target.targetZoneNumber && z.zoneNumber === target.targetZoneNumber) {
            const newTarget = z.aiOptimalTempC;
            const newActual = Math.round((z.actualTempC + newTarget) / 2);
            return {
              ...z,
              targetTempC: newTarget,
              actualTempC: newActual,
              aiAutoTrim: true,
            };
          }
          return z;
        });
        return {
          ...k,
          thermalEfficiencyPct: Math.min(94.0, Number((k.thermalEfficiencyPct + target.efficiencyGainPct).toFixed(1))),
          predictedYieldPct: Math.min(99.3, Number((k.predictedYieldPct + target.yieldGainPct).toFixed(1))),
          gasFlowM3Hr: Number((k.gasFlowM3Hr * 0.968).toFixed(1)),
          zones: updatedZones,
        };
      })
    );

    showToast(`AI trim applied to ${target.kilnName} (${target.zoneLabel}).`);
  };

  const handleDismissAdvisory = (advisoryId: string) => {
    setAdvisories((prev) => prev.filter((a) => a.id !== advisoryId));
    showToast('Advisory dismissed from queue.');
  };

  const handleAdjustZoneSetpoint = (kilnId: string, zoneNumber: number, deltaC: number) => {
    setKilns((prev) =>
      prev.map((k) => {
        if (k.id !== kilnId) return k;
        const updatedZones = k.zones.map((z) => {
          if (z.zoneNumber !== zoneNumber) return z;
          const nextTarget = Math.max(120, Math.min(1650, z.targetTempC + deltaC));
          const nextDuty = Math.max(0, Math.min(100, z.burnerDutyPct + (deltaC > 0 ? 2 : -2)));
          return {
            ...z,
            targetTempC: nextTarget,
            burnerDutyPct: nextDuty,
            aiAutoTrim: false,
          };
        });
        const newPeak = Math.max(...updatedZones.map((z) => z.actualTempC));
        return {
          ...k,
          peakTempC: newPeak,
          gasFlowM3Hr: Number((k.gasFlowM3Hr + (deltaC > 0 ? 2.4 : -2.1)).toFixed(1)),
          zones: updatedZones,
        };
      })
    );
  };

  const handleToggleZoneAiTrim = (kilnId: string, zoneNumber: number) => {
    setKilns((prev) =>
      prev.map((k) => {
        if (k.id !== kilnId) return k;
        const updatedZones = k.zones.map((z) => {
          if (z.zoneNumber !== zoneNumber) return z;
          const enabling = !z.aiAutoTrim;
          return {
            ...z,
            aiAutoTrim: enabling,
            targetTempC: enabling ? z.aiOptimalTempC : z.targetTempC,
          };
        });
        return { ...k, zones: updatedZones };
      })
    );
  };

  const handleSyncAllAiOptimal = (kilnId: string) => {
    setKilns((prev) =>
      prev.map((k) => {
        if (k.id !== kilnId) return k;
        const updatedZones = k.zones.map((z) => ({
          ...z,
          targetTempC: z.aiOptimalTempC,
          actualTempC: Math.round((z.actualTempC + z.aiOptimalTempC) / 2),
          aiAutoTrim: true,
        }));
        return {
          ...k,
          predictedYieldPct: Math.min(99.1, Number((k.predictedYieldPct + 0.6).toFixed(1))),
          thermalEfficiencyPct: Math.min(92.0, Number((k.thermalEfficiencyPct + 0.8).toFixed(1))),
          zones: updatedZones,
        };
      })
    );
    const kilnName = kilns.find((k) => k.id === kilnId)?.name ?? 'Kiln';
    showToast(`All 8 zones on ${kilnName} synchronized to AI optimal trajectory.`);
  };

  const handleInspectBatch = (batch: FiringBatch) => {
    setInspectedBatchId(batch.id);
    setActiveScreen(AppScreen.BATCH_LEDGER);
  };

  const handleUpdateBatchStatus = (batchId: string, newStatus: BatchStatus) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== batchId) return b;
        return {
          ...b,
          status: newStatus,
          actualYieldPct:
            newStatus === BatchStatus.PASSED_QC && b.actualYieldPct === null
              ? b.predictedYieldPct
              : b.actualYieldPct,
          elapsedHrs:
            newStatus === BatchStatus.PASSED_QC ? b.cycleDurationHrs : b.elapsedHrs,
        };
      })
    );
    showToast(`Batch ${batchId} updated to ${newStatus}.`);
  };

  const handleCreateBatch = (newBatch: FiringBatch) => {
    setBatches((prev) => [newBatch, ...prev]);
    setInspectedBatchId(newBatch.id);
    setActiveScreen(AppScreen.BATCH_LEDGER);
    showToast(`Batch ${newBatch.id} logged on ${newBatch.kilnName}.`);
  };

  const handleSaveRecipe = (recipe: FiringRecipePreset) => {
    setRecipes((prev) => [...prev, recipe]);
    showToast(`Saved firing recipe "${recipe.name}".`);
  };

  const handleToggleMaintenance = (assetId: string) => {
    setRefractoryAssets((prev) =>
      prev.map((a) =>
        a.id === assetId ? { ...a, maintenanceBooked: !a.maintenanceBooked } : a
      )
    );
  };

  const handleIssueRestockPo = (siloId: string) => {
    const target = silos.find((s) => s.id === siloId);
    setSilos((prev) =>
      prev.map((s) => (s.id === siloId ? { ...s, poIssued: true } : s))
    );
    if (target) {
      showToast(`Restock PO dispatched for ${target.materialName} (${target.facilityName}).`);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9ff] text-[#0b1c30]">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0b1c30]/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar (260px Desktop) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] shrink-0 bg-[#eff4ff] border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Anchor */}
          <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setActiveScreen(AppScreen.OVERVIEW);
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 text-left cursor-pointer whitespace-nowrap shrink-0"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 28 28"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <rect width="28" height="28" rx="5" fill="#9f3c16" />
                <path
                  d="M7 21V13C7 9.13401 10.134 6 14 6C17.866 6 21 9.13401 21 13V21H17.5V13.2C17.5 11.1565 15.933 9.5 14 9.5C12.067 9.5 10.5 11.1565 10.5 13.2V21H7Z"
                  fill="#ffffff"
                />
                <circle cx="14" cy="16.5" r="2" fill="#fe8450" />
              </svg>
              <span className="font-display font-bold text-lg tracking-tight text-[#0b1c30]">
                Kiln AI
              </span>
            </button>

            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-[#0b1c30] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation */}
          <nav className="p-3 space-y-1" aria-label="Primary sections">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveScreen(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? item.isAiSection
                        ? 'bg-white text-[#2563eb] border border-[#bfdbfe] font-semibold'
                        : 'bg-white text-[#9f3c16] border border-slate-200 font-semibold'
                      : 'text-slate-700 hover:bg-[#e5eeff] hover:text-[#0b1c30]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? item.isAiSection
                          ? 'text-[#2563eb]'
                          : 'text-[#9f3c16]'
                        : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Facility Selector & Director Profile */}
        <div className="p-3 border-t border-slate-200 space-y-3">
          <div>
            <label
              htmlFor="facility-select"
              className="block px-1 text-[11px] font-semibold text-slate-500 mb-1"
            >
              Facility Scope
            </label>
            <select
              id="facility-select"
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value as FacilityId)}
              className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-md text-xs font-medium text-[#0b1c30] focus:outline-none focus:border-[#9f3c16] cursor-pointer"
            >
              {FACILITIES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 px-1 pt-2 border-t border-slate-200/80">
            <div className="w-9 h-9 rounded-md overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
              {!avatarFailed ? (
                <img
                  src="/src/assets/images/plant_director_avatar_1794549847830.jpg"
                  alt="Marcus Vance, Operations Director"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[#0b1c30]">
                  MV
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#0b1c30] truncate">
                Marcus Vance
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                VP Plant Operations
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb Trail + Single Primary Action */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-[#0b1c30] hover:bg-slate-100 rounded-md cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <span className="text-slate-500 hidden sm:inline whitespace-nowrap">
                {activeFacilityMeta.label}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:inline shrink-0" />
              <h1 className="font-display font-semibold text-[#0b1c30] truncate">
                {activeNavMeta.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsNewBatchOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#9f3c16] hover:bg-[#822801] text-white text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Firing Batch</span>
            </button>
          </div>
        </header>

        {/* Active Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          {activeScreen === AppScreen.OVERVIEW && (
            <OperationsOverview
              kilns={visibleKilns}
              selectedKilnId={effectiveSelectedKilnId}
              onSelectKiln={setSelectedKilnId}
              advisories={visibleAdvisories}
              onApplyAdvisory={handleApplyAdvisory}
              onDismissAdvisory={handleDismissAdvisory}
              batches={visibleBatches}
              onInspectBatch={handleInspectBatch}
              onNavigate={setActiveScreen}
              onOpenChatbot={() => setIsChatbotOpen(true)}
            />
          )}

          {activeScreen === AppScreen.KILN_CONTROL && (
            <KilnControlView
              kilns={visibleKilns}
              selectedKilnId={effectiveSelectedKilnId}
              onSelectKiln={setSelectedKilnId}
              onAdjustZoneSetpoint={handleAdjustZoneSetpoint}
              onToggleZoneAiTrim={handleToggleZoneAiTrim}
              onSyncAllAiOptimal={handleSyncAllAiOptimal}
            />
          )}

          {activeScreen === AppScreen.BATCH_LEDGER && (
            <BatchLedgerView
              batches={visibleBatches}
              selectedBatch={selectedBatch}
              onSelectBatch={(b) => setInspectedBatchId(b ? b.id : null)}
              onUpdateBatchStatus={handleUpdateBatchStatus}
              onOpenNewBatchModal={() => setIsNewBatchOpen(true)}
            />
          )}

          {activeScreen === AppScreen.PREDICTIVE_LAB && (
            <PredictiveYieldLab
              recipes={recipes}
              onSaveRecipe={handleSaveRecipe}
              refractoryAssets={refractoryAssets}
              onToggleMaintenance={handleToggleMaintenance}
            />
          )}

          {activeScreen === AppScreen.ENERGY_SUPPLY && (
            <EnergySupplyView
              silos={silos}
              onIssueRestockPo={handleIssueRestockPo}
            />
          )}
        </main>
      </div>

      {/* Log New Firing Batch Modal */}
      <LogBatchModal
        isOpen={isNewBatchOpen}
        kilns={kilns}
        onClose={() => setIsNewBatchOpen(false)}
        onCreateBatch={handleCreateBatch}
      />

      {/* Kiln AI Copilot Chatbot */}
      <KilnChatbot
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen((prev) => !prev)}
        telemetryContext={chatbotTelemetryContext}
      />

      {/* Non-Blocking Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 bg-[#0b1c30] text-[#eaf1ff] text-xs font-medium px-4 py-3 rounded-md border border-slate-700 shadow-lg flex items-center gap-3"
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
