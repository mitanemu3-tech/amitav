import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SCHOOL_INFO } from '../data/seedData';
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Bell,
  CloudCheck,
  ChevronDown,
  LogOut,
  Sparkles,
  Menu,
} from 'lucide-react';
import { schoolService } from '../services/schoolService';
import { UserRole } from '../types';

interface HeaderProps {
  onToggleMobileNav: () => void;
  onNavigateToMessages: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileNav, onNavigateToMessages }) => {
  const { currentUser, currentTeacher, firebaseUser, signInWithGoogle, signOut, switchActiveRole, allTeachers } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const unreadMessagesCount = schoolService.getMessages().filter((m) => {
    const acks = schoolService.getAcknowledgements().filter((a) => a.messageId === m.id && a.teacherId === currentUser.teacherId);
    return acks.length === 0;
  }).length;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'HM':
        return {
          label: 'Headmaster (Admin)',
          bg: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200',
          dot: 'bg-amber-500',
        };
      case 'AHM':
        return {
          label: 'Asst. Headmaster',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'AT':
      default:
        return {
          label: 'Asst. Teacher',
          bg: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200',
          dot: 'bg-blue-500',
        };
    }
  };

  const badge = getRoleBadge(currentUser.role);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
      {/* Top institution banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white px-3 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-amber-400 text-blue-950 rounded-lg shadow-sm flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-amber-300 uppercase">
                {SCHOOL_INFO.name}
              </h1>
              <p className="text-[11px] sm:text-xs text-blue-100 hidden sm:block">
                {SCHOOL_INFO.subName} • Estd: {SCHOOL_INFO.estd} • Index No: {SCHOOL_INFO.indexNo} • H.S. Code: {SCHOOL_INFO.hscode}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded bg-blue-800/80 text-blue-200 font-medium">
              Session: {SCHOOL_INFO.academicSession}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-800/90 text-emerald-200 font-medium text-[11px]">
              <CloudCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Cloud Firestore Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMobileNav}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Teacher Management Portal
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[170px] sm:max-w-xs">
              {currentTeacher?.name || currentUser.displayName}
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications / Messages button */}
          <button
            onClick={onNavigateToMessages}
            className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Messages & Instructions"
          >
            <Bell className="w-5 h-5" />
            {unreadMessagesCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          {/* Quick role switcher & user menu */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all ${badge.bg}`}
            >
              <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
              <span className="font-semibold">{badge.label}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {showRoleDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRoleDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="pb-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Current Active User
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {currentTeacher?.name || currentUser.displayName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {currentTeacher?.designation || currentUser.role} • Code: {currentTeacher?.employeeCode || 'N/A'}
                    </p>
                    {currentTeacher?.subjects && (
                      <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                        Subjects: {currentTeacher.subjects.join(', ')}
                      </p>
                    )}
                  </div>

                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Quick Switch Role / Staff:
                  </p>

                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1 text-xs">
                    {allTeachers.map((t) => (
                      <button
                        key={t.teacherId}
                        onClick={() => {
                          switchActiveRole(t.role, t.teacherId);
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors ${
                          currentUser.teacherId === t.teacherId
                            ? 'bg-blue-50 text-blue-700 font-bold dark:bg-blue-900/40 dark:text-blue-200'
                            : 'hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold block truncate">{t.name}</span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {t.designation} • {t.subjects.slice(0, 2).join(', ')}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                            t.role === 'HM'
                              ? 'bg-amber-100 text-amber-800'
                              : t.role === 'AHM'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.role}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    {firebaseUser ? (
                      <button
                        onClick={() => {
                          signOut();
                          setShowRoleDropdown(false);
                        }}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out ({firebaseUser.email?.split('@')[0]})
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          signInWithGoogle();
                          setShowRoleDropdown(false);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Sign In with Google
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
