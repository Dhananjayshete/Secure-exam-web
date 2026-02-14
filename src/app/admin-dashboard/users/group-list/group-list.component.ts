import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss']
})
export class GroupListComponent implements OnInit {
  groups: any[] = [];
  isLoading: boolean = true;

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    this.isLoading = true;
    this.apiService.getGroups().subscribe({
      next: (groups) => {
        this.groups = groups;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading groups:', err);
        this.isLoading = false;
      }
    });
  }
}