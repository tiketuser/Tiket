"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import AdminProtection from "../../components/AdminProtection/AdminProtection";
import MobileAdminChrome from "../../components/mobile/MobileAdminChrome";
import NavBar from "../../components/NavBar/NavBar";
import { apiFetch } from "@/lib/platform";

interface Signup {
  id: string;
  email: string;
  phone: string;
  createdAt: string | null;
}

async function getIdToken(): Promise<string | null> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function downloadCsv(signups: Signup[]) {
  const rows = [
    ["email", "phone", "createdAt"],
    ...signups.map((s) => [s.email, s.phone, s.createdAt ?? ""]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "early-access-signups.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function EarlyAccessAdminPage() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchSignups = async () => {
      setLoading(true);
      try {
        const token = await getIdToken();
        if (!token) throw new Error("Not authenticated");
        const res = await apiFetch("/api/early-access", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch signups");
        setSignups(data.signups);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchSignups();
  }, []);

  const filtered = signups.filter(
    (s) =>
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
  );

  return (
    <AdminProtection>
      <MobileAdminChrome title="הרשמות מוקדמות" />
      <div className="hidden md:block">
        <NavBar />
      </div>
      <div className="tk-admin min-h-screen bg-white py-12 px-4" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-heading-2-desktop md:text-heading-1-desktop font-bold text-primary mb-2">
              הרשמות לגישה מוקדמת
            </h1>
            <p className="text-text-large text-mutedText">
              כל מי שהשאיר אימייל וטלפון בעמוד ההרשמה המוקדמת ({signups.length} סה&quot;כ)
            </p>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="חיפוש לפי אימייל או טלפון..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 border border-secondary rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
            <button
              onClick={() => downloadCsv(filtered)}
              disabled={filtered.length === 0}
              className="px-6 py-3 bg-secondary text-primary rounded-xl hover:bg-highlight hover:text-white transition-colors font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ייצוא ל-CSV
            </button>
          </div>

          {error && (
            <div className="mb-6 px-5 py-3 rounded-xl text-center font-semibold text-sm bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-mutedText">טוען רשומות...</div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-20 text-mutedText">אין רשומות תואמות</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4 bg-white border border-secondary rounded-xl shadow-sm px-5 py-4"
                >
                  <div className="min-w-0 text-right">
                    <div className="font-semibold text-strongText truncate text-sm">
                      {s.email || "—"}
                    </div>
                    <div className="text-mutedText text-xs" dir="ltr">
                      {s.phone || "—"}
                    </div>
                  </div>
                  <div className="text-mutedText text-xs whitespace-nowrap flex-shrink-0">
                    {formatDate(s.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminProtection>
  );
}
