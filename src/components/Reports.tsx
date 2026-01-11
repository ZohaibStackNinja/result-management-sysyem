import React, { useState, useMemo, useEffect } from "react";
import { storageService } from "../../services/storageService";
import {
  calculateResults,
  formatAttendance,
  getOrdinalSuffix,
  formatResultAttendance,
} from "../../utils/calculations";
import {
  Printer,
  Sparkles,
  Download,
  X,
  FileDown,
  QrCode,
  Grid,
  List,
  Maximize2,
  ArrowLeft,
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
import { exportToCSV } from "../../utils/csvHelper";

const ReportCard: React.FC<{
  result: StudentResult;
  subjects: Subject[];
  classHighs: { [subjectId: string]: number };
  gradingRules: GradingRule[];
  onClose?: () => void;
  isBulkPrint?: boolean;
}> = ({ result, subjects, classHighs, gradingRules, onClose, isBulkPrint }) => {
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
  //   const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verificationData)}`;

  const sortedRules = useMemo(
    () => [...gradingRules].sort((a, b) => b.minPercentage - a.minPercentage),
    [gradingRules]
  );

  const getSubjectGrade = (pct: number) => {
    const found = sortedRules.find((r) => pct >= r.minPercentage);
    return found ? found.label : "F";
  };

  const getTeacher = (subjectId: string) => {
    return storageService.getSubjectTeacher(
      subjectId,
      result.student.className,
      result.student.section
    );
  };

  const homeroomTeacher = storageService.getHomeroomTeacher(
    result.student.className,
    result.student.section
  );

  const cardContent = (
    <div
      className={`bg-white p-10 ${
        isPreview
          ? "rounded-xl shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto"
          : "w-full page-break flex flex-col justify-between"
      } relative`}
    >
      {/* Card Header */}
      <div>
        <div className="flex justify-between items-start border-b-2 border-secondary-600 pb-4 mb-6">
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
          {/* <div className="text-right">
                <img src={qrUrl} alt="Verification QR" className="w-24 h-24 ml-auto border border-gray-200 p-1" />
            </div> */}
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
                Class & Section:
              </span>
              <span className="font-bold text-gray-800 uppercase">
                {result.student.className}
                {result.student.section ? ` - ${result.student.section}` : ""}
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
              <span className="text-gray-500 font-medium">Class Position:</span>
              <span className="font-bold text-gray-800 bg-primary-100 px-2 rounded">
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
              <th className="border border-gray-300 px-4 py-3 text-center bg-yellow-50">
                High
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
              const marks = result.marks[sub.id] || 0;
              const pct =
                sub.totalMarks > 0 ? (marks / sub.totalMarks) * 100 : 0;
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
                    {sub.totalMarks}
                  </td>
                  <td className="border border-gray-300 px-4 py-2.5 text-center text-gray-500 bg-yellow-50/50">
                    {highest}
                  </td>
                  <td className="border border-gray-300 px-4 py-2.5 text-center font-bold text-gray-800">
                    {marks}
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
              <td className="border border-gray-300 px-4 py-3 text-center bg-gray-100"></td>
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
                {result.attendance
                  ? result.attendance.percentage
                  : result.student.attendancePercentage}
                %
              </span>
              <span className="text-sm text-gray-500">
                (
                {result.attendance
                  ? `${result.attendance.present}/${result.attendance.total}`
                  : `${result.student.attendancePresent}/${
                      result.student.attendanceTotal || "?"
                    }`}
                )
              </span>
            </div>
          </div>
        </div>

        <div className="mb-8 border border-gray-300 rounded p-4 bg-gray-50/30">
          <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">
            Principal's Remarks
          </h3>
          <p className="text-gray-800 italic font-serif text-lg leading-relaxed">
            "{remark || "Excellent performance. Keep up the consistent effort!"}
            "
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <div>
        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
          <div className="text-center">
            <div className="h-12 border-b border-gray-300 mb-2 flex items-end justify-center">
              {homeroomTeacher && (
                <span className="font-serif italic text-lg text-secondary-900">
                  {homeroomTeacher}
                </span>
              )}
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

        <div className="mt-6 text-center text-[10px] text-gray-400">
          Generated by NCSS Result Management System •{" "}
          {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );

  if (isPreview) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:block print:bg-white print:static print:inset-auto">
        <div className="relative w-full max-w-4xl">
          <div className="absolute top-4 right-4 z-50 flex gap-2 no-print">
            <button
              onClick={() => window.print()}
              className="bg-primary-600 text-white p-2 rounded-full shadow hover:bg-primary-700"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="bg-white text-gray-700 p-2 rounded-full shadow hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {cardContent}
        </div>
      </div>
    );
  }

  return cardContent;
};

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
}) => {
  const passedStudents = results.filter((r) => r.grade !== failLabel).length;
  const failedStudents = results.length - passedStudents;
  const passPercentage =
    results.length > 0 ? (passedStudents / results.length) * 100 : 0;

  const homeroomTeacher = useMemo(() => {
    return storageService.getHomeroomTeacher(className, sectionName) || "N/A";
  }, [className, sectionName]);

  const teacherMap = useMemo(() => {
    const assignments = storageService.getClassTeachers();
    return {
      get: (subId: string, cls: string, sec: string) => {
        const found = assignments.find(
          (a) =>
            a.subjectId === subId && a.className === cls && a.section === sec
        );
        if (found) return found.teacherName;
        const sub = subjects.find((s) => s.id === subId);
        return sub?.teacherName || "-";
      },
    };
  }, [subjects]);

  const subjectStats = subjects.map((sub) => {
    let passCount = 0;
    let failCount = 0;
    results.forEach((r) => {
      const marks = r.marks[sub.id] || 0;
      const pct = (marks / sub.totalMarks) * 100;
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

  return (
    <div className="fixed inset-0 bg-white z-[60] overflow-auto print:fixed print:inset-0 print:overflow-visible print:z-[100] text-gray-900">
      {/* Force Landscape for BroadSheet with larger print font */}
      <style>{`@media print { @page { size: landscape; margin: 5mm; } body { -webkit-print-color-adjust: exact; } }`}</style>

      <div className="p-4 no-print flex justify-between items-center bg-gray-100 border-b print:hidden">
        <h2 className="font-bold text-gray-700">Master Result Broadsheet</h2>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
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

      <div className="p-6 min-w-max print:min-w-0 print:w-full print:p-2">
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
              <th className="border border-gray-800 p-2 text-left min-w-[150px] align-middle">
                Student Name
              </th>
              <th className="border border-gray-800 p-2 w-16 align-middle">
                Attend
              </th>
              {subjects.map((s) => {
                const teacher = teacherMap.get(s.id, className, sectionName);
                const displayTeacher = teacher.replace(
                  /^(Mr\.|Ms\.|Mrs\.|Miss)\s+/i,
                  ""
                );

                return (
                  <th
                    key={s.id}
                    className="border border-gray-800 p-0 bg-white min-w-[90px] align-top"
                  >
                    <div className="flex flex-col h-full border-b border-gray-800">
                      {/* Subject Name */}
                      <div className="p-1.5 font-bold text-xs uppercase bg-gray-50 border-b border-gray-300">
                        {s.name}
                      </div>
                      {/* Max Marks */}
                      <div className="p-1 text-[10px] font-medium text-gray-500 bg-white border-b border-gray-100">
                        Max: {s.totalMarks}
                      </div>
                      {/* Teacher Name */}
                      <div
                        className="p-1 text-[10px] font-bold text-blue-800 bg-blue-50/50 truncate"
                        title={teacher}
                      >
                        {displayTeacher}
                      </div>
                    </div>
                  </th>
                );
              })}
              <th className="border border-gray-800 p-2 w-14 font-bold bg-gray-50 align-middle">
                Total
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
                  className="border-r border-gray-800 px-2 py-1.5 text-left font-bold uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]"
                  title={r.student.name}
                >
                  {r.student.name}
                </td>
                <td className="border-r border-gray-800 p-1.5 text-[10px]">
                  {formatAttendance(r.student)}
                </td>
                {subjects.map((s) => {
                  const marks = r.marks[s.id] ?? 0;
                  const pct = (marks / s.totalMarks) * 100;
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
                        <span
                          className={`font-bold ${
                            isLow ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {marks}
                        </span>
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

const Reports: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<ExamTerm[]>([]);
  const [gradingRules, setGradingRules] = useState<GradingRule[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);

  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedCampus, setSelectedCampus] = useState<string>("Boys");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");

  const [results, setResults] = useState<StudentResult[]>([]);
  const [classHighs, setClassHighs] = useState<{ [key: string]: number }>({});

  const [viewStudent, setViewStudent] = useState<StudentResult | null>(null);
  const [showBroadsheet, setShowBroadsheet] = useState(false);
  const [isBulkPrint, setIsBulkPrint] = useState(false);

  // Initial Load
  useEffect(() => {
    const allStudents = storageService.getStudents();
    const allSubjects = storageService.getSubjects();
    const allExams = storageService.getExams();
    const rules = storageService.getGradingRules();
    const classes = storageService.getClasses();

    setSubjects(allSubjects);
    setExams(allExams);
    setGradingRules(rules);
    setStudents(allStudents);
    setSchoolClasses(classes);

    if (allExams.length > 0) setSelectedExam(allExams[0].id);

    // Auto-select class logic
    const clsNames = Array.from(
      new Set(allStudents.map((s) => s.className))
    ).sort();
    if (clsNames.length > 0) setSelectedClass(clsNames[0]);
  }, []);

  // Filter relevant subjects for the selected class
  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return subjects;
    // Attempt to find configuration for this class/section
    const clsConfig = schoolClasses.find(
      (c) =>
        c.className === selectedClass &&
        (selectedSection ? c.section === selectedSection : true)
    );
    if (clsConfig && clsConfig.subjectIds && clsConfig.subjectIds.length > 0) {
      return subjects.filter((s) => clsConfig.subjectIds?.includes(s.id));
    }
    return subjects;
  }, [subjects, schoolClasses, selectedClass, selectedSection]);

  // Filter and Calculate Results
  useEffect(() => {
    if (!selectedExam) return;

    let filteredStudents = students.filter((s) => {
      if (selectedCampus && s.campus !== selectedCampus) return false;
      if (selectedClass && s.className !== selectedClass) return false;
      if (selectedSection && s.section !== selectedSection) return false;
      return true;
    });

    // Get Marks for this exam
    const marks = storageService.getMarks(selectedExam);

    // Calculate
    const attConfig = storageService.getClassAttendance(
      selectedClass,
      selectedSection,
      selectedExam
    );

    const calculated = calculateResults(
      filteredStudents,
      filteredSubjects,
      marks,
      gradingRules,
      attConfig
    );
    setResults(calculated);

    // Calculate Highs
    const highs: { [key: string]: number } = {};
    filteredSubjects.forEach((sub) => {
      const subjectMarks = calculated.map((r) => r.marks[sub.id] || 0);
      highs[sub.id] = Math.max(0, ...subjectMarks);
    });
    setClassHighs(highs);
  }, [
    selectedExam,
    selectedCampus,
    selectedClass,
    selectedSection,
    students,
    filteredSubjects,
    gradingRules,
  ]);

  const uniqueClasses = Array.from(
    new Set(students.map((s) => s.className))
  ).sort();
  const uniqueSections = Array.from(
    new Set(
      students
        .filter((s) => s.className === selectedClass)
        .map((s) => s.section)
    )
  ).sort();

  const currentExamName = exams.find((e) => e.id === selectedExam)?.name || "";
  const failRule = gradingRules.find((r) => r.minPercentage === 0) || {
    label: "F",
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Reports & Result Cards
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsBulkPrint(true)}
              disabled={!selectedClass || results.length === 0}
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
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                onClick={() => setViewStudent(result)}
                className="w-full py-2 bg-primary-50 text-primary-700 font-bold text-sm rounded-lg hover:bg-primary-100 transition flex items-center justify-center gap-2 border border-primary-100"
              >
                <FileText className="w-4 h-4" /> View Result Card
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 shadow-xs">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-medium">No records found</p>
          <p className="text-sm">Select criteria above to view students.</p>
        </div>
      )}

      {/* Modals */}
      {viewStudent && (
        <ReportCard
          result={viewStudent}
          subjects={filteredSubjects}
          classHighs={classHighs}
          gradingRules={gradingRules}
          onClose={() => setViewStudent(null)}
        />
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
        />
      )}

      {isBulkPrint && (
        <div className="fixed inset-0 bg-gray-100 z-[100] overflow-auto">
          <div className="no-print sticky top-0 bg-white p-4 border-b border-gray-200 shadow-xs flex justify-between items-center z-10">
            <div>
              <h2 className="font-bold text-gray-800">Bulk Print Preview</h2>
              <p className="text-sm text-gray-500">
                Printing {results.length} report cards.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-primary-700 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print All
              </button>
              <button
                onClick={() => setIsBulkPrint(false)}
                className="bg-white text-gray-700 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold"
              >
                Close
              </button>
            </div>
          </div>
          <div className="print:p-0">
            {results.map((r, i) => (
              <div
                key={r.student.id}
                className={
                  i < results.length - 1
                    ? "print:break-after-page mb-8"
                    : "mb-8"
                }
              >
                <ReportCard
                  result={r}
                  subjects={filteredSubjects}
                  classHighs={classHighs}
                  gradingRules={gradingRules}
                  isBulkPrint={true}
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
