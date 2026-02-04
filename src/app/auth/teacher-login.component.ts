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
  
  isLoading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  handleLogin() {
    // Basic validation
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const isValid = this.authService.login(
      this.loginData.email, 
      this.loginData.password, 
      'teacher'
    );

    this.isLoading = false;

    if (isValid) {
      this.router.navigate(['/teacher-dashboard']);
    } else {
      this.errorMessage = 'Invalid Email or Password! Please register as teacher first.';
    }
  }
}