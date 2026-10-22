import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { schoolService } from '../services/schoolService';
import { LeaveApplication, LeaveType, LeaveStatus, DayOfWeek } from '../types';
import { getTodayDateString, getDayOfWeekFromDate } from '../data/seedData';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
  ClockAlert,
  ArrowRight,
  UserCheck,
  AlertTriangle,
  X,
} from 'lucide-react';

interface LeaveManagementProps {
  onNavigateToSubstitution: () => void;
}

export const LeaveManagement: React.FC<LeaveManagementProps> = ({ onNavigateToSubstitution }) => {
  const { currentUser, currentTeacher } = useAuth();
  const isHM = currentUser.role === 'HM';

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [feedback, setFeedback] = useState('');

  // Apply form state
  const [applyData, setApplyData] = useState<{
    startDate: string;
    endDate: string;
    leaveType: LeaveType;
    reason: string;
  }>({
    startDate: getTodayDateString(),
    endDate: getTodayDateString(),
    leaveType: 'Casual Leave',
    reason: '',
  });

  const leaves = schoolService.getLeaves();
  const permanentRoutines = schoolService.getPermanentRoutines();

  // Filter leaves: HM sees all, Teachers see their own applications
  const visibleLeaves = isHM
    ? leaves
    : leaves.filter((l) => l.teacherId === currentUser.teacherId);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyData.reason.trim()) {
      alert('Please state a reason for leave.');
      return;
    }

    // Calculate affected periods
    const dateObj = new Date(applyData.startDate);
    const dayOfWeek: DayOfWeek = getDayOfWeekFromDate(dateObj);

    const affectedPeriods = permanentRoutines.filter(
      (r) => r.day === dayOfWeek && r.teacherId === currentUser.teacherId
    ).length;

    const newLeave: LeaveApplication = {
      id: `LV-${Date.now()}`,
      teacherId: currentUser.teacherId,
      teacherName: currentTeacher?.name || currentUser.displayName,
      employeeCode: currentTeacher?.employeeCode || 'WB-ED',
      startDate: applyData.startDate,
      endDate: applyData.endDate,
      leaveType: applyData.leaveType,
      reason: applyData.reason.trim(),
      status: 'Pending',
      appliedAt: new Date().toISOString(),
      affectedPeriodsCount: affectedPeriods,
    };

    await schoolService.submitLeaveApplication(newLeave);
    setFeedback('Leave application submitted to Headmaster for review.');
    setTimeout(() => setFeedback(''), 4000);
    setIsApplyModalOpen(false);
    setApplyData({
      startDate: getTodayDateString(),
      endDate: getTodayDateString(),
      leaveType: 'Casual Leave',
      reason: '',
    });
  };

  const handleReview = async (leaveId: string, status: LeaveStatus) => {
    await schoolService.reviewLeaveApplication(
      leaveId,
      status,
      reviewRemarks.trim(),
      `${currentTeacher?.name || currentUser.displayName} (HM)`
    );
    setFeedback(`Leave application marked as ${status}. Decision dispatched to teacher.`);
    setTimeout(() => setFeedback(''), 4000);
    setSelectedLeave(null);
    setReviewRemarks('');
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Clarification Requested':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Pending':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-600">
            <FileText className="w-4 h-4" />
            <span>Leave Applications & Workflow</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Teacher Leave Management
          </h1>
          <p className="text-xs text-slate-500">
            Submit leave requests, review teacher applications, and trigger substitution workflows for affected classes.
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Apply for Leave
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      {/* Leave Applications List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs divide-y divide-slate-100 dark:divide-slate-700">
        <div className="p-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">
            {isHM ? 'All Faculty Leave Applications' : 'My Leave Applications'} ({visibleLeaves.length})
          </h2>
          <span className="text-xs text-slate-500">
            {leaves.filter((l) => l.status === 'Pending').length} pending approval
          </span>
        </div>

        {visibleLeaves.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No leave applications found.</p>
          </div>
        ) : (
          visibleLeaves.map((l) => (
            <div key={l.id} className="p-4 sm:p-5 text-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {l.teacherName}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">({l.employeeCode})</span>
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded">
                    {l.leaveType}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${getStatusBadge(l.status)}`}>
                    {l.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {l.startDate} to {l.endDate}
                  </span>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                <strong className="text-slate-800 dark:text-slate-200">Reason: </strong>
                {l.reason}
              </p>

              {l.reviewRemarks && (
                <div className="text-[11px] p-2 bg-blue-50/60 dark:bg-blue-950/20 rounded-lg text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  <strong>HM Remarks: </strong> {l.reviewRemarks} (by {l.reviewedBy})
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>Applied: {new Date(l.appliedAt).toLocaleString('en-IN')}</span>

                <div className="flex items-center gap-2">
                  {/* If approved, quick action to arrange substitution */}
                  {l.status === 'Approved' && isHM && (
                    <button
                      onClick={onNavigateToSubstitution}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <ClockAlert className="w-3.5 h-3.5" />
                      Arrange Substitutes for this Leave
                    </button>
                  )}

                  {/* HM Review Actions */}
                  {isHM && l.status === 'Pending' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedLeave(l)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer"
                      >
                        Review Application
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* HM Review Application Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-700">
              Review Leave Application: {selectedLeave.teacherName}
            </h3>

            <div className="mt-3 space-y-2 text-xs">
              <p>
                <strong>Type:</strong> {selectedLeave.leaveType}
              </p>
              <p>
                <strong>Duration:</strong> {selectedLeave.startDate} to {selectedLeave.endDate}
              </p>
              <p>
                <strong>Reason:</strong> {selectedLeave.reason}
              </p>

              <div className="pt-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Headmaster Remarks / Instructions:
                </label>
                <textarea
                  rows={2}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="e.g. Sanctioned. Substitution assigned for period 1 and 4."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap justify-end gap-2 text-xs">
              <button
                onClick={() => setSelectedLeave(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(selectedLeave.id, 'Clarification Requested')}
                className="px-3 py-1.5 bg-amber-100 text-amber-800 hover:bg-amber-200 font-bold rounded-lg"
              >
                Request Clarification
              </button>
              <button
                onClick={() => handleReview(selectedLeave.id, 'Rejected')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
              >
                Reject
              </button>
              <button
                onClick={() => handleReview(selectedLeave.id, 'Approved')}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
              >
                Sanction & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Submit Leave Application
              </h3>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Leave Type *
                </label>
                <select
                  value={applyData.leaveType}
                  onChange={(e) => setApplyData({ ...applyData, leaveType: e.target.value as LeaveType })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="Casual Leave">Casual Leave (CL)</option>
                  <option value="Medical Leave">Medical Leave (ML)</option>
                  <option value="Duty Leave">Duty / Deputation Leave (DL)</option>
                  <option value="Maternity Leave">Maternity Leave</option>
                  <option value="Other">Other Extraordinary Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={applyData.startDate}
                    onChange={(e) => setApplyData({ ...applyData, startDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={applyData.endDate}
                    onChange={(e) => setApplyData({ ...applyData, endDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason for Absence *
                </label>
                <textarea
                  rows={3}
                  required
                  value={applyData.reason}
                  onChange={(e) => setApplyData({ ...applyData, reason: e.target.value })}
                  placeholder="State the ground for leave application..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Submit to Headmaster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
