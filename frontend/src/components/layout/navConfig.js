import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import LeaderboardRoundedIcon from '@mui/icons-material/LeaderboardRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

export const NAV_BY_ROLE = {
  STUDENT: [
    { label: 'Dashboard', to: '/student', icon: DashboardRoundedIcon },
    { label: 'Code', to: '/problems', icon: CodeRoundedIcon },
    { label: 'Contests', to: '/contests', icon: EmojiEventsRoundedIcon },
    { label: 'Assignments', to: '/assignments', icon: AssignmentRoundedIcon },
    { label: 'Tests', to: '/quizzes', icon: QuizRoundedIcon },
    { label: 'Leaderboard', to: '/leaderboard', icon: LeaderboardRoundedIcon },
    { label: 'Certificates', to: '/certificates', icon: WorkspacePremiumRoundedIcon },
  ],
  TRAINER: [
    { label: 'Dashboard', to: '/trainer', icon: DashboardRoundedIcon },
    { label: 'Tests', to: '/trainer/quizzes', icon: QuizRoundedIcon },
    { label: 'Workshops', to: '/trainer/workshops', icon: SchoolRoundedIcon },
    { label: 'Contests', to: '/trainer/contests', icon: EmojiEventsRoundedIcon },
    { label: 'Assignments', to: '/trainer/assignments', icon: AssignmentRoundedIcon },
    { label: 'Code Bank', to: '/trainer/questions', icon: CodeRoundedIcon },
    { label: 'Students', to: '/trainer/students', icon: GroupsRoundedIcon },
    { label: 'Leaderboard', to: '/leaderboard', icon: LeaderboardRoundedIcon },
    { label: 'Analytics', to: '/trainer/analytics', icon: BarChartRoundedIcon },
  ],
  ADMIN: [
    { label: 'Dashboard', to: '/admin', icon: DashboardRoundedIcon },
    { label: 'Students & Faculty', to: '/admin/users', icon: GroupsRoundedIcon },
    { label: 'Contests', to: '/admin/contests', icon: EmojiEventsRoundedIcon },
    { label: 'Tests', to: '/admin/quizzes', icon: QuizRoundedIcon },
    { label: 'Code Bank', to: '/admin/questions', icon: CodeRoundedIcon },
    { label: 'Leaderboard', to: '/leaderboard', icon: LeaderboardRoundedIcon },
    { label: 'Analytics', to: '/admin/analytics', icon: BarChartRoundedIcon },
    { label: 'Settings', to: '/admin/settings', icon: SettingsRoundedIcon },
  ],
};
