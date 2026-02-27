import React, { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  Label,
  LabelList,
} from "recharts";
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Filter,
  FileSpreadsheet,
  FileText,
  Settings as SettingsIcon,
  Edit2,
  Printer,
} from "lucide-react";
// import { storageService } from "../../services/storageService";
import { calculateResults, getOrdinalSuffix } from "../../utils/calculations";
import { Link } from "react-router-dom";
import backendService from "../../services/backendService";
import {
  Student,
  Subject,
  ExamTerm,
  MarkEntry,
  GradingRule,
  Session,
} from "../../types";

// NCSS Palette: Navy (#1B234F), Green (#7bb508)
const COLORS = [
  "#1B234F",
  "#7bb508",
  "#95D122",
  "#EAB308",
  "#64748B",
  "#94A3B8",
];

const StatCard = ({
  title,
  value,
  icon: Icon,
  colorClass,
  iconColorClass,
}: any) => (
  <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 flex items-center space-x-4 transition hover:shadow-sm hover:border-primary-100">
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon className={`w-6 h-6 ${iconColorClass}`} />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-xs z-50">
        <p className="font-bold text-gray-800 mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: payload[0].fill }}
          ></span>
          <p className="text-gray-600">
            Average: <span className="font-bold">{payload[0].value}%</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<{ user?: any }> = ({ user }) => {
  const currentUser = user;
  const isTeacher = currentUser?.role === "teacher";

  // Data State
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<ExamTerm[]>([]);
  const [marks, setMarks] = useState<MarkEntry[]>([]);
  const [gradingRules, setGradingRules] = useState<GradingRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCampus, setSelectedCampus] = useState<string>("Boys");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // First get active session
        const session = await backendService.getActiveSession();
        const sessionId = session?.id;

        // Then fetch all other data
        const [studentsList, subjectsList, examsList, marksList, rules] =
          await Promise.all([
            backendService.getStudents(),
            backendService.getSubjects(),
            sessionId
              ? backendService.getExams(sessionId)
              : Promise.resolve([]),
            backendService.getMarks(),
            backendService.getGradingRules(),
          ]);

        setActiveSession(session || null);
        setStudents(studentsList || []);
        setSubjects(subjectsList || []);
        setExams(examsList || []);
        setMarks(marksList || []);
        setGradingRules(rules || []);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        // Set empty defaults on error
        setActiveSession(null);
        setStudents([]);
        setSubjects([]);
        setExams([]);
        setMarks([]);
        setGradingRules([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Derived Lists for Dropdowns
  const classes = Array.from(new Set(students.map((s) => s.className))).sort();
  const sections = Array.from(new Set(students.map((s) => s.section))).sort();
  const currentExam = exams[0]; // Default to first exam

  // 1. Calculate ALL Results first
  const allResults = useMemo(
    () => calculateResults(students, subjects, marks, gradingRules),
    [students, subjects, marks, gradingRules],
  );

  // 2. Filter Results based on selection
  const filteredResults = useMemo(() => {
    let res = allResults;
    if (selectedCampus) {
      res = res.filter((r) => r.student.campus === selectedCampus);
    }
    if (selectedClass) {
      res = res.filter((r) => r.student.className === selectedClass);
    }
    if (selectedSection) {
      res = res.filter((r) => r.student.section === selectedSection);
    }
    return res;
  }, [allResults, selectedCampus, selectedClass, selectedSection]);

  // Determine Fail Grade Label (Assume 0% is Fail)
  const failRule = gradingRules.find((r) => r.minPercentage === 0) || {
    label: "F",
  };
  const failLabel = failRule.label;

  // 3. Compute Stats based on FILTERED results
  const passCount = filteredResults.filter((r) => r.grade !== failLabel).length;
  const passPercentage =
    filteredResults.length > 0
      ? ((passCount / filteredResults.length) * 100).toFixed(1)
      : 0;
  const avgPerformance =
    filteredResults.length > 0
      ? (
          filteredResults.reduce((acc, curr) => acc + curr.percentage, 0) /
          filteredResults.length
        ).toFixed(1)
      : 0;

  // 4. Calculate Subject Performance (Dynamic based on Filter)
  const subjectPerformanceData = useMemo(() => {
    return subjects
      .map((sub) => {
        const numeric = filteredResults
          .map((r) => {
            const raw = r.marks[sub.id] as any;
            if (raw === undefined) return undefined;
            return typeof raw === "number"
              ? raw
              : (raw?.theory || 0) + (raw?.practical || 0);
          })
          .filter((n) => n !== undefined && !isNaN(n)) as number[];

        const avg = numeric.length
          ? numeric.reduce((a, b) => a + b, 0) / numeric.length
          : 0;

        return { name: sub.name, avg: Math.round(avg) };
      })
      .sort((a, b) => a.avg - b.avg);
  }, [subjects, filteredResults]);

  const gradeDistribution = useMemo(() => {
    return gradingRules
      .sort((a, b) => b.minPercentage - a.minPercentage)
      .map((rule) => ({
        name: rule.label,
        value: filteredResults.filter((r) => r.grade === rule.label).length,
      }))
      .filter((d) => d.value > 0);
  }, [gradingRules, filteredResults]);

  // 5. Top and Bottom Performers
  const sortedByScore = [...filteredResults].sort(
    (a, b) => b.percentage - a.percentage,
  );
  const rankedResults = sortedByScore.map((r, idx) => ({
    ...r,
    rank: idx + 1,
    positionSuffix: getOrdinalSuffix(idx + 1),
  }));

  const topPerformers = rankedResults.slice(0, 5);
  const bottomPerformers = [...rankedResults].reverse().slice(0, 5);
  const viewTitle = `${selectedCampus} Campus${
    selectedClass ? " - Class " + selectedClass : ""
  }`;

  const getBarColor = (score: number) => {
    if (score >= 80) return "#166534"; // Green-800
    if (score >= 50) return "#1B234F"; // Brand Navy
    return "#dc2626"; // Red-600
  };

  // --- TEACHER VIEW (SIMPLIFIED) ---
  if (isTeacher) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 py-8 animate-in fade-in duration-500">
        {/* Role Indicator Badge */}
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm font-bold">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          Teacher View - {currentUser?.name}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {currentUser?.name}
            </h1>
            <p className="text-gray-500 mt-1">
              Select an action below to get started.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-xs">
            <div className="text-right">
              <p className="text-sm font-bold text-primary-600">
                {activeSession?.name || "Session"}
              </p>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                Active Term
              </p>
            </div>
            <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Enter Marks Card */}
          <Link
            to="/marks"
            className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 hover:border-primary-500 hover:shadow-lg hover:shadow-primary-900/5 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition duration-500 transform group-hover:scale-110">
              <FileSpreadsheet className="w-24 h-24 text-primary-600" />
            </div>
            <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition shadow-xs">
              <Edit2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Enter Marks
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Input and update exam scores for your classes and subjects.
            </p>
            <div className="flex items-center text-primary-600 text-sm font-bold group-hover:translate-x-1 transition">
              Start Entry <ArrowUp className="w-4 h-4 rotate-90 ml-1" />
            </div>
          </Link>

          {/* Print Reports Card */}
          <Link
            to="/reports"
            className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 hover:border-secondary-500 hover:shadow-lg hover:shadow-secondary-900/5 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition duration-500 transform group-hover:scale-110">
              <FileText className="w-24 h-24 text-secondary-600" />
            </div>
            <div className="w-14 h-14 bg-secondary-50 text-secondary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition shadow-xs">
              <Printer className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Print Reports
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Generate student result cards and view class broadsheets.
            </p>
            <div className="flex items-center text-secondary-600 text-sm font-bold group-hover:translate-x-1 transition">
              View Reports <ArrowUp className="w-4 h-4 rotate-90 ml-1" />
            </div>
          </Link>

          {/* Settings Card */}
          <Link
            to="/settings"
            className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 hover:border-gray-400 hover:shadow-lg transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition duration-500 transform group-hover:scale-110">
              <SettingsIcon className="w-24 h-24 text-gray-600" />
            </div>
            <div className="w-14 h-14 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition shadow-xs">
              <SettingsIcon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">My Account</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Update your login password and view profile details.
            </p>
            <div className="flex items-center text-gray-600 text-sm font-bold group-hover:translate-x-1 transition">
              Manage <ArrowUp className="w-4 h-4 rotate-90 ml-1" />
            </div>
          </Link>
        </div>

        {/* Simple Stats for Context */}
        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Quick School Stats
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                Total Students
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {students.length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                Open Exams
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {exams.filter((e) => !e.isLocked).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN VIEW (FULL ANALYTICS) ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Indicator Badge */}
      <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold">
        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
        Admin View - {currentUser?.name}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {viewTitle} Overview
          </h2>
          <p className="text-gray-500 text-sm">
            Analytics for {selectedCampus || "Entire School"}{" "}
            {selectedClass ? `(Class ${selectedClass})` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mr-2">
            <Filter className="w-4 h-4" /> Filter:
          </div>

          <select
            className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            onChange={(e) => setSelectedCampus(e.target.value)}
            value={selectedCampus}
          >
            <option value="Boys">Boys Campus</option>
            <option value="Girls">Girls Campus</option>
          </select>

          <select
            className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            onChange={(e) => setSelectedClass(e.target.value)}
            value={selectedClass}
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>

          <select
            className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            onChange={(e) => setSelectedSection(e.target.value)}
            value={selectedSection}
            disabled={!selectedClass}
          >
            <option value="">All Sections</option>
            {sections.map((s) => (
              <option key={s || "empty"} value={s}>
                {s ? `Sec ${s}` : "No Section"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Students"
          value={filteredResults.length}
          icon={Users}
          colorClass="bg-primary-50"
          iconColorClass="text-primary-600"
        />
        <StatCard
          title="Pass Percentage"
          value={`${passPercentage}%`}
          icon={TrendingUp}
          colorClass="bg-secondary-50"
          iconColorClass="text-secondary-600"
        />
        <StatCard
          title="Average Score"
          value={`${avgPerformance}%`}
          icon={BookOpen}
          colorClass="bg-secondary-50/50"
          iconColorClass="text-secondary-500"
        />
        <StatCard
          title="Top Topper"
          value={topPerformers[0]?.student.name || "N/A"}
          icon={Award}
          colorClass="bg-yellow-50"
          iconColorClass="text-yellow-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Subject Performance
              </h3>
              <p className="text-xs text-gray-500">
                Average scores by subject.{" "}
                <span className="text-green-700 font-bold">High</span>,{" "}
                <span className="text-brand-navy font-bold">Mid</span>,{" "}
                <span className="text-red-600 font-bold">Low</span>.
              </p>
            </div>
            <AlertCircle className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={subjectPerformanceData}
                layout="vertical"
                margin={{ top: 10, right: 50, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  vertical={true}
                  stroke="#e5e7eb"
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  stroke="#9ca3af"
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 11, fontWeight: 500, fill: "#374151" }}
                  interval={0}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "#f8fafc", opacity: 0.8 }}
                />
                <Bar
                  dataKey="avg"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                  background={{ fill: "#f9fafb" }}
                >
                  {subjectPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.avg)} />
                  ))}
                  <LabelList
                    dataKey="avg"
                    position="right"
                    fill="#4b5563"
                    fontSize={11}
                    fontWeight="bold"
                    formatter={(val: any) => `${val}%`}
                  />
                </Bar>
                <ReferenceLine
                  x={Number(avgPerformance)}
                  stroke="#eab308"
                  strokeDasharray="3 3"
                  strokeWidth={2}
                >
                  <Label
                    value={`Class Avg: ${avgPerformance}%`}
                    position="top"
                    fill="#ca8a04"
                    fontSize={10}
                    fontWeight="bold"
                    offset={10}
                  />
                </ReferenceLine>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Grade Distribution
          </h3>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs text-gray-500 mt-2 flex-wrap">
            {gradeDistribution.map((entry, index) => (
              <div key={index} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span>
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Insights Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers (Merit List) */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-secondary-50 flex justify-between items-center">
            <h3 className="font-bold text-secondary-800 flex items-center gap-2">
              <ArrowUp className="w-4 h-4" /> Merit List (Top 5)
            </h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-2">Rank</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Campus</th>
                <th className="px-4 py-2">Class</th>
                <th className="px-4 py-2 text-right">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topPerformers.map((r, i) => (
                <tr key={r.student.id}>
                  <td className="px-4 py-3 font-medium text-gray-600">
                    {r.rank}
                    <sup>{r.positionSuffix}</sup>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {r.student.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.student.campus}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.student.className}
                    {r.student.section ? `-${r.student.section}` : ""}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-secondary-600">
                    {r.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
              {topPerformers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400">
                    No data available for this selection
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Performers */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-red-50 flex justify-between items-center">
            <h3 className="font-bold text-red-800 flex items-center gap-2">
              <ArrowDown className="w-4 h-4" /> Students At Risk
            </h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Campus</th>
                <th className="px-4 py-2">Class</th>
                <th className="px-4 py-2 text-right">Percentage</th>
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bottomPerformers.map((r) => (
                <tr key={r.student.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {r.student.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.student.campus}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.student.className}
                    {r.student.section ? `-${r.student.section}` : ""}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    {r.percentage.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded font-bold ${
                        r.grade === failLabel
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {r.grade === failLabel ? "Fail" : "Low"}
                    </span>
                  </td>
                </tr>
              ))}
              {bottomPerformers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400">
                    No data available for this selection
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;