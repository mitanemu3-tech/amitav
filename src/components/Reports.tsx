import React, { useState } from 'react';
import { schoolService } from '../services/schoolService';
import { SCHOOL_INFO, SCHOOL_CLASSES, getTodayDateString } from '../data/seedData';
import { DayOfWeek } from '../types';
import {
  Printer,
  FileText,
  Calendar,
  Users,
  ClockAlert,
  GitMerge,
  UserCheck,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<
    | 'daily-routine'
    | 'teacher-routine'
    | 'class-routine'
    | 'provisional-register'
    | 'substitute-register'
    | 'merged-register'
    | 'attendance-register'
    | 'leave-register'
    | 'acknowledgement-audit'
  >('daily-routine');

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('Class V');

  const allTeachers = schoolService.getTeachers().filter((t) => t.active);
  const permanentRoutines = schoolService.getPermanentRoutines();
  const provisionalArrangements = schoolService.getProvisionalArrangements();
  const mergedClasses = schoolService.getMergedClasses();
  const attendance = schoolService.getAttendance();
  const leaves = schoolService.getLeaves();
  const messages = schoolService.getMessages();
  const acks = schoolService.getAcknowledgements();
  const schedule = schoolService.getSchedule();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Screen Controls (Hidden during print) */}
      <div className="print:hidden space-y-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-600">
              <Printer className="w-4 h-4" />
              <span>Official School Registers & Statements</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              School Reports & Master Registers
            </h1>
            <p className="text-xs text-slate-500">
              Generate formal printable registers formatted for official documentation and archiving at Nirbhoypur B. G. Nikshaniketan (H.S.).
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Report Sheet
          </button>
        </div>

        {/* Report Selector Pills */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap gap-2 text-xs font-semibold">
          <button
            onClick={() => setSelectedReport('daily-routine')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedReport === 'daily-routine' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Daily School Routine
          </button>
          <button
            onClick={() => setSelectedReport('teacher-routine')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedReport === 'teacher-routine' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Teacher-wise Routine
          </button>
          <button
            onClick={() => setSelectedReport('class-routine')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedReport === 'class-routine' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Class-wise Routine
          </button>
          <button
            onClick={() => setSelectedReport('provisional-register')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedReport === 'provisional-register' ? 'bg-amber-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Daily Provisional Routine
          </button>
          <button
            onClick={() => setSelectedReport('substitute-register')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedReport === 'substitute-register' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Substitute Teacher Register
          </button>
          <button
            onClick={() => setSelectedReport('merged-register')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedReport === 'merged-register' ? 'bg-purple-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Merged Class Register
          </button>
          <button
            onClick={() => setSelectedReport('attendance-register')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedReport === 'attendance-register' ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Teacher Attendance Muster
          </button>
          <button
            onClick={() => setSelectedReport('leave-register')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedReport === 'leave-register' ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Leave Applications Register
          </button>
          <button
            onClick={() => setSelectedReport('acknowledgement-audit')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedReport === 'acknowledgement-audit' ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Notice Acknowledgement Audit
          </button>
        </div>

        {/* Dynamic Filters depending on selected report */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 text-xs">
          {(selectedReport === 'daily-routine' || selectedReport === 'class-routine') && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Day of Week:</span>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedReport === 'teacher-routine' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Teacher:</span>
              <select
                value={selectedTeacherId || allTeachers[0]?.teacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              >
                {allTeachers.map((t) => (
                  <option key={t.teacherId} value={t.teacherId}>
                    {t.name} ({t.designation})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedReport === 'class-routine' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Class:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              >
                {SCHOOL_CLASSES.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(selectedReport === 'provisional-register' ||
            selectedReport === 'substitute-register' ||
            selectedReport === 'merged-register' ||
            selectedReport === 'attendance-register') && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Formal Printable Document Canvas */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-sm print:border-none print:shadow-none print:p-0 text-slate-900 font-serif">
        {/* Formal School Letterhead */}
        <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
          <div className="flex items-center justify-center gap-2 text-slate-900 font-sans font-bold text-xs uppercase tracking-widest">
            <span>Govt. Sponsored H.S. School</span>
            <span>•</span>
            <span>Estd: {SCHOOL_INFO.estd}</span>
            <span>•</span>
            <span>Index: {SCHOOL_INFO.indexNo}</span>
            <span>•</span>
            <span>H.S. Code: {SCHOOL_INFO.hscode}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase mt-1">
            {SCHOOL_INFO.name}
          </h2>
          <p className="text-xs text-slate-600 font-sans mt-0.5">
            {SCHOOL_INFO.address}
          </p>
          <div className="mt-3 py-1 bg-slate-100 border-y border-slate-300 font-sans text-xs font-bold uppercase tracking-wide">
            {selectedReport === 'daily-routine' && `Master School Routine — ${selectedDay}`}
            {selectedReport === 'teacher-routine' &&
              `Teacher's Individual Timetable — ${
                allTeachers.find((t) => t.teacherId === (selectedTeacherId || allTeachers[0]?.teacherId))?.name || ''
              }`}
            {selectedReport === 'class-routine' && `Class Routine Statement — ${selectedClass}`}
            {selectedReport === 'provisional-register' && `Provisional Routine / Daily Class Arrangement — ${selectedDate}`}
            {selectedReport === 'substitute-register' && `Substitute Teacher Duty Register — Date: ${selectedDate}`}
            {selectedReport === 'merged-register' && 'Merged Classes & Sections Statement'}
            {selectedReport === 'attendance-register' && `Staff Attendance Muster Roll — Date: ${selectedDate}`}
            {selectedReport === 'leave-register' && 'Staff Leave Sanction Register'}
            {selectedReport === 'acknowledgement-audit' && 'Official Directives Acknowledgement & Compliance Audit'}
          </div>
        </div>

        {/* 1. Daily Routine Report */}
        {selectedReport === 'daily-routine' && (
          <div className="space-y-4 font-sans text-xs">
            <div className="flex justify-between text-slate-600 text-[11px] mb-2">
              <span>Day: <strong>{selectedDay}</strong></span>
              <span>Academic Session: <strong>{SCHOOL_INFO.academicSession}</strong></span>
            </div>

            <table className="w-full border-collapse border border-slate-400 text-left">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400 font-bold">
                  <th className="border border-slate-400 p-2">Class & Section</th>
                  {[1, 2, 3, 4].map((p) => (
                    <th key={p} className="border border-slate-400 p-2 text-center">Period {p}</th>
                  ))}
                  <th className="border border-slate-400 p-2 text-center bg-slate-200">Tiffin</th>
                  {[5, 6, 7, 8].map((p) => (
                    <th key={p} className="border border-slate-400 p-2 text-center">Period {p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCHOOL_CLASSES.flatMap((cls) =>
                  cls.divisions.map((div) => (
                    <tr key={`${cls.name}-${div}`} className="border-b border-slate-300">
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50">
                        {cls.name} ({div})
                      </td>
                      {[1, 2, 3, 4].map((pNum) => {
                        const entry = permanentRoutines.find(
                          (r) =>
                            r.day === selectedDay &&
                            r.classId === cls.name &&
                            r.sectionOrStream === div &&
                            r.periodNumber === pNum
                        );
                        return (
                          <td key={pNum} className="border border-slate-400 p-1.5 text-center">
                            {entry ? (
                              <div>
                                <span className="font-bold block">{entry.subject}</span>
                                <span className="text-[10px] text-slate-600 block">{entry.teacherName}</span>
                                <span className="text-[9px] text-slate-400 font-mono">{entry.room}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="border border-slate-400 p-1 text-center bg-slate-100 text-[10px] font-bold">
                        Break
                      </td>
                      {[5, 6, 7, 8].map((pNum) => {
                        const entry = permanentRoutines.find(
                          (r) =>
                            r.day === selectedDay &&
                            r.classId === cls.name &&
                            r.sectionOrStream === div &&
                            r.periodNumber === pNum
                        );
                        return (
                          <td key={pNum} className="border border-slate-400 p-1.5 text-center">
                            {entry ? (
                              <div>
                                <span className="font-bold block">{entry.subject}</span>
                                <span className="text-[10px] text-slate-600 block">{entry.teacherName}</span>
                                <span className="text-[9px] text-slate-400 font-mono">{entry.room}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Teacher-wise Routine Report */}
        {selectedReport === 'teacher-routine' && (
          <div className="space-y-4 font-sans text-xs">
            {(() => {
              const teacher = allTeachers.find((t) => t.teacherId === (selectedTeacherId || allTeachers[0]?.teacherId));
              const teacherRoutines = permanentRoutines.filter((r) => r.teacherId === teacher?.teacherId);

              return (
                <div>
                  <div className="p-3 bg-slate-50 border border-slate-300 rounded mb-4 grid grid-cols-3 gap-2">
                    <div><strong>Teacher:</strong> {teacher?.name}</div>
                    <div><strong>Designation:</strong> {teacher?.designation}</div>
                    <div><strong>Code:</strong> {teacher?.employeeCode}</div>
                    <div><strong>Subjects:</strong> {teacher?.subjects.join(', ')}</div>
                    <div><strong>Joining:</strong> {teacher?.dateOfJoining}</div>
                    <div><strong>Total Weekly Classes:</strong> {teacherRoutines.length}</div>
                  </div>

                  <table className="w-full border-collapse border border-slate-400 text-left">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-400 font-bold">
                        <th className="border border-slate-400 p-2">Day</th>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                          <th key={p} className="border border-slate-400 p-2 text-center">Period {p}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                        <tr key={day} className="border-b border-slate-300">
                          <td className="border border-slate-400 p-2 font-bold bg-slate-50">{day}</td>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((pNum) => {
                            const entry = teacherRoutines.find((r) => r.day === day && r.periodNumber === pNum);
                            return (
                              <td key={pNum} className="border border-slate-400 p-1.5 text-center">
                                {entry ? (
                                  <div>
                                    <span className="font-bold block">{entry.classId}</span>
                                    <span className="text-[10px] text-slate-700 block">{entry.subject}</span>
                                    <span className="text-[9px] text-slate-500 font-mono">{entry.room}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* 3. Provisional Routine Register Report */}
        {selectedReport === 'provisional-register' && (
          <div className="space-y-4 font-sans text-xs">
            <div className="flex justify-between text-slate-600 text-[11px] mb-2">
              <span>Date: <strong>{selectedDate}</strong></span>
              <span>Published by Headmaster for daily instruction</span>
            </div>

            <table className="w-full border-collapse border border-slate-400 text-left">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400 font-bold">
                  <th className="border border-slate-400 p-2">Period</th>
                  <th className="border border-slate-400 p-2">Class / Section</th>
                  <th className="border border-slate-400 p-2">Original Teacher</th>
                  <th className="border border-slate-400 p-2">Substitute / Replacement</th>
                  <th className="border border-slate-400 p-2">Arrangement Type</th>
                  <th className="border border-slate-400 p-2">Room</th>
                  <th className="border border-slate-400 p-2">Instructions</th>
                </tr>
              </thead>
              <tbody>
                {provisionalArrangements
                  .filter((p) => p.date === selectedDate)
                  .map((arr) => (
                    <tr key={arr.id} className="border-b border-slate-300">
                      <td className="border border-slate-400 p-2 font-bold text-center">
                        Period {arr.periodNumber}
                      </td>
                      <td className="border border-slate-400 p-2 font-bold">
                        {arr.classId} ({arr.sectionOrStream})
                      </td>
                      <td className="border border-slate-400 p-2 text-slate-600">
                        {arr.originalTeacherName}
                      </td>
                      <td className="border border-slate-400 p-2 font-bold text-slate-900">
                        {arr.replacementTeacherName || 'Class Cancelled / Free'}
                      </td>
                      <td className="border border-slate-400 p-2">{arr.arrangementType}</td>
                      <td className="border border-slate-400 p-2 font-mono">{arr.temporaryRoom || 'Regular'}</td>
                      <td className="border border-slate-400 p-2 italic">{arr.instructions || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Attendance Register Report */}
        {selectedReport === 'attendance-register' && (
          <div className="space-y-4 font-sans text-xs">
            <div className="flex justify-between text-slate-600 text-[11px] mb-2">
              <span>Muster Roll Date: <strong>{selectedDate}</strong></span>
              <span>Academic Year: <strong>{SCHOOL_INFO.academicSession}</strong></span>
            </div>

            <table className="w-full border-collapse border border-slate-400 text-left">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400 font-bold">
                  <th className="border border-slate-400 p-2 w-10">Sl.</th>
                  <th className="border border-slate-400 p-2">Teacher Name</th>
                  <th className="border border-slate-400 p-2">Designation</th>
                  <th className="border border-slate-400 p-2">Employee Code</th>
                  <th className="border border-slate-400 p-2">Status</th>
                  <th className="border border-slate-400 p-2">In Time</th>
                  <th className="border border-slate-400 p-2">Remarks</th>
                  <th className="border border-slate-400 p-2 w-28 text-center">Teacher Signature</th>
                </tr>
              </thead>
              <tbody>
                {allTeachers.map((t, idx) => {
                  const rec = attendance.find((a) => a.date === selectedDate && a.teacherId === t.teacherId);
                  return (
                    <tr key={t.teacherId} className="border-b border-slate-300">
                      <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-400 p-2 font-bold">{t.name}</td>
                      <td className="border border-slate-400 p-2">{t.designation}</td>
                      <td className="border border-slate-400 p-2 font-mono">{t.employeeCode}</td>
                      <td className="border border-slate-400 p-2 font-bold">{rec?.status || 'Present'}</td>
                      <td className="border border-slate-400 p-2 font-mono">{rec?.timeIn || '10:25 AM'}</td>
                      <td className="border border-slate-400 p-2">{rec?.remarks || 'On time'}</td>
                      <td className="border border-slate-400 p-2"></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Directives & Acknowledgment Audit */}
        {selectedReport === 'acknowledgement-audit' && (
          <div className="space-y-4 font-sans text-xs">
            <table className="w-full border-collapse border border-slate-400 text-left">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400 font-bold">
                  <th className="border border-slate-400 p-2">Directive Subject</th>
                  <th className="border border-slate-400 p-2">Category</th>
                  <th className="border border-slate-400 p-2">Date Dispatched</th>
                  <th className="border border-slate-400 p-2">Teacher Name</th>
                  <th className="border border-slate-400 p-2">Acknowledged At</th>
                  <th className="border border-slate-400 p-2">Teacher Note</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => {
                  const msgAcks = acks.filter((a) => a.messageId === m.id);
                  if (msgAcks.length === 0) {
                    return (
                      <tr key={m.id} className="border-b border-slate-300">
                        <td className="border border-slate-400 p-2 font-bold">{m.subject}</td>
                        <td className="border border-slate-400 p-2">{m.category}</td>
                        <td className="border border-slate-400 p-2">{new Date(m.createdAt).toLocaleDateString('en-IN')}</td>
                        <td colSpan={3} className="border border-slate-400 p-2 text-slate-400 italic">
                          No digital acknowledgements recorded yet
                        </td>
                      </tr>
                    );
                  }
                  return msgAcks.map((ack) => (
                    <tr key={ack.id} className="border-b border-slate-300">
                      <td className="border border-slate-400 p-2 font-bold">{m.subject}</td>
                      <td className="border border-slate-400 p-2">{m.category}</td>
                      <td className="border border-slate-400 p-2">{new Date(m.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="border border-slate-400 p-2 font-bold">{ack.teacherName}</td>
                      <td className="border border-slate-400 p-2 font-mono">
                        {new Date(ack.acknowledgedAt!).toLocaleString('en-IN')}
                      </td>
                      <td className="border border-slate-400 p-2">{ack.note || 'Acknowledged'}</td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Formal Institutional Signatures Block */}
        <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 font-sans text-xs text-center">
          <div>
            <div className="h-10 border-b border-dashed border-slate-400"></div>
            <span className="font-bold block mt-1">Prepared by</span>
            <span className="text-[10px] text-slate-500">Academic Committee / Dealing Staff</span>
          </div>

          <div>
            <div className="h-10 border-b border-dashed border-slate-400"></div>
            <span className="font-bold block mt-1">Verified by</span>
            <span className="text-[10px] text-slate-500">Assistant Headmaster (AHM)</span>
          </div>

          <div>
            <div className="h-10 border-b border-dashed border-slate-400"></div>
            <span className="font-bold block mt-1">Authorized Signature</span>
            <span className="text-[10px] text-slate-500 font-bold">
              Headmaster / Secretary, Managing Committee
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
