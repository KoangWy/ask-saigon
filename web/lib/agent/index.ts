import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { OpenAICompatible, type Message } from '../llm/openai-compatible';
import { primaryConfig } from '../llm/config';
import { type ProviderConfig } from '../llm/types';
import { searchPlaces, checkPlaceLive, readTiktok, getPriceReference, planItinerary, getStory, getPlaceDetails, getWeather, findRoutes, travelEstimateBetween } from '../tools';
import { type Block, type ChatRequest, type Place, type Reply } from '../schema';
import { replyLanguage, outsideArea } from './language';
import { sanitizeReplyText, compactToolResult } from './format';
import { SYSTEM_PROMPT } from './prompt';
import { defs, tools, type ToolName } from './tools';
import { TIKTOK_FOUND_SAMPLE_URL } from '../tiktok-samples';
import { priceAnswer } from '../fastpath';

// Up to 4 tool rounds, with the last turn reserved for the model's final reply (no tools offered).
const MAX_ROUNDS = 5;
const MAX_CARDS = 5;

export type AgentEvent = { type: 'delta'; text: string } | { type: 'final'; reply: Reply };

function tiktokFoundReply(place: Place, lang: 'en' | 'vi') {
  const open = place.open_now === true ? (lang === 'vi' ? `đang mở${place.closes_at ? ` đến ${place.closes_at}` : ''}` : `open now${place.closes_at ? ` until ${place.closes_at}` : ''}`) : place.open_now === false ? (lang === 'vi' ? 'hiện đã đóng' : 'currently closed') : '';
  return lang === 'vi' ? `Video này là ${place.name} tại ${place.address}${open ? `, ${open}` : ''}.` : `That video is ${place.name} at ${place.address}${open ? `, ${open}` : ''}.`;
}

// Only for a menu photo (sending the image twice is wasteful) and for a timed-out final turn
// after tools already succeeded: ship the cards with one honest line instead of failing.
function shortLine(blocks: Block[], lang: 'en' | 'vi'): string {
  const has = (t: Block['type']) => blocks.some(b => b.type === t);
  if (has('menu_translation')) return lang === 'vi' ? 'Đây là thực đơn đã dịch từng món, kèm câu để gọi món.' : 'Here is the menu, dish by dish, with a phrase to order each one.';
  if (has('itinerary')) return lang === 'vi' ? 'Đây là lịch trình đề xuất, xếp theo giờ mở cửa đã kiểm.' : 'Here is a suggested plan, built around checked opening times.';
  if (has('story')) return lang === 'vi' ? 'Đây là câu chuyện về địa điểm này.' : 'Here is the story behind this place.';
  if (has('price_check')) return lang === 'vi' ? 'Đây là mức giá tham khảo có nguồn.' : 'Here is the reference price and where it comes from.';
  if (has('route_cards')) return lang === 'vi' ? 'Đây là các lộ trình do người đã đi đăng.' : 'Here are routes posted by travellers who walked them.';
  return lang === 'vi' ? 'Đây là những gì mình tìm được trong dữ liệu đã kiểm.' : 'Here is what I found in the checked data.';
}

/**
 * Runs one turn and streams the model's text as deltas, then emits the single authoritative
 * Reply. The client replaces the streamed text with `final.reply_text` because post-processing
 * (card dedup, TikTok lead, sanitizeReplyText) can change it.
 */
export async function* streamAgent(request: ChatRequest): AsyncGenerator<AgentEvent> {
  const lang = replyLanguage(request);
  const ctx = { location: request.state.location, now: new Date(request.state.now), lang };
  const input = request.input;
  const userText = input.kind === 'text' ? input.text : '';
  const replies = lang === 'vi' ? ['Gần đây', 'Lên lịch một ngày'] : ['Nearby', 'Plan my day'];
  const final = (reply: Reply): AgentEvent => ({ type: 'final', reply });
  if (userText && outsideArea(userText)) { yield final({ reply_text: lang === 'vi' ? 'Demo chỉ hỗ trợ Quận 1 và Quận 3 TP.HCM. Bạn muốn khám phá khu vực này không?' : 'This demo only covers District 1 and District 3 in Ho Chi Minh City. Would you like suggestions there?', blocks: [], quick_replies: replies, simulated: false, fallback: false, source: 'rules' }); return; }
  if (input.kind === 'sample' && input.sample_id === 'tiktok-found') {
    const video = await readTiktok(TIKTOK_FOUND_SAMPLE_URL);
    const videoPlace = checkPlaceLive({ name: video.author_name || 'Bánh mì Huynh Hoa' }, ctx);
    if (!videoPlace.found || videoPlace.business_status !== 'operational' || !videoPlace.place) throw new Error('TikTok sample place could not be verified');
    const place = videoPlace.place;
    const blocks: Block[] = [{ type: 'tiktok_result', tiktok_url: video.url, video_title: video.title, thumbnail_url: video.thumbnail_url || null, extracted_name: place.name, status: 'found', place }, { type: 'place_cards', places: [place] }];
    yield final({ reply_text: sanitizeReplyText(tiktokFoundReply(place, lang)), blocks, quick_replies: replies, simulated: false, fallback: false, source: 'agent' });
    return;
  }
  const directPrice = priceAnswer(request, 'agent');
  if (directPrice) { yield final(directPrice); return; }

  let content: unknown = input.kind === 'text' ? input.text : input.kind === 'image' ? [{ type: 'text', text: input.text ?? 'Translate this menu.' }, { type: 'image_url', image_url: { url: `data:${input.media_type};base64,${input.data_b64}` } }] : JSON.stringify(input);
  if (input.kind === 'quick') content = ({ hungry: 'Find a place to eat near me.', tired: 'Find a relaxing place near me.', nearby: 'What is nearby?', plan: 'Plan my day in District 1.' })[input.quick];
  if (input.kind === 'sample') {
    const descriptions: Record<string, string> = { 'tiktok-noname': 'Can you identify the place in this sample TikTok? https://www.tiktok.com/@scout2015/video/6718335390845095173', 'price-cyclo': 'Is 300,000 VND for a one-hour cyclo ride fair?', 'nearby-benthanh': 'What is near Ben Thanh Market?', 'plan-d1-night': 'Plan a day in District 1 with night food and a budget of 800k VND.' };
    content = descriptions[input.sample_id] ?? JSON.stringify(input);
  }
  if (input.kind === 'sample' && (input.sample_id === 'menu-1' || input.sample_id === 'menu-2')) {
    const image = await readFile(join(process.cwd(), 'public', 'samples', `${input.sample_id}.jpg`));
    content = [{ type: 'text', text: 'Translate this sample menu using show_menu_translation.' }, { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image.toString('base64')}` } }];
  }
  const context = `Context: ${JSON.stringify({ ...request.state, lang })}`;
  if (typeof content === 'string') content += `\n${context}`;
  else (content as { type: string; text?: string }[]).push({ type: 'text', text: context });
  // History already carries "[showed places: ids]"; the prompt tells the model to reuse those ids.
  const messages: Message[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...request.history.map(h => ({ role: h.role, content: h.text })), { role: 'user', content }];

  const blocks: Block[] = [];
  let tiktok: Awaited<ReturnType<typeof readTiktok>> | undefined;
  let unreadableTiktok: string | undefined;
  let checked: ReturnType<typeof checkPlaceLive> | undefined;
  const provider = new OpenAICompatible();
  const config: ProviderConfig = primaryConfig();
  const session = zUuid(request.session_id);
  // One deadline for all rounds, kept below the route's 60s maxDuration.
  const imageInput = input.kind === 'image' || (input.kind === 'sample' && input.sample_id.startsWith('menu-'));
  const deadline = Date.now() + Math.min(imageInput ? 55000 : Number(process.env.AGENT_TIMEOUT_MS) || 45000, 55000);
  let text = '';
  let emptyPlan = false;
  let emptySearch = false;

  const finalize = (finalText: string): Reply => {
    if (unreadableTiktok && !tiktok) blocks.unshift({ type: 'tiktok_result', tiktok_url: unreadableTiktok, video_title: null, thumbnail_url: null, extracted_name: null, status: 'need_more_info', reason: 'unreadable', place: null });
    if (tiktok) {
      const found = !!checked?.found && checked.business_status === 'operational' && !!checked.place;
      blocks.unshift({ type: 'tiktok_result', tiktok_url: tiktok.url, video_title: tiktok.title, thumbnail_url: tiktok.thumbnail_url || null, extracted_name: checked?.place?.name ?? null, status: found ? 'found' : checked ? 'not_found' : 'need_more_info', ...(found ? {} : { reason: checked?.business_status === 'closed_permanently' ? 'closed_permanently' as const : checked ? 'no_match' as const : 'no_name' as const }), place: found ? checked!.place : null });
    }
    const cards = blocks.filter((b): b is Extract<Block, { type: 'place_cards' }> => b.type === 'place_cards').flatMap(b => b.places);
    if (cards.length) {
      const unique = [...new Map(cards.map(p => [p.id, p])).values()].slice(0, MAX_CARDS);
      const first = blocks.findIndex(b => b.type === 'place_cards');
      for (let j = blocks.length - 1; j >= 0; j--) if (blocks[j].type === 'place_cards') blocks.splice(j, 1);
      blocks.splice(first, 0, { type: 'place_cards', places: unique });
    }
    const answer = finalText || (emptyPlan ? (lang === 'vi' ? 'Tôi chưa thể lập lịch với giờ mở cửa đã kiểm chứng. Bạn muốn thử lựa chọn khác không?' : "I can't build a plan with verified hours for that yet. Would you like another option?") : emptySearch ? (lang === 'vi' ? 'Tôi chưa tìm thấy địa điểm phù hợp trong dữ liệu. Bạn muốn thử lựa chọn khác không?' : "I couldn't find a matching place in the dataset. Would you like another option?") : (lang === 'vi' ? 'Tôi chưa tìm được thông tin phù hợp. Bạn muốn tìm gì khác?' : "I couldn't find a matching answer. What else would you like to find?"));
    const tiktokFinding = blocks.find((block): block is Extract<Block, { type: 'tiktok_result' }> => block.type === 'tiktok_result' && block.status === 'found' && !!block.place);
    const tiktokLead = tiktokFinding?.place ? sanitizeReplyText(tiktokFoundReply(tiktokFinding.place, lang)) : null;
    const replyText = tiktokLead ?? (sanitizeReplyText(answer, blocks) || (lang === 'vi' ? 'Đây là những gì tôi tìm được.' : "Here's what I found."));
    return { reply_text: replyText, blocks, quick_replies: blocks.at(-1)?.type === 'itinerary' ? (lang === 'vi' ? ['Trời mưa', 'Chia sẻ với nhóm'] : ["It's raining", 'Share with group']) : replies, simulated: false, fallback: false, source: 'agent', meta: { provider: config.label, model: config.model, key: 'server' } };
  };

  const runTool = async (call: { id: string; name: string; arguments: string }): Promise<Message> => {
    try {
      const name = call.name as ToolName;
      if (!(name in defs)) throw new Error('Unknown tool');
      const raw: Record<string, unknown> = JSON.parse(call.arguments);
      defs[name].parse(raw);
      let result: unknown;
      switch (name) {
        case 'search_places': {
          const args = raw as Parameters<typeof searchPlaces>[0];
          let value = searchPlaces(args, ctx);
          // Fallback only when the model's own search found nothing: loosen distance/open filters,
          // never invent categories or drop a dietary tag the traveller asked for.
          if (!value.length && (args.radius_m !== undefined || args.open_now !== undefined || (args.categories?.length ?? 0) > 1)) value = searchPlaces({ query: args.query, limit: args.limit, ...(args.tags?.length ? { tags: args.tags } : {}) }, ctx);
          result = value;
          if (value.length) blocks.push({ type: 'place_cards', places: value });
          else emptySearch = true;
          break;
        }
        case 'check_place_live': {
          const value = checkPlaceLive(raw as Parameters<typeof checkPlaceLive>[0], ctx);
          checked = value;
          result = value;
          if (value.found && value.business_status === 'operational' && value.place) blocks.push({ type: 'place_cards', places: [value.place] });
          break;
        }
        case 'read_tiktok':
          try { tiktok = await readTiktok(String(raw.url)); result = tiktok; }
          catch { unreadableTiktok = String(raw.url); result = { error: 'TikTok could not be read' }; }
          break;
        case 'get_price_reference': {
          const value = getPriceReference(raw as Parameters<typeof getPriceReference>[0], ctx.lang);
          result = value;
          if (value.found && 'verdict' in value) blocks.push({ type: 'price_check', ...value });
          break;
        }
        case 'plan_itinerary': {
          const value = planItinerary(raw as Parameters<typeof planItinerary>[0], ctx);
          result = value;
          if (value.days.some(day => day.stops.length)) blocks.push({ type: 'itinerary', ...value });
          else emptyPlan = true;
          break;
        }
        case 'get_story': {
          const value = getStory(String(raw.place_id), ctx.lang);
          result = value;
          if (value) blocks.push(value);
          break;
        }
        case 'show_menu_translation': {
          const menu = defs.show_menu_translation.parse(raw);
          menu.items = menu.items.map(item => ({ ...item, price: item.price !== null && item.price >= 1000 ? Math.round(item.price / 1000) : item.price }));
          result = menu;
          blocks.push(menu);
          break;
        }
        case 'get_place_details': {
          const value = getPlaceDetails(String(raw.place_id), ctx);
          result = value;
          if (value.found) blocks.push({ type: 'place_cards', places: [value.place] });
          break;
        }
        case 'get_weather': result = await getWeather(ctx.now); break;
        case 'find_routes': {
          const value = await findRoutes(String(raw.query ?? ''), ctx.lang, request.client_id);
          result = value;
          if (value.routes.length) blocks.push({ type: 'route_cards', routes: value.routes });
          break;
        }
        case 'travel_estimate': {
          const value = travelEstimateBetween(String(raw.from), String(raw.to), ctx);
          result = value;
          if (value.found && value.place) blocks.push({ type: 'place_cards', places: [value.place] });
          break;
        }
      }
      return { role: 'tool' as const, tool_call_id: call.id, content: JSON.stringify(compactToolResult(name, result)) };
    } catch {
      return { role: 'tool' as const, tool_call_id: call.id, content: JSON.stringify({ error: 'Invalid or unavailable tool result' }) };
    }
  };

  let finalText = '';
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const calls: { id: string; name: string; arguments: string }[] = [];
    let roundText = '';
    try {
      // After tool results the model should only write the reply; cap that turn to reply size.
      const maxTokens = messages.at(-1)?.role === 'tool' ? 500 : 1200;
      // On the last turn remove tools so a model that kept searching must write the final reply.
      const stream = provider.streamTurn(messages, round === MAX_ROUNDS - 1 ? [] : tools, session, AbortSignal.timeout(Math.max(1000, deadline - Date.now())), maxTokens, config);
      for await (const event of stream) {
        if (event.type === 'delta') { text += event.text; roundText += event.text; yield { type: 'delta', text: event.text }; }
        else if (event.type === 'tool_call') calls.push(event.call);
      }
    } catch (error) {
      // A timed-out final text turn still has cards from earlier rounds; return those, not a 500.
      if (blocks.length) { yield final(finalize(shortLine(blocks, lang))); return; }
      throw error;
    }
    messages.push({ role: 'assistant', content: roundText || null, tool_calls: calls.length ? calls.map(c => ({ id: c.id, type: 'function', function: { name: c.name, arguments: c.arguments } })) : undefined });
    if (!calls.length) { finalText = roundText; break; }
    const results = await Promise.all(calls.map(runTool));
    messages.push(...results);
    if (blocks.some(b => b.type === 'menu_translation')) {
      // The photo is already in the first message; another text turn would resend the image.
      finalText = shortLine(blocks, lang);
      break;
    }
  }
  // Rounds exhausted on tool calls (a flash model can keep re-searching): still ship the cards with
  // one honest line rather than the empty-answer fallback.
  yield final(finalize(finalText || (blocks.length ? shortLine(blocks, lang) : text)));
}

// Non-streaming wrapper kept for the JSON route, eval scripts and existing callers/tests.
export async function runAgent(request: ChatRequest): Promise<Reply> {
  for await (const event of streamAgent(request)) if (event.type === 'final') return event.reply;
  throw new Error('Agent produced no reply');
}

function zUuid(value: string | undefined): string {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value ?? '') ? value! : randomUUID();
}
