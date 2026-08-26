const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
      coordinates?: {
        latitude?: number;
        longitude?: number;
      };
    };
    evidence?: {
      url: string;
      type: "IMAGE" | "VIDEO" | "DOCUMENT";
    }[];
    duplicateMatches?: {
      grievance: string;
      similarity: number;
    }[];
    aiAnalysis?: {
  category?: string;
  subcategory?: string;
  department?: string;
  priorityScore?: number;
  priorityReason?: string;
  confidence?: number;
  summary?: string;
};
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

export const analyzeGrievance = async (
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
  },
  signal?: AbortSignal
) => {
  const response = await fetch(`${API_URL}/grievances/ai-analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(grievanceData),
    signal,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to analyze grievance");
  }

  return data;
}; 
export const checkDuplicateGrievances = async (
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
  },
  signal?: AbortSignal
) => {
  const response = await fetch(`${API_URL}/grievances/check-duplicates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(grievanceData),
    signal,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to check duplicate grievances"
    );
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

export const addGrievanceEvidence = async (
  token: string,
  grievanceId: string,
  evidence: { name: string; type: "IMAGE" | "VIDEO" | "DOCUMENT" }
) => {
  const response = await fetch(`${API_URL}/grievances/${grievanceId}/evidence`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(evidence),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to add evidence");
  return data;
};

export const confirmGrievanceResolution = async (token: string, grievanceId: string) => {
  const response = await fetch(`${API_URL}/grievances/${grievanceId}/confirm-resolution`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to accept resolution");
  return data;
};
