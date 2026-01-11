import React, { useState, useEffect, useMemo, useRef } from "react";
import { storageService } from "../../services/storageService";
import {
  Subject,
  ExamTerm,
  AuditLogEntry,
  GradingRule,
  Student,
  User,
  Session,
  SchoolClass,
  Teacher,
  ClassSubjectTeacher,
} from "../../types";
import {
  Trash2,
  Lock,
  Unlock,
  Plus,
  Book,
  Calendar,
  Database,
  Download,
  Upload,
  AlertTriangle,
  Activity,
  User as UserIcon,
  Key,
  BarChart3,
  Save,
  Eraser,
  School,
  X,
  Edit2,
  Users,
  Layout,
  ShieldAlert,
  Check,
  MoreVertical,
  UserCheck,
  Search,
  ChevronDown,
  Filter,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from "lucide-react";
import { SearchableTeacherSelect } from "./SearchableTeacherSelect";

// --- MODAL: Class Configuration ---
const ClassConfigurationModal: React.FC<{
  schoolClass: SchoolClass | null; // null for new class
  allSubjects: Subject[];
  allTeachers: Teacher[];
  onClose: () => void;
  onSave: () => void;
}> = ({ schoolClass, allSubjects, allTeachers, onClose, onSave }) => {
  // Basic Details
  const [className, setClassName] = useState(schoolClass?.className || "");
  const [section, setSection] = useState(schoolClass?.section || "");
  const [homeroomTeacherId, setHomeroomTeacherId] = useState(
    schoolClass?.classTeacherId || ""
  );

  // Subject Allocation & Teacher Assignment
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
    new Set(schoolClass?.subjectIds || [])
  );
  const [subjectTeachers, setSubjectTeachers] = useState<{
    [subjectId: string]: string;
  }>({});

  // UI States
  const [subjectSearch, setSubjectSearch] = useState("");
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Load existing assignments
  useEffect(() => {
    if (schoolClass) {
      // Load existing teacher assignments for this class
      const assignments: { [key: string]: string } = {};
      allSubjects.forEach((sub) => {
        const assigned = storageService.getSubjectTeacher(
          sub.id,
          schoolClass.className,
          schoolClass.section
        );
        if (assigned && assigned !== "Not Assigned") {
          assignments[sub.id] = assigned;
        }
      });
      setSubjectTeachers(assignments);
    } else {
      setSelectedSubjects(new Set());
    }
  }, [schoolClass, allSubjects]);

  const handleToggleSubject = (id: string) => {
    const newSet = new Set(selectedSubjects);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedSubjects(newSet);
  };

  const handleTeacherChange = (subjectId: string, teacherName: string) => {
    setSubjectTeachers((prev) => ({
      ...prev,
      [subjectId]: teacherName,
    }));
  };

  const handleRevertTeacher = (subjectId: string) => {
    const newMap = { ...subjectTeachers };
    delete newMap[subjectId];
    setSubjectTeachers(newMap);
  };

  const handleSave = () => {
    if (!className) return alert("Class Name is required");

    try {
      const teacherName =
        allTeachers.find((u) => u.id === homeroomTeacherId)?.name || "";
      const updates: Partial<SchoolClass> = {
        className,
        section,
        classTeacherId: homeroomTeacherId,
        classTeacherName: teacherName,
        subjectIds: Array.from(selectedSubjects) as string[],
      };

      const teachersToSave = (Array.from(selectedSubjects) as string[]).map(
        (subId) => {
          // If explicitly assigned in modal, use that.
          // If not in map (meaning default/unassigned state visually), we check if we should save a default?
          // Actually, assignClassTeacher saves specific overrides.
          // If the user selected a teacher that matches the default, strictly speaking we don't *need* to save an override,
          // but saving it locks it for this class which is often desired.
          const assigned = subjectTeachers[subId];
          return {
            subjectId: subId,
            teacherName: assigned || "", // Empty string might imply "Unassigned" or "Use Default" depending on logic, but here we save explicit assignment
          };
        }
      );

      if (schoolClass) {
        storageService.saveClassConfiguration(
          schoolClass.id,
          updates,
          teachersToSave
        );
      } else {
        // Create new
        const newId = section
          ? `${className}-${section}`.toLowerCase().replace(/\s/g, "-")
          : className.toLowerCase().replace(/\s/g, "-");

        storageService.addClass({
          ...updates,
          id: newId,
          sessionId: "",
        } as SchoolClass);
        storageService.saveClassConfiguration(newId, updates, teachersToSave);
      }
      onSave();
      onClose();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Filter and Sort Subjects for the UI
  const displayedSubjects = useMemo(() => {
    let filtered = allSubjects.filter((s) =>
      s.name.toLowerCase().includes(subjectSearch.toLowerCase())
    );

    if (showOnlySelected) {
      filtered = filtered.filter((s) => selectedSubjects.has(s.id));
    }

    // Sort: Selected first, then alphabetical
    return filtered.sort((a, b) => {
      const aSelected = selectedSubjects.has(a.id);
      const bSelected = selectedSubjects.has(b.id);
      if (aSelected === bSelected) return a.name.localeCompare(b.name);
      return aSelected ? -1 : 1;
    });
  }, [allSubjects, subjectSearch, selectedSubjects, showOnlySelected]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-800 text-xl">
              {schoolClass
                ? `Edit Class ${schoolClass.className} ${schoolClass.section}`
                : "Create New Class"}
            </h3>
            <p className="text-sm text-gray-500">
              Configure class details and curriculum staffing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Panel: Basic Details */}
          <div className="w-full md:w-1/4 bg-white p-6 border-r border-gray-200 overflow-y-auto z-10">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider flex items-center gap-2">
              <School className="w-4 h-4" /> Class Details
            </h4>

            <div className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Class Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition font-medium"
                    placeholder="e.g. 10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition font-medium"
                    placeholder="e.g. A"
                  />
                </div>
              </div>

              <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                <label className="block text-sm font-bold text-primary-800 mb-2">
                  Homeroom Teacher
                </label>
                <SearchableTeacherSelect
                  teachers={allTeachers}
                  value={
                    allTeachers.find((t) => t.id === homeroomTeacherId)?.name ||
                    ""
                  }
                  onChange={(name) => {
                    const t = allTeachers.find(
                      (teacher) => teacher.name === name
                    );
                    if (t) setHomeroomTeacherId(t.id);
                    else setHomeroomTeacherId("");
                  }}
                  placeholder="Select Teacher..."
                  className="bg-white shadow-xs"
                />
                <p className="text-[10px] text-primary-600 mt-2 leading-relaxed">
                  Responsible for attendance and general class management.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mt-auto">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white text-gray-600 rounded-lg shadow-xs border border-gray-200">
                    <Book className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-800">
                      {selectedSubjects.size}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold">
                      Subjects Active
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Subject Allocation Grid */}
          <div className="w-full md:w-3/4 bg-gray-50 flex flex-col h-full">
            {/* Toolbar */}
            <div className="px-6 py-3 bg-white border-b border-gray-200 flex flex-wrap justify-between items-center shadow-xs z-20 gap-4">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">
                  Subject Matrix
                </h4>
                <p className="text-xs text-gray-500">
                  Assign teachers to specific subjects for this class.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search subjects..."
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none w-64 bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowOnlySelected(!showOnlySelected)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                    showOnlySelected
                      ? "bg-primary-100 border-primary-300 text-primary-700"
                      : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  {showOnlySelected ? "Selected Only" : "Show All"}
                </button>
              </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10">
              <div className="col-span-1 text-center">Active</div>
              <div className="col-span-4">Subject Details</div>
              <div className="col-span-3">Default Staff</div>
              <div className="col-span-4">Assigned Teacher</div>
            </div>

            {/* Grid Rows */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50">
              {displayedSubjects.map((sub) => {
                const isSelected = selectedSubjects.has(sub.id);
                const assignedName = subjectTeachers[sub.id];
                const isOverride =
                  assignedName && assignedName !== sub.teacherName;

                return (
                  <div
                    key={sub.id}
                    className={`
                                            grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 items-center transition-all duration-200 hover:bg-white
                                            ${
                                              isSelected
                                                ? "bg-white"
                                                : "bg-gray-50/50 opacity-60 hover:opacity-100"
                                            }
                                        `}
                  >
                    {/* 1. Checkbox */}
                    <div className="col-span-1 flex justify-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSubject(sub.id)}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 cursor-pointer border-gray-300 shadow-xs"
                      />
                    </div>

                    {/* 2. Subject Info */}
                    <div className="col-span-4">
                      <div
                        className={`font-bold text-sm ${
                          isSelected ? "text-gray-800" : "text-gray-500"
                        }`}
                      >
                        {sub.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium border border-gray-200">
                          Max: {sub.totalMarks}
                        </span>
                      </div>
                    </div>

                    {/* 3. Default Teacher Info */}
                    <div className="col-span-3">
                      {sub.teacherName ? (
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-[10px]">
                            {sub.teacherName.charAt(0)}
                          </span>
                          <span className="truncate">{sub.teacherName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic pl-2">
                          None Defined
                        </span>
                      )}
                    </div>

                    {/* 4. Assignment */}
                    <div className="col-span-4 relative">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <SearchableTeacherSelect
                            teachers={allTeachers}
                            value={subjectTeachers[sub.id] || ""}
                            onChange={(name) =>
                              handleTeacherChange(sub.id, name)
                            }
                            defaultTeacherName={sub.teacherName}
                            disabled={!isSelected}
                            placeholder="Assign..."
                            className={
                              isSelected
                                ? isOverride
                                  ? "ring-1 ring-primary-200 rounded-lg"
                                  : ""
                                : ""
                            }
                          />
                        </div>
                        {isOverride && isSelected && (
                          <button
                            onClick={() => handleRevertTeacher(sub.id)}
                            title="Revert to Default"
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {isOverride && isSelected && (
                        <div className="absolute -top-2 right-10 bg-primary-50 text-primary-700 text-[9px] font-bold px-1.5 rounded border border-primary-100 shadow-xs pointer-events-none">
                          Custom
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {displayedSubjects.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h5 className="text-gray-600 font-bold">No subjects found</h5>
                  <p className="text-gray-400 text-sm mt-1">
                    Try adjusting your search query.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end gap-3 z-20">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-bold transition text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold shadow-lg shadow-primary-900/10 transition flex items-center gap-2 text-sm transform active:scale-95"
          >
            <Save className="w-4 h-4" />
            {schoolClass ? "Save Configuration" : "Create Class"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    | "subjects"
    | "classes"
    | "exams"
    | "grading"
    | "data"
    | "logs"
    | "account"
    | "users"
    | "teachers"
    | "sessions"
  >("subjects");

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [exams, setExams] = useState<ExamTerm[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [gradingRules, setGradingRules] = useState<GradingRule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classSubjectTeachers, setClassSubjectTeachers] = useState<
    ClassSubjectTeacher[]
  >([]);
  const [isSessionLocked, setIsSessionLocked] = useState(false);

  // Current User
  const currentUser = storageService.getCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  // Modals
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);

  // Search States
  const [subjectLibrarySearch, setSubjectLibrarySearch] = useState("");

  // Form states
  const [newSubject, setNewSubject] = useState({
    name: "",
    totalMarks: 100,
    teacherName: "",
  });
  const [newExam, setNewExam] = useState({ name: "" });

  // User Management State
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    role: "teacher",
  });

  // Teacher Management State
  const [newTeacher, setNewTeacher] = useState({ name: "", campus: "Both" });

  const [newSessionName, setNewSessionName] = useState("");

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    newPass: "",
    confirmPass: "",
  });
  const [passwordMsg, setPasswordMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshData();
    if (!isAdmin) setActiveTab("account");
  }, []);

  const refreshData = () => {
    setSubjects(storageService.getSubjects());
    setClasses(storageService.getClasses());
    setExams(storageService.getExams());
    setLogs(storageService.getLogs());
    setGradingRules(storageService.getGradingRules());
    setUsers(storageService.getUsers());
    setTeachers(storageService.getTeachers());
    setSessions(storageService.getSessions());
    setClassSubjectTeachers(storageService.getClassTeachers());
    setIsSessionLocked(storageService.isSessionLocked());
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubject.name) {
      storageService.addSubject({
        id: newSubject.name.toLowerCase().replace(/\s+/g, "-"),
        name: newSubject.name,
        totalMarks: newSubject.totalMarks,
        teacherName: newSubject.teacherName,
      });
      setNewSubject({ name: "", totalMarks: 100, teacherName: "" });
      setIsSubjectModalOpen(false);
      refreshData();
    }
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm("Delete this subject? Associated marks might be orphaned.")) {
      storageService.deleteSubject(id);
      refreshData();
    }
  };

  const handleDeleteClass = (id: string) => {
    if (
      confirm(
        "Delete this class definition? Students in this class will not be deleted, but class configurations will be lost."
      )
    ) {
      storageService.deleteClass(id);
      refreshData();
    }
  };

  // ... (Keep existing handlers for Exams, Users, Teachers, Sessions, Grading, Backup/Restore)
  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExam.name) {
      storageService.addExam({
        id: newExam.name.toLowerCase().replace(/\s+/g, "-"),
        name: newExam.name,
        isLocked: false,
        sessionId: "",
      });
      setNewExam({ name: "" });
      refreshData();
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      storageService.addUser({
        id: Date.now().toString(),
        username: newUser.username,
        password: newUser.password,
        name: newUser.name,
        role: newUser.role as "admin" | "teacher",
      });
      setNewUser({ username: "", password: "", name: "", role: "teacher" });
      refreshData();
      alert("User created successfully");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("Delete this user? This cannot be undone.")) {
      storageService.deleteUser(id);
      refreshData();
    }
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      storageService.addTeacher({
        id: `teacher-${Date.now()}`,
        name: newTeacher.name,
        campus: newTeacher.campus as "Boys" | "Girls" | "Both",
      });
      setNewTeacher({ name: "", campus: "Both" });
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm("Delete this teacher from the list?")) {
      storageService.deleteTeacher(id);
      refreshData();
    }
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSessionName) {
      if (
        confirm(
          `Create and activate new session "${newSessionName}"? This will lock all previous sessions.`
        )
      ) {
        storageService.createSession(newSessionName);
        setNewSessionName("");
        alert(
          "New session active. First Term and Final Term exams created automatically."
        );
        window.location.reload();
      }
    }
  };

  const handleSwitchSession = (sessionId: string) => {
    if (
      confirm(
        "Switch active session? The dashboard and all data forms will update."
      )
    ) {
      storageService.switchSession(sessionId);
      window.location.reload();
    }
  };

  const handleToggleSessionLock = (sessionId: string) => {
    storageService.toggleSessionLock(sessionId);
    refreshData();
  };

  const toggleLock = (id: string) => {
    storageService.toggleExamLock(id);
    refreshData();
  };

  const handleGradingChange = (
    index: number,
    field: keyof GradingRule,
    value: string | number
  ) => {
    const updated = [...gradingRules];
    updated[index] = { ...updated[index], [field]: value };
    setGradingRules(updated);
  };

  const addGradingRule = () => {
    setGradingRules([...gradingRules, { label: "New", minPercentage: 0 }]);
  };

  const removeGradingRule = (index: number) => {
    const updated = gradingRules.filter((_, i) => i !== index);
    setGradingRules(updated);
  };

  const saveGradingRules = () => {
    storageService.saveGradingRules(gradingRules);
    alert("Grading scale updated successfully.");
  };

  const handleBackup = () => {
    const backupData = storageService.getBackupData();
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `academix_backup_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    storageService.logActivity("DATA_BACKUP", "System backup downloaded");
    refreshData();
  };

  const handleRestoreClick = () => {
    if (
      confirm(
        "WARNING: Restoring a backup will REPLACE all current data. This cannot be undone. Are you sure?"
      )
    ) {
      fileInputRef.current?.click();
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.students && json.subjects) {
          storageService.restoreData(json);
          alert("System restored successfully! Reloading...");
          window.location.reload();
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        alert("Failed to parse backup file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFactoryReset = () => {
    const confirmText = prompt(
      "Type 'DELETE' to confirm factory reset. This will wipe ALL data."
    );
    if (confirmText === "DELETE") {
      localStorage.clear();
      alert("System reset complete. Reloading...");
      window.location.reload();
    }
  };

  const handleClearMarks = () => {
    const confirmText = prompt(
      "Type 'CLEAR' to delete ALL Marks. Students and Subjects will be kept."
    );
    if (confirmText === "CLEAR") {
      localStorage.removeItem("academix_marks");
      alert("All marks have been deleted.");
      window.location.reload();
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPass.length < 6) {
      setPasswordMsg("Password must be at least 6 characters.");
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirmPass) {
      setPasswordMsg("Passwords do not match.");
      return;
    }
    storageService.changePassword(passwordForm.newPass);
    setPasswordMsg("Password updated successfully!");
    setPasswordForm({ newPass: "", confirmPass: "" });
  };

  // Filter Subjects
  const filteredLibrarySubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(subjectLibrarySearch.toLowerCase())
  );

  // Resolve Subject Teacher helper
  const getSubjectTeacherName = (subject: Subject, cls: SchoolClass) => {
    const override = classSubjectTeachers.find(
      (t) =>
        t.subjectId === subject.id &&
        t.className === cls.className &&
        t.section === cls.section
    );
    return override?.teacherName || subject.teacherName || "Unassigned";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
          <p className="text-gray-500">
            {isAdmin
              ? "Configure academic subjects, grading, and exams."
              : "Manage your profile and security."}
          </p>
        </div>
      </div>

      {/* Tabs - Only for Admin */}
      {isAdmin && (
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("subjects")}
            className={`px-5 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "subjects"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Book className="w-4 h-4" /> Subjects
            </div>
          </button>
          <button
            onClick={() => setActiveTab("classes")}
            className={`px-5 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "classes"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4" /> Classes & Teachers
            </div>
          </button>
          <button
            onClick={() => setActiveTab("teachers")}
            className={`px-5 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "teachers"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Teachers List
            </div>
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-5 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "sessions"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <School className="w-4 h-4" /> Academic Sessions
            </div>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-5 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "users"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" /> User Management
            </div>
          </button>
          <button
            onClick={() => setActiveTab("exams")}
            className={`px-5 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "exams"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Exam Terms
            </div>
          </button>
          <button
            onClick={() => setActiveTab("grading")}
            className={`px-5 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "grading"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Grading
            </div>
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`px-5 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "data"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" /> Data
            </div>
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-5 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "logs"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" /> Logs
            </div>
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`px-5 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "account"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" /> Account
            </div>
          </button>
        </div>
      )}

      <div
        className={`grid grid-cols-1 ${
          isAdmin ? "md:grid-cols-3" : "md:grid-cols-1 max-w-2xl mx-auto"
        } gap-8`}
      >
        {/* Main List Area */}
        <div className={isAdmin ? "md:col-span-2" : "md:col-span-1"}>
          {/* SUBJECTS TAB */}
          {isAdmin && activeTab === "subjects" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-primary-50 p-4 rounded-xl border border-primary-100">
                <div>
                  <h3 className="font-bold text-primary-900">
                    Subject Library
                  </h3>
                  <p className="text-sm text-primary-700">
                    Define all subjects taught in the school.
                  </p>
                </div>
                <button
                  onClick={() => setIsSubjectModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-xs transition"
                >
                  <Plus className="w-4 h-4" /> Add Subject
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="text-sm font-medium text-gray-500">
                    {subjects.length} Total Subjects
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search library..."
                      value={subjectLibrarySearch}
                      onChange={(e) => setSubjectLibrarySearch(e.target.value)}
                      className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 outline-none w-56"
                    />
                  </div>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                    <tr>
                      <th className="px-6 py-3">Subject Name</th>
                      <th className="px-6 py-3">Total Marks</th>
                      <th className="px-6 py-3">Default Teacher</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredLibrarySubjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3 font-bold text-gray-800">
                          {sub.name}
                        </td>
                        <td className="px-6 py-3">
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                            {sub.totalMarks}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {sub.teacherName ? (
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-3 h-3 text-gray-400" />{" "}
                              {sub.teacherName}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => handleDeleteSubject(sub.id)}
                            className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition"
                            title="Delete Subject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredLibrarySubjects.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-gray-400"
                        >
                          No subjects found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CLASSES TAB */}
          {isAdmin && activeTab === "classes" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <div>
                  <h3 className="font-bold text-gray-800">
                    Class Configuration
                  </h3>
                  <p className="text-sm text-gray-500">
                    Manage class sections, subject allocations, and teacher
                    assignments.
                  </p>
                </div>
                {!isSessionLocked ? (
                  <button
                    onClick={() => {
                      setEditingClass(null);
                      setIsClassModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" /> Create Class
                  </button>
                ) : (
                  <span className="text-xs text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-900/10">
                          {cls.className}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg">
                            Class {cls.className}
                            {cls.section ? ` - ${cls.section}` : ""}
                          </h4>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <UserIcon className="w-3 h-3" /> Homeroom:{" "}
                            <span className="font-medium text-gray-700">
                              {cls.classTeacherName ||
                                teachers.find(
                                  (t) => t.id === cls.classTeacherId
                                )?.name ||
                                "Unassigned"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingClass(cls);
                            setIsClassModalOpen(true);
                          }}
                          disabled={isSessionLocked}
                          className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-bold flex items-center gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          disabled={isSessionLocked}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50 transition border border-transparent hover:border-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-gray-400 uppercase">
                          Curriculum ({cls.subjectIds?.length || 0})
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cls.subjectIds && cls.subjectIds.length > 0 ? (
                          subjects
                            .filter((s) => cls.subjectIds?.includes(s.id))
                            .map((s) => (
                              <span
                                key={s.id}
                                className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 shadow-xs flex items-center gap-1"
                              >
                                <span className="font-semibold">{s.name}</span>
                                <span className="text-[10px] text-gray-400 border-l border-gray-200 pl-1 ml-1 truncate max-w-[80px]">
                                  {getSubjectTeacherName(s, cls)}
                                </span>
                              </span>
                            ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            No subjects allocated yet. Click Edit to configure.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {classes.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                    No classes configured for this session.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ... (Keep existing code for other tabs: Teachers, Sessions, Users, Exams, Grading, Logs, Data, Account) ... */}
          {isAdmin && activeTab === "teachers" && (
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <h3 className="font-bold text-gray-700">Staff List</h3>
                <p className="text-xs text-gray-500">
                  Manage names of teachers available for assignment. This list
                  is independent of login accounts.
                </p>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                  <tr>
                    <th className="px-6 py-3">Teacher Name</th>
                    <th className="px-6 py-3">Campus</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teachers.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-800">
                        {t.name}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs uppercase font-bold bg-primary-50 text-primary-700`}
                        >
                          {t.campus}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleDeleteTeacher(t.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {teachers.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        No teachers found. Add one on the right.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {isAdmin && activeTab === "sessions" && (
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                  <tr>
                    <th className="px-6 py-3">Session Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Lock</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-800">
                        {sess.name}
                        <div className="text-xs text-gray-400 font-normal">
                          {sess.startDate}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {sess.isActive ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">
                            Active
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs font-bold uppercase">
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {sess.isLocked ? (
                          <span className="flex items-center gap-1 text-red-600 text-xs font-bold">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                            <Unlock className="w-3 h-3" /> Open
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleSessionLock(sess.id)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                          title={
                            sess.isLocked ? "Unlock Session" : "Lock Session"
                          }
                        >
                          {sess.isLocked ? (
                            <Unlock className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </button>
                        {!sess.isActive && (
                          <button
                            onClick={() => handleSwitchSession(sess.id)}
                            className="text-primary-600 hover:underline text-sm font-medium"
                          >
                            Activate
                          </button>
                        )}
                        {sess.isActive && (
                          <span className="text-gray-400 text-xs italic px-2">
                            Current
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {isAdmin && activeTab === "users" && (
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <h3 className="font-bold text-gray-700">Login Accounts</h3>
                <p className="text-xs text-gray-500">
                  Manage users who can log in to the system (Admins and Staff).
                </p>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Username</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-800">
                        {u.name}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{u.username}</td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded disabled:opacity-50"
                          disabled={u.id === currentUser?.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {isAdmin && activeTab === "exams" && (
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-700">Exam Terms</h3>
                {isSessionLocked && (
                  <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded border border-red-100 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Session Locked
                  </span>
                )}
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                  <tr>
                    <th className="px-6 py-3">Exam Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-800">
                        {exam.name}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded w-fit ${
                            exam.isLocked
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {exam.isLocked ? (
                            <Lock className="w-3 h-3" />
                          ) : (
                            <Unlock className="w-3 h-3" />
                          )}
                          {exam.isLocked ? "Locked" : "Open"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => toggleLock(exam.id)}
                          className={`text-primary-600 hover:bg-primary-50 p-2 rounded text-sm font-medium ${
                            isSessionLocked
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          disabled={isSessionLocked}
                        >
                          {exam.isLocked ? "Unlock" : "Lock"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {exams.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-4 text-center text-gray-400"
                      >
                        No exams defined for current session
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {isAdmin && activeTab === "grading" && (
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-gray-800">Grading Scale</h3>
                  <p className="text-sm text-gray-500">
                    Define the minimum percentage required for each grade.
                  </p>
                </div>
                <button
                  onClick={saveGradingRules}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 shadow-xs transition"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>

              <div className="space-y-3">
                {gradingRules
                  .sort((a, b) => b.minPercentage - a.minPercentage)
                  .map((rule, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">
                          Grade Label
                        </label>
                        <input
                          type="text"
                          value={rule.label}
                          onChange={(e) =>
                            handleGradingChange(index, "label", e.target.value)
                          }
                          className="w-full px-3 py-1.5 border border-gray-300 rounded font-bold text-gray-800"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">
                          Min Percentage (%)
                        </label>
                        <input
                          type="number"
                          value={rule.minPercentage}
                          onChange={(e) =>
                            handleGradingChange(
                              index,
                              "minPercentage",
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-3 py-1.5 border border-gray-300 rounded"
                        />
                      </div>
                      <button
                        onClick={() => removeGradingRule(index)}
                        className="mt-5 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={addGradingRule}
                className="mt-4 flex items-center gap-2 text-sm text-primary-600 font-medium hover:text-primary-800"
              >
                <Plus className="w-4 h-4" /> Add New Grade Rule
              </button>
            </div>
          )}

          {isAdmin && activeTab === "logs" && (
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                    <tr>
                      <th className="px-6 py-3">Time</th>
                      <th className="px-6 py-3">Action</th>
                      <th className="px-6 py-3">Details</th>
                      <th className="px-6 py-3">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 text-sm">
                        <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 font-medium text-gray-800">
                          {log.action}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {log.details}
                        </td>
                        <td className="px-6 py-3 text-gray-500">
                          {log.userName} ({log.role})
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-4 text-center text-gray-400"
                        >
                          No activity logs recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isAdmin && activeTab === "data" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary-600" /> Backup Data
                </h3>
                <button
                  onClick={handleBackup}
                  className="px-4 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-100 font-medium transition"
                >
                  Download Backup JSON
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-orange-600" /> Restore Data
                </h3>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleRestoreFile}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={handleRestoreClick}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Upload Backup File
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-xs border border-red-200">
                <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" /> Danger Zone
                </h3>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleClearMarks}
                    className="px-3 py-1.5 bg-white border border-red-200 text-red-700 rounded text-xs hover:bg-red-50 flex items-center gap-1 w-fit"
                  >
                    <Eraser className="w-3 h-3" /> Clear Marks
                  </button>
                  <button
                    onClick={handleFactoryReset}
                    className="px-3 py-1.5 bg-red-600 text-white border border-red-600 rounded text-xs hover:bg-red-700 flex items-center gap-1 w-fit"
                  >
                    <Trash2 className="w-3 h-3" /> Reset System
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {currentUser?.name}
                  </h3>
                  <p className="text-gray-500 capitalize">
                    {currentUser?.role} Account | @{currentUser?.username}
                  </p>
                </div>
              </div>

              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-t pt-4">
                <Key className="w-5 h-5 text-primary-600" /> Change Password
              </h3>

              <form
                onSubmit={handlePasswordChange}
                className="max-w-md space-y-4"
              >
                {passwordMsg && (
                  <div
                    className={`p-3 rounded text-sm ${
                      passwordMsg.includes("success")
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {passwordMsg}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPass}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPass: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPass}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPass: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  Update Password
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Add New Form Area */}
        {isAdmin && (
          <div className="md:col-span-1 space-y-6">
            {/* Keep sidebar forms for Sessions, Exams, Users, Teachers */}
            {activeTab === "sessions" && (
              <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 sticky top-6">
                <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Start New Session
                </h3>
                <p className="text-xs text-indigo-700 mb-4">
                  Starting a new session will hide all current students and
                  marks. Old data is preserved and can be viewed by switching
                  sessions.
                </p>
                <form onSubmit={handleCreateSession} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-indigo-800 mb-1">
                      Session Name (e.g. 2025-2026)
                    </label>
                    <input
                      type="text"
                      required
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="YYYY-YYYY"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-xs"
                  >
                    Create & Activate
                  </button>
                </form>
              </div>
            )}

            {activeTab === "exams" && (
              <div className="bg-secondary-50 p-6 rounded-xl border border-secondary-200 sticky top-6">
                <h3 className="font-bold text-secondary-800 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Add Exam Term
                </h3>
                <form onSubmit={handleAddExam} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-800 mb-1">
                      Exam Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newExam.name}
                      onChange={(e) =>
                        setNewExam({ ...newExam, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 outline-none"
                      placeholder="e.g. Mid Term"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 font-medium shadow-xs transition"
                  >
                    Create Exam
                  </button>
                </form>
              </div>
            )}

            {activeTab === "users" && (
              <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 sticky top-6">
                <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Add User Account
                </h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-800 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-800 mb-1">
                      Role
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({ ...newUser, role: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="teacher">Teacher</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-800 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.username}
                      onChange={(e) =>
                        setNewUser({ ...newUser, username: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-800 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium shadow-xs"
                  >
                    Create User
                  </button>
                </form>
              </div>
            )}

            {activeTab === "teachers" && (
              <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 sticky top-6">
                <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Add Staff Member
                </h3>
                <form onSubmit={handleAddTeacher} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-800 mb-1">
                      Teacher Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newTeacher.name}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-800 mb-1">
                      Campus Assignment
                    </label>
                    <select
                      value={newTeacher.campus}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, campus: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      <option value="Both">Both Campuses</option>
                      <option value="Boys">Boys Campus</option>
                      <option value="Girls">Girls Campus</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-xs"
                  >
                    Add Teacher
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Add New Subject</h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={newSubject.name}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="e.g. Mathematics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  required
                  value={newSubject.totalMarks}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      totalMarks: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Teacher (Optional)
                </label>
                <SearchableTeacherSelect
                  teachers={teachers}
                  value={newSubject.teacherName}
                  onChange={(name) =>
                    setNewSubject({ ...newSubject, teacherName: name })
                  }
                  placeholder="Select Default Teacher"
                />
                <p className="text-xs text-gray-400 mt-1">
                  This teacher will be assigned automatically unless overridden
                  at class level.
                </p>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium mt-2 shadow-xs transition"
              >
                Create Subject
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Unified Class Configuration Modal */}
      {isClassModalOpen && (
        <ClassConfigurationModal
          schoolClass={editingClass}
          allSubjects={subjects}
          allTeachers={teachers}
          onClose={() => setIsClassModalOpen(false)}
          onSave={refreshData}
        />
      )}
    </div>
  );
};

export default Settings;
