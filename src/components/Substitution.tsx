import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { schoolService } from '../services/schoolService';
import { Teacher, DayOfWeek, ProvisionalArrangement } from '../types';
import { getTodayDateString, getDayOfWeekFromDate } from '../data/seedData';
import {
  UserPlus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Send,
  UserCheck,
} from 'lucide-react';

export const Substitution: React.FC = () => {
  const { currentUser, currentTeacher } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedAbsentTeacherId, setSelectedAbsentTeacherId] = useState<string>('');
  const [reason, setReason] = useState('Absent / Approved Leave');
  const [statusMessage, setStatusMessage] = useState('');

  const allTeachers = schoolService.getTeachers().filter((t) => t.active);
  const permanentRoutines = schoolService.getPermanentRoutines();
  const attendance = schoolService.getAttendance().filter((a) => a.date === selectedDate);
  const provisionalArrangements = schoolService.getProvisionalArrangements();

  // Find who is reported absent or on leave today
  const absentOrLeaveTeachers = allTeachers.filter((t) => {
    const att = attendance.find((a) => a.teacherId === t.teacherId);
    return att && (att.status === 'Absent' || att.status === 'Approved Leave');
  });

  // Calculate day of week
  const dateObj = new Date(selectedDate);
  const dayOfWeek: DayOfWeek = getDayOfWeekFromDate(dateObj);

  // Selected absent teacher
  const selectedTeacher = allTeachers.find((t) => t.teacherId === selectedAbsentTeacherId);

  // Affected periods for this absent teacher on this day
  const affectedRoutinePeriods = selectedAbsentTeacherId
    ? permanentRoutines
        .filter((r) => r.day === dayOfWeek && r.teacherId === selectedAbsentTeacherId)
        .sort((a, b) => a.periodNumber - b.periodNumber)
    : [];

  // State of selected substitutes per period
  const [assignedSubs, setAssignedSubs] = useState<{ [periodNumber: number]: string }>({});
  const [instructionsPerPeriod, setInstructionsPerPeriod] = useState<{ [periodNumber: number]: string }>({});

  const handleSelectSubstitute = (periodNumber: number, substituteTeacherId: string) => {
    setAssignedSubs((prev) => ({
      ...prev,
      [periodNumber]: substituteTeacherId,
    }));
  };

  const handleConfirmAllSubstitutions = async () => {
    if (!selectedTeacher) return;

    let count = 0;
    for (const routine of affectedRoutinePeriods) {
      const subId = assignedSubs[routine.periodNumber];
      if (subId) {
        const subTeacher = allTeachers.find((t) => t.teacherId === subId);
        const pa: ProvisionalArrangement = {
          id: `PA-SUB-${selectedDate}-${routine.periodNumber}-${routine.classId.replace(/\s+/g, '')}`,
          date: selectedDate,
          periodNumber: routine.periodNumber,
          classId: routine.classId,
          sectionOrStream: routine.sectionOrStream,
          originalTeacherId: selectedTeacher.teacherId,
          originalTeacherName: selectedTeacher.name,
          replacementTeacherId: subTeacher?.teacherId,
          replacementTeacherName: subTeacher?.name,
          temporaryRoom: routine.room,
          arrangementType: 'Substitute teacher',
          instructions:
            instructionsPerPeriod[routine.periodNumber] ||
            `Supervise ${routine.subject} class in ${routine.classId} (${routine.sectionOrStream}).`,
          reason: `${selectedTeacher.name} unavailable (${reason}).`,
          status: 'Published',
          createdBy: currentUser.teacherId,
          createdByName: `${currentTeacher?.name || currentUser.displayName} (${currentUser.role})`,
          createdAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
          affectedTeacherIds: [selectedTeacher.teacherId, subId],
          affectedClassIds: [`${routine.classId} - ${routine.sectionOrStream}`],
        };

        await schoolService.saveProvisionalArrangement(pa);
        count++;
      }
    }

    setStatusMessage(`Successfully generated and published ${count} substitute teacher arrangement(s)! Notifications sent.`);
    setTimeout(() => setStatusMessage(''), 5000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-blue-600/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-200">
            <UserPlus className="w-4 h-4" />
            <span>Smart Administrative Assistant</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1 text-white">
            Substitute Teacher Management Wizard
          </h1>
          <p className="text-blue-100 text-xs mt-1 max-w-2xl">
            Detect absent teachers, identify affected periods in the timetable, automatically match free & eligible subject teachers, and publish substitute arrangements with one click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 text-xs flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-300" />
            <span>Date: <strong>{selectedDate}</strong> ({dayOfWeek})</span>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      {/* Step 1: Select Absent Teacher */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
              1
            </span>
            Select Absent / Unavailable Teacher
          </h2>
          <span className="text-xs text-slate-500">
            {absentOrLeaveTeachers.length} teachers marked absent/leave today
          </span>
        </div>

        {/* Quick select pills from today's attendance */}
        {absentOrLeaveTeachers.length > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-xs">
            <span className="font-bold text-amber-900 dark:text-amber-200 block mb-2">
              Detected from Today's Attendance Register:
            </span>
            <div className="flex flex-wrap gap-2">
              {absentOrLeaveTeachers.map((t) => (
                <button
                  key={t.teacherId}
                  onClick={() => setSelectedAbsentTeacherId(t.teacherId)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedAbsentTeacherId === t.teacherId
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-300 border border-amber-300'
                  }`}
                >
                  {t.name} ({t.subjects.slice(0, 2).join(', ')})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Select Teacher
            </label>
            <select
              value={selectedAbsentTeacherId}
              onChange={(e) => setSelectedAbsentTeacherId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="">-- Choose Any Teacher --</option>
              {allTeachers.map((t) => (
                <option key={t.teacherId} value={t.teacherId}>
                  {t.name} ({t.designation} - {t.subjects.join(', ')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Target Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs cursor-pointer"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Absence Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              placeholder="e.g. Medical leave, Deputation, Urgent personal"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Affected Periods & Smart Match Suggestions */}
      {selectedTeacher && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                  2
                </span>
                Affected Classes on {dayOfWeek} ({affectedRoutinePeriods.length} Periods Found)
              </h2>
              <p className="text-xs text-slate-500">
                Scheduled periods for <strong>{selectedTeacher.name}</strong> requiring substitute assignments:
              </p>
            </div>

            {affectedRoutinePeriods.length > 0 && (
              <button
                onClick={handleConfirmAllSubstitutions}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Publish All Assigned Substitutions
              </button>
            )}
          </div>

          {affectedRoutinePeriods.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedTeacher.name} has no regular classes scheduled on {dayOfWeek}.
              </p>
              <p className="text-slate-400 mt-0.5">No substitutions needed for this teacher on this day.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {affectedRoutinePeriods.map((routine) => {
                const availableSubs = schoolService.findAvailableSubstitutes(
                  selectedDate,
                  routine.periodNumber,
                  dayOfWeek,
                  routine.subject
                );

                const freeTeachers = availableSubs.filter((s) => s.status === 'Free');
                const selectedSubId = assignedSubs[routine.periodNumber];

                return (
                  <div
                    key={routine.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 text-xs space-y-3"
                  >
                    {/* Period header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="font-black bg-blue-600 text-white px-2 py-0.5 rounded text-[11px]">
                          Period {routine.periodNumber}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {routine.classId} ({routine.sectionOrStream})
                        </span>
                        <span className="text-blue-700 dark:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-900/50 px-2 py-0.5 rounded">
                          Subject: {routine.subject}
                        </span>
                        <span className="text-slate-500 font-mono">
                          Room: {routine.room}
                        </span>
                      </div>

                      {freeTeachers.length === 0 && (
                        <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> No Free Eligible Teachers
                        </span>
                      )}
                    </div>

                    {/* Match suggestions */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Available Free Teachers for Period {routine.periodNumber} ({freeTeachers.length} available):
                      </span>

                      {freeTeachers.length === 0 ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-center justify-between">
                          <span>
                            Warning: All staff members are currently occupied with classes or on leave during Period {routine.periodNumber}.
                          </span>
                          <span className="font-bold underline cursor-pointer">Merge Section or Assign Free Period</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {freeTeachers.slice(0, 6).map(({ teacher, isSubjectMatch }) => {
                            const isChosen = selectedSubId === teacher.teacherId;
                            return (
                              <button
                                key={teacher.teacherId}
                                onClick={() => handleSelectSubstitute(routine.periodNumber, teacher.teacherId)}
                                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                  isChosen
                                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400 text-emerald-950 font-semibold'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold truncate">{teacher.name}</span>
                                  {isSubjectMatch && (
                                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                                      Subject Match
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 truncate mt-0.5">
                                  {teacher.subjects.join(', ')}
                                </span>
                                <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[10px]">
                                  <span className="text-emerald-600 font-bold">● Free Period</span>
                                  <span className={isChosen ? 'text-emerald-700 font-bold' : 'text-blue-600'}>
                                    {isChosen ? '✓ Selected' : 'Select'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Specific instruction for substitute */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Instructions / Syllabus Activity for this Substitute Period:
                      </label>
                      <input
                        type="text"
                        value={instructionsPerPeriod[routine.periodNumber] || ''}
                        onChange={(e) =>
                          setInstructionsPerPeriod({
                            ...instructionsPerPeriod,
                            [routine.periodNumber]: e.target.value,
                          })
                        }
                        placeholder={`e.g. Conduct ${routine.subject} syllabus reading / revision worksheet.`}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
