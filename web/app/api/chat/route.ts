import { ChatRequestSchema, ReplySchema, type ChatRequest, type Reply } from '../../../lib/schema';
import { routeChat } from '../../../lib/router';
import { refreshLiveSources } from '../../../lib/contributions';
import { recordChat } from '../../../lib/stats';
export const runtime = 'nodejs';
export const maxDuration = 60;

const encoder = new TextEncoder();
const send = (controller: ReadableStreamDefaultController<Uint8Array>, event: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

// SSE path: token deltas and tool progress steps as they happen, then one authoritative final Reply. Fast/rules/canned
// answers emit no deltas and are sent only as the final event. The JSON path below is unchanged.
function streamChat(request: ChatRequest, ip: string, start: number): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      void (async () => {
        let sentText = false;
        let reply: Reply | undefined;
        try {
          reply = await routeChat(request, ip, event => {
            if (event.type === 'delta') { if (!event.text) return; sentText = true; }
            send(controller, event);
          });
          // Partial streamed text followed by a rule/canned answer means the agent broke mid-reply.
          if (sentText && reply.source !== 'agent') send(controller, { type: 'error', message: 'Live answer interrupted' });
          send(controller, { type: 'final', reply });
        } catch {
          send(controller, { type: 'error', message: 'Live answer failed' });
        } finally {
          controller.close();
          if (reply) await Promise.race([recordChat(request, reply).catch(() => {}), new Promise(r => setTimeout(r, 800))]);
          console.log(JSON.stringify({ event: 'chat', kind: request.input.kind, source: reply?.source ?? 'error', provider: reply?.meta?.provider ?? null, model: reply?.meta?.model ?? null, duration_ms: Date.now() - start, stream: true }));
        }
      })();
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' } });
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (req.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== new URL(req.url).origin)) return Response.json({ error: 'Forbidden' }, { status: 403 });
  if (!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type') ?? '')) return Response.json({ error: 'Unsupported media type' }, { status: 415 });
  if (Number(req.headers.get('content-length') ?? 0) > 5700000) return Response.json({ error: 'Request too large' }, { status: 413 });
  const start = Date.now();
  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 });
  if (parsed.data.input.kind === 'image' && Buffer.from(parsed.data.input.data_b64, 'base64').length > 4 * 1024 * 1024) return Response.json({ error: 'Image too large' }, { status: 413 });
  await refreshLiveSources().catch(() => {});
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (/text\/event-stream/i.test(req.headers.get('accept') ?? '')) return streamChat(parsed.data, ip, start);
  const reply = await routeChat(parsed.data, ip);
  await Promise.race([recordChat(parsed.data, reply).catch(() => {}), new Promise(r => setTimeout(r, 800))]);
  console.log(JSON.stringify({ event: 'chat', kind: parsed.data.input.kind, source: reply.source, provider: reply.meta?.provider ?? null, model: reply.meta?.model ?? null, duration_ms: Date.now() - start }));
  return Response.json(ReplySchema.parse(reply));
}
