const API_URL =
  (import.meta as any).env?.VITE_API_URL ||
  "http://localhost:5000/api";

export const getDepartments = async (
  token: string
) => {
  const response = await fetch(
    `${API_URL}/departments`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to fetch departments"
    );
  }

  return data;
};