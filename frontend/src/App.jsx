import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { fetchCurrentUser } from '@/features/auth/authSlice';

import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';

import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import NotFoundPage from '@/pages/NotFoundPage';

import StudentDashboard from '@/features/dashboard/student/StudentDashboard';
import TrainerDashboard from '@/features/dashboard/trainer/TrainerDashboard';
import TrainerStudentsPage from '@/features/dashboard/trainer/TrainerStudentsPage';
import AdminDashboard from '@/features/dashboard/admin/AdminDashboard';
import AdminUsersPage from '@/features/dashboard/admin/AdminUsersPage';
import AdminContestsPage from '@/features/dashboard/admin/AdminContestsPage';
import AdminQuizzesPage from '@/features/dashboard/admin/AdminQuizzesPage';
import AdminQuestionsPage from '@/features/dashboard/admin/AdminQuestionsPage';
import AdminAnalyticsPage from '@/features/dashboard/admin/AdminAnalyticsPage';
import AdminSettingsPage from '@/features/dashboard/admin/AdminSettingsPage';

import ProblemsListPage from '@/features/problems/ProblemsListPage';
import ProblemWorkspacePage from '@/features/problems/ProblemWorkspacePage';
import OnlineCompilerPage from '@/features/compiler/OnlineCompilerPage';
import ContestsListPage from '@/features/contests/ContestsListPage';
import LeaderboardPage from '@/features/leaderboard/LeaderboardPage';

import TrainerQuizzesPage from '@/features/quizzes/TrainerQuizzesPage';
import StudentQuizzesPage from '@/features/quizzes/StudentQuizzesPage';
import QuizAttemptPage from '@/features/quizzes/QuizAttemptPage';
import ComingSoon from '@/components/common/ComingSoon';

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (localStorage.getItem('ca_access_token')) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ComingSoon title="Forgot password" description="Password reset via OTP verification." />} />
        </Route>

        {/* Shared Authenticated Routes (Student, Trainer, Admin) */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'TRAINER', 'ADMIN']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/contests" element={<ContestsListPage />} />
          </Route>
        </Route>

        {/* Student */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/problems" element={<OnlineCompilerPage />} />
            <Route path="/compiler" element={<OnlineCompilerPage />} />
            <Route path="/problems/practice" element={<ProblemsListPage />} />
            <Route path="/problems/:slug" element={<ProblemWorkspacePage />} />
            <Route path="/assignments" element={<ComingSoon title="Assignments" description="Deadlines, submissions and feedback in one place." />} />
            <Route path="/quizzes" element={<StudentQuizzesPage />} />
            <Route path="/quizzes/:id/attempt" element={<QuizAttemptPage />} />
            <Route path="/certificates" element={<ComingSoon title="Certificates" description="Download your QR-verified certificates." />} />
          </Route>
        </Route>

        {/* Trainer */}
        <Route element={<ProtectedRoute allowedRoles={['TRAINER']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/trainer" element={<TrainerDashboard />} />
            <Route path="/trainer/quizzes" element={<TrainerQuizzesPage />} />
            <Route path="/trainer/workshops" element={<ComingSoon title="Workshops" description="Create and manage workshops, attendance and certificates." />} />
            <Route path="/trainer/contests" element={<ComingSoon title="Contests" description="Build contests with coding problems, MCQs and negative marking." />} />
            <Route path="/trainer/assignments" element={<ComingSoon title="Assignments" description="Create assignments and track submissions." />} />
            <Route path="/trainer/questions" element={<ComingSoon title="Question bank" description="Upload problems, test cases and editorials." />} />
            <Route path="/trainer/students" element={<TrainerStudentsPage />} />
            <Route path="/trainer/analytics" element={<ComingSoon title="Analytics" description="Submission trends, difficulty analysis and pass rates." />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/contests" element={<AdminContestsPage />} />
            <Route path="/admin/quizzes" element={<AdminQuizzesPage />} />
            <Route path="/admin/tests" element={<AdminQuizzesPage />} />
            <Route path="/admin/questions" element={<AdminQuestionsPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
