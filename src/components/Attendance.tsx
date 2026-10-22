import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { schoolService } from '../services/schoolService';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { getTodayDateString } from '../data/seedData';
import {
  UserCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Printer,
  Save,
} from 'lucide-react';

export const Attendance: React.FC = () => {
  const { currentUser, currentTeacher } = useAuth();
  const isHM = currentUser.role === 'HM';
  const isAHM = currentUser.role === 'AHM';
  const canEdit = isHM || isAHM;

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [feedback, setFeedback] = useState('');

  const allTeachers = schoolService.getTeachers().filter((t) => t.active);
  const attendanceList = schoolService.getAttendance();

  // Records for selected date
  const recordsForDate = allTeachers.map((t) => {
    const existing = attendanceList.find((a) => a.date === selectedDate && a.teacherId === t.teacherId);
    return (
      existing || {
        id: `ATT-${selectedDate}-${t.teacherId}`,
        date: selectedDate,
        teacherId: t.teacherId,
        teacherName: t.name,
        employeeCode: t.employeeCode,
        status: 'Present' as AttendanceStatus,
        timeIn: '10:25 AM',
        remarks: 'On time',
        recordedBy: `${currentTeacher?.name || currentUser.displayName} (${currentUser.role})`,
        updatedAt: new Date().toISOString(),
      }
    );
  });

  const [currentAttendance, setCurrentAttendance] = useState<{ [teacherId: string]: AttendanceRecord }>(() => {
    const map: { [id: string]: AttendanceRecord } = {};
    recordsForDate.forEach((r) => {
      map[r.teacherId] = r;
    });
    return map;
  });

  const handleStatusChange = (teacherId: string, status: AttendanceStatus) => {
    setCurrentAttendance((prev) => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        status,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const handleRemarksChange = (teacherId: string, remarks: string) => {
    setCurrentAttendance((prev) => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        remarks,
      },
    }));
  };

  const handleTimeInChange = (teacherId: string, timeIn: string) => {
    setCurrentAttendance((prev) => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        timeIn,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    setCurrentAttendance((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        if (updated[id].status !== 'Approved Leave') {
          updated[id] = {
            ...updated[id],
            status: 'Present',
            timeIn: '10:20 AM',
            remarks: 'On time',
          };
        }
      });
      return updated;
    });
  };

  const handleSaveAttendance = async () => {
    const recordsToSave = Object.values(currentAttendance);
    await schoolService.saveAttendance(
      recordsToSave,
      `${currentTeacher?.name || currentUser.displayName} (${currentUser.role})`
    );
    setFeedback(`Attendance register for ${selectedDate} saved and synced to database!`);
    setTimeout(() => setFeedback(''), 4000);
  };

  // Stats
  const activeRecords = Object.values(currentAttendance);
  const presentCount = activeRecords.filter((r) => r.status === 'Present').length;
  const leaveCount = activeRecords.filter((r) => r.status === 'Approved Leave').length;
  const absentCount = activeRecords.filter((r) => r.status === 'Absent').length;
  const lateCount = activeRecords.filter((r) => r.status === 'Late Arrival').length;
  const dutyCount = activeRecords.filter((r) => r.status === 'Official Duty').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-600">
            <UserCheck className="w-4 h-4" />
            <span>Staff Attendance Register</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Teacher Daily Attendance
          </h1>
          <p className="text-xs text-slate-500">
            Official muster roll for Nirbhoypur B. G. Nikshaniketan (H.S.). Absence is recorded by administrative entry only.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={handleMarkAllPresent}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Mark All Present
              </button>
              <button
                onClick={handleSaveAttendance}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save & Lock Attendance
              </button>
            </>
          )}

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Muster Roll
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      {/* Date Selector & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="flex-1 text-xs">
            <span className="text-slate-400 font-semibold block">Select Register Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-bold text-slate-900 dark:text-white bg-transparent focus:outline-hidden cursor-pointer"
            />
          </div>
        </div>

        <div className="md:col-span-3 grid grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
            <span className="text-[10px] font-bold uppercase block">Present</span>
            <span className="text-lg font-black">{presentCount}</span>
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
            <span className="text-[10px] font-bold uppercase block">Leave</span>
            <span className="text-lg font-black">{leaveCount}</span>
          </div>
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-900">
            <span className="text-[10px] font-bold uppercase block">Absent</span>
            <span className="text-lg font-black">{absentCount}</span>
          </div>
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
            <span className="text-[10px] font-bold uppercase block">Late</span>
            <span className="text-lg font-black">{lateCount}</span>
          </div>
          <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-900">
            <span className="text-[10px] font-bold uppercase block">On Duty</span>
            <span className="text-lg font-black">{dutyCount}</span>
          </div>
        </div>
      </div>

      {/* Attendance Register Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 font-bold">Sl.</th>
                <th className="p-3 font-bold">Teacher Name & Designation</th>
                <th className="p-3 font-bold">Employee Code</th>
                <th className="p-3 font-bold">Attendance Status</th>
                <th className="p-3 font-bold">Arrival Time</th>
                <th className="p-3 font-bold">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {allTeachers.map((t, idx) => {
                const rec = currentAttendance[t.teacherId] || {
                  status: 'Present',
                  timeIn: '10:25 AM',
                  remarks: '',
                };

                return (
                  <tr key={t.teacherId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>

                    <td className="p-3">
                      <span className="font-bold text-slate-900 dark:text-white block text-sm">
                        {t.name}
                      </span>
                      <span className="text-[10px] text-slate-500">{t.designation}</span>
                    </td>

                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                      {t.employeeCode}
                    </td>

                    <td className="p-3">
                      {canEdit ? (
                        <select
                          value={rec.status}
                          onChange={(e) => handleStatusChange(t.teacherId, e.target.value as AttendanceStatus)}
                          className={`p-1.5 rounded-lg border text-xs font-bold ${
                            rec.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : rec.status === 'Approved Leave'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : rec.status === 'Absent'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : rec.status === 'Late Arrival'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-purple-50 text-purple-800 border-purple-300'
                          }`}
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Approved Leave">Approved Leave</option>
                          <option value="Official Duty">Official Duty</option>
                          <option value="Late Arrival">Late Arrival</option>
                          <option value="Half Day">Half Day</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            rec.status === 'Present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.status === 'Approved Leave'
                              ? 'bg-amber-100 text-amber-800'
                              : rec.status === 'Absent'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {rec.status}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {canEdit ? (
                        <input
                          type="text"
                          value={rec.timeIn || ''}
                          onChange={(e) => handleTimeInChange(t.teacherId, e.target.value)}
                          placeholder="e.g. 10:25 AM"
                          className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs w-28"
                        />
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400 font-mono">
                          {rec.timeIn || '—'}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {canEdit ? (
                        <input
                          type="text"
                          value={rec.remarks || ''}
                          onChange={(e) => handleRemarksChange(t.teacherId, e.target.value)}
                          placeholder="Optional remarks"
                          className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs w-full max-w-xs"
                        />
                      ) : (
                        <span className="text-slate-500 italic">{rec.remarks || '—'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
