/**
 * Normalises various API response shapes into a plain array.
 */
export const getResponseArray = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.result)) return response.data.result;
  if (Array.isArray(response?.result)) return response.result;
  return [];
};

/**
 * Formats an ISO date string to DD/MM/YY HH:mm.
 */
export const formatDeadline = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return 'N/A';
  }
};

/**
 * Extracts a display name from various student/assignment API shapes.
 */
export const getStudentName = (assignment: any, index: number): string => {
  const student =
    assignment?.student ||
    assignment?.studentDetails ||
    assignment?.studentData ||
    assignment;

  return (
    student?.user?.fullname ||
    student?.user?.fullName ||
    student?.user?.name ||
    student?.user?.username ||
    student?.fullname ||
    student?.fullName ||
    student?.name ||
    assignment?.studentName ||
    assignment?.fullname ||
    assignment?.fullName ||
    `Student ${index + 1}`
  );
};
