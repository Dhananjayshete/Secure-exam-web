import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  activeRole: string = 'student';
  showSuccessPopup: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  formData = {
    fullName: '',
    email: '',
    password: '',
    specialId: ''
  };

  constructor(private authService: AuthService, private router: Router) { }

  setRole(role: string) {
    this.activeRole = role;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage = '';
    this.isLoading = true;

    const newUser = {
      name: this.formData.fullName,
      email: this.formData.email,
      password: this.formData.password,
      role: this.activeRole,
      specialId: this.formData.specialId
    };

    this.authService.registerUser(newUser).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showSuccessPopup = true;

        setTimeout(() => {
          this.showSuccessPopup = false;
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Registration failed. Please try again.';
      }
    });
  }

  closePopup() {
    this.showSuccessPopup = false;
  }
}