import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';
import { AuthService } from '../../../../services/auth.service';

interface NewExam {
  title: string;
  subject: string;
  startTime: string;
  endTime: string;
  duration: number;
  security: {
    browserLock: boolean;
    aiProctor: boolean;
  };
  groupIds: string[];
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.scss']
})
export class TeacherDashboardComponent implements OnInit {

  // --- 1. DASHBOARD STATE ---
  currentView: string = 'dashboard';
  searchTerm: string = '';
  isModalOpen: boolean = false;

  // --- 2. DATA (loaded from API) ---
  exams: any[] = [];
  liveStudents: any[] = [];
  studentData: any[] = [];
  groups: any[] = [];
  proctoringEvents: any[] = [];

  // --- 3. QUESTION MANAGEMENT ---
  selectedExamId: string = '';
  selectedExamTitle: string = '';
  questions: any[] = [];
  isQuestionsLoading: boolean = false;

  // NEW: Analytics & Grading state
  analytics: any = null;
  gradingList: any[] = [];
  isAnalyticsLoading: boolean = false;
  isGradingLoading: boolean = false;
  selectedExamForAnalytics: any = null;
  selectedExamForGrading: any = null;

  newQuestion = {
    questionText: '',
    questionType: 'MCQ',
    points: 2,
    modelAnswer: '',
    options: [
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false }
    ]
  };

  // --- 4. FORM DATA ---
  newExam: NewExam = {
    title: '',
    subject: 'Computer Science',
    startTime: '',
    endTime: '',
    duration: 60,
    security: {
      browserLock: true,
      aiProctor: true
    },
    groupIds: []
  };

  // --- 5. LIVE MONITORING ---
  monitorExamId: string = '';

  constructor(private apiService: ApiService, private authService: AuthService) { }

  ngOnInit() {
    this.loadExams();
    this.loadStudents();
    this.loadGroups();
  }

  loadGroups() {
    this.apiService.getGroups().subscribe({
      next: (groups) => {
        this.groups = groups;
      },
      error: (err) => console.error('Error loading groups:', err)
    });
  }

  loadExams() {
    this.apiService.getExams().subscribe({
      next: (exams) => {
        this.exams = exams.map(e => ({
          id: e.id,
          title: e.title,
          subject: e.subject,
          date: e.date ? new Date(e.date).toLocaleString() : 'TBD',
          candidates: e.candidates || '--',
          status: e.status,
          security: e.security
        }));
      },
      error: (err) => console.error('Error loading exams:', err)
    });
  }

  loadStudents() {
    this.apiService.getUsers('student').subscribe({
      next: (students) => {
        this.studentData = students.map(s => ({
          id: s.specialId || s.id,
          name: s.name,
          email: s.email,
          batch: s.batch || 'N/A',
          dept: s.dept || 'N/A',
          status: s.status,
          photo: s.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}`
        }));
      },
      error: (err) => console.error('Error loading students:', err)
    });
  }

  // --- QUESTION MANAGEMENT ---
  openQuestions(exam: any) {
    this.selectedExamId = exam.id;
    this.selectedExamTitle = exam.title;
    this.currentView = 'questions';
    this.loadQuestions();
  }

  loadQuestions() {
    this.isQuestionsLoading = true;
    this.apiService.getQuestions(this.selectedExamId).subscribe({
      next: (questions) => {
        this.questions = questions;
        this.isQuestionsLoading = false;
      },
      error: (err) => {
        console.error('Error loading questions:', err);
        this.isQuestionsLoading = false;
      }
    });
  }

  addQuestion() {
    if (!this.newQuestion.questionText.trim()) {
      alert('Question text is required.');
      return;
    }

    const payload: any = {
      questionText: this.newQuestion.questionText,
      questionType: this.newQuestion.questionType,
      points: this.newQuestion.points,
      modelAnswer: this.newQuestion.modelAnswer,
      sortOrder: this.questions.length + 1
    };

    if (this.newQuestion.questionType === 'MCQ') {
      const validOptions = this.newQuestion.options.filter(o => o.optionText.trim());
      if (validOptions.length < 2) {
        alert('At least 2 options are required for MCQ.');
        return;
      }
      if (!validOptions.some(o => o.isCorrect)) {
        alert('Please mark at least one option as correct.');
        return;
      }
      payload.options = validOptions;
    }

    this.apiService.createQuestion(this.selectedExamId, payload).subscribe({
      next: (q) => {
        this.questions.push(q);
        this.resetQuestionForm();
      },
      error: (err) => alert(err.error?.error || 'Failed to add question.')
    });
  }

  deleteQuestion(questionId: string) {
    if (!confirm('Delete this question?')) return;
    this.apiService.deleteQuestion(questionId).subscribe({
      next: () => {
        this.questions = this.questions.filter(q => q.id !== questionId);
      },
      error: (err) => alert(err.error?.error || 'Failed to delete question.')
    });
  }

  resetQuestionForm() {
    this.newQuestion = {
      questionText: '',
      questionType: 'MCQ',
      points: 2,
      modelAnswer: '',
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false }
      ]
    };
  }

  setCorrectOption(index: number) {
    this.newQuestion.options.forEach((o, i) => o.isCorrect = i === index);
  }

  // --- LIVE MONITORING (real proctoring data) ---
  openMonitor(exam: any) {
    this.monitorExamId = exam.id;
    this.selectedExamTitle = exam.title;
    this.currentView = 'monitor';
    this.loadProctoringData();
  }

  loadProctoringData() {
    if (!this.monitorExamId) return;

    this.apiService.getMonitorData(this.monitorExamId).subscribe({
      next: (students) => {
        this.liveStudents = students.map(s => ({
          name: s.name,
          email: s.email,
          status: s.status, // flagged or good
          examStatus: s.examStatus, // In-Progress, Completed
          img: s.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=0D8ABC&color=fff`,
          flagCount: s.flagCount,
          lastActivity: s.lastActivity ? new Date(s.lastActivity).toLocaleTimeString() : 'N/A'
        }));
      },
      error: (err) => console.error('Error loading proctoring data:', err)
    });
  }

  // --- ANALYTICS & GRADING ---
  openAnalytics(exam: any) {
    this.selectedExamForAnalytics = exam;
    this.selectedExamTitle = exam.title;
    this.currentView = 'analytics';
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.isAnalyticsLoading = true;
    this.apiService.getTeacherAnalytics().subscribe({
      next: (data: any) => {
        this.analytics = data;
        this.isAnalyticsLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading analytics:', err);
        this.isAnalyticsLoading = false;
      }
    });
  }

  openGrading(exam: any) {
    this.selectedExamForGrading = exam;
    this.selectedExamTitle = exam.title;
    this.currentView = 'grading';
    this.loadGrading();
  }

  loadGrading() {
    this.isGradingLoading = true;
    this.apiService.getTeacherGrading().subscribe({
      next: (data: any[]) => {
        this.gradingList = data;
        this.isGradingLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading grading data:', err);
        this.isGradingLoading = false;
      }
    });
  }

  // --- HELPER FUNCTIONS ---
  switchView(viewName: string) {
    this.currentView = viewName;
    if (viewName === 'monitor' && this.monitorExamId) {
      this.loadProctoringData();
    } else if (viewName === 'analytics') {
      this.loadAnalytics();
    } else if (viewName === 'grading') {
      this.loadGrading();
    }
  }

  openModal() {
    this.isModalOpen = true;
    this.resetExamForm(); // Reset on open
  }

  closeModal() {
    this.isModalOpen = false;
  }

  createExam() {
    const examData = {
      title: this.newExam.title,
      subject: this.newExam.subject,
      scheduledAt: this.newExam.startTime, // Raw string like '2026-02-16T17:45'
      startTime: this.newExam.startTime,
      endTime: this.newExam.endTime,
      durationMinutes: this.newExam.duration,
      securityLevel: this.newExam.security.aiProctor ? 'High' : 'Medium',
      groupIds: this.newExam.groupIds,
      status: 'Scheduled'
    };
    this.apiService.createExam(examData).subscribe({
      next: (exam) => {
        this.exams.unshift({
          id: exam.id,
          title: exam.title,
          subject: exam.subject,
          date: new Date(exam.start_time).toLocaleString(),
          candidates: exam.assignedGroupsCount ? `${exam.assignedGroupsCount} Groups` : '--',
          status: exam.status || 'Scheduled',
          security: exam.securityLevel
        });

        this.closeModal();
        this.switchView('exams');
        this.resetExamForm();
      },
      error: (err) => console.error('Error creating exam:', err)
    });
  }

  resetExamForm() {
    const toLocalISO = (date: Date) => {
      // Return YYYY-MM-DDTHH:mm representing the "wall clock" time
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour later

    this.newExam = {
      title: '',
      subject: 'Computer Science',
      startTime: toLocalISO(start),
      endTime: toLocalISO(end),
      duration: 60,
      security: {
        browserLock: true,
        aiProctor: true
      },
      groupIds: []
    };
  }

  toggleGroupSelection(groupId: string, event: any) {
    if (event.target.checked) {
      this.newExam.groupIds.push(groupId);
    } else {
      this.newExam.groupIds = this.newExam.groupIds.filter(id => id !== groupId);
    }
  }

  get filteredStudents() {
    if (!this.searchTerm) return this.studentData;
    const term = this.searchTerm.toLowerCase();
    return this.studentData.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.id.toString().includes(term) ||
      s.dept.toLowerCase().includes(term)
    );
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'status active';
      case 'Examining': return 'status grading';
      case 'Blocked': return 'status scheduled';
      default: return 'status draft';
    }
  }

  getEventIcon(eventType: string): string {
    switch (eventType) {
      case 'tab_switch': return 'fa-solid fa-arrow-right-arrow-left';
      case 'focus_loss': return 'fa-solid fa-eye-slash';
      case 'face_warning': return 'fa-solid fa-face-frown';
      case 'copy_attempt': return 'fa-solid fa-copy';
      case 'right_click': return 'fa-solid fa-computer-mouse';
      case 'devtools': return 'fa-solid fa-code';
      default: return 'fa-solid fa-triangle-exclamation';
    }
  }

  logout() {
    this.authService.logout();
    window.location.href = '/';
  }
}