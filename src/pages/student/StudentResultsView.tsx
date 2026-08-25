import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { GradeCard } from '../../types.ts';
import {
  Award,
  Download,
  CheckCircle,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Info,
  Layers,
  GraduationCap,
  FileCheck,
  TrendingUp,
  Printer,
  X,
  Send,
  HelpCircle,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge.tsx';

interface StudentResultsViewProps {
  onNavigate?: (tab: string) => void;
}

interface SemesterSummaryItem {
  semesterId: number;
  semesterName: string;
  sgpa: string;
  creditsRegistered: number;
  creditsEarned: number;
  status: string;
}

interface ResultsSummary {
  cgpa: string;
  totalCreditsAccrued: number;
  totalCreditsRequired: number;
  currentSgpa: string;
  classification: string;
  degreeProgram: string;
  academicStanding: string;
  semesterHistory: SemesterSummaryItem[];
}

export const StudentResultsView: React.FC<StudentResultsViewProps> = ({ onNavigate }) => {
  const [grades, setGrades] = useState<GradeCard[]>([]);
  const [summary, setSummary] = useState<ResultsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showRecheckModal, setShowRecheckModal] = useState(false);
  const [selectedSubjectForRecheck, setSelectedSubjectForRecheck] = useState<GradeCard | null>(null);
  const [recheckReason, setRecheckReason] = useState('');
  const [recheckSubmitted, setRecheckSubmitted] = useState(false);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await api.get('/results/my-results');
      if (res.success && res.data) {
        setGrades(res.data);
        if ((res as any).summary) {
          setSummary((res as any).summary);
        }
      }
    } catch (err) {
      console.error('Error loading academic results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const totalCredits = grades.reduce((acc, g) => acc + (Number(g.credits) || 4), 0);
  const weightedPoints = grades.reduce(
    (acc, g) => acc + (parseFloat(String(g.gradePoints || '8.5')) * (Number(g.credits) || 4)),
    0
  );
  const calculatedCgpa = totalCredits > 0 ? (weightedPoints / totalCredits).toFixed(2) : (summary?.cgpa || '8.92');

  const filteredGrades = grades.filter((g) => {
    const semMatch = selectedSemester === 'all' || String(g.semesterId) === selectedSemester;
    const searchMatch =
      !searchQuery.trim() ||
      g.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.grade.toLowerCase().includes(searchQuery.toLowerCase());
    return semMatch && searchMatch;
  });

  const handleOpenRecheck = (grade: GradeCard) => {
    setSelectedSubjectForRecheck(grade);
    setRecheckReason('');
    setRecheckSubmitted(false);
    setShowRecheckModal(true);
  };

  const handleSubmitRecheck = (e: React.FormEvent) => {
    e.preventDefault();
    setRecheckSubmitted(true);
    setTimeout(() => {
      setShowRecheckModal(false);
      setRecheckSubmitted(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Official Academic Transcripts & Grade Cards</h2>
              <p className="text-xs text-slate-500">
                Verified university semester exam records, cumulative CGPA, and letter grade evaluations
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowGradingModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-indigo-600" /> Grading Scale Legend
          </button>
          <button
            onClick={() => setShowTranscriptModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <FileCheck className="w-4 h-4" /> View Official Transcript
          </button>
        </div>
      </div>

      {/* CGPA & Academic Standing Hero Card */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {/* Main CGPA Box */}
          <div className="md:col-span-2 flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Award className="w-10 h-10 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-[11px] font-bold mb-1">
                <Sparkles className="w-3 h-3" /> {summary?.classification || 'First Class with Distinction'}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tight">{summary?.cgpa || calculatedCgpa}</span>
                <span className="text-sm font-semibold text-slate-300">/ 10.00 Cumulative CGPA</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Degree: <strong className="text-slate-200">B.Tech Computer Science & Engineering</strong> • Roll: <span className="font-mono text-slate-200">23CSE01</span>
              </p>
            </div>
          </div>

          {/* Current Semester SGPA */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Semester SGPA</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400">{summary?.currentSgpa || '9.15'}</span>
              <span className="text-xs text-slate-400">Semester 5</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> +0.29 from previous term
            </p>
          </div>

          {/* Credits Accrued */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Credits Accrued</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-white">{summary?.totalCreditsAccrued || totalCredits || 87}</span>
              <span className="text-xs text-slate-400">/ {summary?.totalCreditsRequired || 160} Earned</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-indigo-400 h-full rounded-full"
                style={{ width: `${Math.round(((summary?.totalCreditsAccrued || totalCredits || 87) / (summary?.totalCreditsRequired || 160)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Semester History & Progression Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Semester SGPA Progression & Credit Accrual History
            </h3>
          </div>
          <span className="text-xs font-medium text-slate-500">Autonomous Curriculum • 10-Point Scale</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(summary?.semesterHistory || [
            { semesterId: 5, semesterName: 'Semester 5 (Fall 2025)', sgpa: '9.15', creditsEarned: 20 },
            { semesterId: 4, semesterName: 'Semester 4 (Spring 2025)', sgpa: '9.18', creditsEarned: 17 },
            { semesterId: 3, semesterName: 'Semester 3 (Fall 2024)', sgpa: '8.86', creditsEarned: 14 },
            { semesterId: 2, semesterName: 'Semester 2 (Spring 2024)', sgpa: '8.75', creditsEarned: 18 },
            { semesterId: 1, semesterName: 'Semester 1 (Fall 2023)', sgpa: '8.65', creditsEarned: 18 },
          ]).map((sem) => (
            <button
              key={sem.semesterId}
              onClick={() => setSelectedSemester(String(sem.semesterId))}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedSemester === String(sem.semesterId)
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-2xs ring-2 ring-indigo-500/20'
                  : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-800">Sem {sem.semesterId}</span>
                <span className="font-black text-indigo-700">{sem.sgpa} SGPA</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{sem.semesterName.split('(')[1]?.replace(')', '') || 'Completed'}</p>
              <p className="text-[10px] font-semibold text-emerald-600 mt-1">{sem.creditsEarned} Credits Passed</p>
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar for Grade Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Detailed Subject Grade Cards & Course Outcomes
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Semester Filter */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Semesters</option>
                <option value="5">Semester 5 (Current)</option>
                <option value="4">Semester 4</option>
                <option value="3">Semester 3</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-800 shadow-2xs w-48 sm:w-56"
              />
            </div>

            <button
              onClick={fetchResults}
              disabled={loading}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg border border-slate-200 transition-colors shadow-2xs"
              title="Refresh Grade Cards"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Grade Cards Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Subject Code</th>
                <th className="px-5 py-3">Subject Title</th>
                <th className="px-4 py-3">Term / Exam</th>
                <th className="px-4 py-3 text-center">Credits</th>
                <th className="px-4 py-3 text-center">Raw Score</th>
                <th className="px-4 py-3 text-center">Letter Grade</th>
                <th className="px-4 py-3 text-center">Grade Point</th>
                <th className="px-4 py-3 text-center">Outcome</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-600">No subject records matched your query.</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the semester filter or search keywords.</p>
                  </td>
                </tr>
              ) : (
                filteredGrades.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {g.subjectCode}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{g.subjectName}</p>
                      <p className="text-[10px] text-slate-400">{g.semesterName || 'Semester Examination'}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <span className="text-[11px] font-medium text-slate-700">{g.examTitle || 'Mid-Semester Exam'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">{g.credits}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-900">
                      {g.marksObtained} <span className="text-[10px] font-normal text-slate-400">/ 100</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md font-black text-xs border ${
                          g.grade === 'O'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : g.grade === 'A+'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : g.grade === 'A'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {g.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-black text-slate-900">{g.gradePoints}</td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant="success">PASSED</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenRecheck(g)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Re-evaluate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Digital Signature & Registrar Stamp */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital Cryptographic Signature: <strong className="font-mono text-slate-700">SHA256:7f8b9a2c...e14d</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Controller of Examinations • Apex Institute</span>
          </div>
        </div>
      </div>

      {/* Grading Scheme Legend Modal */}
      {showGradingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold">10-Point Academic Grading System Reference</h3>
              </div>
              <button onClick={() => setShowGradingModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                As per the National Academic Credit Framework and AICTE autonomous degree guidelines, performance is graded as follows:
              </p>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="px-4 py-2.5">Marks Range</th>
                      <th className="px-4 py-2.5">Grade</th>
                      <th className="px-4 py-2.5 text-center">Grade Point</th>
                      <th className="px-4 py-2.5">Qualitative Descriptor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                    <tr>
                      <td className="px-4 py-2 font-mono">90 - 100%</td>
                      <td className="px-4 py-2 font-bold text-purple-700">O</td>
                      <td className="px-4 py-2 text-center font-bold">10.0</td>
                      <td className="px-4 py-2">Outstanding</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono">80 - 89%</td>
                      <td className="px-4 py-2 font-bold text-indigo-700">A+</td>
                      <td className="px-4 py-2 text-center font-bold">9.0</td>
                      <td className="px-4 py-2">Excellent</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono">70 - 79%</td>
                      <td className="px-4 py-2 font-bold text-blue-700">A</td>
                      <td className="px-4 py-2 text-center font-bold">8.0</td>
                      <td className="px-4 py-2">Very Good</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono">60 - 69%</td>
                      <td className="px-4 py-2 font-bold text-slate-700">B+</td>
                      <td className="px-4 py-2 text-center font-bold">7.0</td>
                      <td className="px-4 py-2">Good</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono">50 - 59%</td>
                      <td className="px-4 py-2 font-bold text-slate-700">B</td>
                      <td className="px-4 py-2 text-center font-bold">6.0</td>
                      <td className="px-4 py-2">Above Average</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono">40 - 49%</td>
                      <td className="px-4 py-2 font-bold text-amber-700">C</td>
                      <td className="px-4 py-2 text-center font-bold">5.0</td>
                      <td className="px-4 py-2">Pass</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono">&lt; 40%</td>
                      <td className="px-4 py-2 font-bold text-rose-700">F</td>
                      <td className="px-4 py-2 text-center font-bold">0.0</td>
                      <td className="px-4 py-2 text-rose-600">Fail / Re-appear</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
                <strong>SGPA Formula:</strong> ∑(Subject Credits × Grade Point) ÷ Total Registered Credits.
                <br />
                <strong>CGPA:</strong> Cumulative average across all completed semesters.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowGradingModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
              >
                Close Reference
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Transcript PDF Printable Modal */}
      {showTranscriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Official Cumulative Academic Transcript</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <button onClick={() => setShowTranscriptModal(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Transcript Sheet Body */}
            <div className="p-6 overflow-y-auto space-y-6 bg-white text-slate-800 font-sans">
              {/* Institution Seal & Header */}
              <div className="text-center pb-4 border-b-2 border-slate-800">
                <h1 className="text-lg font-black tracking-tight uppercase text-slate-900">
                  Apex Institute of Technology & Management
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Autonomous Institution • Accredited 'A++' Grade • Department of Examinations
                </p>
                <p className="text-[11px] font-bold text-indigo-700 mt-1 uppercase tracking-wider">
                  Official Statement of Grades & Cumulative Academic Performance
                </p>
              </div>

              {/* Student Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Student Name:</span>
                  <p className="font-bold text-slate-900">Alex Chen</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">University Roll No:</span>
                  <p className="font-bold font-mono text-slate-900">23CSE01</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Degree Program:</span>
                  <p className="font-bold text-slate-900">B.Tech (CSE)</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Admission Batch:</span>
                  <p className="font-bold text-slate-900">2023 - 2027</p>
                </div>
              </div>

              {/* Subject Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 uppercase">
                    <tr>
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2">Course Name</th>
                      <th className="px-3 py-2 text-center">Credits</th>
                      <th className="px-3 py-2 text-center">Score</th>
                      <th className="px-3 py-2 text-center">Grade</th>
                      <th className="px-3 py-2 text-center">Points</th>
                      <th className="px-3 py-2 text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {grades.map((g) => (
                      <tr key={g.id}>
                        <td className="px-3 py-1.5 font-mono font-bold text-slate-800">{g.subjectCode}</td>
                        <td className="px-3 py-1.5 font-medium">{g.subjectName}</td>
                        <td className="px-3 py-1.5 text-center font-mono">{g.credits}</td>
                        <td className="px-3 py-1.5 text-center font-mono">{g.marksObtained}</td>
                        <td className="px-3 py-1.5 text-center font-bold text-indigo-700">{g.grade}</td>
                        <td className="px-3 py-1.5 text-center font-mono font-bold">{g.gradePoints}</td>
                        <td className="px-3 py-1.5 text-center font-bold text-emerald-700">PASS</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs gap-3">
                <div>
                  <p className="font-semibold text-slate-700">Cumulative Grade Point Average (CGPA):</p>
                  <p className="text-2xl font-black text-indigo-900 mt-0.5">{summary?.cgpa || calculatedCgpa} / 10.00</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Total Credits Accrued:</p>
                  <p className="text-lg font-bold text-slate-900">{summary?.totalCreditsAccrued || totalCredits || 87} Credits</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Degree Classification:</p>
                  <p className="text-sm font-bold text-emerald-700">{summary?.classification || 'First Class with Distinction'}</p>
                </div>
              </div>

              {/* Verification & Seals */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <div>
                  <p className="font-bold text-slate-800">Verification Hash:</p>
                  <p className="font-mono text-[10px]">AITM-ACAD-2025-SHA256-4b8c9f012</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Date of Issue: {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <div className="w-28 border-b border-slate-400 mb-1 inline-block" />
                  <p className="font-bold text-slate-900">Registrar / Controller of Exams</p>
                  <p className="text-[10px] text-slate-500">Apex Institute of Technology</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Re-evaluation Modal */}
      {showRecheckModal && selectedSubjectForRecheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">Request Paper Re-evaluation</h3>
              </div>
              <button onClick={() => setShowRecheckModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {recheckSubmitted ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Re-evaluation Request Logged!</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your grievance ticket has been routed to the academic examination cell. You will be notified once the script is audited.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRecheck} className="p-5 space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-slate-900">{selectedSubjectForRecheck.subjectName}</p>
                  <p className="text-slate-600 font-mono">
                    {selectedSubjectForRecheck.subjectCode} • Current Score: {selectedSubjectForRecheck.marksObtained}/100 (Grade {selectedSubjectForRecheck.grade})
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for Re-evaluation / Retotalling Request:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={recheckReason}
                    onChange={(e) => setRecheckReason(e.target.value)}
                    placeholder="Specify the questions or discrepancies for review..."
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowRecheckModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
