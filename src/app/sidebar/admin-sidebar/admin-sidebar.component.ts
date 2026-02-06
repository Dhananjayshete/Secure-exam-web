import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common'; // Required for *ngFor and *ngIf

interface MenuItem {
  label: string;
  icon: string;
  link?: string;
  children?: MenuItem[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss',
})
export class AdminSidebar {
  
  // Data-driven menu for reliability and easy maintenance
  menuItems: MenuItem[] = [
    { 
      label: 'Dashboard', 
      icon: 'fa-solid fa-chart-line', 
      link: '/admin-dashboard' 
    },
    {
      label: 'User Management',
      icon: 'fa-solid fa-users',
      isOpen: false, // Dropdown state
      children: [
        { label: 'Students/Candidates', icon: 'fa-solid fa-user-graduate', link: '/admin-dashboard/users/students' },
        { label: 'Proctors/Admins', icon: 'fa-solid fa-chalkboard-user', link: '/admin-dashboard/users/staff' },
        { label: 'Groups & Batches', icon: 'fa-solid fa-layer-group', link: '/admin-dashboard/users/groups' }
      ]
    },
    {
      label: 'Question Bank',
      icon: 'fa-solid fa-database',
      isOpen: false,
      children: [
        { label: 'All Questions', icon: 'fa-solid fa-list', link: '/admin-dashboard/questions/all' },
        { label: 'Add New Question', icon: 'fa-solid fa-plus', link: '/admin-dashboard/questions/create' },
        { label: 'Bulk Import', icon: 'fa-solid fa-file-import', link: '/admin-dashboard/questions/import' }
      ]
    },
    {
      label: 'Exam Management',
      icon: 'fa-solid fa-file-signature',
      isOpen: false,
      children: [
        { label: 'Create Exam', icon: 'fa-solid fa-pen-to-square', link: '/admin-dashboard/exams/create' },
        { label: 'Scheduled Exams', icon: 'fa-solid fa-calendar-days', link: '/admin-dashboard/exams/scheduled' },
        { label: 'Exam History', icon: 'fa-solid fa-clock-rotate-left', link: '/admin-dashboard/exams/history' }
      ]
    },
    {
      label: 'Live Proctoring', // CRITICAL for Secure Exams
      icon: 'fa-solid fa-eye', 
      isOpen: false,
      children: [
        { label: 'Live Monitor', icon: 'fa-solid fa-video', link: '/admin-dashboard/proctor/live' },
        { label: 'Cheating Flags', icon: 'fa-solid fa-flag', link: '/admin-dashboard/proctor/flags' }
      ]
    },
    {
      label: 'Results & Reports',
      icon: 'fa-solid fa-chart-pie',
      link: '/admin-dashboard/reports'
    },
    {
      label: 'Security & Logs',
      icon: 'fa-solid fa-shield-halved',
      link: '/admin-dashboard/audit-logs'
    },
    {
      label: 'Settings',
      icon: 'fa-solid fa-gears',
      link: '/admin-dashboard/settings'
    }
  ];

  toggleSubmenu(item: MenuItem) {
    // Toggle the clicked item
    item.isOpen = !item.isOpen;
  }
}