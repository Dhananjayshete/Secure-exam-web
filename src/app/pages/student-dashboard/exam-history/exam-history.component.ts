import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

@Component({
    selector: 'app-exam-history',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="history-container">
      <div class="header">
        <h1>Your Exam History</h1>
        <p>A record of all your completed assessments and results.</p>
      </div>

      <div *ngIf="isLoading" class="loading">
        <i class="fa-solid fa-circle-notch fa-spin"></i> Loading your history...
      </div>

      <div *ngIf="!isLoading && history.length === 0" class="empty">
        <i class="fa-solid fa-folder-open"></i>
        <h3>No History Yet</h3>
        <p>You haven't completed any exams. Once you do, they'll appear here.</p>
      </div>

      <div *ngIf="!isLoading && history.length > 0" class="history-list">
        <div class="history-card" *ngFor="let item of history">
          <div class="status-indicator" [ngClass]="item.grade?.toLowerCase().replace('+', '_plus')"></div>
          <div class="card-main">
            <div class="top-info">
              <h3>{{ item.exam_name }}</h3>
              <span class="subject-badge">{{ item.subject }}</span>
            </div>
            <div class="meta-info">
              <span><i class="fa-solid fa-calendar"></i> {{ item.start_time | date:'MMM d, y' }}</span>
              <span><i class="fa-solid fa-clock"></i> {{ item.start_time | date:'shortTime' }}</span>
            </div>
          </div>
          <div class="card-result">
            <div class="score-box">
              <span class="score">{{ item.score }}%</span>
              <span class="label">Score</span>
            </div>
            <div class="grade-box">
              <span class="grade" [ngClass]="item.grade?.toLowerCase().replace('+', '_plus')">{{ item.grade }}</span>
              <span class="label">Grade</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .history-container { padding: 2rem; max-width: 900px; margin: 0 auto; }
    .header { margin-bottom: 2.5rem; text-align: center; }
    .header h1 { font-family: 'Playfair Display', serif; font-size: 2.2rem; color: #1e293b; margin-bottom: 0.5rem; }
    .header p { color: #64748b; font-size: 1.1rem; }
    .loading, .empty { text-align: center; padding: 4rem; color: #94a3b8; }
    .loading i, .empty i { font-size: 3rem; margin-bottom: 1rem; }
    .history-list { display: flex; flex-direction: column; gap: 1.2rem; }
    .history-card { background: white; border-radius: 16px; display: flex; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); transition: transform 0.2s; }
    .history-card:hover { transform: translateY(-2px); }
    .status-indicator { width: 6px; flex-shrink: 0; background: #e2e8f0; }
    .status-indicator.a_plus, .status-indicator.a { background: #10b981; }
    .status-indicator.b, .status-indicator.c { background: #3b82f6; }
    .status-indicator.d { background: #f59e0b; }
    .status-indicator.f { background: #ef4444; }
    .card-main { flex-grow: 1; padding: 1.5rem; display: flex; flex-direction: column; justify-content: center; }
    .top-info { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
    .top-info h3 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b; }
    .subject-badge { background: #f1f5f9; color: #475569; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .meta-info { display: flex; gap: 1.5rem; color: #94a3b8; font-size: 0.875rem; }
    .meta-info i { margin-right: 0.4rem; }
    .card-result { display: flex; align-items: center; border-left: 1px solid #f1f5f9; padding: 1.5rem; gap: 2rem; background: #f8fafc; }
    .score-box, .grade-box { display: flex; flex-direction: column; align-items: center; }
    .score { font-size: 1.5rem; font-weight: 800; color: #1e293b; line-height: 1; }
    .grade { font-size: 1.5rem; font-weight: 900; line-height: 1; }
    .grade.a_plus, .grade.a { color: #059669; }
    .grade.b, .grade.c { color: #2563eb; }
    .grade.d { color: #d97706; }
    .grade.f { color: #dc2626; }
    .label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-top: 0.25rem; }
  `]
})
export class ExamHistoryComponent implements OnInit {
    history: any[] = [];
    isLoading: boolean = true;

    constructor(private apiService: ApiService) { }

    ngOnInit() {
        this.apiService.getStudentResults().subscribe({
            next: (data: any[]) => {
                this.history = data;
                this.isLoading = false;
            },
            error: (err: any) => {
                console.error('Error fetching history:', err);
                this.isLoading = false;
            }
        });
    }
}
