import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  ClockAlert,
  Users,
  UserPlus,
  GitMerge,
  Mail,
  UserCheck,
  FileText,
  Printer,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';
import { schoolService } from '../services/schoolService';

export type NavTab =
  | 'Dashboard'
  | 'My Routine'
  | 'School Routine'
  | 'Provisional Routine'
  | 'Teacher Management'
  | 'Substitution'
  | 'Merged Classes'
  | 'Messages'
  | 'Attendance'
  | 'Leave Management'
  | 'Reports'
  | 'Settings';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { currentUser } = useAuth();
  const isHM = currentUser.role === 'HM';
  const isAHM = currentUser.role === 'AHM';

  // Badges calculation
  const pendingLeavesCount = schoolService.getLeaves().filter((l) => l.status === 'Pending').length;
  const activeProvisionalCount = schoolService
    .getProvisionalArrangements()
    .filter((p) => p.status === 'Published').length;
  const unreadMessagesCount = schoolService.getMessages().filter((m) => {
    const acks = schoolService.getAcknowledgements().filter((a) => a.messageId === m.id && a.teacherId === currentUser.teacherId);
    return acks.length === 0;
  }).length;

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
    allowedRoles: ('HM' | 'AHM' | 'AT')[];
  }[] = [
    {
      id: 'Dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['HM', 'AHM', 'AT'],
    },
    {
      id: 'My Routine',
      label: 'My Routine',
      icon: CalendarCheck,
      allowedRoles: ['HM', 'AHM', 'AT'],
    },
    {
      id: 'School Routine',
      label: 'School Routine',
      icon: CalendarDays,
      allowedRoles: ['HM', 'AHM', 'AT'],
    },
    {
      id: 'Provisional Routine',
      label: 'Provisional Routine',
      icon: ClockAlert,
      badge: activeProvisionalCount,
      badgeColor: 'bg-amber-500 text-white',
      allowedRoles: ['HM', 'AHM', 'AT'],
    },
    {
      id: 'Teacher Management',
      label: 'Teacher Management',
      icon: Users,
      allowedRoles: ['HM'],
    },
    {
      id: 'Substitution',
      label: 'Substitution',
      icon: UserPlus,
      allowedRoles: ['HM', 'AHM'],
    },
    {
      id: 'Merged Classes',
      label: 'Merged Classes',
      icon: GitMerge,
      allowedRoles: ['HM', 'AHM'],
    },
    {
      id: 'Messages',
      label: 'Messages',
      icon: Mail,
      badge: unreadMessagesCount,
      badgeColor: 'bg-rose-500 text-white',
      allowedRoles: ['HM', 'AHM', 'AT'],
    },
    {
      id: 'Attendance',
      label: 'Attendance',
      icon: UserCheck,
      allowedRoles: ['HM', 'AHM', 'AT'],
    },
    {
      id: 'Leave Management',
      label: 'Leave Management',
      icon: FileText,
      badge: isHM ? pendingLeavesCount : undefined,
      badgeColor: 'bg-indigo-600 text-white',
      allowedRoles: ['HM', 'AHM', 'AT'],
    },
    {
      id: 'Reports',
      label: 'Reports',
      icon: Printer,
      allowedRoles: ['HM', 'AHM', 'AT'],
    },
    {
      id: 'Settings',
      label: 'Settings',
      icon: SettingsIcon,
      allowedRoles: ['HM', 'AHM', 'AT'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.allowedRoles.includes(currentUser.role));

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-blue-400 tracking-wider uppercase">
            School System
          </span>
          <h2 className="text-sm font-bold text-white">Menu Navigation</h2>
        </div>
        <button
          onClick={onCloseMobile}
          className="p-1 text-slate-400 hover:text-white lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    item.badgeColor || 'bg-blue-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer role status */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
        <p className="font-semibold text-slate-300">Signed in as:</p>
        <p className="truncate text-blue-300 font-medium">{currentUser.displayName}</p>
        <p className="text-[11px] text-slate-500 capitalize">
          Role: {currentUser.role === 'HM' ? 'Headmaster' : currentUser.role === 'AHM' ? 'Asst. Headmaster' : 'Assistant Teacher'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-800 h-[calc(100vh-85px)] sticky top-[85px]">
        {navContent}
      </aside>

      {/* Mobile drawer backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-50 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-slate-900 shadow-2xl z-50 transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}

      {/* Mobile Bottom Quick Bar for phone ease of use */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-1.5 z-30 flex items-center justify-around lg:hidden text-slate-400">
        <button
          onClick={() => onSelectTab('Dashboard')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] ${
            currentTab === 'Dashboard' ? 'text-blue-400 font-bold' : ''
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('My Routine')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] ${
            currentTab === 'My Routine' ? 'text-blue-400 font-bold' : ''
          }`}
        >
          <CalendarCheck className="w-5 h-5 mb-0.5" />
          My Routine
        </button>
        <button
          onClick={() => onSelectTab('Provisional Routine')}
          className={`relative flex flex-col items-center py-1 px-2 text-[10px] ${
            currentTab === 'Provisional Routine' ? 'text-amber-400 font-bold' : ''
          }`}
        >
          <ClockAlert className="w-5 h-5 mb-0.5" />
          Provisional
          {activeProvisionalCount > 0 && (
            <span className="absolute top-0 right-1 w-3.5 h-3.5 bg-amber-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
              {activeProvisionalCount}
            </span>
          )}
        </button>
        {isHM || isAHM ? (
          <button
            onClick={() => onSelectTab('Substitution')}
            className={`flex flex-col items-center py-1 px-2 text-[10px] ${
              currentTab === 'Substitution' ? 'text-blue-400 font-bold' : ''
            }`}
          >
            <UserPlus className="w-5 h-5 mb-0.5" />
            Substitute
          </button>
        ) : (
          <button
            onClick={() => onSelectTab('Messages')}
            className={`relative flex flex-col items-center py-1 px-2 text-[10px] ${
              currentTab === 'Messages' ? 'text-rose-400 font-bold' : ''
            }`}
          >
            <Mail className="w-5 h-5 mb-0.5" />
            Messages
            {unreadMessagesCount > 0 && (
              <span className="absolute top-0 right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                {unreadMessagesCount}
              </span>
            )}
          </button>
        )}
      </div>
    </>
  );
};
