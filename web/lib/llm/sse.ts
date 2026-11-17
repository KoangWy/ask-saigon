/**
 * Reads an SSE body and yields each event's `data:` payload. Multi-line data is joined,
 * comments/other fields ignored, and `[DONE]` ends the stream. `onChunk` restarts the
 * caller's inactivity timer, so a slow but chatty model is never mistaken for a hung one.
 */
export async function* readSseData(body: ReadableStream<Uint8Array>, onChunk?: () => void): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let data: string[] = [];
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      onChunk?.();
      buffer += decoder.decode(value, { stream: true });
      let nl = buffer.search(/\r\n|\r|\n/);
      // A trailing \r may be half of a \r\n split across reads.
      while (nl !== -1 && !(nl === buffer.length - 1 && buffer.endsWith('\r'))) {
        const line = buffer.slice(0, nl);
        const sep = buffer.startsWith('\r\n', nl) ? 2 : 1;
        buffer = buffer.slice(nl + sep);
        if (line === '') {
          if (data.length) {
            const payload = data.join('\n');
            data = [];
            if (payload === '[DONE]') return;
            yield payload;
          }
        } else if (line.startsWith('data:')) {
          data.push(line.slice(5).replace(/^ /, ''));
        }
        nl = buffer.search(/\r\n|\r|\n/);
      }
    }
    if (buffer.startsWith('data:')) data.push(buffer.slice(5).replace(/^ /, ''));
    const payload = data.join('\n');
    if (payload && payload !== '[DONE]') yield payload;
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}
