import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';

@Component({
    selector: 'app-results-reports',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './results-reports.component.html',
    styleUrl: './results-reports.component.scss'
})
export class ResultsReportsComponent implements OnInit {

    results: any[] = [];
    filteredResults: any[] = [];
    searchTerm = '';
    selectedExam = 'all';
    exams: any[] = [];
    isLoading = true;

    totalAttempts = 0;
    passCount = 0;
    failCount = 0;
    avgScore = 0;

    constructor(private apiService: ApiService) { }

    ngOnInit() {
        this.loadResults();
    }

    loadResults() {
        this.isLoading = true;
        this.apiService.getAllResults().subscribe({
            next: (data: any) => {
                this.results = data;
                this.filteredResults = data;
                this.calculateStats();
                this.extractExams();
                this.isLoading = false;
            },
            error: () => {
                this.results = this.getMockResults();
                this.filteredResults = this.results;
                this.calculateStats();
                this.extractExams();
                this.isLoading = false;
            }
        });
    }

    calculateStats() {
        this.totalAttempts = this.results.length;
        this.passCount = this.results.filter(r => r.passed).length;
        this.failCount = this.totalAttempts - this.passCount;
        this.avgScore = this.totalAttempts > 0
            ? Math.round(this.results.reduce((sum, r) => sum + (r.score || 0), 0) / this.totalAttempts)
            : 0;
    }

    extractExams() {
        const examMap = new Map();
        this.results.forEach(r => {
            if (r.exam_id && r.exam_title) examMap.set(r.exam_id, r.exam_title);
        });
        this.exams = Array.from(examMap.entries()).map(([id, title]) => ({ id, title }));
    }

    applyFilter() {
        let data = this.results;
        if (this.selectedExam !== 'all') {
            data = data.filter(r => r.exam_id == this.selectedExam);
        }
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            data = data.filter(r =>
                r.student_name?.toLowerCase().includes(term) ||
                r.exam_title?.toLowerCase().includes(term)
            );
        }
        this.filteredResults = data;
    }

    exportCSV() {
        const headers = ['Student', 'Exam', 'Score', 'Total', 'Percentage', 'Status', 'Date'];
        const rows = this.filteredResults.map(r => [
            r.student_name, r.exam_title, r.score, r.total_marks,
            r.percentage + '%', r.passed ? 'Pass' : 'Fail',
            new Date(r.submitted_at).toLocaleDateString()
        ]);
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exam-results.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    getPassRate(): number {
        if (this.totalAttempts === 0) return 0;
        return Math.round((this.passCount / this.totalAttempts) * 100);
    }

    getMockResults() {
        return [
            { id: 1, student_name: 'Alex Johnson', exam_title: 'Math Final', exam_id: 1, score: 85, total_marks: 100, percentage: 85, passed: true, submitted_at: new Date() },
            { id: 2, student_name: 'Sarah Williams', exam_title: 'Math Final', exam_id: 1, score: 42, total_marks: 100, percentage: 42, passed: false, submitted_at: new Date() },
            { id: 3, student_name: 'Mike Brown', exam_title: 'Science Quiz', exam_id: 2, score: 78, total_marks: 100, percentage: 78, passed: true, submitted_at: new Date() },
            { id: 4, student_name: 'Emily Davis', exam_title: 'Science Quiz', exam_id: 2, score: 91, total_marks: 100, percentage: 91, passed: true, submitted_at: new Date() },
            { id: 5, student_name: 'Tom Wilson', exam_title: 'History Test', exam_id: 3, score: 55, total_marks: 100, percentage: 55, passed: true, submitted_at: new Date() },
        ];
    }
}
