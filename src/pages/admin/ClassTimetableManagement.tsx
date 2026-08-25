import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { TimetableSlot, ClassSection, Subject, FacultyMember } from '../../types.ts';
import { Clock, Plus, Calendar, MapPin, User, BookOpen } from 'lucide-react';
import { Modal } from '../../components/common/Modal.tsx';
import { Badge } from '../../components/common/Badge.tsx';

export const ClassTimetableManagement: React.FC = () => {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('1');
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    classId: '1',
    subjectId: '',
    facultyId: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    roomNumber: 'LH-101',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, cRes, sRes, fRes] = await Promise.all([
        api.get('/timetables'),
        api.get('/classes'),
        api.get('/subjects'),
        api.get('/faculty'),
      ]);
      if (tRes.success) setSlots(tRes.data || []);
      if (cRes.success) {
        setClasses(cRes.data || []);
        if (cRes.data?.length > 0) setSelectedClassId(String(cRes.data[0].id));
      }
      if (sRes.success) setSubjects(sRes.data || []);
      if (fRes.success) setFaculty(fRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/timetables', form);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add timetable slot');
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const filteredSlots = slots.filter(
    (s) => !selectedClassId || String(s.classId) === String(selectedClassId)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Academic Schedule & Timetables</h2>
          <p className="text-xs text-slate-500 mt-0.5">Weekly master timetable, classroom allocations, and faculty periods</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-800"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Class: {c.name} (Sec {c.section})
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setForm({
                classId: selectedClassId || '1',
                subjectId: String(subjects[0]?.id || '1'),
                facultyId: String(faculty[0]?.userId || '1'),
                dayOfWeek: 'Monday',
                startTime: '09:00',
                endTime: '10:00',
                roomNumber: 'LH-101',
              });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Period Slot
          </button>
        </div>
      </div>

      {/* Timetable Weekly Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map((day) => {
          const daySlots = filteredSlots
            .filter((s) => s.dayOfWeek === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div key={day} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-800">{day}</span>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                  {daySlots.length} Periods
                </span>
              </div>
              <div className="p-3 space-y-2 flex-1 divide-y divide-slate-100">
                {daySlots.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center italic">No scheduled lectures</p>
                ) : (
                  daySlots.map((s) => (
                    <div key={s.id} className="pt-2 first:pt-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-indigo-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {s.startTime} - {s.endTime}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-slate-400" /> {s.roomNumber || 'LH-101'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">{s.subjectName}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" /> Prof. {s.facultyName}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE SLOT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Timetable Slot">
        <form onSubmit={handleCreateSlot} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Day of Week</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              >
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room / Hall Number</label>
              <input
                type="text"
                value={form.roomNumber}
                onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                placeholder="e.g. Lab 3 / Hall 102"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
            <select
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Faculty Professor</label>
            <select
              value={form.facultyId}
              onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            >
              {faculty.map((f) => (
                <option key={f.userId} value={f.userId}>{f.name} ({f.designation})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs">Allocate Slot</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
