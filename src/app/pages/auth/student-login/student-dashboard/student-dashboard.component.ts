import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Student Dashboard 🎓</h2>
    <p>Welcome Student</p>
  `,
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit {
  ngOnInit() {
    console.log('Student Dashboard Loaded');
  }
}
