import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-admin-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-settings.component.html',
    styleUrl: './admin-settings.component.scss'
})
export class AdminSettingsComponent implements OnInit {

    activeTab = 'general';
    siteName = 'SecureExam';
    supportEmail = 'admin@secureexam.com';
    timezone = 'Asia/Kolkata';
    defaultDuration = 60;
    passingMarks = 50;
    allowLateSubmission = false;
    autoSubmit = true;
    maxAttempts = 1;
    enableProctoring = true;
    blockTabSwitch = true;
    blockCopyPaste = true;
    requireCamera = false;
    maxTabSwitches = 3;
    emailOnResult = true;
    emailOnLogin = false;
    emailOnSuspicious = true;
    saveSuccess = false;
    isSaving = false;

    tabs = [
        { id: 'general', label: 'General', icon: 'fa-gear' },
        { id: 'exam', label: 'Exam', icon: 'fa-file-pen' },
        { id: 'security', label: 'Security', icon: 'fa-shield-halved' },
        { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
    ];

    ngOnInit() {
        const saved = localStorage.getItem('adminSettings');
        if (saved) Object.assign(this, JSON.parse(saved));
    }

    saveSettings() {
        this.isSaving = true;
        const settings = {
            siteName: this.siteName, supportEmail: this.supportEmail, timezone: this.timezone,
            defaultDuration: this.defaultDuration, passingMarks: this.passingMarks,
            allowLateSubmission: this.allowLateSubmission, autoSubmit: this.autoSubmit,
            maxAttempts: this.maxAttempts, enableProctoring: this.enableProctoring,
            blockTabSwitch: this.blockTabSwitch, blockCopyPaste: this.blockCopyPaste,
            requireCamera: this.requireCamera, maxTabSwitches: this.maxTabSwitches,
            emailOnResult: this.emailOnResult, emailOnLogin: this.emailOnLogin,
            emailOnSuspicious: this.emailOnSuspicious,
        };
        localStorage.setItem('adminSettings', JSON.stringify(settings));
        setTimeout(() => {
            this.isSaving = false;
            this.saveSuccess = true;
            setTimeout(() => this.saveSuccess = false, 3000);
        }, 800);
    }

    resetDefaults() {
        if (confirm('Reset all settings to default values?')) {
            localStorage.removeItem('adminSettings');
            window.location.reload();
        }
    }
}
