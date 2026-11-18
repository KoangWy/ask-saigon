import { z } from "zod";

// Who supplied a piece of information: the city, the business itself, a traveller, or a third-party guide.
export const SourceLabelSchema = z.enum(["chinh_thuc", "doanh_nghiep", "ca_nhan", "tham_khao"]);
export type SourceLabel = z.infer<typeof SourceLabelSchema>;
export const SourceLineSchema = z.object({ label: SourceLabelSchema, source: z.string(), checked_at: z.string(), note: z.string().optional() });
export type SourceLine = z.infer<typeof SourceLineSchema>;

export const PlaceSchema = z.object({
  id: z.string(), name: z.string(), category: z.string(), district: z.string(),
  address: z.string(), lat: z.number(), lng: z.number(),
  photo_url: z.string().nullable(), open_now: z.boolean().nullable(), closes_at: z.string().nullable(),
  price_range: z.string().nullable(), distance_m: z.number().nullable(), maps_url: z.string(),
  source: z.string(), checked_at: z.string(), data_source: z.enum(["kho", "google"]), hours_note: z.string(),
  label: SourceLabelSchema.optional(), sources: z.array(SourceLineSchema).optional(), open_24h: z.boolean().optional(), stale: z.boolean().optional(),
  status: z.enum(["open", "temporarily_closed"]).optional(), status_note: z.string().optional(), status_checked_at: z.string().optional(),
});
export type Place = z.infer<typeof PlaceSchema>;

export const StopSchema = z.object({ place_id: z.string(), name: z.string(), arrive: z.string(), leave: z.string(), est_cost: z.number() });
export const LegSchema = z.object({ from: z.string(), to: z.string(), mode: z.enum(["walking", "driving"]), minutes: z.number(), distance_m: z.number(), estimated: z.literal(true) });
export const ItinerarySchema = z.object({ date: z.string(), days: z.array(z.object({ date: z.string().optional(), stops: z.array(StopSchema), legs: z.array(LegSchema) })), total_cost: z.number(), budget: z.number().nullable(), must_visit: z.array(z.string()).optional() });
export type Itinerary = z.infer<typeof ItinerarySchema>;
export const RouteSchema = z.object({
  id: z.string(), title: z.string(), author: z.string(), summary: z.string(),
  stops: z.array(z.object({ place_id: z.string(), name: z.string(), note: z.string().optional() })),
  modes: z.array(z.enum(["metro", "bus", "walk", "bike", "motorbike", "car"])), green: z.boolean(),
  rating: z.object({ average: z.number().nullable(), count: z.number() }), status: z.enum(["published", "pending"]), created_at: z.string(),
});
export type Route = z.infer<typeof RouteSchema>;

export const BlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("place_cards"), places: z.array(PlaceSchema) }),
  ItinerarySchema.extend({ type: z.literal("itinerary") }),
  z.object({ type: z.literal("tiktok_result"), tiktok_url: z.string(), video_title: z.string().nullable(), thumbnail_url: z.string().nullable(), extracted_name: z.string().nullable(), status: z.enum(["found", "not_found", "need_more_info"]), reason: z.enum(["closed_permanently", "no_match", "no_name", "unreadable"]).optional(), place: PlaceSchema.nullable() }),
  z.object({ type: z.literal("menu_translation"), items: z.array(z.object({ name_vi: z.string(), name_en: z.string(), how_to_eat: z.string(), tags: z.array(z.string()), price: z.number().nullable(), order_phrase_vi: z.string() })) }),
  z.object({ type: z.literal("price_check"), item: z.string(), reference_min: z.number(), reference_max: z.number(), user_price: z.number(), verdict: z.enum(["fair", "a_bit_high", "too_high"]), tip: z.string(), source: z.string(), checked_at: z.string(), label: SourceLabelSchema.optional(), sources: z.array(SourceLineSchema).optional() }),
  z.object({ type: z.literal("route_cards"), routes: z.array(RouteSchema) }),
  z.object({ type: z.literal("context_prompt"), question: z.string(), options: z.array(z.string()) }),
  z.object({ type: z.literal("live_info"), kind: z.string(), title: z.string(), lines: z.array(z.string()), source: SourceLineSchema }),
  z.object({ type: z.literal("data_gap"), question: z.string() }),
  z.object({ type: z.literal("tips"), items: z.array(z.object({ id: z.string(), topic: z.string(), text: z.string(), source: SourceLineSchema })) }),
  z.object({ type: z.literal("story"), place_id: z.string(), title: z.string(), script: z.string(), look_for: z.string(), source: z.string() }),
  z.object({ type: z.literal("replan"), reason: z.string(), before: z.array(StopSchema), after: z.array(StopSchema), dropped: z.array(StopSchema) }),
  z.object({ type: z.literal("group_vote"), members: z.array(z.string()), votes: z.array(z.object({ place_id: z.string(), member: z.string(), vote: z.enum(["up", "down"]) })), result: z.array(z.string()) }),
  z.object({ type: z.literal("budget"), spent: z.number(), planned: z.number(), cap: z.number(), warning: z.boolean(), cheaper_options: z.array(z.string()) }),
]);
export type Block = z.infer<typeof BlockSchema>;
export const ReplySchema = z.object({ reply_text: z.string(), blocks: z.array(BlockSchema), quick_replies: z.array(z.string()), simulated: z.boolean(), fallback: z.boolean(), source: z.enum(["agent", "rules", "canned"]), meta: z.object({ provider: z.string(), model: z.string(), key: z.enum(["server", "byok"]) }).optional() });
export type Reply = z.infer<typeof ReplySchema>;
export const SampleIdSchema = z.enum(["tiktok-found", "tiktok-noname", "tiktok-closed", "menu-1", "menu-2", "price-cyclo", "nearby-benthanh", "plan-d1-night"]);
export type SampleId = z.infer<typeof SampleIdSchema>;
export const ChatRequestSchema = z.object({
  input: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("text"), text: z.string().max(500) }),
    z.object({ kind: z.literal("sample"), sample_id: SampleIdSchema }),
    z.object({ kind: z.literal("quick"), quick: z.enum(["hungry", "tired", "nearby", "plan"]) }),
    z.object({ kind: z.literal("image"), media_type: z.enum(["image/jpeg", "image/png", "image/webp"]), data_b64: z.base64().max(5592408), text: z.string().max(500).optional() }),
    z.object({ kind: z.literal("sim"), sim: z.enum(["rain", "late40", "arrive_ben_thanh", "budget_near"]), rain: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional() }),
    z.object({ kind: z.literal("group_vote") }), z.object({ kind: z.literal("story"), place_id: z.string() }),
    z.object({ kind: z.literal("edit_plan"), add: z.string().optional(), remove: z.string().optional() }),
    z.object({ kind: z.literal("context_reply"), option: z.enum(["nearby", "not_yet", "something_cool"]) }),
    z.object({ kind: z.literal("follow_route"), route_id: z.string().max(80) }),
  ]),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string() })).max(10),
  state: z.object({ lang: z.enum(["en", "vi"]), location: z.object({ lat: z.number(), lng: z.number(), label: z.string(), source: z.enum(["gps", "picked"]) }), now: z.iso.datetime({ offset: true }), itinerary: ItinerarySchema.optional(), budget_cap: z.number().optional(), offline: z.boolean() }),
  session_id: z.string().optional(),
  client_id: z.string().max(64).optional(),
  partner: z.string().max(40).optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
