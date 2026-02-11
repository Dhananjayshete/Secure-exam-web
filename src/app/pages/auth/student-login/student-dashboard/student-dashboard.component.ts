import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent {

  // =============================================================
  // 1. DASHBOARD STATE
  // =============================================================
  currentView: string = 'dashboard'; 
  isExamActive: boolean = false;     
  timerDisplay: string = '60:00';    
  private timerInterval: any;        

  // =============================================================
  // 2. STUDENT DATA
  // =============================================================
  studentProfile = {
    name: 'Rahul Sharma',
    rollNo: 'CS-2024-001',
    email: 'rahul@securetake.com',
    phone: '+91 98765 43210',
    avatar: 'https://ui-avatars.com/api/?name=Rahul+Sharma&background=0D8ABC&color=fff'
  };

  // =============================================================
  // 3. TABLE DATA (Based on your requirements)
  // =============================================================
  
  // Dashboard Overview Stats
  stats = {
    total: 5,
    upcoming: 2,
    completed: 3,
    latestScore: '88%'
  };

  // Upcoming Exams Page
  upcomingExams = [
    { name: 'Java Test', date: '12 Feb', time: '10:00 AM', duration: '60 min', status: 'Ready' },
    { name: 'Data Structures', date: '14 Feb', time: '02:00 PM', duration: '90 min', status: 'Locked' }
  ];

  // Exam History Page
  examHistory = [
    { name: 'Aptitude Test', date: '10 Jan 2024', status: 'Completed' },
    { name: 'English Lang', date: '05 Jan 2024', status: 'Completed' }
  ];

  // Results Page
  results = [
    { exam: 'Aptitude Test', score: '45/50', grade: 'Pass' },
    { exam: 'English Lang', score: '30/50', grade: 'Pass' }
  ];

  // =============================================================
  // 4. FORMS DATA
  // =============================================================
  passwordForm = { old: '', new: '', confirm: '' };
  ticketForm = { subject: '', message: '' };

  // =============================================================
  // 5. FUNCTIONS
  // =============================================================

  switchView(viewName: string) {
    this.currentView = viewName;
  }

  // --- Exam Security Logic ---
  startExam(status: string) {
    if (status === 'Locked') {
      alert("This exam is not yet active.");
      return;
    }
    // Simulation of System Check
    if(confirm("System Check: Webcam OK, Mic OK. Start Exam?")) {
      this.isExamActive = true;
      this.enterFullscreen();
      this.startTimer();
    }
  }

  submitExam() {
    if(confirm("Are you sure you want to submit?")) {
      this.isExamActive = false;
      this.exitFullscreen();
      clearInterval(this.timerInterval);
      alert("Exam Submitted Successfully!");
      this.switchView('results'); // Redirect to results
    }
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
    if(this.passwordForm.new !== this.passwordForm.confirm) {
      alert("Passwords do not match!");
      return;
    }
    alert("Password updated successfully.");
  }

  submitTicket() {
    alert("Support ticket raised. ID: #TK-9988");
    this.ticketForm = { subject: '', message: '' };
  }

  logout() {
    alert("Ending Session...");
  }
}