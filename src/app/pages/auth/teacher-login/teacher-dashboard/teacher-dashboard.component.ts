import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Teacher Dashboard 👨‍🏫</h2>
    <p>Welcome Teacher</p>
  `,
  styleUrls: ['./teacher-dashboard.component.scss']
})
export class TeacherDashboardComponent implements OnInit {
  ngOnInit() {
    console.log('Teacher Dashboard Loaded');
  }
}
