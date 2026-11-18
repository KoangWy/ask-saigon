// Minimal SSE reader for POST responses (EventSource cannot POST). Each `data:` frame is parsed
// as JSON and handed to onEvent; aborting the fetch aborts the reader too.
export type ChatStreamEvent = { type: 'delta' | 'step' | 'final' | 'error'; text?: string; step?: { id: string; label: string; status: 'running' | 'done' | 'error'; summary?: string; ephemeral?: boolean; lang?: 'en' | 'vi' }; reply?: unknown; message?: string };

export async function readChatStream(response: Response, onEvent: (event: ChatStreamEvent) => void): Promise<void> {
  if (!response.body) throw new Error('No response body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let data: string[] = [];
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl = buffer.search(/\r\n|\r|\n/);
      while (nl !== -1 && !(nl === buffer.length - 1 && buffer.endsWith('\r'))) {
        const line = buffer.slice(0, nl);
        const sep = buffer.startsWith('\r\n', nl) ? 2 : 1;
        buffer = buffer.slice(nl + sep);
        if (line === '') {
          if (data.length) {
            const payload = data.join('\n');
            data = [];
            if (payload !== '[DONE]') onEvent(JSON.parse(payload) as ChatStreamEvent);
          }
        } else if (line.startsWith('data:')) {
          data.push(line.slice(5).replace(/^ /, ''));
        }
        nl = buffer.search(/\r\n|\r|\n/);
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}
