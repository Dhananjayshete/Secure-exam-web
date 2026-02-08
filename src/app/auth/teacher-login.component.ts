import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-teacher-login',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './teacher-login.component.html',
  styleUrls: ['./teacher-login.component.scss']   
})
export class TeacherLoginComponent {
  
  loginData = {
    email: '',
    password: ''
  };

  showPassword = false;
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  handleLogin() {
    if (!this.loginData.email || !this.loginData.password) {
      alert('Please fill in all fields');
      return;
    }

    this.isLoading = true;

    // Simulate network delay for smooth UX
    setTimeout(() => {
      const isValid = this.authService.login(
        this.loginData.email, 
        this.loginData.password, 
        'teacher' 
      );

      this.isLoading = false;

      if (isValid) {
        this.router.navigate(['/teacher-dashboard']); 
      } else {
        alert('Invalid Credentials! Please register as a Teacher first.');
      }
    }, 1000);
  }
}