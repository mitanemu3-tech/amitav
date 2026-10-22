import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { schoolService } from '../services/schoolService';
import { DayOfWeek, PermanentRoutineEntry } from '../types';
import { SCHOOL_CLASSES } from '../data/seedData';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Trash2,
  Edit,
  Printer,
  X,
} from 'lucide-react';

export const SchoolRoutine: React.FC = () => {
  const { currentUser } = useAuth();
  const isHM = currentUser.role === 'HM';

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVacantOnly, setShowVacantOnly] = useState(false);

  // Modal for HM to add/edit permanent routine
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PermanentRoutineEntry | null>(null);
  const [formData, setFormData] = useState<{
    day: DayOfWeek;
    periodNumber: number;
    classId: string;
    sectionOrStream: string;
    subject: string;
    teacherId: string;
    room: string;
    remarks: string;
  }>({
    day: 'Monday',
    periodNumber: 1,
    classId: 'Class V',
    sectionOrStream: 'Section A',
    subject: '',
    teacherId: '',
    room: 'Room 101',
    remarks: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const allTeachers = schoolService.getTeachers().filter((t) => t.active);
  const schedule = schoolService.getSchedule();
  const permanentRoutines = schoolService.getPermanentRoutines();

  // Filter routines
  const filteredRoutines = permanentRoutines.filter((r) => {
    if (r.day !== selectedDay) return false;
    if (selectedClass !== 'All' && r.classId !== selectedClass) return false;
    if (selectedTeacher !== 'All' && r.teacherId !== selectedTeacher) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        r.subject.toLowerCase().includes(q) ||
        r.teacherName.toLowerCase().includes(q) ||
        r.classId.toLowerCase().includes(q) ||
        r.sectionOrStream.toLowerCase().includes(q) ||
        r.room.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingEntry(null);
    setFormData({
      day: selectedDay,
      periodNumber: 1,
      classId: 'Class V',
      sectionOrStream: 'Section A',
      subject: '',
      teacherId: allTeachers[0]?.teacherId || '',
      room: 'Room 101',
      remarks: '',
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry: PermanentRoutineEntry) => {
    setEditingEntry(entry);
    setFormData({
      day: entry.day,
      periodNumber: entry.periodNumber,
      classId: entry.classId,
      sectionOrStream: entry.sectionOrStream,
      subject: entry.subject,
      teacherId: entry.teacherId,
      room: entry.room,
      remarks: entry.remarks || '',
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSaveRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.subject.trim()) {
      setErrorMessage('Please enter the subject name.');
      return;
    }
    if (!formData.teacherId) {
      setErrorMessage('Please assign a teacher.');
      return;
    }

    const teacher = allTeachers.find((t) => t.teacherId === formData.teacherId);

    const routineEntry: PermanentRoutineEntry = {
      id: editingEntry ? editingEntry.id : `PR-${Date.now()}`,
      day: formData.day,
      periodNumber: Number(formData.periodNumber),
      classId: formData.classId,
      sectionOrStream: formData.sectionOrStream,
      subject: formData.subject.trim(),
      teacherId: formData.teacherId,
      teacherName: teacher?.name || 'Assigned Teacher',
      room: formData.room.trim() || 'Classroom',
      academicSession: '2026-2027',
      remarks: formData.remarks.trim(),
    };

    try {
      await schoolService.savePermanentRoutine(routineEntry);
      setSuccessMessage('Timetable entry saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving timetable entry due to conflict.');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (confirm('Are you sure you want to remove this timetable entry?')) {
      await schoolService.deletePermanentRoutine(id);
    }
  };

  // Find divisions for selected class in form
  const currentClassDef = SCHOOL_CLASSES.find((c) => c.name === formData.classId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Title & Actions */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-600">
            <CalendarDays className="w-4 h-4" />
            <span>Master Routine Register</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            School Timetable (Permanent Routine)
          </h1>
          <p className="text-xs text-slate-500">
            Nirbhoypur B. G. Nikshaniketan (H.S.) • Academic Session 2026-2027
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isHM && (
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Add Class Assignment
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Timetable
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {successMessage}
        </div>
      )}

      {/* Days Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {days.map((day) => {
          const count = permanentRoutines.filter((r) => r.day === day).length;
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{day}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search subject, teacher, room, class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Class:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
          >
            <option value="All">All Classes (V - XII)</option>
            {SCHOOL_CLASSES.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Teacher Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Teacher:</span>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs max-w-[180px]"
          >
            <option value="All">All Teachers</option>
            {allTeachers.map((t) => (
              <option key={t.teacherId} value={t.teacherId}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        {(selectedClass !== 'All' || selectedTeacher !== 'All' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedClass('All');
              setSelectedTeacher('All');
              setSearchQuery('');
            }}
            className="px-2.5 py-1.5 text-blue-600 hover:text-blue-800 font-bold"
          >
            Reset
          </button>
        )}
      </div>

      {/* Routine Matrix by Class & Period */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">
            {selectedDay} Master Grid ({filteredRoutines.length} Assigned Periods)
          </h2>
          <span className="text-xs text-slate-500">
            Double-booking prevention is enforced automatically
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                <th className="p-2.5 font-bold border-r border-slate-200 dark:border-slate-700 w-36">
                  Class & Section
                </th>
                {[1, 2, 3, 4].map((pNum) => (
                  <th key={pNum} className="p-2.5 font-bold text-center border-r border-slate-200 dark:border-slate-700">
                    Period {pNum}
                  </th>
                ))}
                <th className="p-2.5 font-bold text-center border-r border-slate-200 dark:border-slate-700 bg-amber-50/50 text-amber-900 w-24">
                  Tiffin
                </th>
                {[5, 6, 7, 8].map((pNum) => (
                  <th key={pNum} className="p-2.5 font-bold text-center border-r border-slate-200 dark:border-slate-700">
                    Period {pNum}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {SCHOOL_CLASSES.flatMap((cls) =>
                cls.divisions.map((div) => {
                  if (selectedClass !== 'All' && selectedClass !== cls.name) return null;

                  return (
                    <tr key={`${cls.name}-${div}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="p-2.5 font-bold bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                        <span className="block">{cls.name}</span>
                        <span className="text-[10px] text-blue-600 font-semibold">{div}</span>
                      </td>

                      {/* Periods 1-4 */}
                      {[1, 2, 3, 4].map((pNum) => {
                        const entry = permanentRoutines.find(
                          (r) =>
                            r.day === selectedDay &&
                            r.classId === cls.name &&
                            r.sectionOrStream === div &&
                            r.periodNumber === pNum
                        );

                        return (
                          <td
                            key={pNum}
                            className="p-1.5 border-r border-slate-200 dark:border-slate-700 text-center align-top h-16 min-w-[100px]"
                          >
                            {entry ? (
                              <div className="group relative bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-lg border border-blue-200 dark:border-blue-800 text-[11px] text-left">
                                <span className="font-bold text-blue-900 dark:text-blue-200 block truncate">
                                  {entry.subject}
                                </span>
                                <span className="text-slate-600 dark:text-slate-400 block truncate text-[10px]">
                                  {entry.teacherName}
                                </span>
                                <span className="text-[9px] text-slate-400 block truncate font-mono">
                                  {entry.room}
                                </span>

                                {isHM && (
                                  <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-1 bg-white dark:bg-slate-800 shadow-xs rounded px-1">
                                    <button
                                      onClick={() => handleEditEntry(entry)}
                                      className="p-0.5 text-blue-600 hover:text-blue-800"
                                      title="Edit"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEntry(entry.id)}
                                      className="p-0.5 text-red-600 hover:text-red-800"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-slate-300 dark:text-slate-600 text-[10px]">
                                {isHM ? (
                                  <button
                                    onClick={() => {
                                      setEditingEntry(null);
                                      setFormData({
                                        day: selectedDay,
                                        periodNumber: pNum,
                                        classId: cls.name,
                                        sectionOrStream: div,
                                        subject: '',
                                        teacherId: allTeachers[0]?.teacherId || '',
                                        room: 'Room 101',
                                        remarks: '',
                                      });
                                      setIsModalOpen(true);
                                    }}
                                    className="opacity-0 hover:opacity-100 text-blue-600 font-bold"
                                  >
                                    + Add
                                  </button>
                                ) : (
                                  '—'
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Tiffin Break Column */}
                      <td className="p-1 border-r border-slate-200 dark:border-slate-700 bg-amber-50/40 text-center text-[10px] text-amber-800 font-bold">
                        Break
                      </td>

                      {/* Periods 5-8 */}
                      {[5, 6, 7, 8].map((pNum) => {
                        const entry = permanentRoutines.find(
                          (r) =>
                            r.day === selectedDay &&
                            r.classId === cls.name &&
                            r.sectionOrStream === div &&
                            r.periodNumber === pNum
                        );

                        return (
                          <td
                            key={pNum}
                            className="p-1.5 border-r border-slate-200 dark:border-slate-700 text-center align-top h-16 min-w-[100px]"
                          >
                            {entry ? (
                              <div className="group relative bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-lg border border-blue-200 dark:border-blue-800 text-[11px] text-left">
                                <span className="font-bold text-blue-900 dark:text-blue-200 block truncate">
                                  {entry.subject}
                                </span>
                                <span className="text-slate-600 dark:text-slate-400 block truncate text-[10px]">
                                  {entry.teacherName}
                                </span>
                                <span className="text-[9px] text-slate-400 block truncate font-mono">
                                  {entry.room}
                                </span>

                                {isHM && (
                                  <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-1 bg-white dark:bg-slate-800 shadow-xs rounded px-1">
                                    <button
                                      onClick={() => handleEditEntry(entry)}
                                      className="p-0.5 text-blue-600 hover:text-blue-800"
                                      title="Edit"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEntry(entry.id)}
                                      className="p-0.5 text-red-600 hover:text-red-800"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-slate-300 dark:text-slate-600 text-[10px]">
                                {isHM ? (
                                  <button
                                    onClick={() => {
                                      setEditingEntry(null);
                                      setFormData({
                                        day: selectedDay,
                                        periodNumber: pNum,
                                        classId: cls.name,
                                        sectionOrStream: div,
                                        subject: '',
                                        teacherId: allTeachers[0]?.teacherId || '',
                                        room: 'Room 101',
                                        remarks: '',
                                      });
                                      setIsModalOpen(true);
                                    }}
                                    className="opacity-0 hover:opacity-100 text-blue-600 font-bold"
                                  >
                                    + Add
                                  </button>
                                ) : (
                                  '—'
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HM Add/Edit Timetable Entry Modal with Conflict Detection */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingEntry ? 'Edit Permanent Routine Entry' : 'Assign Master Timetable Period'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveRoutine} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Day of Week
                  </label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value as DayOfWeek })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Period Number
                  </label>
                  <select
                    value={formData.periodNumber}
                    onChange={(e) => setFormData({ ...formData, periodNumber: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={num}>
                        Period {num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Class
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => {
                      const newClass = e.target.value;
                      const def = SCHOOL_CLASSES.find((c) => c.name === newClass);
                      setFormData({
                        ...formData,
                        classId: newClass,
                        sectionOrStream: def?.divisions[0] || 'Section A',
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    {SCHOOL_CLASSES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Section or Stream
                  </label>
                  <select
                    value={formData.sectionOrStream}
                    onChange={(e) => setFormData({ ...formData, sectionOrStream: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    {currentClassDef?.divisions.map((div) => (
                      <option key={div} value={div}>
                        {div}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics, Bengali, Physics"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Classroom / Room No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 101, Physics Lab"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Assign Teacher *
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="">Select Teacher...</option>
                  {allTeachers.map((t) => (
                    <option key={t.teacherId} value={t.teacherId}>
                      {t.name} ({t.subjects.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Remarks / Syllabus Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Laboratory session or practical group"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
