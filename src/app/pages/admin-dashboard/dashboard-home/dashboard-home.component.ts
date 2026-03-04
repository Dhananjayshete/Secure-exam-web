import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ApiService } from '../../../services/api.service';

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
  isLoading: boolean = true;

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

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadDataFromApi();
  }

  loadDataFromApi() {
    this.isLoading = true;

    // Load user stats for charts
    this.apiService.getUserStats().subscribe({
      next: (stats) => {
        // Update pie chart
        this.pieChartData = {
          labels: ['Students', 'Teachers', 'Admins'],
          datasets: [{
            data: [stats.counts.student, stats.counts.teacher, stats.counts.admin],
            backgroundColor: ['#536dfe', '#e040fb', '#ffab00']
          }]
        };

        // Update line chart with registration trend
        if (stats.registrationTrend && stats.registrationTrend.length > 0) {
          this.lineChartData = {
            labels: stats.registrationTrend.map((t: any) => t.month),
            datasets: [{
              data: stats.registrationTrend.map((t: any) => t.count),
              label: 'Registrations',
              fill: true
            }]
          };
        }
      },
      error: (err) => console.error('Error loading stats:', err)
    });

    // Load all users for the table
    this.apiService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.processData();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isLoading = false;
      }
    });
  }

  processData() {
    this.students = this.users.filter(u => u.role?.toLowerCase() === 'student');
    this.teachers = this.users.filter(u => u.role?.toLowerCase() === 'teacher');
    this.admins = this.users.filter(u => u.role?.toLowerCase() === 'admin');
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