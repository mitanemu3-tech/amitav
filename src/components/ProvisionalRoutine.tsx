import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { schoolService } from '../services/schoolService';
import {
  ProvisionalArrangement,
  ArrangementType,
  ArrangementStatus,
  DayOfWeek,
} from '../types';
import { SCHOOL_CLASSES, getTodayDateString, getDayOfWeekFromDate } from '../data/seedData';
import {
  ClockAlert,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Filter,
  UserCheck,
  Send,
  Printer,
  X,
  History,
  Eye,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const ProvisionalRoutine: React.FC = () => {
  const { currentUser, currentTeacher } = useAuth();
  const isHM = currentUser.role === 'HM';
  const isAHM = currentUser.role === 'AHM';
  const canPublish = isHM || isAHM;

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterClass, setFilterClass] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArrangement, setEditingArrangement] = useState<ProvisionalArrangement | null>(null);

  const allTeachers = schoolService.getTeachers().filter((t) => t.active);
  const permanentRoutines = schoolService.getPermanentRoutines();
  const schedule = schoolService.getSchedule();

  const arrangementTypes: ArrangementType[] = [
    'Substitute teacher',
    'Temporary merging of classes',
    'Period shifted to another time',
    'Room changed',
    'Class cancelled',
    'Joint teaching',
    'Special class',
    'Free period',
    'Other',
  ];

  const [formData, setFormData] = useState<{
    periodNumber: number;
    classId: string;
    sectionOrStream: string;
    originalTeacherId: string;
    replacementTeacherId: string;
    temporaryRoom: string;
    arrangementType: ArrangementType;
    instructions: string;
    reason: string;
    status: ArrangementStatus;
  }>({
    periodNumber: 1,
    classId: 'Class V',
    sectionOrStream: 'Section A',
    originalTeacherId: '',
    replacementTeacherId: '',
    temporaryRoom: 'Room 101',
    arrangementType: 'Substitute teacher',
    instructions: '',
    reason: 'Teacher absent on medical leave',
    status: 'Published',
  });

  const [formError, setFormError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const arrangements = schoolService.getProvisionalArrangements();

  // Filter arrangements for selected date
  const filteredArrangements = arrangements.filter((p) => {
    if (p.date !== selectedDate) return false;
    if (filterStatus !== 'All' && p.status !== filterStatus) return false;
    if (filterClass !== 'All' && p.classId !== filterClass) return false;
    return true;
  });

  // Calculate day of week from selected date
  const dateObj = new Date(selectedDate);
  const dayOfWeek: DayOfWeek = getDayOfWeekFromDate(dateObj);

  // Open modal with default pre-fill
  const handleOpenCreateModal = (periodNum = 1, classId = 'Class V', section = 'Section A') => {
    // Try to find the original teacher from permanent routine for this day & period
    const regular = permanentRoutines.find(
      (r) => r.day === dayOfWeek && r.periodNumber === periodNum && r.classId === classId && r.sectionOrStream === section
    );

    setEditingArrangement(null);
    setFormData({
      periodNumber: periodNum,
      classId,
      sectionOrStream: section,
      originalTeacherId: regular?.teacherId || allTeachers[0]?.teacherId || '',
      replacementTeacherId: '',
      temporaryRoom: regular?.room || 'Room 101',
      arrangementType: 'Substitute teacher',
      instructions: '',
      reason: 'Teacher unavailable on leave.',
      status: 'Published',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEditArrangement = (arr: ProvisionalArrangement) => {
    setEditingArrangement(arr);
    setFormData({
      periodNumber: arr.periodNumber,
      classId: arr.classId,
      sectionOrStream: arr.sectionOrStream,
      originalTeacherId: arr.originalTeacherId,
      replacementTeacherId: arr.replacementTeacherId || '',
      temporaryRoom: arr.temporaryRoom || '',
      arrangementType: arr.arrangementType,
      instructions: arr.instructions || '',
      reason: arr.reason || '',
      status: arr.status,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveArrangement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.originalTeacherId) {
      setFormError('Please specify the original teacher.');
      return;
    }

    if (
      (formData.arrangementType === 'Substitute teacher' || formData.arrangementType === 'Joint teaching') &&
      !formData.replacementTeacherId
    ) {
      setFormError('Please select a replacement/substitute teacher.');
      return;
    }

    const origTeacher = allTeachers.find((t) => t.teacherId === formData.originalTeacherId);
    const replTeacher = allTeachers.find((t) => t.teacherId === formData.replacementTeacherId);

    const affectedTeachers: string[] = [formData.originalTeacherId];
    if (formData.replacementTeacherId && formData.replacementTeacherId !== formData.originalTeacherId) {
      affectedTeachers.push(formData.replacementTeacherId);
    }

    const newArrangement: ProvisionalArrangement = {
      id: editingArrangement ? editingArrangement.id : `PA-${Date.now()}`,
      date: selectedDate,
      periodNumber: Number(formData.periodNumber),
      classId: formData.classId,
      sectionOrStream: formData.sectionOrStream,
      originalTeacherId: formData.originalTeacherId,
      originalTeacherName: origTeacher?.name || 'Assigned Teacher',
      replacementTeacherId: formData.replacementTeacherId || undefined,
      replacementTeacherName: replTeacher?.name || undefined,
      temporaryRoom: formData.temporaryRoom.trim() || undefined,
      arrangementType: formData.arrangementType,
      instructions: formData.instructions.trim(),
      reason: formData.reason.trim(),
      status: formData.status,
      createdBy: currentUser.teacherId,
      createdByName: `${currentTeacher?.name || currentUser.displayName} (${currentUser.role})`,
      createdAt: editingArrangement ? editingArrangement.createdAt : new Date().toISOString(),
      publishedAt: formData.status === 'Published' ? new Date().toISOString() : undefined,
      affectedTeacherIds: affectedTeachers,
      affectedClassIds: [`${formData.classId} - ${formData.sectionOrStream}`],
    };

    try {
      await schoolService.saveProvisionalArrangement(newArrangement);
      setFeedbackMessage(
        formData.status === 'Published'
          ? 'Provisional routine published! Live alert dispatched to affected teachers.'
          : 'Provisional draft saved successfully.'
      );
      setTimeout(() => setFeedbackMessage(''), 4000);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error saving provisional arrangement.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: ArrangementStatus) => {
    await schoolService.updateArrangementStatus(
      id,
      newStatus,
      `${currentTeacher?.name || currentUser.displayName} (${currentUser.role})`
    );
    setFeedbackMessage(`Arrangement marked as ${newStatus}.`);
    setTimeout(() => setFeedbackMessage(''), 3000);
  };

  const getStatusBadge = (status: ArrangementStatus) => {
    switch (status) {
      case 'Published':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Draft':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'Updated':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300 line-through';
      case 'Completed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  const currentClassDef = SCHOOL_CLASSES.find((c) => c.name === formData.classId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-200">
            <ClockAlert className="w-4 h-4" />
            <span>Priority Administrative Module</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1 text-white">
            Provisional Routine / Temporary Class Arrangements
          </h1>
          <p className="text-amber-100 text-xs mt-1 max-w-2xl">
            Authorize daily timetable substitutions, room changes, and merged classes without altering the permanent school routine. Changes sync instantaneously across all teacher dashboards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canPublish && (
            <button
              onClick={() => handleOpenCreateModal()}
              className="px-4 py-2 bg-white hover:bg-amber-50 text-amber-900 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + New Arrangement
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-amber-950/80 hover:bg-amber-950 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Daily Sheet
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedbackMessage}
        </div>
      )}

      {/* Date & Filter Control Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Arrangement Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-blue-600 focus:outline-hidden cursor-pointer"
            />
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase">
              {dayOfWeek}
            </span>
          </div>

          {/* Quick Date Buttons */}
          <button
            onClick={() => setSelectedDate(getTodayDateString())}
            className={`px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer ${
              selectedDate === getTodayDateString()
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
            }`}
          >
            Today
          </button>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Class:</span>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="All">All Classes</option>
              {SCHOOL_CLASSES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-slate-500 font-medium">
          Showing <strong>{filteredArrangements.length}</strong> temporary adjustments for {selectedDate}
        </span>
      </div>

      {/* Main Two-Column View: Published Arrangements List + Permanent Routine Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Provisional Arrangements */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <ClockAlert className="w-5 h-5 text-amber-600" />
                Active Provisional Register ({selectedDate})
              </h2>
              <span className="text-xs text-slate-500">
                Official Headmaster Directives
              </span>
            </div>

            {filteredArrangements.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <ClockAlert className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  No provisional arrangements registered for this date.
                </p>
                <p className="mt-1">Classes follow the regular permanent routine as normal.</p>
                {canPublish && (
                  <button
                    onClick={() => handleOpenCreateModal()}
                    className="mt-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Temporary Arrangement
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredArrangements.map((arr) => {
                  const isAffectingCurrentUser =
                    arr.replacementTeacherId === currentUser.teacherId ||
                    arr.originalTeacherId === currentUser.teacherId;

                  return (
                    <div
                      key={arr.id}
                      className={`p-4 rounded-xl border transition-all ${
                        arr.status === 'Cancelled'
                          ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 opacity-60'
                          : isAffectingCurrentUser
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 ring-2 ring-amber-300/60'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {/* Top status bar */}
                      <div className="flex items-center justify-between gap-2 flex-wrap text-xs pb-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="font-black bg-slate-900 text-white px-2 py-0.5 rounded text-[11px]">
                            Period {arr.periodNumber}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {arr.classId} ({arr.sectionOrStream})
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                              arr.status
                            )}`}
                          >
                            {arr.status}
                          </span>
                          {isAffectingCurrentUser && (
                            <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase animate-pulse">
                              Affects You
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          {arr.arrangementType}
                        </span>
                      </div>

                      {/* Main comparison details */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200/60 dark:border-slate-700">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Permanent Assignment
                          </span>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            Teacher: <span className="line-through text-slate-500">{arr.originalTeacherName}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Reason: <strong className="text-slate-700 dark:text-slate-300">{arr.reason}</strong>
                          </p>
                        </div>

                        <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1">
                            Provisional Arrangement
                          </span>
                          <p className="font-bold text-emerald-900 dark:text-emerald-300">
                            Replacement: {arr.replacementTeacherName || 'Class Cancelled / Free'}
                          </p>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            Room: <strong>{arr.temporaryRoom || 'Assigned Regular Room'}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Instructions */}
                      {arr.instructions && (
                        <div className="mt-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                          <span className="font-bold text-slate-700 dark:text-slate-300">HM Instructions: </span>
                          <span className="text-slate-600 dark:text-slate-400 italic">"{arr.instructions}"</span>
                        </div>
                      )}

                      {/* Footer & Actions */}
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span>
                          Authorized by: <strong className="text-slate-600 dark:text-slate-300">{arr.createdByName}</strong>
                        </span>

                        {canPublish && (
                          <div className="flex items-center gap-1.5">
                            {arr.status === 'Draft' && (
                              <button
                                onClick={() => handleStatusChange(arr.id, 'Published')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer"
                              >
                                Publish Now
                              </button>
                            )}
                            {arr.status === 'Published' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(arr.id, 'Completed')}
                                  className="px-2 py-0.5 bg-purple-100 text-purple-800 hover:bg-purple-200 rounded font-semibold cursor-pointer"
                                >
                                  Mark Completed
                                </button>
                                <button
                                  onClick={() => handleStatusChange(arr.id, 'Cancelled')}
                                  className="px-2 py-0.5 bg-red-100 text-red-800 hover:bg-red-200 rounded font-semibold cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleEditArrangement(arr)}
                              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded font-semibold cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Side-by-side Permanent Routine Reference for Day */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Permanent Routine Reference ({dayOfWeek})
              </h3>
              <span className="text-[10px] text-blue-600 font-bold uppercase">Master</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Click any class assignment to instantly create a provisional adjustment:
            </p>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 text-xs">
              {permanentRoutines
                .filter((r) => r.day === dayOfWeek)
                .map((r) => {
                  // Check if this slot already has a provisional arrangement today
                  const prov = filteredArrangements.find(
                    (p) =>
                      p.periodNumber === r.periodNumber &&
                      p.classId === r.classId &&
                      p.sectionOrStream === r.sectionOrStream &&
                      p.status === 'Published'
                  );

                  return (
                    <div
                      key={r.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${
                        prov
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold bg-slate-200 dark:bg-slate-600 px-1.5 py-0.2 rounded text-[10px]">
                            P-{r.periodNumber}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {r.classId} ({r.sectionOrStream})
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                          {r.subject} • <span className="font-medium">{r.teacherName}</span>
                        </p>
                      </div>

                      {prov ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded">
                          Provisional Active
                        </span>
                      ) : canPublish ? (
                        <button
                          onClick={() => handleOpenCreateModal(r.periodNumber, r.classId, r.sectionOrStream)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] cursor-pointer"
                        >
                          + Adjust
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Regular</span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* HM / AHM Create / Edit Provisional Arrangement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingArrangement ? 'Update Provisional Arrangement' : 'Create Provisional Class Arrangement'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveArrangement} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Period Number *
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

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Arrangement Type *
                  </label>
                  <select
                    value={formData.arrangementType}
                    onChange={(e) => setFormData({ ...formData, arrangementType: e.target.value as ArrangementType })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-amber-900 dark:text-amber-300"
                  >
                    {arrangementTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Class *
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
                    Section / Stream *
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

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Original Teacher (Being Replaced / Adjusted) *
                </label>
                <select
                  value={formData.originalTeacherId}
                  onChange={(e) => setFormData({ ...formData, originalTeacherId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="">Select Original Teacher...</option>
                  {allTeachers.map((t) => (
                    <option key={t.teacherId} value={t.teacherId}>
                      {t.name} ({t.subjects.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Replacement / Substitute Teacher (Optional if cancelled or free)
                </label>
                <select
                  value={formData.replacementTeacherId}
                  onChange={(e) => setFormData({ ...formData, replacementTeacherId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-blue-700 dark:text-blue-300"
                >
                  <option value="">None / Class Cancelled or Joint</option>
                  {allTeachers.map((t) => (
                    <option key={t.teacherId} value={t.teacherId}>
                      {t.name} ({t.subjects.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Temporary Room No.
                  </label>
                  <input
                    type="text"
                    value={formData.temporaryRoom}
                    onChange={(e) => setFormData({ ...formData, temporaryRoom: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    placeholder="e.g. Room 102, Ground"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Publication Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ArrangementStatus })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                  >
                    <option value="Published">Published (Live to Teachers)</option>
                    <option value="Draft">Draft (Internal Only)</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason for Temporary Arrangement *
                </label>
                <input
                  type="text"
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  placeholder="e.g. Teacher on Approved Casual Leave, Special Examination Duty"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Specific Instructions / Work for Students *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  placeholder="e.g. Conduct English reading exercise from Chapter 4 and supervise notebook correction."
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save & Publish Arrangement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
