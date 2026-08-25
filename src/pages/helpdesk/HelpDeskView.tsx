import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/apiClient.ts';
import { HelpDeskTicket, HelpDeskStats, TicketCategory, TicketPriority, TicketStatus } from '../../types.ts';
import { Badge } from '../../components/common/Badge.tsx';
import {
  LifeBuoy,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Send,
  User,
  Building2,
  Phone,
  RefreshCw,
  X,
  MessageSquare,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Check,
  Mail,
  HelpCircle,
  Laptop,
  GraduationCap,
  DollarSign,
  Home,
  FileSpreadsheet,
  Briefcase,
  BookOpen,
} from 'lucide-react';

const CATEGORIES: { id: TicketCategory; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'academic', label: 'Academic & Curriculum', icon: GraduationCap, description: 'Coursework, syllabus, credits, faculty interaction' },
  { id: 'it_support', label: 'IT & Campus Network', icon: Laptop, description: 'WiFi, portal access, LMS credentials, lab systems' },
  { id: 'examination', label: 'Examinations & Grades', icon: FileSpreadsheet, description: 'Grade transcripts, hall tickets, re-evaluation' },
  { id: 'fee_finance', label: 'Fees & Scholarships', icon: DollarSign, description: 'Tuition receipts, scholarship grants, refunds' },
  { id: 'hostel_facility', label: 'Campus & Facilities', icon: Home, description: 'Hostel, classroom AV, lab equipment, maintenance' },
  { id: 'placement', label: 'Career & Placements', icon: Briefcase, description: 'Drives, resume approval, internship inquiries' },
  { id: 'library', label: 'Library & Resources', icon: BookOpen, description: 'Digital journals, book returns, borrowing cards' },
  { id: 'other', label: 'General / Administrative', icon: HelpCircle, description: 'Certificates, ID cards, general student queries' },
];

export const HelpDeskView: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  const [tickets, setTickets] = useState<HelpDeskTicket[]>([]);
  const [stats, setStats] = useState<HelpDeskStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    urgent: 0,
    avgResolutionHours: 12,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [adminScope, setAdminScope] = useState<'all' | 'my'>('all');

  // Modals & Active Drawer
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<HelpDeskTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [adminResolutionNote, setAdminResolutionNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // New Ticket Form State
  const [formSubject, setFormSubject] = useState('');
  const [formCategory, setFormCategory] = useState<TicketCategory>('academic');
  const [formPriority, setFormPriority] = useState<TicketPriority>('medium');
  const [formDescription, setFormDescription] = useState('');
  const [formPhone, setFormPhone] = useState(currentUser?.phone || '');
  const [formError, setFormError] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchTickets = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const queryParams = new URLSearchParams();
      if (selectedStatus !== 'all') queryParams.append('status', selectedStatus);
      if (selectedCategory !== 'all') queryParams.append('category', selectedCategory);
      if (selectedPriority !== 'all') queryParams.append('priority', selectedPriority);
      if (isAdmin && adminScope === 'my') queryParams.append('scope', 'my');

      const [ticketsRes, statsRes] = await Promise.all([
        api.get(`/helpdesk/tickets?${queryParams.toString()}`),
        api.get('/helpdesk/stats'),
      ]);

      if (ticketsRes?.success && Array.isArray(ticketsRes.data)) {
        setTickets(ticketsRes.data);
        if (selectedTicket) {
          const updated = ticketsRes.data.find((t: HelpDeskTicket) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
      if (statsRes?.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to load helpdesk tickets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [selectedStatus, selectedCategory, selectedPriority, adminScope]);

  const filteredTickets = useMemo(() => {
    if (!searchTerm.trim()) return tickets;
    const q = searchTerm.toLowerCase();
    return tickets.filter((t) =>
      t.ticketNumber.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.submitterName.toLowerCase().includes(q) ||
      t.submitterEmail.toLowerCase().includes(q)
    );
  }, [tickets, searchTerm]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formDescription.trim()) {
      setFormError('Please fill out both the subject and a detailed description.');
      return;
    }

    setSubmittingTicket(true);
    setFormError('');

    try {
      const res = await api.post('/helpdesk/tickets', {
        subject: formSubject.trim(),
        description: formDescription.trim(),
        category: formCategory,
        priority: formPriority,
        contactPhone: formPhone.trim() || undefined,
      });

      if (res?.success) {
        setShowCreateModal(false);
        setFormSubject('');
        setFormDescription('');
        setFormCategory('academic');
        setFormPriority('medium');
        setSuccessMessage(`Ticket #${res.data?.ticketNumber || 'created'} submitted successfully!`);
        setTimeout(() => setSuccessMessage(''), 5000);
        await fetchTickets(true);
      } else {
        setFormError(res?.message || 'Failed to submit ticket. Please try again.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error communicating with helpdesk server');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await api.post(`/helpdesk/tickets/${selectedTicket.id}/messages`, {
        message: replyText.trim(),
      });

      if (res?.success) {
        setReplyText('');
        setSelectedTicket(res.data);
        fetchTickets(true);
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleUpdateStatus = async (status: TicketStatus, resolutionNote?: string) => {
    if (!selectedTicket) return;
    setIsUpdatingStatus(true);
    try {
      const payload: any = { status };
      if (resolutionNote !== undefined) {
        payload.adminResponse = resolutionNote;
      }
      const res = await api.patch(`/helpdesk/tickets/${selectedTicket.id}`, payload);
      if (res?.success) {
        setSelectedTicket(res.data);
        setAdminResolutionNote('');
        fetchTickets(true);
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getCategoryMeta = (cat: TicketCategory) => {
    return CATEGORIES.find((c) => c.id === cat) || CATEGORIES[7];
  };

  const getPriorityBadgeVariant = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      default: return 'neutral';
    }
  };

  const getStatusBadgeVariant = (status: TicketStatus) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'in_progress': return 'warning';
      case 'open': return 'primary';
      case 'closed': return 'neutral';
      default: return 'neutral';
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Banner / Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <LifeBuoy className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isAdmin ? 'Campus Help Desk & Service Operations' : 'Student & Faculty Support Help Desk'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {isAdmin
              ? 'Triage, assign, and resolve campus service inquiries, academic grievances, and infrastructure tickets.'
              : 'Submit support requests, report technical or academic issues, and track live administrator responses.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchTickets(true)}
            disabled={refreshing}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-lg transition-colors"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Support Request</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div
          onClick={() => setSelectedStatus('all')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === 'all'
              ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Inquiries</span>
            <LifeBuoy className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">All logged requests</p>
        </div>

        <div
          onClick={() => setSelectedStatus('open')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === 'open'
              ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-blue-600">
            <span>Open & Pending</span>
            <AlertCircle className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.open}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting initial triage</p>
        </div>

        <div
          onClick={() => setSelectedStatus('in_progress')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === 'in_progress'
              ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-amber-600">
            <span>Under Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.inProgress}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Assigned to team</p>
        </div>

        <div
          onClick={() => setSelectedStatus('resolved')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === 'resolved'
              ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.resolved}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Completed solutions</p>
        </div>

        <div
          onClick={() => setSelectedPriority('urgent')}
          className={`p-4 rounded-xl border transition-all cursor-pointer col-span-2 md:col-span-1 ${
            selectedPriority === 'urgent'
              ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-rose-600">
            <span>Urgent Escalations</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">{stats.urgent}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">High SLA priority</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket #, subject, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {isAdmin && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setAdminScope('all')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  adminScope === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Campus
              </button>
              <button
                onClick={() => setAdminScope('my')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  adminScope === 'my' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Submissions
              </button>
            </div>
          )}

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          {/* Priority Dropdown */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Main Tickets List Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Support Requests</span>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-200 text-slate-700 rounded-full">
              {filteredTickets.length}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">Click any ticket to view response & timeline</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            <p className="text-xs font-medium">Fetching support tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No support tickets found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchTerm || selectedStatus !== 'all' || selectedCategory !== 'all' || selectedPriority !== 'all'
                ? 'Try adjusting your search criteria or resetting the filters.'
                : 'Need assistance with coursework, IT, fees, or campus facilities? Click "New Support Request" above.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Submit Request
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((ticket) => {
              const catMeta = getCategoryMeta(ticket.category);
              const CatIcon = catMeta.icon;
              const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    selectedTicket?.id === ticket.id ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                      <CatIcon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {ticket.ticketNumber}
                        </span>

                        <Badge variant={getStatusBadgeVariant(ticket.status)}>
                          {(ticket.status || 'open').replace('_', ' ').toUpperCase()}
                        </Badge>

                        <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                          {(ticket.priority || 'medium').toUpperCase()} PRIORITY
                        </Badge>

                        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                          <span>•</span> {catMeta.label}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 truncate">{ticket.subject}</h3>
                      <p className="text-xs text-slate-600 line-clamp-1 leading-relaxed">{ticket.description}</p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <User className="w-3 h-3 text-slate-400" />
                          {ticket.submitterName}
                          {ticket.submitterIdentifier && ` (${ticket.submitterIdentifier})`}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Submitted {new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {ticket.adminResponse && (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Admin Responded
                          </span>
                        )}

                        {ticket.messages && ticket.messages.length > 0 && (
                          <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                            <MessageSquare className="w-3 h-3" /> {ticket.messages.length} message{ticket.messages.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 group-hover:text-indigo-600">
                      View Thread <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Detail & Conversation Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Drawer Header */}
            <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">{selectedTicket.ticketNumber}</span>
                    <Badge variant={getStatusBadgeVariant(selectedTicket.status)}>
                      {(selectedTicket.status || 'open').replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant={getPriorityBadgeVariant(selectedTicket.priority)}>
                      {(selectedTicket.priority || 'medium').toUpperCase()}
                    </Badge>
                  </div>
                  <h2 className="text-sm font-bold text-white mt-1 leading-snug">{selectedTicket.subject}</h2>
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {/* Submitter Info Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Submitter</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedTicket.submitterName}</p>
                  <p className="text-slate-500 font-mono text-[11px]">{selectedTicket.submitterIdentifier || selectedTicket.submitterRole}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Contact & Email</span>
                  <p className="font-medium text-slate-800 mt-0.5 truncate">{selectedTicket.submitterEmail}</p>
                  {selectedTicket.contactPhone && (
                    <p className="text-slate-500 text-[11px]">{selectedTicket.contactPhone}</p>
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Category & Assigned</span>
                  <p className="font-bold text-slate-900 mt-0.5 capitalize">{selectedTicket.category.replace('_', ' ')}</p>
                  <p className="text-slate-500 text-[11px]">
                    Assigned: {selectedTicket.assignedToName || 'Admin Desk (Unassigned)'}
                  </p>
                </div>
              </div>

              {/* Initial Issue Statement */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Issue Description</span>
                <p className="text-xs text-slate-700 mt-2 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Official Admin Resolution Response */}
              {selectedTicket.adminResponse && (
                <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl shadow-2xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Official Administrator Resolution Note</span>
                  </div>
                  <p className="text-xs text-emerald-900 mt-2 leading-relaxed whitespace-pre-line font-medium bg-white/80 p-3 rounded-lg border border-emerald-100">
                    {selectedTicket.adminResponse}
                  </p>
                  {selectedTicket.resolvedAt && (
                    <p className="text-[10px] text-emerald-700 mt-2 font-medium">
                      Resolved on {new Date(selectedTicket.resolvedAt).toLocaleDateString()} at {new Date(selectedTicket.resolvedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              )}

              {/* Admin Actions Panel (Only visible to Admin) */}
              {isAdmin && (
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Administrative Triage & Status Control
                    </span>
                    <span className="text-[11px] text-slate-400">Quick updates notify submitter instantly</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus('in_progress')}
                      disabled={isUpdatingStatus || selectedTicket.status === 'in_progress'}
                      className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                    >
                      Set In Progress
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('resolved')}
                      disabled={isUpdatingStatus || selectedTicket.status === 'resolved'}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('closed')}
                      disabled={isUpdatingStatus || selectedTicket.status === 'closed'}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Close Ticket
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('open')}
                      disabled={isUpdatingStatus || selectedTicket.status === 'open'}
                      className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                    >
                      Reopen
                    </button>
                  </div>

                  {/* Edit/Add Resolution Note */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="text-[11px] font-semibold text-slate-600">
                      {selectedTicket.adminResponse ? 'Update Resolution Note' : 'Add Official Resolution Note'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g., Network credentials refreshed and verified with student..."
                        value={adminResolutionNote}
                        onChange={(e) => setAdminResolutionNote(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleUpdateStatus('resolved', adminResolutionNote)}
                        disabled={!adminResolutionNote.trim() || isUpdatingStatus}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors shrink-0"
                      >
                        Publish Resolution
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Conversation Messages Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Activity & Message History
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {selectedTicket.messages?.length || 0} comment{(selectedTicket.messages?.length || 0) === 1 ? '' : 's'}
                  </span>
                </div>

                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedTicket.messages.map((msg) => {
                      const isMe = msg.senderId === currentUser?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`p-3.5 rounded-xl border text-xs ${
                            isMe
                              ? 'bg-indigo-50/70 border-indigo-100 ml-6'
                              : 'bg-white border-slate-200/80 mr-6'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              {msg.senderName}
                              <span className="text-[10px] font-normal text-slate-400 capitalize">
                                ({msg.senderRole.replace('_', ' ')})
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed whitespace-pre-line">{msg.message}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
                    No follow-up messages on this ticket yet. Add a message below to coordinate.
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer / Reply Box */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your response or update on this inquiry..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || submittingReply}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* New Support Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Submit Support Request</h2>
                  <p className="text-xs text-slate-500">Directly alert the campus administration desk</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              {/* Category Select */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Category *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as TicketCategory)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label} ({cat.description})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Select */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Urgency / Priority *</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setFormPriority(p)}
                      className={`py-2 px-3 rounded-lg border font-bold capitalize transition-all ${
                        formPriority === p
                          ? p === 'urgent'
                            ? 'bg-rose-50 border-rose-400 text-rose-700 ring-2 ring-rose-500/20'
                            : 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject / Summary *</label>
                <input
                  type="text"
                  placeholder="e.g., Unable to submit assignment on LMS / Room 301 projector issue"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Callback Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+1 555-0199"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  rows={4}
                  placeholder="Please describe the issue in detail, including specific error codes, classroom/lab numbers, or course codes..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="inline-flex items-center gap-2 px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
                >
                  {submittingTicket ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
