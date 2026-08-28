import { createContext, useContext } from "react";

export type Language = "en" | "hi";

export type TranslationKey =
  | "dashboard"
  | "myGrievances"
  | "submitGrievance"
  | "notifications"
  | "helpSupport"
  | "profile"
  | "settings"
  | "priorityQueue"
  | "myAssignments"
  | "allGrievances"
  | "slaMonitoring"
  | "escalations"
  | "geographicIntel"
  | "analytics"
  | "departments"
  | "officers"
  | "citizens"
  | "complaintClusters"
  | "aiInsights"
  | "slaManagement"
  | "reports"
  | "auditLogs"
  | "overview"
  | "support"
  | "operations"
  | "account"
  | "management"
  | "citizenView"
  | "officerView"
  | "adminView"
  | "searchCitizen"
  | "searchOfficer"
  | "searchAdmin"
  | "signOut"
  | "settingsDescription"
  | "settingsSaved"
  | "notificationsTitle"
  | "notificationsDescription"
  | "grievanceUpdates"
  | "grievanceUpdatesDescription"
  | "smsNotifications"
  | "smsNotificationsDescription"
  | "languageTitle"
  | "languageDescription"
  | "preferredLanguage"
  | "appearance"
  | "appearanceDescription"
  | "colorTheme"
  | "colorThemeDescription"
  | "systemDefault"
  | "light"
  | "dark"
  | "fontSize"
  | "security"
  | "securityDescription"
  | "changePassword"
  | "cancel"
  | "currentPassword"
  | "newPassword"
  | "confirmNewPassword"
  | "updatePassword"
  | "updating"
  | "saveChanges"
  | "newPasswordsDoNotMatch"
  | "passwordChanged"
  | "passwordSaveError"
  | "failedToSaveSettings";

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    dashboard: "Dashboard", myGrievances: "My Grievances", submitGrievance: "Submit Grievance", notifications: "Notifications", helpSupport: "Help & Support", profile: "Profile", settings: "Settings", priorityQueue: "Priority Queue", myAssignments: "My Assignments", allGrievances: "All Grievances", slaMonitoring: "SLA Monitoring", escalations: "Escalations", geographicIntel: "Geographic Intel.", analytics: "Analytics", departments: "Departments", officers: "Officers", citizens: "Citizens", complaintClusters: "Complaint Clusters", aiInsights: "AI Insights", slaManagement: "SLA Management", reports: "Reports", auditLogs: "Audit Logs", overview: "OVERVIEW", support: "SUPPORT", operations: "OPERATIONS", account: "ACCOUNT", management: "MANAGEMENT", citizenView: "Citizen View", officerView: "Officer View", adminView: "Admin View", searchCitizen: "Search grievances, tracking IDs...", searchOfficer: "Search grievances, departments, IDs...", searchAdmin: "Search departments, audit logs, IDs...", signOut: "Sign out", settingsDescription: "Manage your Nivara preferences and account settings.", settingsSaved: "Settings saved successfully.", notificationsTitle: "Notifications", notificationsDescription: "Choose how Nivara keeps you informed.", grievanceUpdates: "Grievance updates", grievanceUpdatesDescription: "Receive updates when your grievance status changes.", smsNotifications: "SMS notifications", smsNotificationsDescription: "Receive important alerts through SMS.", languageTitle: "Language", languageDescription: "Select your preferred language.", preferredLanguage: "Preferred language", appearance: "Appearance", appearanceDescription: "Customize how Nivara looks.", colorTheme: "Color theme", colorThemeDescription: "Use the browser preference or choose a fixed theme.", systemDefault: "System default", light: "Light", dark: "Dark", fontSize: "Font size", security: "Security", securityDescription: "Manage your account security.", changePassword: "Change Password", cancel: "Cancel", currentPassword: "Current password", newPassword: "New password", confirmNewPassword: "Confirm new password", updatePassword: "Update Password", updating: "Updating...", saveChanges: "Save Changes", newPasswordsDoNotMatch: "New passwords do not match.", passwordChanged: "Password changed successfully.", passwordSaveError: "Failed to change password", failedToSaveSettings: "Failed to save settings",
  },
  hi: {
    dashboard: "डैशबोर्ड", myGrievances: "मेरी शिकायतें", submitGrievance: "शिकायत दर्ज करें", notifications: "सूचनाएं", helpSupport: "सहायता और समर्थन", profile: "प्रोफ़ाइल", settings: "सेटिंग्स", priorityQueue: "प्राथमिकता सूची", myAssignments: "मेरे कार्य", allGrievances: "सभी शिकायतें", slaMonitoring: "SLA निगरानी", escalations: "एस्केलेशन", geographicIntel: "भौगोलिक जानकारी", analytics: "विश्लेषण", departments: "विभाग", officers: "अधिकारी", citizens: "नागरिक", complaintClusters: "शिकायत समूह", aiInsights: "AI अंतर्दृष्टि", slaManagement: "SLA प्रबंधन", reports: "रिपोर्ट", auditLogs: "ऑडिट लॉग", overview: "अवलोकन", support: "सहायता", operations: "संचालन", account: "खाता", management: "प्रबंधन", citizenView: "नागरिक दृश्य", officerView: "अधिकारी दृश्य", adminView: "प्रशासक दृश्य", searchCitizen: "शिकायत या ट्रैकिंग ID खोजें...", searchOfficer: "शिकायत, विभाग या ID खोजें...", searchAdmin: "विभाग, ऑडिट लॉग या ID खोजें...", signOut: "साइन आउट", settingsDescription: "Nivara की प्राथमिकताएं और खाता सेटिंग्स प्रबंधित करें।", settingsSaved: "सेटिंग्स सफलतापूर्वक सहेजी गईं।", notificationsTitle: "सूचनाएं", notificationsDescription: "चुनें कि Nivara आपको कैसे सूचित करे।", grievanceUpdates: "शिकायत अपडेट", grievanceUpdatesDescription: "शिकायत की स्थिति बदलने पर अपडेट प्राप्त करें।", smsNotifications: "SMS सूचनाएं", smsNotificationsDescription: "SMS के माध्यम से महत्वपूर्ण अलर्ट प्राप्त करें।", languageTitle: "भाषा", languageDescription: "अपनी पसंदीदा भाषा चुनें।", preferredLanguage: "पसंदीदा भाषा", appearance: "दिखावट", appearanceDescription: "Nivara का रूप अनुकूलित करें।", colorTheme: "रंग थीम", colorThemeDescription: "ब्राउज़र की पसंद का उपयोग करें या स्थिर थीम चुनें।", systemDefault: "सिस्टम डिफ़ॉल्ट", light: "हल्का", dark: "गहरा", fontSize: "फ़ॉन्ट आकार", security: "सुरक्षा", securityDescription: "अपने खाते की सुरक्षा प्रबंधित करें।", changePassword: "पासवर्ड बदलें", cancel: "रद्द करें", currentPassword: "वर्तमान पासवर्ड", newPassword: "नया पासवर्ड", confirmNewPassword: "नए पासवर्ड की पुष्टि करें", updatePassword: "पासवर्ड अपडेट करें", updating: "अपडेट हो रहा है...", saveChanges: "बदलाव सहेजें", newPasswordsDoNotMatch: "नए पासवर्ड मेल नहीं खाते।", passwordChanged: "पासवर्ड सफलतापूर्वक बदला गया।", passwordSaveError: "पासवर्ड बदलना विफल रहा", failedToSaveSettings: "सेटिंग्स सहेजना विफल रहा",
  },
};

export const LanguageContext = createContext<Language>("en");

export function useTranslation() {
  const language = useContext(LanguageContext);
  return (key: TranslationKey) => translations[language][key];
}

export function toLanguage(value: string): Language {
  return value === "Hindi" || value === "hi" ? "hi" : "en";
}
