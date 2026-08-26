const API_URL = "http://localhost:5000/api";

export async function login(
  identifier: string,
  password: string
) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

export async function register(
  name: string,
  email: string,
  phone: string,
  password: string,
  role: "CITIZEN" | "OFFICER" | "ADMIN" = "CITIZEN",
  officialId?: string,
  department?: string,
  designation?: string
) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      phone,
      password,
      role,
      officialId,
      department,
      designation,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
}

export async function updateProfile(
  name: string,
  phone: string,
  preferredLanguage: string
) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      phone,
      preferredLanguage,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update profile"
    );
  }

  return data;
}

export async function updateLocation(
  city: string,
  district: string,
  state: string,
  pincode: string
) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/users/me/location`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        city,
        district,
        state,
        pincode,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update location"
    );
  }

  return data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/users/me/password`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to change password"
    );
  }

  return data;
}

export async function getCurrentUser() {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  const response = await fetch(`${API_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    localStorage.removeItem("token");
    return null;
  }

  const data = await response.json();

  return data.user;
}