/**
 * backendService - central API client
 * Exports a named `backendService` object used across the app.
 * NOTE: many endpoints are stubbed / TODO — they return safe defaults so
 * the app compiles while the backend is being implemented.
 */

import {
  User,
  Student,
  Teacher,
  Subject,
  ExamTerm,
  MarkEntry,
  Session,
  SchoolClass,
} from "../types";

const API_BASE =
  ((import.meta as any).env?.VITE_API_URL as string) ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5000/api`
    : "http://localhost:5000/api");
const TOKEN_KEY = "academix_auth_token";
const USER_KEY = "academix_current_user";

const getAuthToken = () => sessionStorage.getItem(TOKEN_KEY);
const setAuthToken = (token: string | null) => {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
};

const getHeaders = (withAuth = false) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (withAuth) {
    const t = getAuthToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  return headers;
};

const handleRes = async (res: Response) => {
  const contentType = res.headers.get("content-type");
  const text = contentType?.includes("application/json")
    ? await res.json()
    : await res.text();
  if (!res.ok) {
    const err = typeof text === "string" ? text : JSON.stringify(text);
    throw new Error(err || `HTTP ${res.status}`);
  }
  return text;
};

const apiFetch = async (
  path: string,
  options: RequestInit = {},
  withAuth = true,
) => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...(options.headers || {}), ...getHeaders(withAuth) },
  });
  return await handleRes(res);
};

export const backendService = {
  // Auth
  async login(email: string, password: string) {
    const data = await apiFetch(
      `/auth/login`,
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      false,
    );
    if (data && (data as any).token) setAuthToken((data as any).token);
    if ((data as any).user)
      sessionStorage.setItem(USER_KEY, JSON.stringify((data as any).user));
    return data;
  },

  async logout() {
    // clear client-side auth state
    setAuthToken(null);
    sessionStorage.removeItem(USER_KEY);
    return Promise.resolve();
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const u = await apiFetch(`/auth/me`);
      if (u) {
        sessionStorage.setItem(USER_KEY, JSON.stringify(u));
        return u as User;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!getAuthToken();
  },

  getStoredUser(): User | null {
    const u = sessionStorage.getItem(USER_KEY);
    return u ? (JSON.parse(u) as User) : null;
  },

  // Users
  async getUsers(): Promise<User[]> {
    return (await apiFetch(`/users`)) as User[];
  },

  async addUser(user: Partial<User>) {
    return await apiFetch(`/users`, {
      method: "POST",
      body: JSON.stringify(user),
    });
  },

  async updateUser(id: string, updates: Partial<User>) {
    return await apiFetch(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async deleteUser(id: string) {
    return await apiFetch(`/users/${id}`, { method: "DELETE" });
  },

  // Students
  async getStudents(query?: {
    sessionId?: string;
    classId?: string;
  }): Promise<Student[]> {
    const params = new URLSearchParams();
    if (query?.sessionId) params.append("sessionId", query.sessionId);
    if (query?.classId) params.append("classId", query.classId);
    const q = params.toString() ? `?${params.toString()}` : "";
    return (await apiFetch(`/students${q}`)) as Student[];
  },

  async getStudent(id: string): Promise<Student> {
    return (await apiFetch(`/students/${id}`)) as Student;
  },

  async addStudent(student: Partial<Student>): Promise<Student> {
    return (await apiFetch(`/students`, {
      method: "POST",
      body: JSON.stringify(student),
    })) as Student;
  },

  async getNextStudentId(params: {
    campus?: "Boys" | "Girls";
    gender?: "male" | "female";
  }): Promise<string> {
    const query = new URLSearchParams();
    if (params.campus) query.append("campus", params.campus);
    if (params.gender) query.append("gender", params.gender);
    const q = query.toString() ? `?${query.toString()}` : "";
    const data = (await apiFetch(`/students/next-roll-number${q}`)) as {
      rollNumber?: string;
    };
    return data?.rollNumber || "";
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    return (await apiFetch(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })) as Student;
  },

  async deleteStudent(id: string) {
    return await apiFetch(`/students/${id}`, { method: "DELETE" });
  },

  // Teachers
  async getTeachers(): Promise<Teacher[]> {
    return (await apiFetch(`/teachers`)) as Teacher[];
  },

  async getTeacher(id: string): Promise<Teacher> {
    return (await apiFetch(`/teachers/${id}`)) as Teacher;
  },

  async addTeacher(t: Partial<Teacher>) {
    return await apiFetch(`/teachers`, {
      method: "POST",
      body: JSON.stringify(t),
    });
  },

  async updateTeacher(id: string, updates: Partial<Teacher>) {
    return await apiFetch(`/teachers/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async deleteTeacher(id: string) {
    return await apiFetch(`/teachers/${id}`, { method: "DELETE" });
  },

  // Subjects
  async getSubjects(): Promise<Subject[]> {
    return (await apiFetch(`/subjects`)) as Subject[];
  },

  async addSubject(s: Partial<Subject>) {
    return await apiFetch(`/subjects`, {
      method: "POST",
      body: JSON.stringify(s),
    });
  },

  async updateSubject(id: string, updates: Partial<Subject>) {
    return await apiFetch(`/subjects/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async deleteSubject(id: string) {
    return await apiFetch(`/subjects/${id}`, { method: "DELETE" });
  },

  // Classes
  async getClasses(sessionId?: string): Promise<SchoolClass[]> {
    const q = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
    return (await apiFetch(`/classes${q}`)) as SchoolClass[];
  },

  async addClass(c: Partial<SchoolClass>) {
    return await apiFetch(`/classes`, {
      method: "POST",
      body: JSON.stringify(c),
    });
  },

  async updateClass(id: string, updates: Partial<SchoolClass>) {
    return await apiFetch(`/classes/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async deleteClass(id: string) {
    return await apiFetch(`/classes/${id}`, { method: "DELETE" });
  },

  async deleteExam(id: string) {
    return await apiFetch(`/exams/${id}`, { method: "DELETE" });
  },

  // Exams
  async getExams(sessionId?: string): Promise<ExamTerm[]> {
    const q = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
    return (await apiFetch(`/exams${q}`)) as ExamTerm[];
  },

  async addExam(e: Partial<ExamTerm>) {
    return await apiFetch(`/exams`, {
      method: "POST",
      body: JSON.stringify(e),
    });
  },

  // Marks & Attendance
  async getMarks(query?: {
    studentId?: string;
    subjectId?: string;
    examId?: string;
  }): Promise<MarkEntry[]> {
    const params = new URLSearchParams();
    if (query?.studentId) params.append("studentId", query.studentId);
    if (query?.subjectId) params.append("subjectId", query.subjectId);
    if (query?.examId) params.append("examId", query.examId);
    const q = params.toString() ? `?${params.toString()}` : "";
    return (await apiFetch(`/marks${q}`)) as MarkEntry[];
  },

  async saveMarks(entries: MarkEntry[]) {
    // POST to /marks/batch or /marks depending on backend
    return await apiFetch(`/marks/batch`, {
      method: "POST",
      body: JSON.stringify(entries),
    });
  },

  async getClassAttendance(
    className: string,
    section: string,
    examId?: string,
  ) {
    const q = examId ? `?examId=${encodeURIComponent(examId)}` : "";
    return await apiFetch(
      `/attendance/class/${encodeURIComponent(className)}/${encodeURIComponent(section)}${q}`,
    );
  },

  async saveBatchAttendance(
    className: string,
    section: string,
    totalDays: number,
    data: any,
    examId?: string,
  ) {
    const normalizedSection = section || "";
    return await apiFetch(
      `/attendance/class/${encodeURIComponent(className)}/${encodeURIComponent(normalizedSection)}`,
      { method: "POST", body: JSON.stringify({ totalDays, data, examId }) },
    );
  },

  // Grading rules / class-teacher assignments (stubbed until backend exists)
  async getGradingRules(): Promise<any[]> {
    try {
      return (await apiFetch(`/grading`)) as any[];
    } catch (e) {
      return [];
    }
  },

  async saveGradingRules(rules: any[]) {
    try {
      return await apiFetch(`/grading`, {
        method: "POST",
        body: JSON.stringify(rules),
      });
    } catch (e) {
      return { success: true };
    }
  },

  async getClassTeachers(): Promise<any[]> {
    try {
      return (await apiFetch(`/class-teachers`)) as any[];
    } catch (e) {
      return [];
    }
  },

  async assignClassTeacher(assignment: any) {
    return await apiFetch(`/class-teachers`, {
      method: "POST",
      body: JSON.stringify(assignment),
    });
  },

  async getSubjectTeacher(
    subjectId: string,
    className: string,
    section: string,
  ): Promise<string> {
    // try legacy in-memory endpoint first
    try {
      const r = await apiFetch(
        `/class-teachers/subject/${encodeURIComponent(subjectId)}?class=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}`,
      );
      if (r && (r as any).teacherName) return (r as any).teacherName;
    } catch (e) {
      // swallow
    }
    // fallback: load class config and read subjectTeachers
    try {
      const classes: any[] = await this.getClasses();
      const cls = classes.find(
        (c) => c.className === className && c.section === section,
      );
      if (cls && cls.subjectTeachers) {
        const o = (cls.subjectTeachers as any[]).find(
          (t) => t.subjectId === subjectId,
        );
        if (o && o.teacherName) return o.teacherName;
      }
    } catch (e) {
      // ignore
    }
    return "Not Assigned";
  },

  async getHomeroomTeacher(
    className: string,
    section: string,
    campus?: string,
  ): Promise<string> {
    try {
      const q = campus ? `?campus=${encodeURIComponent(campus)}` : "";
      const r = await apiFetch(
        `/class-teachers/homeroom/${encodeURIComponent(className)}/${encodeURIComponent(section)}${q}`,
      );
      return (r && (r as any).teacherName) || "Not Assigned";
    } catch (e) {
      return "Not Assigned";
    }
  },

  // Sessions
  async getSessions(): Promise<Session[]> {
    return (await apiFetch(`/sessions`)) as Session[];
  },

  async getActiveSession(): Promise<Session | null> {
    try {
      return (await apiFetch(`/sessions/active`)) as Session;
    } catch (e) {
      return null;
    }
  },

  async createSession(name: string) {
    return await apiFetch(`/sessions`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  async switchSession(sessionId: string) {
    return await apiFetch(`/sessions/${encodeURIComponent(sessionId)}/switch`, {
      method: "POST",
    });
  },

  async toggleSessionLock(sessionId: string) {
    return await apiFetch(
      `/sessions/${encodeURIComponent(sessionId)}/toggle-lock`,
      { method: "POST" },
    );
  },

  async deleteSession(sessionId: string) {
    return await apiFetch(`/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
    });
  },

  async toggleExamLock(examId: string) {
    return await apiFetch(`/exams/${encodeURIComponent(examId)}/toggle-lock`, {
      method: "POST",
    });
  },

  async isSessionLocked(): Promise<boolean> {
    try {
      const session = await this.getActiveSession();
      return session?.isLocked || false;
    } catch (e) {
      return false;
    }
  },

  // Backup & restore (local stubs if backend not present)
  async getBackupData(): Promise<any> {
    try {
      return await apiFetch(`/backup`);
    } catch (e) {
      return {
        students: [],
        subjects: [],
        exams: [],
        marks: [],
        classes: [],
        teachers: [],
        sessions: [],
        users: [],
        logs: [],
      };
    }
  },

  async restoreData(data: any) {
    try {
      return await apiFetch(`/backup/restore`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (e) {
      return { success: true };
    }
  },

  async logActivity(action: string, description: string) {
    try {
      return await apiFetch(`/logs`, {
        method: "POST",
        body: JSON.stringify({ action, description }),
      });
    } catch (e) {
      return { success: true };
    }
  },

  async getLogs(): Promise<any[]> {
    try {
      return (await apiFetch(`/logs`)) as any[];
    } catch (e) {
      return [];
    }
  },

  async changePasswordForUser(username: string, newPassword: string) {
    try {
      return await apiFetch(
        `/users/${encodeURIComponent(username)}/change-password`,
        { method: "POST", body: JSON.stringify({ newPassword }) },
      );
    } catch (e) {
      return { success: true };
    }
  },

  // Bulk operations
  async addStudentsBulk(students: Student[]) {
    try {
      return await apiFetch(`/students/bulk`, {
        method: "POST",
        body: JSON.stringify(students),
      });
    } catch (e) {
      return { success: true, count: students.length };
    }
  },

  async saveClassConfiguration(classId: string, updates: any, teachers: any[]) {
    try {
      return await apiFetch(`/classes/${encodeURIComponent(classId)}/config`, {
        method: "POST",
        body: JSON.stringify({ updates, teachers }),
      });
    } catch (e) {
      return { success: true };
    }
  },
};

export default backendService;
