import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, verifyAdminToken } from "../../../../lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const { isValid, isAdmin } = await verifyAdminToken(token);
    if (!isValid || !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action, ticketIds, adminComment, concertId } = body;

    if (!action || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const batch = db.batch();

    if (action === "approve") {
      for (const id of ticketIds) {
        batch.update(db.collection("tickets").doc(id), { status: "available" });
      }
    } else if (action === "reject") {
      for (const id of ticketIds) {
        batch.update(db.collection("tickets").doc(id), {
          status: "rejected",
          verificationStatus: "rejected",
          adminComment: adminComment || "הכרטיס נדחה על ידי המנהל",
          rejectedAt: new Date().toISOString(),
        });
      }
    } else if (action === "link") {
      if (!concertId) {
        return NextResponse.json({ error: "Missing concertId for link action" }, { status: 400 });
      }
      for (const id of ticketIds) {
        batch.update(db.collection("tickets").doc(id), { concertId });
      }
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await batch.commit();
    return NextResponse.json({ success: true, updated: ticketIds.length });
  } catch (error) {
    console.error("ticket-action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
