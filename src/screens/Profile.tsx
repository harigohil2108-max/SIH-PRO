import { useEffect, useState } from "react";

import {
  getCurrentUser,
  updateProfile,
  updateLocation,
  changePassword,
} from "./services/authService";

type ProfileUser = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: "CITIZEN" | "OFFICER" | "ADMIN";
  officialId?: string;
  department?: {
    _id?: string;
    name?: string;
    code?: string;
  } | string | null;
  designation?: string;
  preferredLanguage?: string;
  location?: {
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
};

function getRoleLabel(role: ProfileUser["role"]) {
  switch (role) {
    case "OFFICER":
      return "Officer";
    case "ADMIN":
      return "Administrator";
    default:
      return "Citizen";
  }
}

function getInitials(name: string) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function getDepartmentName(
  department: ProfileUser["department"]
) {
  if (!department) return "Not assigned";

  if (typeof department === "object") {
    return (
      department.name ||
      department.code ||
      "Not assigned"
    );
  }

  return department;
}

export default function Profile() {
  const [user, setUser] =
    useState<ProfileUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editProfileOpen, setEditProfileOpen] =
    useState(false);

  const [editLocationOpen, setEditLocationOpen] =
    useState(false);

  const [changePasswordOpen, setChangePasswordOpen] =
    useState(false);

  const [saving, setSaving] = useState(false);

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredLanguage, setPreferredLanguage] =
    useState("en");

  // Location form
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const currentUser = await getCurrentUser();

      if (!currentUser) {
        setError("Unable to load your profile.");
        return;
      }

      setUser(currentUser);

      setName(currentUser.name || "");
      setPhone(currentUser.phone || "");
      setPreferredLanguage(
        currentUser.preferredLanguage || "en"
      );

      setCity(currentUser.location?.city || "");
      setDistrict(
        currentUser.location?.district || ""
      );
      setState(currentUser.location?.state || "");
      setPincode(
        currentUser.location?.pincode || ""
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const data = await updateProfile(
        name,
        phone,
        preferredLanguage
      );

      setUser(data.user);

      setEditProfileOpen(false);

      setSuccess(
        "Profile updated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLocation = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const data = await updateLocation(
        city,
        district,
        state,
        pincode
      );

      setUser(data.user);

      setEditLocationOpen(false);

      setSuccess(
        "Location updated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update location."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError(
        "New password and confirm password do not match."
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "New password must be at least 6 characters long."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await changePassword(
        currentPassword,
        newPassword
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setChangePasswordOpen(false);

      setSuccess(
        "Password changed successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to change password."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-slate-500">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Unable to load profile
          </h2>

          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            {error || "Profile information is unavailable."}
          </p>
        </div>
      </div>
    );
  }

  const roleLabel = getRoleLabel(user.role);
  const departmentName = getDepartmentName(
    user.department
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Profile
        </h1>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your Nivara account information.
        </p>
      </div>

      {/* Messages */}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Profile header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-[#0f2b4e] text-white flex items-center justify-center text-2xl font-bold">
              {getInitials(user.name)}
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user.name}
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {roleLabel}
              </p>

              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setName(user.name || "");
              setPhone(user.phone || "");
              setPreferredLanguage(
                user.preferredLanguage || "en"
              );
              setEditProfileOpen(true);
              setError("");
            }}
            className="px-4 py-2 bg-[#0f2b4e] hover:bg-[#163b66] text-white rounded-lg text-sm font-medium"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Personal information */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">

        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Personal Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6">

          <InfoItem
            label="Full Name"
            value={user.name}
          />

          <InfoItem
            label="Email"
            value={user.email}
          />

          <InfoItem
            label="Phone"
            value={user.phone || "Not provided"}
          />

          <InfoItem
  label="Preferred Language"
  value={
    user.preferredLanguage === "hi"
      ? "Hindi"
      : user.preferredLanguage === "mr"
      ? "Marathi"
      : user.preferredLanguage === "en"
      ? "English"
      : user.preferredLanguage || "Not specified"
  }
/>

        </div>
      </section>

      {/* Account */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">

        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Account Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6">

          <InfoItem
            label="Account Role"
            value={roleLabel}
          />

          {user.role !== "CITIZEN" && (
            <InfoItem
              label="Government ID"
              value={
                user.officialId ||
                "Not provided"
              }
            />
          )}

          {user.role === "OFFICER" && (
            <>
              <InfoItem
                label="Department"
                value={departmentName}
              />

              <InfoItem
                label="Designation"
                value={
                  user.designation ||
                  "Not specified"
                }
              />
            </>
          )}

        </div>
      </section>

      {/* Location */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">

        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">

          <h3 className="font-semibold text-slate-900 dark:text-white">
            Location
          </h3>

          <button
            type="button"
            onClick={() => {
              setCity(
                user.location?.city || ""
              );
              setDistrict(
                user.location?.district || ""
              );
              setState(
                user.location?.state || ""
              );
              setPincode(
                user.location?.pincode || ""
              );

              setEditLocationOpen(true);
              setError("");
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {user.location?.city ||
            user.location?.district ||
            user.location?.state ||
            user.location?.pincode
              ? "Edit Location"
              : "Add Location"}
          </button>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6">

          <InfoItem
            label="City"
            value={
              user.location?.city ||
              "Not provided"
            }
          />

          <InfoItem
            label="District"
            value={
              user.location?.district ||
              "Not provided"
            }
          />

          <InfoItem
            label="State"
            value={
              user.location?.state ||
              "Not provided"
            }
          />

          <InfoItem
            label="Pincode"
            value={
              user.location?.pincode ||
              "Not provided"
            }
          />

        </div>
      </section>

      {/* Security */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">

        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Security
          </h3>
        </div>

        <div className="p-6 flex items-center justify-between gap-4">

          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Password
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Keep your account secure by using a strong password.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
              setChangePasswordOpen(true);
              setError("");
            }}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Change Password
          </button>

        </div>
      </section>

      {/* Edit Profile Modal */}
      {editProfileOpen && (
        <Modal
          title="Edit Profile"
          onClose={() =>
            setEditProfileOpen(false)
          }
        >
          <div className="space-y-4">

            <Input
              label="Full Name"
              value={name}
              onChange={setName}
            />

            <Input
              label="Phone"
              value={phone}
              onChange={setPhone}
              type="tel"
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Preferred Language
              </label>

              <select
                value={preferredLanguage}
                onChange={(e) =>
                  setPreferredLanguage(
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="en">
                  English
                </option>

                <option value="hi">
                  Hindi
                </option>

                <option value="mr">
                  Marathi
                </option>
              </select>
            </div>

            <ModalButtons
              onCancel={() =>
                setEditProfileOpen(false)
              }
              onSave={handleUpdateProfile}
              saving={saving}
            />

          </div>
        </Modal>
      )}

      {/* Location Modal */}
      {editLocationOpen && (
        <Modal
          title={
            user.location?.city ||
            user.location?.district ||
            user.location?.state ||
            user.location?.pincode
              ? "Edit Location"
              : "Add Location"
          }
          onClose={() =>
            setEditLocationOpen(false)
          }
        >
          <div className="space-y-4">

            <Input
              label="City"
              value={city}
              onChange={setCity}
            />

            <Input
              label="District"
              value={district}
              onChange={setDistrict}
            />

            <Input
              label="State"
              value={state}
              onChange={setState}
            />

            <Input
              label="Pincode"
              value={pincode}
              onChange={setPincode}
              type="text"
            />

            <ModalButtons
              onCancel={() =>
                setEditLocationOpen(false)
              }
              onSave={handleUpdateLocation}
              saving={saving}
            />

          </div>
        </Modal>
      )}

      {/* Password Modal */}
      {changePasswordOpen && (
        <Modal
          title="Change Password"
          onClose={() =>
            setChangePasswordOpen(false)
          }
        >
          <div className="space-y-4">

            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={setCurrentPassword}
            />

            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />

            <ModalButtons
              onCancel={() =>
                setChangePasswordOpen(false)
              }
              onSave={handleChangePassword}
              saving={saving}
              saveText="Change Password"
            />

          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Reusable UI
───────────────────────────────────────────── */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
        {label}
      </p>

      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
        {value}
      </p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-400"
      />
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">

        <div className="flex items-center justify-between mb-5">

          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl"
          >
            ×
          </button>

        </div>

        {children}
      </div>
    </div>
  );
}

function ModalButtons({
  onCancel,
  onSave,
  saving,
  saveText = "Save Changes",
}: {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  saveText?: string;
}) {
  return (
    <div className="flex justify-end gap-3 pt-3">

      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="px-4 py-2 bg-[#0f2b4e] hover:bg-[#163b66] text-white rounded-lg text-sm font-medium disabled:opacity-60"
      >
        {saving ? "Saving..." : saveText}
      </button>

    </div>
  );
}