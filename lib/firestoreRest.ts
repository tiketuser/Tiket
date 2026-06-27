import { CapacitorHttp } from "@capacitor/core";
import { isNative } from "./platform";

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

interface QueryResponseItem {
  document?: FirestoreDocument;
}

function extractValue(v: FirestoreValue): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(extractValue);
  if ("mapValue" in v) {
    const result: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v.mapValue.fields ?? {})) {
      result[k] = extractValue(val);
    }
    return result;
  }
  return undefined;
}

function toFirestoreValue(v: unknown): FirestoreValue {
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v)
      ? { integerValue: String(v) }
      : { doubleValue: v };
  }
  if (v === null) return { nullValue: null };
  throw new Error(`Unsupported Firestore value type: ${typeof v}`);
}

export interface RestFilter {
  field: string;
  op:
    | "EQUAL"
    | "LESS_THAN"
    | "GREATER_THAN"
    | "LESS_THAN_OR_EQUAL"
    | "GREATER_THAN_OR_EQUAL"
    | "NOT_EQUAL";
  value: unknown;
}

export interface RestDoc {
  id: string;
  data: Record<string, unknown>;
}

export async function firestoreRestQuery(opts: {
  collection: string;
  filters?: RestFilter[];
  limit?: number;
}): Promise<RestDoc[]> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId || !apiKey) {
    throw new Error("Firebase project ID or API key not configured");
  }

  const filters = opts.filters ?? [];
  const fieldFilters = filters.map((f) => ({
    fieldFilter: {
      field: { fieldPath: f.field },
      op: f.op,
      value: toFirestoreValue(f.value),
    },
  }));

  const structuredQuery: Record<string, unknown> = {
    from: [{ collectionId: opts.collection }],
  };
  if (fieldFilters.length === 1) {
    structuredQuery.where = fieldFilters[0];
  } else if (fieldFilters.length > 1) {
    structuredQuery.where = {
      compositeFilter: { op: "AND", filters: fieldFilters },
    };
  }
  if (opts.limit) structuredQuery.limit = opts.limit;

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
  const body = { structuredQuery };

  let items: QueryResponseItem[];
  if (isNative()) {
    const resp = await CapacitorHttp.request({
      method: "POST",
      url,
      headers: { "Content-Type": "application/json" },
      data: body,
    });
    if (resp.status >= 400) {
      const text =
        typeof resp.data === "string" ? resp.data : JSON.stringify(resp.data);
      throw new Error(
        `Firestore REST query failed: HTTP ${resp.status} ${text.slice(0, 300)}`,
      );
    }
    items = Array.isArray(resp.data)
      ? (resp.data as QueryResponseItem[])
      : typeof resp.data === "string"
        ? (JSON.parse(resp.data) as QueryResponseItem[])
        : [];
  } else {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Firestore REST query failed: HTTP ${res.status} ${text.slice(0, 300)}`,
      );
    }
    items = (await res.json()) as QueryResponseItem[];
  }

  return items
    .filter((item) => item.document)
    .map((item) => {
      const doc = item.document!;
      const id = doc.name.split("/").pop() ?? "";
      const data: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(doc.fields ?? {})) {
        data[k] = extractValue(v);
      }
      return { id, data };
    });
}
