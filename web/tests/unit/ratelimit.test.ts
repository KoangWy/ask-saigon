import { describe, expect, it, vi } from 'vitest';
import { allowAi } from '../../lib/ratelimit';
describe('rate limiting',()=>{it('enforces the per-IP window and resets after ten minutes',()=>{vi.stubEnv('AI_DAILY_CAP','300');const now=Date.parse('2026-10-30T01:00:00Z');for(let i=0;i<15;i++)expect(allowAi('rate-test',now)).toBe(true);expect(allowAi('rate-test',now)).toBe(false);expect(allowAi('rate-test',now+600001)).toBe(true);vi.unstubAllEnvs();});});
