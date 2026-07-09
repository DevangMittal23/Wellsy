import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { roomName, conversationId, callType } = body;

    if (!roomName || !conversationId) {
      return NextResponse.json(
        { error: "Missing roomName or conversationId" },
        { status: 400 }
      );
    }

    // Verify user is a participant of this conversation
    const { data: participant, error: pError } = await supabase
      .from("participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (pError || !participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "LiveKit server credentials not configured" },
        { status: 500 }
      );
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      ttl: "1h",
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    return NextResponse.json({ token });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
