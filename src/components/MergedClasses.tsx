import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { schoolService } from '../services/schoolService';
import { MergedClass } from '../types';
import { SCHOOL_CLASSES, getTodayDateString } from '../data/seedData';
import {
  GitMerge,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Users,
  MapPin,
  Clock,
  Printer,
  X,
} from 'lucide-react';

export const MergedClasses: React.FC = () => {
  const { currentUser, currentTeacher } = useAuth();
  const isAuthorized = currentUser.role === 'HM' || currentUser.role === 'AHM';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [feedback, setFeedback] = useState('');

  const allTeachers = schoolService.getTeachers().filter((t) => t.active);
  const mergedClasses = schoolService.getMergedClasses();

  // Form state
  const [formData, setFormData] = useState<{
    periodNumber: number;
    classesAndSections: string[];
    subject: string;
    teacherId: string;
    classroom: string;
    reason: string;
    instructions: string;
  }>({
    periodNumber: 4,
    classesAndSections: ['Class V - Section A', 'Class V - Section B'],
    subject: 'Physical Education / Combined Drill',
    teacherId: allTeachers[0]?.teacherId || '',
    classroom: 'Main Playground / Pavilion',
    reason: 'Combined sports drill and physical fitness assessment.',
    instructions: 'Both sections must report at southern pavilion promptly.',
  });

  const availableSections = SCHOOL_CLASSES.flatMap((c) =>
    c.divisions.map((d) => `${c.name} - ${d}`)
  );

  const handleToggleSection = (sectionName: string) => {
    setFormData((prev) => {
      const exists = prev.classesAndSections.includes(sectionName);
      if (exists) {
        return {
          ...prev,
          classesAndSections: prev.classesAndSections.filter((s) => s !== sectionName),
        };
      } else {
        return {
          ...prev,
          classesAndSections: [...prev.classesAndSections, sectionName],
        };
      }
    });
  };

  const handleSaveMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.classesAndSections.length < 2) {
      alert('Please select at least 2 classes or sections to merge.');
      return;
    }
    if (!formData.teacherId) {
      alert('Please assign a teacher to supervise the merged class.');
      return;
    }

    const assignedTeacher = allTeachers.find((t) => t.teacherId === formData.teacherId);

    const merged: MergedClass = {
      id: `MC-${Date.now()}`,
      date: selectedDate,
      periodNumber: Number(formData.periodNumber),
      classesAndSections: formData.classesAndSections,
      subject: formData.subject.trim(),
      teacherId: formData.teacherId,
      teacherName: assignedTeacher?.name || 'Assigned Teacher',
      classroom: formData.classroom.trim() || 'Auditorium / Ground',
      reason: formData.reason.trim(),
      instructions: formData.instructions.trim(),
      status: 'Scheduled',
      createdBy: `${currentTeacher?.name || currentUser.displayName} (${currentUser.role})`,
      createdAt: new Date().toISOString(),
    };

    await schoolService.saveMergedClass(merged);
    setFeedback(`Successfully created merged class: ${merged.classesAndSections.join(' & ')}!`);
    setTimeout(() => setFeedback(''), 4000);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-purple-700/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-200">
            <GitMerge className="w-4 h-4" />
            <span>Classroom Coordination</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1 text-white">
            Merged Class Management
          </h1>
          <p className="text-purple-100 text-xs mt-1 max-w-2xl">
            Temporarily merge two sections (such as Class V-A and V-B) for joint teaching, physical training, workshops, or during staff shortage. Normal schedules restore automatically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAuthorized && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Schedule Class Merge
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-purple-950 hover:bg-purple-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Register
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      {/* Merged Classes List */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-purple-600" />
            Scheduled Merged Classes ({mergedClasses.length})
          </h2>
          <span className="text-xs text-slate-500">Authorized by Headmaster</span>
        </div>

        {mergedClasses.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <GitMerge className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">
              No merged classes scheduled.
            </p>
            <p className="mt-1">All sections currently hold separate classes according to the master routine.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mergedClasses.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 text-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-purple-200/70 dark:border-purple-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold bg-purple-800 text-white px-2 py-0.5 rounded text-[11px]">
                      Period {item.periodNumber}
                    </span>
                    <span className="font-bold text-purple-950 dark:text-purple-200 text-sm">
                      {item.classesAndSections.join(' ⨁ ')}
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                      {item.status}
                    </span>
                  </div>

                  <span className="text-slate-500 font-medium">
                    Date: <strong>{item.date}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Subject / Combined Activity
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{item.subject}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Assigned Lead Teacher
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{item.teacherName}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Combined Venue / Classroom
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{item.classroom}</p>
                  </div>
                </div>

                <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-purple-200 dark:border-purple-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Reason: </span>
                  <span className="text-slate-600 dark:text-slate-400">{item.reason}</span>
                  {item.instructions && (
                    <p className="mt-1 text-slate-600 dark:text-slate-400 italic">
                      Instructions: "{item.instructions}"
                    </p>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Authorized by: {item.createdBy}</span>
                  <span>Created: {new Date(item.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Merge Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-purple-600" />
                Schedule Temporary Class Merge
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMerge} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Period Number *
                  </label>
                  <select
                    value={formData.periodNumber}
                    onChange={(e) => setFormData({ ...formData, periodNumber: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        Period {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sections to merge checklist */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Select Classes / Sections to Merge (Minimum 2) *
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto grid grid-cols-2 gap-2">
                  {availableSections.map((sec) => {
                    const isChecked = formData.classesAndSections.includes(sec);
                    return (
                      <label
                        key={sec}
                        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                          isChecked ? 'bg-purple-100 text-purple-900 font-bold' : 'hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSection(sec)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-[11px] truncate">{sec}</span>
                      </label>
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Selected: {formData.classesAndSections.join(', ') || 'None'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Subject / Combined Activity *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Physical Training, Common Workshop"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Combined Classroom / Venue *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.classroom}
                    onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                    placeholder="e.g. Auditorium, Ground, Hall 1"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Assign Lead Teacher *
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
                  Reason for Merging *
                </label>
                <input
                  type="text"
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g. Subject teacher absent; combined athletics practice"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Instructions for Students & Teachers
                </label>
                <textarea
                  rows={2}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="e.g. Both sections assemble together at 12:50 PM."
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
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Authorize & Publish Merge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
