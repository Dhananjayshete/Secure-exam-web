import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
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

  constructor(private authService: AuthService, private router: Router) {}

  // The function that runs when you click your Login button
  handleLogin() {
    // 1. Check with AuthService if this Admin exists
    const isValid = this.authService.login(
      this.loginData.email, 
      this.loginData.password, 
      'student' // We strictly check for 'admin' role
    );

    if (isValid) {
      alert('Login Successful!');
      this.router.navigate(['/student-dashboard']); // Go to dashboard
    } else {
      alert('Invalid Email or Password! Please register as Student first.');
    }
  }
}