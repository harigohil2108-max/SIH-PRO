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
export const getGrievanceById = async (
  token: string,
  grievanceId: string
) => {
  const response = await fetch(`${API_URL}/grievances/${grievanceId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch grievance");
  }

  return data;
};
export const submitFeedback = async (
  token: string,
  grievanceId: string,
  rating: number,
  comment: string
) => {
  const response = await fetch(
    `${API_URL}/grievances/${grievanceId}/feedback`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        rating,
        comment,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to submit feedback");
  }

  return data;
};
export const reopenGrievance = async (
  token: string,
  grievanceId: string,
  reason: string
) => {
  const response = await fetch(
    `${API_URL}/grievances/${grievanceId}/reopen`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        reason,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to reopen grievance");
  }

  return data;
};