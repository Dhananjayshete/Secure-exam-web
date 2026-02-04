import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <--- Import this
import { AuthService } from '../../services/auth.service'; // <--- Import the Service

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule], // <--- Add FormsModule
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  activeRole: string = 'student';
  showSuccessPopup: boolean = false;

  // Variables to hold form data
  formData = {
    fullName: '',
    email: '',
    password: '',
    specialId: '' // Student ID, Teacher ID, or Admin Code
  };

  constructor(private authService: AuthService, private router: Router) {}

  setRole(role: string) {
    this.activeRole = role;
  }

  onSubmit(event: Event) {
    event.preventDefault();

    // 1. Prepare the data to save
    const newUser = {
      name: this.formData.fullName,
      email: this.formData.email,
      password: this.formData.password,
      role: this.activeRole,
      specialId: this.formData.specialId
    };

    // 2. Send to the Service (Save to LocalStorage)
    this.authService.registerUser(newUser);

    // 3. Show Success Popup
    this.showSuccessPopup = true;

    // 4. Close popup after 2 seconds
    setTimeout(() => {
      this.showSuccessPopup = false;
    }, 2000);
  }

  closePopup() {
    this.showSuccessPopup = false;
  }
}