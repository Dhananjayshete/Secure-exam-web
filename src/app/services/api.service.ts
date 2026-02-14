import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ApiService {

    private baseUrl = '/api';

    constructor(private http: HttpClient) { }

    // ==========================================
    // HELPER: Get auth headers
    // ==========================================
    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('jwt_token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        });
    }

    // ==========================================
    // AUTH
    // ==========================================
    register(data: { name: string; email: string; password: string; role: string; specialId?: string }): Observable<any> {
        return this.http.post(`${this.baseUrl}/auth/register`, data);
    }

    login(email: string, password: string, role: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/auth/login`, { email, password, role });
    }

    getProfile(): Observable<any> {
        return this.http.get(`${this.baseUrl}/auth/me`, { headers: this.getHeaders() });
    }

    // ==========================================
    // USERS
    // ==========================================
    getUsers(role?: string, search?: string): Observable<any[]> {
        let params = '';
        const parts: string[] = [];
        if (role) parts.push(`role=${role}`);
        if (search) parts.push(`search=${encodeURIComponent(search)}`);
        if (parts.length) params = '?' + parts.join('&');

        return this.http.get<any[]>(`${this.baseUrl}/users${params}`, { headers: this.getHeaders() });
    }

    getUserStats(): Observable<any> {
        return this.http.get(`${this.baseUrl}/users/stats`, { headers: this.getHeaders() });
    }

    updateUserStatus(userId: string, status: string): Observable<any> {
        return this.http.patch(`${this.baseUrl}/users/${userId}/status`, { status }, { headers: this.getHeaders() });
    }

    updatePassword(userId: string, oldPassword: string, newPassword: string): Observable<any> {
        return this.http.patch(`${this.baseUrl}/users/${userId}/password`, { oldPassword, newPassword }, { headers: this.getHeaders() });
    }

    // ==========================================
    // EXAMS
    // ==========================================
    getExams(status?: string): Observable<any[]> {
        const params = status ? `?status=${status}` : '';
        return this.http.get<any[]>(`${this.baseUrl}/exams${params}`, { headers: this.getHeaders() });
    }

    getExam(id: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/exams/${id}`, { headers: this.getHeaders() });
    }

    createExam(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/exams`, data, { headers: this.getHeaders() });
    }

    updateExam(id: string, data: any): Observable<any> {
        return this.http.patch(`${this.baseUrl}/exams/${id}`, data, { headers: this.getHeaders() });
    }

    submitExam(examId: string, score: number, grade: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/exams/${examId}/submit`, { score, grade }, { headers: this.getHeaders() });
    }

    getStudentResults(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/exams/student/results`, { headers: this.getHeaders() });
    }

    // ==========================================
    // GROUPS
    // ==========================================
    getGroups(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/groups`, { headers: this.getHeaders() });
    }

    createGroup(name: string, batchYear: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/groups`, { name, batchYear }, { headers: this.getHeaders() });
    }

    getGroupMembers(groupId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/groups/${groupId}/members`, { headers: this.getHeaders() });
    }

    addGroupMembers(groupId: string, userIds: string[]): Observable<any> {
        return this.http.post(`${this.baseUrl}/groups/${groupId}/members`, { userIds }, { headers: this.getHeaders() });
    }

    // ==========================================
    // SUPPORT TICKETS
    // ==========================================
    createTicket(subject: string, message: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/tickets`, { subject, message }, { headers: this.getHeaders() });
    }

    getTickets(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/tickets`, { headers: this.getHeaders() });
    }

    getTicketReplies(ticketId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/tickets/${ticketId}/replies`, { headers: this.getHeaders() });
    }

    addTicketReply(ticketId: string, message: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/tickets/${ticketId}/replies`, { message }, { headers: this.getHeaders() });
    }

    // ==========================================
    // QUESTIONS & ANSWERS
    // ==========================================
    getQuestions(examId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/exams/${examId}/questions`, { headers: this.getHeaders() });
    }

    createQuestion(examId: string, data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/exams/${examId}/questions`, data, { headers: this.getHeaders() });
    }

    updateQuestion(questionId: string, data: any): Observable<any> {
        return this.http.patch(`${this.baseUrl}/questions/${questionId}`, data, { headers: this.getHeaders() });
    }

    deleteQuestion(questionId: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/questions/${questionId}`, { headers: this.getHeaders() });
    }

    submitAnswers(examId: string, answers: any[]): Observable<any> {
        return this.http.post(`${this.baseUrl}/exams/${examId}/answers`, { answers }, { headers: this.getHeaders() });
    }

    getAnswers(examId: string, studentId?: string): Observable<any[]> {
        const params = studentId ? `?studentId=${studentId}` : '';
        return this.http.get<any[]>(`${this.baseUrl}/exams/${examId}/answers${params}`, { headers: this.getHeaders() });
    }

    // ==========================================
    // PROCTORING
    // ==========================================
    logProctoringEvent(examId: string, eventType: string, details?: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/exams/${examId}/proctoring`, { eventType, details }, { headers: this.getHeaders() });
    }

    getProctoringEvents(examId: string, studentId?: string): Observable<any[]> {
        const params = studentId ? `?studentId=${studentId}` : '';
        return this.http.get<any[]>(`${this.baseUrl}/exams/${examId}/proctoring${params}`, { headers: this.getHeaders() });
    }

    getProctoringEventsSummary(examId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/exams/${examId}/proctoring/summary`, { headers: this.getHeaders() });
    }

    // ==========================================
    // EXAM-GROUP ASSIGNMENT
    // ==========================================
    assignGroupToExam(groupId: string, examId: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/groups/${groupId}/assign-exam`, { examId }, { headers: this.getHeaders() });
    }

    // ==========================================
    // TOKEN MANAGEMENT
    // ==========================================
    saveToken(token: string): void {
        localStorage.setItem('jwt_token', token);
    }

    saveUser(user: any): void {
        localStorage.setItem('current_user', JSON.stringify(user));
    }

    getToken(): string | null {
        return localStorage.getItem('jwt_token');
    }

    getCurrentUser(): any {
        const raw = localStorage.getItem('current_user');
        return raw ? JSON.parse(raw) : null;
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    logout(): void {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('current_user');
    }
}
