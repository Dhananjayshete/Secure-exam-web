import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'app-question-bank',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <div class="header">
        <h1>Global Question Bank</h1>
        <div class="search-bar">
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search questions or exams...">
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="label">Total Questions</span>
          <span class="value">{{ questions.length }}</span>
        </div>
        <div class="stat-card">
          <span class="label">MCQs</span>
          <span class="value">{{ getCount('MCQ') }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Short Answers</span>
          <span class="value">{{ getCount('short_answer') }}</span>
        </div>
      </div>

      <div class="table-container card">
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th>Type</th>
              <th>Exam</th>
              <th>Creator</th>
              <th>Points</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let q of filteredQuestions">
              <td>
                <div class="text-truncate">{{ q.question_text }}</div>
              </td>
              <td><span class="badge" [ngClass]="q.question_type">{{ q.question_type === 'MCQ' ? 'MCQ' : 'SA' }}</span></td>
              <td>{{ q.exam_title }}</td>
              <td>{{ q.teacher_name || 'System' }}</td>
              <td>{{ q.points }}</td>
              <td>
                <button class="btn-icon" (click)="viewQuestion(q)"><i class="fa-solid fa-eye"></i></button>
                <button class="btn-icon delete" (click)="deleteQuestion(q)"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { padding: 2rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .search-bar input { padding: 0.6rem 1rem; border-radius: 8px; border: 1px solid #ddd; width: 300px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .stat-card .label { display: block; color: #666; font-size: 0.9rem; margin-bottom: 0.5rem; }
    .stat-card .value { font-size: 1.8rem; font-weight: bold; color: #2d3748; }
    .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 1rem; background: #f8fafc; color: #64748b; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; }
    td { padding: 1rem; border-top: 1px solid #f1f5f9; font-size: 0.9rem; }
    .text-truncate { max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .badge { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge.MCQ { background: #e0f2fe; color: #0369a1; }
    .badge.short_answer { background: #fef3c7; color: #92400e; }
    .btn-icon { background: none; border: none; color: #64748b; cursor: pointer; padding: 0.4rem; transition: color 0.2s; }
    .btn-icon:hover { color: #4f46e5; }
    .btn-icon.delete:hover { color: #ef4444; }
  `]
})
export class QuestionBankComponent implements OnInit {
  questions: any[] = [];
  searchTerm: string = '';

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.apiService.getAllQuestions().subscribe({
      next: (data) => this.questions = data,
      error: (err: any) => console.error('Error loading questions:', err)
    });
  }

  get filteredQuestions() {
    if (!this.searchTerm) return this.questions;
    return this.questions.filter(q =>
      q.question_text.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      q.exam_title.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getCount(type: string) {
    return this.questions.filter(q => q.question_type === type).length;
  }

  viewQuestion(q: any) {
    alert(`Viewing Details for: ${q.question_text}\nType: ${q.question_type}\nExam: ${q.exam_title}`);
  }

  deleteQuestion(q: any) {
    if (confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      this.apiService.deleteQuestion(q.id).subscribe({
        next: () => {
          this.questions = this.questions.filter(item => item.id !== q.id);
          alert('Question deleted successfully.');
        },
        error: (err: any) => alert(err.error?.error || 'Failed to delete question.')
      });
    }
  }
}
