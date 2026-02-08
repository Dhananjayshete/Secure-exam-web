import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
// Ensure path is correct
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-login',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './student-login.component.html',
  styleUrls: ['./student-login.component.scss']   
})
export class StudentLoginComponent {
  
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

    // Simulate network delay
    setTimeout(() => {
      const isValid = this.authService.login(
        this.loginData.email, 
        this.loginData.password, 
        'student' 
      );

      this.isLoading = false;

      if (isValid) {
        this.router.navigate(['/student-dashboard']); 
      } else {
        alert('Invalid Email or Password! Please register first.');
      }
    }, 1000);
  }
}