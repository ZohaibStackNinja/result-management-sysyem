import React, { useState, useEffect, useRef, useMemo } from "react";
import backendService from "../../services/backendService";
import {
  Student,
  Subject,
  ExamTerm,
  MarkEntry,
  SchoolClass,
  Teacher,
} from "../../types";
import {
  Save,
  Upload,
  Check,
  User as UserIcon,
  Printer,
  ClipboardList,
  X,
  BookOpen,
  Search,
  Edit2,
  Lock,
  Filter,
  ChevronDown,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import { parseCSV } from "../../utils/csvHelper";
import { SearchableTeacherSelect } from "./SearchableTeacherSelect";

const SingleSubjectTeacherModal: React.FC<{
  className: string;
  section: string;
  subject: Subject;
  currentTeacher: string;
  onClose: () => void;
  onSave: () => void;
}> = ({ className, section, subject, currentTeacher, onClose, onSave }) => {
  const [selectedTeacher, setSelectedTeacher] = useState(currentTeacher);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    (async () => {
      const loadedTeachers = await backendService.getTeachers();
      setTeachers(loadedTeachers);
    })();
  }, []);

  const handleSave = () => {
    try {
      backendService.assignClassTeacher({
        id: `${className}-${section}-${subject.id}`,
        className,
        section,
        subjectId: subject.id,
        teacherName: selectedTeacher,
        sessionId: "",
      });
      onSave();
      onClose();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Assign Subject Teacher</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6 bg-primary-50 p-4 rounded-xl border border-primary-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-lg shadow-xs text-primary-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-primary-600 font-bold uppercase tracking-wider">
                  Subject Context
                </p>
                <p className="font-bold text-gray-900 text-lg leading-none">
                  {subject.name}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 pl-13">
              Class <span className="font-bold text-gray-800">{className}</span>
              {section && (
                <span className="font-bold text-gray-800"> - {section}</span>
              )}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
              Select Teacher
            </label>
            <SearchableTeacherSelect
              teachers={teachers}
              value={selectedTeacher}
              onChange={setSelectedTeacher}
              placeholder="Assign a teacher..."
              className="shadow-xs"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-bold text-sm transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold shadow-lg shadow-primary-900/10 text-sm transition flex justify-center items-center gap-2"
            >
              <Check className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PrintableSheet: React.FC<{
  className: string;
  section: string;
  students: any[];
  onClose: () => void;
  examName: string;
  subjectName?: string;
  subjectId?: string;
  session: string;
  subjects: Subject[];
}> = ({
  className,
  section,
  students,
  onClose,
  examName,
  subjectName,
  subjectId,
  session,
  subjects,
}) => {
  const sessionName = (session as any)?.name || session || "";
  const printRef = useRef<HTMLDivElement>(null);

  const sortedStudents = [...students].sort((a, b) =>
    a.rollNumber.localeCompare(b.rollNumber),
  );
  const itemsPerCol = 30;
  const col1 = sortedStudents.slice(0, itemsPerCol);
  const col2 = sortedStudents.slice(itemsPerCol, itemsPerCol * 2);
  const handlePrint = () => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;

    window.location.reload(); // restore React safely
  };
  return (
    <div
      ref={printRef}
      className="fixed inset-0 bg-white z-100 overflow-auto print:break-inside-avoid print:break-after-avoid text-slate-900"
    >
      <div className="no-print p-4 bg-gray-100 border-b flex justify-between items-center print:hidden sticky top-0 shadow-xs">
        <h2 className="font-bold text-gray-700 flex items-center gap-2">
          <Printer className="w-5 h-5 text-gray-500" /> Print Award List
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary-700 shadow-xs transition"
          >
            <Printer className="w-4 h-4" /> Print Now
          </button>
          <button
            onClick={onClose}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>

      <div
        className="max-w-[21cm]
    mx-auto
    bg-white
    min-h-screen
    p-8
    print:pt-0
    print:pb-0
    print:px-[5mm]
    print:max-w-none"
      >
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wider">
            New Covenant School System
          </h1>
          <div className="flex justify-center items-center gap-4 mt-1 mb-2">
            <span className="px-3 py-1 bg-black text-white text-sm font-bold uppercase rounded-sm print:bg-black print:text-white">
              Award List / Marking Sheet
            </span>
          </div>

          <div className="border-2 border-black p-2 mt-4 flex justify-between items-end text-sm font-bold">
            <div className="text-left space-y-1">
              <div>
                SESSION:{" "}
                <span className="font-normal border-b border-black inline-block min-w-25">
                  {sessionName}
                </span>
              </div>
              <div>
                CLASS:{" "}
                <span className="font-normal border-b border-black inline-block min-w-12.5">
                  {className}
                </span>{" "}
                SECTION:{" "}
                <span className="font-normal border-b border-black inline-block min-w-12.5">
                  {section || "-"}
                </span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div>
                EXAM:{" "}
                <span className="font-normal border-b border-black inline-block min-w-37.5">
                  {examName}
                </span>
              </div>
              {subjectName && (
                <div>
                  SUBJECT:{" "}
                  <span className="font-normal border-b border-black inline-block min-w-37.5">
                    {subjectName}
                  </span>
                </div>
              )}
              <div>
                MAX MARKS:{" "}
                <span className="font-normal border-b border-black inline-block min-w-15"></span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex-1">
            <TableCol
              data={col1}
              startIdx={0}
              showTP={
                !!subjects.find(
                  (s) => s.id === subjectId || s.name === subjectName,
                )?.components
              }
            />
          </div>
          <div className="flex-1">
            <TableCol
              data={col2}
              startIdx={itemsPerCol}
              showTP={
                !!subjects.find(
                  (s) => s.id === subjectId || s.name === subjectName,
                )?.components
              }
            />
          </div>
        </div>

        <div className="mt-8 flex justify-between text-xs font-bold pt-8 border-gray-300">
          <div className="text-center">
            <div className="w-40 border-b border-black mb-1"></div>
            Subject Teacher
          </div>
          <div className="text-center">
            <div className="w-40 border-b border-black mb-1"></div>
            Exam Controller
          </div>
          <div className="text-center">
            <div className="w-40 border-b border-black mb-1"></div>
            Date
          </div>
        </div>
      </div>
    </div>
  );
};

const TableCol = ({ data, startIdx, showTP = false }: any) => (
  <table className="w-full border-collapse border border-black text-xs">
    <thead>
      <tr className="bg-gray-100 print:bg-gray-50">
        <th className="border border-black p-1 w-8 text-center">S.No</th>
        <th className="border border-black p-1 w-16 text-center">Roll No</th>
        <th className="border border-black p-1 text-left pl-2">Name</th>
        {showTP ? (
          <>
            <th className="border border-black p-1 w-12 text-center">T</th>
            <th className="border border-black p-1 w-12 text-center">P</th>
          </>
        ) : (
          <th className="border border-black p-1 w-16 text-center">Marks</th>
        )}
      </tr>
    </thead>
    <tbody>
      {data.map((s: any, i: number) => (
        <tr key={s.id} className="h-6 print:h-[6.35mm]">
          <td className="border border-black p-0 text-center">
            {startIdx + i + 1}
          </td>
          <td className="border border-black p-0 text-center font-bold">
            {s.rollNumber}
          </td>
          <td className="border border-black p-0 pl-2 truncate max-w-37.5 uppercase">
            {s.name}
          </td>
          {showTP ? (
            <>
              <td className="border border-black p-0"></td>
              <td className="border border-black p-0"></td>
            </>
          ) : (
            <td className="border border-black p-0"></td>
          )}
        </tr>
      ))}
      {Array.from({ length: Math.max(0, 30 - data.length) }).map((_, i) => (
        <tr key={`empty-${i}`} className="h-6 print:h-[6.35mm]">
          <td className="border border-black p-0 text-center text-gray-300">
            {startIdx + data.length + i + 1}
          </td>
          <td className="border border-black p-0"></td>
          <td className="border border-black p-0"></td>
          {showTP ? (
            <>
              <td className="border border-black p-0"></td>
              <td className="border border-black p-0"></td>
            </>
          ) : (
            <td className="border border-black p-0"></td>
          )}
        </tr>
      ))}
    </tbody>
  </table>
);
const AttendanceSheet: React.FC<{
  className: string;
  section: string;
  students: any[];
  examName: string;
  onClose: () => void;
  session: string;
}> = ({ className, section, students, onClose, examName, session }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const sessionName = (session as any)?.name || session || "";

  // Sort by roll number
  const sortedStudents = [...students].sort((a, b) =>
    a.rollNumber.localeCompare(b.rollNumber),
  );

  // Split into 2 columns (max 30 per column)
  const itemsPerCol = 30;
  const col1 = sortedStudents.slice(0, itemsPerCol);
  const col2 = sortedStudents.slice(itemsPerCol, itemsPerCol * 2);
  const handlePrint = () => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;

    window.location.reload(); // restore React safely
  };
  return (
    <div
      ref={printRef}
      className="fixed inset-0 bg-white z-100 overflow-auto text-slate-900 print:break-inside-avoid print:break-after-avoid"
    >
      <div className="no-print p-4 bg-gray-100 border-b flex justify-between items-center print:hidden sticky top-0">
        <h2 className="font-bold text-gray-700">Print Exam Attendance Sheet</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-primary-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-primary-700"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>

      <div
        className="max-w-[21cm]
    mx-auto
    bg-white
    min-h-screen
    p-8
    print:pt-0
    print:pb-0
    print:px-[5mm]
    print:max-w-none"
      >
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wider">
            New Covenant School System
          </h1>
          <div className="flex justify-center items-center gap-4 mt-1 mb-2">
            <span className="px-3 py-1 bg-black text-white text-sm font-bold uppercase rounded-sm print:bg-black print:text-white">
              Exam Attendance Sheet
            </span>
          </div>

          <div className="border-2 border-black p-2 mt-4 flex justify-between items-end text-sm font-bold">
            <div className="text-left space-y-1">
              <div>
                SESSION:{" "}
                <span className="font-normal border-b border-black inline-block min-w-25">
                  {sessionName}
                </span>
              </div>
              <div>
                CLASS:{" "}
                <span className="font-normal border-b border-black inline-block min-w-12.5">
                  {className || "All"}
                </span>{" "}
                SECTION:{" "}
                <span className="font-normal border-b border-black inline-block min-w-12.5">
                  {section || ""}
                </span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div>
                EXAM:{" "}
                <span className="font-normal border-b border-black inline-block min-w-25">
                  {examName}
                </span>
              </div>
              <div>
                DATE:{" "}
                <span className="font-normal border-b border-black inline-block min-w-25"></span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex-1">
            <AttendanceTableCol data={col1} startIdx={0} />
          </div>
          <div className="flex-1">
            <AttendanceTableCol data={col2} startIdx={itemsPerCol} />
          </div>
        </div>
        <div className="mt-8 flex justify-between text-xs font-bold pt-8  border-gray-300">
          <div className="text-center">
            <div className="w-40 border-b border-black mb-1"></div>
            Invigilator Signature
          </div>
          <div className="text-center">
            <div className="w-40 border-b border-black mb-1"></div>
            Exam Controller
          </div>
        </div>
      </div>
    </div>
  );
};

const AttendanceTableCol = ({ data, startIdx }: any) => (
  <table className="w-full border-collapse border border-black text-xs">
    <thead>
      <tr className="bg-gray-100 print:bg-gray-50">
        <th className="border border-black p-1 w-8 text-center">S.No</th>
        <th className="border border-black p-1 w-16 text-center">Roll No</th>
        <th className="border border-black p-1 text-left pl-2">Name</th>
        <th className="border border-black p-1 w-16 text-center">Attend</th>
      </tr>
    </thead>
    <tbody>
      {data.map((s: any, i: number) => (
        <tr key={s.id} className="h-6 print:h-[6.35mm]">
          <td className="border border-black p-0 text-center">
            {startIdx + i + 1}
          </td>
          <td className="border border-black p-0 text-center font-bold">
            {s.rollNumber}
          </td>
          <td className="border border-black p-0 pl-2 truncate max-w-37.5 uppercase">
            {s.name}
          </td>
          <td className="border border-black p-0"></td>
        </tr>
      ))}
      {Array.from({ length: Math.max(0, 30 - data.length) }).map((_, i) => (
        <tr key={`empty-${i}`} className="h-6 print:h-[6.35mm]">
          <td className="border border-black p-0 text-center text-gray-300">
            {startIdx + data.length + i + 1}
          </td>
          <td className="border border-black p-0"></td>
          <td className="border border-black p-0"></td>
          <td className="border border-black p-0"></td>
        </tr>
      ))}
    </tbody>
  </table>
);
const MarksEntry: React.FC<{ user?: any }> = ({ user }) => {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [exams, setExams] = useState<ExamTerm[]>([]);

  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedCampus, setSelectedCampus] = useState<string>("Boys");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");

  const [subjectSearch, setSubjectSearch] = useState("");

  // Teacher Context State
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  const [marksBuffer, setMarksBuffer] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showMarkingSheet, setShowMarkingSheet] = useState(false);
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [isTermLocked, setIsTermLocked] = useState(false);

  // Attendance State
  const [totalAttendanceDays, setTotalAttendanceDays] = useState<number>(0);
  const [isMarksFinalized, setIsMarksFinalized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<any>(undefined);
  const currentUser = user;
  const isAdmin = currentUser?.role === "admin";
  const isTeacher = currentUser?.role === "teacher";
  const isMarksLockedForTeacher = isTeacher && isMarksFinalized;
  const isLocked = isSessionLocked || isTermLocked || isMarksLockedForTeacher;
  const ATTENDANCE_SUBJECT_ID = "term-attendance";
  const [search, setSearch] = useState("");
  const [isAttendanceSheetOpen, setIsAttendanceSheetOpen] = useState(false);
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass ? s.className === selectedClass : true;
    const matchesSection = selectedSection
      ? s.section === selectedSection
      : true;
    const matchesCampus = selectedCampus ? s.campus === selectedCampus : true;
    return matchesSearch && matchesClass && matchesSection && matchesCampus;
  });
  useEffect(() => {
    refreshData();
  }, [selectedClass, selectedSection, selectedExam]);

  const refreshData = async () => {
    try {
      const [loadedStudents, loadedClasses, loadedSubjects, loadedExams] =
        await Promise.all([
          backendService.getStudents(),
          backendService.getClasses(),
          backendService.getSubjects(),
          backendService.getExams(),
        ]);
      setAllStudents(loadedStudents);
      setSubjects(loadedSubjects);
      setSchoolClasses(loadedClasses);
      setExams(loadedExams);
      setIsSessionLocked(await backendService.isSessionLocked());
      setSession(await backendService.getActiveSession());
      const exam = loadedExams.find((e) => e.id === selectedExam);
      setIsTermLocked(!!exam?.isLocked);

      if (loadedExams.length > 0 && !selectedExam)
        setSelectedExam(loadedExams[0].id);
      if (loadedSubjects.length > 0 && !selectedSubject) {
        setSelectedSubject(loadedSubjects[0].id);
      }

      if (!selectedClass && !selectedSection) {
        if (loadedClasses.length > 0) {
          setSelectedClass(loadedClasses[0].className);
          setSelectedSection(loadedClasses[0].section || "");
        } else if (loadedStudents.length > 0) {
          const uniqueClasses = Array.from(
            new Set(loadedStudents.map((s: any) => s.className)),
          ).sort();
          if (uniqueClasses.length > 0) {
            const cls = uniqueClasses[0];
            const s = loadedStudents.find((st: any) => st.className === cls);
            if (s) {
              setSelectedClass(s.className);
              setSelectedSection(s.section);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to refresh data:", err);
    }
  };
  useEffect(() => {
    if (!selectedExam) return;
    const exam = exams.find((e) => e.id === selectedExam);
    setIsTermLocked(!!exam?.isLocked);
  }, [selectedExam, exams]);
  useEffect(() => {
    let filtered = allStudents;
    if (selectedCampus) {
      filtered = filtered.filter((s) => s.campus === selectedCampus);
    }
    if (selectedClass) {
      filtered = filtered.filter((s) => {
        if (s.className !== selectedClass) return false;
        if (selectedSection) {
          return s.section === selectedSection;
        }
        return true;
      });
    }
    // Sort by roll number for easier entry
    filtered.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
    setStudents(filtered);
  }, [selectedCampus, selectedClass, selectedSection, allStudents]);

  useEffect(() => {
    if (selectedExam && selectedSubject) {
      (async () => {
        if (selectedSubject === ATTENDANCE_SUBJECT_ID) {
          // Attendance Mode: Load specific exam term attendance
          const config = await backendService.getClassAttendance(
            selectedClass,
            selectedSection,
            selectedExam,
          );
          setTotalAttendanceDays(config?.totalDays || 100);

          const existingMarks = await backendService.getMarks({
            examId: selectedExam,
          });
          const buffer: { [key: string]: number } = {};

          allStudents.forEach((student) => {
            // Look for attendance records specifically for this exam term
            const mark = existingMarks.find(
              (m) =>
                m.studentId === student.id &&
                m.subjectId === ATTENDANCE_SUBJECT_ID,
            );
            if (mark && mark.obtainedMarks !== undefined) {
              buffer[student.id] = mark.obtainedMarks;
            }
          });
          setMarksBuffer(buffer);
        } else {
          const existingMarks = await backendService.getMarks({
            examId: selectedExam,
          });
          const buffer: {
            [key: string]: number | { theory?: number; practical?: number };
          } = {};

          // Determine current subject config (components may be defined)
          const curSubject = subjects.find((s) => s.id === selectedSubject);

          allStudents.forEach((student) => {
            const mark = existingMarks.find(
              (m) =>
                m.studentId === student.id && m.subjectId === selectedSubject,
            );
            if (mark) {
              if (curSubject && curSubject.components) {
                buffer[student.id] = {
                  theory:
                    mark.theoryMarks !== undefined
                      ? mark.theoryMarks
                      : mark.obtainedMarks,
                  practical:
                    mark.practicalMarks !== undefined ? mark.practicalMarks : 0,
                };
              } else {
                if (mark.obtainedMarks !== undefined) {
                  buffer[student.id] = mark.obtainedMarks;
                }
              }
            }
          });
          setMarksBuffer(buffer as any);
        }
        setSaved(false);
      })();
    }
  }, [
    selectedExam,
    selectedSubject,
    selectedClass,
    selectedSection,
    allStudents,
    students,
  ]);

  const classes = useMemo(() => {
    const fromConfig = schoolClasses
      .filter((c: any) => c.campus === selectedCampus || c.campus === "Both")
      .map((c) => c.className);
    const fromStudents = allStudents
      .filter((s) => s.campus === selectedCampus || selectedCampus === "")
      .map((s) => s.className);
    const set = new Set<string>([...fromConfig, ...fromStudents]);
    return Array.from(set).sort();
  }, [selectedCampus, schoolClasses, allStudents]);

  const sections = useMemo(() => {
    if (!selectedClass) return [];
    const configSections = schoolClasses
      .filter(
        (c) =>
          c.className === selectedClass &&
          (c.campus === selectedCampus || c.campus === "Both"),
      )
      .map((c) => c.section || "");
    const studentSections = allStudents
      .filter((s) => s.className === selectedClass)
      .map((s) => s.section || "");
    const set = new Set<string>([...configSections, ...studentSections]);
    return Array.from(set).sort();
  }, [selectedClass, selectedCampus, schoolClasses, allStudents]);

  useEffect(() => {
    if (!selectedClass) return;
    const hasSections = sections.some((s) => Boolean(s));
    // For classes without sections, keep section empty so downstream filters use class-only logic.
    if (!hasSections && selectedSection !== "") {
      setSelectedSection("");
      return;
    }
    // When class has sections, pick the first available section if current one is invalid.
    if (
      hasSections &&
      selectedSection &&
      !sections.includes(selectedSection)
    ) {
      const firstNonEmpty = sections.find((s) => Boolean(s)) || "";
      setSelectedSection(firstNonEmpty);
    }
  }, [selectedClass, sections, selectedSection]);

  const filteredSubjects = useMemo(() => {
    let relevant = [...subjects];
    // Filter by class config if exists
    const clsConfig = schoolClasses.find(
      (c) =>
        c.className === selectedClass &&
        c.section === selectedSection &&
        (c.campus === selectedCampus || c.campus === "Both"),
    );
    if (clsConfig && clsConfig.subjectIds && clsConfig.subjectIds.length > 0) {
      relevant = subjects.filter((s) => clsConfig.subjectIds?.includes(s.id));
    }

    // Inject Term Attendance as a virtual subject
    relevant.push({
      id: ATTENDANCE_SUBJECT_ID,
      name: "Term Attendance",
      totalMarks: totalAttendanceDays,
      teacherName: "Class Teacher",
    });

    return relevant.filter((s) =>
      (s.name || "").toLowerCase().includes(subjectSearch.toLowerCase()),
    );
  }, [
    subjects,
    selectedClass,
    selectedSection,
    schoolClasses,
    subjectSearch,
    totalAttendanceDays,
  ]);

  useEffect(() => {
    if (!filteredSubjects.length) {
      if (selectedSubject) setSelectedSubject("");
      return;
    }
    if (filteredSubjects.length === 1) {
      const onlySubjectId = filteredSubjects[0].id;
      if (selectedSubject !== onlySubjectId) {
        setSelectedSubject(onlySubjectId);
      }
      return;
    }
    const exists = filteredSubjects.some((s) => s.id === selectedSubject);
    if (!exists) {
      setSelectedSubject(filteredSubjects[0].id);
    }
  }, [filteredSubjects, selectedSubject]);

  const currentSubject = filteredSubjects.find((s) => s.id === selectedSubject);

  const currentTeacherName = useMemo(() => {
    if (!selectedSubject || !selectedClass) return "Unassigned";
    if (selectedSubject === ATTENDANCE_SUBJECT_ID) return "Class Teacher";
    // look into class configuration for override
    const clsConfig = schoolClasses.find(
      (c) => c.className === selectedClass && c.section === selectedSection,
    );
    if (clsConfig && clsConfig.subjectTeachers) {
      const override = clsConfig.subjectTeachers.find(
        (t: any) => t.subjectId === selectedSubject,
      );
      if (override && override.teacherName) return override.teacherName;
    }
    // fallback to subject default name
    const subj = subjects.find((s) => s.id === selectedSubject);
    return subj?.teacherName || "Unassigned";
  }, [
    selectedSubject,
    selectedClass,
    selectedSection,
    schoolClasses,
    subjects,
    isTeacherModalOpen,
  ]); // Re-calc when modal closes/saves

  const handleMarkChange = (
    studentId: string,
    value: string,
    part?: "theory" | "practical",
  ) => {
    if (isLocked) return;
    const numVal = value === "" ? NaN : parseInt(value);

    // If subject is component split, validate against component max
    const componentCfg = subjects.find(
      (s) => s.id === selectedSubject,
    )?.components;

    if (part && componentCfg) {
      const max =
        part === "theory"
          ? componentCfg.theory || 0
          : componentCfg.practical || 0;

      if (value === "" || isNaN(numVal)) {
        const newBuffer = { ...marksBuffer } as any;
        const existing = (newBuffer[studentId] as any) || {};
        delete existing[part];
        if (Object.keys(existing).length === 0) delete newBuffer[studentId];
        else newBuffer[studentId] = existing;
        setMarksBuffer(newBuffer);
        return;
      }

      if (!isNaN(numVal) && numVal >= 0 && numVal <= max) {
        setMarksBuffer((prev) => {
          const existing = (prev[studentId] as any) || {};
          return { ...prev, [studentId]: { ...existing, [part]: numVal } };
        });
        setSaved(false);
      }

      return;
    }

    // Non-component subject (single value)
    const maxMarks = currentSubject?.totalMarks || 100;

    if (value === "" || isNaN(numVal)) {
      const newBuffer = { ...marksBuffer };
      delete newBuffer[studentId];
      setMarksBuffer(newBuffer);
      return;
    }

    if (numVal >= 0 && numVal <= maxMarks) {
      setMarksBuffer((prev) => ({ ...prev, [studentId]: numVal }));
      setSaved(false);
    }
  };

  const handleSave = async () => {
    if (isLocked) return;
    setLoading(true);
    try {
      if (selectedSubject === ATTENDANCE_SUBJECT_ID) {
        await backendService.saveBatchAttendance(
          selectedClass,
          selectedSection,
          totalAttendanceDays,
          marksBuffer,
          selectedExam,
        );
      } else {
        // Save Normal Marks
        const curSubject = subjects.find((s) => s.id === selectedSubject);

        const entries: MarkEntry[] = Object.entries(marksBuffer).map(
          ([studentId, scoreOrObj]) => {
            if (curSubject && curSubject.components) {
              const obj = (scoreOrObj as any) || {};
              const th = obj.theory || 0;
              const pr = obj.practical || 0;
              return {
                studentId,
                subjectId: selectedSubject,
                examTermId: selectedExam,
                obtainedMarks: th + pr,
                theoryMarks: obj.theory,
                practicalMarks: obj.practical,
                sessionId: "",
                isFinalized: isTeacher ? true : false,
              } as MarkEntry;
            }

            return {
              studentId,
              subjectId: selectedSubject,
              examTermId: selectedExam,
              obtainedMarks: scoreOrObj as number,
              sessionId: "",
              isFinalized: isTeacher ? true : false,
            } as MarkEntry;
          },
        );

        await backendService.saveMarks(entries);
      }

      setSaved(true);
      if (isTeacher) {
        setIsMarksFinalized(true);
      }
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert(e?.message || "Failed to save data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseCSV(file);
      const newBuffer = { ...marksBuffer };
      let matchCount = 0;
      const subjectName = currentSubject?.name;

      data.forEach((row: any) => {
        const roll = row["RollNo"] || row["Roll Number"] || row["Roll"];
        // Smart check: Look for 'Marks', 'Obtained', OR column matching Subject Name
        const marks =
          row["Marks"] ||
          row["Obtained"] ||
          (subjectName ? row[subjectName] : undefined);

        if (roll && marks !== undefined && marks !== "") {
          const student = students.find(
            (s) => s.rollNumber === roll.toString(),
          );
          if (student) {
            const num = parseInt(marks);
            const max = currentSubject?.totalMarks || 100;
            if (!isNaN(num) && num <= max) {
              newBuffer[student.id] = num;
              matchCount++;
            }
          }
        }
      });
      setMarksBuffer(newBuffer);
      setSaved(false);
      alert(`Successfully imported marks for ${matchCount} students.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      alert(
        "Error parsing CSV. Please ensure columns: RollNo, Marks (or Subject Name)",
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextInput = document.getElementById(`mark-input-${index + 1}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevInput = document.getElementById(`mark-input-${index - 1}`);
      if (prevInput) (prevInput as HTMLInputElement).focus();
    }
  };

  return (
    <div className="space-y-6">
      {isLocked && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-xs flex items-start gap-3 mb-6">
          <Lock className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-bold">
              {isTermLocked && isSessionLocked
                ? "Session and Term are Locked"
                : isTermLocked
                  ? "Term is Locked"
                  : "Session is Locked"}
            </h3>
            <p className="text-red-700 text-sm">
              {isTermLocked && isSessionLocked
                ? "Both the session and the term are locked. All academic records are read-only."
                : isTermLocked
                  ? "This term has been finalized. All academic records are read-only."
                  : "You are viewing an archived session. Add, Edit, and Delete actions are disabled."}
            </p>
          </div>
        </div>
      )}

      {/* 1. TOP BAR: Global Actions & Filters */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Marks Entry</h2>
            <p className="text-gray-500 text-sm">
              Input and manage student assessment scores.
            </p>
          </div>
          <div className="flex gap-2">
            {!isLocked && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCSVImport}
                  className="hidden"
                  accept=".csv"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition"
                >
                  <Upload className="w-4 h-4" /> Import CSV
                </button>
              </>
            )}
            <button
              onClick={() => setShowMarkingSheet(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition"
            >
              <ClipboardList className="w-4 h-4" /> Award List
            </button>
            <button
              onClick={() => setIsAttendanceSheetOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              <Printer className="w-4 h-4" /> Attendance Sheet
            </button>
          </div>
        </div>

        {/* Compact Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">
              Exam Term
            </label>
            <div className="relative">
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none text-sm font-medium text-gray-700 shadow-xs"
              >
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">
              Campus
            </label>
            <div className="relative">
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none text-sm font-medium text-gray-700 shadow-xs"
              >
                <option value="Boys">Boys Campus</option>
                <option value="Girls">Girls Campus</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">
              Class
            </label>
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection(""); // Reset section
                }}
                className="w-full pl-3 pr-8 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none text-sm font-medium text-gray-700 shadow-xs"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">
              Section
            </label>
            <div className="relative">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedClass}
                className="w-full pl-3 pr-8 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none text-sm font-medium text-gray-700 shadow-xs disabled:opacity-50 disabled:bg-gray-100"
              >
                <option value="">All Sections</option>
                {sections.map((s) => (
                  <option key={s || "none"} value={s}>
                    {s ? `Section ${s}` : "No Section"}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUBJECT SELECTION: Tag Based - Simplified Layout */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
            Select Subject
          </h3>
          <div className="relative group max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Quick search..."
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 bg-gray-50 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition"
            />
            {subjectSearch && (
              <button
                onClick={() => setSubjectSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto p-1">
          {filteredSubjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.id)}
              className={`
                        px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border flex items-center gap-2 shadow-xs
                        ${
                          selectedSubject === sub.id
                            ? sub.id === ATTENDANCE_SUBJECT_ID
                              ? "bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-200"
                              : "bg-secondary-600 text-white border-secondary-700 shadow-md ring-2 ring-secondary-200"
                            : "bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50"
                        }
                    `}
            >
              {sub.id === ATTENDANCE_SUBJECT_ID && (
                <CalendarDays className="w-4 h-4" />
              )}
              {sub.name}
              {selectedSubject === sub.id && (
                <CheckCircle2 className="w-4 h-4 text-white opacity-50" />
              )}
            </button>
          ))}
          {filteredSubjects.length === 0 && (
            <p className="text-gray-400 text-sm italic py-2">
              No matching subjects available for this class.
            </p>
          )}
        </div>
      </div>

      {/* 3. DATA ENTRY TABLE */}
      {selectedSubject && selectedClass ? (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Context Bar - Simplified for Teachers */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-secondary-600 shadow-xs border border-gray-200 font-bold text-lg">
                {selectedSubject === ATTENDANCE_SUBJECT_ID ? (
                  <CalendarDays className="w-5 h-5" />
                ) : (
                  currentSubject?.name.charAt(0)
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  {currentSubject?.name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                  {selectedSubject === ATTENDANCE_SUBJECT_ID ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Total Working Days:</span>
                      <input
                        type="number"
                        min="1"
                        value={totalAttendanceDays}
                        onChange={(e) =>
                          setTotalAttendanceDays(parseInt(e.target.value) || 0)
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm font-bold text-center focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                  ) : (
                    <span className="bg-white px-2 py-0.5 rounded border border-gray-200 shadow-xs text-gray-700">
                      Max: <b>{currentSubject?.totalMarks}</b>
                    </span>
                  )}
                  <span>{students.length} Students</span>
                </div>
              </div>
            </div>

            {isAdmin &&
              !isSessionLocked &&
              selectedSubject !== ATTENDANCE_SUBJECT_ID && (
                <button
                  onClick={() => setIsTeacherModalOpen(true)}
                  className="text-xs flex items-center gap-1 text-gray-500 hover:text-primary-600 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-xs hover:border-primary-200 transition"
                >
                  <UserIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">
                    Teacher: {currentTeacherName}
                  </span>
                  <Edit2 className="w-3 h-3 ml-1" />
                </button>
              )}
          </div>

          {/* Table */}
          <div className="relative">
            <div className="overflow-auto max-h-150">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase sticky top-0 z-10 shadow-xs">
                  <tr>
                    <th className="px-6 py-4 font-bold border-b border-gray-200 w-28 text-center">
                      Roll No
                    </th>
                    <th className="px-6 py-4 font-bold border-b border-gray-200">
                      Student Name
                    </th>
                    <th className="px-6 py-4 font-bold border-b border-gray-200 w-48 text-center bg-gray-200">
                      {selectedSubject === ATTENDANCE_SUBJECT_ID
                        ? "Days Present"
                        : "Marks Obtained"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {students.length > 0 ? (
                    students.map((student, index) => {
                      const raw = marksBuffer[student.id];
                      // Compute combined score and max for proper fail detection
                      const curSubject = subjects.find(
                        (s) => s.id === selectedSubject,
                      );
                      let combinedScore = 0;
                      let maxForRow = curSubject
                        ? curSubject.totalMarks ||
                          (curSubject.components?.theory || 0) +
                            (curSubject.components?.practical || 0)
                        : 100;

                      if (curSubject && curSubject.components) {
                        const obj = (raw as any) || {};
                        combinedScore =
                          (obj.theory || 0) + (obj.practical || 0);
                      } else {
                        combinedScore = (raw as number) || 0;
                      }

                      const isFail =
                        selectedSubject !== ATTENDANCE_SUBJECT_ID &&
                        raw !== undefined &&
                        combinedScore < maxForRow * 0.4;

                      return (
                        <tr
                          key={student.id}
                          className="hover:bg-blue-50/30 transition-colors"
                        >
                          <td className="px-6 py-3 font-bold text-gray-500 text-center">
                            {student.rollNumber}
                          </td>
                          <td className="px-6 py-3 font-medium text-gray-800 uppercase">
                            {student.name}
                          </td>
                          <td className="px-6 py-2 text-center bg-gray-50/50">
                            {curSubject && curSubject.components ? (
                              <div className="flex items-center gap-2 justify-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-[10px] text-gray-500">
                                    T
                                  </span>
                                  <input
                                    id={`mark-input-${index}-t`}
                                    type="number"
                                    min={0}
                                    max={curSubject.components?.theory}
                                    disabled={isLocked}
                                    value={(raw as any)?.theory ?? ""}
                                    onChange={(e) =>
                                      handleMarkChange(
                                        student.id,
                                        e.target.value,
                                        "theory",
                                      )
                                    }
                                    className={`w-20 text-center py-1 px-1 rounded-lg border-2 focus:ring-2 focus:ring-primary-50 outline-none transition font-bold text-sm ${(raw as any)?.theory === undefined ? "border-gray-200 bg-white" : isFail ? "border-red-200 bg-red-50 text-red-600" : "border-primary-500 bg-white text-primary-700"}`}
                                  />
                                </div>

                                <div className="flex flex-col items-center">
                                  <span className="text-[10px] text-gray-500">
                                    P
                                  </span>
                                  <input
                                    id={`mark-input-${index}-p`}
                                    type="number"
                                    min={0}
                                    max={curSubject.components?.practical}
                                    disabled={isLocked}
                                    value={(raw as any)?.practical ?? ""}
                                    onChange={(e) =>
                                      handleMarkChange(
                                        student.id,
                                        e.target.value,
                                        "practical",
                                      )
                                    }
                                    className={`w-20 text-center py-1 px-1 rounded-lg border-2 focus:ring-2 focus:ring-primary-50 outline-none transition font-bold text-sm ${(raw as any)?.practical === undefined ? "border-gray-200 bg-white" : isFail ? "border-red-200 bg-red-50 text-red-600" : "border-primary-500 bg-white text-primary-700"}`}
                                  />
                                </div>

                                <div className="ml-2 text-xs font-bold">
                                  {combinedScore}/{maxForRow}
                                </div>
                              </div>
                            ) : (
                              <input
                                id={`mark-input-${index}`}
                                type="number"
                                min="0"
                                max={currentSubject?.totalMarks}
                                disabled={isLocked}
                                value={raw ?? ""}
                                onChange={(e) =>
                                  handleMarkChange(student.id, e.target.value)
                                }
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className={`w-28 text-center py-2 px-2 rounded-lg border-2 focus:ring-4 focus:ring-primary-100 outline-none transition font-bold text-xl
                                                              ${
                                                                raw ===
                                                                undefined
                                                                  ? "border-gray-200 bg-white focus:border-primary-500"
                                                                  : isFail
                                                                    ? "border-red-200 bg-red-50 text-red-600 focus:border-red-500"
                                                                    : "border-primary-500 bg-white text-primary-700"
                                                              }`
                                                            }
                                placeholder="-"
                                autoFocus={index === 0}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-12 text-center text-gray-400"
                      >
                        No students found in this class.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="text-xs text-gray-400">
              Press{" "}
              <kbd className="font-mono bg-gray-100 px-1 rounded border">
                Enter
              </kbd>{" "}
              to jump to next student
            </div>
            <div className="flex items-center gap-4">
              {saved && (
                <span className="flex items-center gap-2 text-green-600 font-bold animate-in fade-in slide-in-from-right duration-300">
                  <Check className="w-5 h-5" /> Saved
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={loading || isSessionLocked}
                className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold shadow-lg shadow-primary-900/20 flex items-center gap-2 disabled:opacity-50 transition transform active:scale-95"
              >
                {loading ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 shadow-xs animate-in fade-in duration-300">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <Filter className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-lg font-bold text-gray-500">
            Ready to Enter Marks
          </p>
          <p className="text-sm">Please select a Class and Subject above.</p>
        </div>
      )}

      {/* Modals */}
      {isTeacherModalOpen && currentSubject && (
        <SingleSubjectTeacherModal
          className={selectedClass}
          section={selectedSection}
          subject={currentSubject}
          currentTeacher={currentTeacherName}
          onClose={() => setIsTeacherModalOpen(false)}
          onSave={refreshData}
        />
      )}

      {showMarkingSheet && (
        <PrintableSheet
          className={selectedClass}
          section={selectedSection}
          students={students}
          onClose={() => setShowMarkingSheet(false)}
          examName={exams.find((e) => e.id === selectedExam)?.name || "Exam"}
          subjectName={currentSubject?.name}
          subjectId={selectedSubject}
          session={session}
          subjects={subjects}
        />
      )}
      {isAttendanceSheetOpen && (
        <AttendanceSheet
          className={selectedClass}
          section={selectedSection}
          students={filteredStudents}
          examName={exams.find((e) => e.id === selectedExam)?.name || "Exam"}
          session={session}
          onClose={() => setIsAttendanceSheetOpen(false)}
        />
      )}
    </div>
  );
};

export default MarksEntry;
