// Cloudflare Pages Function.
// Deployed automatically at /proxy on your Pages domain, e.g.
// https://receptladan.pages.dev/proxy?url=https://www.koket.se/...
//
// It fetches the target URL server-side (from Cloudflare's network,
// which real sites rarely block) and returns it with permissive CORS
// headers so the app running in the browser can read it.

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const target = searchParams.get("url");

  if (!target) {
    return new Response("Saknar url-parameter", { status: 400 });
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch (e) {
    return new Response("Ogiltig url", { status: 400 });
  }
  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return new Response("Ogiltigt protokoll", { status: 400 });
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8"
      },
      redirect: "follow"
    });

    const body = await upstream.arrayBuffer();

    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    return new Response("Kunde inte hämta sidan: " + err.message, { status: 502 });
  }
}
