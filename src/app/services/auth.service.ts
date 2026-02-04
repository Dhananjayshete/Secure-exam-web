import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private storageKey = 'school_users';

  constructor() {}

  // 1. SAVE USER (Used in Registration)
  registerUser(user: any) {
    // Get existing users or start empty list
    let users = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    
    // Add the new user to the list
    users.push(user);
    
    // Save it back to LocalStorage
    localStorage.setItem(this.storageKey, JSON.stringify(users));
  }

  // 2. CHECK USER (Used in Login)
  login(email: string, pass: string, role: string): boolean {
    let users = JSON.parse(localStorage.getItem(this.storageKey) || '[]');

    // Find a user that matches Email AND Password AND Role
    const foundUser = users.find((u: any) => 
      u.email === email && 
      u.password === pass && 
      u.role === role
    );

    return !!foundUser; // Returns true if found, false if not
  }
}