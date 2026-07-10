import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "../../../../lib/agentAuth";
import { recordResponse } from "../../../../lib/agentRelay";

export const dynamic = "force-dynamic";

/** The agent's answer to a claimed request — completes the relay round trip. */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const agentKey = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const agentId = request.headers.get("x-tiket-agent-id");

  const agent = await authenticateAgent(agentId, agentKey);
  if (!agent) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const requestId = typeof body.request_id === "string" ? body.request_id : "";
  const httpStatus = Number(body.http_status);
  const responseBody = typeof body.body === "string" ? body.body : "";
  if (!requestId || !Number.isInteger(httpStatus) || httpStatus < 100 || httpStatus > 599) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (responseBody.length > 64 * 1024) {
    return NextResponse.json({ error: "response_too_large" }, { status: 413 });
  }

  const ok = await recordResponse(requestId, agent.agentId, httpStatus, responseBody);
  if (!ok) return NextResponse.json({ error: "not_your_request" }, { status: 409 });

  return NextResponse.json({ ok: true });
}
