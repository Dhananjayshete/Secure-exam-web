import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// 1. Define the Interface here (Outside the class)
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
  
  // Track Active Persona (Default to Admin)
  activePersona: string = 'admin'; 

  // Data for the 3 Personas
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

  // Function to switch persona
  setPersona(role: string) {
    this.activePersona = role;
  }


  // ============================================
  // SECTION 2: SUBJECTS MODAL LOGIC
  // ============================================

  // Variable to track the currently clicked subject
  selectedSubject: Subject | null = null;

  // Data Array for the cards
  subjects: Subject[] = [
    { 
      title: 'Computer Science', 
      icon: 'fa-code', 
      description: 'Master core programming concepts including algorithms, data structures, object-oriented design, and problem-solving techniques within a secure coding environment. Our platform supports multiple programming languages such as Python, Java, C++, and JavaScript with built-in syntax highlighting, real-time code editing, and automated evaluation. Candidates can confidently attempt coding challenges, debugging exercises, and logic-based assessments while the system ensures integrity through anti-cheating mechanisms and controlled execution environments.' 
    },
    { 
      title: 'Mathematics', 
      icon: 'fa-calculator', 
      description: 'Develop strong analytical and quantitative skills through assessments that support complex mathematical expressions, equations, and graphical problem solving. The platform enables the use of advanced formula editors, numerical computation, and step-based evaluation methods. From algebra and calculus to logical reasoning and statistics, candidates can solve structured and objective questions with precise formatting and automated scoring.' 
    },
    { 
      title: 'Chemistry', 
      icon: 'fa-flask', 
      description: 'Assess understanding of chemical principles, reactions, and scientific notation with full support for formulas, equations, and symbolic representation. The system allows clear display of molecular structures, reaction mechanisms, and laboratory-based problem scenarios. Both objective and descriptive formats help evaluate conceptual knowledge and application skills in organic, inorganic, and physical chemistry.' 
    },
    { 
      title: 'Literature', 
      icon: 'fa-book-open', 
      description: 'Evaluate reading comprehension, critical analysis, and written communication skills through structured passages, essays, and descriptive responses. The platform provides a distraction-free writing interface that supports long-form answers, grammar-focused questions, and textual interpretation tasks. Optional integrity features help maintain originality and fair assessment standards.' 
    },
    { 
      title: 'Law', 
      icon: 'fa-gavel', 
      description: 'Designed for case-based reasoning and theoretical examination, the platform supports detailed legal analysis, judgment writing, and statutory interpretation. Candidates can respond to complex legal scenarios, long descriptive questions, and timed aptitude tests within a secure environment that ensures confidentiality and structured evaluation workflows.' 
    },
    { 
      title: 'Medical', 
      icon: 'fa-stethoscope', 
      description: 'Facilitates accurate assessment of clinical knowledge, medical terminology, and diagnostic reasoning through image-based and scenario-driven questions. The system supports anatomy diagrams, case studies, and objective tests that measure practical understanding. Secure monitoring ensures reliable evaluation for healthcare-related examinations.' 
    },
    { 
      title: 'Arts & Design', 
      icon: 'fa-palette', 
      description: 'Encourage creativity and conceptual expression through assessments that allow visual submissions, design theory questions, and portfolio-based evaluation. Candidates can upload artwork, sketches, or digital designs while reviewers can assess originality, technique, and conceptual understanding through structured feedback tools.' 
    },
    { 
      title: 'Languages', 
      icon: 'fa-globe', 
      description: 'Test communication proficiency across multiple languages with comprehensive support for reading, writing, grammar, and vocabulary evaluation. The platform enables descriptive responses, comprehension passages, and optional audio-based assessments to measure pronunciation and listening skills in a secure testing environment.' 
    }
  ];

  // Function to Open Modal
  openModal(subject: Subject) {
    this.selectedSubject = subject;
    document.body.style.overflow = 'hidden'; 
  }

  // Function to Close Modal
  closeModal() {
    this.selectedSubject = null;
    document.body.style.overflow = 'auto'; 
  }

  // ============================================
  // SECTION 3: UTILS
  // ============================================
  
  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth'
    });
  }
}