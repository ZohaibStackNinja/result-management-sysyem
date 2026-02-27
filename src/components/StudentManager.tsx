import React, { useState, useEffect, useRef, useMemo } from "react";
import backendService from "../../services/backendService";
import { Student, SchoolClass, ExamTerm, Session } from "../../types";
import {
  Trash2,
  Search,
  Download,
  UserPlus,
  Upload,
  Edit,
  X,
  Printer,
  FileCheck,
  Lock,
  Building2,
  Layers,
  GraduationCap,
  Check,
  Filter,
  ChevronDown,
  User,
} from "lucide-react";
import { exportToCSV, parseCSV } from "../../utils/csvHelper";

const StudentManager: React.FC<{ user?: any }> = ({ user }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({
    name: "",
    rollNumber: "",
    campus: "Boys",
    className: "",
    section: "",
    parentPhone: "",
  });
  const [isCustomClass, setIsCustomClass] = useState(false);
  const [filterCampus, setFilterCampus] = useState("Boys");
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [isGeneratingRoll, setIsGeneratingRoll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const [studentsData, classesData] = await Promise.all([
      backendService.getStudents(),
      backendService.getClasses(),
    ]);
    setStudents(studentsData);
    setSchoolClasses(classesData);
    setIsSessionLocked(await backendService.isSessionLocked());
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.className || !formData.rollNumber) {
      alert("Name, class and student ID (roll number) are required");
      return;
    }

    try {
      if (editingId) {
        await backendService.updateStudent(editingId, formData);
      } else {
        await backendService.addStudent(formData as Student);
      }
      closeModal();
      loadStudents();
    } catch (err: any) {
      alert(err.message || "Failed to save student");
    }
  };

  const handleDelete = (id: string) => {
    if (isSessionLocked) return;
    if (
      confirm(
        "Are you sure you want to delete this student? Marks data will be preserved but orphaned.",
      )
    ) {
      backendService.deleteStudent(id);
      loadStudents();
    }
  };

  const handleEdit = (student: Student) => {
    if (isSessionLocked) return;
    setFormData(student);
    setEditingId(student.id);
    const exists = schoolClasses.some(
      (c) => c.className === student.className && c.section === student.section,
    );
    setIsCustomClass(!exists && schoolClasses.length > 0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      rollNumber: "",
      campus: "Boys",
      className: "",
      section: "",
      parentPhone: "",
    });
    setIsCustomClass(false);
  };

  const generateRollNumber = async (campus: "Boys" | "Girls") => {
    try {
      setIsGeneratingRoll(true);
      const next = await backendService.getNextStudentId({ campus });
      if (!next) return;
      setFormData((prev) => {
        // Do not overwrite user-entered/custom values while editing.
        if (editingId) return prev;
        return { ...prev, rollNumber: next };
      });
    } catch (err) {
      console.error("Failed to generate student ID:", err);
    } finally {
      setIsGeneratingRoll(false);
    }
  };

  useEffect(() => {
    if (!isModalOpen || !!editingId) return;
    const campus = (formData.campus || "Boys") as "Boys" | "Girls";
    generateRollNumber(campus);
  }, [isModalOpen, editingId, formData.campus]);

  const getCSVValue = (row: any, possibleKeys: string[]) => {
    const rowKeys = Object.keys(row);

    for (const key of possibleKeys) {
      const foundKey = rowKeys.find(
        (k) =>
          k
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[^a-z0-9]/g, "") ===
          key
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[^a-z0-9]/g, ""),
      );

      if (foundKey && row[foundKey] != null) {
        return row[foundKey];
      }
    }

    return "";
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const data = await parseCSV(file);
        const mappedStudents: Student[] = data
          .map((row: any) => {
            const name = safeString(
              getCSVValue(row, [
                "Name",
                "Student Name",
                "Student",
                "Full Name",
                "StudentName",
              ]),
            );

            const className = safeString(
              getCSVValue(row, [
                "Class",
                "Class Name",
                "Grade",
                "Grade Name",
                "Standard",
                "Year",
              ]),
            );

            const roll = safeString(
              getCSVValue(row, [
                "RollNo",
                "Roll No",
                "Roll Number",
                "ID",
                "Reg No",
                "Registration No",
              ]),
            );

            if (!name || !className || !roll) return null;

            return {
              id: "",
              rollNumber: roll,
              name,
              campus: (() => {
                const raw = safeString(
                  getCSVValue(row, ["Campus", "Gender", "Branch"]),
                ).toLowerCase();
                if (raw.includes("girl") || raw.includes("female"))
                  return "Girls";
                return "Boys";
              })(),
              className,
              section: safeString(
                getCSVValue(row, ["Section", "Sec", "Class Section"]),
              ),
              parentPhone: safeString(
                getCSVValue(row, [
                  "Phone",
                  "Parent Phone",
                  "Mobile",
                  "Contact",
                  "Cell",
                ]),
              ),
              sessionId: "",
            };
          })
          .filter(Boolean) as Student[];

        if (mappedStudents.length > 0) {
          try {
            const resp: any =
              await backendService.addStudentsBulk(mappedStudents);
            loadStudents();
            alert(
              `Import finished: ${resp.imported || mappedStudents.length} added, ${
                resp.errors ? resp.errors.length : 0
              } errors`,
            );
          } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to import students");
          }
        } else {
          alert("No valid student data found in CSV.");
        }
      } catch (err: any) {
        console.error(err);
        alert(err.message || "Error parsing CSV file");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExport = () => {
    if (filteredStudents.length === 0) return;
    const data = filteredStudents.map(
      ({
        id,
        sessionId,
        attendancePresent,
        attendanceTotal,
        attendancePercentage,
        ...rest
      }) => rest,
    );
    const filename = `Students_${filterCampus || "All"}_${
      filterClass || "All"
    }${filterSection ? "_" + filterSection : ""}`;
    exportToCSV(data, filename);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.rollNumber || "").toLowerCase().includes(search.toLowerCase());
    const matchesClass = filterClass ? s.className === filterClass : true;
    const matchesSection = filterSection ? s.section === filterSection : true;
    const matchesCampus = filterCampus ? s.campus === filterCampus : true;
    return matchesSearch && matchesClass && matchesSection && matchesCampus;
  });

  const sortClasses = (a: string, b: string) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  };

  const uniqueClasses = useMemo(() => {
    const classSet = new Set<string>();
    schoolClasses.forEach((c) => classSet.add(c.className));
    students.forEach((s) => {
      if (s.className) classSet.add(s.className);
    });
    return Array.from(classSet).sort(sortClasses);
  }, [schoolClasses, students]);

  const uniqueSections = useMemo(() => {
    const sectionSet = new Set<string>();
    const relevantClasses = filterClass
      ? schoolClasses.filter((c) => c.className === filterClass)
      : schoolClasses;
    relevantClasses.forEach((c) => c.section && sectionSet.add(c.section));
    const relevantStudents = filterClass
      ? students.filter((s) => s.className === filterClass)
      : students;
    relevantStudents.forEach((s) => {
      if (s.section !== undefined) sectionSet.add(s.section);
    });
    return Array.from(sectionSet).sort();
  }, [schoolClasses, students, filterClass]);

  const getStudentCount = (criteria: {
    campus?: string;
    className?: string;
    section?: string;
  }) => {
    return students.filter((s) => {
      const mCampus = criteria.campus ? s.campus === criteria.campus : true;
      const mClass = criteria.className
        ? s.className === criteria.className
        : true;
      const mSection = criteria.section ? s.section === criteria.section : true;
      return mCampus && mClass && mSection;
    }).length;
  };

  return (
    <div className="">
      {isSessionLocked && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-xs flex items-start gap-3 mb-6">
          <Lock className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-bold">Session is Locked</h3>
            <p className="text-red-700 text-sm">
              You are viewing an archived session. Add, Edit, and Delete actions
              are disabled.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Student Directory
          </h2>
          <p className="text-gray-500 text-sm">
            {students.length} Total Students Registered
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!isSessionLocked && (
            <>
              <button
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: "",
                    rollNumber: "",
                    campus: "Boys",
                    className: "",
                    section: "",
                    parentPhone: "",
                  });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-xs"
              >
                <UserPlus className="w-4 h-4" /> Add Student
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".csv"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <Upload className="w-4 h-4" /> Import CSV
              </button>
            </>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs mt-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search student name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition text-sm"
          />
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2 tracking-wider">
            <Building2 className="w-4 h-4" /> 1. Select Campus
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {[
              { id: "Boys", label: "Boys Campus", color: "bg-primary-50" },
              { id: "Girls", label: "Girls Campus", color: "bg-primary-50" },
            ].map((option) => {
              const isSelected = filterCampus === option.id;
              const count = getStudentCount({ campus: option.id });
              return (
                <button
                  key={option.id}
                  onClick={() => setFilterCampus(option.id)}
                  className={`
                                        flex-1 min-w-35 max-w-55 px-4 py-3 rounded-xl border transition-all text-left relative overflow-hidden group
                                        ${
                                          isSelected
                                            ? "border-primary-600 ring-1 ring-primary-600 bg-white shadow-xs"
                                            : `border-gray-200 hover:border-primary-300 hover:bg-gray-50`
                                        }
                                    `}
                >
                  <div className="flex justify-between w-full mb-1 relative z-10">
                    <span
                      className={`font-bold text-sm ${
                        isSelected ? "text-primary-700" : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary-600" />
                    )}
                  </div>
                  <div
                    className={`text-xs ${
                      isSelected ? "text-primary-600" : "text-gray-500"
                    } relative z-10`}
                  >
                    {count} Students
                  </div>
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary-50 opacity-50 z-0"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Class Selection */}
        <div className="mt-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2 tracking-wider">
            <Layers className="w-4 h-4" /> 2. Select Class
          </h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                setFilterClass("");
                setFilterSection("");
              }}
              className={`px-3 py-1.5 rounded-lg text-sm border ${
                !filterClass
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              All Classes
            </button>
            {uniqueClasses.map((cls) => (
              <button
                key={cls}
                onClick={() => {
                  setFilterClass(cls);
                  setFilterSection("");
                }}
                className={`px-3 py-1.5 rounded-lg text-sm border ${
                  filterClass === cls
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Class {cls}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Section Selection */}
        {filterClass && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2 tracking-wider">
              <Filter className="w-4 h-4" /> 3. Select Section
            </h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterSection("")}
                className={`px-3 py-1.5 rounded-lg text-sm border ${
                  !filterSection
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                All Sections
              </button>
              {uniqueSections.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setFilterSection(sec)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    filterSection === sec
                      ? "bg-secondary-600 text-white border-secondary-600"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Section {sec}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Students List */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <span className="font-bold text-gray-700 text-sm">
            Showing {filteredStudents.length} students
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-gray-600 text-xs uppercase border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold">Roll No</th>
                <th className="px-6 py-4 font-bold">Name</th>
                <th className="px-6 py-4 font-bold">Campus</th>
                <th className="px-6 py-4 font-bold">Class/Sec</th>
                <th className="px-6 py-4 font-bold">Parent Phone</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-primary-50 transition group"
                  >
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {student.rollNumber}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-800 uppercase">
                      {student.name}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {student.campus}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">
                        {student.className}{" "}
                        {student.section ? `- ${student.section}` : ""}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500 font-mono text-xs">
                      {student.parentPhone || "-"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(student)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!isSessionLocked && (
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No students found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">
                {editingId ? "Edit Student" : "Register New Student"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campus
                  </label>
                  <select
                    value={formData.campus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        campus: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="Boys">Boys Campus</option>
                    <option value="Girls">Girls Campus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Roll Number
                    {isGeneratingRoll && (
                      <span className="ml-2 text-xs text-gray-500">
                        Generating...
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, rollNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Enter student ID"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  {isCustomClass ? (
                    <input
                      type="text"
                      required
                      value={formData.className}
                      onChange={(e) =>
                        setFormData({ ...formData, className: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="e.g. 10"
                    />
                  ) : (
                    <select
                      value={formData.className}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "__custom__") setIsCustomClass(true);
                        else setFormData({ ...formData, className: val });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      <option value="">Select Class</option>
                      {uniqueClasses.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option
                        value="__custom__"
                        className="font-bold text-primary-600"
                      >
                        + Add New Class
                      </option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g. A (Optional)"
                  />
                </div>
              </div>

              {isCustomClass && (
                <button
                  type="button"
                  onClick={() => setIsCustomClass(false)}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Back to Class Selection
                </button>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Phone{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.parentPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, parentPhone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium mt-2 shadow-xs transition"
              >
                {editingId ? "Update Student" : "Register Student"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
function safeString(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  try {
    return String(value).replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}
