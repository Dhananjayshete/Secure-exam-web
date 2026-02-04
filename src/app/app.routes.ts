import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component')
        .then(m => m.HomeComponent),
  },
  {
    path: 'how-it-works',
    loadComponent: () =>
      import('./pages/how-it-works/how-it-works.component')
        .then(m => m.HowItWorksComponent),
  },
  {
    path: 'login/admin',
    loadComponent: () =>
      import('./pages/auth/admin-login/admin-login.component')
      .then(m => m.AdminLoginComponent)
  },
  {
    path: 'login/teacher',
    loadComponent: () =>
      import('./auth/teacher-login.component')
        .then(m => m.TeacherLoginComponent)
  },
  {
    path: 'login/student',
    loadComponent: () =>
      import('./auth/student-login/student-login.component')
        .then(m => m.StudentLoginComponent)
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component')
        .then(m => m.RegisterComponent)
  },

  {
    path: 'admin-dashboard',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.component')
        .then(m => m.AdminDashboardComponent)
  },

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
