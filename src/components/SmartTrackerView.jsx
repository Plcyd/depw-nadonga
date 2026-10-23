import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Download,
  Plus,
  RotateCcw,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  ArrowUpDown,
  Columns,
  Table,
  Calendar,
  FileText,
} from 'lucide-react';
import styles from '../styles/GlassSystem.module.css';
import {
  TICKET_STATUSES,
  REQUEST_TYPES,
  PRIORITY_LEVELS,
  MANILA_16_DISTRICTS,
  LEGISLATIVE_DISTRICTS,
  ALLOWED_STATUS_TRANSITIONS,
  canTransitionStatus,
  getExplainableNextStep,
  evaluateRequestCompleteness,
  findPotentialDuplicates,
  calculateTicketAge,
  calculateDashboardMetrics,
  ticketsToCsv,
} from '../utils/workflowRules.js';
import { api } from '../services/api.js';
import {
  syncTicketToFirestore,
  logTicketHistoryToFirestore,
} from '../services/firebaseClient.js';

export default function SmartTrackerView({
  tickets = [],
  onRefreshTickets,
  onSelectTicketForMap,
  onOpenLetterStudioWithTicket,
  initialOpenCreate = false,
  onCloseInitialCreate,
}) {
  const [subTab, setSubTab] = useState('table'); // 'table' | 'kanban' | 'schedule' | 'quality'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('ticketId');
  const [sortOrder, setSortOrder] = useState('asc');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedTicketId, setSelectedTicketId] = useState('DEO-2026-001');
  const [ticketDetail, setTicketDetail] = useState(null);
  const [ticketHistory, setTicketHistory] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(initialOpenCreate);
  const [confirmDeleteTicketId, setConfirmDeleteTicketId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [slaThresholdDays, setSlaThresholdDays] = useState(3);

  const [operationsData, setOperationsData] = useState({ assets: [], schedules: [] });
  const [newScheduleForm, setNewScheduleForm] = useState({
    ticketId: 'DEO-2026-001',
    title: '',
    scheduledDate: '2026-10-27',
    scheduleType: 'Site Inspection',
    confirmationStatus: 'Proposed (Awaiting Confirmation)',
    assignedUnit: 'DEO Field Assessment Team A',
    notes: '',
  });

  // Create Ticket Form State
  const [createForm, setCreateForm] = useState({
    barangay: 'Brgy 250 SAMPLE',
    district: 'Tondo',
    legislativeDistrict: '2nd District',
    streetAddress: 'Sample Juan Luna Canal Segment (DUMMY)',
    requestType: 'Declogging',
    priority: 'Elevated',
    requesterName: 'Pedro R. Dela Cruz',
    requesterRole: 'Barangay Kagawad — DUMMY NAME',
    description:
      'Fictional training entry: Requesting declogging of silted storm drain and lateral gutter along Sample Street.',
    latitude: 14.6195,
    longitude: 120.9678,
    coordSource: 'User-Selected Demo Pin',
    coordVerified: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Status Transition Form State
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    newStatus: 'Inspection Scheduled',
    actionTaken: 'Inspection coordination initiated with Barangay official',
    nextStep: 'Conduct joint ocular assessment',
    actorName: 'Authorized DEO Liaison Officer (Demo)',
  });

  useEffect(() => {
    if (initialOpenCreate) {
      setShowCreateModal(true);
      if (onCloseInitialCreate) onCloseInitialCreate();
    }
  }, [initialOpenCreate, onCloseInitialCreate]);

  useEffect(() => {
    api
      .getOperationsData()
      .then((data) => setOperationsData(data))
      .catch(() => {});
  }, []);

  const showToast = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load selected ticket detail + history
  useEffect(() => {
    if (!selectedTicketId) return;
    let active = true;
    setDetailLoading(true);
    api
      .getTicketById(selectedTicketId)
      .then((res) => {
        if (!active) return;
        setTicketDetail(res.ticket);
        setTicketHistory(res.history || []);
        const explain = getExplainableNextStep(res.ticket.status);
        const allowed = ALLOWED_STATUS_TRANSITIONS[res.ticket.status] || [];
        setStatusUpdateForm((prev) => ({
          ...prev,
          newStatus: allowed[0] || res.ticket.status,
          actionTaken: explain.suggestedActionTaken,
          nextStep: explain.suggestedNextStep,
        }));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedTicketId, tickets]);

  const metrics = useMemo(() => calculateDashboardMetrics(tickets), [tickets]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = tickets.filter((t) => {
      const matchQ =
        !q ||
        t.ticketId.toLowerCase().includes(q) ||
        t.barangay.toLowerCase().includes(q) ||
        t.district.toLowerCase().includes(q) ||
        t.streetAddress.toLowerCase().includes(q) ||
        t.requesterName.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchType = typeFilter === 'ALL' || t.requestType === typeFilter;
      const matchDistrict = districtFilter === 'ALL' || t.district === districtFilter;
      return matchQ && matchStatus && matchType && matchDistrict;
    });

    const dir = sortOrder === 'desc' ? -1 : 1;
    list.sort((a, b) => {
      const valA = String(a[sortBy] || '');
      const valB = String(b[sortBy] || '');
      return valA.localeCompare(valB, undefined, { numeric: true }) * dir;
    });
    return list;
  }, [tickets, searchQuery, statusFilter, typeFilter, districtFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const completenessCheck = useMemo(
    () => evaluateRequestCompleteness(createForm),
    [createForm]
  );

  const duplicateWarnings = useMemo(
    () => findPotentialDuplicates(createForm, tickets),
    [createForm, tickets]
  );

  const handleSortColumn = (col) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  const handleDistrictSelectInForm = (districtName) => {
    const found = MANILA_16_DISTRICTS.find((d) => d.name === districtName);
    setCreateForm((prev) => ({
      ...prev,
      district: districtName,
      legislativeDistrict: found ? found.legislativeDistrict : prev.legislativeDistrict,
      latitude: found ? found.lat : prev.latitude,
      longitude: found ? found.lng : prev.longitude,
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!createForm.barangay || createForm.barangay.trim().length < 2) {
      errs.barangay = 'Barangay name is required.';
    }
    if (!createForm.streetAddress || createForm.streetAddress.trim().length < 3) {
      errs.streetAddress = 'Street or canal segment is required.';
    }
    if (!createForm.requesterName || createForm.requesterName.trim().length < 2) {
      errs.requesterName = 'Coordinating Barangay official name is required.';
    }
    if (!createForm.description || createForm.description.trim().length < 5) {
      errs.description = 'Description must be at least 5 characters.';
    }
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setSubmitting(true);
    setFormErrors({});
    try {
      const res = await api.createTicket(createForm);
      if (res.ticket) {
        await syncTicketToFirestore(res.ticket).catch(() => {});
        await onRefreshTickets();
        setSelectedTicketId(res.ticket.ticketId);
        setShowCreateModal(false);
        showToast('success', `Created fictional ticket ${res.ticket.ticketId} in Smart Tracker.`);
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusTransition = async (e) => {
    e.preventDefault();
    if (!ticketDetail) return;
    if (!canTransitionStatus(ticketDetail.status, statusUpdateForm.newStatus)) {
      showToast(
        'error',
        `Transition from "${ticketDetail.status}" to "${statusUpdateForm.newStatus}" is not allowed.`
      );
      return;
    }

    try {
      const res = await api.transitionTicketStatus(ticketDetail.ticketId, statusUpdateForm);
      if (res.ticket) {
        await syncTicketToFirestore(res.ticket).catch(() => {});
        await logTicketHistoryToFirestore(
          res.ticket.ticketId,
          ticketDetail.status,
          res.ticket.status,
          statusUpdateForm.actionTaken
        ).catch(() => {});
        setTicketDetail(res.ticket);
        setTicketHistory(res.history || []);
        await onRefreshTickets();
        showToast(
          'success',
          `Updated ${res.ticket.ticketId} status to "${res.ticket.status}".`
        );
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Status update failed.');
    }
  };

  const handleToggleChecklistItem = async (idx) => {
    if (!ticketDetail) return;
    const currentList = Array.isArray(ticketDetail.inspectionChecklist)
      ? [...ticketDetail.inspectionChecklist]
      : [];
    if (!currentList[idx]) return;
    currentList[idx] = { ...currentList[idx], done: !currentList[idx].done };

    try {
      const res = await api.updateTicket(ticketDetail.ticketId, {
        inspectionChecklist: currentList,
        actionTaken: `Updated inspection checklist item: "${currentList[idx].item}"`,
      });
      setTicketDetail(res.ticket);
      setTicketHistory(res.history || []);
      await onRefreshTickets();
    } catch (err) {
      showToast('error', 'Failed to update checklist item.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteTicketId) return;
    try {
      await api.deleteTicket(confirmDeleteTicketId);
      setConfirmDeleteTicketId(null);
      await onRefreshTickets();
      if (tickets.length > 1) {
        const remaining = tickets.filter((t) => t.ticketId !== confirmDeleteTicketId);
        setSelectedTicketId(remaining[0]?.ticketId || '');
      }
      showToast('success', `Deleted sample ticket ${confirmDeleteTicketId}.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const handleExportCsv = () => {
    const csvContent = ticketsToCsv(filteredTickets);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `depw-smart-tracker-sample-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', `Exported ${filteredTickets.length} filtered records to CSV.`);
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!newScheduleForm.title.trim()) {
      showToast('error', 'Please enter a schedule title.');
      return;
    }
    try {
      const res = await api.createScheduleEvent(newScheduleForm);
      setOperationsData((prev) => ({ ...prev, schedules: res.schedules || prev.schedules }));
      setNewScheduleForm((prev) => ({ ...prev, title: '', notes: '' }));
      showToast('success', 'Added proposed coordination schedule entry.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to add schedule.');
    }
  };

  return (
    <section aria-label="Smart Tracker Operations Workspace" className="space-y-6">
      {notification && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border text-sm font-medium flex items-center justify-between ${
            notification.type === 'error'
              ? 'bg-rose-950/80 border-rose-400/40 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-400/40 text-emerald-200'
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Top Metric Cards */}
      <div className={styles.glassPanel}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <div className="text-xs font-mono text-cyan-400">
              SMART TRACKER • PERSISTENT SQLITE + FIRESTORE REGISTER • SAMPLE DATA
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Smart Tracker: One View of Every Request
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className={styles.orangeActionBtn}
            >
              <span className="inline-flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add Request
              </span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className={styles.secondaryBtn}
            >
              <span className="inline-flex items-center gap-1.5">
                <Download className="w-4 h-4" /> Export CSV ({filteredTickets.length})
              </span>
            </button>
          </div>
        </div>

        {/* 5 Required Top Metric Cards */}
        <div className={styles.metricGrid}>
          <div className={styles.metricTile}>
            <div className="text-xs font-mono text-slate-300">TOTAL REQUESTS</div>
            <div className={styles.metricValue}>{metrics.totalRequests}</div>
            <div className="text-xs text-slate-400 mt-1">Persisted Demo Records</div>
          </div>
          <div className={styles.metricTile}>
            <div className="text-xs font-mono text-amber-300">PENDING VERIFICATION</div>
            <div className={styles.metricValue}>{metrics.pendingVerification}</div>
            <div className="text-xs text-slate-400 mt-1">Intake & Clarification</div>
          </div>
          <div className={styles.metricTile}>
            <div className="text-xs font-mono text-sky-300">PENDING EVALUATION</div>
            <div className={styles.metricValue}>{metrics.pendingEvaluation}</div>
            <div className="text-xs text-slate-400 mt-1">Endorsed to DEO Team</div>
          </div>
          <div className={styles.metricTile}>
            <div className="text-xs font-mono text-cyan-300">INSPECTION SCHEDULED</div>
            <div className={styles.metricValue}>{metrics.inspectionScheduled}</div>
            <div className="text-xs text-slate-400 mt-1">Ocular & Operational Queue</div>
          </div>
          <div className={styles.metricTile}>
            <div className="text-xs font-mono text-emerald-300">COMPLETED REQUESTS</div>
            <div className={styles.metricValue}>{metrics.completedRequests}</div>
            <div className="text-xs text-slate-400 mt-1">Verified & Closed</div>
          </div>
        </div>

        {/* Sub-Navigation Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-sky-400/15">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSubTab('table')}
              className={subTab === 'table' ? styles.primaryActionBtn : styles.secondaryBtn}
            >
              <span className="inline-flex items-center gap-1.5">
                <Table className="w-4 h-4" /> Register Table & Inspector
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('kanban')}
              className={subTab === 'kanban' ? styles.primaryActionBtn : styles.secondaryBtn}
            >
              <span className="inline-flex items-center gap-1.5">
                <Columns className="w-4 h-4" /> Kanban Workflow Board
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('schedule')}
              className={subTab === 'schedule' ? styles.primaryActionBtn : styles.secondaryBtn}
            >
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Scheduling & Drainage Assets
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('quality')}
              className={subTab === 'quality' ? styles.primaryActionBtn : styles.secondaryBtn}
            >
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Data Quality & Analytics
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <label htmlFor="sla-days-input">Demo Aging Threshold (Days):</label>
            <input
              id="sla-days-input"
              type="number"
              min={1}
              max={30}
              value={slaThresholdDays}
              onChange={(e) => setSlaThresholdDays(Number(e.target.value) || 3)}
              className="w-16 bg-slate-900 border border-sky-400/30 rounded px-2 py-1 text-center font-mono"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: REGISTER TABLE & DETAILED INSPECTOR */}
      {subTab === 'table' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Search, Filters & Request Table */}
          <div className={`${styles.glassPanel} lg:col-span-7 space-y-4`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="sm:col-span-2 relative">
                <label htmlFor="tracker-search" className="sr-only">
                  Search by Ticket ID, Barangay, or Street
                </label>
                <input
                  id="tracker-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search Ticket ID, Barangay, Street..."
                  className={styles.inputControl}
                />
              </div>

              <div>
                <label htmlFor="tracker-status-filter" className="sr-only">
                  Filter by Status
                </label>
                <select
                  id="tracker-status-filter"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={styles.inputControl}
                >
                  <option value="ALL">All Statuses</option>
                  {TICKET_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tracker-type-filter" className="sr-only">
                  Filter by Request Type
                </label>
                <select
                  id="tracker-type-filter"
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={styles.inputControl}
                >
                  <option value="ALL">All Request Types</option>
                  {REQUEST_TYPES.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span>District Filter:</span>
                <select
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by Manila District"
                  className="bg-slate-900 border border-sky-400/30 rounded px-2 py-1 text-white"
                >
                  <option value="ALL">All 16 Manila Districts</option>
                  {MANILA_16_DISTRICTS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} ({d.legislativeDistrict})
                    </option>
                  ))}
                </select>
              </div>

              {(searchQuery ||
                statusFilter !== 'ALL' ||
                typeFilter !== 'ALL' ||
                districtFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setTypeFilter('ALL');
                    setDistrictFilter('ALL');
                    setCurrentPage(1);
                  }}
                  className={styles.secondaryBtn}
                >
                  <span className="inline-flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
                  </span>
                </button>
              )}
            </div>

            {paginatedTickets.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-900/60 border border-sky-400/15 space-y-3">
                <div className="text-base font-bold text-white">No Matching Requests Found</div>
                <p className="text-xs text-slate-300">
                  No demonstration tickets match your current search or filter criteria.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setTypeFilter('ALL');
                    setDistrictFilter('ALL');
                  }}
                  className={styles.primaryActionBtn}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className={styles.dataTableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>
                        <button
                          type="button"
                          onClick={() => handleSortColumn('dateReceived')}
                          className="inline-flex items-center gap-1 text-sky-300 cursor-pointer"
                        >
                          Date Received <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          onClick={() => handleSortColumn('ticketId')}
                          className="inline-flex items-center gap-1 text-sky-300 cursor-pointer"
                        >
                          Ticket ID <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          onClick={() => handleSortColumn('barangay')}
                          className="inline-flex items-center gap-1 text-sky-300 cursor-pointer"
                        >
                          Barangay <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th>Request Type</th>
                      <th>Status</th>
                      <th>Action Taken</th>
                      <th>Next Step</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTickets.map((t) => {
                      const isSelected = t.ticketId === selectedTicketId;
                      const age = calculateTicketAge(t.createdAt, new Date('2026-10-23T00:00:00Z'), slaThresholdDays);
                      return (
                        <tr
                          key={t.ticketId}
                          onClick={() => setSelectedTicketId(t.ticketId)}
                          className={`cursor-pointer ${
                            isSelected ? 'bg-sky-500/20' : ''
                          }`}
                        >
                          <td className="tabular-nums whitespace-nowrap">{t.dateReceived}</td>
                          <td className="tabular-nums font-bold text-cyan-300 whitespace-nowrap">
                            {t.ticketId}
                          </td>
                          <td>
                            <div className="font-semibold text-white">{t.barangay}</div>
                            <div className="text-xs text-slate-400">
                              {t.district} · {t.legislativeDistrict}
                            </div>
                          </td>
                          <td>{t.requestType}</td>
                          <td>
                            <div className="font-semibold text-sky-200">{t.status}</div>
                            <div className="text-[11px] text-slate-400 tabular-nums">
                              {age.label} {age.isAging && t.status !== 'Closed' ? '· Follow-up' : ''}
                            </div>
                          </td>
                          <td className="max-w-[160px] truncate" title={t.actionTaken}>
                            {t.actionTaken}
                          </td>
                          <td className="max-w-[160px] truncate" title={t.nextStep}>
                            {t.nextStep}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-300">
              <div className="tabular-nums">
                Showing {paginatedTickets.length} of {filteredTickets.length} records
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="page-size-select">Rows:</label>
                <select
                  id="page-size-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-900 border border-sky-400/30 rounded px-2 py-1"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={styles.secondaryBtn}
                >
                  Prev
                </button>
                <span className="tabular-nums">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={styles.secondaryBtn}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Detailed Ticket Inspector, Explainable Next Step, Status Update & Audit Timeline */}
          <div className={`${styles.glassPanel} lg:col-span-5 space-y-5`}>
            {detailLoading && !ticketDetail ? (
              <div className="text-sm text-slate-300 py-8 text-center">
                Loading ticket details...
              </div>
            ) : ticketDetail ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-sky-400/20 pb-3">
                  <div>
                    <div className="text-xs font-mono text-cyan-400">
                      SELECTED TICKET INSPECTOR • {ticketDetail.ticketId}
                    </div>
                    <h2 className="text-xl font-bold text-white mt-0.5">
                      {ticketDetail.barangay} — {ticketDetail.requestType}
                    </h2>
                    <div className="text-xs text-slate-300 mt-0.5">
                      {ticketDetail.streetAddress} · {ticketDetail.district} ({ticketDetail.legislativeDistrict})
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectTicketForMap && onSelectTicketForMap(ticketDetail)}
                      className={styles.primaryActionBtn}
                    >
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> View on Map
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenLetterStudioWithTicket && onOpenLetterStudioWithTicket(ticketDetail)
                      }
                      className={styles.secondaryBtn}
                      title="Open in AI & Gmail Liaison Hub"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteTicketId(ticketDetail.ticketId)}
                      aria-label={`Delete ${ticketDetail.ticketId}`}
                      className="p-2 rounded-lg bg-rose-950/60 border border-rose-400/30 text-rose-300 hover:bg-rose-900/60 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metadata Summary */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/70 p-3.5 rounded-xl border border-sky-400/15">
                  <div>
                    <span className="text-slate-400">Current Status:</span>
                    <div className="font-bold text-cyan-300 mt-0.5">{ticketDetail.status}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Priority Level:</span>
                    <div className="font-bold text-white mt-0.5">{ticketDetail.priority}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Coordinating Official:</span>
                    <div className="font-semibold text-white mt-0.5">
                      {ticketDetail.requesterName} ({ticketDetail.requesterRole})
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Map Pin Status:</span>
                    <div className="font-mono text-sky-200 mt-0.5 tabular-nums">
                      {ticketDetail.latitude && ticketDetail.longitude
                        ? `${Number(ticketDetail.latitude).toFixed(4)}, ${Number(
                            ticketDetail.longitude
                          ).toFixed(4)} (${ticketDetail.coordVerified ? 'Verified Demo Pin' : 'Unverified Pin'})`
                        : 'Location not pinned'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Request Description:</span>
                    <p className="text-slate-200 mt-0.5 leading-relaxed">
                      {ticketDetail.description}
                    </p>
                  </div>
                </div>

                {/* Explainable Next-Step Suggestion Panel */}
                {ticketDetail.explainableSuggestion && (
                  <div className="p-3.5 rounded-xl bg-sky-950/55 border border-cyan-400/30 space-y-1.5">
                    <div className="text-xs font-mono text-cyan-300 font-bold">
                      EXPLAINABLE NEXT-STEP SUGGESTION (HUMAN DECISION REQUIRED)
                    </div>
                    <div className="text-xs text-white font-semibold">
                      Recommended Target Status:{' '}
                      <span className="text-cyan-300">
                        {ticketDetail.explainableSuggestion.suggestedNextStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {ticketDetail.explainableSuggestion.rationale}
                    </p>
                  </div>
                )}

                {/* Field Inspection Checklist */}
                <div className="space-y-2">
                  <div className="text-xs font-mono text-sky-300 font-semibold">
                    FIELD INSPECTION & COMPLETENESS CHECKLIST
                  </div>
                  <div className="space-y-1.5">
                    {(ticketDetail.inspectionChecklist || []).map((item, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-sky-400/15 text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(item.done)}
                          onChange={() => handleToggleChecklistItem(idx)}
                          className="rounded border-sky-400"
                        />
                        <span className={item.done ? 'line-through text-slate-400' : 'text-white'}>
                          {item.item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Update Status Form */}
                <form
                  onSubmit={handleStatusTransition}
                  className="p-4 rounded-xl bg-slate-900/80 border border-sky-400/25 space-y-3"
                >
                  <div className="text-xs font-mono text-cyan-300 font-bold">
                    UPDATE WORKFLOW STATUS (ENFORCES ALLOWED TRANSITIONS)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="next-status-select" className="block text-xs text-slate-300 mb-1">
                        New Status
                      </label>
                      <select
                        id="next-status-select"
                        value={statusUpdateForm.newStatus}
                        onChange={(e) =>
                          setStatusUpdateForm((prev) => ({ ...prev, newStatus: e.target.value }))
                        }
                        className={styles.inputControl}
                      >
                        <option value={ticketDetail.status}>{ticketDetail.status} (Current)</option>
                        {(ALLOWED_STATUS_TRANSITIONS[ticketDetail.status] || []).map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="actor-name-input" className="block text-xs text-slate-300 mb-1">
                        Recorded By (Demo Role)
                      </label>
                      <input
                        id="actor-name-input"
                        type="text"
                        value={statusUpdateForm.actorName}
                        onChange={(e) =>
                          setStatusUpdateForm((prev) => ({ ...prev, actorName: e.target.value }))
                        }
                        className={styles.inputControl}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="action-taken-input" className="block text-xs text-slate-300 mb-1">
                      Action Taken
                    </label>
                    <input
                      id="action-taken-input"
                      type="text"
                      value={statusUpdateForm.actionTaken}
                      onChange={(e) =>
                        setStatusUpdateForm((prev) => ({ ...prev, actionTaken: e.target.value }))
                      }
                      className={styles.inputControl}
                    />
                  </div>
                  <div>
                    <label htmlFor="next-step-input" className="block text-xs text-slate-300 mb-1">
                      Expected Next Step
                    </label>
                    <input
                      id="next-step-input"
                      type="text"
                      value={statusUpdateForm.nextStep}
                      onChange={(e) =>
                        setStatusUpdateForm((prev) => ({ ...prev, nextStep: e.target.value }))
                      }
                      className={styles.inputControl}
                    />
                  </div>
                  <button type="submit" className={styles.primaryActionBtn}>
                    Record Status Update in Audit Trail
                  </button>
                </form>

                {/* Chronological Activity History Timeline */}
                <div className="space-y-2">
                  <div className="text-xs font-mono text-sky-300 font-semibold">
                    AUDIT & STATUS HISTORY TIMELINE ({ticketHistory.length} EVENTS)
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {ticketHistory.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-2.5 rounded-lg bg-slate-950/75 border border-sky-400/15 text-xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between text-cyan-300 font-mono">
                          <span>
                            {ev.previousStatus} → {ev.newStatus}
                          </span>
                          <span className="tabular-nums text-slate-400">
                            {new Date(ev.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-white font-medium">{ev.actionTaken}</div>
                        <div className="text-slate-400">
                          Actor: {ev.actorName} ({ev.actorRole})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-300 py-8 text-center">
                Select a ticket from the Smart Tracker table to inspect its workflow status and audit trail.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: CONFIGURABLE KANBAN WORKFLOW BOARD */}
      {subTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Intake & Verification',
              statuses: ['For Verification', 'Returned for Clarification'],
            },
            {
              title: 'Engineering Evaluation',
              statuses: ['Pending Evaluation'],
            },
            {
              title: 'Inspection & Scheduling',
              statuses: ['Inspection Scheduled', 'Scheduled for Implementation'],
            },
            {
              title: 'Implementation & Closure',
              statuses: ['In Progress', 'Completed', 'Closed'],
            },
          ].map((col) => {
            const colTickets = tickets.filter((t) => col.statuses.includes(t.status));
            return (
              <div key={col.title} className={`${styles.glassPanel} space-y-3`}>
                <div className="flex items-center justify-between border-b border-sky-400/20 pb-2">
                  <h3 className="text-sm font-bold text-white">{col.title}</h3>
                  <span className="text-xs font-mono text-cyan-300 tabular-nums">
                    {colTickets.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {colTickets.map((t) => (
                    <div
                      key={t.ticketId}
                      className={styles.glassCardInteractive}
                      onClick={() => {
                        setSelectedTicketId(t.ticketId);
                        setSubTab('table');
                      }}
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-cyan-300 font-bold">{t.ticketId}</span>
                        <span className="text-slate-400">{t.dateReceived}</span>
                      </div>
                      <div className="font-bold text-white text-sm mt-1">{t.barangay}</div>
                      <div className="text-xs text-slate-300 mt-0.5">{t.streetAddress}</div>
                      <div className="text-xs text-sky-300 mt-2 font-medium">
                        {t.status} · {t.requestType}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: SCHEDULING CALENDAR & DRAINAGE ASSET REGISTRY */}
      {subTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={`${styles.glassPanel} lg:col-span-7 space-y-4`}>
            <div>
              <div className="text-xs font-mono text-cyan-400">
                COORDINATION SCHEDULE • PROPOSED VS CONFIRMED DEMO EVENTS
              </div>
              <h2 className="text-xl font-bold text-white">
                Inspection & Field Operations Calendar
              </h2>
            </div>

            <div className="space-y-3">
              {operationsData.schedules.map((sch) => (
                <div
                  key={sch.eventId}
                  className="p-4 rounded-xl bg-slate-900/75 border border-sky-400/20 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-mono text-cyan-300">
                      {sch.scheduledDate} · {sch.ticketId} · {sch.scheduleType}
                    </div>
                    <div className="text-sm font-bold text-white">{sch.title}</div>
                    <div className="text-xs text-slate-300">
                      Unit: {sch.assignedUnit} — {sch.notes}
                    </div>
                  </div>
                  <div className="text-xs font-mono font-semibold text-amber-300">
                    {sch.confirmationStatus}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleCreateSchedule}
              className="p-4 rounded-xl bg-slate-950/75 border border-sky-400/20 space-y-3"
            >
              <div className="text-xs font-mono text-sky-300 font-bold">
                + PROPOSE COORDINATION SCHEDULE (TRAINING DEMO)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={newScheduleForm.ticketId}
                  onChange={(e) =>
                    setNewScheduleForm((prev) => ({ ...prev, ticketId: e.target.value }))
                  }
                  aria-label="Select ticket for schedule"
                  className={styles.inputControl}
                >
                  {tickets.map((t) => (
                    <option key={t.ticketId} value={t.ticketId}>
                      {t.ticketId} ({t.barangay})
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newScheduleForm.scheduledDate}
                  onChange={(e) =>
                    setNewScheduleForm((prev) => ({ ...prev, scheduledDate: e.target.value }))
                  }
                  aria-label="Scheduled date"
                  className={styles.inputControl}
                />
                <select
                  value={newScheduleForm.confirmationStatus}
                  onChange={(e) =>
                    setNewScheduleForm((prev) => ({
                      ...prev,
                      confirmationStatus: e.target.value,
                    }))
                  }
                  aria-label="Schedule confirmation status"
                  className={styles.inputControl}
                >
                  <option value="Proposed (Awaiting Confirmation)">
                    Proposed (Awaiting Confirmation)
                  </option>
                  <option value="Confirmed Demo Schedule">Confirmed Demo Schedule</option>
                </select>
              </div>
              <input
                type="text"
                value={newScheduleForm.title}
                onChange={(e) =>
                  setNewScheduleForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Schedule activity title (e.g., Joint Ocular Inspection at Sample Street)"
                className={styles.inputControl}
              />
              <button type="submit" className={styles.primaryActionBtn}>
                Save Schedule Entry
              </button>
            </form>
          </div>

          <div className={`${styles.glassPanel} lg:col-span-5 space-y-4`}>
            <div>
              <div className="text-xs font-mono text-cyan-400">
                VERIFIED DRAINAGE ASSET REGISTRY (DEMO)
              </div>
              <h2 className="text-xl font-bold text-white">
                Manila Drainage Infrastructure Profiles
              </h2>
            </div>
            <div className="space-y-3">
              {operationsData.assets.map((asset) => (
                <div
                  key={asset.assetId}
                  className="p-3.5 rounded-xl bg-slate-900/75 border border-sky-400/20 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-cyan-300">
                    <span>{asset.assetId}</span>
                    <span>
                      {asset.district} ({asset.legislativeDistrict})
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">{asset.name}</div>
                  <div className="text-slate-300">
                    {asset.assetType} · {asset.dimensions}
                  </div>
                  <div className="text-sky-200">
                    Condition: {asset.conditionStatus} · Last Inspected: {asset.lastInspected}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: DATA QUALITY & ANALYTICS */}
      {subTab === 'quality' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${styles.glassPanel} space-y-4`}>
            <div className="text-xs font-mono text-cyan-400">
              REAL DATABASE ANALYTICS • CALCULATED FROM PERSISTED TICKETS
            </div>
            <h2 className="text-xl font-bold text-white">
              Requests by Workflow Status & Service Type
            </h2>
            <div className="space-y-2.5">
              {TICKET_STATUSES.map((st) => {
                const count = metrics.byStatus[st] || 0;
                const pct =
                  metrics.totalRequests > 0
                    ? Math.round((count / metrics.totalRequests) * 100)
                    : 0;
                return (
                  <div key={st} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-200 font-medium">{st}</span>
                      <span className="font-mono text-cyan-300 tabular-nums">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${styles.glassPanel} space-y-4`}>
            <div className="text-xs font-mono text-amber-300">
              DATA-QUALITY & PRIVACY RETENTION AUDIT
            </div>
            <h2 className="text-xl font-bold text-white">
              Records Needing Location Verification or Clarification
            </h2>
            <div className="space-y-2.5">
              {tickets.map((t) => {
                const comp = evaluateRequestCompleteness(t);
                return (
                  <div
                    key={t.ticketId}
                    className="p-3 rounded-xl bg-slate-900/70 border border-sky-400/15 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">
                        {t.ticketId} — {t.barangay}
                      </div>
                      <div className="text-slate-300">
                        {t.coordVerified ? 'Verified Demo Coordinates' : 'Unverified Pin / Review Needed'} ·{' '}
                        {t.status}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-cyan-300 tabular-nums">
                      Completeness: {comp.score}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW BARANGAY DECLOGGING REQUEST */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-ticket-title"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className={`${styles.glassPanel} max-w-2xl w-full space-y-4 my-8`}>
            <div className="flex items-center justify-between border-b border-sky-400/20 pb-3">
              <div>
                <div className="text-xs font-mono text-cyan-400">
                  SMART TRACKER INTAKE • FICTIONAL DEMONSTRATION ENTRY
                </div>
                <h2 id="create-ticket-title" className="text-xl font-bold text-white">
                  Log New Barangay Declogging Request
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className={styles.secondaryBtn}
              >
                Close
              </button>
            </div>

            {/* Completeness Assistant Checklist */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-sky-400/25 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-300 font-bold">
                  REQUEST COMPLETENESS ASSISTANT
                </span>
                <span className="tabular-nums text-white font-bold">
                  {completenessCheck.score}% COMPLETE
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                {completenessCheck.checks.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <span className={c.passed ? 'text-emerald-400' : 'text-amber-300'}>
                      {c.passed ? '✓' : '○'}
                    </span>
                    <span className={c.passed ? 'text-slate-200' : 'text-amber-200'}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Duplicate Request Warning */}
            {duplicateWarnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-400/40 text-xs text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Possible Similar Active Request(s) Detected (Warning Only — Will Not Auto-Reject):
                </div>
                {duplicateWarnings.map((d) => (
                  <div key={d.ticketId}>
                    • {d.ticketId}: {d.barangay} — {d.streetAddress} ({d.status})
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="create-brgy" className="block text-xs text-slate-300 mb-1">
                    Sample Barangay Name *
                  </label>
                  <input
                    id="create-brgy"
                    type="text"
                    value={createForm.barangay}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, barangay: e.target.value }))
                    }
                    className={styles.inputControl}
                  />
                  {formErrors.barangay && (
                    <div className="text-xs text-rose-400 mt-1">{formErrors.barangay}</div>
                  )}
                </div>

                <div>
                  <label htmlFor="create-district" className="block text-xs text-slate-300 mb-1">
                    Manila District (16 Recognized) *
                  </label>
                  <select
                    id="create-district"
                    value={createForm.district}
                    onChange={(e) => handleDistrictSelectInForm(e.target.value)}
                    className={styles.inputControl}
                  >
                    {MANILA_16_DISTRICTS.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="create-leg-district" className="block text-xs text-slate-300 mb-1">
                    Legislative District
                  </label>
                  <select
                    id="create-leg-district"
                    value={createForm.legislativeDistrict}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, legislativeDistrict: e.target.value }))
                    }
                    className={styles.inputControl}
                  >
                    {LEGISLATIVE_DISTRICTS.map((ld) => (
                      <option key={ld.id} value={ld.id}>
                        {ld.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="create-street" className="block text-xs text-slate-300 mb-1">
                    Fictional Street / Drainage Segment *
                  </label>
                  <input
                    id="create-street"
                    type="text"
                    value={createForm.streetAddress}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, streetAddress: e.target.value }))
                    }
                    className={styles.inputControl}
                  />
                  {formErrors.streetAddress && (
                    <div className="text-xs text-rose-400 mt-1">{formErrors.streetAddress}</div>
                  )}
                </div>

                <div>
                  <label htmlFor="create-type" className="block text-xs text-slate-300 mb-1">
                    Request Type
                  </label>
                  <select
                    id="create-type"
                    value={createForm.requestType}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, requestType: e.target.value }))
                    }
                    className={styles.inputControl}
                  >
                    {REQUEST_TYPES.map((rt) => (
                      <option key={rt} value={rt}>
                        {rt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="create-requester" className="block text-xs text-slate-300 mb-1">
                    Coordinating Official (Dummy Name) *
                  </label>
                  <input
                    id="create-requester"
                    type="text"
                    value={createForm.requesterName}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, requesterName: e.target.value }))
                    }
                    className={styles.inputControl}
                  />
                  {formErrors.requesterName && (
                    <div className="text-xs text-rose-400 mt-1">{formErrors.requesterName}</div>
                  )}
                </div>
                <div>
                  <label htmlFor="create-priority" className="block text-xs text-slate-300 mb-1">
                    Priority Classification
                  </label>
                  <select
                    id="create-priority"
                    value={createForm.priority}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, priority: e.target.value }))
                    }
                    className={styles.inputControl}
                  >
                    {PRIORITY_LEVELS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="create-coords" className="block text-xs text-slate-300 mb-1">
                    Demo Coordinates (Lat, Lng)
                  </label>
                  <input
                    id="create-coords"
                    type="text"
                    readOnly
                    value={`${createForm.latitude}, ${createForm.longitude}`}
                    className={`${styles.inputControl} font-mono text-xs`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="create-desc" className="block text-xs text-slate-300 mb-1">
                  Request Details & Observed Drainage Obstruction *
                </label>
                <textarea
                  id="create-desc"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className={styles.inputControl}
                />
                {formErrors.description && (
                  <div className="text-xs text-rose-400 mt-1">{formErrors.description}</div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={styles.secondaryBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.primaryActionBtn}
                >
                  {submitting ? 'Saving to SQLite...' : 'Save Request in Smart Tracker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE DESTRUCTIVE ACTION */}
      {confirmDeleteTicketId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className={`${styles.glassPanel} max-w-md w-full space-y-4`}>
            <h3 className="text-lg font-bold text-white">
              Confirm Delete Ticket {confirmDeleteTicketId}?
            </h3>
            <p className="text-sm text-slate-300">
              This will permanently remove demonstration ticket{' '}
              <strong className="text-cyan-300">{confirmDeleteTicketId}</strong> and its audit history from the SQLite database.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteTicketId(null)}
                className={styles.secondaryBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
