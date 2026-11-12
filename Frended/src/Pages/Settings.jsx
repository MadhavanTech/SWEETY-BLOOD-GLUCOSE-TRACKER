
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { usersApi } from "../api";
import {
  ArrowLeft,
  UserRound,
  LockKeyhole,
  Bell,
  Moon,
  Pencil,
  X,
  Eye,
  EyeOff,
  Check,
  Settings as SettingsIcon,
} from "lucide-react";

import dropIcon from "../assets/Glossy_Red_Blood_Drop_Icon (1).png";
import "../css/Settings.css";

const readPreference = (key, fallback) => {
  try {
    const savedValue = window.localStorage.getItem(key);
    return savedValue === null ? fallback : savedValue === "true";
  } catch (error) {
    console.error(`Unable to load ${key} preference.`, error);
    return fallback;
  }
};

const Settings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(() =>
    readPreference("sweety-notifications", true)
  );
  const [darkMode, setDarkMode] = useState(() =>
    readPreference("sweety-dark-mode", false)
  );
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [user]);

  useEffect(() => {
    if (!showProfileModal && !showPasswordModal) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowProfileModal(false);
        setShowPasswordModal(false);
        setMessage("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPasswordModal, showProfileModal]);

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setName(user?.name || "");
    setEmail(user?.email || "");
    setMessage("");
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPasswords(false);
    setMessage("");
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      setMessage("Please enter your name and email address.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await updateUser({ name: name.trim(), email: email.trim() });
      setShowProfileModal(false);
      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      setMessage("Please complete all password fields.");
      return;
    }

    if (passwords.newPassword.length < 8) {
      setMessage("New password must contain at least 8 characters.");
      return;
    }

    if (passwords.newPassword.length > 72) {
      setMessage("New password must contain no more than 72 characters.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await usersApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordModal(false);
      setShowPasswords(false);
      setMessage("Password updated successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const initials = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase();

  const savePreference = (key, value, setValue) => {
    try {
      window.localStorage.setItem(key, String(value));
      setValue(value);
      setMessage("");
      if (key === "sweety-dark-mode") {
        window.dispatchEvent(new Event("sweety-preferences-change"));
      }
    } catch (error) {
      console.error(`Unable to save ${key} preference.`, error);
      setMessage("Your preference could not be saved. Please try again.");
    }
  };

  return (
    <div className="settings-page">

      {/* Header */}

      <header className="settings-header">
        <button
          type="button"
          className="settings-back"
          aria-label="Back to dashboard"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={21} />
        </button>

        <div className="settings-brand">
          <img className="settings-brand-logo" src={dropIcon} alt="" />
          <span>Sweety</span>
        </div>

        <div className="settings-header-spacer" />
      </header>

      {/* Main Content */}

      <main className="settings-container">

        <div className="settings-title">
          <SettingsIcon size={22} />
          <h1>Settings</h1>
        </div>

        {/* Profile Information */}

        <section className="settings-section">

          <h2>Profile Information</h2>

          <div className="settings-profile">

            <div className="settings-avatar">
              {initials}
            </div>

            <div className="settings-profile-details">
              <h3>{user?.name || "Your Name"}</h3>
              <p>{user?.email || "your@email.com"}</p>
            </div>

            <button
              className="settings-edit-btn"
              onClick={() => {
                setName(user?.name || "");
                setEmail(user?.email || "");
                setMessage("");
                setShowProfileModal(true);
              }}
            >
              <Pencil size={14} />
              Edit
            </button>

          </div>

        </section>

        {/* Change Password */}

        <section className="settings-section">

          <div className="settings-option">

            <div className="settings-option-left">
              <div className="settings-option-icon">
                <LockKeyhole size={19} />
              </div>

              <span>Change Password</span>
            </div>

            <button
              className="settings-action-btn"
              onClick={() => {
                setPasswords({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
                setShowPasswords(false);
                setMessage("");
                setShowPasswordModal(true);
              }}
            >
              Update Password
            </button>

          </div>

        </section>

        {/* Notification Preferences */}

        <section className="settings-section">

          <div className="settings-option">

            <div className="settings-option-left">
              <div className="settings-option-icon">
                <Bell size={19} />
              </div>

              <span>Notification Preferences</span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={notifications}
              aria-label="Notification preferences"
              className={`settings-toggle ${
                notifications ? "active" : ""
              }`}
              onClick={() => savePreference(
                "sweety-notifications",
                !notifications,
                setNotifications,
              )}
            >
              <span />
            </button>

          </div>

        </section>

        {/* App Preferences */}

        <section className="settings-section">

          <h2>App Preferences</h2>

          <div className="settings-option">

            <div className="settings-option-left">
              <div className="settings-option-icon">
                <Moon size={19} />
              </div>

              <span>Dark Mode</span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={darkMode}
              aria-label="Dark mode"
              className={`settings-toggle ${
                darkMode ? "active" : ""
              }`}
              onClick={() => savePreference(
                "sweety-dark-mode",
                !darkMode,
                setDarkMode,
              )}
            >
              <span />
            </button>

          </div>

        </section>

        {message && (
          <p className="settings-message" role="status">
            {message}
          </p>
        )}

      </main>

      {/* Edit Profile Modal */}

      {showProfileModal && (
        <div
          className="settings-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeProfileModal();
          }}
        >
          <div
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit_profile_title"
          >

            <button
              type="button"
              className="settings-modal-close"
              aria-label="Close edit profile dialog"
              onClick={closeProfileModal}
            >
              <X size={20} />
            </button>

            <div className="settings-modal-icon">
              <UserRound size={23} />
            </div>

            <h2 id="edit_profile_title">Edit Profile</h2>
            <p>Update your personal information.</p>

            <form onSubmit={handleProfileUpdate}>
              <label htmlFor="settings-profile-name">Full Name</label>
              <input
                id="settings-profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={100}
                required
              />

              <label htmlFor="settings-profile-email">Email Address</label>
              <input
                id="settings-profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />

              {message && <p className="settings-error" role="alert">{message}</p>}

              <button
                type="submit"
                className="settings-primary-btn"
                disabled={loading || !name.trim() || !email.trim()}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                className="settings-cancel-btn"
                onClick={closeProfileModal}
              >
                Cancel
              </button>

            </form>

          </div>
        </div>
      )}

      {/* Change Password Modal */}

      {showPasswordModal && (
        <div
          className="settings-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePasswordModal();
          }}
        >
          <div
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change_password_title"
          >

            <button
              type="button"
              className="settings-modal-close"
              aria-label="Close change password dialog"
              onClick={closePasswordModal}
            >
              <X size={20} />
            </button>

            <div className="settings-modal-icon">
              <LockKeyhole size={23} />
            </div>

            <h2 id="change_password_title">Change Password</h2>
            <p>Keep your account secure.</p>

            <form onSubmit={handlePasswordUpdate}>
              {[
                ["currentPassword", "Current Password"],
                ["newPassword", "New Password"],
                ["confirmPassword", "Confirm New Password"],
              ].map(([field, label]) => (
                <React.Fragment key={field}>
                  <label htmlFor={`settings-${field}`}>{label}</label>

                  <div className="settings-password-field">
                    <input
                      id={`settings-${field}`}
                      type={showPasswords ? "text" : "password"}
                      value={passwords[field]}
                      minLength={field === "currentPassword" ? undefined : 8}
                      maxLength={72}
                      onChange={(e) =>
                        setPasswords({
                          ...passwords,
                          [field]: e.target.value,
                        })
                      }
                      placeholder={label}
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      aria-label={showPasswords ? "Hide password" : "Show password"}
                      aria-pressed={showPasswords}
                    >
                      {showPasswords ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </React.Fragment>
              ))}

              {message && <p className="settings-error" role="alert">{message}</p>}

              <button
                type="submit"
                className="settings-primary-btn"
                disabled={loading || !passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>

              <button
                type="button"
                className="settings-cancel-btn"
                onClick={closePasswordModal}
              >
                Cancel
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
