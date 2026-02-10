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

  // ==========================================
  // 1. DASHBOARD SETTINGS
  // ==========================================
  currentView: string = 'dashboard'; // Tells the app which tab to show
  isExamActive: boolean = false;     // Is the student currently taking an exam?
  timerDisplay: string = '60:00';    // Shows the time on the screen
  private timerInterval: any;        // Internal variable to count seconds

  // ==========================================
  // 2. STUDENT DATA (Mock Data)
  // ==========================================
  studentProfile = {
    name: 'Rahul Sharma',
    course: 'CS Batch 2024',
    email: 'rahul@securetake.com',
    phone: '+91 98765 43210',
    avatar: 'https://ui-avatars.com/api/?name=Rahul+Sharma&background=0D8ABC&color=fff'
  };

  // ==========================================
  // 3. EXAM HISTORY DATA
  // ==========================================
  examHistory = [
    { title: 'Java Programming L1', date: '10 Oct 2024', score: '45/50', status: 'Passed' },
    { title: 'Database Systems', date: '05 Sep 2024', score: '85%', status: 'Passed' }
  ];

  // ==========================================
  // 4. FUNCTIONS (Button Clicks)
  // ==========================================

  // Switch between Dashboard, Exams, Profile, etc.
  switchView(viewName: string) {
    this.currentView = viewName;
  }

  // Logic to Start the Exam
  startExam() {
    if(confirm("Ready to start? Fullscreen mode will be enabled.")) {
      this.isExamActive = true;  // Show exam screen
      this.enterFullscreen();    // Go full screen
      this.startTimer();         // Start countdown
    }
  }

  // Logic to Submit the Exam
  submitExam() {
    if(confirm("Submit your exam? This cannot be undone.")) {
      this.isExamActive = false; // Hide exam screen
      this.exitFullscreen();     // Exit full screen
      clearInterval(this.timerInterval); // Stop timer
      alert("Exam Submitted! Good luck.");
      this.switchView('dashboard'); // Go back to home
    }
  }

  // Simple Countdown Timer
  startTimer() {
    let time = 3600; // 60 minutes in seconds
    this.timerInterval = setInterval(() => {
      let m = Math.floor(time / 60);
      let s = time % 60;
      this.timerDisplay = `${m}:${s < 10 ? '0' : ''}${s}`;
      time--;
      if (time < 0) {
        this.submitExam(); // Auto-submit if time runs out
      }
    }, 1000);
  }

  // Helper: Turn on Fullscreen
  enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
  }

  // Helper: Turn off Fullscreen
  exitFullscreen() {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}