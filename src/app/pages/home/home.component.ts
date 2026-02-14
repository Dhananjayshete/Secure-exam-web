import { Component, HostListener } from '@angular/core'; // Added HostListener
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// 1. Define the Interface here
interface Subject {
  title: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  // ============================================
  // SECTION 1: PERSONA TABS LOGIC
  // ============================================
  
  activePersona: string = 'admin'; 

  personaData: any = {
    admin: {
      title: "Manage at Scale",
      desc: "Control access, manage billing, and generate institution-wide compliance reports.",
      img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop",
      features: [
        "Bulk student import via CSV",
        "Role-based access control",
        "LMS Integration (Canvas, Moodle)"
      ]
    },
    teacher: {
      title: "Create in Minutes",
      desc: "Use our rich text editor or AI question generator to build exams effortlessly.",
      img: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1000&auto=format&fit=crop",
      features: [
        "Question Bank Management",
        "Auto-shuffling & Randomization",
        "Manual grading for essays"
      ]
    },
    student: {
      title: "Focus on Results",
      desc: "A distraction-free interface that saves progress automatically.",
      img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop",
      features: [
        "Resume where you left off",
        "Instant score feedback",
        "Offline support"
      ]
    }
  };

  setPersona(role: string) {
    this.activePersona = role;
  }


  // ============================================
  // SECTION 2: SUBJECTS MODAL LOGIC
  // ============================================

  selectedSubject: Subject | null = null;

  subjects: Subject[] = [
    { 
      title: 'Computer Science', 
      icon: 'fa-code', 
      description: 'Master core programming concepts including algorithms, data structures, object-oriented design, and problem-solving techniques within a secure coding environment.' 
    },
    { 
      title: 'Mathematics', 
      icon: 'fa-calculator', 
      description: 'Develop strong analytical and quantitative skills through assessments that support complex mathematical expressions, equations, and graphical problem solving.' 
    },
    { 
      title: 'Chemistry', 
      icon: 'fa-flask', 
      description: 'Assess understanding of chemical principles, reactions, and scientific notation with full support for formulas, equations, and symbolic representation.' 
    },
    { 
      title: 'Literature', 
      icon: 'fa-book-open', 
      description: 'Evaluate reading comprehension, critical analysis, and written communication skills through structured passages, essays, and descriptive responses.' 
    },
    { 
      title: 'Law', 
      icon: 'fa-gavel', 
      description: 'Designed for case-based reasoning and theoretical examination, the platform supports detailed legal analysis, judgment writing, and statutory interpretation.' 
    },
    { 
      title: 'Medical', 
      icon: 'fa-stethoscope', 
      description: 'Facilitates accurate assessment of clinical knowledge, medical terminology, and diagnostic reasoning through image-based and scenario-driven questions.' 
    },
    { 
      title: 'Arts & Design', 
      icon: 'fa-palette', 
      description: 'Encourage creativity and conceptual expression through assessments that allow visual submissions, design theory questions, and portfolio-based evaluation.' 
    },
    { 
      title: 'Languages', 
      icon: 'fa-globe', 
      description: 'Test communication proficiency across multiple languages with comprehensive support for reading, writing, grammar, and vocabulary evaluation.' 
    }
  ];

  // Logic for Subject Cards
  openModal(subject: Subject) {
    this.selectedSubject = subject;
    document.body.style.overflow = 'hidden'; 
  }

  closeModal() {
    this.selectedSubject = null;
    document.body.style.overflow = 'auto'; 
  }

  // ============================================
  // SECTION 3: FOOTER & ABOUT MODAL LOGIC (New)
  // ============================================

  isFooterModalOpen = false; // Renamed to avoid conflict
  footerModalTitle = '';
  footerModalContent = '';

  footerContent: any = {
    features: `
      Explore our premium AI monitoring suite.
      <div class="feature-grid">
        <div class="f-item"><i class="fa-solid fa-eye"></i> Eye Tracking</div>
        <div class="f-item"><i class="fa-solid fa-ban"></i> Browser Lock</div>
        <div class="f-item"><i class="fa-solid fa-id-card"></i> ID Verification</div>
        <div class="f-item"><i class="fa-solid fa-chart-line"></i> AI Analytics</div>
        <div class="f-item"><i class="fa-solid fa-microphone"></i> Audio Monitoring</div>
        <div class="f-item"><i class="fa-solid fa-face-smile"></i> Emotion Detection</div>
      </div>
      <div class="stats">
        <div class="stat"><strong>99.9%</strong>Accuracy</div>
        <div class="stat"><strong>150+</strong>Institutions</div>
        <div class="stat"><strong>1M+</strong>Exams</div>
      </div>`,

    integrations: `
      <div class="feature-grid">
        <div class="f-item"><i class="fa-brands fa-google"></i> Google Classroom</div>
        <div class="f-item"><i class="fa-brands fa-microsoft"></i> Microsoft Teams</div>
        <div class="f-item"><i class="fa-solid fa-graduation-cap"></i> Moodle LMS</div>
        <div class="f-item"><i class="fa-solid fa-book"></i> Canvas LMS</div>
      </div>`,

    roadmap: `
      <div class="feature-grid">
        <div class="f-item"><i class="fa-solid fa-robot"></i> Advanced AI Detection</div>
        <div class="f-item"><i class="fa-solid fa-globe"></i> Global Data Centers</div>
        <div class="f-item"><i class="fa-solid fa-shield"></i> Biometric Security</div>
        <div class="f-item"><i class="fa-solid fa-mobile-screen"></i> Mobile App</div>
      </div>`,

    about: `SecureTake is redefining online examination integrity using cutting-edge AI technology trusted by institutions worldwide.`,

    careers: `
      Join our mission to secure digital education.<br><br>
      • AI Engineers<br>
      • Frontend Developers<br>
      • Security Analysts`,

    contact: `
      Email: support@securetake.ai<br>
      Phone: +1 800 123 4567<br>
      Headquarters: Silicon Valley, CA`,

    privacy: `We prioritize data protection and compliance with international privacy standards.`,
    terms: `By using SecureTake, you agree to our compliance policies and fair usage terms.`,
    gdpr: `We comply with GDPR regulations ensuring transparency and user data protection.`
  };

  // Renamed to openFooterModal to differentiate from Subject Modal
  openFooterModal(type: string) {
    this.footerModalTitle = type.charAt(0).toUpperCase() + type.slice(1);
    this.footerModalContent = this.footerContent[type];
    this.isFooterModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  // Renamed to closeFooterModal
  closeFooterModal() {
    this.isFooterModalOpen = false;
    document.body.style.overflow = 'auto'; 
  }

  // ============================================
  // SECTION 4: GLOBAL UTILS
  // ============================================

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth'
    });
  }

  // Handles Escape key for BOTH Modals
  @HostListener('document:keydown.escape')
  handleEscape() {
    this.closeModal();       // Closes Subject Modal
    this.closeFooterModal(); // Closes Footer Modal
  }

}