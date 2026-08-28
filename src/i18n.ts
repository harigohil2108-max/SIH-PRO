export type Language = "en" | "hi";

type TranslationKey =
  | "settings"
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
  | "cancel"
  | "changePassword"
  | "currentPassword"
  | "newPassword"
  | "confirmNewPassword"
  | "updating"
  | "updatePassword"
  | "saveChanges";

const messages: Record<Language, Record<TranslationKey, string>> = {
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
  hi: {} as Record<TranslationKey, string>,
};

messages.hi = { ...messages.en };

export function toLanguage(value: string): Language {
  return value === "hi" || value === "Hindi" ? "hi" : "en";
}

export function useTranslation(language: Language = "en") {
  return (key: TranslationKey) => messages[language][key] || messages.en[key];
}

const hindiText: Record<string, string> = {
  Dashboard: "डैशबोर्ड",
  OVERVIEW: "अवलोकन",
  SUPPORT: "समर्थन",
  ACCOUNT: "खाता",
  OPERATIONS: "संचालन",
  MANAGEMENT: "प्रबंधन",
  Citizen: "नागरिक",
  "Grievance Officer": "शिकायत अधिकारी",
  Administrator: "व्यवस्थापक",
  "Official Gov Portal": "आधिकारिक सरकारी पोर्टल",
  "Secure SSL": "सुरक्षित SSL",
  "Citizen View": "नागरिक दृश्य",
  "Officer View": "अधिकारी दृश्य",
  "Admin View": "व्यवस्थापक दृश्य",
  "My Grievances": "मेरी शिकायतें",
  "Submit Grievance": "शिकायत दर्ज करें",
  "Submit New Grievance": "नई शिकायत दर्ज करें",
  "Priority Queue": "प्राथमिकता कतार",
  "My Assignments": "मेरे कार्य",
  "All Grievances": "सभी शिकायतें",
  "SLA Monitoring": "SLA निगरानी",
  Escalations: "वृद्धि मामले",
  // "Geographic Intel.": "भौगोलिक जानकारी",
  Notifications: "सूचनाएं",
  "Help & Support": "सहायता और समर्थन",
  Profile: "प्रोफ़ाइल",
  Settings: "सेटिंग्स",
  "Search grievances, tracking IDs...": "शिकायतें और ट्रैकिंग आईडी खोजें...",
  "Search grievances, departments, IDs...": "शिकायतें, विभाग और आईडी खोजें...",
  "Search departments, audit logs, IDs...": "विभाग, ऑडिट लॉग और आईडी खोजें...",
  "Help & Feedback": "सहायता और प्रतिक्रिया",
  "Frequently Asked Questions": "अक्सर पूछे जाने वाले प्रश्न",
  "Nivara AI Assistant": "निवारा AI सहायक",
  "Describe Your Issue": "अपनी समस्या बताएं",
  "Type Complaint": "शिकायत लिखें",
  "Voice Input": "आवाज़ से लिखें",
  "AI Analysis": "AI विश्लेषण",
  "Analyze with AI": "AI से विश्लेषण करें",
  "ON REQUEST": "अनुरोध पर",
  "Location": "स्थान",
  Evidence: "साक्ष्य",
  Review: "समीक्षा",
  Submitted: "दर्ज हो गया",
  Cancel: "रद्द करें",
  "Save Changes": "बदलाव सहेजें",
  "Change Password": "पासवर्ड बदलें",
  "Send": "भेजें",
  "Clear chat": "चैट साफ़ करें",
  "No grievances found.": "कोई शिकायत नहीं मिली।",
};

const englishText = Object.fromEntries(
  Object.entries(hindiText).map(([english, hindi]) => [hindi, english])
);
const originalText = new WeakMap<Text, string>();

function translateTextNode(node: Text, language: Language) {
  const current = node.textContent || "";
  const source = originalText.get(node) || current;
  if (!originalText.has(node)) originalText.set(node, source);

  const dictionary = language === "hi" ? hindiText : englishText;
  const translated = dictionary[source.trim()];
  if (!translated) return;

  const leading = source.match(/^\s*/)?.[0] || "";
  const trailing = source.match(/\s*$/)?.[0] || "";
  const nextText = `${leading}${translated}${trailing}`;
  if (node.textContent !== nextText) node.textContent = nextText;
}

export function translateDocument(language: Language) {
  if (typeof document === "undefined") return () => undefined;

  const translate = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest("script, style")) continue;
      translateTextNode(node as Text, language);
    }

    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea").forEach((element) => {
      const source = element.dataset.i18nPlaceholder || element.placeholder;
      if (!element.dataset.i18nPlaceholder) element.dataset.i18nPlaceholder = source;
      const dictionary = language === "hi" ? hindiText : englishText;
      element.placeholder = dictionary[source] || source;
    });
  };

  translate();
  const observer = new MutationObserver(translate);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
