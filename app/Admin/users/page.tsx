"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import AdminProtection from "../../components/AdminProtection/AdminProtection";
import NavBar from "../../components/NavBar/NavBar";

interface UserRecord {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  disabled: boolean;
  isAdmin: boolean;
  createdAt: string;
  lastSignIn: string;
}

async function getIdToken(): Promise<string | null> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const showMessage = (text: string, ok: boolean) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch users");
      setUsers(data.users);
    } catch (err) {
      showMessage((err as Error).message, false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleAdmin = async (user: UserRecord) => {
    const action = user.isAdmin ? "revoke" : "grant";
    setActionLoading(user.uid);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");

      setUsers((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, isAdmin: action === "grant" } : u))
      );
      showMessage(
        action === "grant"
          ? `${user.email} קיבל הרשאות אדמין`
          : `הרשאות אדמין הוסרו מ-${user.email}`,
        true
      );
    } catch (err) {
      showMessage((err as Error).message, false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetPassword = async (user: UserRecord, password: string) => {
    setPasswordLoading(user.uid);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "set_password", uid: user.uid, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      showMessage(`סיסמה עודכנה עבור ${user.email}`, true);
    } catch (err) {
      showMessage((err as Error).message, false);
    } finally {
      setPasswordLoading(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const admins = filtered.filter((u) => u.isAdmin);
  const regular = filtered.filter((u) => !u.isAdmin);

  return (
    <AdminProtection>
      <NavBar />
      <div className="min-h-screen bg-white py-12 px-4" dir="rtl">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-heading-2-desktop md:text-heading-1-desktop font-bold text-primary mb-2">
              ניהול משתמשים
            </h1>
            <p className="text-text-large text-mutedText mb-4">
              צפייה בכל המשתמשים ומתן / שלילת הרשאות אדמין
            </p>
            <a
              href="/Admin"
              className="inline-block px-6 py-2 bg-secondary text-primary rounded-lg hover:bg-highlight hover:text-white transition-colors font-semibold"
            >
              חזרה לניהול
            </a>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 px-5 py-3 rounded-xl text-center font-semibold text-sm ${
                message.ok
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="חיפוש לפי אימייל או שם..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 border border-secondary rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>

          {loading ? (
            <div className="text-center py-20 text-mutedText">טוען משתמשים...</div>
          ) : (
            <>
              {/* Admin Users */}
              <section className="mb-10">
                <h2 className="text-lg font-bold text-primary mb-4">
                  אדמינים ({admins.length})
                </h2>
                {admins.length === 0 ? (
                  <p className="text-mutedText text-sm">אין אדמינים תואמים לחיפוש</p>
                ) : (
                  <div className="space-y-3">
                    {admins.map((user) => (
                      <UserRow
                        key={user.uid}
                        user={user}
                        onToggle={handleToggleAdmin}
                        onSetPassword={handleSetPassword}
                        loading={actionLoading === user.uid}
                        passwordLoading={passwordLoading === user.uid}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Regular Users */}
              <section>
                <h2 className="text-lg font-bold text-primary mb-4">
                  משתמשים רגילים ({regular.length})
                </h2>
                {regular.length === 0 ? (
                  <p className="text-mutedText text-sm">אין משתמשים תואמים לחיפוש</p>
                ) : (
                  <div className="space-y-3">
                    {regular.map((user) => (
                      <UserRow
                        key={user.uid}
                        user={user}
                        onToggle={handleToggleAdmin}
                        onSetPassword={handleSetPassword}
                        loading={actionLoading === user.uid}
                        passwordLoading={passwordLoading === user.uid}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </AdminProtection>
  );
}

function UserRow({
  user,
  onToggle,
  onSetPassword,
  loading,
  passwordLoading,
}: {
  user: UserRecord;
  onToggle: (user: UserRecord) => void;
  onSetPassword: (user: UserRecord, password: string) => void;
  loading: boolean;
  passwordLoading: boolean;
}) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleSubmitPassword = () => {
    if (newPassword.length < 6) return;
    onSetPassword(user, newPassword);
    setNewPassword("");
    setShowPasswordForm(false);
  };

  return (
    <div className="bg-white border border-secondary rounded-xl shadow-sm overflow-hidden">
      {/* Main row */}
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar */}
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={user.displayName || user.email}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
              {initials}
            </div>
          )}

          {/* Info */}
          <div className="min-w-0">
            <div className="font-semibold text-strongText truncate text-sm">
              {user.displayName || "—"}
            </div>
            <div className="text-mutedText text-xs truncate">{user.email}</div>
            <div className="text-mutedText text-xs mt-0.5">
              נרשם: {formatDate(user.createdAt)} · כניסה אחרונה: {formatDate(user.lastSignIn)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Admin badge */}
          {user.isAdmin && (
            <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
              אדמין
            </span>
          )}

          {/* Password button */}
          <button
            onClick={() => { setShowPasswordForm((v) => !v); setNewPassword(""); }}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-all"
          >
            סיסמה
          </button>

          {/* Toggle admin button */}
          <button
            onClick={() => onToggle(user)}
            disabled={loading}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              user.isAdmin
                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? "..." : user.isAdmin ? "הסר אדמין" : "הפוך לאדמין"}
          </button>
        </div>
      </div>

      {/* Inline password form */}
      {showPasswordForm && (
        <div className="border-t border-secondary bg-gray-50 px-5 py-3 flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="סיסמה חדשה (מינימום 6 תווים)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitPassword()}
              className="w-full px-3 py-2 border border-secondary rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 pr-10"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-mutedText hover:text-strongText text-xs"
            >
              {showPassword ? "הסתר" : "הצג"}
            </button>
          </div>
          <button
            onClick={handleSubmitPassword}
            disabled={newPassword.length < 6 || passwordLoading}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {passwordLoading ? "..." : "עדכן"}
          </button>
          <button
            onClick={() => { setShowPasswordForm(false); setNewPassword(""); }}
            className="px-3 py-2 rounded-lg text-xs font-semibold text-mutedText hover:bg-gray-200 transition-all"
          >
            ביטול
          </button>
        </div>
      )}
    </div>
  );
}
