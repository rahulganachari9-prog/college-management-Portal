import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { Notice, CampusEvent, Workshop } from '../../types.ts';
import { Megaphone, Calendar, Sparkles, Plus, MapPin, Users, Paperclip, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/common/Modal.tsx';
import { Badge } from '../../components/common/Badge.tsx';

export const NoticeEventManagement: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [activeTab, setActiveTab] = useState<'notices' | 'events' | 'workshops'>('notices');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isWorkshopModalOpen, setIsWorkshopModalOpen] = useState(false);

  // Forms
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    targetRole: 'all',
    priority: 'normal',
    attachmentUrl: '',
    attachmentName: '',
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    eventType: 'hackathon',
    venue: 'Main Auditorium',
    startDate: '2025-11-10T09:00:00Z',
    endDate: '2025-11-12T18:00:00Z',
    maxCapacity: '200',
    bannerUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600',
  });

  const [workshopForm, setWorkshopForm] = useState({
    title: '',
    description: '',
    instructor: 'Dr. Expert Guest Speaker',
    venue: 'Computer Center Lab 2',
    startDate: '2025-10-28T10:00:00Z',
    endDate: '2025-10-28T16:00:00Z',
    maxCapacity: '50',
    fee: '0.00',
    prerequisite: 'Basics of Python and Linux',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [nRes, eRes, wRes] = await Promise.all([
        api.get('/notices'),
        api.get('/events'),
        api.get('/workshops'),
      ]);
      if (nRes.success) setNotices(nRes.data || []);
      if (eRes.success) setEvents(eRes.data || []);
      if (wRes.success) setWorkshops(wRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/notices', noticeForm);
      setIsNoticeModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/events', eventForm);
      setIsEventModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateWorkshop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/workshops', workshopForm);
      setIsWorkshopModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Campus Circulars, Events & Workshops</h2>
          <p className="text-xs text-slate-500 mt-0.5">Broadcast institutional announcements and coordinate student tech summits</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'notices' && (
            <button
              onClick={() => setIsNoticeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              <Plus className="w-4 h-4" /> Publish Notice
            </button>
          )}
          {activeTab === 'events' && (
            <button
              onClick={() => setIsEventModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              <Plus className="w-4 h-4" /> Create Event
            </button>
          )}
          {activeTab === 'workshops' && (
            <button
              onClick={() => setIsWorkshopModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Workshop
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('notices')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'notices' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Official Notices ({notices.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'events' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Campus Events & Hackathons ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('workshops')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'workshops' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Technical Workshops ({workshops.length})
        </button>
      </div>

      {/* TAB 1: NOTICES */}
      {activeTab === 'notices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map((n) => (
            <div key={n.id} className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant={n.priority === 'urgent' ? 'danger' : n.priority === 'important' ? 'warning' : 'neutral'}>
                    {(n.priority || 'normal').toUpperCase()} PRIORITY
                  </Badge>
                  <span className="text-[11px] font-semibold text-slate-400">Target: {(n.targetRole || 'all').toUpperCase()}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-2.5">{n.title}</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{n.content}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>By {n.authorName || 'Registrar Office'}</span>
                <span>{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: EVENTS */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
              {ev.bannerUrl && (
                <img src={ev.bannerUrl} alt={ev.title} className="w-full h-36 object-cover" />
              )}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="primary">{(ev.eventType || 'event').toUpperCase()}</Badge>
                    <span className="text-[11px] text-slate-500 font-medium capitalize">{ev.status || 'upcoming'}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-2">{ev.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{ev.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {ev.venue}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> Capacity: {ev.maxCapacity} Attendees
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: WORKSHOPS */}
      {activeTab === 'workshops' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workshops.map((w) => (
            <div key={w.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant="info">WORKSHOP</Badge>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {w.fee === '0.00' ? 'FREE' : `$${w.fee}`}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-2">{w.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{w.description}</p>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">Instructor: {w.instructor}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <p className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {w.venue}</p>
                {w.prerequisite && <p className="text-[11px] text-slate-400">Prereq: {w.prerequisite}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CREATE NOTICE */}
      <Modal isOpen={isNoticeModalOpen} onClose={() => setIsNoticeModalOpen(false)} title="Publish Campus Notice">
        <form onSubmit={handleCreateNotice} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Headline *</label>
            <input
              type="text"
              required
              value={noticeForm.title}
              onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
              placeholder="e.g. Schedule for Mid-Term Examination 2025"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Content *</label>
            <textarea
              rows={4}
              required
              value={noticeForm.content}
              onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
              placeholder="Provide official notification text and instructions..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            ></textarea>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
              <select
                value={noticeForm.targetRole}
                onChange={(e) => setNoticeForm({ ...noticeForm, targetRole: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="all">All Campus (Students & Staff)</option>
                <option value="student">Students Only</option>
                <option value="faculty">Faculty & Staff Only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
              <select
                value={noticeForm.priority}
                onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent Alert</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsNoticeModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs">Publish Circular</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE EVENT */}
      <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title="Create Campus Event">
        <form onSubmit={handleCreateEvent} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title *</label>
            <input
              type="text"
              required
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              placeholder="e.g. Apex Annual Tech Hackathon 2025"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              placeholder="Event description..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            ></textarea>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Venue Location</label>
              <input
                type="text"
                value={eventForm.venue}
                onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity</label>
              <input
                type="number"
                value={eventForm.maxCapacity}
                onChange={(e) => setEventForm({ ...eventForm, maxCapacity: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs">Publish Event</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE WORKSHOP */}
      <Modal isOpen={isWorkshopModalOpen} onClose={() => setIsWorkshopModalOpen(false)} title="Register Technical Workshop">
        <form onSubmit={handleCreateWorkshop} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Workshop Title *</label>
            <input
              type="text"
              required
              value={workshopForm.title}
              onChange={(e) => setWorkshopForm({ ...workshopForm, title: e.target.value })}
              placeholder="e.g. Masterclass on Kubernetes & Cloud Architecture"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Instructor / Speaker</label>
            <input
              type="text"
              value={workshopForm.instructor}
              onChange={(e) => setWorkshopForm({ ...workshopForm, instructor: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Venue</label>
              <input
                type="text"
                value={workshopForm.venue}
                onChange={(e) => setWorkshopForm({ ...workshopForm, venue: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Fee ($)</label>
              <input
                type="text"
                value={workshopForm.fee}
                onChange={(e) => setWorkshopForm({ ...workshopForm, fee: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsWorkshopModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs">Publish Workshop</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
