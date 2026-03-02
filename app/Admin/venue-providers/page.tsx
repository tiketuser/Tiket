"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import NavBar from "../../components/NavBar/NavBar";
import Footer from "../../components/Footer/Footer";
import AdminProtection from "../../components/AdminProtection/AdminProtection";

export const dynamic = "force-dynamic";

interface VenueProvider {
  id: string;
  name: string;
  type: "real" | "builtin_demo";
  baseUrl: string;
  verifyEndpoint: string;
  authType: "bearer" | "header" | "query";
  authHeaderName: string;
  hasPrimaryKey: boolean;
  secondaryCredentialHeaderName?: string;
  hasSecondaryKey: boolean;
  requestBodyTemplate: string;
  responseValidField: string;
  barcodePattern?: string;
  enabled: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
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
  { key: "{{venue}}", desc: "שם האולם" },
  { key: "{{date}}", desc: "תאריך (DD/MM/YYYY)" },
  { key: "{{time}}", desc: "שעה (HH:MM)" },
  { key: "{{section}}", desc: "יציע / קטע" },
  { key: "{{row}}", desc: "שורה" },
  { key: "{{seat}}", desc: "מושב" },
];

const EMPTY_FORM = {
  name: "",
  baseUrl: "",
  verifyEndpoint: "/tickets/verify",
  authType: "bearer" as "bearer" | "header" | "query",
  authHeaderName: "Authorization",
  apiKey: "",
  secondaryCredentialHeaderName: "",
  secondaryKey: "",
  requestBodyTemplate: DEFAULT_REQUEST_TEMPLATE,
  responseValidField: "valid",
  barcodePattern: "",
  enabled: true,
  notes: "",
};

type FormState = typeof EMPTY_FORM;

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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { status: number | null; ok: boolean | null; error?: string }>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) { setMessage({ type: "error", text: "לא מחובר" }); setLoading(false); return; }
      const res = await fetch("/api/admin/venue-providers", {
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

  const handleToggleEnabled = async (provider: VenueProvider) => {
    const token = await getIdToken();
    const res = await fetch("/api/admin/venue-providers", {
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
      baseUrl: provider.baseUrl,
      verifyEndpoint: provider.verifyEndpoint,
      authType: provider.authType as FormState["authType"],
      authHeaderName: provider.authHeaderName,
      apiKey: "",
      secondaryCredentialHeaderName: provider.secondaryCredentialHeaderName || "",
      secondaryKey: "",
      requestBodyTemplate: provider.requestBodyTemplate,
      responseValidField: provider.responseValidField,
      barcodePattern: provider.barcodePattern || "",
      enabled: provider.enabled,
      notes: provider.notes || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    const token = await getIdToken();
    const res = await fetch(`/api/admin/venue-providers?id=${id}`, {
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
      const res = await fetch("/api/venue-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          artist: "TEST",
          venue: "TEST",
          date: "01/01/2000",
          _testProviderId: provider.id,
        }),
      });
      setTestResult((prev) => ({ ...prev, [provider.id]: { status: res.status, ok: res.status < 500 } }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setTestResult((prev) => ({ ...prev, [provider.id]: { status: null, ok: false, error: msg } }));
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
      const res = await fetch("/api/admin/venue-providers", {
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
  };

  const demoProvider = providers.find((p) => p.type === "builtin_demo");
  const realProviders = providers.filter((p) => p.type !== "builtin_demo");
  const enabledCount = realProviders.filter((p) => p.enabled).length;

  return (
    <AdminProtection>
      <div className="min-h-screen bg-white" dir="rtl">
        <NavBar />

        <main className="max-w-4xl mx-auto px-4 py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-heading-4-desktop font-bold text-primary mb-2">
              ניהול ספקי API לאימות כרטיסים
            </h1>
            <p className="text-text-small text-mutedText max-w-xl mx-auto leading-relaxed">
              הגדר את מערכות הכרטוס של האולמות שאתה עובד איתם.
              כשמשתמש מעלה כרטיס, המערכת תשלח את פרטיו לכל ספק פעיל ותקבל אישור אם הכרטיס אמיתי.
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

          {/* Add provider button */}
          {!showForm && (
            <div className="mb-6">
              <button
                className="bg-primary hover:bg-highlight text-white font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-xsmall"
                onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
              >
                + הוסף ספק API חדש
              </button>
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
                      <input
                        className="w-full border border-secondary rounded-xl px-3 py-2 text-sm text-strongText focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="שם הספק *" hint="שם תצוגה — למשל: Leaan, Eventim, Ticketmaster">
                      <StyledInput
                        required
                        placeholder="Leaan"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </Field>
                    <Field label="Base URL *" hint="כתובת הבסיס של ה-API. לדוגמה: https://api.leaan.co.il/v1">
                      <StyledInput
                        required
                        dir="ltr"
                        placeholder="https://api.leaan.co.il/v1"
                        value={form.baseUrl}
                        onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
                      />
                    </Field>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Endpoint לאימות *" hint="הנתיב שמוסיפים לBase URL לאימות. לדוגמה: /tickets/verify">
                      <StyledInput
                        required
                        dir="ltr"
                        placeholder="/tickets/verify"
                        value={form.verifyEndpoint}
                        onChange={(e) => setForm((f) => ({ ...f, verifyEndpoint: e.target.value }))}
                      />
                    </Field>
                    <Field label="שדה תקינות בתשובה *" hint="מה שם השדה בתשובת ה-API שמציין שהכרטיס תקין? לדוגמה: valid / is_valid / verified">
                      <StyledInput
                        required
                        dir="ltr"
                        placeholder="valid"
                        value={form.responseValidField}
                        onChange={(e) => setForm((f) => ({ ...f, responseValidField: e.target.value }))}
                      />
                    </Field>
                  </div>

                  {/* Row 3 — Auth */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      </select>
                    </Field>
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
                    <Field
                      label={editingId ? "מפתח API (השאר ריק לשמירה)" : "מפתח API *"}
                      hint="המפתח שהספק שלח לכם. יישמר בצורה מאובטחת בנפרד."
                    >
                      <StyledInput
                        required={!editingId}
                        type="password"
                        dir="ltr"
                        placeholder={editingId ? "••••••••" : "sk_live_..."}
                        value={form.apiKey}
                        onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                      />
                    </Field>
                  </div>

                  {/* Row 4 — Secondary credential */}
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

                  {/* Request body template */}
                  <Field
                    label="תבנית גוף הבקשה (Request Body) *"
                    hint="JSON שישלח לספק. השתמש במשתנים {{variable}} שיוחלפו בנתוני הכרטיס."
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

                  {/* Row 5 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                      label="תבנית זיהוי ברקוד (אופציונלי)"
                      hint="Regex לזיהוי אוטומטי של הספק לפי פורמט ברקוד. לדוגמה: ^978 יתאים לכרטיסים שמתחילים ב-978."
                    >
                      <StyledInput
                        dir="ltr"
                        placeholder="^978"
                        className="font-mono"
                        value={form.barcodePattern}
                        onChange={(e) => setForm((f) => ({ ...f, barcodePattern: e.target.value }))}
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
                      placeholder="פנה ל partnerships@leaan.co.il לחידוש מפתח, חוזה עד 31/12/2025, Rate limit: 1000 בקשות/שעה"
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
            <h3 className="font-semibold text-primary mb-3 text-sm">משתני תבנית זמינים לגוף הבקשה</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {TEMPLATE_VARS.map(({ key, desc }) => (
                <div key={key} className="text-xs">
                  <code className="font-mono bg-secondary/40 text-primary px-1.5 py-0.5 rounded">{key}</code>
                  <span className="text-mutedText mr-1"> — {desc}</span>
                </div>
              ))}
            </div>
          </div>
        </main>

        <Footer />
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
  testResult?: { status: number | null; ok: boolean | null; error?: string };
  showDeleteConfirm: string | null;
  setShowDeleteConfirm: (id: string | null) => void;
  onConfirmDelete: (id: string) => void;
}) {
  const isDemo = provider.type === "builtin_demo";

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
                <span className="font-semibold text-strongText">URL: </span>
                <span dir="ltr" className="font-mono">{provider.baseUrl}{provider.verifyEndpoint}</span>
              </div>
              <div>
                <span className="font-semibold text-strongText">Auth: </span>
                <span dir="ltr" className="font-mono">
                  {provider.authType === "bearer"
                    ? "Bearer Token"
                    : provider.authType === "header"
                    ? `Header: ${provider.authHeaderName}`
                    : `Query: ?${provider.authHeaderName}=…`}
                </span>
              </div>
              {provider.hasPrimaryKey && (
                <div>
                  <span className="font-semibold text-strongText">מפתח: </span>
                  <span dir="ltr" className="font-mono text-mutedText">••••••••</span>
                  {provider.hasSecondaryKey && (
                    <span dir="ltr" className="font-mono text-mutedText mr-3">
                      {" + "}
                      {provider.secondaryCredentialHeaderName}: ••••••••
                    </span>
                  )}
                </div>
              )}
              {provider.barcodePattern && (
                <div>
                  <span className="font-semibold text-strongText">ברקוד: </span>
                  <code dir="ltr" className="font-mono text-primary bg-secondary/30 px-1 rounded">
                    {provider.barcodePattern}
                  </code>
                </div>
              )}
              {provider.notes && (
                <div className="text-mutedText mt-1 italic">{provider.notes}</div>
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
              className={`mt-2 text-xs px-2.5 py-1 rounded-lg inline-block font-medium ${
                testResult.ok
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {testResult.ok
                ? `✓ מחובר (HTTP ${testResult.status})`
                : `✗ ${testResult.error || `HTTP ${testResult.status}`}`}
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
    </div>
  );
}
