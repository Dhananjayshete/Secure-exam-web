import { Component, OnInit } from '@angular/core';
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
export class RegisterComponent implements OnInit {
  activeRole: string = 'student';
  showSuccessPopup: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  captchaData: any = null;
  captchaInput: string = '';

  formData = {
    fullName: '',
    email: '',
    password: '',
    specialId: ''
  };

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    this.refreshCaptcha();
  }

  refreshCaptcha() {
    this.authService.getCaptcha().subscribe({
      next: (data) => {
        this.captchaData = data;
        this.captchaInput = '';
      },
      error: (err) => console.error('Captcha error:', err)
    });
  }

  setRole(role: string) {
    this.activeRole = role;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage = '';

    // 1. Frontend CAPTCHA validation
    const input = this.captchaInput.trim().toLowerCase();
    const actual = this.captchaData?.text?.trim().toLowerCase();

    if (input !== actual) {
      this.errorMessage = 'Incorrect CAPTCHA, please try again.';
      this.refreshCaptcha();
      return;
    }

    this.isLoading = true;

    const newUser = {
      name: this.formData.fullName,
      email: this.formData.email,
      password: this.formData.password,
      role: this.activeRole,
      specialId: this.formData.specialId,
      captcha: this.captchaInput.trim(),
      captchaId: this.captchaData?.id
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

        // Refresh captcha if it was a captcha error or if we want to be safe
        if (this.errorMessage.toLowerCase().includes('captcha')) {
          this.refreshCaptcha();
        }
      }
    });
  }

  closePopup() {
    this.showSuccessPopup = false;
  }
}