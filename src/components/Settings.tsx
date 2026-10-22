import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { schoolService } from '../services/schoolService';
import { PeriodSchedule } from '../types';
import { SCHOOL_INFO } from '../data/seedData';
import {
  Settings as SettingsIcon,
  Clock,
  Save,
  CheckCircle2,
  ShieldCheck,
  Database,
  History,
  CloudCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { currentUser, currentTeacher } = useAuth();
  const isHM = currentUser.role === 'HM';

  const [schedule, setSchedule] = useState<PeriodSchedule[]>(schoolService.getSchedule());
  const [feedback, setFeedback] = useState('');
  const auditLogs = schoolService.getAuditLogs();

  const handleTimingChange = (index: number, field: 'startTime' | 'endTime' | 'name', value: string) => {
    const updated = [...schedule];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setSchedule(updated);
  };

  const handleSaveSchedule = () => {
    schoolService.updateSchedule(schedule, `${currentTeacher?.name || currentUser.displayName} (HM)`);
    setFeedback('Daily school timetable bell schedule updated successfully!');
    setTimeout(() => setFeedback(''), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-600">
            <SettingsIcon className="w-4 h-4" />
            <span>Administrative Configuration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            System & Schedule Settings
          </h1>
          <p className="text-xs text-slate-500">
            Configure school bell schedule, manage academic sessions, and monitor database audit trails.
          </p>
        </div>

        {isHM && (
          <button
            onClick={handleSaveSchedule}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Schedule Timings
          </button>
        )}
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      {/* Cloud & School Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* School Metadata */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs text-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Institution Profile
          </h3>
          <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
            <p><strong>School Name:</strong> {SCHOOL_INFO.name}</p>
            <p><strong>Affiliation:</strong> West Bengal Board of Secondary Education (WBBSE) & WBCHSE</p>
            <p><strong>Index No:</strong> {SCHOOL_INFO.indexNo} • <strong>H.S. Code:</strong> {SCHOOL_INFO.hscode}</p>
            <p><strong>Current Academic Session:</strong> {SCHOOL_INFO.academicSession}</p>
            <p><strong>Classes:</strong> Class V – X (Sec A, B) • Class XI – XII (Science, Arts)</p>
          </div>
        </div>

        {/* Database & Cloud Firestore Status */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs text-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            Cloud Firestore & Auth Status
          </h3>
          <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 text-emerald-600 font-bold">
              <CloudCheck className="w-4 h-4" />
              <span>Provisioned & Connected via Firebase SDK</span>
            </div>
            <p><strong>Project ID:</strong> static-ivy-6ggh3</p>
            <p><strong>Database ID:</strong> ai-studio-nirbhoypurbgniks-5e0b4849-a878-4c9f-888c-38f497a1f063</p>
            <p><strong>Security Rules:</strong> Zero-Trust RBAC (Headmaster / Teacher partitions deployed)</p>
            <p><strong>Offline Sync:</strong> Resilient localStorage fallback enabled</p>
          </div>
        </div>
      </div>

      {/* Period Schedule Timings Editor */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Daily Period Schedule Configuration
            </h2>
            <p className="text-xs text-slate-500">
              Default school schedule from Morning Prayer (10:40 AM) to Period 8 (04:30 PM). Editable by Headmaster.
            </p>
          </div>

          {!isHM && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">
              Read-Only for Assistant Teachers
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                <th className="p-2.5 font-bold">Activity / Period</th>
                <th className="p-2.5 font-bold">Start Time</th>
                <th className="p-2.5 font-bold">End Time</th>
                <th className="p-2.5 font-bold">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {schedule.map((item, idx) => (
                <tr key={item.periodNumber} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                    {isHM ? (
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleTimingChange(idx, 'name', e.target.value)}
                        className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs w-48 font-bold"
                      />
                    ) : (
                      item.name
                    )}
                  </td>

                  <td className="p-2.5">
                    {isHM ? (
                      <input
                        type="text"
                        value={item.startTime}
                        onChange={(e) => handleTimingChange(idx, 'startTime', e.target.value)}
                        className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs w-28 font-mono"
                      />
                    ) : (
                      <span className="font-mono">{item.startTime}</span>
                    )}
                  </td>

                  <td className="p-2.5">
                    {isHM ? (
                      <input
                        type="text"
                        value={item.endTime}
                        onChange={(e) => handleTimingChange(idx, 'endTime', e.target.value)}
                        className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs w-28 font-mono"
                      />
                    ) : (
                      <span className="font-mono">{item.endTime}</span>
                    )}
                  </td>

                  <td className="p-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.isBreak ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.isBreak ? 'Assembly / Break' : 'Academic Class'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log (HM View) */}
      {isHM && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Administrative Audit Log (Recent System Events)
            </h3>
            <span className="text-[10px] text-slate-400">Security Audit Trail</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block font-mono text-[11px]">
                    {log.action}
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">{log.details}</p>
                </div>
                <div className="text-right shrink-0 text-[10px] text-slate-400">
                  <span className="block font-medium">{log.performedBy}</span>
                  <span>{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
