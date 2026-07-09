import { NextRequest, NextResponse } from "next/server";
import ogs from "open-graph-scraper";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    const options = { url };
    const { error, result } = await ogs(options);

    if (error) {
      return NextResponse.json({ error: "Failed to scrape URL metadata" }, { status: 500 });
    }

    const preview = {
      title: result.ogTitle || result.twitterTitle || "",
      description: result.ogDescription || result.twitterDescription || "",
      image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || "",
      domain: new URL(url).hostname,
    };

    return NextResponse.json(preview);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
