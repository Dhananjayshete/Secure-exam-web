import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  
  pageType: string = 'student'; // Default
  searchTerm: string = '';
  selectedUser: any = null; // For the popup
  isModalOpen: boolean = false;
  
  displayedUsers: any[] = []; // This holds the data we see on screen

  // --- MOCK DATA FOR STUDENTS ---
  studentData = [
      { id: '2024001', name: 'Aarav Sharma', email: 'aarav@exam.com', batch: '2024-25', dept: 'CS', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Aarav+Sharma&background=e0e7ff&color=4338ca' },
      { id: '2024002', name: 'Ananya Iyer', email: 'ananya@exam.com', batch: '2024-25', dept: 'IT', status: 'Examining', photo: 'https://ui-avatars.com/api/?name=Ananya+Iyer&background=fce7f3&color=db2777' },
      { id: '2024003', name: 'Rohan Verma', email: 'rohan.verma@exam.com', batch: '2024-25', dept: 'Mech', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Rohan+Verma&background=dcfce7&color=15803d' },
      { id: '2024004', name: 'Priya Nair', email: 'priya.nair@exam.com', batch: '2024-25', dept: 'Civil', status: 'Blocked', photo: 'https://ui-avatars.com/api/?name=Priya+Nair&background=fee2e2&color=dc2626' },
      { id: '2024005', name: 'Karan Malhotra', email: 'karan@exam.com', batch: '2024-25', dept: 'ECE', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Karan+Malhotra&background=e0e7ff&color=4338ca' },
    
      { id: '2024006', name: 'Sneha Reddy', email: 'sneha@exam.com', batch: '2024-25', dept: 'CS', status: 'Examining', photo: 'https://ui-avatars.com/api/?name=Sneha+Reddy&background=fce7f3&color=db2777' },
      { id: '2024007', name: 'Vikram Singh', email: 'vikram@exam.com', batch: '2024-25', dept: 'IT', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Vikram+Singh&background=dcfce7&color=15803d' },
      { id: '2024008', name: 'Neha Gupta', email: 'neha@exam.com', batch: '2024-25', dept: 'Civil', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Neha+Gupta&background=e0e7ff&color=4338ca' },
      { id: '2024009', name: 'Rahul Mehta', email: 'rahul@exam.com', batch: '2024-25', dept: 'Mech', status: 'Blocked', photo: 'https://ui-avatars.com/api/?name=Rahul+Mehta&background=fee2e2&color=dc2626' },
      { id: '2024010', name: 'Pooja Kulkarni', email: 'pooja@exam.com', batch: '2024-25', dept: 'ECE', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Pooja+Kulkarni&background=fce7f3&color=db2777' },
    
      { id: '2024011', name: 'Aditya Joshi', email: 'aditya@exam.com', batch: '2023-24', dept: 'CS', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Aditya+Joshi&background=e0e7ff&color=4338ca' },
      { id: '2024012', name: 'Kavya Menon', email: 'kavya@exam.com', batch: '2023-24', dept: 'IT', status: 'Examining', photo: 'https://ui-avatars.com/api/?name=Kavya+Menon&background=fce7f3&color=db2777' },
      { id: '2024013', name: 'Suresh Yadav', email: 'suresh@exam.com', batch: '2023-24', dept: 'Mech', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Suresh+Yadav&background=dcfce7&color=15803d' },
      { id: '2024014', name: 'Aishwarya Rao', email: 'aishwarya@exam.com', batch: '2023-24', dept: 'Civil', status: 'Blocked', photo: 'https://ui-avatars.com/api/?name=Aishwarya+Rao&background=fee2e2&color=dc2626' },
      { id: '2024015', name: 'Manish Pandey', email: 'manish@exam.com', batch: '2023-24', dept: 'ECE', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Manish+Pandey&background=e0e7ff&color=4338ca' },
    
      { id: '2024016', name: 'Ritu Saxena', email: 'ritu@exam.com', batch: '2023-24', dept: 'CS', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Ritu+Saxena&background=fce7f3&color=db2777' },
      { id: '2024017', name: 'Amit Choudhary', email: 'amit@exam.com', batch: '2023-24', dept: 'IT', status: 'Examining', photo: 'https://ui-avatars.com/api/?name=Amit+Choudhary&background=e0e7ff&color=4338ca' },
      { id: '2024018', name: 'Nidhi Bansal', email: 'nidhi@exam.com', batch: '2023-24', dept: 'Civil', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Nidhi+Bansal&background=dcfce7&color=15803d' },
      { id: '2024019', name: 'Deepak Mishra', email: 'deepak@exam.com', batch: '2023-24', dept: 'Mech', status: 'Blocked', photo: 'https://ui-avatars.com/api/?name=Deepak+Mishra&background=fee2e2&color=dc2626' },
      { id: '2024020', name: 'Shreya Banerjee', email: 'shreya@exam.com', batch: '2023-24', dept: 'ECE', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Shreya+Banerjee&background=fce7f3&color=db2777' },
    
      // ---- AUTO-GENERATED CONTINUATION ----
      // Same pattern, unique IDs, valid data
    
      { id: '2024021', name: 'Rakesh Kumar', email: 'rakesh@exam.com', batch: '2022-23', dept: 'CS', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Rakesh+Kumar&background=e0e7ff&color=4338ca' },
      { id: '2024022', name: 'Meera Joshi', email: 'meera@exam.com', batch: '2022-23', dept: 'IT', status: 'Examining', photo: 'https://ui-avatars.com/api/?name=Meera+Joshi&background=fce7f3&color=db2777' },
      { id: '2024023', name: 'Sanjay Patel', email: 'sanjay@exam.com', batch: '2022-23', dept: 'Civil', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Sanjay+Patel&background=dcfce7&color=15803d' },
      { id: '2024024', name: 'Pallavi Deshmukh', email: 'pallavi@exam.com', batch: '2022-23', dept: 'ECE', status: 'Blocked', photo: 'https://ui-avatars.com/api/?name=Pallavi+Deshmukh&background=fee2e2&color=dc2626' },
    
      // … entries continue cleanly …
    
      { id: '2024099', name: 'Tanishq Arora', email: 'tanishq@exam.com', batch: '2021-22', dept: 'Mech', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Tanishq+Arora&background=e0e7ff&color=4338ca' },
      { id: '2024100', name: 'Isha Kapoor', email: 'isha@exam.com', batch: '2021-22', dept: 'CS', status: 'Examining', photo: 'https://ui-avatars.com/api/?name=Isha+Kapoor&background=fce7f3&color=db2777' },
      { id: '2024001', name: 'Aarav Sharma', email: 'aarav@exam.com', batch: '2024-25', dept: 'CS', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Aarav+Sharma' },
  { id: '2024002', name: 'Ananya Iyer', email: 'ananya@exam.com', batch: '2024-25', dept: 'IT', status: 'Examining', photo: 'https://ui-avatars.com/api/?name=Ananya+Iyer' },
  { id: '2024003', name: 'Rohan Verma', email: 'rohan@exam.com', batch: '2024-25', dept: 'Mech', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Rohan+Verma' },
  { id: '2024004', name: 'Priya Nair', email: 'priya@exam.com', batch: '2024-25', dept: 'Civil', status: 'Blocked', photo: 'https://ui-avatars.com/api/?name=Priya+Nair' },
  { id: '2024005', name: 'Karan Malhotra', email: 'karan@exam.com', batch: '2024-25', dept: 'ECE', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Karan+Malhotra' },

  { id: '2024006', name: 'Sneha Reddy', email: 'sneha@exam.com', batch: '2024-25', dept: 'CS', status: 'Examining', photo: 'https://ui-avatars.com/api/?name=Sneha+Reddy' },
  { id: '2024007', name: 'Vikram Singh', email: 'vikram@exam.com', batch: '2024-25', dept: 'IT', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Vikram+Singh' },
  { id: '2024008', name: 'Neha Gupta', email: 'neha@exam.com', batch: '2024-25', dept: 'Civil', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Neha+Gupta' },
  { id: '2024009', name: 'Rahul Mehta', email: 'rahul@exam.com', batch: '2024-25', dept: 'Mech', status: 'Blocked', photo: 'https://ui-avatars.com/api/?name=Rahul+Mehta' },
  { id: '2024010', name: 'Pooja Kulkarni', email: 'pooja@exam.com', batch: '2024-25', dept: 'ECE', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Pooja+Kulkarni' },

  { id: '2024011', name: 'Aditya Joshi', email: 'aditya@exam.com', batch: '2023-24', dept: 'CS', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Aditya+Joshi' },
  { id: '2024012', name: 'Kavya Menon', email: 'kavya@exam.com', batch: '2023-24', dept: 'IT', status: 'Examining', photo: 'https://ui-avatars.com/api/?name=Kavya+Menon' },
  { id: '2024013', name: 'Suresh Yadav', email: 'suresh@exam.com', batch: '2023-24', dept: 'Mech', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Suresh+Yadav' },
  { id: '2024014', name: 'Aishwarya Rao', email: 'aishwarya@exam.com', batch: '2023-24', dept: 'Civil', status: 'Blocked', photo: 'https://ui-avatars.com/api/?name=Aishwarya+Rao' },
  { id: '2024015', name: 'Manish Pandey', email: 'manish@exam.com', batch: '2023-24', dept: 'ECE', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Manish+Pandey' },

  { id: '2024016', name: 'Ritu Saxena', email: 'ritu@exam.com', batch: '2023-24', dept: 'CS', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Ritu+Saxena' },
  { id: '2024017', name: 'Amit Choudhary', email: 'amit@exam.com', batch: '2023-24', dept: 'IT', status: 'Examining', photo: 'https://ui-avatars.com/api/?name=Amit+Choudhary' },
  { id: '2024018', name: 'Nidhi Bansal', email: 'nidhi@exam.com', batch: '2023-24', dept: 'Civil', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Nidhi+Bansal' },
  { id: '2024019', name: 'Deepak Mishra', email: 'deepak@exam.com', batch: '2023-24', dept: 'Mech', status: 'Blocked', photo: 'https://ui-avatars.com/api/?name=Deepak+Mishra' },
  { id: '2024020', name: 'Shreya Banerjee', email: 'shreya@exam.com', batch: '2023-24', dept: 'ECE', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Shreya+Banerjee' },

  { id: '2024021', name: 'Rakesh Kumar', email: 'rakesh@exam.com', batch: '2022-23', dept: 'CS', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Rakesh+Kumar' },
  { id: '2024022', name: 'Meera Joshi', email: 'meera@exam.com', batch: '2022-23', dept: 'IT', status: 'Examining', photo: 'https://ui-avatars.com/api/?name=Meera+Joshi' },
  { id: '2024023', name: 'Sanjay Patel', email: 'sanjay@exam.com', batch: '2022-23', dept: 'Civil', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Sanjay+Patel' },
  { id: '2024024', name: 'Pallavi Deshmukh', email: 'pallavi@exam.com', batch: '2022-23', dept: 'ECE', status: 'Blocked', photo: 'https://ui-avatars.com/api/?name=Pallavi+Deshmukh' },

  // … entries continue uniformly …

  { id: '2024099', name: 'Tanishq Arora', email: 'tanishq@exam.com', batch: '2021-22', dept: 'Mech', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Tanishq+Arora' },
  { id: '2024100', name: 'Isha Kapoor', email: 'isha@exam.com', batch: '2021-22', dept: 'CS', status: 'Examining', photo: 'https://ui-avatars.com/api/?name=Isha+Kapoor' }
    ];
    

  // --- MOCK DATA FOR ADMINS ---
  adminData = [
    { id: 'ADM-101', name: 'Dr. Robert', email: 'robert@college.com', batch: 'Staff', dept: 'Dean', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Robert&background=1e293b&color=fff' },
    { id: 'ADM-102', name: 'Prof. Lisa', email: 'lisa@college.com', batch: 'Faculty', dept: 'Exam Cell', status: 'Active', photo: 'https://ui-avatars.com/api/?name=Lisa&background=334155&color=fff' },
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Check URL: Are we in 'students' or 'staff'?
    this.route.data.subscribe(data => {
      this.pageType = data['type'] || 'student';
      
      if(this.pageType === 'admin') {
        this.displayedUsers = this.adminData;
      } else {
        this.displayedUsers = this.studentData;
      }
    });
  }

  // Search Filter
  get filteredUsers() {
    return this.displayedUsers.filter(user => 
      user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.id.includes(this.searchTerm)
    );
  }

  // Modal Functions
  openModal(user: any) { this.selectedUser = user; this.isModalOpen = true; }
  closeModal() { this.isModalOpen = false; this.selectedUser = null; }
}