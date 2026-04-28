import { apiFetch } from "../lib/api";

export const getStudentsForReports = async (queryParams = "") => {
  const response = await apiFetch(`/api/reports/students?${queryParams}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch students");
  }
  return response.json();
};

export const getStudentDossier = async (studentId) => {
  const response = await apiFetch(`/api/reports/students/${studentId}/dossier`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch student dossier");
  }
  return response.json();
};

export const exportStudentProfilePDF = async (studentId) => {
  const response = await apiFetch(`/api/reports/students/${studentId}/export`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to export PDF");
  }

  // Create a download link for the PDF
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Student_Profile_${studentId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  return blob;
};
