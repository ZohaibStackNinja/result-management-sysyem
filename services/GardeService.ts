import { StudentResult } from "../types";

// NOTE: This service is now running in "Offline Mode" to satisfy the requirement
// of having no backend or database connections.
// It uses local logic to generate insights instead of calling an external AI API.

export const generateStudentRemarks = async (
  result: StudentResult,
): Promise<string> => {
  // Simulate a short delay to mimic "processing"
  await new Promise((resolve) => setTimeout(resolve, 500));

  const p = result.percentage;
  const firstName = result.student.name.split(" ")[0];

  // Logic-based remarks generator
  if (p >= 95)
    return `Outstanding achievement, ${firstName}! Your hard work is truly inspiring.`;
  if (p >= 90) return `Excellent performance, ${firstName}. Keep aiming high!`;
  if (p >= 85) return `Very good results. You are showing great potential.`;
  if (p >= 75)
    return `Good job, ${firstName}. Consistent effort will take you further.`;
  if (p >= 65)
    return `Satisfactory progress. Focus on your weaker subjects to improve.`;
  if (p >= 50)
    return `You passed, but there is significant room for improvement.`;
  if (p >= 40)
    return `Borderline performance. Extra attention is required in class.`;
  return `Below expectations. Please meet the class teacher for remedial planning.`;
};

export const analyzeClassPerformance = async (
  results: StudentResult[],
): Promise<string> => {
  // Simulate processing
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (!results || results.length === 0)
    return "No data available for analysis.";

  const avg =
    results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length;
  // We assume a generic pass mark of 40% for this analysis text,
  // though the UI uses dynamic grading rules.
  const passCount = results.filter((r) => r.percentage >= 40).length;
  const passRate = results.length > 0 ? (passCount / results.length) * 100 : 0;

  let trend = "";
  let suggestion = "";

  if (avg >= 80) {
    trend = "The class is performing exceptionally well.";
    suggestion = "Encourage advanced topics to keep students engaged.";
  } else if (avg >= 60) {
    trend = "The class performance is steady.";
    suggestion = "Focus on moving average students to the top tier.";
  } else {
    trend = "The class average is concerning.";
    suggestion =
      "Immediate remedial classes are recommended for core subjects.";
  }

  return `Class Size: ${results.length} | Average: ${avg.toFixed(1)}% | Pass Rate: ${passRate.toFixed(1)}%. ${trend} ${suggestion}`;
};
