import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebar } from '../../sidebar/admin-sidebar/admin-sidebar.component'; 

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterOutlet, AdminSidebar], 
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {

}