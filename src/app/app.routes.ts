import { Routes } from '@angular/router';

// 1. FIXED IMPORTS (Removed 'pages/' from these two)
import { UserListComponent } from './admin-dashboard/users/user-list/user-list.component';
import { GroupListComponent } from './admin-dashboard/users/group-list/group-list.component';

// 2. THIS ONE IS INSIDE PAGES
import { DashboardHomeComponent } from './pages/admin-dashboard/dashboard-home/dashboard-home.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  // {
  //   path: 'how-it-works',
  //   loadComponent: () =>
  //     import('./pages/how-it-works/how-it-works.component').then(m => m.HowItWorksComponent),
  // },

  // --- AUTH ROUTES ---
  {
    path: 'login/admin',
    loadComponent: () =>
      import('./pages/auth/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    path: 'login/teacher',
    loadComponent: () =>
      import('./auth/teacher-login.component').then(m => m.TeacherLoginComponent)
  },
  {
    path: 'login/student',
    loadComponent: () =>
      import('./auth/student-login/student-login.component').then(m => m.StudentLoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then(m => m.RegisterComponent)
  },

  // --- ADMIN DASHBOARD ---
  {
    path: 'admin-dashboard',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.component')
        .then(m => m.AdminDashboardComponent),

    // CHILDREN ROUTES
    children: [
      // 1. Show CHARTS by default (Empty path)
      {
        path: '',
        component: DashboardHomeComponent
      },

      // 2. Show STUDENTS ID Cards
      {
        path: 'users/students',
        component: UserListComponent,
        data: { type: 'student' }
      },

      // 3. Show TEACHERS ID Cards
      {
        path: 'users/teachers',
        component: UserListComponent,
        data: { type: 'teacher' }
      },

      // 3. Show STAFF ID Cards
      {
        path: 'users/staff',
        component: UserListComponent,
        data: { type: 'admin' }
      },

      // 4. Show GROUPS
      {
        path: 'users/groups',
        component: GroupListComponent
      },

      // 5. Question Bank
      {
        path: 'questions/all',
        loadComponent: () => import('./pages/admin-dashboard/questions/question-bank/question-bank.component').then(m => m.QuestionBankComponent)
      },

      // 6. Exam Management
      {
        path: 'exams/scheduled',
        loadComponent: () => import('./pages/admin-dashboard/exams/exam-management/exam-management.component').then(m => m.ExamManagementComponent)
      },

      // 7. Live Proctoring
      {
        path: 'proctor/live',
        loadComponent: () => import('./pages/admin-dashboard/proctoring/admin-monitor/admin-monitor.component').then(m => m.AdminMonitorComponent)
      }
    ]
  },

  // --- OTHER DASHBOARDS ---
  {
    path: 'student-dashboard',
    loadComponent: () =>
      import('./pages/auth/student-login/student-dashboard/student-dashboard.component')
        .then(m => m.StudentDashboardComponent)
  },
  {
    path: 'teacher-dashboard',
    loadComponent: () =>
      import('./pages/auth/teacher-login/teacher-dashboard/teacher-dashboard.component')
        .then(m => m.TeacherDashboardComponent)
  }
];