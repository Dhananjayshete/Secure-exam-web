import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = '/api/auth';

  constructor(private http: HttpClient) { }

  // 0. CAPTCHA
  getCaptcha(): Observable<any> {
    return this.http.get(`${this.apiUrl}/captcha`);
  }

  // 1. REGISTER USER — Sends data to backend
  registerUser(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, {
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      specialId: user.specialId
    }).pipe(
      map((response: any) => {
        // Auto-save token on registration
        if (response.token) {
          localStorage.setItem('jwt_token', response.token);
          localStorage.setItem('current_user', JSON.stringify(response.user));
        }
        return response;
      })
    );
  }

  // 2. LOGIN — Verifies credentials via backend
  login(email: string, pass: string, role: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, {
      email,
      password: pass,
      role
    }).pipe(
      map((response: any) => {
        // Save token and user data
        if (response.token) {
          localStorage.setItem('jwt_token', response.token);
          localStorage.setItem('current_user', JSON.stringify(response.user));
        }
        return response;
      })
    );
  }

  // 3. GET CURRENT USER
  getCurrentUser(): any {
    const raw = localStorage.getItem('current_user');
    return raw ? JSON.parse(raw) : null;
  }

  // 4. CHECK IF LOGGED IN
  isLoggedIn(): boolean {
    return !!localStorage.getItem('jwt_token');
  }

  // 5. LOGOUT
  logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_user');
  }

  // 6. UPDATE LOCAL USER DATA
  updateUser(user: any): void {
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  // 7. GET TOKEN
  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }
}