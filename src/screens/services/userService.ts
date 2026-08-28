const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export const getAllUsers = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await fetch(
    `${API_URL}/users/admin/all`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to load users"
    );
  }

  return data.users || [];
};