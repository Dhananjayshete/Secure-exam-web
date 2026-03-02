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

  // --- LOGS MODAL STATE ---
  showLogsModal: boolean = false;
  logs: any[] = [];

  // --- SEATING PLAN STATE ---
  examsList: any[] = [];
  selectedExamId: number | null = null;
  seatingRows: number = 3;
  seatingCols: number = 4;
  seatingGrid: any[][] = [];
  seatingError: string = '';

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

        // Load exams list for seating plan after users load
        this.fetchExamsForSeating();
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

  // ==========================================
  // ADMIN LOGS MODAL
  // ==========================================
  toggleLogsModal() {
    this.showLogsModal = !this.showLogsModal;
    if (this.showLogsModal && this.logs.length === 0) {
      this.fetchLogs();
    }
  }

  fetchLogs() {
    this.apiService.getAdminLogs().subscribe({
      next: (res) => {
        this.logs = res.logs || [];
      },
      error: (err) => console.error('Error fetching logs', err)
    });
  }

  // ==========================================
  // SEATING PLAN
  // ==========================================
  fetchExamsForSeating() {
    this.apiService.getExams().subscribe({
      next: (exams) => {
        this.examsList = exams;
      },
      error: (err) => console.error('Error loading exams for seating', err)
    });
  }

  generateSeatingPlan() {
    if (!this.selectedExamId) {
      this.seatingError = 'Please select an exam first.';
      return;
    }

    if (this.seatingRows < 1 || this.seatingCols < 1) {
      this.seatingError = 'Rows and Columns must be at least 1.';
      return;
    }

    this.seatingError = '';

    this.apiService.getExamSeating(this.selectedExamId.toString()).subscribe({
      next: (res) => {
        const candidates = res.candidates || [];
        const totalSeats = this.seatingRows * this.seatingCols;

        if (candidates.length > totalSeats) {
          this.seatingError = `Not enough seats! This exam has ${candidates.length} candidates, but the grid only has ${totalSeats} seats.`;
          return;
        }

        // Build 2D array for the grid
        this.seatingGrid = [];
        let candidateIndex = 0;

        for (let r = 0; r < this.seatingRows; r++) {
          const row = [];
          for (let c = 0; c < this.seatingCols; c++) {
            if (candidateIndex < candidates.length) {
              row.push(candidates[candidateIndex]);
              candidateIndex++;
            } else {
              row.push(null); // Empty seat
            }
          }
          this.seatingGrid.push(row);
        }
      },
      error: (err) => {
        console.error('Error generating seating plan', err);
        this.seatingError = 'Failed to load candidates for seating plan.';
      }
    });
  }
}