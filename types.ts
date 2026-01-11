
export type Grade = string;

export type UserRole = 'admin' | 'teacher';

export interface User {
  id: string;
  username: string;
  password?: string; // Only used for auth checks, not exposed in UI
  name: string;
  role: UserRole;
  campus?: 'Boys' | 'Girls' | 'Both'; // Added campus assignment
  assignedSubjects?: string[]; // Subject IDs the teacher can manage
  assignedClasses?: string[]; // "Class-Section" IDs (e.g. "10-A")
}

// New Separate Teacher Entity
export interface Teacher {
  id: string;
  name: string;
  campus: 'Boys' | 'Girls' | 'Both';
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
  classTeacherId?: string; // ID of the User (Homeroom Teacher)
  classTeacherName?: string; // Cached Name
  sessionId: string;
  subjectIds?: string[]; // IDs of subjects taught in this class
}

export interface GradingRule {
  label: string;       // e.g. "A+"
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
  campus: 'Boys' | 'Girls';
  className: string;
  section: string;
  parentPhone?: string; // Optional now
  attendancePresent?: number; 
  attendanceTotal?: number;   // Deprecated in favor of ClassAttendance, kept for fallback
  attendancePercentage?: number; 
  sessionId: string; // Scoped to session
}

export interface Subject {
  id: string;
  name: string;
  totalMarks: number;
  teacherName?: string; // Default teacher
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
  isLocked: boolean;
  sessionId: string; // Scoped to session
}

export interface MarkEntry {
  studentId: string;
  subjectId: string;
  examTermId: string;
  obtainedMarks: number;
  sessionId: string; // Scoped to session
}

export interface StudentResult {
  student: Student;
  marks: { [subjectId: string]: number };
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
  timestamp: string;
  action: string;
  details: string;
  userId: string;
  userName: string;
  role: UserRole;
}

export interface ChartData {
  name: string;
  value: number;
}
