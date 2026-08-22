const API_URL = "http://localhost:5000/api";

export const getMyGrievances = async (token: string) => {
  const response = await fetch(`${API_URL}/grievances`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch grievances");
  }

  return data;
};

export const createGrievance = async (
  token: string,
  grievanceData: {
    title: string;
    description: string;
    category?: string;
    subcategory?: string;
    location?: {
      address?: string;
      city?: string;
      state?: string;
    };
    evidence?: string[];
  }
) => {
  const response = await fetch(`${API_URL}/grievances`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(grievanceData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create grievance");
  }

  return data;
};