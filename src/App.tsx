import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar } from './components/common/Sidebar.tsx';
import { Header } from './components/common/Header.tsx';
import { CertificateVerifyModal } from './components/common/CertificateVerifyModal.tsx';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { StudentManagement } from './pages/admin/StudentManagement.tsx';
import { FacultyManagement } from './pages/admin/FacultyManagement.tsx';
import { DepartmentCourseManagement } from './pages/admin/DepartmentCourseManagement.tsx';
import { ClassTimetableManagement } from './pages/admin/ClassTimetableManagement.tsx';
import { ExaminationManagement } from './pages/admin/ExaminationManagement.tsx';
import { NoticeEventManagement } from './pages/admin/NoticeEventManagement.tsx';
import { PlacementAdmin } from './pages/admin/PlacementAdmin.tsx';
import { AuditLogsView } from './pages/admin/AuditLogsView.tsx';
import { SystemSettingsView } from './pages/admin/SystemSettingsView.tsx';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard.tsx';
import { FacultyAttendance } from './pages/faculty/FacultyAttendance.tsx';
import { FacultyAssignments } from './pages/faculty/FacultyAssignments.tsx';
import { FacultyStudyMaterials } from './pages/faculty/FacultyStudyMaterials.tsx';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard.tsx';
import { StudentAttendanceView } from './pages/student/StudentAttendanceView.tsx';
import { StudentAssignmentsView } from './pages/student/StudentAssignmentsView.tsx';
import { StudentResultsView } from './pages/student/StudentResultsView.tsx';
import { StudentPlacementsView } from './pages/student/StudentPlacementsView.tsx';
import { StudentCertificatesView } from './pages/student/StudentCertificatesView.tsx';

// Help Desk Support System
import { HelpDeskView } from './pages/helpdesk/HelpDeskView.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';

// Gemini AI Chatbot
import { GeminiChatView } from './pages/gemini/GeminiChatView.tsx';
import { GeminiFloatingWidget } from './components/gemini/GeminiFloatingWidget.tsx';

const MainLayout: React.FC = () => {
  const { activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (activeRole === 'super_admin' || activeRole === 'admin') return 'admin-dashboard';
    if (activeRole === 'faculty' || activeRole === 'hod') return 'faculty-dashboard';
    if (activeRole === 'placement_officer') return 'placement-dashboard';
    return 'student-dashboard';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // Sync default tab if role shifts and current tab doesn't match
  React.useEffect(() => {
    if ((activeRole === 'super_admin' || activeRole === 'admin') && !activeTab.startsWith('admin')) {
      setActiveTab('admin-dashboard');
    } else if (activeRole === 'hod' && !activeTab.startsWith('hod') && !activeTab.startsWith('faculty')) {
      setActiveTab('hod-dashboard');
    } else if (activeRole === 'faculty' && !activeTab.startsWith('faculty')) {
      setActiveTab('faculty-dashboard');
    } else if (activeRole === 'placement_officer' && !activeTab.startsWith('placement')) {
      setActiveTab('placement-dashboard');
    } else if (activeRole === 'student' && !activeTab.startsWith('student')) {
      setActiveTab('student-dashboard');
    }
  }, [activeRole]);

  const renderActiveView = () => {
    switch (activeTab) {
      // Admin Views
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={setActiveTab} />;
      case 'admin-helpdesk':
        return <HelpDeskView />;
      case 'admin-students':
        return <StudentManagement />;
      case 'admin-faculty':
        return <FacultyManagement />;
      case 'admin-departments':
        return <DepartmentCourseManagement />;
      case 'admin-timetables':
        return <ClassTimetableManagement />;
      case 'admin-exams':
        return <ExaminationManagement />;
      case 'admin-notices':
        return <NoticeEventManagement />;
      case 'admin-placements':
        return <PlacementAdmin />;
      case 'admin-certificates':
        return <StudentCertificatesView />;
      case 'admin-audit':
      case 'admin-audit-logs':
        return <AuditLogsView />;
      case 'admin-settings':
        return <SystemSettingsView />;

      // HOD Views
      case 'hod-dashboard':
        return <AdminDashboard onNavigate={setActiveTab} />;
      case 'hod-helpdesk':
        return <HelpDeskView />;
      case 'hod-students':
        return <StudentManagement />;
      case 'hod-faculty':
        return <FacultyManagement />;
      case 'hod-curriculum':
        return <DepartmentCourseManagement />;
      case 'hod-attendance':
        return <FacultyAttendance />;
      case 'hod-notices':
        return <NoticeEventManagement />;

      // Faculty Views
      case 'faculty-dashboard':
        return <FacultyDashboard onNavigate={setActiveTab} />;
      case 'faculty-helpdesk':
        return <HelpDeskView />;
      case 'faculty-attendance':
        return <FacultyAttendance />;
      case 'faculty-assignments':
        return <FacultyAssignments />;
      case 'faculty-materials':
        return <FacultyStudyMaterials />;
      case 'faculty-marks':
        return <ExaminationManagement />;
      case 'faculty-timetable':
        return <ClassTimetableManagement />;
      case 'faculty-notices':
        return <NoticeEventManagement />;

      // Student Views
      case 'student-dashboard':
      case 'student-profile':
        return <StudentDashboard onNavigate={setActiveTab} />;
      case 'student-helpdesk':
        return <HelpDeskView />;
      case 'student-timetable':
        return <ClassTimetableManagement />;
      case 'student-attendance':
        return <StudentAttendanceView />;
      case 'student-assignments':
        return <StudentAssignmentsView />;
      case 'student-materials':
        return <FacultyStudyMaterials />;
      case 'student-results':
      case 'student-cgpa':
      case 'student-gradecard':
      case 'student-transcript':
      case 'results':
      case 'cgpa':
      case 'gradecard':
      case 'grades':
      case 'transcript':
        return <StudentResultsView onNavigate={setActiveTab} />;
      case 'student-events':
        return <NoticeEventManagement />;
      case 'student-placements':
        return <StudentPlacementsView />;
      case 'student-certificates':
        return <StudentCertificatesView />;

      // Placement Officer Views
      case 'placement-dashboard':
      case 'placement-companies':
      case 'placement-jobs':
      case 'placement-applications':
      case 'placement-reports':
        return <PlacementAdmin />;
      case 'placement-helpdesk':
        return <HelpDeskView />;

      case 'helpdesk':
        return <HelpDeskView />;

      // Apex AI Copilot (Gemini)
      case 'gemini-chat':
        return <GeminiChatView />;

      default:
        if (activeRole === 'super_admin' || activeRole === 'admin') return <AdminDashboard onNavigate={setActiveTab} />;
        if (activeRole === 'hod' || activeRole === 'faculty') return <FacultyDashboard onNavigate={setActiveTab} />;
        if (activeRole === 'placement_officer') return <PlacementAdmin />;
        return <StudentDashboard onNavigate={setActiveTab} />;
    }
  };

  const isFullHeightTab = activeTab === 'gemini-chat';

  return (
    <div className="flex h-screen bg-slate-100/70 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Dynamic Role-Based Sidebar */}
      <Sidebar
        currentTab={activeTab}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenVerifyModal={() => setIsVerifyModalOpen(true)}
        />

        <main className={`flex-1 overflow-y-auto ${isFullHeightTab ? 'p-0' : 'p-4 sm:p-6 lg:p-8'}`}>
          <div className={`${isFullHeightTab ? 'w-full h-full' : 'max-w-7xl mx-auto pb-12'}`}>
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Persistent Floating Gemini Assistant across all tabs */}
      {activeTab !== 'gemini-chat' && (
        <GeminiFloatingWidget
          onNavigateToFullChat={() => setActiveTab('gemini-chat')}
        />
      )}

      {/* Cryptographic Certificate Verification Modal */}
      <CertificateVerifyModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
      />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onOpenVerifyModal={() => setIsVerifyModalOpen(true)} />
        <CertificateVerifyModal
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
        />
      </>
    );
  }

  return <MainLayout />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
