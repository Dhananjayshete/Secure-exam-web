import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss'
})
export class DashboardHomeComponent implements OnInit {
  
  users: any[] = [];
  students: any[] = [];
  teachers: any[] = [];
  admins: any[] = [];
  filteredUsers: any[] = [];
  selectedRole: string = 'all';

  // --- CHART CONFIGURATION ---
  public pieChartOptions: ChartOptions<'pie'> = { responsive: true };
  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Students', 'Teachers', 'Admins'],
    datasets: [{ data: [0, 0, 0], backgroundColor: ['#4f46e5', '#ec4899', '#f59e0b'] }]
  };

  public lineChartOptions: ChartOptions<'line'> = { responsive: true };
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{ data: [0, 0, 0, 0, 0], label: 'Registrations', fill: true }]
  };

  constructor() {}

  ngOnInit(): void {
    this.loadDataFromStorage();
  }

  loadDataFromStorage() {
    // 1. Try to find the data in LocalStorage (Try common keys)
    // CHECK HERE: If your app uses 'signupUsers' or 'registeredUsers', change this line!
    let rawData = localStorage.getItem('users') || localStorage.getItem('signupUsers');
    
    if (rawData) {
      this.users = JSON.parse(rawData);
      console.log('✅ Data Found in LocalStorage:', this.users);
      
      this.processData();
    } else {
      console.warn('❌ No data found in LocalStorage. Keys available:', Object.keys(localStorage));
      this.users = [];
    }
  }

  processData() {
    // 2. Safe Filtering (Handles 'Student', 'student', 'STUDENT')
    this.students = this.users.filter(u => u.role?.toLowerCase() === 'student');
    this.teachers = this.users.filter(u => u.role?.toLowerCase() === 'teacher');
    this.admins = this.users.filter(u => u.role?.toLowerCase() === 'admin');

    console.log('Counts -> Students:', this.students.length, 'Teachers:', this.teachers.length);

    // 3. Update Charts
    this.pieChartData = {
      labels: ['Students', 'Teachers', 'Admins'],
      datasets: [{
        data: [this.students.length, this.teachers.length, this.admins.length],
        backgroundColor: ['#536dfe', '#e040fb', '#ffab00']
      }]
    };

    // 4. Update Table
    this.filterUsers();
  }

  filterUsers() {
    if (this.selectedRole === 'all') {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter(user => 
        user.role?.toLowerCase() === this.selectedRole.toLowerCase()
      );
    }
  }
}