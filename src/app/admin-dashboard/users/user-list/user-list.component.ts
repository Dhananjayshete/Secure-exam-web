import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  pageType: string = 'student';
  searchTerm: string = '';
  selectedUser: any = null;
  isModalOpen: boolean = false;
  isLoading: boolean = true;

  displayedUsers: any[] = [];

  constructor(private route: ActivatedRoute, private apiService: ApiService) { }

  ngOnInit() {
    this.route.data.subscribe((data: any) => {
      this.pageType = data['type'] || 'student';
      this.loadUsers();
    });
  }

  loadUsers() {
    this.isLoading = true;
    const role = this.pageType === 'admin' ? 'admin' : 'student';

    this.apiService.getUsers(role).subscribe({
      next: (users) => {
        this.displayedUsers = users.map(u => ({
          id: u.specialId || u.id,
          name: u.name,
          email: u.email,
          batch: u.batch || 'N/A',
          dept: u.dept || 'N/A',
          status: u.status,
          photo: u.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isLoading = false;
      }
    });
  }

  // Search Filter
  get filteredUsers() {
    if (!this.searchTerm) return this.displayedUsers;
    return this.displayedUsers.filter(user =>
      user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.id.toString().includes(this.searchTerm)
    );
  }

  // Modal Functions
  openModal(user: any) { this.selectedUser = user; this.isModalOpen = true; }
  closeModal() { this.isModalOpen = false; this.selectedUser = null; }
}