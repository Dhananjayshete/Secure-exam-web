import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';

@Component({
    selector: 'app-admin-monitor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="admin-page">
      <div class="header">
        <h1>Live Proctoring Monitor</h1>
        <div class="exam-selector">
          <select [(ngModel)]="selectedExamId" (change)="onExamChange()">
            <option [ngValue]="null">Select a Live Exam...</option>
            <option *ngFor="let ex of liveExams" [value]="ex.id">{{ ex.title }} ({{ ex.teacher_name }})</option>
          </select>
        </div>
      </div>

      <div *ngIf="!selectedExamId" class="empty-state">
        <i class="fa-solid fa-video-slash"></i>
        <p>Choose an active exam from the dropdown above to start monitoring.</p>
      </div>

      <div *ngIf="selectedExamId" class="monitor-container">
        <div class="active-header">
          <h2>{{ selectedExamTitle }}</h2>
          <div class="stats">
            <span class="badge live"><i class="fa-solid fa-circle"></i> LIVE</span>
            <span><i class="fa-solid fa-users"></i> {{ liveStudents.length }} Active Students</span>
          </div>
        </div>

        <div class="monitor-grid">
          <div class="feeds-area">
            <div class="feed-card" *ngFor="let st of liveStudents" [class.alert]="st.hasAlerts">
              <div class="feed-video mocked">
                <img [src]="st.img" alt="feed">
                <div class="status-overlay">
                  <span class="name">{{ st.name }}</span>
                  <span class="status">{{ st.hasAlerts ? '⚠️ Flagged' : '✅ Good' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="audit-log">
            <div class="log-header">
              <h3>Security Logs</h3>
              <button class="btn-sm btn-outline" (click)="loadProctoringData()"><i class="fa-solid fa-sync"></i></button>
            </div>
            <div class="log-entries">
              <div class="log-entry" *ngFor="let evt of proctoringEvents" [class.warn]="evt.eventType !== 'good'">
                <span class="time">{{ evt.time }}</span>
                <span class="event">{{ evt.studentName }}: {{ evt.details }}</span>
              </div>
              <div *ngIf="proctoringEvents.length === 0" class="no-logs">No security events recorded.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .admin-page { padding: 2rem; height: 100%; display: flex; flex-direction: column; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .exam-selector select { padding: 0.8rem 1.2rem; border-radius: 8px; border: 1px solid #ddd; min-width: 300px; font-weight: 500; }
    .empty-state { flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; }
    .empty-state i { font-size: 4rem; margin-bottom: 1.5rem; }
    .monitor-container { flex-grow: 1; display: flex; flex-direction: column; }
    .active-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: white; padding: 1.2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .stats { display: flex; gap: 1.5rem; align-items: center; color: #64748b; font-weight: 500; }
    .badge.live { background: #fee2e2; color: #ef4444; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.8rem; display: flex; align-items: center; gap: 0.4rem; }
    .monitor-grid { display: grid; grid-template-columns: 1fr 350px; gap: 1.5rem; flex-grow: 1; overflow: hidden; }
    .feeds-area { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; overflow-y: auto; padding-right: 0.5rem; }
    .feed-card { background: #000; border-radius: 8px; overflow: hidden; aspect-ratio: 16/9; position: relative; border: 2px solid transparent; }
    .feed-card.alert { border-color: #ef4444; box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); }
    .feed-video img { width: 100%; height: 100%; object-fit: cover; opacity: 0.7; }
    .status-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 0.6rem; background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: white; display: flex; justify-content: space-between; font-size: 0.8rem; }
    .audit-log { background: white; border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .log-header { padding: 1rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .log-entries { flex-grow: 1; overflow-y: auto; padding: 10px; }
    .log-entry { padding: 8px; border-bottom: 1px solid #f8fafc; font-size: 0.85rem; }
    .log-entry.warn { background: #fff1f2; color: #9f1239; border-radius: 4px; }
    .time { color: #94a3b8; margin-right: 8px; font-family: monospace; }
    .no-logs { text-align: center; padding: 2rem; color: #94a3b8; }
  `]
})
export class AdminMonitorComponent implements OnInit, OnDestroy {
    liveExams: any[] = [];
    selectedExamId: any = null;
    selectedExamTitle: string = '';
    liveStudents: any[] = [];
    proctoringEvents: any[] = [];
    refreshInterval: any;

    constructor(private apiService: ApiService) { }

    ngOnInit() {
        this.loadLiveExams();
        this.startAutoRefresh();
    }

    ngOnDestroy() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
    }

    loadLiveExams() {
        this.apiService.getAdminExams().subscribe(exams => {
            this.liveExams = exams.filter((e: any) => e.status === 'Live');
        });
    }

    onExamChange() {
        const exam = this.liveExams.find(e => e.id == this.selectedExamId);
        this.selectedExamTitle = exam ? exam.title : '';
        this.loadProctoringData();
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            if (this.selectedExamId) this.loadProctoringData();
            else this.loadLiveExams();
        }, 5000);
    }

    loadProctoringData() {
        if (!this.selectedExamId) return;

        this.apiService.getProctoringEvents(this.selectedExamId).subscribe({
            next: (events: any[]) => {
                this.proctoringEvents = events.reverse().map(e => ({
                    time: new Date(e.timestamp).toLocaleTimeString(),
                    studentName: e.student_name || 'Anonymous',
                    details: e.details,
                    eventType: e.event_type
                }));

                // Extract "live" students (those with events)
                const studentMap = new Map();
                events.forEach(e => {
                    if (!studentMap.has(e.student_id)) {
                        studentMap.set(e.student_id, {
                            id: e.student_id,
                            name: e.student_name || 'Student',
                            img: e.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.student_name || 'S')}&background=random`,
                            hasAlerts: false
                        });
                    }
                    if (['tab_switch', 'focus_loss', 'camera_off'].includes(e.event_type)) {
                        studentMap.get(e.student_id).hasAlerts = true;
                    }
                });
                this.liveStudents = Array.from(studentMap.values());
            },
            error: (err) => console.error('Error loading events:', err)
        });
    }
}
