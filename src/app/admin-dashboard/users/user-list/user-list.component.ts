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

  // Admin Action State
  isActionLoading: boolean = false;
  newPasswordForReset: string = '';

  constructor(private route: ActivatedRoute, private apiService: ApiService) { }

  ngOnInit() {
    this.route.data.subscribe((data: any) => {
      this.pageType = data['type'] || 'student';
      this.loadUsers();
    });
  }

  loadUsers() {
    this.isLoading = true;
    let role = 'student';
    if (this.pageType === 'admin') role = 'admin';
    else if (this.pageType === 'teacher') role = 'teacher';

    this.apiService.getUsers(role).subscribe({
      next: (users) => {
        this.displayedUsers = users.map(u => ({
          realId: u.id,
          id: u.specialId || u.id,
          name: u.name,
          email: u.email,
          role: u.role,
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
  closeModal() { this.isModalOpen = false; this.selectedUser = null; this.newPasswordForReset = ''; }

  // Admin Actions
  updateStatus(status: string) {
    if (!this.selectedUser || this.isActionLoading) return;
    this.isActionLoading = true;
    this.apiService.updateUserStatus(this.selectedUser.realId, status).subscribe({
      next: () => {
        this.selectedUser.status = status;
        this.loadUsers();
        this.isActionLoading = false;
        alert('Status updated to ' + status);
      },
      error: (err) => {
        console.error(err);
        this.isActionLoading = false;
        alert('Failed to update status.');
      }
    });
  }

  changeRole(role: string) {
    if (!this.selectedUser || this.isActionLoading) return;
    this.isActionLoading = true;
    this.apiService.updateUserRole(this.selectedUser.realId, role).subscribe({
      next: () => {
        this.loadUsers();
        this.isActionLoading = false;
        this.closeModal();
        alert('Role changed to ' + role);
      },
      error: (err) => {
        console.error(err);
        this.isActionLoading = false;
        alert('Failed to change role.');
      }
    });
  }

  resetPassword() {
    if (!this.selectedUser || !this.newPasswordForReset || this.isActionLoading) return;
    this.isActionLoading = true;
    this.apiService.resetUserPassword(this.selectedUser.realId, this.newPasswordForReset).subscribe({
      next: (res) => {
        this.isActionLoading = false;
        this.newPasswordForReset = '';
        alert(res.message);
      },
      error: (err) => {
        console.error(err);
        this.isActionLoading = false;
        alert('Failed to reset password.');
      }
    });
  }
}