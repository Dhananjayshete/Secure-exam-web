import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit, OnDestroy {

  // =============================================================
  // 1. DASHBOARD STATE
  // =============================================================
  currentView: string = 'dashboard';
  isExamActive: boolean = false;
  timerDisplay: string = '60:00';
  private timerInterval: any;

  // =============================================================
  // 2. STUDENT DATA (loaded from API)
  // =============================================================
  studentProfile: any = {
    name: '',
    rollNo: '',
    email: '',
    phone: '',
    avatar: ''
  };

  // =============================================================
  // 3. TABLE DATA (loaded from API)
  // =============================================================
  stats = {
    total: 0,
    upcoming: 0,
    completed: 0,
    latestScore: 'N/A'
  };

  upcomingExams: any[] = [];
  examHistory: any[] = [];
  results: any[] = [];

  // =============================================================
  // 4. FORMS DATA
  // =============================================================
  passwordForm = { old: '', new: '', confirm: '' };
  ticketForm = { subject: '', message: '' };

  // =============================================================
  // 5. EXAM TAKING STATE
  // =============================================================
  activeExamId: string = '';
  activeExamTitle: string = '';
  examQuestions: any[] = [];
  currentQuestionIndex: number = 0;
  selectedAnswers: Map<string, any> = new Map(); // questionId -> { selectedOptionId, textAnswer }

  constructor(private apiService: ApiService, private authService: AuthService) { }

  ngOnInit() {
    this.loadProfile();
    this.loadExams();
    this.loadResults();
  }

  loadProfile() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.studentProfile = {
        name: user.name,
        rollNo: user.specialId || 'N/A',
        email: user.email,
        phone: '+91 XXXXX XXXXX',
        avatar: user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`
      };
    }
  }

  loadExams() {
    this.apiService.getExams().subscribe({
      next: (exams) => {
        this.upcomingExams = exams
          .filter(e => e.status === 'Scheduled' || e.status === 'Live')
          .map(e => ({
            id: e.id,
            name: e.title,
            date: e.date ? new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBD',
            time: e.date ? new Date(e.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'TBD',
            duration: `${e.durationMinutes} min`,
            status: e.status === 'Live' ? 'Ready' : 'Locked'
          }));

        this.examHistory = exams
          .filter(e => e.status === 'Completed')
          .map(e => ({
            name: e.title,
            date: e.date ? new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
            status: 'Completed'
          }));

        this.stats.total = exams.length;
        this.stats.upcoming = this.upcomingExams.length;
        this.stats.completed = this.examHistory.length;
      },
      error: (err) => console.error('Error loading exams:', err)
    });
  }

  loadResults() {
    this.apiService.getStudentResults().subscribe({
      next: (results) => {
        this.results = results.map(r => ({
          exam: r.examName,
          score: r.score !== null ? `${r.score}` : 'Pending',
          grade: r.grade || 'Pending'
        }));

        if (this.results.length > 0 && this.results[0].score !== 'Pending') {
          this.stats.latestScore = this.results[0].score;
        }
      },
      error: (err) => console.error('Error loading results:', err)
    });
  }

  // =============================================================
  // 5. FUNCTIONS
  // =============================================================

  switchView(viewName: string) {
    this.currentView = viewName;
  }

  // --- Exam Security Logic ---
  startExam(exam: any) {
    if (exam.status === 'Locked') {
      alert("This exam is not yet active.");
      return;
    }
    if (confirm("System Check: Webcam OK, Mic OK. Start Exam?")) {
      this.activeExamId = exam.id;
      this.activeExamTitle = exam.name;
      this.loadExamQuestions();
      this.isExamActive = true;
      this.enterFullscreen();
      this.startTimer();
      this.setupProctoringListeners();
    }
  }

  loadExamQuestions() {
    this.apiService.getQuestions(this.activeExamId).subscribe({
      next: (questions) => {
        this.examQuestions = questions;
        this.currentQuestionIndex = 0;
        this.selectedAnswers = new Map();
      },
      error: (err) => {
        console.error('Error loading questions:', err);
        alert('Failed to load exam questions.');
        this.isExamActive = false;
      }
    });
  }

  get currentQuestion() {
    return this.examQuestions[this.currentQuestionIndex] || null;
  }

  selectOption(questionId: string, optionId: string) {
    this.selectedAnswers.set(questionId, { selectedOptionId: optionId });
  }

  setTextAnswer(questionId: string, text: string) {
    this.selectedAnswers.set(questionId, { textAnswer: text });
  }

  getSelectedOptionId(questionId: string): string | null {
    const ans = this.selectedAnswers.get(questionId);
    return ans?.selectedOptionId || null;
  }

  getTextAnswer(questionId: string): string {
    const ans = this.selectedAnswers.get(questionId);
    return ans?.textAnswer || '';
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.examQuestions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  prevQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  goToQuestion(index: number) {
    this.currentQuestionIndex = index;
  }

  isAnswered(questionId: string): boolean {
    return this.selectedAnswers.has(questionId);
  }

  submitExam() {
    if (!confirm(`Are you sure you want to submit? You've answered ${this.selectedAnswers.size} of ${this.examQuestions.length} question(s).`)) return;

    const answers = Array.from(this.selectedAnswers.entries()).map(([questionId, ans]) => ({
      questionId,
      selectedOptionId: ans.selectedOptionId || null,
      textAnswer: ans.textAnswer || null
    }));

    if (answers.length === 0) {
      alert('Please answer at least one question before submitting.');
      return;
    }

    this.apiService.submitAnswers(this.activeExamId, answers).subscribe({
      next: (result) => {
        this.isExamActive = false;
        this.exitFullscreen();
        clearInterval(this.timerInterval);
        alert(`Exam Submitted!\nScore: ${result.percentage}%\nGrade: ${result.grade}`);
        this.switchView('results');
        this.loadResults();
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to submit exam.');
      }
    });
  }

  // --- Proctoring Event Logging ---
  setupProctoringListeners() {
    // Tab visibility change
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    // Window blur
    window.addEventListener('blur', this.onWindowBlur);
  }

  private onVisibilityChange = () => {
    if (this.isExamActive && document.hidden) {
      this.logProctoringEvent('tab_switch', 'Student switched tabs');
    }
  }

  private onWindowBlur = () => {
    if (this.isExamActive) {
      this.logProctoringEvent('focus_loss', 'Window lost focus');
    }
  }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: Event) {
    if (this.isExamActive) {
      event.preventDefault();
      this.logProctoringEvent('right_click', 'Right-click attempted during exam');
    }
  }

  @HostListener('document:copy', ['$event'])
  onCopy(event: Event) {
    if (this.isExamActive) {
      event.preventDefault();
      this.logProctoringEvent('copy_attempt', 'Copy attempted during exam');
    }
  }

  logProctoringEvent(eventType: string, details: string) {
    if (!this.activeExamId) return;
    this.apiService.logProctoringEvent(this.activeExamId, eventType, details).subscribe({
      error: (err) => console.error('Proctoring log error:', err)
    });
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('blur', this.onWindowBlur);
  }

  // --- Timer & Fullscreen ---
  startTimer() {
    let time = 3600; // 60 mins
    this.timerInterval = setInterval(() => {
      let m = Math.floor(time / 60);
      let s = time % 60;
      this.timerDisplay = `${m}:${s < 10 ? '0' : ''}${s}`;
      time--;
      if (time < 0) this.submitExam();
    }, 1000);
  }

  enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
  }

  exitFullscreen() {
    if (document.exitFullscreen) document.exitFullscreen();
  }

  // --- Form Handlers ---
  updatePassword() {
    if (this.passwordForm.new !== this.passwordForm.confirm) {
      alert("Passwords do not match!");
      return;
    }

    const user = this.authService.getCurrentUser();
    if (user) {
      this.apiService.updatePassword(user.id, this.passwordForm.old, this.passwordForm.new).subscribe({
        next: () => {
          alert("Password updated successfully.");
          this.passwordForm = { old: '', new: '', confirm: '' };
        },
        error: (err) => {
          alert(err.error?.error || "Failed to update password.");
        }
      });
    }
  }

  submitTicket() {
    this.apiService.createTicket(this.ticketForm.subject, this.ticketForm.message).subscribe({
      next: (ticket) => {
        alert(`Support ticket raised. ID: #${ticket.id.substring(0, 8).toUpperCase()}`);
        this.ticketForm = { subject: '', message: '' };
      },
      error: (err) => {
        alert(err.error?.error || "Failed to submit ticket.");
      }
    });
  }

  logout() {
    this.authService.logout();
    window.location.href = '/';
  }
}