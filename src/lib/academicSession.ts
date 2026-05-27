/**
 * Calculate academic session based on current date
 * If current month is September (9) or later: currentYear/currentYear+1
 * Otherwise: currentYear-1/currentYear
 */
export function getAcademicSession(date: Date = new Date()): string {
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1; // getMonth is 0-indexed

  if (currentMonth >= 9) {
    return `${currentYear}/${currentYear + 1}`;
  } else {
    return `${currentYear - 1}/${currentYear}`;
  }
}

/**
 * Format academic session for display (e.g., "2024/2025" -> "2024/25")
 */
export function formatAcademicSession(session: string): string {
  const [start, end] = session.split("/");
  return `${start}/${end.slice(-2)}`;
}
