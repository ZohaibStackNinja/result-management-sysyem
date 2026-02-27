import React, { useState, useMemo, useEffect, forwardRef } from "react";
import backendService from "../../services/backendService";
import {
  calculateResults,
  formatResultAttendance,
} from "../../utils/calculations";
import {
  Printer,
  X,
  Grid,

  ArrowDown,
  FileText,
} from "lucide-react";
import { generateStudentRemarks } from "../../services/GardeService";
import {
  StudentResult,
  GradingRule,
  Student,
  Subject,
  SchoolClass,
  ExamTerm,
} from "../../types";

// If marks are stored as a single total for a component subject, estimate a T/P split
// proportional to the component maxes. This provides a best-effort display when
// detailed breakdown wasn't saved.
const splitRawIntoComponents = (raw: number, sub: Subject) => {
  if (!sub?.components) return { theory: 0, practical: 0 };
  const tMax = sub.components.theory || 0;
  const pMax = sub.components.practical || 0;
  const totalMax = sub.totalMarks || tMax + pMax || 1;

  let theory = Math.round((raw * tMax) / totalMax);
  theory = Math.max(0, Math.min(tMax, theory));
  let practical = raw - theory;

  // Clamp & adjust in case of rounding overflow
  if (practical > pMax) {
    practical = pMax;
    theory = Math.max(0, Math.min(tMax, raw - practical));
  } else if (practical < 0) {
    practical = 0;
    theory = Math.max(0, Math.min(tMax, raw));
  }

  return { theory, practical };
};
const normalizeSection = (value: string | undefined | null) =>
  String(value || "").trim();

const ReportCard = forwardRef<
  HTMLDivElement,
  {
    result: StudentResult;
    subjects: Subject[];
    classHighs: { [subjectId: string]: number };
    gradingRules: GradingRule[];
    classTeacherName?: string;
    onClose?: () => void;
    isBulkPrint?: boolean;
  }
>(
  (
    {
      result,
      subjects,
      classHighs,
      gradingRules,
      classTeacherName,
      onClose,
      isBulkPrint,
    },
    ref,
  ) => {
    const [remark, setRemark] = useState<string>("");

    useEffect(() => {
      const fetchRemark = async () => {
        const txt = await generateStudentRemarks(result);
        setRemark(txt);
      };
      fetchRemark();
    }, [result]);

    const isPreview = !isBulkPrint;
    const verificationData = `VERIFY:${
      result.student.id
    }|${result.percentage.toFixed(2)}|RANK:${result.rank}`;
    const sortedRules = useMemo(
      () => [...gradingRules].sort((a, b) => b.minPercentage - a.minPercentage),
      [gradingRules],
    );

    const getSubjectGrade = (pct: number) => {
      const found = sortedRules.find((r) => pct >= r.minPercentage);
      return found ? found.label : "F";
    };

    const getTeacher = (subjectId: string): string => {
      return "N/A";
    };
    
    const cardContent = (
      <div
        ref={ref}
        className={`bg-white ${
          isPreview
            ? "rounded-xl shadow-2xl max-w-[20mm] mx-auto p-[11mm] pb-0 overflow-y-auto"
            : "w-full p-0 h-full flex flex-col justify-between pb-0"
        } print:overflow-visible `}
      >
        {/* Card Header */}
        <div>
          <div className="flex justify-between items-start border-b-2 border-secondary-600 pb-4 mb-6 ">
            <div>
              <h1 className="text-4xl font-extrabold uppercase tracking-wide text-secondary-600">
                New Covenant School System
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-primary-600 font-bold uppercase tracking-widest text-sm">
                  Raising Contributors
                </p>
              </div>
              <div className="flex gap-4 mt-3">
                <p className="text-sm font-bold text-white uppercase bg-secondary-600 px-2 py-1 rounded">
                  {result.student.campus} Campus
                </p>
                <p className="text-sm text-gray-500 px-2 py-1 font-bold border border-gray-200 rounded">
                  SESSION 2024-2025
                </p>
              </div>
            </div>
         
          </div>

          <div className="inline-block px-5 py-1.5 bg-gray-900 text-white text-sm font-bold uppercase rounded-full mb-8">
            Official Result Card
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-sm">
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-200 py-1">
                <span className="text-gray-500 font-medium">Student Name:</span>
                <span className="font-bold text-gray-900 text-lg uppercase">
                  {result.student.name}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 py-1">
                <span className="text-gray-500 font-medium">
                  Class, Section & In-Charge:
                </span>
                <span className="font-bold text-gray-800 uppercase">
                  {result.student.className}
                  {result.student.section ? ` - ${result.student.section}` : ""}
                  {classTeacherName ? ` / ${classTeacherName}` : ""}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-200 py-1">
                <span className="text-gray-500 font-medium">Roll Number:</span>
                <span className="font-bold text-gray-800">
                  {result.student.rollNumber}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 py-1">
                <span className="text-gray-500 font-medium">
                  Class Position:
                </span>
                <span className="text-lg font-bold text-gray-800 bg-primary-100 px-2 rounded">
                  {result.rank}
                  <sup>{result.positionSuffix}</sup>
                </span>
              </div>
            </div>
          </div>

          <table className="w-full mb-6 border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-800 uppercase text-xs tracking-wider">
                <th className="border border-gray-300 px-4 py-3 text-left">
                  Subject
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left">
                  Teacher
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center">
                  Max
                </th>
             
                <th className="border border-gray-300 px-4 py-3 text-center font-bold">
                  Obtained
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-bold">
                  %
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub) => {
                const raw = result.marks[sub.id] as any;
                const marks =
                  typeof raw === "number"
                    ? raw
                    : (raw?.theory || 0) + (raw?.practical || 0);
                const pct = sub.totalMarks
                  ? (Number(marks) / Number(sub.totalMarks)) * 100
                  : 0;
                const highest = classHighs[sub.id] || 0;
                const grd = getSubjectGrade(pct);

                return (
                  <tr key={sub.id}>
                    <td className="border border-gray-300 px-4 py-2.5 font-medium text-gray-800 uppercase">
                      {sub.name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2.5 text-gray-600 text-xs italic">
                      {getTeacher(sub.id)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2.5 text-center text-gray-600">
                      {sub.components ? (
                        <div className="text-xs grid grid-cols-2 text-center">
                          <div className="text-center">
                            T + P<br />
                            <span className="font-semibold">
                              {sub.components.theory} +{" "}
                              {sub.components.practical}
                            </span>
                          </div>
                          <div className="text-center">
                            = Total
                            <br />= &nbsp;&nbsp;&nbsp;
                            <span className="font-bold">{sub.totalMarks}</span>
                          </div>
                        </div>
                      ) : (
                        sub.totalMarks
                      )}
                    </td>
                 
                    <td className="border border-gray-300 px-4 py-2.5 text-center font-bold text-gray-800">
                      {sub.components ? (
                        <div className="text-xs grid grid-cols-2 gap-1 text-center">
                          <div className="text-center">
                            T + P <br />
                            <span className="font-semibold">
                              {typeof raw === "number"
                                ? splitRawIntoComponents(raw, sub).theory
                                : (raw?.theory ?? 0)}{" "}
                              +
                              {typeof raw === "number"
                                ? splitRawIntoComponents(raw, sub).practical
                                : (raw?.practical ?? 0)}
                            </span>
                          </div>
                          <div className="text-center">
                            = Total <br />= &nbsp;&nbsp;&nbsp;{" "}
                            <span className="font-bold">{marks}</span>
                          </div>
                        </div>
                      ) : typeof raw === "number" ? (
                        raw
                      ) : (
                        marks
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2.5 text-center font-bold text-gray-700">
                      {pct.toFixed(0)}%
                    </td>
                    <td className="border border-gray-300 px-4 py-2.5 text-center text-gray-800">
                      {grd}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <td
                  className="border border-gray-300 px-4 py-3 text-gray-900 uppercase"
                  colSpan={2}
                >
                  Grand Total
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center text-gray-900">
                  {result.totalMax}
                </td>
                {/* <td className="border border-gray-300 px-4 py-3 text-center bg-gray-100"></td> */}
                <td className="border border-gray-300 px-4 py-3 text-center text-secondary-600 text-lg">
                  {result.totalObtained}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center text-secondary-600">
                  {result.percentage.toFixed(1)}%
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center text-secondary-600 text-lg">
                  {result.grade}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-bold text-gray-700 mb-2 text-xs uppercase">
                Overall Percentage
              </h3>
              <div className="text-3xl font-extrabold text-secondary-600">
                {result.percentage.toFixed(2)}%
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-bold text-gray-700 mb-2 text-xs uppercase">
                Attendance
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-primary-600">
                  {result.attendance?.percentage ??
                    result.student.attendancePercentage}
                  %
                </span>
                <span className="text-sm text-gray-500">
                  (
                  {result.attendance
                    ? `${result.attendance.present}/${result.attendance.total}`
                    : `${result.student.attendancePresent}/${result.student.attendanceTotal || "?"}`}
                  )
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4 border border-gray-300 rounded p-4 bg-gray-50/30">
            <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">
              Principal's Remarks
            </h3>
            <p className="text-gray-800 italic font-serif text-md leading-relaxed">
              "
              {remark ||
                "Excellent performance. Keep up the consistent effort!"}
              "
            </p>
          </div>
        </div>

        {/* Card Footer */}
        <div>
          <div className="grid grid-cols-3 gap-8 pt-3">
            <div className="text-center">
              <div className="h-12 border-b border-gray-300 mb-2 flex items-end justify-center">
                <span className="font-serif italic text-lg text-secondary-900">
                  {classTeacherName || "N/A"}
                </span>
              </div>
              <p className="text-xs font-bold uppercase text-gray-400">
                Class Teacher
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 border-b border-gray-300 mb-2"></div>
              <p className="text-xs font-bold uppercase text-gray-400">
                Exam Controller
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 border-b border-gray-300 mb-2"></div>
              <p className="text-xs font-bold uppercase text-gray-400">
                Principal
              </p>
            </div>
          </div>
        </div>
      </div>
    );

  

    return cardContent;
  },
);

// Master Sheet View
const BroadsheetView: React.FC<{
  results: StudentResult[];
  subjects: Subject[];
  examName: string;
  campus: string;
  className: string;
  sectionName: string;
  failLabel: string;
  onClose: () => void;
  gradingRules: GradingRule[];
  schoolClasses: SchoolClass[];
  classTeachers: any[];
}> = ({
  results,
  subjects,
  examName,
  campus,
  className,
  sectionName,
  failLabel,
  onClose,
  gradingRules,
  schoolClasses,
  classTeachers,
}) => {
  const passedStudents = results.filter((r) => r.grade !== failLabel).length;
  const failedStudents = results.length - passedStudents;
  const passPercentage =
    results.length > 0 ? (passedStudents / results.length) * 100 : 0;

  const [homeroomTeacher, setHomeroomTeacher] = useState<string>("N/A");

  // internal teacher resolver for broadsheet table
  const teacherMap = useMemo(() => {
    return {
      get: (subId: string, cls: string, sec: string) => {
        const clsConfig = schoolClasses.find(
          (c: any) =>
            c.className === cls &&
            normalizeSection(c.section) === normalizeSection(sec),
        );
        if (clsConfig && clsConfig.subjectTeachers) {
          const override = clsConfig.subjectTeachers.find(
            (t: any) => t.subjectId === subId,
          );
          if (override && override.teacherName) return override.teacherName;
        }
        const found = (classTeachers || []).find(
          (a: any) =>
            a.subjectId === subId &&
            a.className === cls &&
            normalizeSection(a.section) === normalizeSection(sec),
        );
        if (found) return found.teacherName;
        const sub = subjects.find((s) => s.id === subId);
        return sub?.teacherName || "-";
      },
    };
  }, [subjects, schoolClasses, classTeachers]);

  useEffect(() => {
    if (!className) return setHomeroomTeacher("N/A");
    const section = normalizeSection(sectionName);
    const cls = schoolClasses.find(
      (c) =>
        c.className === className && normalizeSection(c.section) === section,
    );
    if (cls) {
      if (campus === "Boys" && cls.classTeacherBoysName) {
        setHomeroomTeacher(cls.classTeacherBoysName);
        return;
      }
      if (campus === "Girls" && cls.classTeacherGirlsName) {
        setHomeroomTeacher(cls.classTeacherGirlsName);
        return;
      }
      if (cls.classTeacherName) {
        setHomeroomTeacher(cls.classTeacherName);
        return;
      }
    }
    const mapped = (classTeachers || []).find(
      (a: any) =>
        a.isHomeroom &&
        a.className === className &&
        normalizeSection(a.section) === section,
    );
    setHomeroomTeacher(mapped?.teacherName || "N/A");
  }, [className, sectionName, campus, schoolClasses, classTeachers]);

  // Ref for portal printing
  const broadsheetRef = React.useRef<HTMLDivElement | null>(null);

  const handleBroadsheetPrint = async () => {
    if (typeof window === "undefined" || !broadsheetRef.current) {
      // fallback
      if (typeof window !== "undefined") window.print();
      return;
    }

    const el = broadsheetRef.current as HTMLElement;
    const originalParent = el.parentNode as Node | null;
    const nextSibling = el.nextSibling;

    // placeholder to restore later
    const placeholder = document.createElement("div");
    placeholder.id = "broadsheet-print-placeholder";
    placeholder.style.display = "none";

    try {
      if (originalParent) originalParent.insertBefore(placeholder, el);

      // Move the original broadsheet node to body (no clone)
      document.body.appendChild(el);
      el.classList.add("printing-broadsheet");

      // Strong print rules targeting the moved node
      const style = document.createElement("style");
      style.type = "text/css";
      style.id = "broadsheet-print-styles";
      style.innerHTML = `@media print {
        @page { size: A4 landscape; margin: 12mm; }
        html, body, #root { height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }

          /* Hide everything except the printing broadsheet - use display:none so hidden elements do not reserve page space */
        body > *:not(.printing-broadsheet) { display: none !important; }
        .printing-broadsheet { display: block !important; visibility: visible !important; }

        /* Reset layout to allow page flow and remove margins */
        html, body { margin: 0 !important; padding: 0 !important; }
        .printing-broadsheet { position: static !important; width: 100% !important; height: auto !important; background: white !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
        .printing-broadsheet, .printing-broadsheet * { position: static !important; top: auto !important; left: auto !important; right: auto !important; bottom: auto !important; transform: none !important; z-index: auto !important; box-shadow: none !important; }

        /* Table pagination rules */
        table { page-break-inside: auto !important; border-collapse: collapse !important; width: 100% !important; -webkit-print-color-adjust: exact !important; }
        thead { display: table-header-group !important; }
        tfoot { display: table-footer-group !important; }
        tbody { display: table-row-group !important; }
        tr { page-break-inside: avoid !important; break-inside: avoid !important; }
        th, td { page-break-inside: avoid !important; break-inside: avoid !important; }

        /* Remove visual decorations that may overlap */
        * { box-shadow: none !important; -webkit-box-shadow: none !important; }

      }`;

      document.head.appendChild(style);

      // Force paint and give time for layout to settle on large tables
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      await new Promise((r) => setTimeout(r, 400));

      if (typeof window !== "undefined") window.print();

      // remove print styles
      const existing = document.getElementById("broadsheet-print-styles");
      if (existing && existing.parentNode)
        existing.parentNode.removeChild(existing);
    } finally {
      // restore the node to its original place
      try {
        el.classList.remove("printing-broadsheet");
        if (placeholder && placeholder.parentNode) {
          if (originalParent) originalParent.insertBefore(el, placeholder);
          placeholder.parentNode.removeChild(placeholder);
        } else if (originalParent && nextSibling) {
          originalParent.insertBefore(el, nextSibling);
        } else if (originalParent) {
          originalParent.appendChild(el);
        }
      } catch (e) {
        // swallow restoration errors but log
        // eslint-disable-next-line no-console
        console.error("Failed to restore broadsheet after printing:", e);
      }
    }
  };

  const subjectStats = subjects.map((sub) => {
    let passCount = 0;
    let failCount = 0;
    results.forEach((r) => {
      const rawMarks = r.marks[sub.id] || 0;
      const marks =
        typeof rawMarks === "number"
          ? rawMarks
          : (rawMarks?.theory || 0) + (rawMarks?.practical || 0);
      const pct = sub.totalMarks
        ? (Number(marks) / Number(sub.totalMarks)) * 100
        : 0;
      const foundRule = [...gradingRules]
        .sort((a, b) => b.minPercentage - a.minPercentage)
        .find((rule) => pct >= rule.minPercentage);
      if (foundRule && foundRule.label === failLabel) {
        failCount++;
      } else {
        passCount++;
      }
    });
    const total = passCount + failCount;
    return {
      id: sub.id,
      passCount,
      failCount,
      passPct: total > 0 ? ((passCount / total) * 100).toFixed(0) : "0",
      failPct: total > 0 ? ((failCount / total) * 100).toFixed(0) : "0",
    };
  });

  const classTotalMax = useMemo(
    () => subjects.reduce((sum, s) => sum + (s.totalMarks || 0), 0),
    [subjects],
  );

  return (
    <div className="fixed inset-0 bg-white z-60 overflow-auto print:static print:inset-auto print:overflow-visible print:z-0 broadsheet-root text-gray-900">
      {/* Print rules for Broadsheet: allow multi-page flow and repeat headers */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          html, body, #root { height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }

          /* Broadsheet container should flow in print */
          .broadsheet-root { position: static !important; overflow: visible !important; }
          .broadsheet-print { display: block !important; width: 100% !important; overflow: visible !important; }

          /* Tables may span pages; repeat thead and avoid breaking rows */
          table { page-break-inside: auto !important; border-collapse: collapse !important; -webkit-print-color-adjust: exact !important; }
          thead { display: table-header-group !important; }
          tfoot { display: table-footer-group !important; }
          tbody { display: table-row-group !important; }
          tr { page-break-inside: avoid !important; break-inside: avoid !important; }

          /* Utility to force no break inside blocks */
          .break-inside-avoid { page-break-inside: avoid !important; break-inside: avoid !important; }

          /* Ensure full width for printed content */
          .print\:w-full { width: 100% !important; }
        }
      `}</style>

      <div className="p-4 no-print flex justify-between items-center bg-gray-100 border-b print:hidden">
        <h2 className="font-bold text-gray-700">Master Result Broadsheet</h2>
        <div className="flex gap-3">
          <button
            onClick={handleBroadsheetPrint}
            className="px-4 py-2 bg-primary-600 text-white rounded shadow hover:bg-primary-700 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print Sheet
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>

      <div
        ref={broadsheetRef}
        className="p-6 min-w-max print:min-w-0 print:w-full print:p-2 broadsheet-print"
      >
        <div className="text-center mb-8">
          {/* REDESIGNED HEADER */}
          <h1 className="text-4xl font-extrabold uppercase text-secondary-900 tracking-wide">
            New Covenant School System
          </h1>
          <h2 className="text-2xl font-bold text-gray-700 mt-2">
            Master Result Sheet -{" "}
            <span className="text-secondary-700">{examName}</span>
          </h2>
          <div className="mt-3 text-lg font-medium text-gray-600 flex justify-center items-center gap-3">
            <span>
              Campus: <span className="font-bold text-gray-900">{campus}</span>
            </span>
            <span className="text-gray-400 mx-2">|</span>
            <span>
              Class:{" "}
              <span className="font-bold text-gray-900">
                {className} {sectionName ? `(${sectionName})` : ""}
              </span>
            </span>
            <span className="text-gray-400 mx-2">|</span>
            <span>
              Incharge:{" "}
              <span className="font-bold text-primary-700 italic">
                {homeroomTeacher}
              </span>
            </span>
          </div>
        </div>

        <table className="w-full border-collapse border border-gray-800 text-sm print:text-[11px]">
          <thead>
            <tr className="bg-gray-100 text-center text-gray-900 break-inside-avoid">
              <th className="border border-gray-800 p-2 w-10 align-middle">
                Pos
              </th>
              <th className="border border-gray-800 p-2 w-16 align-middle">
                Roll No
              </th>
              <th
                className="border border-gray-800 p-2 text-left align-middle"
                style={{ minWidth: "150px" }}
              >
                Student Name
              </th>
              <th className="border border-gray-800 p-2 w-16 align-middle">
                Attend
              </th>
              {subjects.map((s) => {
                const teacher = teacherMap.get(s.id, className, sectionName);
                const displayTeacher = teacher.replace(
                  /^(Mr\.|Ms\.|Mrs\.|Miss)\s+/i,
                  "",
                );

                return (
                  <th
                    key={s.id}
                    className="border border-gray-800 p-0 bg-white align-top"
                    style={{ minWidth: "50px" }}
                  >
                    <div
                      className="flex flex-col h-full border-0 border-gray-800"
                      style={{ width: "125px" }}
                    >
                      {/* Subject Name */}
                      <div className="p-1.5 font-bold text-[13px] uppercase bg-gray-50 border-b border-gray-800">
                        {s.name}
                      </div>
                      {/* Max Marks */}
                      <div className="p-1 text-[13px] h-10 flex justify-center items-center font-medium text-gray-500 bg-white border-b border-gray-800">
                        {s.components ? (
                          <div className="text-[13px] grid grid-cols-2 text-center">
                            <div className="text-center">
                              T + P<br />
                              {s.components.theory} + {s.components.practical}
                            </div>
                            <div className="">
                              = Total
                              <br />
                              <span className="font-bold text-gray-800">
                                =&nbsp;&nbsp; {s.totalMarks} &nbsp;&nbsp;
                              </span>
                            </div>
                          </div>
                        ) : (
                          <>Max: {s.totalMarks}</>
                        )}
                      </div>
                      {/* Teacher Name */}
                      <div
                        className="p-1 text-[13px] font-bold text-blue-800 bg-blue-50/50 truncate border-b border-gray-800"
                        title={teacher}
                      >
                        {displayTeacher}
                      </div>
                    </div>
                  </th>
                );
              })}
              <th
                className="flex justify-between flex-col w-15 font-bold bg-gray-50 align-middle"
                style={{ height: "99px" }}
              >
                <div className="text-[17px] text-center flex items-center justify-center">
                  <span>Grand Total</span>
                </div>
                <div className="text-[17px] text-gray-500 h-[1.78rem] font-medium border-t border-b border-gray-800">
                  {classTotalMax}
                </div>
              </th>
              <th className="border border-gray-800 p-2 w-14 font-bold bg-gray-50 align-middle">
                %
              </th>
              <th className="border border-gray-800 p-2 w-10 font-bold bg-gray-50 align-middle">
                Grd
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr
                key={r.student.id}
                className="text-center hover:bg-gray-50 break-inside-avoid border-b border-gray-800"
              >
                <td className="border-r border-gray-800 p-1.5 font-bold">
                  {r.rank}
                </td>
                <td className="border-r border-gray-800 p-1.5">
                  {r.student.rollNumber}
                </td>
                <td
                  className="border-r border-gray-800 px-2 py-1.5 text-left font-bold uppercase whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{ maxWidth: "200px" }}
                  title={r.student.name}
                >
                  {r.student.name}
                </td>
                <td className="border-r border-gray-800 p-1.5">
                  {formatResultAttendance(r)}
                </td>
                {subjects.map((s) => {
                  const raw = r.marks[s.id] as any;
                  const marks =
                    typeof raw === "number"
                      ? raw
                      : (raw?.theory || 0) + (raw?.practical || 0);
                  const marksNum =
                    typeof marks === "number"
                      ? marks
                      : (marks?.theory || 0) + (marks?.practical || 0);
                  const pct = s.totalMarks
                    ? (Number(marksNum) / Number(s.totalMarks)) * 100
                    : 0;
                  const gradeRule = gradingRules
                    .sort((a, b) => b.minPercentage - a.minPercentage)
                    .find((rule) => pct >= rule.minPercentage);
                  const isLow = (gradeRule?.label || "F") === failLabel;

                  return (
                    <td
                      key={`${r.student.id}-${s.id}`}
                      className="border-r border-gray-800 px-1 py-1 relative"
                    >
                      <div className="flex items-center justify-center">
                        {s.components ? (
                          <div className=" grid grid-cols-2 text-center">
                            <div>
                              T + P &nbsp;=
                              <br />
                              <span
                                className={`${isLow ? "text-red-600" : "text-gray-900"}`}
                              >
                                {typeof raw === "number"
                                  ? splitRawIntoComponents(raw, s).theory
                                  : (raw?.theory ?? 0)}
                              </span>{" "}
                              +
                              <span
                                className={`${isLow ? "text-red-600" : "text-gray-900"}`}
                              >
                                {typeof raw === "number"
                                  ? splitRawIntoComponents(raw, s).practical
                                  : (raw?.practical ?? 0)}{" "}
                                =
                              </span>
                            </div>
                            <div
                              className={` ${isLow ? "text-red-600" : "text-gray-900"}`}
                            >
                              Total
                              <br />
                              {marks}
                            </div>
                          </div>
                        ) : (
                          <span
                            className={`font-bold ${isLow ? "text-red-600" : "text-gray-900"}`}
                          >
                            {marks}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="border-r border-gray-800 p-1.5 font-bold bg-gray-50 text-base">
                  {r.totalObtained}
                </td>
                <td className="border-r border-gray-800 p-1.5 font-bold bg-gray-50 text-base">
                  {r.percentage.toFixed(1)}
                </td>
                <td
                  className={`border-r border-gray-800 p-1.5 font-bold text-base ${
                    r.grade === failLabel
                      ? "text-red-600 bg-red-50"
                      : "text-primary-600"
                  }`}
                >
                  {r.grade}
                </td>
              </tr>
            ))}

            <tr className="bg-gray-100 font-bold border-t-2 border-gray-800 break-inside-avoid text-xs">
              <td
                colSpan={4}
                className="border border-gray-800 p-2 text-right text-gray-600 uppercase tracking-wider"
              >
                Pass Count
              </td>
              {subjectStats.map((stat) => (
                <td
                  key={`pass-${stat.id}`}
                  className="border border-gray-800 p-1 text-primary-700 text-center font-extrabold"
                >
                  {stat.passCount}
                </td>
              ))}
              <td
                colSpan={3}
                className="border border-gray-800 bg-gray-200"
              ></td>
            </tr>
            <tr className="bg-gray-100 font-bold break-inside-avoid text-xs">
              <td
                colSpan={4}
                className="border border-gray-800 p-2 text-right text-gray-600 uppercase tracking-wider"
              >
                Fail Count
              </td>
              {subjectStats.map((stat) => (
                <td
                  key={`fail-${stat.id}`}
                  className="border border-gray-800 p-1 text-red-700 text-center font-extrabold"
                >
                  {stat.failCount}
                </td>
              ))}
              <td
                colSpan={3}
                className="border border-gray-800 bg-gray-200"
              ></td>
            </tr>
            <tr className="bg-gray-100 font-bold break-inside-avoid text-xs">
              <td
                colSpan={4}
                className="border border-gray-800 p-2 text-right text-gray-600 uppercase tracking-wider"
              >
                Pass %
              </td>
              {subjectStats.map((stat) => (
                <td
                  key={`pct-${stat.id}`}
                  className="border border-gray-800 p-1 text-center text-gray-800"
                >
                  {stat.passPct}%
                </td>
              ))}
              <td
                colSpan={3}
                className="border border-gray-800 bg-gray-200"
              ></td>
            </tr>
          </tbody>
        </table>

        <div className="mt-8 flex justify-between items-start print:mt-6 gap-8 text-sm break-inside-avoid">
          <div className="border border-gray-800 p-4 w-1/3 rounded-sm">
            <h3 className="font-bold underline mb-3 text-gray-900 uppercase text-xs tracking-wider">
              Result Summary
            </h3>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Total Students</span>{" "}
              <span className="font-bold">{results.length}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-primary-700 font-medium">Passed</span>{" "}
              <span className="font-bold text-primary-700">
                {passedStudents}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-red-700 font-medium">Failed</span>{" "}
              <span className="font-bold text-red-700">{failedStudents}</span>
            </div>
            <div className="flex justify-between py-2 mt-1">
              <span>Pass Percentage</span>{" "}
              <span className="font-bold text-lg">
                {passPercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="border border-gray-800 p-4 w-1/3 rounded-sm">
            <h3 className="font-bold underline mb-3 text-gray-900 uppercase text-xs tracking-wider">
              Top Positions
            </h3>
            {results.slice(0, 3).map((r, i) => (
              <div
                key={r.student.id}
                className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span
                    className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      i === 0
                        ? "bg-yellow-500"
                        : i === 1
                          ? "bg-gray-400"
                          : "bg-orange-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="truncate uppercase font-bold text-xs">
                    {r.student.name}
                  </span>
                </div>
                <span className="font-bold text-sm">
                  {r.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          <div className="w-1/3 flex flex-col justify-between h-40">
            <div className="border-b-2 border-gray-800 text-center pb-1 text-xs font-bold uppercase mt-auto">
              Class Teacher
            </div>
            <div className="border-b-2 border-gray-800 text-center pb-1 text-xs font-bold uppercase mt-auto">
              Re-Checker
            </div>
            <div className="border-b-2 border-gray-800 text-center pb-1 text-xs font-bold uppercase mt-auto">
              Principal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Reports: React.FC<{ user?: any }> = ({ user }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<ExamTerm[]>([]);
  const [gradingRules, setGradingRules] = useState<GradingRule[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [classTeachers, setClassTeachers] = useState<any[]>([]);

  // helper to resolve subject teacher, prefers class config and falls back to legacy assignments
  const teacherMap = useMemo(() => {
    return {
      get: (subId: string, cls: string, sec: string) => {
        const clsConfig = schoolClasses.find(
          (c: any) =>
            c.className === cls &&
            normalizeSection(c.section) === normalizeSection(sec),
        );
        if (clsConfig && clsConfig.subjectTeachers) {
          const override = clsConfig.subjectTeachers.find(
            (t: any) => t.subjectId === subId,
          );
          if (override && override.teacherName) return override.teacherName;
        }
        const found = (classTeachers || []).find(
          (a: any) =>
            a.subjectId === subId &&
            a.className === cls &&
            normalizeSection(a.section) === normalizeSection(sec),
        );
        if (found) return found.teacherName;
        const sub = subjects.find((s) => s.id === subId);
        return sub?.teacherName || "-";
      },
    };
  }, [subjects, schoolClasses, classTeachers]);

  const [homeroomTeacher, setHomeroomTeacher] = useState<string>("N/A");

  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedCampus, setSelectedCampus] = useState<string>("Boys");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");

  const [results, setResults] = useState<StudentResult[]>([]);
  const [classHighs, setClassHighs] = useState<{ [key: string]: number }>({});

  const [viewStudent, setViewStudent] = useState<StudentResult | null>(null);
  const [showBroadsheet, setShowBroadsheet] = useState(false);
  // const [isBulkPrint, setIsBulkPrint] = useState(false);
  type PrintMode = "none" | "single" | "bulk";

  const [printMode, setPrintMode] = useState<PrintMode>("none");
  const [printStudent, setPrintStudent] = useState<StudentResult | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  //   // Initial Load
  useEffect(() => {
    const loadData = async () => {
      try {
        const [allStudents, allSubjects, allExams, rules, classes, cTeachers] =
          await Promise.all([
            backendService.getStudents(),
            backendService.getSubjects(),
            backendService.getExams(),
            backendService.getGradingRules(),
            backendService.getClasses(),
            backendService.getClassTeachers(),
          ]);

        setSubjects(allSubjects);
        setExams(allExams);
        setGradingRules(rules);
        setStudents(allStudents);
        setSchoolClasses(classes);
        setClassTeachers(cTeachers || []);

        if (allExams.length > 0) setSelectedExam(allExams[0].id);

        const clsNames = Array.from(
          new Set(allStudents.map((s: Student) => s.className)),
        ).sort();
        if (clsNames.length > 0) setSelectedClass(clsNames[0]);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedClass) return setHomeroomTeacher("N/A");
    const section = normalizeSection(selectedSection);
    const cls = schoolClasses.find(
      (c) =>
        c.className === selectedClass && normalizeSection(c.section) === section,
    );
    if (cls) {
      if (selectedCampus === "Boys" && cls.classTeacherBoysName) {
        setHomeroomTeacher(cls.classTeacherBoysName);
        return;
      }
      if (selectedCampus === "Girls" && cls.classTeacherGirlsName) {
        setHomeroomTeacher(cls.classTeacherGirlsName);
        return;
      }
      if (cls.classTeacherName) {
        setHomeroomTeacher(cls.classTeacherName);
        return;
      }
    }
    const mapped = (classTeachers || []).find(
      (a: any) =>
        a.isHomeroom &&
        a.className === selectedClass &&
        normalizeSection(a.section) === section,
    );
    setHomeroomTeacher(mapped?.teacherName || "N/A");
  }, [selectedClass, selectedSection, selectedCampus, schoolClasses, classTeachers]);

  const classHasSections = useMemo(() => {
    if (!selectedClass) return false;
    const classSections = new Set(
      [
        ...schoolClasses
          .filter((c) => c.className === selectedClass)
          .map((c) => normalizeSection(c.section)),
        ...students
          .filter((s) => s.className === selectedClass)
          .map((s) => normalizeSection(s.section)),
      ].filter((s) => s.length > 0),
    );
    return classSections.size > 0;
  }, [selectedClass, schoolClasses, students]);

  // Filter relevant subjects for the selected class
  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return subjects;
    // Attempt to find configuration for this class/section
    const clsConfig = schoolClasses.find(
      (c) =>
        c.className === selectedClass &&
        (classHasSections
          ? normalizeSection(c.section) === normalizeSection(selectedSection)
          : true),
    );
    if (clsConfig && clsConfig.subjectIds && clsConfig.subjectIds.length > 0) {
      return subjects.filter((s) => clsConfig.subjectIds?.includes(s.id));
    }
    return subjects;
  }, [subjects, schoolClasses, selectedClass, selectedSection, classHasSections]);

  // Filter and Calculate Results
  useEffect(() => {
    if (!selectedExam) return;

    let filteredStudents = students.filter((s) => {
      if (selectedCampus && s.campus !== selectedCampus) return false;
      if (selectedClass && s.className !== selectedClass) return false;
      if (classHasSections && selectedSection) {
        if (normalizeSection(s.section) !== normalizeSection(selectedSection))
          return false;
      }
      return true;
    });

    const loadForExam = async () => {
      try {
        const marks = await backendService.getMarks({ examId: selectedExam });
        const attConfig = await backendService.getClassAttendance(
          selectedClass,
          classHasSections ? selectedSection : "",
          selectedExam,
        );

        const calculated = calculateResults(
          filteredStudents,
          filteredSubjects,
          marks as any,
          gradingRules,
          attConfig,
        );

        setResults(calculated);

        // Calculate Highs
        const highs: { [key: string]: number } = {};
        filteredSubjects.forEach((sub) => {
          const subjectMarks = calculated.map((r) => {
            const raw = r.marks[sub.id] as any;
            return typeof raw === "number"
              ? raw
              : (raw?.theory || 0) + (raw?.practical || 0);
          });
          highs[sub.id] = Math.max(0, ...subjectMarks);
        });
        setClassHighs(highs);
      } catch (err) {
        console.error("Failed to load marks/attendance:", err);
        setResults([]);
        setClassHighs({});
      }
    };

    loadForExam();
  }, [
    selectedExam,
    selectedCampus,
    selectedClass,
    selectedSection,
    classHasSections,
    students,
    filteredSubjects,
    gradingRules,
  ]);

  const uniqueClasses = useMemo(() => {
    const fromStudents = students.map((s: Student) => s.className);
    const fromConfig = schoolClasses.map((c) => c.className);
    return Array.from(new Set([...fromStudents, ...fromConfig])).sort();
  }, [students, schoolClasses]);

  const uniqueSections = useMemo(() => {
    const fromStudents = students
      .filter((s) => s.className === selectedClass)
      .map((s) => s.section || "");
    const fromConfig = schoolClasses
      .filter((c) => c.className === selectedClass)
      .map((c) => c.section || "");
    return Array.from(new Set([...fromStudents, ...fromConfig])).sort();
  }, [students, schoolClasses, selectedClass]);

  const currentExamName =
    exams.find((e: ExamTerm) => e.id === selectedExam)?.name || "";
  const failRule = gradingRules.find((r) => r.minPercentage === 0) || {
    label: "F",
  };
  const handlePrintAll = () => {
    if (isPrinting) return; // prevent duplicate triggers
    setPrintMode("bulk");
    setIsPrinting(true);

    // Wait for two animation frames to ensure DOM updates + CSS are applied
    const runPrint = () => {
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
        setPrintMode("none");
      }, 250);
    };

    requestAnimationFrame(() => requestAnimationFrame(runPrint));
  };
  return (
    <div className="space-y-6 ">
      {/* Filters */}
      <div className="no-print bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Reports & Result Cards
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrintAll}
              // disabled={!selectedClass || results.length === 0 || isPrinting}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition shadow-xs"
            >
              <Printer className="w-4 h-4" /> Bulk Print Cards
            </button>
            <button
              onClick={() => setShowBroadsheet(true)}
              disabled={!selectedClass || results.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 disabled:opacity-50 transition shadow-xs"
            >
              <Grid className="w-4 h-4" /> Broadsheet
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          {/* Exam Select */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">
              Exam Term
            </label>
            <div className="relative">
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white text-sm"
              >
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-gray-500">
                <ArrowDown className="w-4 h-4" />
              </div>
            </div>
          </div>
          {/* Campus Select */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">
              Campus
            </label>
            <div className="relative">
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white text-sm"
              >
                <option key="boys" value="Boys">
                  Boys
                </option>
                <option key="girls" value="Girls">
                  Girls
                </option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-gray-500">
                <ArrowDown className="w-4 h-4" />
              </div>
            </div>
          </div>
          {/* Class Select */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">
              Class
            </label>
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection("");
                }}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white text-sm"
              >
                <option value="">Select Class</option>
                {uniqueClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-gray-500">
                <ArrowDown className="w-4 h-4" />
              </div>
            </div>
          </div>
          {/* Section Select */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">
              Section
            </label>
            <div className="relative">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedClass}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white disabled:bg-gray-100 text-sm"
              >
                <option value="">All Sections</option>
                {uniqueSections.map((s) => (
                  <option key={s || "none"} value={s}>
                    {s ? `Section ${s}` : "No Section"}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-gray-500">
                <ArrowDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students Grid */}
      {results.length > 0 ? (
        <div className="no-print grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {results.map((result) => (
            <div
              key={result.student.id}
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg uppercase">
                    {result.student.name}
                  </h3>
                  <p className="text-sm text-gray-500 font-mono">
                    Roll: {result.student.rollNumber}
                  </p>
                </div>
                <div
                  className={`text-xl font-bold ${
                    result.grade === failRule.label
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {result.percentage.toFixed(0)}%
                </div>
              </div>

              <div className="bg-gray-50 rounded p-2 mb-4 text-xs space-y-1 text-gray-600 border border-gray-100">
                <div className="flex justify-between">
                  <span>Rank:</span>{" "}
                  <b>
                    {result.rank}
                    <sup>{result.positionSuffix}</sup>
                  </b>
                </div>
                <div className="flex justify-between">
                  <span>Obtained:</span>{" "}
                  <b>
                    {result.totalObtained} / {result.totalMax}
                  </b>
                </div>
                <div className="flex justify-between">
                  <span>Grade:</span> <b>{result.grade}</b>
                </div>
              </div>

              <button
                onClick={() => {
                  setPrintStudent(result);
                  setPrintMode("single");
                }}
                className="w-full py-2 bg-primary-50 text-primary-700 font-bold text-sm rounded-lg hover:bg-primary-100 transition flex items-center justify-center gap-2 border border-primary-100"
              >
                <FileText className="w-4 h-4" /> View Result Card
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-print flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 shadow-xs">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-medium">No records found</p>
          <p className="text-sm">Select criteria above to view students.</p>
        </div>
      )}

      {/* Modals */}
      {printMode === "single" && printStudent && (
        <div
          className="fixed inset-0 bg-black/50 z-50
                  print:static print:bg-white"
        >
          <div className="no-print absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => window.print()}
              className="bg-primary-600 text-white p-2 rounded-full"
            >
              <Printer />
            </button>

            <button
              onClick={() => setPrintMode("none")}
              className="bg-white p-2 rounded-full"
            >
              <X />
            </button>
          </div>

          <div className="report-card-page">
            <ReportCard
              result={printStudent}
              subjects={filteredSubjects}
              classHighs={classHighs}
              gradingRules={gradingRules}
              classTeacherName={homeroomTeacher}
            />
          </div>
        </div>
      )}

      {showBroadsheet && (
        <BroadsheetView
          results={results}
          subjects={filteredSubjects}
          examName={currentExamName}
          campus={selectedCampus}
          className={selectedClass}
          sectionName={selectedSection}
          failLabel={failRule.label}
          onClose={() => setShowBroadsheet(false)}
          gradingRules={gradingRules}
          schoolClasses={schoolClasses}
          classTeachers={classTeachers}
        />
      )}

      {printMode === "bulk" && (
        <div className="hidden print:block top-0 left-0 w-full fixed print:static inset-0 bg-gray-100 z-100 overflow-auto print:overflow-visible">
          <style>{`
            @media print {
              @page { size: A4 portrait; margin: 5mm; }
              html, body, #root {
                height: auto !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              /* Ensure print container is block-based */
              .print-container {
                display: block !important;
                width: 100% !important;
              }

              /* Each card becomes a full A4 page with equal spacing */
              .report-card-page {
                display: block !important;
                width: 210mm !important;
                height: 297mm !important;
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                margin: 0 auto !important;
                box-sizing: border-box !important;
                background: #fff !important;
                z-index: 9999 !important;
                position: relative !important;
                overflow: visible !important;
                padding: 0 !important;
              }

              /* Make the inner report card fill the page and spread content evenly */
              .report-card-page > div {
                height: calc(297mm - 24mm) !important; /* subtract page padding */
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                box-sizing: border-box !important;
                padding: 12mm !important;
                padding-bottom: 0mm !important;
              }

              /* Prevent clipping */
              * {
                overflow: visible !important;
              }
            }
          `}</style>

          {/* Printable content */}
          <div id="print-container" className="print-container">
            {results.map((r) => (
              <div key={r.student.id} className="report-card-page">
                <ReportCard
                  result={r}
                  subjects={filteredSubjects}
                  classHighs={classHighs}
                  gradingRules={gradingRules}
                  classTeacherName={homeroomTeacher}
                  isBulkPrint
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

