"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import NavBar from "../../components/NavBar/NavBar";
import Footer from "../../components/Footer/Footer";
import AdminProtection from "../../components/AdminProtection/AdminProtection";
import MobileAdminChrome from "../../components/mobile/MobileAdminChrome";
import { apiFetch } from "@/lib/platform";

export const dynamic = "force-dynamic";

interface ProviderStats {
  calls: number;
  verified: number;
  rejected: number;
  notFound: number;
  errors: number;
  avgLatencyMs: number;
  lastUsedAt: string | null;
  lastError: string | null;
}

interface VenueProvider {
  id: string;
  name: string;
  type: "real" | "builtin_demo";
  protocol: "custom" | "tiket_connect";
  connectionMode: "direct" | "agent";
  baseUrl: string;
  verifyEndpoint: string;
  healthEndpoint?: string;
  transferEndpoint?: string;
  httpMethod: "POST" | "GET";
  authType: "bearer" | "header" | "query" | "hmac";
  authHeaderName: string;
  hasPrimaryKey: boolean;
  secondaryCredentialHeaderName?: string;
  hasSecondaryKey: boolean;
  requestBodyTemplate: string;
  responseValidField: string;
  responseValidValue?: string;
  responseConfidenceField?: string;
  responseTicketIdField?: string;
  responseOriginalPriceField?: string;
  responseMatchedFieldsField?: string;
  responseUnmatchedFieldsField?: string;
  barcodePattern?: string;
  timeoutMs: number;
  priority: number;
  enabled: boolean;
  notes?: string;
  stats?: ProviderStats;
  createdAt?: string;
  updatedAt?: string;
}

interface TestResult {
  ok: boolean;
  providerName?: string;
  httpStatus: number | null;
  latencyMs?: number;
  outcome?: string | null;
  healthOk?: boolean;
  kitVersion?: string;
  transferSupported?: boolean;
  connectionMode?: "direct" | "agent";
  agentOnline?: boolean;
  agentVersion?: string;
  agentLookupMode?: string;
  agentLastSeenAt?: string | null;
  error?: string;
}

interface ProviderKeyInfo {
  id: string;
  status: "active" | "retiring" | "revoked";
  createdAt: string | null;
}

interface AgentInfo {
  id: string;
  name: string;
  platform: string;
  agentVersion: string;
  lookupMode: string;
  revoked: boolean;
  enrolledAt: string | null;
  lastSeenAt: string | null;
  online: boolean;
}

const DEFAULT_REQUEST_TEMPLATE = `{
  "barcode": "{{barcode}}",
  "event_name": "{{artist}}",
  "venue": "{{venue}}",
  "event_date": "{{date}}",
  "event_time": "{{time}}"
}`;

const TEMPLATE_VARS = [
  { key: "{{barcode}}", desc: "ברקוד הכרטיס" },
  { key: "{{artist}}", desc: "שם האמן / האירוע" },
  { key: "{{event_name}}", desc: "שם האירוע המלא" },
  { key: "{{venue}}", desc: "שם האולם" },
  { key: "{{date}}", desc: "תאריך (DD/MM/YYYY)" },
  { key: "{{date_iso}}", desc: "תאריך (YYYY-MM-DD)" },
  { key: "{{time}}", desc: "שעה (HH:MM)" },
  { key: "{{section}}", desc: "יציע / קטע" },
  { key: "{{row}}", desc: "שורה" },
  { key: "{{seat}}", desc: "מושב" },
  { key: "{{is_standing}}", desc: "עמידה (true/false)" },
  { key: "{{request_id}}", desc: "מזהה בקשה ייחודי" },
];

const EMPTY_FORM = {
  name: "",
  protocol: "tiket_connect" as "tiket_connect" | "custom",
  connectionMode: "agent" as "direct" | "agent",
  baseUrl: "",
  verifyEndpoint: "/tiket/verify",
  healthEndpoint: "",
  transferEndpoint: "",
  httpMethod: "POST" as "POST" | "GET",
  authType: "bearer" as "bearer" | "header" | "query" | "hmac",
  authHeaderName: "Authorization",
  apiKey: "",
  secondaryCredentialHeaderName: "",
  secondaryKey: "",
  requestBodyTemplate: DEFAULT_REQUEST_TEMPLATE,
  responseValidField: "valid",
  responseValidValue: "",
  responseConfidenceField: "",
  responseTicketIdField: "",
  responseOriginalPriceField: "",
  responseMatchedFieldsField: "",
  responseUnmatchedFieldsField: "",
  barcodePattern: "",
  timeoutMs: 8000,
  priority: 100,
  enabled: true,
  notes: "",
};

type FormState = typeof EMPTY_FORM;

/**
 * One-click starting points. The local providers (Leaan, Tomix, Tickchak,
 * Tixwise) have no public API — for them the play is the Tiket Connect kit:
 * sign the agreement, send their tech team partner-kit/, then just paste the
 * base URL + shared secret here. Eventim/Ticketmaster have gated partner APIs
 * that we adapt to with the custom protocol once credentials arrive.
 */
const PRESETS: { id: string; label: string; badge: string; form: Partial<FormState> }[] = [
  {
    id: "tiket_connect",
    label: "Tiket Connect",
    badge: "מומלץ",
    form: {
      protocol: "tiket_connect",
      connectionMode: "agent",
      verifyEndpoint: "/tiket/verify",
      notes: "ספק שמריץ את ה-Agent שלנו (partner-kit/agent) — חיבור יוצא בלבד, בלי לפתוח פורטים אצלו. יוצרים טוקן צימוד אחרי השמירה.",
    },
  },
  {
    id: "leaan",
    label: "Leaan (לאן)",
    badge: "Tiket Connect",
    form: {
      name: "Leaan",
      protocol: "tiket_connect",
      connectionMode: "agent",
      verifyEndpoint: "/tiket/verify",
      priority: 10,
      notes: "אין API ציבורי — לאחר הסכם, לשלוח לצוות הטכני שלהם את partner-kit/ (Agent + מדריך). ~40% מהשוק.",
    },
  },
  {
    id: "tomix",
    label: "Tomix (תומיקס)",
    badge: "Tiket Connect",
    form: {
      name: "Tomix",
      protocol: "tiket_connect",
      connectionMode: "agent",
      verifyEndpoint: "/tiket/verify",
      priority: 20,
      notes: "אין API ציבורי — לשלוח לצוות הטכני את ערכת Tiket Connect (partner-kit/).",
    },
  },
  {
    id: "tickchak",
    label: "Tickchak (טיקצ'ק)",
    badge: "Tiket Connect",
    form: {
      name: "Tickchak",
      protocol: "tiket_connect",
      connectionMode: "agent",
      verifyEndpoint: "/tiket/verify",
      priority: 20,
      notes: "אין API ציבורי — לשלוח לצוות הטכני את ערכת Tiket Connect (partner-kit/).",
    },
  },
  {
    id: "tixwise",
    label: "Tixwise",
    badge: "Tiket Connect",
    form: {
      name: "Tixwise",
      protocol: "tiket_connect",
      connectionMode: "agent",
      verifyEndpoint: "/tiket/verify",
      priority: 30,
      notes: "אין API ציבורי — לשלוח לצוות הטכני את ערכת Tiket Connect (partner-kit/).",
    },
  },
  {
    id: "eventim",
    label: "Eventim IL",
    badge: "API בהסכם",
    form: {
      name: "Eventim",
      protocol: "custom",
      baseUrl: "https://api.eventim.com/v2",
      verifyEndpoint: "/tickets/validate",
      httpMethod: "POST",
      authType: "header",
      authHeaderName: "X-API-Key",
      secondaryCredentialHeaderName: "X-Client-Id",
      requestBodyTemplate: `{
  "ticket_code": "{{barcode}}",
  "event_details": {
    "name": "{{event_name}}",
    "venue": "{{venue}}",
    "date": "{{date_iso}}",
    "time": "{{time}}"
  }
}`,
      responseValidField: "is_valid",
      priority: 40,
      notes: "דורש הסכם שותפים דרך developer.eventim.com — הכתובות כאן הן נקודת פתיחה, לעדכן לפי התיעוד שיתקבל.",
    },
  },
  {
    id: "ticketmaster",
    label: "Ticketmaster",
    badge: "API בהסכם",
    form: {
      name: "Ticketmaster",
      protocol: "custom",
      baseUrl: "https://app.ticketmaster.com/partners/v1",
      verifyEndpoint: "/tickets/verify",
      httpMethod: "POST",
      authType: "query",
      authHeaderName: "apikey",
      requestBodyTemplate: `{
  "barcode": "{{barcode}}",
  "event": {
    "name": "{{event_name}}",
    "venue": "{{venue}}",
    "dateTime": "{{date_iso}}T{{time}}"
  }
}`,
      responseValidField: "verified",
      priority: 40,
      notes: "Partner API בהסכם בלבד (developer.ticketmaster.com) — לעדכן endpoints לפי החוזה.",
    },
  },
];

async function getIdToken(): Promise<string | null> {
  return new Promise((resolve) => {
    const auth = getAuth();
    if (auth.currentUser) {
      auth.currentUser.getIdToken().then(resolve).catch(() => resolve(null));
      return;
    }
    const unsub = onAuthStateChanged(auth, (user: User | null) => {
      unsub();
      if (!user) { resolve(null); return; }
      user.getIdToken().then(resolve).catch(() => resolve(null));
    });
  });
}

export default function VenueProvidersPage() {
  const [providers, setProviders] = useState<VenueProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, TestResult>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) { setMessage({ type: "error", text: "לא מחובר" }); setLoading(false); return; }
      const res = await apiFetch("/api/admin/venue-providers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setProviders(data.providers || []);
    } catch {
      setMessage({ type: "error", text: "שגיאה בטעינת הספקים" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setForm({ ...EMPTY_FORM, ...preset.form });
    setShowAdvanced(false);
    setEditingId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleEnabled = async (provider: VenueProvider) => {
    const token = await getIdToken();
    const res = await apiFetch("/api/admin/venue-providers", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: provider.id, enabled: !provider.enabled }),
    });
    if (res.ok) {
      setProviders((prev) =>
        prev.map((p) => (p.id === provider.id ? { ...p, enabled: !p.enabled } : p))
      );
    } else {
      showMsg("error", "שגיאה בעדכון הסטטוס");
    }
  };

  const handleEdit = (provider: VenueProvider) => {
    setEditingId(provider.id);
    setForm({
      name: provider.name,
      protocol: provider.protocol || "custom",
      connectionMode: provider.connectionMode || "direct",
      baseUrl: provider.baseUrl,
      verifyEndpoint: provider.verifyEndpoint,
      healthEndpoint: provider.healthEndpoint || "",
      transferEndpoint: provider.transferEndpoint || "",
      httpMethod: provider.httpMethod || "POST",
      authType: provider.authType as FormState["authType"],
      authHeaderName: provider.authHeaderName,
      apiKey: "",
      secondaryCredentialHeaderName: provider.secondaryCredentialHeaderName || "",
      secondaryKey: "",
      requestBodyTemplate: provider.requestBodyTemplate || DEFAULT_REQUEST_TEMPLATE,
      responseValidField: provider.responseValidField,
      responseValidValue: provider.responseValidValue || "",
      responseConfidenceField: provider.responseConfidenceField || "",
      responseTicketIdField: provider.responseTicketIdField || "",
      responseOriginalPriceField: provider.responseOriginalPriceField || "",
      responseMatchedFieldsField: provider.responseMatchedFieldsField || "",
      responseUnmatchedFieldsField: provider.responseUnmatchedFieldsField || "",
      barcodePattern: provider.barcodePattern || "",
      timeoutMs: provider.timeoutMs || 8000,
      priority: provider.priority ?? 100,
      enabled: provider.enabled,
      notes: provider.notes || "",
    });
    setShowAdvanced(false);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    const token = await getIdToken();
    const res = await apiFetch(`/api/admin/venue-providers?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setProviders((prev) => prev.filter((p) => p.id !== id));
      showMsg("success", "הספק נמחק בהצלחה");
    } else {
      const data = await res.json();
      showMsg("error", data.error || "שגיאה במחיקה");
    }
    setShowDeleteConfirm(null);
  };

  const handleTestConnection = async (provider: VenueProvider) => {
    setTestingId(provider.id);
    try {
      const token = await getIdToken();
      const res = await apiFetch("/api/admin/venue-providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ providerId: provider.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setTestResult((prev) => ({
          ...prev,
          [provider.id]: { ok: false, httpStatus: res.status, error: data.error || `HTTP ${res.status}` },
        }));
        return;
      }
      const result: TestResult = await res.json();
      setTestResult((prev) => ({ ...prev, [provider.id]: result }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setTestResult((prev) => ({ ...prev, [provider.id]: { ok: false, httpStatus: null, error: msg } }));
    } finally {
      setTestingId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getIdToken();
      const method = editingId ? "PUT" : "POST";
      const payload = editingId ? { id: editingId, ...form } : form;
      const res = await apiFetch("/api/admin/venue-providers", {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        showMsg("error", data.error || "שגיאה בשמירה");
        return;
      }
      showMsg("success", editingId ? "הספק עודכן בהצלחה" : "הספק נוסף בהצלחה");
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await fetchProviders();
    } catch {
      showMsg("error", "שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowAdvanced(false);
  };

  const demoProvider = providers.find((p) => p.type === "builtin_demo");
  const realProviders = providers.filter((p) => p.type !== "builtin_demo");
  const enabledCount = realProviders.filter((p) => p.enabled).length;
  const isTiketConnect = form.protocol === "tiket_connect";
  const isAgentMode = isTiketConnect && form.connectionMode === "agent";

  return (
    <AdminProtection>
      <MobileAdminChrome title="ניהול ספקים" />
      <div className="tk-admin min-h-screen bg-white" dir="rtl">
        <div className="hidden md:block">
          <NavBar />
        </div>

        <main className="max-w-4xl mx-auto px-4 py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-heading-4-desktop font-bold text-primary mb-2">
              ניהול ספקי API לאימות כרטיסים
            </h1>
            <p className="text-text-small text-mutedText max-w-xl mx-auto leading-relaxed">
              הגדר את מערכות הכרטוס של האולמות שאתה עובד איתם.
              כשמשתמש מעלה כרטיס, המערכת תשלח את פרטיו לספק המתאים ותקבל אישור אם הכרטיס אמיתי.
            </p>
          </div>

          {/* Status banner */}
          <div className="bg-secondary/20 border border-secondary rounded-2xl p-4 mb-6 flex flex-wrap gap-5 text-sm justify-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              <span className="text-strongText">
                <span className="font-bold text-primary">{enabledCount}</span> ספקים פעילים
              </span>
            </div>
            <div className="w-px bg-secondary hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary border border-primary/20 inline-block" />
              <span className="text-strongText">
                <span className="font-bold">{realProviders.length}</span> ספקים בסה&quot;כ
              </span>
            </div>
            <div className="w-px bg-secondary hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full inline-block ${demoProvider?.enabled ? "bg-yellow-400" : "bg-gray-300"}`} />
              <span className="text-strongText">
                מצב הדגמה:{" "}
                <span className={`font-bold ${demoProvider?.enabled ? "text-yellow-600" : "text-mutedText"}`}>
                  {demoProvider?.enabled ? "פעיל" : "כבוי"}
                </span>
              </span>
            </div>
          </div>

          {/* Global message */}
          {message && (
            <div
              className={`rounded-xl px-4 py-3 mb-5 text-sm font-medium border ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border-green-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Presets + add button */}
          {!showForm && (
            <div className="mb-6">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                <button
                  className="bg-primary hover:bg-highlight text-white font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-xsmall"
                  onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setShowAdvanced(false); }}
                >
                  + הוסף ספק API חדש
                </button>
                <span className="text-xs text-mutedText">או התחל מתבנית מוכנה:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className="group border border-secondary hover:border-primary bg-white hover:bg-secondary/10 rounded-xl px-3 py-2 text-right transition-colors"
                  >
                    <span className="text-sm font-semibold text-strongText group-hover:text-primary block">
                      {preset.label}
                    </span>
                    <span className="text-[10px] text-mutedText">{preset.badge}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add / Edit Form */}
          {showForm && (
            <div className="bg-white rounded-2xl border-2 border-secondary shadow-medium p-6 mb-8">
              <h2 className="text-heading-6-desktop font-bold text-primary mb-5">
                {editingId === "demo" ? "עריכת מצב הדגמה" : editingId ? "עריכת ספק" : "הוספת ספק API חדש"}
              </h2>
              <form onSubmit={handleSave} className="space-y-5">
                {/* Demo-only: just name, enabled, notes */}
                {editingId === "demo" && (
                  <>
                    <Field label="שם תצוגה" hint="השם שיוצג בממשק הניהול">
                      <StyledInput
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </Field>
                    <Field label="פעיל" hint="כשפעיל, המערכת תשתמש בנתוני הדגמה כשלא נמצאת התאמה בספקים האמיתיים">
                      <div className="flex items-center gap-3 mt-2">
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={form.enabled}
                          onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                        />
                        <span className="text-sm text-mutedText">{form.enabled ? "פעיל" : "כבוי"}</span>
                      </div>
                    </Field>
                    <Field label="הערות (אופציונלי)" hint="">
                      <textarea
                        rows={3}
                        className="w-full border border-secondary rounded-xl px-3 py-2 text-sm text-strongText focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      />
                    </Field>
                    <FormActions saving={saving} isEdit onCancel={cancelForm} />
                  </>
                )}

                {/* Real provider fields */}
                {editingId !== "demo" && (<>
                  {/* Protocol selection */}
                  <Field label="סוג חיבור *" hint="">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({
                          ...f,
                          protocol: "tiket_connect",
                          verifyEndpoint: f.verifyEndpoint || "/tiket/verify",
                        }))}
                        className={`text-right rounded-xl border-2 p-3 transition-colors ${
                          isTiketConnect ? "border-primary bg-secondary/20" : "border-secondary hover:border-primary/40"
                        }`}
                      >
                        <span className="font-bold text-strongText text-sm block mb-0.5">
                          Tiket Connect <span className="text-[10px] bg-primary text-white rounded-full px-2 py-0.5 mr-1">מומלץ</span>
                        </span>
                        <span className="text-xs text-mutedText leading-relaxed block">
                          הספק הטמיע את הערכה שלנו (partner-kit). נדרשים רק כתובת וסוד משותף —
                          אבטחת HMAC, סכימה אחידה, אפס מיפוי.
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({
                          ...f,
                          protocol: "custom",
                          verifyEndpoint: f.verifyEndpoint === "/tiket/verify" ? "/tickets/verify" : f.verifyEndpoint,
                          authType: f.authType === "hmac" ? "bearer" : f.authType,
                        }))}
                        className={`text-right rounded-xl border-2 p-3 transition-colors ${
                          !isTiketConnect ? "border-primary bg-secondary/20" : "border-secondary hover:border-primary/40"
                        }`}
                      >
                        <span className="font-bold text-strongText text-sm block mb-0.5">API מותאם אישית</span>
                        <span className="text-xs text-mutedText leading-relaxed block">
                          לספק עם API קיים משלו (Eventim, Ticketmaster…) — מגדירים כאן את הכתובת,
                          האימות, גוף הבקשה ומיפוי התשובה.
                        </span>
                      </button>
                    </div>
                  </Field>

                  {/* Connection mode — Tiket Connect only */}
                  {isTiketConnect && (
                    <Field label="אופן החיבור *" hint="">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, connectionMode: "agent" }))}
                          className={`text-right rounded-xl border-2 p-3 transition-colors ${
                            isAgentMode ? "border-primary bg-secondary/20" : "border-secondary hover:border-primary/40"
                          }`}
                        >
                          <span className="font-bold text-strongText text-sm block mb-0.5">
                            Agent — חיבור יוצא <span className="text-[10px] bg-primary text-white rounded-full px-2 py-0.5 mr-1">מומלץ</span>
                          </span>
                          <span className="text-xs text-mutedText leading-relaxed block">
                            הספק מריץ את ה-Agent שלנו בתוך הרשת שלו והוא מתקשר החוצה אלינו.
                            הספק לא פותח פורטים, לא צריך כתובת ציבורית ולא תעודת TLS.
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, connectionMode: "direct" }))}
                          className={`text-right rounded-xl border-2 p-3 transition-colors ${
                            !isAgentMode ? "border-primary bg-secondary/20" : "border-secondary hover:border-primary/40"
                          }`}
                        >
                          <span className="font-bold text-strongText text-sm block mb-0.5">כתובת ציבורית (ישיר)</span>
                          <span className="text-xs text-mutedText leading-relaxed block">
                            הספק מארח את הערכה בכתובת HTTPS ציבורית ואנחנו פונים אליה ישירות.
                          </span>
                        </button>
                      </div>
                      {isAgentMode && (
                        <p className="text-xs text-primary mt-2 bg-secondary/20 border border-secondary rounded-lg px-3 py-2">
                          אחרי השמירה: צרו <b>מפתח חתימה</b> ו<b>טוקן צימוד</b> מכרטיס הספק ושלחו
                          לצוות הטכני של הספק יחד עם <code className="font-mono">partner-kit/</code>.
                        </p>
                      )}
                    </Field>
                  )}

                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="שם הספק *" hint="שם תצוגה — למשל: Leaan, Eventim, Tomix">
                      <StyledInput
                        required
                        placeholder="Leaan"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </Field>
                    {!isAgentMode && (
                      <Field
                        label="Base URL *"
                        hint={isTiketConnect
                          ? "הכתובת שבה הספק מריץ את הערכה. לדוגמה: https://tiket-connect.leaan.co.il"
                          : "כתובת הבסיס של ה-API. לדוגמה: https://api.eventim.com/v2"}
                      >
                        <StyledInput
                          required
                          dir="ltr"
                          placeholder={isTiketConnect ? "https://tiket-connect.leaan.co.il" : "https://api.example.co.il/v1"}
                          value={form.baseUrl}
                          onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
                        />
                      </Field>
                    )}
                  </div>

                  {/* Secret / key */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                      label={
                        isAgentMode
                          ? "סוד משותף (אופציונלי — מומלץ ליצור מהפאנל)"
                          : editingId
                          ? (isTiketConnect ? "סוד משותף (השאר ריק לשמירה)" : "מפתח API (השאר ריק לשמירה)")
                          : (isTiketConnect ? "סוד משותף *" : "מפתח API *")
                      }
                      hint={isAgentMode
                        ? "עדיף לייצר מפתח חתימה מכרטיס הספק אחרי השמירה (מפתחות חתימה → צור מפתח) — כך מקבלים מזהה מפתח ורוטציה."
                        : isTiketConnect
                        ? "אותו סוד שהוגדר אצל הספק ב-TIKET_CONNECT_SECRET. מומלץ 32+ תווים אקראיים."
                        : "המפתח שהספק שלח לכם. יישמר בצורה מאובטחת בנפרד."}
                    >
                      <StyledInput
                        required={!editingId && !isAgentMode}
                        type="password"
                        dir="ltr"
                        placeholder={editingId || isAgentMode ? "••••••••" : isTiketConnect ? "סוד משותף חזק" : "sk_live_..."}
                        value={form.apiKey}
                        onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                      />
                    </Field>
                    <Field
                      label="תבנית זיהוי ברקוד (אופציונלי)"
                      hint="Regex לניתוב אוטומטי לספק לפי פורמט הברקוד. לדוגמה: ^978"
                    >
                      <StyledInput
                        dir="ltr"
                        placeholder="^978"
                        className="font-mono"
                        value={form.barcodePattern}
                        onChange={(e) => setForm((f) => ({ ...f, barcodePattern: e.target.value }))}
                      />
                    </Field>
                  </div>

                  {/* Custom-protocol configuration */}
                  {!isTiketConnect && (<>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Field label="Endpoint לאימות *" hint="נתיב שמתווסף ל-Base URL. תומך במשתני תבנית, למשל: /tickets/{{barcode}}/status">
                        <StyledInput
                          required
                          dir="ltr"
                          placeholder="/tickets/verify"
                          value={form.verifyEndpoint}
                          onChange={(e) => setForm((f) => ({ ...f, verifyEndpoint: e.target.value }))}
                        />
                      </Field>
                      <Field label="מתודת HTTP *" hint="GET מרנדר את המשתנים לתוך הנתיב, POST שולח את תבנית הגוף">
                        <select
                          className="w-full border border-secondary rounded-xl px-3 py-2 text-sm text-strongText bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          value={form.httpMethod}
                          onChange={(e) => setForm((f) => ({ ...f, httpMethod: e.target.value as FormState["httpMethod"] }))}
                        >
                          <option value="POST">POST</option>
                          <option value="GET">GET</option>
                        </select>
                      </Field>
                      <Field label="שדה תקינות בתשובה *" hint="נתיב השדה שמציין שהכרטיס תקין. תומך בנקודות: data.result.valid">
                        <StyledInput
                          required
                          dir="ltr"
                          placeholder="valid"
                          value={form.responseValidField}
                          onChange={(e) => setForm((f) => ({ ...f, responseValidField: e.target.value }))}
                        />
                      </Field>
                    </div>

                    {/* Auth */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="סוג אימות *" hint="איך ה-API מצפה לקבל את המפתח?">
                        <select
                          className="w-full border border-secondary rounded-xl px-3 py-2 text-sm text-strongText bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          value={form.authType}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              authType: e.target.value as FormState["authType"],
                              authHeaderName:
                                e.target.value === "bearer"
                                  ? "Authorization"
                                  : e.target.value === "query"
                                  ? "apikey"
                                  : f.authHeaderName,
                            }))
                          }
                        >
                          <option value="bearer">Bearer Token (Authorization header)</option>
                          <option value="header">Header מותאם (X-API-Key וכדומה)</option>
                          <option value="query">Query Parameter (?apikey=…)</option>
                          <option value="hmac">חתימת HMAC (בסגנון Tiket Connect)</option>
                        </select>
                      </Field>
                      {form.authType !== "hmac" && (
                        <Field
                          label={form.authType === "query" ? "שם ה-Query Param *" : "שם ה-Header *"}
                          hint={
                            form.authType === "bearer"
                              ? "בד\"כ: Authorization (הערך ישלח כ-Bearer …)"
                              : form.authType === "query"
                              ? "שם הפרמטר ב-URL, לדוגמה: apikey"
                              : "שם ה-Header, לדוגמה: X-API-Key"
                          }
                        >
                          <StyledInput
                            required
                            dir="ltr"
                            value={form.authHeaderName}
                            onChange={(e) => setForm((f) => ({ ...f, authHeaderName: e.target.value }))}
                          />
                        </Field>
                      )}
                    </div>

                    {/* Secondary credential */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field
                        label="Header אישורים משניים (אופציונלי)"
                        hint="חלק מהספקים (כמו Eventim) דורשים Header נוסף, לדוגמה: X-Client-Id"
                      >
                        <StyledInput
                          dir="ltr"
                          placeholder="X-Client-Id"
                          value={form.secondaryCredentialHeaderName}
                          onChange={(e) => setForm((f) => ({ ...f, secondaryCredentialHeaderName: e.target.value }))}
                        />
                      </Field>
                      <Field
                        label="ערך האישורים המשניים (אופציונלי)"
                        hint="ה-Client ID עצמו — יישמר בנפרד ובצורה מאובטחת"
                      >
                        <StyledInput
                          type="password"
                          dir="ltr"
                          placeholder={editingId ? "••••••••" : "client_id_..."}
                          value={form.secondaryKey}
                          onChange={(e) => setForm((f) => ({ ...f, secondaryKey: e.target.value }))}
                        />
                      </Field>
                    </div>

                    {/* Request body template — POST only */}
                    {form.httpMethod === "POST" && (
                      <Field
                        label="תבנית גוף הבקשה (Request Body) *"
                        hint="JSON שישלח לספק. השתמש במשתנים {{variable}} שיוחלפו בנתוני הכרטיס (הערכים מוגנים מפני שבירת JSON)."
                      >
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {TEMPLATE_VARS.map(({ key, desc }) => (
                            <button
                              key={key}
                              type="button"
                              className="text-xs bg-secondary/30 hover:bg-secondary text-primary border border-secondary rounded-lg px-2 py-0.5 font-mono transition-colors"
                              onClick={() => setForm((f) => ({ ...f, requestBodyTemplate: f.requestBodyTemplate + key }))}
                              title={desc}
                            >
                              {key}
                            </button>
                          ))}
                        </div>
                        <textarea
                          required
                          dir="ltr"
                          rows={7}
                          className="w-full border border-secondary rounded-xl px-3 py-2 text-sm font-mono text-strongText focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                          value={form.requestBodyTemplate}
                          onChange={(e) => setForm((f) => ({ ...f, requestBodyTemplate: e.target.value }))}
                        />
                        <p className="text-xs text-mutedText mt-1">
                          הכפתורים למעלה מוסיפים משתנה לסוף הטמפלייט. ניתן לערוך ישירות בטקסט.
                        </p>
                      </Field>
                    )}

                    {/* Advanced response mapping */}
                    <div className="border border-secondary rounded-xl overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-secondary/10 hover:bg-secondary/20 transition-colors"
                        onClick={() => setShowAdvanced((v) => !v)}
                      >
                        <span className="text-sm font-semibold text-strongText">
                          הגדרות מתקדמות — מיפוי תשובה, זמנים
                        </span>
                        <span className="text-primary text-xs">{showAdvanced ? "▲ סגור" : "▼ פתח"}</span>
                      </button>
                      {showAdvanced && (
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="ערך תקינות מצופה (אופציונלי)" hint='אם שדה התקינות אינו בוליאני — למשל status שערכו "OK". ריק = בדיקת אמת/שקר.'>
                              <StyledInput
                                dir="ltr"
                                placeholder="OK"
                                value={form.responseValidValue}
                                onChange={(e) => setForm((f) => ({ ...f, responseValidValue: e.target.value }))}
                              />
                            </Field>
                            <Field label="שדה ציון אמינות (אופציונלי)" hint="נתיב לשדה מספרי 0-100 בתשובת הספק">
                              <StyledInput
                                dir="ltr"
                                placeholder="confidence"
                                value={form.responseConfidenceField}
                                onChange={(e) => setForm((f) => ({ ...f, responseConfidenceField: e.target.value }))}
                              />
                            </Field>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="שדה מזהה כרטיס רשמי (אופציונלי)" hint="נתיב למזהה הכרטיס במערכת הספק">
                              <StyledInput
                                dir="ltr"
                                placeholder="ticket_id"
                                value={form.responseTicketIdField}
                                onChange={(e) => setForm((f) => ({ ...f, responseTicketIdField: e.target.value }))}
                              />
                            </Field>
                            <Field label="שדה מחיר מקורי (אופציונלי)" hint="נתיב למחיר הפנים של הכרטיס — יוצג לאדמין לזיהוי ספסרות">
                              <StyledInput
                                dir="ltr"
                                placeholder="original_price"
                                value={form.responseOriginalPriceField}
                                onChange={(e) => setForm((f) => ({ ...f, responseOriginalPriceField: e.target.value }))}
                              />
                            </Field>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="שדה שדות תואמים (אופציונלי)" hint="נתיב למערך שמות השדות שתאמו">
                              <StyledInput
                                dir="ltr"
                                placeholder="matched_fields"
                                value={form.responseMatchedFieldsField}
                                onChange={(e) => setForm((f) => ({ ...f, responseMatchedFieldsField: e.target.value }))}
                              />
                            </Field>
                            <Field label="שדה שדות לא תואמים (אופציונלי)" hint="נתיב למערך שמות השדות שלא תאמו">
                              <StyledInput
                                dir="ltr"
                                placeholder="unmatched_fields"
                                value={form.responseUnmatchedFieldsField}
                                onChange={(e) => setForm((f) => ({ ...f, responseUnmatchedFieldsField: e.target.value }))}
                              />
                            </Field>
                          </div>
                        </div>
                      )}
                    </div>
                  </>)}

                  {/* Tiket Connect direct mode: explicit endpoint paths */}
                  {isTiketConnect && !isAgentMode && (
                    <div className="border border-secondary rounded-xl overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-secondary/10 hover:bg-secondary/20 transition-colors"
                        onClick={() => setShowAdvanced((v) => !v)}
                      >
                        <span className="text-sm font-semibold text-strongText">
                          הגדרות מתקדמות — נתיבי Endpoints
                        </span>
                        <span className="text-primary text-xs">{showAdvanced ? "▲ סגור" : "▼ פתח"}</span>
                      </button>
                      {showAdvanced && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Field label="נתיב אימות" hint="ברירת מחדל: /tiket/verify">
                            <StyledInput
                              dir="ltr"
                              placeholder="/tiket/verify"
                              value={form.verifyEndpoint}
                              onChange={(e) => setForm((f) => ({ ...f, verifyEndpoint: e.target.value }))}
                            />
                          </Field>
                          <Field label="נתיב Health" hint="ריק = נגזר מנתיב האימות">
                            <StyledInput
                              dir="ltr"
                              placeholder="/tiket/health"
                              value={form.healthEndpoint}
                              onChange={(e) => setForm((f) => ({ ...f, healthEndpoint: e.target.value }))}
                            />
                          </Field>
                          <Field label="נתיב העברת בעלות" hint="ריק = נגזר מנתיב האימות">
                            <StyledInput
                              dir="ltr"
                              placeholder="/tiket/transfer"
                              value={form.transferEndpoint}
                              onChange={(e) => setForm((f) => ({ ...f, transferEndpoint: e.target.value }))}
                            />
                          </Field>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timing + priority + enabled — all protocols */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Timeout (מילישניות)" hint="ברירת מחדל: 8000. טווח: 1000–30000">
                      <StyledInput
                        type="number"
                        dir="ltr"
                        min={1000}
                        max={30000}
                        value={form.timeoutMs}
                        onChange={(e) => setForm((f) => ({ ...f, timeoutMs: Number(e.target.value) }))}
                      />
                    </Field>
                    <Field label="עדיפות" hint="מספר נמוך = נבדק קודם. ברירת מחדל: 100">
                      <StyledInput
                        type="number"
                        dir="ltr"
                        value={form.priority}
                        onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                      />
                    </Field>
                    <Field label="פעיל" hint="האם להשתמש בספק זה בזמן אימות כרטיסים?">
                      <div className="flex items-center gap-3 mt-2">
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={form.enabled}
                          onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                        />
                        <span className="text-sm text-mutedText">{form.enabled ? "פעיל" : "כבוי"}</span>
                      </div>
                    </Field>
                  </div>

                  {/* Notes */}
                  <Field
                    label="הערות (אופציונלי)"
                    hint="פרטי יצירת קשר, תאריך חוזה, מגבלות Rate Limit — כל מה שרוצים לזכור לגבי הספק"
                  >
                    <textarea
                      rows={3}
                      className="w-full border border-secondary rounded-xl px-3 py-2 text-sm text-strongText focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                      placeholder="איש קשר טכני: dev@leaan.co.il, חוזה עד 31/12/2026, Rate limit: 1000 בקשות/שעה"
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    />
                  </Field>

                  <FormActions saving={saving} isEdit={!!editingId} onCancel={cancelForm} />
                </>)}
              </form>
            </div>
          )}

          {/* Provider cards */}
          {loading ? (
            <div className="text-center py-16 text-mutedText text-sm">טוען ספקים...</div>
          ) : (
            <div className="space-y-4">
              {/* Demo provider card */}
              {demoProvider && (
                <ProviderCard
                  provider={demoProvider}
                  onToggle={handleToggleEnabled}
                  onEdit={handleEdit}
                  onDelete={null}
                  onTest={null}
                  testingId={testingId}
                  testResult={testResult[demoProvider.id]}
                  showDeleteConfirm={showDeleteConfirm}
                  setShowDeleteConfirm={setShowDeleteConfirm}
                  onConfirmDelete={handleDelete}
                />
              )}

              {realProviders.length === 0 && !showForm && (
                <div className="rounded-2xl border-2 border-dashed border-secondary p-10 text-center">
                  <p className="text-mutedText mb-4 text-sm">עדיין לא הוגדרו ספקי API אמיתיים</p>
                  <button
                    className="bg-primary hover:bg-highlight text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
                    onClick={() => setShowForm(true)}
                  >
                    הוסף ספק ראשון
                  </button>
                </div>
              )}

              {realProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onToggle={handleToggleEnabled}
                  onEdit={handleEdit}
                  onDelete={(id) => setShowDeleteConfirm(id)}
                  onTest={handleTestConnection}
                  testingId={testingId}
                  testResult={testResult[provider.id]}
                  showDeleteConfirm={showDeleteConfirm}
                  setShowDeleteConfirm={setShowDeleteConfirm}
                  onConfirmDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Template reference */}
          <div className="mt-10 bg-secondary/10 border border-secondary rounded-2xl p-5">
            <h3 className="font-semibold text-primary mb-3 text-sm">משתני תבנית זמינים (גוף הבקשה + Endpoint)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {TEMPLATE_VARS.map(({ key, desc }) => (
                <div key={key} className="text-xs">
                  <code className="font-mono bg-secondary/40 text-primary px-1.5 py-0.5 rounded">{key}</code>
                  <span className="text-mutedText mr-1"> — {desc}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-mutedText mt-3 leading-relaxed">
              💡 ספק שהטמיע את <b>ערכת Tiket Connect</b> (ראו <code className="font-mono">partner-kit/</code> ברפו)
              לא צריך אף אחד מאלה — בוחרים בפרוטוקול Tiket Connect ומזינים רק כתובת וסוד משותף.
            </p>
          </div>
        </main>

        <div className="hidden md:block">
          <Footer />
        </div>
      </div>
    </AdminProtection>
  );
}

/* ── Shared sub-components ── */

function StyledInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full border border-secondary rounded-xl px-3 py-2 text-sm text-strongText bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${className}`}
      {...props}
    />
  );
}

function FormActions({
  saving,
  isEdit,
  onCancel,
}: {
  saving: boolean;
  isEdit: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="submit"
        disabled={saving}
        className="bg-primary hover:bg-highlight disabled:opacity-60 text-white font-semibold px-8 py-2.5 rounded-xl transition-colors shadow-xsmall"
      >
        {saving ? "שומר..." : isEdit ? "שמור שינויים" : "הוסף ספק"}
      </button>
      <button
        type="button"
        className="border border-secondary text-primary hover:bg-secondary/20 font-semibold px-6 py-2.5 rounded-xl transition-colors"
        onClick={onCancel}
      >
        ביטול
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-strongText mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-mutedText mt-1">{hint}</p>}
    </div>
  );
}

function StatChip({ label, value, tone }: { label: string; value: string | number; tone?: "green" | "red" | "muted" }) {
  const toneClass =
    tone === "green" ? "text-green-700" : tone === "red" ? "text-red-600" : "text-strongText";
  return (
    <span className="text-[11px] text-mutedText">
      {label}: <span className={`font-bold ${toneClass}`}>{value}</span>
    </span>
  );
}

/**
 * Signing keys + agent management for one provider. Secrets and pairing
 * tokens appear exactly once, in a copy-me box — they are never retrievable
 * again (only hashes are stored server-side).
 */
function ProviderSecurityPanel({ provider }: { provider: VenueProvider }) {
  const isAgent = provider.connectionMode === "agent";
  const [keys, setKeys] = useState<ProviderKeyInfo[]>([]);
  const [activeKeyId, setActiveKeyId] = useState("");
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [oneTimeSecret, setOneTimeSecret] = useState<{ label: string; value: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authed = async (path: string, init?: RequestInit) => {
    const token = await getIdToken();
    return apiFetch(path, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  };

  const refresh = async () => {
    try {
      const [keysRes, agentsRes] = await Promise.all([
        authed(`/api/admin/venue-providers/keys?providerId=${provider.id}`),
        isAgent
          ? authed(`/api/admin/venue-providers/agents?providerId=${provider.id}`)
          : Promise.resolve(null),
      ]);
      if (keysRes.ok) {
        const data = await keysRes.json();
        setKeys(data.keys || []);
        setActiveKeyId(data.activeKeyId || "");
      }
      if (agentsRes?.ok) {
        const data = await agentsRes.json();
        setAgents(data.agents || []);
      }
    } catch {
      setError("שגיאה בטעינת נתוני אבטחה");
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider.id]);

  const generateKey = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await authed("/api/admin/venue-providers/keys", {
        method: "POST",
        body: JSON.stringify({ providerId: provider.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOneTimeSecret({
        label: `סוד חתימה חדש (מזהה מפתח: ${data.keyId}) — העתיקו ושלחו לספק, הוא לא יוצג שוב`,
        value: data.secret,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה ביצירת מפתח");
    } finally {
      setBusy(false);
    }
  };

  const keyAction = async (keyId: string, action: "revoke" | "promote") => {
    setBusy(true);
    setError(null);
    try {
      const res = await authed("/api/admin/venue-providers/keys", {
        method: "PATCH",
        body: JSON.stringify({ providerId: provider.id, keyId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בעדכון מפתח");
    } finally {
      setBusy(false);
    }
  };

  const createPairingToken = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await authed("/api/admin/venue-providers/enroll-token", {
        method: "POST",
        body: JSON.stringify({ providerId: provider.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOneTimeSecret({
        label: "טוקן צימוד חד-פעמי (תקף 24 שעות) — הספק מריץ: tiket-agent enroll --token <הטוקן>",
        value: data.enroll_token,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה ביצירת טוקן");
    } finally {
      setBusy(false);
    }
  };

  const agentAction = async (agentId: string, action: "revoke" | "restore") => {
    setBusy(true);
    try {
      await authed("/api/admin/venue-providers/agents", {
        method: "POST",
        body: JSON.stringify({ agentId, action }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const keyStatusLabel = { active: "פעיל", retiring: "ברוטציה", revoked: "מבוטל" } as const;

  return (
    <div className="mt-3 border-t border-secondary/50 pt-3 space-y-3">
      {error && <div className="text-xs text-red-600">{error}</div>}

      {/* One-time secret display */}
      {oneTimeSecret && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3">
          <div className="text-xs font-semibold text-yellow-800 mb-1.5">{oneTimeSecret.label}</div>
          <div className="flex items-center gap-2">
            <code dir="ltr" className="flex-1 text-xs font-mono bg-white border border-yellow-200 rounded-lg px-2 py-1.5 break-all select-all">
              {oneTimeSecret.value}
            </code>
            <button
              className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-medium shrink-0"
              onClick={() => navigator.clipboard?.writeText(oneTimeSecret.value)}
            >
              העתק
            </button>
            <button
              className="text-xs border border-secondary text-mutedText px-2 py-1.5 rounded-lg shrink-0"
              onClick={() => setOneTimeSecret(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Agent status (agent mode) */}
      {isAgent && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-strongText">Agent</span>
            <button
              className="text-xs border border-secondary text-primary hover:bg-secondary/20 px-2.5 py-1 rounded-lg font-medium"
              onClick={createPairingToken}
              disabled={busy}
            >
              צור טוקן צימוד
            </button>
          </div>
          {agents.length === 0 ? (
            <p className="text-xs text-mutedText">
              עדיין לא צומד Agent. צרו טוקן צימוד ושלחו לצוות הטכני של הספק.
            </p>
          ) : (
            <div className="space-y-1">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-2 text-xs flex-wrap">
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${
                      agent.online ? "bg-green-500" : agent.revoked ? "bg-gray-400" : "bg-red-400"
                    }`}
                  />
                  <span className="font-medium text-strongText">{agent.name || agent.id.slice(0, 8)}</span>
                  <span className={agent.online ? "text-green-700 font-semibold" : "text-mutedText"}>
                    {agent.revoked ? "מבוטל" : agent.online ? "מחובר" : "מנותק"}
                  </span>
                  {agent.agentVersion && <span className="text-mutedText">v{agent.agentVersion}</span>}
                  {agent.lookupMode && <span className="text-mutedText">מצב: {agent.lookupMode}</span>}
                  {agent.lastSeenAt && (
                    <span className="text-mutedText">
                      נראה: {new Date(agent.lastSeenAt).toLocaleString("he-IL")}
                    </span>
                  )}
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => agentAction(agent.id, agent.revoked ? "restore" : "revoke")}
                    disabled={busy}
                  >
                    {agent.revoked ? "שחזר" : "בטל"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Signing keys */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-strongText">מפתחות חתימה (HMAC)</span>
          <button
            className="text-xs border border-secondary text-primary hover:bg-secondary/20 px-2.5 py-1 rounded-lg font-medium"
            onClick={generateKey}
            disabled={busy}
          >
            צור מפתח חדש
          </button>
        </div>
        {keys.length === 0 ? (
          <p className="text-xs text-mutedText">אין מפתחות עדיין — צרו מפתח ושלחו את הסוד לספק.</p>
        ) : (
          <div className="space-y-1">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center gap-2 text-xs flex-wrap">
                <code dir="ltr" className="font-mono bg-secondary/30 text-primary px-1.5 py-0.5 rounded">
                  {key.id}
                </code>
                <span
                  className={
                    key.status === "active"
                      ? "text-green-700 font-semibold"
                      : key.status === "retiring"
                      ? "text-yellow-700"
                      : "text-mutedText line-through"
                  }
                >
                  {keyStatusLabel[key.status]}
                  {key.id === activeKeyId && " · חותם כעת"}
                </span>
                {key.createdAt && (
                  <span className="text-mutedText">{new Date(key.createdAt).toLocaleDateString("he-IL")}</span>
                )}
                {key.status !== "revoked" && key.id !== activeKeyId && (
                  <button className="text-primary hover:underline" onClick={() => keyAction(key.id, "promote")} disabled={busy}>
                    קדם לפעיל
                  </button>
                )}
                {key.status !== "revoked" && (
                  <button className="text-red-500 hover:underline" onClick={() => keyAction(key.id, "revoke")} disabled={busy}>
                    בטל
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-mutedText mt-1.5 leading-relaxed">
          רוטציה בטוחה: צרו מפתח חדש (הישן הופך ל&quot;ברוטציה&quot; וממשיך לעבוד) → הספק מוסיף את
          הסוד החדש לצד הישן → מוודאים שהכל ירוק → מבטלים את הישן.
        </p>
      </div>
    </div>
  );
}

function ProviderCard({
  provider,
  onToggle,
  onEdit,
  onDelete,
  onTest,
  testingId,
  testResult,
  showDeleteConfirm,
  setShowDeleteConfirm,
  onConfirmDelete,
}: {
  provider: VenueProvider;
  onToggle: (p: VenueProvider) => void;
  onEdit: ((p: VenueProvider) => void) | null;
  onDelete: ((id: string) => void) | null;
  onTest: ((p: VenueProvider) => void) | null;
  testingId: string | null;
  testResult?: TestResult;
  showDeleteConfirm: string | null;
  setShowDeleteConfirm: (id: string | null) => void;
  onConfirmDelete: (id: string) => void;
}) {
  const isDemo = provider.type === "builtin_demo";
  const isConnect = provider.protocol === "tiket_connect";
  const stats = provider.stats;
  const [showSecurity, setShowSecurity] = useState(false);

  return (
    <div
      className={`bg-white rounded-2xl border-2 p-5 transition-all shadow-xxsmall ${
        provider.enabled
          ? isDemo
            ? "border-yellow-300"
            : "border-secondary"
          : "border-gray-100 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left/main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-strongText text-base">{provider.name}</span>
            {isDemo && (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-yellow-200">
                מובנה
              </span>
            )}
            {!isDemo && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  isConnect
                    ? "bg-secondary/40 text-primary border-secondary"
                    : "bg-gray-50 text-mutedText border-gray-200"
                }`}
              >
                {isConnect ? "Tiket Connect" : "API מותאם"}
              </span>
            )}
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                provider.enabled
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-100 text-mutedText border-gray-200"
              }`}
            >
              {provider.enabled ? "פעיל" : "כבוי"}
            </span>
          </div>

          {!isDemo && (
            <div className="text-xs text-mutedText space-y-0.5 mt-1.5">
              <div>
                <span className="font-semibold text-strongText">חיבור: </span>
                {provider.connectionMode === "agent" ? (
                  <span className="font-medium text-primary">Agent — חיבור יוצא (ללא כתובת ציבורית)</span>
                ) : (
                  <span dir="ltr" className="font-mono">{provider.baseUrl}{provider.verifyEndpoint}</span>
                )}
              </div>
              <div>
                <span className="font-semibold text-strongText">Auth: </span>
                <span dir="ltr" className="font-mono">
                  {isConnect || provider.authType === "hmac"
                    ? "HMAC-SHA256 (חתימת בקשות)"
                    : provider.authType === "bearer"
                    ? "Bearer Token"
                    : provider.authType === "header"
                    ? `Header: ${provider.authHeaderName}`
                    : `Query: ?${provider.authHeaderName}=…`}
                </span>
              </div>
              {provider.barcodePattern && (
                <div>
                  <span className="font-semibold text-strongText">ברקוד: </span>
                  <code dir="ltr" className="font-mono text-primary bg-secondary/30 px-1 rounded">
                    {provider.barcodePattern}
                  </code>
                  <span className="mr-2">עדיפות: {provider.priority}</span>
                </div>
              )}
              {provider.notes && (
                <div className="text-mutedText mt-1 italic">{provider.notes}</div>
              )}

              {/* Usage stats */}
              {stats && stats.calls > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 pt-2 border-t border-secondary/50">
                  <StatChip label="קריאות" value={stats.calls} />
                  <StatChip label="אומתו" value={stats.verified} tone="green" />
                  <StatChip label="נדחו" value={stats.rejected} tone="red" />
                  <StatChip label="לא נמצאו" value={stats.notFound} tone="muted" />
                  <StatChip label="שגיאות" value={stats.errors} tone={stats.errors > 0 ? "red" : "muted"} />
                  <StatChip label="זמן ממוצע" value={`${stats.avgLatencyMs}ms`} />
                  {stats.lastUsedAt && (
                    <StatChip
                      label="שימוש אחרון"
                      value={new Date(stats.lastUsedAt).toLocaleDateString("he-IL")}
                    />
                  )}
                </div>
              )}
              {stats?.lastError && (
                <div className="text-red-500 mt-1" dir="ltr">⚠ {stats.lastError}</div>
              )}
            </div>
          )}

          {isDemo && (
            <p className="text-xs text-mutedText mt-1">
              מצב הדגמה — משתמש בנתוני מאגר מדומה. פעיל כברירת מחדל להדגמות.
              כשמגיעים ל-API אמיתי, מומלץ לכבות את מצב ההדגמה.
            </p>
          )}

          {/* Test result */}
          {testResult && (
            <div
              className={`mt-2 text-xs px-2.5 py-1.5 rounded-lg inline-block font-medium ${
                testResult.ok
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {testResult.ok ? (
                <>
                  ✓ מחובר
                  {testResult.connectionMode === "agent" && " · דרך Agent"}
                  {typeof testResult.latencyMs === "number" && ` · ${testResult.latencyMs}ms`}
                  {testResult.httpStatus && ` · HTTP ${testResult.httpStatus}`}
                  {testResult.outcome && ` · תשובה: ${testResult.outcome}`}
                  {testResult.kitVersion && ` · גרסה ${testResult.kitVersion}`}
                  {testResult.agentLookupMode && ` · מצב ${testResult.agentLookupMode}`}
                  {testResult.transferSupported !== undefined &&
                    (testResult.transferSupported
                      ? " · תומך בהעברת בעלות ✓"
                      : " · ללא העברת בעלות")}
                </>
              ) : (
                <>
                  ✗ {testResult.error || `HTTP ${testResult.httpStatus}`}
                  {testResult.connectionMode !== "agent" && testResult.healthOk === false && " · health לא זמין"}
                  {testResult.connectionMode === "agent" && testResult.agentLastSeenAt &&
                    ` · נראה לאחרונה ${new Date(testResult.agentLastSeenAt).toLocaleString("he-IL")}`}
                </>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Enable toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-mutedText">{provider.enabled ? "פעיל" : "כבוי"}</span>
            <input
              type="checkbox"
              className="toggle toggle-primary toggle-sm"
              checked={provider.enabled}
              onChange={() => onToggle(provider)}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-1.5 mt-1 flex-wrap justify-end">
            {onTest && (
              <button
                className="text-xs border border-secondary text-mutedText hover:bg-secondary/20 px-3 py-1 rounded-lg transition-colors font-medium"
                onClick={() => onTest(provider)}
                disabled={testingId === provider.id}
              >
                {testingId === provider.id ? "בודק..." : "בדוק חיבור"}
              </button>
            )}
            {onEdit && (
              <button
                className="text-xs border border-secondary text-primary hover:bg-secondary/30 px-3 py-1 rounded-lg transition-colors font-medium"
                onClick={() => onEdit(provider)}
              >
                ערוך
              </button>
            )}
            {!isDemo && (
              <button
                className={`text-xs border px-3 py-1 rounded-lg transition-colors font-medium ${
                  showSecurity
                    ? "border-primary bg-secondary/30 text-primary"
                    : "border-secondary text-mutedText hover:bg-secondary/20"
                }`}
                onClick={() => setShowSecurity((v) => !v)}
              >
                🔑 אבטחה{provider.connectionMode === "agent" ? " ו-Agent" : ""}
              </button>
            )}
            {onDelete && (
              <>
                {showDeleteConfirm === provider.id ? (
                  <div className="flex gap-1">
                    <button
                      className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors font-medium"
                      onClick={() => onConfirmDelete(provider.id)}
                    >
                      מחק
                    </button>
                    <button
                      className="text-xs border border-secondary text-mutedText hover:bg-secondary/20 px-3 py-1 rounded-lg transition-colors font-medium"
                      onClick={() => setShowDeleteConfirm(null)}
                    >
                      ביטול
                    </button>
                  </div>
                ) : (
                  <button
                    className="text-xs border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors font-medium"
                    onClick={() => setShowDeleteConfirm(provider.id)}
                  >
                    מחק
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Security & agent management */}
      {showSecurity && !isDemo && <ProviderSecurityPanel provider={provider} />}
    </div>
  );
}
