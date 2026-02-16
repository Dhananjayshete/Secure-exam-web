import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';

@Component({
    selector: 'app-exam-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="admin-page">
      <div class="header">
        <h1>Exam Management</h1>
        <button class="btn-primary" (click)="createExam()">
          <i class="fa-solid fa-plus"></i> New Exam
        </button>
      </div>

      <div class="filters card">
        <div class="search-group">
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search by title or teacher...">
        </div>
      </div>

      <div class="exam-list">
        <div class="exam-card card" *ngFor="let exam of filteredExams">
          <div class="exam-info">
            <h3>{{ exam.title }}</h3>
            <p class="subject">{{ exam.subject }}</p>
            <div class="meta">
              <span><i class="fa-solid fa-user-tie"></i> {{ exam.teacher_name || 'Admin' }}</span>
              <span><i class="fa-solid fa-users"></i> {{ exam.candidates_count }} Candidates</span>
              <span><i class="fa-solid fa-calendar"></i> {{ exam.start_time | date:'shortDate' }}</span>
            </div>
          </div>
          <div class="exam-actions">
            <button class="btn-outline" (click)="editExam(exam)">Edit</button>
            <button class="btn-danger" (click)="deleteExam(exam)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .admin-page { padding: 2rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header h1 { color: #1a202c; font-size: 1.8rem; }
    .btn-primary { background: #4f46e5; color: white; padding: 0.6rem 1.2rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
    .card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 1.5rem; }
    .filters input { width: 300px; padding: 0.6rem 1rem; border-radius: 8px; border: 1px solid #ddd; }
    .exam-list { display: grid; gap: 1rem; }
    .exam-card { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0; }
    .exam-info h3 { margin: 0 0 0.2rem 0; color: #2d3748; }
    .subject { color: #718096; font-size: 0.9rem; margin-bottom: 0.8rem; }
    .meta { display: flex; gap: 1.5rem; color: #a0aec0; font-size: 0.8rem; }
    .meta i { margin-right: 0.3rem; }
    .exam-actions { display: flex; gap: 0.8rem; }
    .btn-outline { background: white; color: #4f46e5; border: 1px solid #4f46e5; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500; }
    .btn-danger { background: #fee2e2; color: #dc2626; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500; }
  `]
})
export class ExamManagementComponent implements OnInit {
    exams: any[] = [];
    searchTerm: string = '';

    constructor(private apiService: ApiService) { }

    ngOnInit() {
        this.apiService.getAdminExams().subscribe({
            next: (data) => this.exams = data,
            error: (err: any) => console.error('Error loading exams:', err)
        });
    }

    get filteredExams() {
        if (!this.searchTerm) return this.exams;
        const term = this.searchTerm.toLowerCase();
        return this.exams.filter(e =>
            e.title.toLowerCase().includes(term) ||
            (e.teacher_name && e.teacher_name.toLowerCase().includes(term))
        );
    }

    createExam() {
        alert('Routing to Create Exam interface...');
    }

    editExam(exam: any) {
        alert(`Editing Exam: ${exam.title}`);
    }

    deleteExam(exam: any) {
        if (confirm(`Are you sure you want to delete "${exam.title}"? All questions and student answers will be lost!`)) {
            this.apiService.deleteExam(exam.id).subscribe({
                next: () => {
                    this.exams = this.exams.filter(e => e.id !== exam.id);
                    alert('Exam deleted successfully.');
                },
                error: (err: any) => alert(err.error?.error || 'Failed to delete exam.')
            });
        }
    }
}
