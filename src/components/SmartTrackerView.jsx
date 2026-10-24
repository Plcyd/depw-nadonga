import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  Plus,
  RotateCcw,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ArrowUpDown,
  Columns,
  Table,
  Calendar,
  FileText,
  History,
  Edit3,
  Layers,
  RefreshCw,
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
  getWhatShouldIDoNext,
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
  focusedTicketId,
  initialInspectorTab,
  initialStatusFilter,
  onOpenJourneyReplay,
}) {
  const [subTab, setSubTab] = useState('table'); // 'table' | 'kanban' | 'schedule' | 'quality'
  const [inspectorTab, setInspectorTab] = useState(initialInspectorTab || 'overview'); // 'overview' | 'audit' | 'edit'
  const [auditTypeFilter, setAuditTypeFilter] = useState('ALL');
  const [auditSortOrder, setAuditSortOrder] = useState('desc');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'ALL');

  useEffect(() => {
    if (initialStatusFilter && initialStatusFilter !== 'ALL') {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('ticketId');
  const [sortOrder, setSortOrder] = useState('asc');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedTicketId, setSelectedTicketId] = useState(focusedTicketId || 'DEO-2026-001');
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
    assignedUnit: 'DEPW Field Assessment Team A',
    notes: '',
  });

  // Create Ticket Form State
  const [createForm, setCreateForm] = useState({
    barangay: 'Barangay 250, Zone 23',
    district: 'Tondo',
    legislativeDistrict: '2nd District',
    streetAddress: 'Juan Luna St. Canal Segment near Tayuman',
    requestType: 'Declogging',
    priority: 'Elevated',
    requesterName: 'Pedro R. Dela Cruz',
    requesterRole: 'Barangay Kagawad',
    description:
      'Requesting declogging of silted storm drain and lateral gutter along Juan Luna Street.',
    latitude: 14.6195,
    longitude: 120.9678,
    coordSource: 'Verified Street Pin',
    coordVerified: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Status Transition Form State
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    newStatus: 'Inspection Scheduled',
    actionTaken: 'Inspection coordination initiated with Barangay official',
    nextStep: 'Conduct joint ocular assessment',
    actorName: 'Authorized DEPW Liaison Officer',
  });

  // Ticket Details Edit Form State
  const [editForm, setEditForm] = useState({
    barangay: '',
    district: 'Tondo',
    legislativeDistrict: '1st District',
    streetAddress: '',
    requestType: 'Declogging',
    priority: 'Routine',
    requesterName: '',
    requesterRole: 'Barangay Kagawad',
    description: '',
    coordVerified: true,
    actorName: 'Engr. R. Villanueva (DEPW Field Review)',
    actorRole: 'Area Engineering Supervisor',
  });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (focusedTicketId) {
      setSelectedTicketId(focusedTicketId);
      setSubTab('table');
    }
  }, [focusedTicketId]);

  useEffect(() => {
    if (initialInspectorTab) {
      setInspectorTab(initialInspectorTab);
    }
  }, [initialInspectorTab]);

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

  // Load selected ticket detail + server-side audit history
  useEffect(() => {
    if (!selectedTicketId) return;
    let active = true;
    setDetailLoading(true);
    api
      .getTicketById(selectedTicketId)
      .then((res) => {
        if (!active || !res.ticket) return;
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
        setEditForm({
          barangay: res.ticket.barangay || '',
          district: res.ticket.district || 'Tondo',
          legislativeDistrict: res.ticket.legislativeDistrict || '1st District',
          streetAddress: res.ticket.streetAddress || '',
          requestType: res.ticket.requestType || 'Declogging',
          priority: res.ticket.priority || 'Routine',
          requesterName: res.ticket.requesterName || '',
          requesterRole: res.ticket.requesterRole || 'Barangay Kagawad',
          description: res.ticket.description || '',
          coordVerified: Boolean(res.ticket.coordVerified),
          actorName: 'Engr. R. Villanueva (DEPW Field Review)',
          actorRole: 'Area Engineering Supervisor',
        });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedTicketId, tickets]);

  const handleRefreshAuditLog = async () => {
    if (!ticketDetail) return;
    try {
      const res = await api.getTicketAuditLogs(ticketDetail.ticketId);
      if (Array.isArray(res.auditLogs)) {
        setTicketHistory(res.auditLogs);
        showToast('success', `Synced ${res.auditLogs.length} audit log entries from server.`);
      }
    } catch (err) {
      showToast('error', 'Failed to refresh server audit log.');
    }
  };

  const filteredAuditHistory = useMemo(() => {
    const list = ticketHistory.filter((ev) => {
      if (auditTypeFilter === 'ALL') return true;
      return (ev.eventType || 'STATUS_TRANSITION') === auditTypeFilter;
    });
    return [...list].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime() || 0;
      const timeB = new Date(b.timestamp).getTime() || 0;
      if (timeA !== timeB) {
        return auditSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      }
      return auditSortOrder === 'desc' ? (b.id || 0) - (a.id || 0) : (a.id || 0) - (b.id || 0);
    });
  }, [ticketHistory, auditTypeFilter, auditSortOrder]);

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
        showToast('success', `Created ticket ${res.ticket.ticketId} in Smart Tracker.`);
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
          `Updated ${res.ticket.ticketId} status to "${res.ticket.status}" and logged audit event.`
        );
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Status update failed.');
    }
  };

  const handleSaveTicketEdits = async (e) => {
    e.preventDefault();
    if (!ticketDetail) return;
    setEditSaving(true);
    try {
      const res = await api.updateTicket(ticketDetail.ticketId, {
        ...editForm,
      });
      if (res.ticket) {
        await syncTicketToFirestore(res.ticket).catch(() => {});
        setTicketDetail(res.ticket);
        setTicketHistory(res.history || []);
        await onRefreshTickets();
        setInspectorTab('audit');
        showToast(
          'success',
          `Saved edits for ${res.ticket.ticketId} and recorded field diff in Audit Log.`
        );
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update ticket details.');
    } finally {
      setEditSaving(false);
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
        actorName: editForm.actorName || 'Authorized DEPW Inspector',
      });
      setTicketDetail(res.ticket);
      setTicketHistory(res.history || []);
      await onRefreshTickets();
      showToast('success', `Checklist updated & recorded in server audit log.`);
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
      showToast('success', `Deleted ticket ${confirmDeleteTicketId}.`);
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
    link.setAttribute('download', `depw-smart-tracker-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', `Exported ${filteredTickets.length} records to CSV.`);
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
      showToast('success', 'Added coordination schedule entry.');
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
              SMART TRACKER • PERSISTENT SQLITE + FIRESTORE REGISTER • SERVER-SIDE AUDIT TRAIL
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

        {/* 5 Top Metric Cards */}
        <div className={styles.metricGrid}>
          <div className={styles.metricTile}>
            <div className="text-xs font-mono text-slate-300">TOTAL REQUESTS</div>
            <div className={styles.metricValue}>{metrics.totalRequests}</div>
            <div className="text-xs text-slate-400 mt-1">Active Register Records</div>
          </div>
          <div className={styles.metricTile}>
            <div className="text-xs font-mono text-amber-300">PENDING VERIFICATION</div>
            <div className={styles.metricValue}>{metrics.pendingVerification}</div>
            <div className="text-xs text-slate-400 mt-1">Intake & Clarification</div>
          </div>
          <div className={styles.metricTile}>
            <div className="text-xs font-mono text-sky-300">PENDING EVALUATION</div>
            <div className={styles.metricValue}>{metrics.pendingEvaluation}</div>
            <div className="text-xs text-slate-400 mt-1">Endorsed to DEPW Team</div>
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
            <label htmlFor="sla-days-input">SLA Aging Threshold (Days):</label>
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

      {/* VIEW 1: REGISTER TABLE & DETAILED INSPECTOR WITH DEDICATED AUDIT LOG TAB */}
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
                  No tickets match your current search or filter criteria.
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
                      const age = calculateTicketAge(
                        t.createdAt,
                        new Date('2026-10-23T00:00:00Z'),
                        slaThresholdDays
                      );
                      return (
                        <tr
                          key={t.ticketId}
                          onClick={() => setSelectedTicketId(t.ticketId)}
                          className={`cursor-pointer ${isSelected ? 'bg-sky-500/20' : ''}`}
                        >
                          <td className="tabular-nums whitespace-nowrap text-sm text-slate-200">{t.dateReceived}</td>
                          <td className="tabular-nums font-bold text-cyan-300 whitespace-nowrap text-sm">
                            {t.ticketId}
                          </td>
                          <td>
                            <div className="font-bold text-white text-sm">{t.barangay}</div>
                            <div className="text-xs text-slate-300 font-medium">
                              {t.district} · {t.legislativeDistrict}
                            </div>
                          </td>
                          <td className="text-sm font-medium text-slate-200">{t.requestType}</td>
                          <td>
                            <div className="font-bold text-sky-200 text-sm">{t.status}</div>
                            <div className="text-xs text-slate-300 tabular-nums font-medium">
                              {age.label} {age.isAging && t.status !== 'Closed' ? '· Follow-up' : ''}
                            </div>
                          </td>
                          <td className="max-w-[180px] text-sm text-slate-200 truncate" title={t.actionTaken}>
                            {t.actionTaken}
                          </td>
                          <td className="max-w-[180px] text-sm text-slate-200 truncate" title={t.nextStep}>
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

          {/* Right 5 Cols: Detailed Ticket Inspector with 3 Dedicated Tabs */}
          <div className={`${styles.glassPanel} lg:col-span-5 space-y-4`}>
            {detailLoading && !ticketDetail ? (
              <div className="text-sm text-slate-300 py-8 text-center">
                Loading ticket details...
              </div>
            ) : ticketDetail ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-sky-400/20 pb-3">
                  <div>
                    <div className="text-xs font-mono text-cyan-400">
                      TICKET DETAILS INSPECTOR • {ticketDetail.ticketId}
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
                      onClick={() => onOpenJourneyReplay && onOpenJourneyReplay(ticketDetail.ticketId)}
                      className={styles.secondaryBtn}
                      style={{ padding: '6px 10px', fontSize: '11px' }}
                      title="Replay Request Journey (Timeline Replay)"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="hidden sm:inline">Replay</span>
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

                {/* Dedicated Ticket Details Inspector Tabs */}
                <div
                  role="tablist"
                  aria-label="Ticket Details Tabs"
                  className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-slate-950/70 border border-sky-400/20"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inspectorTab === 'overview'}
                    onClick={() => setInspectorTab('overview')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      inspectorTab === 'overview'
                        ? 'bg-sky-500 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Overview & Status</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inspectorTab === 'audit'}
                    onClick={() => setInspectorTab('audit')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      inspectorTab === 'audit'
                        ? 'bg-cyan-400 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Audit Log ({ticketHistory.length})</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inspectorTab === 'edit'}
                    onClick={() => setInspectorTab('edit')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      inspectorTab === 'edit'
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit & Checklist</span>
                  </button>
                </div>

                {/* TAB 1: OVERVIEW & WORKFLOW STATUS TRANSITION */}
                {inspectorTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Metadata Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/70 p-3.5 rounded-xl border border-sky-400/15">
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
                        <span className="text-slate-400">GPS Coordinates:</span>
                        <div className="font-mono text-sky-200 mt-0.5 tabular-nums">
                          {ticketDetail.latitude && ticketDetail.longitude
                            ? `${Number(ticketDetail.latitude).toFixed(4)}, ${Number(
                                ticketDetail.longitude
                              ).toFixed(4)} (${ticketDetail.coordVerified ? 'Verified Pin' : 'Unverified Pin'})`
                            : 'Location not pinned'}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400">Request Description:</span>
                        <p className="text-slate-200 mt-0.5 leading-relaxed">
                          {ticketDetail.description}
                        </p>
                      </div>
                    </div>

                    {/* Friendly Bilingual "What Should I Do Next?" Guidance Helper */}
                    {ticketDetail && (() => {
                      const filAdvice = getWhatShouldIDoNext(ticketDetail, 'fil');
                      const enAdvice = getWhatShouldIDoNext(ticketDetail, 'en');
                      return (
                        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-400/35 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              💡 Gabay sa Aksyon • What Should I Do Next?
                            </span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                              {filAdvice.role}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-white flex items-baseline gap-1.5">
                              <span className="text-emerald-400 font-bold">🇵🇭 Tagalog:</span> {filAdvice.action}
                            </div>
                            <p className="text-[11px] text-emerald-100/80 leading-relaxed pl-3 border-l-2 border-emerald-400/40">
                              {filAdvice.detail}
                            </p>
                          </div>
                          <div className="space-y-1 pt-1.5 border-t border-emerald-500/20">
                            <div className="text-xs font-bold text-slate-200 flex items-baseline gap-1.5">
                              <span className="text-sky-400 font-bold">🇺🇸 English:</span> {enAdvice.action}
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed pl-3 border-l-2 border-sky-400/40">
                              {enAdvice.detail}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

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
                            Recorded By (Officer Name)
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
                        Record Status Update in Server Audit Trail
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 2: DEDICATED SERVER-SIDE AUDIT LOG & HISTORY TAB */}
                {inspectorTab === 'audit' && (
                  <div className="space-y-3" data-testid="ticket-audit-tab-panel">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 p-3 rounded-xl border border-sky-400/20">
                      <div>
                        <div className="text-xs font-mono text-cyan-300 font-bold">
                          SERVER-SIDE AUDIT TRAIL • {ticketDetail.ticketId}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Records all status transitions, field edits, coordinate updates & checklist changes
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenJourneyReplay && onOpenJourneyReplay(ticketDetail.ticketId)}
                          className={styles.primaryActionBtn}
                          style={{ padding: '6px 12px', fontSize: '11px' }}
                          title="Launch Animated Journey Replay for this ticket"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Replay Journey
                        </button>
                        <button
                          type="button"
                          onClick={handleRefreshAuditLog}
                          className={styles.secondaryBtn}
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Sync Server Log
                        </button>
                      </div>
                    </div>

                    {/* Audit Event Filter & Sort Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <select
                        aria-label="Filter Audit Events by Type"
                        value={auditTypeFilter}
                        onChange={(e) => setAuditTypeFilter(e.target.value)}
                        className="bg-slate-900 border border-sky-400/30 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="ALL">All Event Types ({ticketHistory.length})</option>
                        <option value="STATUS_TRANSITION">Status Transitions</option>
                        <option value="FIELD_EDIT">Field Edits</option>
                        <option value="CHECKLIST_UPDATE">Checklist Updates</option>
                        <option value="COORD_UPDATE">Coordinate Updates</option>
                        <option value="TICKET_CREATED">Ticket Creation</option>
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          setAuditSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                        }
                        className={styles.secondaryBtn}
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        {auditSortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                      </button>
                    </div>

                    {/* Detailed Audit Timeline Entries */}
                    <div className="space-y-2.5 max-h-[430px] overflow-y-auto pr-1">
                      {filteredAuditHistory.length === 0 ? (
                        <div className="p-6 text-center rounded-xl bg-slate-950/60 border border-sky-400/15 text-xs text-slate-400">
                          No audit log events match the selected event filter.
                        </div>
                      ) : (
                        filteredAuditHistory.map((ev) => {
                          const evType = ev.eventType || 'STATUS_TRANSITION';
                          const diffs = Array.isArray(ev.changedFields) ? ev.changedFields : [];
                          const badgeColors = {
                            STATUS_TRANSITION: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
                            FIELD_EDIT: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
                            CHECKLIST_UPDATE: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
                            COORD_UPDATE: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
                            TICKET_CREATED: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
                          };
                          return (
                            <div
                              key={ev.id}
                              className="p-3.5 rounded-xl bg-slate-950/85 border border-sky-400/20 text-xs space-y-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded border font-mono text-[10px] font-bold ${
                                    badgeColors[evType] || badgeColors.STATUS_TRANSITION
                                  }`}
                                >
                                  {evType}
                                </span>
                                <span className="tabular-nums font-mono text-slate-400">
                                  {new Date(ev.timestamp).toLocaleString()}
                                </span>
                              </div>

                              <div className="font-mono text-cyan-300 font-semibold">
                                {ev.previousStatus
                                  ? `${ev.previousStatus} → ${ev.newStatus}`
                                  : `Initial Status: ${ev.newStatus}`}
                              </div>

                              <div className="text-white font-medium leading-relaxed">
                                {ev.actionTaken}
                              </div>

                              {diffs.length > 0 && (
                                <div className="space-y-1.5 pt-1 border-t border-slate-800">
                                  <div className="text-[10px] font-mono uppercase text-slate-400">
                                    Recorded Field-Level Changes ({diffs.length}):
                                  </div>
                                  {diffs.map((d, index) => (
                                    <div
                                      key={index}
                                      className="p-2 rounded bg-slate-900/90 border border-slate-800 font-mono text-[11px] flex flex-wrap items-center gap-1.5"
                                    >
                                      <span className="text-sky-300 font-bold">{d.label || d.field}:</span>
                                      <span className="text-rose-300 line-through">
                                        {String(d.before || 'None')}
                                      </span>
                                      <span className="text-slate-400">→</span>
                                      <span className="text-emerald-300 font-semibold">
                                        {String(d.after || 'None')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                                <span>
                                  Actor: <strong className="text-slate-200">{ev.actorName}</strong> ({ev.actorRole})
                                </span>
                                <span className="font-mono">Audit ID #{ev.id}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: INLINE TICKET FIELD EDITOR & INSPECTION CHECKLIST */}
                {inspectorTab === 'edit' && (
                  <div className="space-y-4">
                    {/* Field Inspection Checklist */}
                    <div className="space-y-2 bg-slate-900/70 p-3.5 rounded-xl border border-sky-400/20">
                      <div className="text-xs font-mono text-sky-300 font-semibold">
                        FIELD INSPECTION & COMPLETENESS CHECKLIST
                      </div>
                      <div className="space-y-1.5">
                        {(ticketDetail.inspectionChecklist || []).map((item, idx) => (
                          <label
                            key={idx}
                            className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/70 border border-sky-400/15 text-xs cursor-pointer"
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

                    {/* Edit Ticket Details Form (triggers FIELD_EDIT in server-side audit log) */}
                    <form
                      onSubmit={handleSaveTicketEdits}
                      className="p-4 rounded-xl bg-slate-900/80 border border-amber-400/30 space-y-3"
                    >
                      <div className="text-xs font-mono text-amber-300 font-bold">
                        EDIT TICKET DETAILS (AUTOMATICALLY LOGS FIELD DIFF IN AUDIT TRAIL)
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="edit-barangay" className="block text-xs text-slate-300 mb-1">
                            Barangay
                          </label>
                          <input
                            id="edit-barangay"
                            type="text"
                            value={editForm.barangay}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, barangay: e.target.value }))
                            }
                            className={styles.inputControl}
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-priority" className="block text-xs text-slate-300 mb-1">
                            Priority Level
                          </label>
                          <select
                            id="edit-priority"
                            value={editForm.priority}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, priority: e.target.value }))
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
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="edit-street" className="block text-xs text-slate-300 mb-1">
                            Street / Drainage Segment
                          </label>
                          <input
                            id="edit-street"
                            type="text"
                            value={editForm.streetAddress}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, streetAddress: e.target.value }))
                            }
                            className={styles.inputControl}
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-req-type" className="block text-xs text-slate-300 mb-1">
                            Request Type
                          </label>
                          <select
                            id="edit-req-type"
                            value={editForm.requestType}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, requestType: e.target.value }))
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="edit-requester" className="block text-xs text-slate-300 mb-1">
                            Coordinating Official
                          </label>
                          <input
                            id="edit-requester"
                            type="text"
                            value={editForm.requesterName}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, requesterName: e.target.value }))
                            }
                            className={styles.inputControl}
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-actor" className="block text-xs text-slate-300 mb-1">
                            Edited By (Auditor / Engineer)
                          </label>
                          <input
                            id="edit-actor"
                            type="text"
                            value={editForm.actorName}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, actorName: e.target.value }))
                            }
                            className={styles.inputControl}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="edit-description" className="block text-xs text-slate-300 mb-1">
                          Engineering Description & Field Notes
                        </label>
                        <textarea
                          id="edit-description"
                          rows={2}
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, description: e.target.value }))
                          }
                          className={styles.inputControl}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={editSaving}
                        className={styles.orangeActionBtn}
                      >
                        {editSaving ? 'Recording Edits...' : 'Save Changes & Log Field Edit'}
                      </button>
                    </form>
                  </div>
                )}
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
                COORDINATION SCHEDULE • PROPOSED VS CONFIRMED OPERATIONS
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
                + PROPOSE COORDINATION SCHEDULE
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
                  <option value="Confirmed Field Schedule">Confirmed Field Schedule</option>
                </select>
              </div>
              <input
                type="text"
                value={newScheduleForm.title}
                onChange={(e) =>
                  setNewScheduleForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Schedule activity title (e.g., Joint Ocular Inspection at España Blvd)"
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
                VERIFIED DRAINAGE ASSET REGISTRY
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
              DATA-QUALITY & COMPLETENESS AUDIT
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
                        {t.coordVerified ? 'Verified Street Coordinates' : 'Unverified Pin / Review Needed'} ·{' '}
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
                  SMART TRACKER INTAKE • BARANGAY DECLOGGING REGISTRATION
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
                    Barangay Name *
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
                    Street / Drainage Segment *
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
                    Coordinating Official *
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
                    GPS Coordinates (Lat, Lng)
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
              This will permanently remove ticket{' '}
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
