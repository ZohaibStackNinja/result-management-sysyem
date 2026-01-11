
import { Student, Subject, MarkEntry, StudentResult, GradingRule } from '../types';

export const getOrdinalSuffix = (i: number) => {
    const j = i % 10,
        k = i % 100;
    if (j === 1 && k !== 11) {
        return "st";
    }
    if (j === 2 && k !== 12) {
        return "nd";
    }
    if (j === 3 && k !== 13) {
        return "rd";
    }
    return "th";
};

export const formatAttendance = (student: Student): string => {
    if (student.attendancePresent !== undefined && student.attendanceTotal !== undefined) {
        return `${student.attendancePresent}/${student.attendanceTotal}`;
    }
    return 'N/A';
};

// Helper format for term attendance in results
export const formatResultAttendance = (result: StudentResult): string => {
    if (result.attendance) {
        return `${result.attendance.present}/${result.attendance.total}`;
    }
    // Fallback to student global
    return formatAttendance(result.student);
};

export const calculateResults = (
  students: Student[], 
  subjects: Subject[], 
  marks: MarkEntry[],
  gradingRules: GradingRule[],
  attendanceConfig?: { totalDays: number }
): StudentResult[] => {
  
  // Sort rules descending by minPercentage to find the highest match first
  const sortedRules = [...gradingRules].sort((a, b) => b.minPercentage - a.minPercentage);

  const results: StudentResult[] = students.map(student => {
    const studentMarks: { [key: string]: number } = {};
    let totalObtained = 0;
    let totalMax = 0;

    // Process Academic Subjects
    subjects.forEach(sub => {
      // Exclude virtual attendance subject from academic total
      if(sub.id === 'term-attendance') return;

      const entry = marks.find(m => m.studentId === student.id && m.subjectId === sub.id);
      const score = entry ? entry.obtainedMarks : 0;
      studentMarks[sub.id] = score;
      totalObtained += score;
      totalMax += sub.totalMarks;
    });

    // Process Attendance (Term Specific)
    let attendanceData = undefined;
    const attMark = marks.find(m => m.studentId === student.id && m.subjectId === 'term-attendance');
    if (attendanceConfig && attMark) {
        const present = attMark.obtainedMarks;
        const total = attendanceConfig.totalDays;
        attendanceData = {
            present,
            total,
            percentage: total > 0 ? Math.round((present/total)*100) : 0
        };
    }

    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    
    // Determine Grade
    let grade = 'F'; // Default
    const matchedRule = sortedRules.find(rule => percentage >= rule.minPercentage);
    if (matchedRule) {
      grade = matchedRule.label;
    }

    return {
      student,
      marks: studentMarks,
      totalObtained,
      totalMax,
      percentage,
      grade,
      rank: 0, // To be calculated
      attendance: attendanceData
    };
  });

  // Assign Ranks with Tie Handling
  results.sort((a, b) => b.percentage - a.percentage);
  
  let currentRank = 1;
  for (let i = 0; i < results.length; i++) {
      if (i > 0 && results[i].percentage < results[i - 1].percentage) {
          currentRank = i + 1;
      }
      results[i].rank = currentRank;
      results[i].positionSuffix = getOrdinalSuffix(currentRank);
  }

  return results;
};
