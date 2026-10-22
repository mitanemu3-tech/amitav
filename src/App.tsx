/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { MyRoutine } from './components/MyRoutine';
import { SchoolRoutine } from './components/SchoolRoutine';
import { ProvisionalRoutine } from './components/ProvisionalRoutine';
import { TeacherManagement } from './components/TeacherManagement';
import { Substitution } from './components/Substitution';
import { MergedClasses } from './components/MergedClasses';
import { Messages } from './components/Messages';
import { Attendance } from './components/Attendance';
import { LeaveManagement } from './components/LeaveManagement';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { testConnection } from './firebase/config';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<NavTab>('Dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    // Test connection to Firestore on boot
    testConnection()
      .then((connected) => {
        console.log('Firebase connection status:', connected ? 'Cloud Connected' : 'Resilient Cache Active');
      })
      .catch((err) => {
        console.info('Firestore initial connection warming up in cache mode:', err?.message || err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Header
        onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        onNavigateToMessages={() => setCurrentTab('Messages')}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Navigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        <main className="flex-1 p-3 sm:p-6 overflow-y-auto">
          {currentTab === 'Dashboard' && <Dashboard onNavigate={setCurrentTab} />}
          {currentTab === 'My Routine' && <MyRoutine />}
          {currentTab === 'School Routine' && <SchoolRoutine />}
          {currentTab === 'Provisional Routine' && <ProvisionalRoutine />}
          {currentTab === 'Teacher Management' && <TeacherManagement />}
          {currentTab === 'Substitution' && <Substitution />}
          {currentTab === 'Merged Classes' && <MergedClasses />}
          {currentTab === 'Messages' && <Messages />}
          {currentTab === 'Attendance' && <Attendance />}
          {currentTab === 'Leave Management' && (
            <LeaveManagement onNavigateToSubstitution={() => setCurrentTab('Substitution')} />
          )}
          {currentTab === 'Reports' && <Reports />}
          {currentTab === 'Settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
