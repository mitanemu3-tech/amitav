import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { schoolService } from '../services/schoolService';
import { DayOfWeek } from '../types';
import {
  Calendar,
  ClockAlert,
  Printer,
  BookOpen,
  Filter,
  Info,
  Sparkles,
} from 'lucide-react';
import { getTodayDateString } from '../data/seedData';

export const MyRoutine: React.FC = () => {
  const { currentUser, currentTeacher } = useAuth();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const schedule = schoolService.getSchedule();
  const todayStr = getTodayDateString();

  const allPermanentRoutines = schoolService.getPermanentRoutines();
  const provisionalArrangements = schoolService.getProvisionalArrangements().filter((p) => p.status === 'Published');

  // Teacher's regular entries
  const myRegularEntries = allPermanentRoutines.filter((r) => r.teacherId === currentUser.teacherId);

  // Teacher's provisional arrangements today
  const myProvisionalToday = provisionalArrangements.filter(
    (p) =>
      p.date === todayStr &&
      (p.replacementTeacherId === currentUser.teacherId || p.originalTeacherId === currentUser.teacherId)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-600">
            <BookOpen className="w-4 h-4" />
            <span>Personal Timetable Register</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            My Teaching Routine
          </h1>
          <p className="text-xs text-slate-500">
            Assigned classes for <strong className="text-slate-700 dark:text-slate-300">{currentTeacher?.name || currentUser.displayName}</strong> • {currentTeacher?.designation || 'Staff'} ({currentTeacher?.employeeCode || 'N/A'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Day / Week Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'day' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs font-bold' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'week' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs font-bold' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Full Week
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Slip
          </button>
        </div>
      </div>

      {/* Provisional Routine Indicator */}
      {myProvisionalToday.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl text-xs text-amber-950">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
            <ClockAlert className="w-4 h-4 text-amber-600" />
            <span>Today's Temporary Class Arrangements Affecting You</span>
          </div>
          <p className="mt-1 text-slate-600">
            The Headmaster has published provisional arrangements for today ({todayStr}). Your routine entries below reflect these live changes:
          </p>
          <div className="mt-2 space-y-1.5">
            {myProvisionalToday.map((pa) => (
              <div key={pa.id} className="bg-white p-2.5 rounded-lg border border-amber-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-amber-900">Period {pa.periodNumber}: </span>
                  <span>{pa.classId} ({pa.sectionOrStream})</span>
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                    {pa.arrangementType}
                  </span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {pa.replacementTeacherId === currentUser.teacherId ? (
                      <span className="text-emerald-700 font-bold">
                        ★ You are taking this class as substitute for {pa.originalTeacherName}
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold">
                        ⚠ Your regular class is being taken by substitute: {pa.replacementTeacherName}
                      </span>
                    )}
                  </p>
                </div>
                {pa.temporaryRoom && (
                  <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded font-medium">
                    Room: {pa.temporaryRoom}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day Selector Tabs (for Day View) */}
      {viewMode === 'day' && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {days.map((day) => {
            const count = myRegularEntries.filter((r) => r.day === day).length;
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{day}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {count} classes
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Routine Display */}
      {viewMode === 'day' ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{selectedDay} Schedule</span>
            </h2>
            <span className="text-xs text-slate-500">
              Total 8 periods • Prayer at 10:40 AM • Tiffin at 01:30 PM
            </span>
          </div>

          <div className="space-y-3">
            {schedule.map((p) => {
              if (p.isBreak) {
                return (
                  <div
                    key={p.periodNumber}
                    className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 font-semibold"
                  >
                    <span>🔔 {p.name}</span>
                    <span>{p.startTime} – {p.endTime}</span>
                  </div>
                );
              }

              // Find regular routine entry
              const regular = myRegularEntries.find((r) => r.day === selectedDay && r.periodNumber === p.periodNumber);

              // Find any provisional arrangement for today (if selectedDay is today)
              const prov = provisionalArrangements.find(
                (pa) =>
                  pa.date === todayStr &&
                  pa.periodNumber === p.periodNumber &&
                  (pa.replacementTeacherId === currentUser.teacherId || pa.originalTeacherId === currentUser.teacherId)
              );

              return (
                <div
                  key={p.periodNumber}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    prov
                      ? prov.replacementTeacherId === currentUser.teacherId
                        ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300'
                        : 'bg-rose-50/60 border-rose-200 line-through opacity-75'
                      : regular
                      ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex flex-col items-center justify-center text-xs font-bold shrink-0">
                      <span className="text-slate-800 dark:text-white">P-{p.periodNumber}</span>
                      <span className="text-[9px] font-normal text-slate-500">
                        {p.startTime.split(' ')[0]}
                      </span>
                    </div>

                    <div>
                      {prov && prov.replacementTeacherId === currentUser.teacherId ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-900 dark:text-amber-300 text-sm">
                              {prov.classId} – {prov.sectionOrStream}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px] uppercase">
                              ★ Substitute Assignment
                            </span>
                          </div>
                          <p className="text-xs text-amber-800 mt-0.5">
                            Substituted for: <strong>{prov.originalTeacherName}</strong> | Room: <strong>{prov.temporaryRoom || 'Regular'}</strong>
                          </p>
                          {prov.instructions && (
                            <p className="text-[11px] text-slate-600 italic mt-0.5">
                              Instruction: {prov.instructions}
                            </p>
                          )}
                        </div>
                      ) : regular ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {regular.classId} – {regular.sectionOrStream}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[11px]">
                              {regular.subject}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Room: <strong className="text-slate-700 dark:text-slate-300">{regular.room}</strong> • Timing: {p.startTime} – {p.endTime}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-xs font-medium text-slate-400">Vacant / Off Period (Preparation)</span>
                          <p className="text-[11px] text-slate-400">{p.startTime} – {p.endTime}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-right">
                    {prov ? (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        Provisional Overlay Active
                      </span>
                    ) : regular ? (
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                        Permanent Routine
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Free Period</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Full Weekly Grid View */
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Weekly Master Grid for {currentTeacher?.name || currentUser.displayName}
            </h3>
            <span className="text-xs text-slate-500">Academic Session 2026-2027</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-2.5 font-bold border-r border-slate-200 dark:border-slate-700">Day</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((pNum) => (
                    <th key={pNum} className="p-2.5 font-bold text-center border-r border-slate-200 dark:border-slate-700">
                      Period {pNum}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {days.map((day) => (
                  <tr key={day} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="p-2.5 font-bold bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                      {day}
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((pNum) => {
                      const entry = myRegularEntries.find((r) => r.day === day && r.periodNumber === pNum);
                      return (
                        <td
                          key={pNum}
                          className="p-2 border-r border-slate-200 dark:border-slate-700 text-center align-top h-16"
                        >
                          {entry ? (
                            <div className="bg-blue-50 dark:bg-blue-900/40 p-1.5 rounded-lg border border-blue-200 dark:border-blue-800 text-[11px]">
                              <span className="font-bold text-blue-900 dark:text-blue-200 block truncate">
                                {entry.classId}
                              </span>
                              <span className="text-blue-700 dark:text-blue-300 block truncate font-medium">
                                {entry.subject}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {entry.room}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 dark:text-slate-600 block mt-4">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
