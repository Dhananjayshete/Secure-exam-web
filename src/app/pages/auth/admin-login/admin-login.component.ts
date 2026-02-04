import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
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

  constructor(private authService: AuthService, private router: Router) {}

  // The function that runs when you click your Login button
  handleLogin() {
    // 1. Check with AuthService if this Admin exists
    const isValid = this.authService.login(
      this.loginData.email, 
      this.loginData.password, 
      'admin' // We strictly check for 'admin' role
    );

    if (isValid) {
      alert('Login Successful!');
      this.router.navigate(['/admin-dashboard']); // Go to dashboard
    } else {
      alert('Invalid Email or Password! Please register as Admin first.');
    }
  }
}