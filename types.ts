export type Grade = string;

export type UserRole = "admin" | "teacher";

export interface User {
  id: string;
  username: string;
  password?: string; // Only used for auth checks, not exposed in UI
  name: string;
  role: UserRole;
  campus?: "Boys" | "Girls" | "Both"; // Added campus assignment
  assignedSubjects?: string[]; // Subject IDs the teacher can manage
  assignedClasses?: string[]; // "Class-Section" IDs (e.g. "10-A")
}

// New Separate Teacher Entity
export interface Teacher {
  id: string;
  name: string;
  campus: "Boys" | "Girls" | "Both";
}

export interface Session {
  id: string;
  name: string; // e.g., "2024-2025"
  startDate: string;
  isActive: boolean;
  isLocked?: boolean; // If true, session is read-only
}

export interface SchoolClass {
  id: string; // "className-section" normalized
  className: string;
  section: string;
  classTeacherId?: string; // ID of the User (Homeroom Teacher) - legacy single-campus field
  classTeacherName?: string; // Cached Name - legacy single-campus field
  // New: per-campus homeroom teacher overrides (when campus === 'Both')
  classTeacherBoysId?: string;
  classTeacherBoysName?: string;
  classTeacherGirlsId?: string;
  classTeacherGirlsName?: string;
  sessionId: string;
  subjectIds?: string[]; // IDs of subjects taught in this class
  campus?: "Boys" | "Girls" | "Both"; // Optional campus for gender-based classes
  // two-dimensional mapping of subject -> teacher overrides
  subjectTeachers?: { subjectId: string; teacherName: string }[];
}

export interface GradingRule {
  label: string; // e.g. "A+"
  minPercentage: number; // e.g. 90
}

export interface ClassAttendance {
  id: string; // "Class-Section"
  className: string;
  section: string;
  totalDays: number;
  sessionId: string; // Scoped to session
  examTermId?: string; // Scoped to Exam Term
}

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  campus: "Boys" | "Girls";
  className: string;
  section: string;
  parentPhone?: string; // Optional now
  attendancePresent?: number;
  attendanceTotal?: number; // Deprecated in favor of ClassAttendance, kept for fallback
  attendancePercentage?: number;
  sessionId: string; // Scoped to session
}

export interface Subject {
  id: string;
  name: string;
  totalMarks: number;
  teacherName?: string; // Default teacher
  // Optional component split (theory + practical) for subjects like Computer
  components?: {
    theory?: number;
    practical?: number;
  };
}

// New Interface for Class-Wise Subject Teachers
export interface ClassSubjectTeacher {
  id: string; // Unique ID
  className: string;
  section: string;
  subjectId: string;
  teacherName: string;
  sessionId: string; // Scoped to session
}

export interface ExamTerm {
  id: string;
  name: string;
  term?: string; // e.g., "Term 1", "Term 2", "Midterm", "Final"
  isLocked: boolean;
  sessionId: string; // Scoped to session
}

export interface MarkEntry {
  studentId: string;
  subjectId: string;
  examTermId: string;
  // For backwards compatibility we keep obtainedMarks optional and introduce theory/practical
  obtainedMarks?: number;
  theoryMarks?: number;
  practicalMarks?: number;
  sessionId: string; // Scoped to session
  isFinalized?: boolean;
}

export interface StudentResult {
  student: Student;
  // Marks can be a simple number or a component object (theory/practical)
  marks: {
    [subjectId: string]: number | { theory?: number; practical?: number };
  };
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: Grade;
  rank: number;
  positionSuffix?: string; // e.g. "st", "nd"
  classAttendanceTotal?: number; // Injected during calculation
  attendance?: {
    present: number;
    total: number;
    percentage: number;
  };
}

export interface AuditLogEntry {
  id: string;
  createdAt?: string;
  timestamp?: string;
  action: string;
  description?: string;
  details?: string;
  user?: string;
  userId?: string;
  userName?: string;
  role?: UserRole;
}

export interface ChartData {
  name: string;
  value: number;
}
