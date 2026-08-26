const API_URL = "http://localhost:5000/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getNotifications() {
  const response = await fetch(
    `${API_URL}/notifications`,
    {
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch notifications"
    );
  }

  return data.notifications;
}

export async function getUnreadNotificationCount() {
  const response = await fetch(
    `${API_URL}/notifications/unread-count`,
    {
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to fetch notification count"
    );
  }

  return data.count;
}

export async function markNotificationAsRead(
  notificationId: string
) {
  const response = await fetch(
    `${API_URL}/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to mark notification as read"
    );
  }

  return data;
}

export async function markAllNotificationsAsRead() {
  const response = await fetch(
    `${API_URL}/notifications/read-all`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to mark notifications as read"
    );
  }

  return data;
}