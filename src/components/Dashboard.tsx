import React from 'react';
import { useAuth } from '../context/AuthContext';
import { schoolService } from '../services/schoolService';
import { NavTab } from './Navigation';
import {
  Calendar,
  Clock,
  UserCheck,
  AlertTriangle,
  ClockAlert,
  UserPlus,
  GitMerge,
  Send,
  CheckCircle2,
  Bell,
  ArrowRight,
  BookOpen,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { getTodayDateString, getDayOfWeekFromDate, SCHOOL_INFO } from '../data/seedData';
import { DayOfWeek } from '../types';

interface DashboardProps {
  onNavigate: (tab: NavTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { currentUser, currentTeacher } = useAuth();
  const isHM = currentUser.role === 'HM';
  const isAHM = currentUser.role === 'AHM';

  const todayStr = getTodayDateString();
  const todayDateObj = new Date();
  const currentDayOfWeek: DayOfWeek = getDayOfWeekFromDate(todayDateObj);

  const attendance = schoolService.getAttendance().filter((a) => a.date === todayStr);
  const totalTeachers = schoolService.getTeachers().filter((t) => t.active).length;
  const presentCount = attendance.filter((a) => a.status === 'Present' || a.status === 'Official Duty').length;
  const leaveCount = attendance.filter((a) => a.status === 'Approved Leave').length;
  const absentCount = attendance.filter((a) => a.status === 'Absent').length;
  const lateCount = attendance.filter((a) => a.status === 'Late Arrival').length;

  const provisionalToday = schoolService
    .getProvisionalArrangements()
    .filter((p) => p.date === todayStr && p.status === 'Published');

  const pendingLeaves = schoolService.getLeaves().filter((l) => l.status === 'Pending');

  const messages = schoolService.getMessages();
  const unreadMessages = messages.filter((m) => {
    const ack = schoolService.getAcknowledgements().find((a) => a.messageId === m.id && a.teacherId === currentUser.teacherId);
    return !ack;
  });

  // Teacher specific: My classes today
  const myRoutineToday = schoolService
    .getPermanentRoutines()
    .filter((r) => r.day === currentDayOfWeek && r.teacherId === currentUser.teacherId)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  // My provisional duties today (substitute assigned or class affected)
  const myProvisionalToday = provisionalToday.filter(
    (p) => p.replacementTeacherId === currentUser.teacherId || p.originalTeacherId === currentUser.teacherId
  );

  const notices = schoolService.getNotices().slice(0, 3);
  const schedule = schoolService.getSchedule();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-blue-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {todayDateObj.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="text-blue-300">• {currentDayOfWeek} Schedule</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1 text-white">
              {isHM ? 'Headmaster Administrative Console' : isAHM ? 'Assistant Headmaster Dashboard' : 'Teacher Workspace'}
            </h1>
            <p className="text-blue-200 text-sm mt-0.5">
              Welcome, <span className="font-semibold text-white">{currentTeacher?.name || currentUser.displayName}</span>
              {currentTeacher?.designation ? ` (${currentTeacher.designation})` : ''} • {SCHOOL_INFO.name}
            </p>
          </div>

          {/* Quick buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {(isHM || isAHM) && (
              <>
                <button
                  onClick={() => onNavigate('Provisional Routine')}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ClockAlert className="w-4 h-4" />
                  + Provisional Routine
                </button>
                <button
                  onClick={() => onNavigate('Substitution')}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  + Substitution
                </button>
              </>
            )}
            <button
              onClick={() => onNavigate('My Routine')}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              My Routine
            </button>
          </div>
        </div>
      </div>

      {/* Provisional Routine Alert Banner (Crucial Requirement: High visibility) */}
      {provisionalToday.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-xl p-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
                <ClockAlert className="w-5 h-5 text-amber-700 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                    Active Provisional Arrangements ({provisionalToday.length})
                  </span>
                  <span className="text-xs text-amber-700 font-medium">Published by Administration for Today</span>
                </div>
                <div className="mt-2 space-y-1.5 text-xs text-amber-950">
                  {provisionalToday.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center gap-2 bg-white/80 p-2 rounded-lg border border-amber-200">
                      <span className="font-bold bg-amber-100 px-1.5 py-0.5 rounded text-amber-900">
                        Period {p.periodNumber}
                      </span>
                      <span className="font-semibold">{p.classId} ({p.sectionOrStream})</span>
                      <span className="text-slate-500">|</span>
                      <span>Type: <strong className="text-amber-800">{p.arrangementType}</strong></span>
                      {p.replacementTeacherName && (
                        <span className="text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                          Assigned: {p.replacementTeacherName}
                        </span>
                      )}
                      {p.instructions && (
                        <span className="text-slate-600 truncate max-w-xs italic">
                          "{p.instructions}"
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigate('Provisional Routine')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 shrink-0 self-center bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              View Full
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* HM / AHM Management Overview Cards */}
      {(isHM || isAHM) && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Teacher Attendance</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {presentCount} / {totalTeachers}
              </span>
              <span className="text-xs text-emerald-600 font-bold">
                {totalTeachers > 0 ? Math.round((presentCount / totalTeachers) * 100) : 0}% Present
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
              <span className="text-amber-600 font-medium">Leave: {leaveCount}</span>
              <span className="text-rose-600 font-medium">Absent: {absentCount}</span>
              <span className="text-blue-600 font-medium">Late: {lateCount}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Provisional Routines</span>
              <ClockAlert className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600">
                {provisionalToday.length}
              </span>
              <span className="text-xs text-slate-500">Arrangements today</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Live updates visible to affected teachers
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Pending Leaves</span>
              <AlertTriangle className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-600">
                {pendingLeaves.length}
              </span>
              <span className="text-xs text-slate-500">Applications awaiting</span>
            </div>
            <button
              onClick={() => onNavigate('Leave Management')}
              className="mt-2 text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
            >
              Review leaves <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Unread Notices</span>
              <Bell className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600">
                {unreadMessages.length}
              </span>
              <span className="text-xs text-slate-500">Requires attention</span>
            </div>
            <button
              onClick={() => onNavigate('Messages')}
              className="mt-2 text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
            >
              Open messaging <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Teacher routine & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Classes & Provisional Duties */}
        <div className="lg:col-span-2 space-y-6">
          {/* Teacher personal classes today */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  My Classes Today ({currentDayOfWeek})
                </h2>
                <p className="text-xs text-slate-500">
                  Assigned routine periods for {currentTeacher?.name || currentUser.displayName}
                </p>
              </div>
              <button
                onClick={() => onNavigate('My Routine')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Weekly Table <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Substitution duty notice for this teacher if any */}
            {myProvisionalToday.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-xl">
                <span className="text-xs font-bold text-amber-900 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Important: Special Provisional Duty Assigned to You
                </span>
                <div className="mt-2 space-y-2">
                  {myProvisionalToday.map((p) => (
                    <div key={p.id} className="bg-white p-2.5 rounded-lg border border-amber-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900">Period {p.periodNumber} • {p.classId} ({p.sectionOrStream})</span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                          {p.arrangementType}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-1">
                        Room: <strong>{p.temporaryRoom || 'Regular'}</strong> | Original Teacher: {p.originalTeacherName}
                      </p>
                      {p.instructions && (
                        <p className="text-slate-600 italic mt-0.5">Note: "{p.instructions}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {myRoutineToday.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                <p>No regular teaching periods scheduled for you on {currentDayOfWeek}.</p>
                <p className="text-xs mt-1 text-slate-400">You may be assigned as substitute during free periods.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {myRoutineToday.map((item) => {
                  const periodTiming = schedule.find((s) => s.periodNumber === item.periodNumber);
                  // Check if there is an override for this period today
                  const override = provisionalToday.find(
                    (p) => p.periodNumber === item.periodNumber && p.classId === item.classId
                  );

                  return (
                    <div
                      key={item.id}
                      className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                        override ? 'bg-amber-50/50 p-2 rounded-lg' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-black flex flex-col items-center justify-center text-xs">
                          <span>P-{item.periodNumber}</span>
                          <span className="text-[10px] font-normal text-slate-500">
                            {periodTiming?.startTime.replace(' ', '')}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {item.classId} - {item.sectionOrStream}
                            </span>
                            <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                              {item.subject}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Room: <span className="font-medium text-slate-700 dark:text-slate-300">{item.room}</span>
                            {periodTiming ? ` • ${periodTiming.startTime} - ${periodTiming.endTime}` : ''}
                          </p>
                        </div>
                      </div>

                      {override && (
                        <div className="text-xs sm:text-right">
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px]">
                            Provisional: {override.arrangementType}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Substituted by: {override.replacementTeacherName || 'N/A'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* School Daily Period Schedule Timeline */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-indigo-600" />
              School Daily Bell Schedule (Nirbhoypur B. G. Nikshaniketan)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {schedule.map((p) => (
                <div
                  key={p.periodNumber}
                  className={`p-2.5 rounded-lg border flex flex-col ${
                    p.isBreak
                      ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-700/40 dark:border-slate-600 dark:text-slate-200'
                  }`}
                >
                  <span className="font-bold text-[11px] truncate">{p.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    {p.startTime} – {p.endTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Notices, Messages, Quick Actions */}
        <div className="space-y-6">
          {/* Official Notices */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                School Notices
              </h3>
              <span className="text-[10px] uppercase font-bold text-slate-400">Official</span>
            </div>

            <div className="space-y-3">
              {notices.map((n) => (
                <div key={n.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white truncate pr-2">
                      {n.title}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        n.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {n.priority}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                    {n.content}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>By: {n.publishedBy}</span>
                    <span>{new Date(n.publishedAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick HM / AT Messages Box */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                HM Instructions & Alerts
              </h3>
              <button
                onClick={() => onNavigate('Messages')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                Inbox ({messages.length})
              </button>
            </div>

            {messages.slice(0, 2).map((msg) => {
              const isAcked = schoolService
                .getAcknowledgements()
                .some((a) => a.messageId === msg.id && a.teacherId === currentUser.teacherId);

              return (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg border text-xs mb-2 ${
                    msg.priority === 'Urgent'
                      ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20'
                      : 'border-slate-200 bg-slate-50/50 dark:bg-slate-700/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {msg.subject}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        msg.priority === 'Urgent' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {msg.category}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                    {msg.body}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">From: {msg.senderName}</span>
                    {msg.requiresAck && (
                      isAcked ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            schoolService.acknowledgeMessage(
                              msg.id,
                              currentUser.teacherId,
                              currentTeacher?.name || currentUser.displayName
                            );
                          }}
                          className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
