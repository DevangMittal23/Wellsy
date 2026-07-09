import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const limit = searchParams.get("limit") || "20";

    const apiKey = process.env.TENOR_API_KEY;
    if (!apiKey || apiKey === "your_tenor_api_key") {
      // Mock premium quality GIFs for local dev experience without a key
      const mockGifs = [
        {
          id: "mock_cat",
          title: "Cat keyboard",
          url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3k4aDN6MmtyZWt6NHQ1bDNwZ3dpcG1rMWd4ZDR6eWZxd3pqejE2eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Cbx4j02mlj32M/giphy.gif",
          preview: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3k4aDN6MmtyZWt6NHQ1bDNwZ3dpcG1rMWd4ZDR6eWZxd3pqejE2eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Cbx4j02mlj32M/giphy.gif",
        },
        {
          id: "mock_dog",
          title: "Dog excited",
          url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDVtc2VwYzg0aTRtM2w5aXRpdmtyaDVldWFyeWNjOXB5cGw1cndjNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/oD3lTi5Vx8OWc/giphy.gif",
          preview: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDVtc2VwYzg0aTRtM2w5aXRpdmtyaDVldWFyeWNjOXB5cGw1cndjNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/oD3lTi5Vx8OWc/giphy.gif",
        },
        {
          id: "mock_wow",
          title: "Mind blown",
          url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2R4OTBndXB6Nm51MnZ5eW84cXBpcDNzNmxqd2g1cjJvMXp0Zm9ubCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lXu72d4iK3giI/giphy.gif",
          preview: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2R4OTBndXB6Nm51MnZ5eW84cXBpcDNzNmxqd2g1cjJvMXp0Zm9ubCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lXu72d4iK3giI/giphy.gif",
        },
        {
          id: "mock_thumbs",
          title: "Thumbs up",
          url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZndjNTR6ZTVzbmw4Z3NqZ3drMnU0MnFldWV2NWc5cDh2anR6amFmdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XreQmk7ETCak0/giphy.gif",
          preview: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZndjNTR6ZTVzbmw4Z3NqZ3drMnU0MnFldWV2NWc5cDh2anR6amFmdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XreQmk7ETCak0/giphy.gif",
        }
      ];
      
      const filtered = q
        ? mockGifs.filter((gif) => gif.title.toLowerCase().includes(q.toLowerCase()))
        : mockGifs;

      return NextResponse.json({ results: filtered });
    }

    const tenorUrl = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(
      q
    )}&key=${apiKey}&limit=${limit}&client_key=huddang`;

    const res = await fetch(tenorUrl);
    if (!res.ok) {
      throw new Error(`Tenor API responded with status ${res.status}`);
    }

    const data = await res.json();

    const gifs = (data.results || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      url: item.media_formats?.gif?.url || item.media_formats?.tinygif?.url || "",
      preview: item.media_formats?.tinygif?.url || "",
    }));

    return NextResponse.json({ results: gifs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
