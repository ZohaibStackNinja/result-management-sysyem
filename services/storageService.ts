
import { Student, Subject, ExamTerm, MarkEntry, AuditLogEntry, GradingRule, ClassSubjectTeacher, ClassAttendance, User, Session, SchoolClass, Teacher } from '../types';

// Keys
const KEYS = {
  SESSIONS: 'academix_sessions',
  STUDENTS: 'academix_students',
  SUBJECTS: 'academix_subjects',
  EXAMS: 'academix_exams',
  MARKS: 'academix_marks',
  LOGS: 'academix_logs',
  USERS: 'academix_users',
  TEACHERS: 'academix_teachers',
  GRADING: 'academix_grading_scale',
  CLASS_TEACHERS: 'academix_class_teachers',
  CLASSES: 'academix_classes',
  ATTENDANCE_CONFIG: 'academix_attendance_config',
  AUTH_TOKEN: 'academix_auth_token' // Changed from Object to Token String
};

// --- JWT SIMULATION HELPERS ---
const JWT_SECRET = "NCSS_STANDALONE_SECURE_KEY_2025_XYZ"; // Local secret for signature simulation

const b64Encode = (str: string) => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode(parseInt(p1, 16));
    })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const b64Decode = (str: string) => {
    return decodeURIComponent(atob(str.replace(/-/g, '+').replace(/_/g, '/')).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
};

const createToken = (user: User): string => {
    const header = { alg: "HS256", typ: "JWT" };
    const payload = {
        ...user,
        iat: Date.now(),
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 Hours Expiry
    };
    
    const sHeader = b64Encode(JSON.stringify(header));
    const sPayload = b64Encode(JSON.stringify(payload));
    // Simulate HMAC signature by hashing header+payload+secret
    const signature = b64Encode(sHeader + "." + sPayload + "." + JWT_SECRET);
    
    return `${sHeader}.${sPayload}.${signature}`;
};

const verifyToken = (token: string): User | null => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const [h, p, s] = parts;
        const expectedSig = b64Encode(h + "." + p + "." + JWT_SECRET);
        
        if (s !== expectedSig) {
            console.warn("Invalid Token Signature");
            return null;
        }
        
        const payload = JSON.parse(b64Decode(p));
        if (Date.now() > payload.exp) {
            console.warn("Token Expired");
            return null;
        }
        
        // Return user data sans exp/iat for the app to use
        const { iat, exp, ...user } = payload;
        return user as User;
    } catch (e) {
        return null;
    }
};

// Generic Helper
const getItems = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setItems = <T>(key: string, items: T[]) => {
  localStorage.setItem(key, JSON.stringify(items));
};

// Initial Seed & Migration Data
const seedData = () => {
  // 1. Initialize Sessions if missing
  let sessions = getItems<Session>(KEYS.SESSIONS);
  let activeSessionId = '';

  if (sessions.length === 0) {
    const currentYear = new Date().getFullYear();
    const defaultSessionId = `session-${currentYear}-${currentYear+1}`;
    const defaultSession: Session = {
        id: defaultSessionId,
        name: `${currentYear}-${currentYear+1}`,
        startDate: new Date().toISOString().split('T')[0],
        isActive: true,
        isLocked: false
    };
    sessions = [defaultSession];
    setItems(KEYS.SESSIONS, sessions);
    activeSessionId = defaultSessionId;
  } else {
    activeSessionId = sessions.find(s => s.isActive)?.id || sessions[0].id;
  }

  // 2. Migration: Assign existing data to the active session if sessionId is missing
  
  // Students
  const students = getItems<Student>(KEYS.STUDENTS);
  let studentsUpdated = false;
  const migratedStudents = students.map(s => {
      if (!s.sessionId) {
          studentsUpdated = true;
          return { ...s, sessionId: activeSessionId };
      }
      return s;
  });
  if (studentsUpdated) setItems(KEYS.STUDENTS, migratedStudents);

  // Exams
  const exams = getItems<ExamTerm>(KEYS.EXAMS);
  let examsUpdated = false;
  const migratedExams = exams.map(e => {
      if (!e.sessionId) {
          examsUpdated = true;
          return { ...e, sessionId: activeSessionId };
      }
      return e;
  });
  if (examsUpdated) setItems(KEYS.EXAMS, migratedExams);

  // Marks
  const marks = getItems<MarkEntry>(KEYS.MARKS);
  let marksUpdated = false;
  const migratedMarks = marks.map(m => {
      if (!m.sessionId) {
          marksUpdated = true;
          return { ...m, sessionId: activeSessionId };
      }
      return m;
  });
  if (marksUpdated) setItems(KEYS.MARKS, migratedMarks);

  // Attendance Config
  const att = getItems<ClassAttendance>(KEYS.ATTENDANCE_CONFIG);
  let attUpdated = false;
  const migratedAtt = att.map(a => {
      if (!a.sessionId) {
          attUpdated = true;
          return { ...a, sessionId: activeSessionId };
      }
      return a;
  });
  if (attUpdated) setItems(KEYS.ATTENDANCE_CONFIG, migratedAtt);

  // Class Teachers (Subject Teachers)
  const teachers = getItems<ClassSubjectTeacher>(KEYS.CLASS_TEACHERS);
  let teachersUpdated = false;
  const migratedTeachers = teachers.map(t => {
      if (!t.sessionId) {
          teachersUpdated = true;
          return { ...t, sessionId: activeSessionId };
      }
      return t;
  });
  if (teachersUpdated) setItems(KEYS.CLASS_TEACHERS, migratedTeachers);

  // 3. Seed Users if missing
  if (!localStorage.getItem(KEYS.USERS)) {
    const users: User[] = [
      { id: 'admin', username: 'admin', password: 'admin123', name: 'System Administrator', role: 'admin' },
      { id: 't1', username: 'teacher1', password: 'password', name: 'John Doe', role: 'teacher', campus: 'Both', assignedSubjects: ['math'], assignedClasses: ['10-A'] }
    ];
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }

  // 4. Seed Teacher List (New Feature)
  if (!localStorage.getItem(KEYS.TEACHERS)) {
      const users = getItems<User>(KEYS.USERS);
      const initialTeachers: Teacher[] = users
          .filter(u => u.role === 'teacher')
          .map(u => ({
              id: u.id, 
              name: u.name,
              campus: u.campus || 'Both'
          }));
      
      if (initialTeachers.length === 0) {
          initialTeachers.push({ id: 'def-t1', name: 'Mr. Anderson', campus: 'Both' });
          initialTeachers.push({ id: 'def-t2', name: 'Ms. Frizzle', campus: 'Girls' });
          initialTeachers.push({ id: 'def-t3', name: 'Mrs. Keating', campus: 'Boys' });
      }
      localStorage.setItem(KEYS.TEACHERS, JSON.stringify(initialTeachers));
  }

  // 5. Seed Subjects (Global) if missing
  if (!localStorage.getItem(KEYS.SUBJECTS)) {
    const subjects: Subject[] = [
      { id: 'math', name: 'Mathematics', totalMarks: 100, teacherName: 'Mr. Anderson' },
      { id: 'sci', name: 'Science', totalMarks: 100, teacherName: 'Ms. Frizzle' },
      { id: 'eng', name: 'English', totalMarks: 100, teacherName: 'Mrs. Keating' },
      { id: 'hist', name: 'History', totalMarks: 50, teacherName: 'Mr. Jones' },
    ];
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
  }

  // 6. Seed Grading (Global) if missing
  if (!localStorage.getItem(KEYS.GRADING)) {
    const defaultGrading: GradingRule[] = [
      { label: 'A+', minPercentage: 90 },
      { label: 'A', minPercentage: 80 },
      { label: 'B', minPercentage: 70 },
      { label: 'C', minPercentage: 60 },
      { label: 'D', minPercentage: 50 },
      { label: 'F', minPercentage: 0 }
    ];
    localStorage.setItem(KEYS.GRADING, JSON.stringify(defaultGrading));
  }

  // 7. Seed/Migrate Classes based on Students (If empty)
  const classes = getItems<SchoolClass>(KEYS.CLASSES);
  if (classes.length === 0 && migratedStudents.length > 0) {
      const uniqueMap = new Map<string, SchoolClass>();
      migratedStudents.forEach(s => {
          if (s.sessionId === activeSessionId) {
            const key = `${s.className.trim()}-${s.section.trim()}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, {
                    id: key.toLowerCase().replace(/\s/g, '-'),
                    className: s.className.trim(),
                    section: s.section.trim(),
                    sessionId: activeSessionId
                });
            }
          }
      });
      setItems(KEYS.CLASSES, Array.from(uniqueMap.values()));
  }

  // 8. Repair: Ensure all students have IDs (Fix for bug where IDs were missing)
  const allStudentsForFix = getItems<Student>(KEYS.STUDENTS);
  let idsFixed = false;
  const fixedStudentsList = allStudentsForFix.map((s, index) => {
      if (!s.id) {
          idsFixed = true;
          return { ...s, id: `fixed-student-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}` };
      }
      return s;
  });
  if (idsFixed) {
      setItems(KEYS.STUDENTS, fixedStudentsList);
      console.log('Fixed missing student IDs');
  }
};

seedData();


// Helper to get active session ID
const getActiveSessionId = (): string => {
    const sessions = getItems<Session>(KEYS.SESSIONS);
    const active = sessions.find(s => s.isActive);
    return active ? active.id : '';
};

// Helper to check if current session is locked
const isCurrentSessionLocked = (): boolean => {
    const sessions = getItems<Session>(KEYS.SESSIONS);
    const active = sessions.find(s => s.isActive);
    return active ? !!active.isLocked : false;
};

// API
export const storageService = {
  // --- AUTHENTICATION & USERS ---
  
  login: (username: string, pass: string): User | null => {
    const users = getItems<User>(KEYS.USERS);
    const user = users.find(u => u.username === username && u.password === pass);
    if (user) {
      // Create JWT
      const { password, ...safeUser } = user;
      const token = createToken(safeUser);
      localStorage.setItem(KEYS.AUTH_TOKEN, token);
      
      // Log Securely
      storageService.logActivity('LOGIN', `User logged in successfully`, safeUser);
      return safeUser;
    }
    return null;
  },

  logout: () => {
    const user = storageService.getCurrentUser();
    if(user) storageService.logActivity('LOGOUT', `User logged out`, user);
    localStorage.removeItem(KEYS.AUTH_TOKEN);
  },

  getCurrentUser: (): User | null => {
    const token = localStorage.getItem(KEYS.AUTH_TOKEN);
    if (!token) return null;
    return verifyToken(token);
  },

  getUsers: (): User[] => {
    const users = getItems<User>(KEYS.USERS);
    return users.map(({ password, ...u }) => u);
  },

  addUser: (user: User) => {
    const users = getItems<User>(KEYS.USERS);
    if (users.find(u => u.username === user.username)) {
      throw new Error("Username already exists");
    }
    users.push(user);
    setItems(KEYS.USERS, users);
    storageService.logActivity('CREATE_USER', `Created user: ${user.username} (${user.role})`);
  },

  updateUser: (id: string, updates: Partial<User>) => {
    const users = getItems<User>(KEYS.USERS);
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      setItems(KEYS.USERS, users);
      storageService.logActivity('UPDATE_USER', `Updated user: ${users[idx].username}`);
    }
  },
  
  deleteUser: (id: string) => {
    const users = getItems<User>(KEYS.USERS);
    const user = users.find(u => u.id === id);
    if (user && user.role !== 'admin') { 
      setItems(KEYS.USERS, users.filter(u => u.id !== id));
      storageService.logActivity('DELETE_USER', `Deleted user: ${user.username}`);
    }
  },

  changePassword: (newPassword: string) => {
    const currentUser = storageService.getCurrentUser();
    if (currentUser) {
      const users = getItems<User>(KEYS.USERS);
      const idx = users.findIndex(u => u.id === currentUser.id);
      if (idx !== -1) {
        users[idx].password = newPassword;
        setItems(KEYS.USERS, users);
        storageService.logActivity('CHANGE_PASSWORD', 'User updated own password');
      }
    }
  },

  // --- TEACHERS (SEPARATE LIST) ---
  getTeachers: (): Teacher[] => {
      return getItems<Teacher>(KEYS.TEACHERS);
  },

  addTeacher: (teacher: Teacher) => {
      const teachers = getItems<Teacher>(KEYS.TEACHERS);
      teachers.push(teacher);
      setItems(KEYS.TEACHERS, teachers);
      storageService.logActivity('ADD_TEACHER', `Added teacher to list: ${teacher.name}`);
  },

  deleteTeacher: (id: string) => {
      const teachers = getItems<Teacher>(KEYS.TEACHERS);
      const t = teachers.find(x => x.id === id);
      if(t) {
          setItems(KEYS.TEACHERS, teachers.filter(x => x.id !== id));
          storageService.logActivity('DELETE_TEACHER', `Removed teacher from list: ${t.name}`);
      }
  },

  // --- ACADEMIC SESSIONS ---
  getSessions: () => getItems<Session>(KEYS.SESSIONS),

  getActiveSession: (): Session | undefined => {
      return getItems<Session>(KEYS.SESSIONS).find(s => s.isActive);
  },

  isSessionLocked: isCurrentSessionLocked,

  createSession: (name: string) => {
      const sessions = getItems<Session>(KEYS.SESSIONS);
      const newSessionId = `session-${Date.now()}`;
      
      // Deactivate AND LOCK all others
      const updatedSessions = sessions.map(s => ({
          ...s, 
          isActive: false, 
          isLocked: true 
      }));
      
      // Create New Session
      updatedSessions.push({
          id: newSessionId,
          name: name,
          startDate: new Date().toISOString().split('T')[0],
          isActive: true,
          isLocked: false
      });
      
      setItems(KEYS.SESSIONS, updatedSessions);

      // Initialize Exams for this new session
      const exams = getItems<ExamTerm>(KEYS.EXAMS);
      exams.push({
          id: `${newSessionId}-first`,
          name: 'First Term',
          isLocked: false,
          sessionId: newSessionId
      });
      exams.push({
          id: `${newSessionId}-final`,
          name: 'Final Term',
          isLocked: false,
          sessionId: newSessionId
      });
      setItems(KEYS.EXAMS, exams);

      storageService.logActivity('CREATE_SESSION', `Created and activated new session: ${name}`);
  },

  switchSession: (sessionId: string) => {
      const sessions = getItems<Session>(KEYS.SESSIONS);
      const updated = sessions.map(s => ({...s, isActive: s.id === sessionId}));
      setItems(KEYS.SESSIONS, updated);
      storageService.logActivity('SWITCH_SESSION', `Switched active session to ID: ${sessionId}`);
  },

  toggleSessionLock: (sessionId: string) => {
      const sessions = getItems<Session>(KEYS.SESSIONS);
      const idx = sessions.findIndex(s => s.id === sessionId);
      if (idx !== -1) {
          const newState = !sessions[idx].isLocked;
          sessions[idx].isLocked = newState;
          setItems(KEYS.SESSIONS, sessions);
          storageService.logActivity('TOGGLE_SESSION_LOCK', `Set lock status of session ${sessions[idx].name} to ${newState}`);
      }
  },

  // --- LOGS ---
  getLogs: () => {
    const logs = getItems<AuditLogEntry>(KEYS.LOGS);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  
  logActivity: (action: string, details: string, forcedUser?: User) => {
    const currentUser = forcedUser || storageService.getCurrentUser();
    const logs = getItems<AuditLogEntry>(KEYS.LOGS);
    const newLog: AuditLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action,
      details,
      userId: currentUser?.id || 'system',
      userName: currentUser?.username || 'System',
      role: currentUser?.role || 'admin'
    };
    const updatedLogs = [newLog, ...logs].slice(0, 500);
    setItems(KEYS.LOGS, updatedLogs);
  },

  // --- DATA MANAGEMENT ---
  getBackupData: () => {
    return {
      sessions: localStorage.getItem(KEYS.SESSIONS),
      students: localStorage.getItem(KEYS.STUDENTS),
      subjects: localStorage.getItem(KEYS.SUBJECTS),
      exams: localStorage.getItem(KEYS.EXAMS),
      marks: localStorage.getItem(KEYS.MARKS),
      logs: localStorage.getItem(KEYS.LOGS),
      users: localStorage.getItem(KEYS.USERS),
      teachers: localStorage.getItem(KEYS.TEACHERS),
      grading: localStorage.getItem(KEYS.GRADING),
      classTeachers: localStorage.getItem(KEYS.CLASS_TEACHERS),
      attendance: localStorage.getItem(KEYS.ATTENDANCE_CONFIG),
      classes: localStorage.getItem(KEYS.CLASSES)
    };
  },

  restoreData: (json: any) => {
    if (json.sessions) localStorage.setItem(KEYS.SESSIONS, json.sessions);
    if (json.students) localStorage.setItem(KEYS.STUDENTS, json.students);
    if (json.subjects) localStorage.setItem(KEYS.SUBJECTS, json.subjects);
    if (json.exams) localStorage.setItem(KEYS.EXAMS, json.exams);
    if (json.marks) localStorage.setItem(KEYS.MARKS, json.marks);
    if (json.logs) localStorage.setItem(KEYS.LOGS, json.logs);
    if (json.users) localStorage.setItem(KEYS.USERS, json.users);
    if (json.teachers) localStorage.setItem(KEYS.TEACHERS, json.teachers);
    if (json.grading) localStorage.setItem(KEYS.GRADING, json.grading);
    if (json.classTeachers) localStorage.setItem(KEYS.CLASS_TEACHERS, json.classTeachers);
    if (json.attendance) localStorage.setItem(KEYS.ATTENDANCE_CONFIG, json.attendance);
    if (json.classes) localStorage.setItem(KEYS.CLASSES, json.classes);
  },

  // --- CLASSES (Management) ---
  getClasses: () => {
    const activeSession = getActiveSessionId();
    return getItems<SchoolClass>(KEYS.CLASSES).filter(c => c.sessionId === activeSession);
  },

  addClass: (cls: SchoolClass) => {
    if (isCurrentSessionLocked()) throw new Error("Current session is locked. Cannot add classes.");
    const activeSession = getActiveSessionId();
    const list = getItems<SchoolClass>(KEYS.CLASSES);
    
    // Check for duplicate in this session
    const exists = list.find(c => 
      c.sessionId === activeSession && 
      c.className.toLowerCase() === cls.className.toLowerCase() && 
      c.section.toLowerCase() === cls.section.toLowerCase()
    );
    
    if (exists) {
        throw new Error("Class and Section already exists in this session.");
    }

    list.push({ ...cls, sessionId: activeSession });
    setItems(KEYS.CLASSES, list);
    storageService.logActivity('ADD_CLASS', `Added Class ${cls.className}-${cls.section}`);
  },

  updateClass: (id: string, updates: Partial<SchoolClass>) => {
     if (isCurrentSessionLocked()) throw new Error("Current session is locked. Cannot update classes.");
     const list = getItems<SchoolClass>(KEYS.CLASSES);
     const index = list.findIndex(c => c.id === id);
     if (index !== -1) {
         list[index] = { ...list[index], ...updates };
         setItems(KEYS.CLASSES, list);
         storageService.logActivity('UPDATE_CLASS', `Updated Class ${list[index].className}-${list[index].section}`);
     }
  },

  deleteClass: (id: string) => {
     if (isCurrentSessionLocked()) throw new Error("Current session is locked. Cannot delete classes.");
     const list = getItems<SchoolClass>(KEYS.CLASSES);
     setItems(KEYS.CLASSES, list.filter(c => c.id !== id));
     storageService.logActivity('DELETE_CLASS', `Deleted Class definition`);
  },
  
  saveClassConfiguration: (classId: string, updates: Partial<SchoolClass>, subjectTeachers: {subjectId: string, teacherName: string}[]) => {
      if (isCurrentSessionLocked()) throw new Error("Session Locked");
      const activeSession = getActiveSessionId();
      
      // 1. Update Class Details (Name, Section, Homeroom, SubjectIds)
      storageService.updateClass(classId, updates);
      
      // 2. Update Subject Teachers
      const currentClass = storageService.getClasses().find(c => c.id === classId);
      if(!currentClass) return;

      let allTeachers = getItems<ClassSubjectTeacher>(KEYS.CLASS_TEACHERS);
      
      // Remove old assignments for this class/session
      allTeachers = allTeachers.filter(t => 
          !(t.className === currentClass.className && t.section === currentClass.section && t.sessionId === activeSession)
      );
      
      // Add new assignments
      subjectTeachers.forEach(st => {
          allTeachers.push({
              id: `${currentClass.className}-${currentClass.section}-${st.subjectId}`,
              className: currentClass.className,
              section: currentClass.section,
              subjectId: st.subjectId,
              teacherName: st.teacherName,
              sessionId: activeSession
          });
      });
      
      setItems(KEYS.CLASS_TEACHERS, allTeachers);
      storageService.logActivity('CONFIG_CLASS', `Updated configuration for Class ${currentClass.className}-${currentClass.section}`);
  },
  
  getHomeroomTeacher: (className: string, section: string): string | undefined => {
      const activeSession = getActiveSessionId();
      const list = getItems<SchoolClass>(KEYS.CLASSES);
      const found = list.find(c => 
        c.sessionId === activeSession && 
        c.className === className && 
        c.section === section
      );
      return found?.classTeacherName;
  },

  // --- STUDENTS ---
  getStudents: () => {
      const activeSession = getActiveSessionId();
      return getItems<Student>(KEYS.STUDENTS).filter(s => s.sessionId === activeSession);
  },
  
  generateRollNumber: (campus: 'Boys' | 'Girls'): string => {
    const students = storageService.getStudents(); // Uses filtered list
    const prefix = campus === 'Boys' ? 'B-' : 'G-';
    const campusStudents = students.filter(s => s.campus === campus && s.rollNumber.startsWith(prefix));
    
    let maxNum = 0;
    campusStudents.forEach(s => {
      const numPart = parseInt(s.rollNumber.replace(prefix, ''));
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    });

    const nextNum = maxNum + 1;
    return `${prefix}${nextNum.toString().padStart(3, '0')}`;
  },

  addStudent: (student: Student) => {
    if (isCurrentSessionLocked()) throw new Error("Session Locked");
    const list = getItems<Student>(KEYS.STUDENTS);
    const activeSession = getActiveSessionId();
    
    // Auto generate roll if needed based on active session students
    const roll = student.rollNumber || storageService.generateRollNumber(student.campus);
    
    const finalStudent = {
      ...student,
      // Ensure unique ID if not provided
      id: student.id || `student-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      rollNumber: roll,
      sessionId: activeSession
    };

    // Calculate global stats (fallback)
    const config = storageService.getClassAttendance(finalStudent.className, finalStudent.section);
    const total = config ? config.totalDays : (finalStudent.attendanceTotal || 0);
    const pct = total > 0 ? Math.round(((finalStudent.attendancePresent || 0)/total)*100) : 0;
    
    finalStudent.attendancePercentage = pct;
    finalStudent.attendanceTotal = total;

    list.push(finalStudent);
    setItems(KEYS.STUDENTS, list);
    storageService.logActivity('ADD_STUDENT', `Added student: ${finalStudent.name} to session`);
  },

  addStudentsBulk: (newStudents: Student[]) => {
    if (isCurrentSessionLocked()) throw new Error("Session Locked");
    const activeSession = getActiveSessionId();
    let list = getItems<Student>(KEYS.STUDENTS);
    let updatedCount = 0;
    let newCount = 0;
    
    newStudents.forEach(newStudent => {
      // Check for existing student IN THIS SESSION
      const existingIndex = list.findIndex(s => s.rollNumber === newStudent.rollNumber && s.sessionId === activeSession);
      const config = storageService.getClassAttendance(newStudent.className, newStudent.section);
      const attTotal = config ? config.totalDays : (newStudent.attendanceTotal || 0);
      const attP = newStudent.attendancePresent || 0;
      const pct = attTotal > 0 ? Math.round((attP/attTotal)*100) : 0;

      if (existingIndex !== -1) {
        list[existingIndex] = { 
          ...list[existingIndex], 
          ...newStudent, 
          id: list[existingIndex].id,
          attendancePercentage: pct,
          attendanceTotal: attTotal,
          sessionId: activeSession
        };
        updatedCount++;
      } else {
        const roll = newStudent.rollNumber || storageService.generateRollNumber(newStudent.campus);
        list.push({ 
          ...newStudent, 
          id: Date.now().toString() + Math.random(), 
          rollNumber: roll,
          attendancePercentage: pct,
          attendanceTotal: attTotal,
          sessionId: activeSession
        });
        newCount++;
      }
    });
    
    setItems(KEYS.STUDENTS, list);
    storageService.logActivity('BULK_IMPORT_STUDENTS', `Imported ${newCount} new, Updated ${updatedCount} students in current session`);
  },

  updateStudent: (updatedStudent: Student) => {
    if (isCurrentSessionLocked()) throw new Error("Session Locked");
    const list = getItems<Student>(KEYS.STUDENTS);
    const index = list.findIndex(s => s.id === updatedStudent.id);
    if (index !== -1) {
        // Keep stats
        const current = list[index];
        list[index] = { 
            ...updatedStudent, 
            attendancePercentage: current.attendancePercentage, 
            attendanceTotal: current.attendanceTotal,
            attendancePresent: current.attendancePresent
        };
        setItems(KEYS.STUDENTS, list);
        storageService.logActivity('UPDATE_STUDENT', `Updated details for ${updatedStudent.name}`);
    }
  },

  deleteStudent: (id: string) => {
    if (isCurrentSessionLocked()) throw new Error("Session Locked");
    const list = getItems<Student>(KEYS.STUDENTS);
    const student = list.find(s => s.id === id);
    if (student) {
      setItems(KEYS.STUDENTS, list.filter(s => s.id !== id));
      storageService.logActivity('DELETE_STUDENT', `Deleted student: ${student.name}`);
    }
  },
  
  // --- SUBJECTS (GLOBAL) ---
  getSubjects: () => getItems<Subject>(KEYS.SUBJECTS),
  addSubject: (subject: Subject) => {
    const list = getItems<Subject>(KEYS.SUBJECTS);
    list.push(subject);
    setItems(KEYS.SUBJECTS, list);
    storageService.logActivity('ADD_SUBJECT', `Created subject: ${subject.name}`);
  },
  deleteSubject: (id: string) => {
    const list = getItems<Subject>(KEYS.SUBJECTS);
    const subject = list.find(s => s.id === id);
    if (subject) {
      setItems(KEYS.SUBJECTS, list.filter(s => s.id !== id));
      storageService.logActivity('DELETE_SUBJECT', `Deleted subject: ${subject.name}`);
    }
  },

  // --- CLASS TEACHERS (SUBJECT TEACHERS) ---
  getClassTeachers: () => {
    const activeSession = getActiveSessionId();
    return getItems<ClassSubjectTeacher>(KEYS.CLASS_TEACHERS).filter(t => t.sessionId === activeSession);
  },
  
  assignClassTeacher: (assignment: ClassSubjectTeacher) => {
    if (isCurrentSessionLocked()) throw new Error("Session Locked");
    const activeSession = getActiveSessionId();
    let list = getItems<ClassSubjectTeacher>(KEYS.CLASS_TEACHERS);
    const scopedAssignment = { ...assignment, sessionId: activeSession };

    const index = list.findIndex(
      t => t.className === assignment.className && 
           t.section === assignment.section && 
           t.subjectId === assignment.subjectId &&
           t.sessionId === activeSession
    );

    if (index !== -1) {
      list[index] = scopedAssignment; 
    } else {
      list.push(scopedAssignment);
    }
    setItems(KEYS.CLASS_TEACHERS, list);
    storageService.logActivity('ASSIGN_TEACHER', `Assigned ${assignment.teacherName} to Class ${assignment.className}-${assignment.section}`);
  },

  getSubjectTeacher: (subjectId: string, className: string, section: string) => {
    const activeSession = getActiveSessionId();
    const classTeachers = getItems<ClassSubjectTeacher>(KEYS.CLASS_TEACHERS);
    const specific = classTeachers.find(
      t => t.subjectId === subjectId && t.className === className && t.section === section && t.sessionId === activeSession
    );
    if (specific) return specific.teacherName;
    
    const subjects = getItems<Subject>(KEYS.SUBJECTS);
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.teacherName || 'Not Assigned';
  },

  // --- ATTENDANCE CONFIG (SESSION SCOPED) ---
  getAllAttendanceConfigs: () => {
      const activeSession = getActiveSessionId();
      return getItems<ClassAttendance>(KEYS.ATTENDANCE_CONFIG).filter(a => a.sessionId === activeSession);
  },
  
  getClassAttendance: (className: string, section: string, examTermId?: string): ClassAttendance | undefined => {
      const activeSession = getActiveSessionId();
      const list = getItems<ClassAttendance>(KEYS.ATTENDANCE_CONFIG);
      return list.find(c => 
          c.className === className && 
          c.section === section && 
          c.sessionId === activeSession &&
          (examTermId ? c.examTermId === examTermId : true) // Optional examTermId match or just class config
      );
  },

  setClassAttendance: (config: ClassAttendance) => {
      if (isCurrentSessionLocked()) throw new Error("Session Locked");
      const activeSession = getActiveSessionId();
      let list = getItems<ClassAttendance>(KEYS.ATTENDANCE_CONFIG);
      const index = list.findIndex(c => 
          c.className === config.className && 
          c.section === config.section && 
          c.sessionId === activeSession &&
          c.examTermId === config.examTermId
      );
      
      const scopedConfig = { ...config, sessionId: activeSession };

      if (index !== -1) {
          list[index] = scopedConfig;
      } else {
          list.push(scopedConfig);
      }
      setItems(KEYS.ATTENDANCE_CONFIG, list);
  },

  saveBatchAttendance: (className: string, section: string, totalDays: number, attendanceMap: {[studentId: string]: number}, examTermId: string) => {
      if (isCurrentSessionLocked()) throw new Error("Session Locked");
      const activeSession = getActiveSessionId();
      
      // 1. Update Config for specific Exam Term
      storageService.setClassAttendance({
          id: `${className}-${section}-${examTermId}`,
          className,
          section,
          totalDays,
          sessionId: activeSession,
          examTermId
      });

      // 2. Save Attendance as Marks ('term-attendance')
      const entries: MarkEntry[] = Object.entries(attendanceMap).map(([studentId, days]) => ({
          studentId,
          subjectId: 'term-attendance',
          examTermId,
          obtainedMarks: days,
          sessionId: activeSession
      }));
      
      storageService.saveMarks(entries); // reuse saveMarks which handles overwrites

      // 3. Optional: Recalculate Student Global Attendance Stats (Sum of all 'term-attendance')
      const allMarks = getItems<MarkEntry>(KEYS.MARKS).filter(m => m.sessionId === activeSession && m.subjectId === 'term-attendance');
      const allConfigs = getItems<ClassAttendance>(KEYS.ATTENDANCE_CONFIG).filter(c => c.sessionId === activeSession && c.className === className && c.section === section);
      const totalSessionDays = allConfigs.reduce((sum, c) => sum + c.totalDays, 0);

      const students = getItems<Student>(KEYS.STUDENTS);
      let updatedStudents = false;
      const newStudentList = students.map(s => {
          if (s.sessionId === activeSession && s.className === className && s.section === section) {
              const studentAttendanceMarks = allMarks.filter(m => m.studentId === s.id);
              const presentTotal = studentAttendanceMarks.reduce((sum, m) => sum + m.obtainedMarks, 0);
              const pct = totalSessionDays > 0 ? Math.round((presentTotal/totalSessionDays)*100) : 0;
              
              if (s.attendancePresent !== presentTotal || s.attendanceTotal !== totalSessionDays) {
                  updatedStudents = true;
                  return { ...s, attendancePresent: presentTotal, attendanceTotal: totalSessionDays, attendancePercentage: pct };
              }
          }
          return s;
      });

      if (updatedStudents) setItems(KEYS.STUDENTS, newStudentList);
      
      storageService.logActivity('BATCH_ATTENDANCE', `Updated attendance for ${className}-${section} (Term: ${examTermId})`);
  },
  
  // --- EXAMS (SESSION SCOPED) ---
  getExams: () => {
      const activeSession = getActiveSessionId();
      return getItems<ExamTerm>(KEYS.EXAMS).filter(e => e.sessionId === activeSession);
  },
  addExam: (exam: ExamTerm) => {
    if (isCurrentSessionLocked()) throw new Error("Current session is locked. Cannot add exams.");
    const list = getItems<ExamTerm>(KEYS.EXAMS);
    const activeSession = getActiveSessionId();
    list.push({ ...exam, sessionId: activeSession });
    setItems(KEYS.EXAMS, list);
    storageService.logActivity('CREATE_EXAM', `Created exam term: ${exam.name}`);
  },
  toggleExamLock: (id: string) => {
    if (isCurrentSessionLocked()) throw new Error("Current session is locked. Cannot modify exams.");
    const list = getItems<ExamTerm>(KEYS.EXAMS);
    let status = '';
    const updated = list.map(e => {
      if (e.id === id) {
        status = !e.isLocked ? 'Locked' : 'Unlocked';
        return { ...e, isLocked: !e.isLocked };
      }
      return e;
    });
    setItems(KEYS.EXAMS, updated);
    if (status) storageService.logActivity('TOGGLE_EXAM_LOCK', `${status} exam term ID: ${id}`);
  },
  
  // --- MARKS (SESSION SCOPED) ---
  getMarks: (examId: string) => {
    const activeSession = getActiveSessionId();
    // Filter by Active Session AND Exam ID
    const allMarks = getItems<MarkEntry>(KEYS.MARKS);
    return allMarks.filter(m => m.examTermId === examId && m.sessionId === activeSession);
  },

  saveMarks: (newMarks: MarkEntry[]) => {
    if (isCurrentSessionLocked()) throw new Error("Session Locked");
    const activeSession = getActiveSessionId();
    let allMarks = getItems<MarkEntry>(KEYS.MARKS);
    
    const marksWithSession = newMarks.map(m => ({...m, sessionId: activeSession}));

    marksWithSession.forEach(nm => {
      // Remove existing for this student/subject/exam/session
      allMarks = allMarks.filter(m => 
        !(m.studentId === nm.studentId && m.subjectId === nm.subjectId && m.examTermId === nm.examTermId && m.sessionId === activeSession)
      );
    });
    const updated = [...allMarks, ...marksWithSession];
    setItems(KEYS.MARKS, updated);
    storageService.logActivity('SAVE_MARKS', `Saved/Updated ${newMarks.length} mark entries`);
  },

  // Overwrite marks for a specific Exam + Subject context (Handles Deletions correctly)
  overwriteSubjectMarks: (examId: string, subjectId: string, newMarks: MarkEntry[]) => {
    if (isCurrentSessionLocked()) throw new Error("Session Locked");
    const activeSession = getActiveSessionId();
    let allMarks = getItems<MarkEntry>(KEYS.MARKS);
    
    // 1. Remove ALL existing marks for this specific Exam + Subject + Session
    allMarks = allMarks.filter(m => 
      !(m.examTermId === examId && m.subjectId === subjectId && m.sessionId === activeSession)
    );

    // 2. Prepare new marks
    const marksWithSession = newMarks.map(m => ({...m, sessionId: activeSession}));
    
    // 3. Combine
    const updated = [...allMarks, ...marksWithSession];
    setItems(KEYS.MARKS, updated);
    storageService.logActivity('SAVE_MARKS_BULK', `Updated marks for Subject ${subjectId}, Exam ${examId}`);
  },

  // --- GRADING (GLOBAL) ---
  getGradingRules: () => getItems<GradingRule>(KEYS.GRADING),
  saveGradingRules: (rules: GradingRule[]) => {
    setItems(KEYS.GRADING, rules);
    storageService.logActivity('UPDATE_GRADING', 'Updated grading scale configuration');
  }
};
