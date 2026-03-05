import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';

@Component({
    selector: 'app-security-logs',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './security-logs.component.html',
    styleUrl: './security-logs.component.scss'
})
export class SecurityLogsComponent implements OnInit {

    logs: any[] = [];
    filteredLogs: any[] = [];
    searchTerm = '';
    selectedType = 'all';
    isLoading = true;

    totalEvents = 0;
    suspiciousCount = 0;
    loginCount = 0;
    blockedCount = 0;

    logTypes = [
        { value: 'all', label: 'All Events' },
        { value: 'login', label: 'Logins' },
        { value: 'logout', label: 'Logouts' },
        { value: 'tab_switch', label: 'Tab Switch' },
        { value: 'focus_loss', label: 'Focus Loss' },
        { value: 'camera_off', label: 'Camera Off' },
        { value: 'blocked', label: 'Blocked Access' },
    ];

    constructor(private apiService: ApiService) { }

    ngOnInit() { this.loadLogs(); }

    loadLogs() {
        this.isLoading = true;
        this.apiService.getSecurityLogs().subscribe({
            next: (data: any) => {
                this.logs = data;
                this.filteredLogs = data;
                this.calculateStats();
                this.isLoading = false;
            },
            error: () => {
                this.logs = this.getMockLogs();
                this.filteredLogs = this.logs;
                this.calculateStats();
                this.isLoading = false;
            }
        });
    }

    calculateStats() {
        this.totalEvents = this.logs.length;
        this.suspiciousCount = this.logs.filter(l => ['tab_switch', 'focus_loss', 'camera_off'].includes(l.event_type)).length;
        this.loginCount = this.logs.filter(l => l.event_type === 'login').length;
        this.blockedCount = this.logs.filter(l => l.event_type === 'blocked').length;
    }

    applyFilter() {
        let data = this.logs;
        if (this.selectedType !== 'all') data = data.filter(l => l.event_type === this.selectedType);
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            data = data.filter(l =>
                l.user_name?.toLowerCase().includes(term) ||
                l.details?.toLowerCase().includes(term) ||
                l.ip_address?.includes(term)
            );
        }
        this.filteredLogs = data;
    }

    getSeverity(eventType: string): string {
        if (['tab_switch', 'focus_loss', 'camera_off', 'blocked'].includes(eventType)) return 'high';
        if (eventType === 'logout') return 'medium';
        return 'low';
    }

    getEventIcon(eventType: string): string {
        const icons: Record<string, string> = {
            login: 'fa-right-to-bracket', logout: 'fa-right-from-bracket',
            tab_switch: 'fa-arrow-right-arrow-left', focus_loss: 'fa-eye-slash',
            camera_off: 'fa-video-slash', blocked: 'fa-ban',
        };
        return icons[eventType] || 'fa-circle-info';
    }

    clearLogs() {
        if (confirm('Clear all security logs? This cannot be undone.')) {
            this.logs = [];
            this.filteredLogs = [];
            this.calculateStats();
        }
    }

    getMockLogs() {
        const now = new Date();
        const mins = (m: number) => new Date(now.getTime() - m * 60000);
        return [
            { id: 1, user_name: 'alex', event_type: 'login', details: 'Successful login', ip_address: '192.168.1.10', timestamp: mins(2) },
            { id: 2, user_name: 'sarah', event_type: 'tab_switch', details: 'Switched tab during exam', ip_address: '192.168.1.14', timestamp: mins(5) },
            { id: 3, user_name: 'mike', event_type: 'camera_off', details: 'Camera turned off', ip_address: '192.168.1.22', timestamp: mins(8) },
            { id: 4, user_name: 'emily', event_type: 'login', details: 'Successful login', ip_address: '10.0.0.5', timestamp: mins(15) },
            { id: 5, user_name: 'tom', event_type: 'focus_loss', details: 'Window lost focus 3x', ip_address: '192.168.1.33', timestamp: mins(20) },
            { id: 6, user_name: 'unknown', event_type: 'blocked', details: 'Failed login attempt x5', ip_address: '45.33.12.99', timestamp: mins(35) },
            { id: 7, user_name: 'alex', event_type: 'logout', details: 'User logged out', ip_address: '192.168.1.10', timestamp: mins(60) },
        ];
    }
}
