import { useEffect, useState } from "react";
import { changePassword, updateProfile } from "./services/authService";

type Language = "en" | "hi";
type TranslationKey = string;

const translations: Record<Language, Record<string, string>> = {
  en: {
    settings: "Settings",
    settingsDescription: "Manage your Nivara preferences and account settings.",
    settingsSaved: "Settings saved successfully.",
    notificationsTitle: "Notifications",
    notificationsDescription: "Choose how Nivara keeps you informed.",
    grievanceUpdates: "Grievance updates",
    grievanceUpdatesDescription: "Receive updates when your grievance status changes.",
    smsNotifications: "SMS notifications",
    smsNotificationsDescription: "Receive important alerts through SMS.",
    languageTitle: "Language",
    languageDescription: "Select your preferred language.",
    preferredLanguage: "Preferred language",
    appearance: "Appearance",
    appearanceDescription: "Customize how Nivara looks.",
    colorTheme: "Color theme",
    colorThemeDescription: "Use the browser preference or choose a fixed theme.",
    systemDefault: "System default",
    light: "Light",
    dark: "Dark",
    fontSize: "Font size",
    security: "Security",
    securityDescription: "Manage your account security.",
    cancel: "Cancel",
    changePassword: "Change Password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmNewPassword: "Confirm new password",
    updating: "Updating...",
    updatePassword: "Update Password",
    saveChanges: "Save Changes",
  },
  hi: {
    settings: "सेटिंग्स",
    settingsDescription: "अपनी निवारा प्राथमिकताएं और खाता सेटिंग्स प्रबंधित करें।",
    settingsSaved: "सेटिंग्स सफलतापूर्वक सहेजी गईं।",
    notificationsTitle: "सूचनाएं",
    notificationsDescription: "चुनें कि निवारा आपको कैसे सूचित करे।",
    grievanceUpdates: "शिकायत अपडेट",
    grievanceUpdatesDescription: "शिकायत की स्थिति बदलने पर अपडेट प्राप्त करें।",
    smsNotifications: "एसएमएस सूचनाएं",
    smsNotificationsDescription: "एसएमएस के माध्यम से महत्वपूर्ण अलर्ट प्राप्त करें।",
    languageTitle: "भाषा",
    languageDescription: "अपनी पसंदीदा भाषा चुनें।",
    preferredLanguage: "पसंदीदा भाषा",
    appearance: "दिखावट",
    appearanceDescription: "निवारा का रूप बदलें।",
    colorTheme: "रंग थीम",
    colorThemeDescription: "ब्राउज़र प्राथमिकता का उपयोग करें या थीम चुनें।",
    systemDefault: "सिस्टम डिफ़ॉल्ट",
    light: "लाइट",
    dark: "डार्क",
    fontSize: "फ़ॉन्ट आकार",
    security: "सुरक्षा",
    securityDescription: "अपने खाते की सुरक्षा प्रबंधित करें।",
    cancel: "रद्द करें",
    changePassword: "पासवर्ड बदलें",
    currentPassword: "वर्तमान पासवर्ड",
    newPassword: "नया पासवर्ड",
    confirmNewPassword: "नए पासवर्ड की पुष्टि करें",
    updating: "अपडेट हो रहा है...",
    updatePassword: "पासवर्ड अपडेट करें",
    saveChanges: "बदलाव सहेजें",
  },
};

function toLanguage(value: string): Language {
  return value === "hi" || value === "Hindi" ? "hi" : "en";
}

function useTranslation(language: Language = "en") {
  return (key: TranslationKey) => translations[language][key] || translations.en[key] || key;
}

type Theme = "system" | "light" | "dark";

type SavedSettings = {
  notifications: boolean;
  smsNotifications: boolean;
  language: string;
  fontSize: string;
  theme: Theme;
};

const defaultSettings: SavedSettings = {
  notifications: true,
  smsNotifications: false,
  language: "English",
  fontSize: "Medium",
  theme: "system",
};

const languageCodes: Record<string, string> = {
  English: "en",
  Hindi: "hi",
};

function loadSettings(): SavedSettings {
  try {
    const saved = localStorage.getItem("nivara-settings");

    if (saved) {
      const parsed = { ...defaultSettings, ...JSON.parse(saved) };

      return {
        ...parsed,
        language: parsed.language === "Hindi" ? "Hindi" : "English",
      };
    }
  } catch {
    // Use defaults when saved settings are unavailable or invalid.
  }

  return defaultSettings;
}

export default function Settings({
  theme,
  onThemeChange,
  userName,
  userPhone,
  language: globalLanguage,
  onLanguageChange,
  onFontSizeChange,
}: {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  userName: string;
  userPhone?: string;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onFontSizeChange?: (fontSize: "Small" | "Medium" | "Large") => void;
}) {
  const t = useTranslation(globalLanguage);
  const [settings] = useState(loadSettings);
  const [notifications, setNotifications] = useState(settings.notifications);
  const [smsNotifications, setSmsNotifications] = useState(settings.smsNotifications);
  const [language, setLanguage] = useState(settings.language);
  const [fontSize, setFontSize] = useState(settings.fontSize);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    document.documentElement.lang = languageCodes[language] || "en";
  }, [language, fontSize]);

  const handleLanguageChange = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    onLanguageChange(toLanguage(nextLanguage));
    const nextSettings = {
      ...loadSettings(),
      language: nextLanguage,
    };

    localStorage.setItem("nivara-settings", JSON.stringify(nextSettings));

    updateProfile(userName, userPhone ?? "", languageCodes[nextLanguage] || "en")
      .then(() => {
        setError("");
        setSuccess(true);
      })
      .catch((saveError) => {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Language preference saved locally"
        );
      });
  };

  const handleSave = async () => {
    const nextSettings = {
      notifications,
      smsNotifications,
      language,
      fontSize,
      theme,
    };

    localStorage.setItem("nivara-settings", JSON.stringify(nextSettings));

    try {
      await updateProfile(userName, userPhone ?? "", languageCodes[language] || "en");
      setError("");
      setSuccess(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save settings");
    }

    setTimeout(() => {
      setSuccess(false);
    }, 2500);
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);

    try {
      const result = await changePassword(currentPassword, newPassword);
      setPasswordMessage(result.message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (passwordChangeError) {
      setPasswordError(
        passwordChangeError instanceof Error
          ? passwordChangeError.message
          : "Failed to change password"
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-[760px] mx-auto p-6 space-y-3">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          {t("settings")}
        </h1>

        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
          {t("settingsDescription")}
        </p>
      </div>

      {/* Success message */}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          {t("settingsSaved")}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Notifications */}
      <section className="bg-white dark:bg-[#111b32] border border-slate-200 dark:border-slate-700 rounded-lg">

        <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {t("notificationsTitle")}
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            {t("notificationsDescription")}
          </p>
        </div>

        <div className="p-3 space-y-4">

          <SettingToggle
            title={t("grievanceUpdates")}
            description={t("grievanceUpdatesDescription")}
            enabled={notifications}
            onChange={setNotifications}
          />

          <SettingToggle
            title={t("smsNotifications")}
            description={t("smsNotificationsDescription")}
            enabled={smsNotifications}
            onChange={setSmsNotifications}
          />

        </div>
      </section>

      {/* Language */}
      <section className="bg-white dark:bg-[#111b32] border border-slate-200 dark:border-slate-700 rounded-lg">

        <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {t("languageTitle")}
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            {t("languageDescription")}
          </p>
        </div>

        <div className="p-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t("preferredLanguage")}
          </label>

          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full max-w-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-blue-400"
          >
            <option>English</option>
            <option>Hindi</option>
          </select>
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-white dark:bg-[#111b32] border border-slate-200 dark:border-slate-700 rounded-lg">

        <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {t("appearance")}
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            {t("appearanceDescription")}
          </p>
        </div>

        <div className="p-3 space-y-4">

          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {t("colorTheme")}
            </p>

            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {t("colorThemeDescription")}
            </p>

            <select
              value={theme}
              onChange={(event) => onThemeChange(event.target.value as Theme)}
              className="mt-3 w-full max-w-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-blue-400"
            >
              <option value="system">{t("systemDefault")}</option>
              <option value="light">{t("light")}</option>
              <option value="dark">{t("dark")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t("fontSize")}
            </label>

            <select
              value={fontSize}
              onChange={(e) => {
                setFontSize(e.target.value);
                onFontSizeChange?.(e.target.value as "Small" | "Medium" | "Large");
              }}
              className="w-full max-w-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-blue-400"
            >
              <option>Small</option>
              <option>Medium</option>
              <option>Large</option>
            </select>
          </div>

        </div>
      </section>

      {/* Security */}
      <section className="bg-white dark:bg-[#111b32] border border-slate-200 dark:border-slate-700 rounded-lg">

        <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {t("security")}
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            {t("securityDescription")}
          </p>
        </div>

        <div className="p-3">

          <button
            type="button"
            onClick={() => {
              setPasswordOpen((open) => !open);
              setPasswordError("");
              setPasswordMessage("");
            }}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {passwordOpen ? t("cancel") : t("changePassword")}
          </button>

          {passwordOpen && (
            <div className="mt-5 max-w-sm space-y-3">
              <input
                type="password"
                placeholder={t("currentPassword")}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-blue-400"
              />
              <input
                type="password"
                placeholder={t("newPassword")}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-blue-400"
              />
              <input
                type="password"
                placeholder={t("confirmNewPassword")}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-blue-400"
              />
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              {passwordMessage && <p className="text-sm text-green-600">{passwordMessage}</p>}
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={savingPassword}
                className="px-4 py-2 bg-[#0f2b4e] hover:bg-[#163b66] disabled:opacity-60 text-white rounded-lg text-sm font-medium"
              >
                {savingPassword ? t("updating") : t("updatePassword")}
              </button>
            </div>
          )}

        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end pb-6">
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2.5 bg-[#0f2b4e] hover:bg-[#163b66] text-white rounded-lg text-sm font-medium"
        >
          {t("saveChanges")}
        </button>
      </div>

    </div>
  );
}

function SettingToggle({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6">

      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {title}
        </p>

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative w-[52px] h-7 rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${
          enabled
            ? "bg-[#2563EB]"
            : "bg-slate-300 dark:bg-slate-600"
        }`}
      >
        <span
          className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-[0_1px_3px_rgba(15,23,42,0.3)] transition-transform duration-200 ease-in-out ${
            enabled ? "translate-x-7" : "translate-x-0"
          }`}
        />
      </button>

    </div>
  );
}