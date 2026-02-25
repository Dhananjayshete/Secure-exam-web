import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';
import { AuthService } from '../../../../services/auth.service';
import { ExamHistoryComponent } from '../../../student-dashboard/exam-history/exam-history.component';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ExamHistoryComponent],
  providers: [DatePipe],
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
    batch: '',
    dept: '',
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

  // Notifications state
  notifications: any[] = [];
  showNotifications: boolean = false;
  get unreadCount(): number { return this.notifications.length; }

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

  // NEW: UX state
  isScheduledModalOpen: boolean = false;
  scheduledExam: any = null;
  isCompletionView: boolean = false;
  completionData: any = null;

  // Proctoring Strikes
  warningCount: number = 0;
  private cameraCheckInterval: any;

  constructor(private apiService: ApiService, private authService: AuthService) { }

  @ViewChild('resultCard') resultCardRef?: ElementRef;

  ngOnInit() {
    this.loadProfile();
    this.loadExams();
    this.loadResults();
    this.loadNotifications();
  }

  loadProfile() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.studentProfile = {
        name: user.name,
        rollNo: user.specialId || 'N/A',
        email: user.email,
        phone: user.phone || '',
        batch: user.batch || '',
        dept: user.dept || user.department || '',
        avatar: user.photoUrl || user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`
      };
    }
  }

  loadExams() {
    this.apiService.getExams().subscribe({
      next: (exams) => {
        // Filter out completed exams for upcoming list
        this.upcomingExams = exams
          .filter(e => e.status !== 'Completed')
          .map(e => {
            const start = e.startTime ? new Date(e.startTime) : null;
            const end = e.endTime ? new Date(e.endTime) : null;

            return {
              id: e.id,
              name: e.title,
              subject: e.subject,
              startTime: start,
              endTime: end,
              duration: `${e.durationMinutes} min`,
              displayDate: start ? start.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'TBD',
              displayEndDate: end ? end.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null,
              time: start ? start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'TBD',

              // Initial status calc
              isStartable: false,
              displayStatus: 'Locked',
              countdown: ''
            };
          });

        this.updateExamStatuses();
        // Start countdown timer
        setInterval(() => this.updateExamStatuses(), 1000);

        this.stats.total = exams.length;
        this.stats.upcoming = this.upcomingExams.length;
        this.stats.completed = exams.filter(e => e.status === 'Completed').length;
      },
      error: (err) => console.error('Error loading exams:', err)
    });
  }

  updateExamStatuses() {
    const now = new Date();
    this.upcomingExams.forEach(exam => {
      if (!exam.startTime) {
        exam.isStartable = false;
        exam.displayStatus = 'TBD';
        return;
      }

      if (now < exam.startTime) {
        exam.isStartable = false;
        exam.displayStatus = 'Scheduled';
        // Calc countdown
        const diff = exam.startTime.getTime() - now.getTime();
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        if (d > 0) exam.countdown = `Opens in ${d}d ${h}h`;
        else exam.countdown = `Opens in ${h}h ${m}m ${s}s`;

      } else if (exam.endTime && now > exam.endTime) {
        exam.isStartable = false;
        exam.displayStatus = 'Expired';
        exam.countdown = 'Exam Ended';
      } else {
        // Live
        exam.isStartable = true;
        exam.displayStatus = 'Live';
        exam.countdown = 'Active Now';
      }
    });
  }

  loadResults() {
    this.apiService.getStudentResults().subscribe({
      next: (data: any[]) => {
        // Map raw API rows into display-friendly objects
        this.results = data.map(r => ({
          exam: r.exam_name,
          subject: r.subject,
          score: r.score != null ? `${r.score}%` : 'N/A',
          grade: r.grade || 'Pending',
          date: r.start_time ? new Date(r.start_time).toLocaleDateString() : 'N/A',
          raw: r
        }));

        this.examHistory = data.map(r => ({
          name: r.exam_name,
          subject: r.subject,
          date: r.start_time ? new Date(r.start_time).toLocaleDateString() : 'N/A',
          status: r.status || 'Completed',
          score: r.score != null ? r.score + '%' : 'N/A'
        }));

        // Update latest result card — data is already sorted by created_at DESC
        if (data.length > 0 && data[0].score != null) {
          this.stats.latestScore = `${data[0].score}% (${data[0].grade || 'Pending'})`;
        } else {
          this.stats.latestScore = 'N/A';
        }
      },
      error: (err) => console.error('Error loading results:', err)
    });
  }

  loadNotifications() {
    this.apiService.getNotifications().subscribe({
      next: (data) => { this.notifications = data; },
      error: (err) => console.error('Error loading notifications:', err)
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  markNotificationRead(notification: any) {
    this.apiService.markNotificationRead(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
      }
    });
  }

  markAllRead() {
    this.apiService.markAllNotificationsRead().subscribe({
      next: () => { this.notifications = []; this.showNotifications = false; }
    });
  }

  downloadResultPdf(result: any) {
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 600px;">
        <h1 style="color:#4f46e5; margin-bottom: 8px;">SecureTake — Result Card</h1>
        <hr style="margin-bottom: 24px;" />
        <p><strong>Exam:</strong> ${result.exam}</p>
        <p><strong>Subject:</strong> ${result.subject}</p>
        <p><strong>Score:</strong> ${result.score}</p>
        <p><strong>Grade:</strong> ${result.grade}</p>
        <p><strong>Student:</strong> ${this.studentProfile.name}</p>
        <p><strong>Roll No:</strong> ${this.studentProfile.rollNo}</p>
        <p><strong>Date:</strong> ${result.date}</p>
        <hr style="margin-top: 24px;" />
        <p style="font-size:11px; color:#64748b;">Generated by SecureTake Academic Portal</p>
      </div>`;

    const el = document.createElement('div');
    el.innerHTML = content;
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    document.body.appendChild(el);

    html2canvas(el, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Result_${result.exam}_${this.studentProfile.rollNo}.pdf`);
      document.body.removeChild(el);
    });
  }

  // =============================================================
  // 5. FUNCTIONS
  // =============================================================

  switchView(viewName: string) {
    this.currentView = viewName;
    if (viewName === 'results' || viewName === 'history') {
      this.loadResults();
    }
  }

  // =============================================================
  // 6. EXAM SECURITY LOGIC
  // =============================================================

  // Verification State
  isVerificationModalOpen: boolean = false;
  verificationStep: 'password' | 'system-check' = 'password';
  verificationPassword: string = '';
  verificationError: string = '';
  systemCheckStatus = { camera: false, mic: false, error: '' };
  private activeMediaStream: MediaStream | null = null;

  targetExam: any = null;

  startExam(exam: any) {
    const now = new Date();
    if (exam.startTime && now < exam.startTime) {
      this.scheduledExam = exam;
      this.isScheduledModalOpen = true;
      return;
    }

    if (exam.displayStatus === 'Expired') {
      alert("This exam has already ended.");
      return;
    }

    this.targetExam = exam;
    this.isVerificationModalOpen = true;
    this.verificationStep = 'password';
    this.verificationPassword = '';
    this.verificationError = '';
    this.systemCheckStatus = { camera: false, mic: false, error: '' };
  }

  closeVerificationModal() {
    this.stopMediaStream();
    this.isVerificationModalOpen = false;
    this.targetExam = null;
  }

  private stopMediaStream() {
    if (this.activeMediaStream) {
      this.activeMediaStream.getTracks().forEach(track => track.stop());
      this.activeMediaStream = null;
    }
  }

  closeScheduledModal() {
    this.isScheduledModalOpen = false;
    this.scheduledExam = null;
  }

  verifyPassword() {
    if (!this.verificationPassword) {
      this.verificationError = 'Password is required';
      return;
    }
    this.apiService.reverify(this.verificationPassword).subscribe({
      next: () => {
        this.verificationStep = 'system-check';
        this.checkSystemPermissions();
      },
      error: (err) => {
        this.verificationError = err.error?.error || 'Invalid password';
      }
    });
  }

  checkSystemPermissions() {
    this.systemCheckStatus.error = '';
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        this.systemCheckStatus.camera = true;
        this.systemCheckStatus.mic = true;
        this.activeMediaStream = stream; // Keep it active
      })
      .catch(err => {
        console.error('System check failed:', err);
        this.systemCheckStatus.camera = false;
        this.systemCheckStatus.mic = false;
        this.systemCheckStatus.error = 'Camera and Microphone access is required. Please allow access in your browser settings.';
      });
  }

  confirmStartExam() {
    if (!this.systemCheckStatus.camera || !this.systemCheckStatus.mic) {
      alert('Cannot start exam without System Check pass.');
      return;
    }

    if (!this.targetExam) return;

    this.apiService.startExamSession(this.targetExam.id).subscribe({
      next: (res) => {
        this.activeExamId = this.targetExam.id;
        this.activeExamTitle = this.targetExam.name;
        this.loadExamQuestions();
        this.isExamActive = true;
        this.warningCount = 0;
        this.enterFullscreen();
        this.startTimer(res.candidate?.duration_minutes || this.targetExam.duration || 60);
        this.setupProctoringListeners();
        this.isVerificationModalOpen = false; // Don't call closeVerificationModal to keep stream
      },
      error: (err) => {
        console.error('Start Exam Error:', err);
        alert(err.error?.error || 'Failed to start exam.');
        this.closeVerificationModal();
      }
    });
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

  submitExam(isAuto: boolean = false) {
    if (!isAuto && !confirm(`Are you sure you want to submit? You've answered ${this.selectedAnswers.size} of ${this.examQuestions.length} question(s).`)) return;

    const answers = Array.from(this.selectedAnswers.entries()).map(([questionId, ans]) => ({
      questionId,
      selectedOptionId: ans.selectedOptionId || null,
      textAnswer: ans.textAnswer || null
    }));

    this.apiService.submitAnswers(this.activeExamId, answers).subscribe({
      next: (result) => {
        this.endExamSession();

        // Show completion view
        this.completionData = {
          title: this.activeExamTitle,
          date: new Date().toLocaleDateString(),
          score: result.percentage,
          percentage: result.percentage,
          grade: result.grade,
          questionsAttempted: answers.length,
          totalQuestions: this.examQuestions.length,
          isDisqualified: result.grade === 'Disqualified'
        };
        this.isCompletionView = true;
        this.currentView = 'completion';
        this.loadResults();
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to submit exam.');
      }
    });
  }

  private endExamSession() {
    this.isExamActive = false;
    this.exitFullscreen();
    clearInterval(this.timerInterval);
    clearInterval(this.cameraCheckInterval);
    this.stopMediaStream();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('blur', this.onWindowBlur);
  }

  // --- Proctoring Event Logging ---
  setupProctoringListeners() {
    // Tab visibility change
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    // Window blur
    window.addEventListener('blur', this.onWindowBlur);

    // Persistent Camera check
    this.cameraCheckInterval = setInterval(() => {
      if (this.activeMediaStream) {
        const videoTrack = this.activeMediaStream.getVideoTracks()[0];
        if (!videoTrack || videoTrack.readyState === 'ended' || !videoTrack.enabled) {
          this.logProctoringEvent('camera_off', 'Camera track lost or disabled');
        }
      }
    }, 5000);
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

    // Increment warnings for serious violations
    if (['tab_switch', 'focus_loss', 'camera_off'].includes(eventType)) {
      this.warningCount++;
      if (this.warningCount === 1) {
        alert("Warning 1 of 3: Do not leave the exam window. Your session is being monitored.");
      } else if (this.warningCount === 2) {
        alert("Warning 2 of 3: Next violation will result in automatic disqualification!");
      } else if (this.warningCount >= 3) {
        alert("Warning 3 of 3: Disqualified! Your exam has been terminated.");
        this.submitExam(true); // Auto-submit
      }
    }

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
  startTimer(durationMinutes: number = 60) {
    let time = durationMinutes * 60;
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
  updateProfile() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const data = {
      name: this.studentProfile.name,
      phone: this.studentProfile.phone,
      batch: this.studentProfile.batch,
      department: this.studentProfile.dept
    };

    this.apiService.updateProfile(user.id, data).subscribe({
      next: (res) => {
        alert("Profile updated successfully.");
        // Update local storage user info
        const updatedUser = { ...user, ...res.user };
        this.authService.updateUser(updatedUser);
        this.loadProfile();
      },
      error: (err) => {
        alert(err.error?.error || "Failed to update profile.");
      }
    });
  }

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