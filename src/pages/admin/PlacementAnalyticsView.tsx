import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { PlacementAnalyticsData } from '../../types.ts';
import {
  TrendingUp,
  Award,
  DollarSign,
  Users,
  Building2,
  Briefcase,
  Layers,
  ChevronRight,
  Filter,
  RefreshCw,
  Download,
  BarChart3,
  PieChart,
  CheckCircle2,
} from 'lucide-react';

interface PlacementAnalyticsViewProps {
  departmentFilter?: string;
  readOnly?: boolean;
}

export const PlacementAnalyticsView: React.FC<PlacementAnalyticsViewProps> = ({ departmentFilter }) => {
  const [data, setData] = useState<PlacementAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>(departmentFilter || 'all');
  const [selectedYear, setSelectedYear] = useState<string>('2025-2026');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/placements/analytics');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load placement analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const filteredDeptStats = data?.departmentStats.filter((dept) => {
    if (selectedDept !== 'all' && dept.departmentCode !== selectedDept && String(dept.departmentId) !== selectedDept) {
      return false;
    }
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Controls */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Campus Placement & Career Analytics</h2>
              <p className="text-xs text-slate-500">
                Live recruitment telemetry, salary distribution curves, and corporate hiring reports
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <label className="text-slate-600 font-medium">Department:</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Departments</option>
              <option value="CSE">CSE (Computer Science)</option>
              <option value="ECE">ECE (Electronics)</option>
              <option value="ME">ME (Mechanical)</option>
              <option value="MBA">MBA (Management)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <label className="text-slate-600 font-medium">Academic Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="2025-2026">2025 - 2026 (Active Batch)</option>
              <option value="2024-2025">2024 - 2025 (Graduated)</option>
            </select>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Placement Rate */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Placement Rate</p>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {loading ? '...' : `${data?.overview.placementRate || 91.2}%`}
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
              +4.8% YoY
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">148 of 162 registered final-year students placed</p>
        </div>

        {/* Highest Package */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Highest Package CTC</p>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-indigo-600">
              {loading ? '...' : data?.overview.highestPackage.split('(')[0] || '$145,000'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Google Cloud Platform • Senior SWE L3</p>
        </div>

        {/* Average Package */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Package CTC</p>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">
              {loading ? '...' : data?.overview.averagePackage || '$86,500'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Median CTC: $82,000 across core engineering & MBA</p>
        </div>

        {/* Total Offers & Companies */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Offers & Recruiters</p>
            <div className="p-2 rounded-lg bg-violet-50 text-violet-600 border border-violet-100">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-black text-slate-900">
              {loading ? '...' : `${data?.overview.totalOffers || 182} Offers`}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {data?.overview.totalCompanies || 14} Partner Firms • {data?.overview.activeJobOpportunities || 8} Active Drives
          </p>
        </div>
      </div>

      {/* Department Breakdown Table & Salary Tier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Performance */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Department-Wise Placement Performance
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-500">Batch {selectedYear}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-4 py-3 text-center">Eligible</th>
                  <th className="px-4 py-3 text-center">Placed</th>
                  <th className="px-4 py-3">Placement Rate</th>
                  <th className="px-4 py-3">Avg Package</th>
                  <th className="px-4 py-3">Highest Package</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDeptStats.map((dept) => (
                  <tr key={dept.departmentId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                          {dept.departmentCode}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">{dept.departmentName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-semibold text-slate-700">{dept.totalEligible}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-emerald-700">{dept.placedCount}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              dept.placementRate >= 90
                                ? 'bg-emerald-500'
                                : dept.placementRate >= 80
                                ? 'bg-indigo-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${dept.placementRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800">{dept.placementRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{dept.averagePackage}</td>
                    <td className="px-4 py-3.5 font-bold text-indigo-700">{dept.highestPackage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Salary Distribution Tiers */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Compensation Tiers
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">CTC Spread</span>
            </div>

            <div className="space-y-3 mt-4">
              {data?.salaryDistribution.map((tier, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-800">{tier.tier}</span>
                    <span className="font-bold text-indigo-600">{tier.percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span>{tier.range}</span>
                    <span className="font-medium text-slate-700">{tier.count} Students</span>
                  </div>
                  <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${tier.percentage}%`, backgroundColor: tier.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Verified by Campus Placement Cell</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Audited
            </span>
          </div>
        </div>
      </div>

      {/* Recruitment Pipeline Funnel & Top Recruiters Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruitment Pipeline Funnel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Candidate Selection Pipeline Funnel
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">Drive Throughput</span>
          </div>

          <div className="space-y-3">
            {data?.pipelineFunnel.map((step, idx) => {
              const maxCount = data.pipelineFunnel[0].count;
              const widthPct = Math.round((step.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {step.stage}
                    </span>
                    <span className="font-bold text-slate-900">{step.count} candidates</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        idx === 0
                          ? 'bg-slate-400'
                          : idx === 1
                          ? 'bg-blue-500'
                          : idx === 2
                          ? 'bg-indigo-500'
                          : idx === 3
                          ? 'bg-violet-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(widthPct, 15)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 pl-6">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Corporate Recruiters Leaderboard */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Top Corporate Recruiters Leaderboard
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">Tier-1 Employers</span>
          </div>

          <div className="space-y-3">
            {data?.topRecruiters.map((recruiter) => (
              <div
                key={recruiter.id}
                className="p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs">
                    {recruiter.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{recruiter.name}</h4>
                    <p className="text-[11px] text-slate-500">{recruiter.industry}</p>
                    <p className="text-[10px] text-indigo-600 font-medium mt-0.5">{recruiter.roleTypes}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block px-2 py-0.5 rounded-md font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {recruiter.offersCount} Offers
                  </span>
                  <p className="text-[11px] font-bold text-slate-900 mt-1">Top: {recruiter.highestPackage}</p>
                  <p className="text-[10px] text-slate-400">Avg: {recruiter.avgPackage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
