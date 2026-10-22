import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { schoolService } from '../services/schoolService';
import { Teacher, TeacherStatus, UserRole } from '../types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit,
  UserX,
  UserCheck,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  X,
  GraduationCap,
} from 'lucide-react';

export const TeacherManagement: React.FC = () => {
  const { currentUser, currentTeacher } = useAuth();
  const isHM = currentUser.role === 'HM';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [statusMessage, setStatusMessage] = useState('');
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState<{
    teacherId: string;
    name: string;
    designation: string;
    employeeCode: string;
    mobile: string;
    email: string;
    subjects: string;
    eligibleClasses: string;
    dateOfJoining: string;
    status: TeacherStatus;
    role: UserRole;
    active: boolean;
  }>({
    teacherId: '',
    name: '',
    designation: 'Assistant Teacher',
    employeeCode: '',
    mobile: '',
    email: '',
    subjects: '',
    eligibleClasses: 'Class V, Class VI, Class VII, Class VIII, Class IX, Class X',
    dateOfJoining: '2022-01-01',
    status: 'Active',
    role: 'AT',
    active: true,
  });

  const teachers = schoolService.getTeachers();

  const filteredTeachers = teachers.filter((t) => {
    if (filterRole !== 'All' && t.role !== filterRole) return false;
    if (filterStatus !== 'All' && t.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        t.name.toLowerCase().includes(q) ||
        t.employeeCode.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.subjects.some((s) => s.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingTeacher(null);
    const nextId = `T-${String(teachers.length + 1).padStart(3, '0')}`;
    setFormData({
      teacherId: nextId,
      name: '',
      designation: 'Assistant Teacher',
      employeeCode: `WB-ED-2026-${String(teachers.length + 100)}`,
      mobile: '',
      email: '',
      subjects: 'Bengali, English',
      eligibleClasses: 'Class V, Class VI, Class VII, Class VIII, Class IX, Class X',
      dateOfJoining: new Date().toISOString().split('T')[0],
      status: 'Active',
      role: 'AT',
      active: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: Teacher) => {
    setEditingTeacher(t);
    setFormData({
      teacherId: t.teacherId,
      name: t.name,
      designation: t.designation,
      employeeCode: t.employeeCode,
      mobile: t.mobile,
      email: t.email,
      subjects: t.subjects.join(', '),
      eligibleClasses: t.eligibleClasses.join(', '),
      dateOfJoining: t.dateOfJoining,
      status: t.status,
      role: t.role,
      active: t.active,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Please enter teacher name.');
      return;
    }
    if (!formData.employeeCode.trim()) {
      setFormError('Please enter employee code.');
      return;
    }

    const teacherObj: Teacher = {
      id: formData.teacherId,
      teacherId: formData.teacherId,
      name: formData.name.trim(),
      designation: formData.designation.trim(),
      employeeCode: formData.employeeCode.trim(),
      mobile: formData.mobile.trim(),
      email: formData.email.trim(),
      subjects: formData.subjects.split(',').map((s) => s.trim()).filter(Boolean),
      eligibleClasses: formData.eligibleClasses.split(',').map((s) => s.trim()).filter(Boolean),
      dateOfJoining: formData.dateOfJoining,
      status: formData.status,
      role: formData.role,
      active: formData.active,
      avatarColor: editingTeacher?.avatarColor || 'bg-indigo-600',
    };

    await schoolService.saveTeacher(teacherObj);
    setStatusMessage(`Teacher record for ${teacherObj.name} saved successfully.`);
    setTimeout(() => setStatusMessage(''), 3000);
    setIsModalOpen(false);
  };

  const handleToggleActive = async (t: Teacher) => {
    const action = t.active ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} ${t.name}? Historical timetable and attendance records will be preserved.`)) {
      if (t.active) {
        await schoolService.deactivateTeacher(t.teacherId, `${currentTeacher?.name || currentUser.displayName} (HM)`);
        setStatusMessage(`Teacher ${t.name} has been safely deactivated.`);
      } else {
        await schoolService.saveTeacher({
          ...t,
          active: true,
          status: 'Active',
        });
        setStatusMessage(`Teacher ${t.name} has been restored to Active status.`);
      }
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-600">
            <Users className="w-4 h-4" />
            <span>Faculty Master Database</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Teacher Master Management
          </h1>
          <p className="text-xs text-slate-500">
            Manage teacher profiles, designations, subject specializations, and portal access permissions.
          </p>
        </div>

        {isHM && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            + Add New Teacher
          </button>
        )}
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, employee code, subject, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Role:</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
          >
            <option value="All">All Roles</option>
            <option value="HM">Headmaster (HM)</option>
            <option value="AHM">Asst. Headmaster (AHM)</option>
            <option value="AT">Assistant Teacher (AT)</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Teachers Grid / Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 font-bold">Teacher Profile</th>
                <th className="p-3 font-bold">Code & Designation</th>
                <th className="p-3 font-bold">Subjects Taught</th>
                <th className="p-3 font-bold">Contact Info</th>
                <th className="p-3 font-bold text-center">Role</th>
                <th className="p-3 font-bold text-center">Status</th>
                <th className="p-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTeachers.map((t) => (
                <tr
                  key={t.teacherId}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                    !t.active ? 'opacity-60 bg-slate-50/50' : ''
                  }`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full ${
                          t.avatarColor || 'bg-blue-600'
                        } text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs`}
                      >
                        {t.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(-2)
                          .join('')}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block text-sm">
                          {t.name}
                        </span>
                        <span className="text-[10px] text-slate-400">ID: {t.teacherId}</span>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {t.designation}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{t.employeeCode}</span>
                  </td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {t.subjects.map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="p-3 text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{t.mobile}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[140px]">{t.email}</span>
                    </div>
                  </td>

                  <td className="p-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.role === 'HM'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : t.role === 'AHM'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {t.role}
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.active && t.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'On Leave'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedTeacher(t);
                          setIsDetailModalOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {isHM && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(t)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(t)}
                            className={`p-1.5 rounded cursor-pointer ${
                              t.active
                                ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                                : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                            }`}
                            title={t.active ? 'Safe Deactivate' : 'Restore Active'}
                          >
                            {t.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Teacher Dossier
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div
                  className={`w-12 h-12 rounded-full ${
                    selectedTeacher.avatarColor || 'bg-blue-600'
                  } text-white font-bold flex items-center justify-center text-sm`}
                >
                  {selectedTeacher.name.slice(0, 2)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedTeacher.name}
                  </h4>
                  <p className="text-slate-500">
                    {selectedTeacher.designation} • Code: {selectedTeacher.employeeCode}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="font-bold text-slate-400 block text-[10px] uppercase">Teacher ID</span>
                  <span>{selectedTeacher.teacherId}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block text-[10px] uppercase">Portal Role</span>
                  <span className="font-bold text-blue-600">{selectedTeacher.role}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block text-[10px] uppercase">Date of Joining</span>
                  <span>{selectedTeacher.dateOfJoining}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block text-[10px] uppercase">Status</span>
                  <span>{selectedTeacher.status}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block text-[10px] uppercase">Phone</span>
                  <span>{selectedTeacher.mobile}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block text-[10px] uppercase">Email</span>
                  <span className="truncate block">{selectedTeacher.email}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="font-bold text-slate-400 block text-[10px] uppercase mb-1">
                  Subjects Taught
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedTeacher.subjects.join(', ')}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-400 block text-[10px] uppercase mb-1">
                  Eligible Classes
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  {selectedTeacher.eligibleClasses.join(', ')}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingTeacher ? `Edit ${editingTeacher.name}` : 'Register New Teacher'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTeacher} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sri Sourav Sen"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Designation *
                  </label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="Headmaster">Headmaster</option>
                    <option value="Assistant Headmaster">Assistant Headmaster</option>
                    <option value="Assistant Teacher">Assistant Teacher</option>
                    <option value="Para Teacher">Para Teacher</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Employee Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    placeholder="e.g. WB-ED-2022-099"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Portal Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                  >
                    <option value="AT">Assistant Teacher (AT)</option>
                    <option value="AHM">Assistant Headmaster (AHM)</option>
                    <option value="HM">Headmaster (HM - Full Admin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="e.g. 9830112233"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. teacher@school.edu"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Subjects Taught (comma separated) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                  placeholder="e.g. Mathematics, Statistics, Computer Application"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Eligible Classes (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.eligibleClasses}
                  onChange={(e) => setFormData({ ...formData, eligibleClasses: e.target.value })}
                  placeholder="e.g. Class IX, Class X, Class XI, Class XII"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Date of Joining
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfJoining}
                    onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TeacherStatus })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Teacher Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
