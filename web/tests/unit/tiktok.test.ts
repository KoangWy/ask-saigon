import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseTiktokPage } from '../../lib/tools/tiktok';
describe('TikTok metadata',()=>{it('extracts embedded public metadata',()=>{expect(parseTiktokPage(readFileSync('tests/fixtures/tiktok.html','utf8'))).toEqual({title:'Public example caption',author_name:'Example',thumbnail_url:'https://example.com/cover.jpg'});});it('uses the caption fallback and handles escapes',()=>{expect(parseTiktokPage('<script>{"desc":"A \\"quoted\\" caption"}</script>')?.title).toBe('A "quoted" caption');});it('reports a missing caption',()=>{expect(parseTiktokPage('<html></html>')).toBeNull();});});
