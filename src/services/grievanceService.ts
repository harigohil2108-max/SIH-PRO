const API_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:5000/api";

/**
 * Get grievances visible to the authenticated user.
 *
 * Citizen:
 *   Returns the citizen's own grievances.
 *
 * Officer:
 *   Returns grievances according to the backend officer access rules.
 *
 * Admin:
 *   Returns grievances according to the backend admin access rules.
 */
export const getMyGrievances = async (token: string) => {
  const response = await fetch(`${API_URL}/grievances`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch grievances"
    );
  }

  return data;
};


/**
 * Get one grievance by its MongoDB _id.
 *
 * Used by:
 * - Citizen grievance detail
 * - Officer grievance detail
 * - Admin grievance detail
 */
export const getGrievanceById = async (
  token: string,
  grievanceId: string
) => {
  const response = await fetch(
    `${API_URL}/grievances/${grievanceId}`,
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
      data.message || "Failed to fetch grievance"
    );
  }

  return data;
};


/**
 * Create a new grievance.
 */
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
      district?: string;
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
  const response = await fetch(
    `${API_URL}/grievances`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(grievanceData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to create grievance"
    );
  }

  return data;
};


/**
 * Ask Gemini/AI to analyse a grievance before submission.
 *
 * NOTE:
 * This does not automatically make the grievance dependent
 * on AI. If AI quota is unavailable, the caller can handle
 * the error and continue without AI analysis.
 */
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
      district?: string;
      state?: string;
    };

    evidence?: {
      url: string;
      type: "IMAGE" | "VIDEO" | "DOCUMENT";
    }[];
  },
  signal?: AbortSignal
) => {
  const response = await fetch(
    `${API_URL}/grievances/ai-analyze`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify(
        grievanceData
      ),

      signal,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to analyze grievance"
    );
  }

  return data;
};


/**
 * Check whether similar grievances already exist.
 */
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
      district?: string;
      state?: string;
    };
  },
  signal?: AbortSignal
) => {
  const response = await fetch(
    `${API_URL}/grievances/check-duplicates`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(grievanceData),
      signal,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to check duplicate grievances"
    );
  }

  return data;
};


/**
 * Submit citizen feedback after grievance resolution.
 */
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
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rating,
        comment,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to submit feedback"
    );
  }

  return data;
};


/**
 * Reopen a grievance.
 *
 * Allowed by the backend for:
 * - Citizen
 * - Officer
 * - Admin
 */
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
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to reopen grievance"
    );
  }

  return data;
};


/**
 * Update grievance status.
 *
 * Used by Officer/Admin.
 *
 * Example:
 *   updateGrievanceStatus(token, id, "IN_PROGRESS")
 */
export const updateGrievanceStatus = async (
  token: string,
  grievanceId: string,
  status: string,
  message?: string
) => {
  const response = await fetch(
    `${API_URL}/grievances/${grievanceId}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        message,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update grievance status"
    );
  }

  return data;
};


/**
 * Assign a grievance to an officer.
 *
 * Currently restricted by the backend to ADMIN.
 */
export const assignGrievance = async (
  token: string,
  grievanceId: string,
  officerId: string
) => {
  const response = await fetch(
    `${API_URL}/grievances/${grievanceId}/assign`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        officerId,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to assign grievance"
    );
  }

  return data;
};


/**
 * Escalate a grievance.
 *
 * Used by Officer/Admin.
 */
export const escalateGrievance = async (
  token: string,
  grievanceId: string,
  reason?: string
) => {
  const response = await fetch(
    `${API_URL}/grievances/${grievanceId}/escalate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to escalate grievance"
    );
  }

  return data;
};

export const getGrievanceMessages = async (
  token: string,
  grievanceId: string
) => {
  const response = await fetch(
    `${API_URL}/grievances/${grievanceId}/messages`,
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
      data.message || "Failed to fetch messages"
    );
  }

  return data;
};

export const sendGrievanceMessage = async (
  token: string,
  grievanceId: string,
  message: string
) => {
  const response = await fetch(
    `${API_URL}/grievances/${grievanceId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to send message"
    );
  }

  return data;
};

export const routeGrievanceDepartment = async (
  token: string,
  grievanceId: string,
  departmentId: string,
  priority?: string
) => {
  const response = await fetch(`${API_URL}/grievances/${grievanceId}/route-department`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ departmentId, priority }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to route grievance to department");
  }

  return data;
};

export const submitOfficerDecision = async (
  token: string,
  grievanceId: string,
  payload: { action: "ACCEPT" | "OVERRIDE"; newPriority?: string; reason?: string }
) => {
  const response = await fetch(`${API_URL}/grievances/${grievanceId}/decision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to submit decision");
  }
  return data;
};