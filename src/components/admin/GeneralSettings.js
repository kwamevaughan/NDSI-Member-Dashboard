import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import SimpleModal from "../SimpleModal";
import { Icon } from "@iconify/react";

export default function GeneralSettings({ getAdminToken }) {
  const [settings, setSettings] = useState({
    notify_on_approve: true,
    notify_on_reject: true,
    notify_on_delete: true,
    notify_on_registration: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Email templates state
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [editTemplate, setEditTemplate] = useState(null);
  const [editForm, setEditForm] = useState({
    key: "",
    subject: "",
    body_html: "",
    body_text: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const token = getAdminToken
          ? getAdminToken()
          : localStorage.getItem("admin_token");
        const res = await fetch("/api/admin/settings", {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        });
        const data = await res.json();
        if (data.settings) {
          setSettings({
            notify_on_approve: !!data.settings.notify_on_approve,
            notify_on_reject: !!data.settings.notify_on_reject,
            notify_on_delete: !!data.settings.notify_on_delete,
            notify_on_registration: data.settings.notify_on_registration !== undefined 
              ? !!data.settings.notify_on_registration 
              : true,
          });
        }
      } catch (err) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    
    fetchSettings();
  }, []);

  useEffect(() => {
    async function fetchTemplates() {
      setTemplatesLoading(true);
      try {
        const res = await fetch("/api/admin/email-templates");
        const data = await res.json();
        if (data.templates) setTemplates(data.templates);
      } catch (err) {
        toast.error("Failed to load email templates");
      } finally {
        setTemplatesLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const handleToggle = async (field) => {
    setSaving(true);
    try {
      const token = getAdminToken
        ? getAdminToken()
        : localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: !settings[field] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");
      setSettings({
        ...settings,
        [field]: !!data.settings[field],
      });
      toast.success("Settings updated");
    } catch (err) {
      toast.error(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  // Email template editing
  const openEditTemplate = (template) => {
    setEditTemplate(template);
    setEditForm({ ...template });
  };
  const closeEditTemplate = () => {
    setEditTemplate(null);
    setEditForm({ key: "", subject: "", body_html: "", body_text: "" });
  };
  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleSaveTemplate = async () => {
    setEditSaving(true);
    try {
      const token = getAdminToken
        ? getAdminToken()
        : localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update template");
      setTemplates((prev) =>
        prev.map((t) => (t.key === data.template.key ? data.template : t))
      );
      toast.success("Template updated");
      closeEditTemplate();
    } catch (err) {
      toast.error(err.message || "Failed to update template");
    } finally {
      setEditSaving(false);
    }
  };

  const notificationSettings = [
    {
      key: "notify_on_registration",
      label: "New User Registration",
      description: "Send notification when a new user registers",
      icon: "mdi:account-plus",
      color: "text-blue-600",
    },
    {
      key: "notify_on_approve",
      label: "User Approved",
      description: "Send notification when a user account is approved",
      icon: "mdi:check-circle",
      color: "text-green-600",
    },
    {
      key: "notify_on_reject",
      label: "User Rejected",
      description: "Send notification when a user account is rejected",
      icon: "mdi:close-circle",
      color: "text-red-600",
    },
    {
      key: "notify_on_delete",
      label: "User Deleted",
      description: "Send notification when a user account is deleted",
      icon: "mdi:delete-circle",
      color: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen dark:bg-gray-900">
      <div className="space-y-8">
        <div className="mb-4">
          <div className="bg-ndsi-blue-50 border border-ndsi-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Icon
                icon="guidance:settings"
                className="h-8 w-8 text-ndsi-blue mt-0.5 mr-3 flex-shrink-0"
              />
              <div className="text-sm text-ndsi-blue">
                <p className="font-medium mb-1">General Settings</p>
                <p>
                  Configure notification preferences and manage email templates
                  for your application
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-ndsi-blue px-8 py-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <Icon icon="mdi:bell" className="w-6 h-6" />
              Email Notifications
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Control which user actions trigger notification emails
            </p>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-ndsi-blue">
                  <div className="w-6 h-6 border-2 border-ndsi-blue border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading settings...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {notificationSettings.map((setting) => (
                  <div key={setting.key} className="group">
                    <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-md ${setting.color}`}
                        >
                          <Icon icon={setting.icon} className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {setting.label}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {setting.description}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggle(setting.key)}
                        disabled={saving}
                        className={`relative inline-flex items-center h-8 rounded-full w-14 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-ndsi-blue/20 ${
                          settings[setting.key]
                            ? "bg-ndsi-blue shadow-lg"
                            : "bg-gray-300 dark:bg-gray-600"
                        } ${
                          saving
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:shadow-lg"
                        }`}
                      >
                        <span
                          className={`inline-block w-6 h-6 transform bg-white rounded-full shadow-md transition-all duration-300 ${
                            settings[setting.key]
                              ? "translate-x-7"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {saving && (
              <div className="mt-6 flex items-center justify-center gap-3 text-ndsi-blue">
                <div className="w-4 h-4 border-2 border-ndsi-blue border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Saving changes...</span>
              </div>
            )}
          </div>
        </div>

        {/* Email Templates Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-ndsi-green px-8 py-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <Icon icon="mdi:email-edit" className="w-6 h-6" />
              Email Templates
            </h2>
            <p className="text-green-100 text-sm mt-1">
              Customize the content and appearance of notification emails
            </p>
          </div>

          <div className="p-8">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-ndsi-green">
                  <div className="w-6 h-6 border-2 border-ndsi-green border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading templates...</span>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <div key={template.key} className="group">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-ndsi-green flex items-center justify-center shadow-md">
                          <Icon
                            icon="mdi:email"
                            className="w-6 h-6 text-white"
                          />
                        </div>
                        <button
                          onClick={() => openEditTemplate(template)}
                          className="px-4 py-2 bg-ndsi-green text-white rounded-xl hover:bg-ndsi-blue transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          Edit
                        </button>
                      </div>

                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                        {template.key.replace(/_/g, " ")}
                      </h3>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Icon
                            icon="mdi:format-title"
                            className="w-4 h-4 text-gray-500"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {template.subject}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Icon
                            icon="mdi:code-tags"
                            className="w-4 h-4 text-gray-500 mt-0.5"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            {template.body_html
                              .replace(/<[^>]*>/g, "")
                              .slice(0, 100)}
                            ...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Template Modal */}
      <SimpleModal
        isOpen={!!editTemplate}
        onClose={closeEditTemplate}
        title={
          <div className="flex items-center gap-3">
            <Icon icon="mdi:email-edit" className="w-6 h-6 text-ndsi-green" />
            <span>Edit Template: {editTemplate?.key?.replace(/_/g, " ")}</span>
          </div>
        }
        width="max-w-4xl"
      >
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-1">
            <div className="md:col-span-1">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <Icon icon="mdi:format-title" className="w-4 h-4" />
                Subject Line
              </label>
              <input
                type="text"
                name="subject"
                value={editForm.subject}
                onChange={handleEditFormChange}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-ndsi-blue focus:border-ndsi-blue dark:bg-gray-700 dark:text-white transition-all duration-200"
                placeholder="Enter email subject..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <Icon icon="mdi:code-tags" className="w-4 h-4" />
                HTML Body
              </label>
              <textarea
                name="body_html"
                value={editForm.body_html}
                onChange={handleEditFormChange}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-ndsi-blue focus:border-ndsi-blue dark:bg-gray-700 dark:text-white font-mono text-sm transition-all duration-200"
                rows={12}
                placeholder="Enter HTML content..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <Icon icon="mdi:eye" className="w-4 h-4" />
                Live Preview
              </label>
              <div
                className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-800 overflow-auto"
                style={{ height: "300px" }}
              >
                <div dangerouslySetInnerHTML={{ __html: editForm.body_html }} />
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <Icon icon="mdi:text" className="w-4 h-4" />
              Plain Text Body
            </label>
            <textarea
              name="body_text"
              value={editForm.body_text}
              onChange={handleEditFormChange}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-ndsi-blue focus:border-ndsi-blue dark:bg-gray-700 dark:text-white font-mono text-sm transition-all duration-200"
              rows={6}
              placeholder="Enter plain text content..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={closeEditTemplate}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveTemplate}
              disabled={editSaving}
              className="px-8 py-3 bg-ndsi-green hover:bg-ndsi-blue disabled:bg-gray-400 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none font-medium transform hover:scale-105 disabled:transform-none"
            >
              {editSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Icon icon="mdi:content-save" className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
}
