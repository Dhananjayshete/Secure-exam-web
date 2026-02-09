import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Required for [(ngModel)]

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  // We import CommonModule for *ngIf/*ngFor and FormsModule for inputs
  imports: [CommonModule, FormsModule], 
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.scss']
})
export class TeacherDashboardComponent {

  // --- 1. DASHBOARD STATE (Variables that control the UI) ---
  currentView: string = 'dashboard'; // Which tab is currently open?
  searchTerm: string = '';           // What is typed in the search bar?
  isModalOpen: boolean = false;      // Is the "Create Exam" popup open?

  // --- 2. DATA FOR "EXAM MANAGER" TAB ---
  exams = [
    { id: 1, title: 'CS101: Data Structures', subject: 'Computer Science', date: 'Today, 10:00 AM', candidates: '45/50', status: 'Live', security: 'High' },
    { id: 2, title: 'MATH202: Linear Algebra', subject: 'Mathematics', date: 'Tomorrow, 09:00 AM', candidates: '--', status: 'Scheduled', security: 'Medium' },
    { id: 3, title: 'PHY300: Quantum Mechanics', subject: 'Physics', date: 'Oct 28, 02:00 PM', candidates: '--', status: 'Draft', security: 'High' }
  ];

  // --- 3. DATA FOR "LIVE MONITOR" TAB (Mock Cameras) ---
  liveStudents = [
    { name: 'Sarah J.', status: 'good', img: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200' },
    { name: 'Mike T.', status: 'flagged', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' },
    { name: 'Emily R.', status: 'good', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200' },
    { name: 'John D.', status: 'flagged', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200' },
    { name: 'David B.', status: 'good', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
    { name: 'Lisa K.', status: 'good', img: 'https://images.unsplash.com/photo-1554151228-14d9def656ec?w=200' }
  ];

  // --- 4. DATA FOR "STUDENTS" TAB (Your Custom Data) ---
  studentData = [
    { id: '2024001', name: 'Aarav Sharma', email: 'aarav@exam.com', batch: '2024-25', dept: 'CS', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Aarav+Sharma&background=e0e7ff&color=4338ca' },
    { id: '2024002', name: 'Ananya Iyer', email: 'ananya@exam.com', batch: '2024-25', dept: 'IT', status: 'Examining', photo: 'https://ui-avatars.com/api/?name=Ananya+Iyer&background=fce7f3&color=db2777' },
    { id: '2024003', name: 'Rohan Verma', email: 'rohan.verma@exam.com', batch: '2024-25', dept: 'Mech', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Rohan+Verma&background=dcfce7&color=15803d' },
    { id: '2024004', name: 'Priya Nair', email: 'priya.nair@exam.com', batch: '2024-25', dept: 'Civil', status: 'Blocked', photo: 'https://ui-avatars.com/api/?name=Priya+Nair&background=fee2e2&color=dc2626' },
    { id: '2024005', name: 'Karan Malhotra', email: 'karan@exam.com', batch: '2024-25', dept: 'ECE', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Karan+Malhotra&background=e0e7ff&color=4338ca' },
    { id: '2024006', name: 'Sneha Reddy', email: 'sneha@exam.com', batch: '2024-25', dept: 'CS', status: 'Examining', photo: 'https://ui-avatars.com/api/?name=Sneha+Reddy&background=fce7f3&color=db2777' },
    { id: '2024007', name: 'Vikram Singh', email: 'vikram@exam.com', batch: '2024-25', dept: 'IT', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Vikram+Singh&background=dcfce7&color=15803d' },
    // ... You can add the rest of your 100+ students here ...
  ];

  // --- 5. FORM DATA (For the "Create Exam" Modal) ---
  newExam = {
    title: '',
    subject: 'Computer Science',
    duration: 60,
    security: {
      browserLock: true,
      aiProctor: true
    }
  };

  // --- 6. HELPER FUNCTIONS (Logic that makes things work) ---

  // Function: Switches the visible tab
  switchView(viewName: string) {
    this.currentView = viewName;
  }

  // Function: Opens the popup
  openModal() {
    this.isModalOpen = true;
  }

  // Function: Closes the popup
  closeModal() {
    this.isModalOpen = false;
  }

  // Function: Saves the new exam (Adds it to the top of the list)
  createExam() {
    this.exams.unshift({
      id: Date.now(),
      title: this.newExam.title || 'Untitled Exam',
      subject: this.newExam.subject,
      date: 'Just Now',
      candidates: '--',
      status: 'Scheduled',
      security: this.newExam.security.browserLock ? 'High' : 'Low'
    });
    
    this.closeModal(); // Close popup
    this.switchView('exams'); // Go to exams page to see it
    
    // Reset the form for next time
    this.newExam.title = '';
  }

  // Function: Handles the Search Bar Logic
  // It checks if the Name OR ID OR Dept matches what you typed
  get filteredStudents() {
    if (!this.searchTerm) return this.studentData; // If empty, show all

    const term = this.searchTerm.toLowerCase();
    return this.studentData.filter(s => 
      s.name.toLowerCase().includes(term) || 
      s.id.includes(term) ||
      s.dept.toLowerCase().includes(term)
    );
  }

  // Function: Returns the CSS class for different statuses (Green/Red/Blue)
  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'status active';      // Green
      case 'Examining': return 'status grading';  // Blue
      case 'Blocked': return 'status scheduled';  // Orange/Red
      default: return 'status draft';             // Gray
    }
  }

  logout() {
    alert("Logging out...");
  }
}