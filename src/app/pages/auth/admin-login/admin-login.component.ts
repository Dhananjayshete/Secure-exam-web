import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
// Make sure this path is correct for your project
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']   
})
export class AdminLoginComponent {
  
  loginData = {
    email: '',
    password: ''
  };

  showPassword = false; // Toggle for password visibility
  isLoading = false;    // Loading state for button

  constructor(private authService: AuthService, private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  handleLogin() {
    if (!this.loginData.email || !this.loginData.password) {
      alert('Please fill in all fields');
      return;
    }

    this.isLoading = true; // Start loading animation

    // Simulate a network delay for better UX (optional)
    setTimeout(() => {
      const isValid = this.authService.login(
        this.loginData.email, 
        this.loginData.password, 
        'admin'
      );

      this.isLoading = false; // Stop loading

      if (isValid) {
        this.router.navigate(['/admin-dashboard']); 
      } else {
        alert('Invalid Credentials! Access Denied.');
      }
    }, 1000);
  }
}