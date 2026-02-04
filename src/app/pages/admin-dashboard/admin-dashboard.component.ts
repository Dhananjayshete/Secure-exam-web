import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {

  // ======================
  // USERS DATA
  // ======================
  users: any[] = [];
  students: any[] = [];
  teachers: any[] = [];
  admins: any[] = [];

  filteredUsers: any[] = [];
  selectedRole: string = 'all';

  // ======================
  // PIE CHART
  // ======================
  pieChartType: 'pie' = 'pie';

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Students', 'Teachers', 'Admins'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: [
          '#4F46E5', // Students - Blue
          '#16A34A', // Teachers - Green
          '#DC2626'  // Admins - Red
        ],
        borderWidth: 0
      }
    ]
  };

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  // ======================
  // LINE CHART
  // ======================
  lineChartType: 'line' = 'line';

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Registrations',
        data: [],
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: '#4F46E5'
      }
    ]
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  // ======================
  // INIT
  // ======================
  ngOnInit(): void {
    this.loadUsers();
    this.prepareCharts();
  }

  // ======================
  // LOAD USERS
  // ======================
  loadUsers(): void {
    this.users = JSON.parse(localStorage.getItem('school_users') || '[]');

    this.students = this.users.filter(u => u.role === 'student');
    this.teachers = this.users.filter(u => u.role === 'teacher');
    this.admins   = this.users.filter(u => u.role === 'admin');

    this.filteredUsers = this.users;
  }

  // ======================
  // FILTER USERS
  // ======================
  filterUsers(): void {
    if (this.selectedRole === 'all') {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter(
        u => u.role === this.selectedRole
      );
    }
  }

  // ======================
  // PREPARE CHART DATA
  // ======================
  prepareCharts(): void {

    // PIE DATA
    this.pieChartData.datasets[0].data = [
      this.students.length,
      this.teachers.length,
      this.admins.length
    ];

    // LINE DATA
    const dateMap: Record<string, number> = {};

    this.users.forEach(user => {
      const date = new Date(user.createdAt).toLocaleDateString();
      dateMap[date] = (dateMap[date] || 0) + 1;
    });

    this.lineChartData.labels = Object.keys(dateMap);
    this.lineChartData.datasets[0].data = Object.values(dateMap);
  }
}
