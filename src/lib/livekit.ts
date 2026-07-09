import { AccessToken } from "livekit-server-sdk";

/**
 * Generate a LiveKit room access token for a user.
 * Server-side only — uses secret API key/secret from env.
 */
export async function generateLiveKitToken(
  userId: string,
  roomName: string
): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit API key and secret are not configured");
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    ttl: "1h",
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return await at.toJwt();
}
