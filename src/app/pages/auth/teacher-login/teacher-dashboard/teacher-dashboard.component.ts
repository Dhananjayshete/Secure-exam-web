import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';
import { AuthService } from '../../../../services/auth.service';

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
  proctoringEvents: any[] = [];

  // --- 3. QUESTION MANAGEMENT ---
  selectedExamId: string = '';
  selectedExamTitle: string = '';
  questions: any[] = [];
  isQuestionsLoading: boolean = false;
  newQuestion = {
    questionText: '',
    questionType: 'MCQ',
    points: 2,
    options: [
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false }
    ]
  };

  // --- 4. FORM DATA ---
  newExam = {
    title: '',
    subject: 'Computer Science',
    duration: 60,
    security: {
      browserLock: true,
      aiProctor: true
    }
  };

  // --- 5. LIVE MONITORING ---
  monitorExamId: string = '';

  constructor(private apiService: ApiService, private authService: AuthService) { }

  ngOnInit() {
    this.loadExams();
    this.loadStudents();
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

    this.apiService.getProctoringEventsSummary(this.monitorExamId).subscribe({
      next: (students) => {
        this.liveStudents = students.map(s => ({
          name: s.name,
          status: s.status,
          img: s.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=0D8ABC&color=fff`,
          flagCount: s.flagCount
        }));
      },
      error: (err) => console.error('Error loading proctoring summary:', err)
    });

    this.apiService.getProctoringEvents(this.monitorExamId).subscribe({
      next: (events) => {
        this.proctoringEvents = events.map(e => ({
          time: new Date(e.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          studentName: e.studentName,
          eventType: e.eventType,
          details: e.details
        }));
      },
      error: (err) => console.error('Error loading proctoring events:', err)
    });
  }

  // --- HELPER FUNCTIONS ---
  switchView(viewName: string) {
    this.currentView = viewName;
    if (viewName === 'monitor' && this.monitorExamId) {
      this.loadProctoringData();
    }
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  createExam() {
    this.apiService.createExam({
      title: this.newExam.title || 'Untitled Exam',
      subject: this.newExam.subject,
      durationMinutes: this.newExam.duration,
      securityLevel: this.newExam.security.browserLock ? 'High' : 'Low'
    }).subscribe({
      next: (exam) => {
        this.exams.unshift({
          id: exam.id,
          title: exam.title,
          subject: exam.subject,
          date: 'Just Now',
          candidates: '--',
          status: exam.status || 'Scheduled',
          security: exam.securityLevel
        });

        this.closeModal();
        this.switchView('exams');
        this.newExam.title = '';
      },
      error: (err) => console.error('Error creating exam:', err)
    });
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