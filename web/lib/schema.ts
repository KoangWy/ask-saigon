import { z } from "zod";

export const PlaceSchema = z.object({
  id: z.string(), name: z.string(), category: z.string(), district: z.string(),
  address: z.string(), lat: z.number(), lng: z.number(),
  photo_url: z.string().nullable(), open_now: z.boolean().nullable(), closes_at: z.string().nullable(),
  price_range: z.string().nullable(), distance_m: z.number().nullable(), maps_url: z.string(),
  source: z.string(), checked_at: z.string(), data_source: z.enum(["kho", "google"]), hours_note: z.string(),
});
export type Place = z.infer<typeof PlaceSchema>;

export const StopSchema = z.object({ place_id: z.string(), name: z.string(), arrive: z.string(), leave: z.string(), est_cost: z.number() });
export const LegSchema = z.object({ from: z.string(), to: z.string(), mode: z.enum(["walking", "driving"]), minutes: z.number(), distance_m: z.number(), estimated: z.literal(true) });
export const ItinerarySchema = z.object({ date: z.string(), days: z.array(z.object({ date: z.string().optional(), stops: z.array(StopSchema), legs: z.array(LegSchema) })), total_cost: z.number(), budget: z.number().nullable() });
export type Itinerary = z.infer<typeof ItinerarySchema>;

export const BlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("place_cards"), places: z.array(PlaceSchema) }),
  ItinerarySchema.extend({ type: z.literal("itinerary") }),
  z.object({ type: z.literal("tiktok_result"), tiktok_url: z.string(), video_title: z.string().nullable(), thumbnail_url: z.string().nullable(), extracted_name: z.string().nullable(), status: z.enum(["found", "not_found", "need_more_info"]), reason: z.enum(["closed_permanently", "no_match", "no_name", "unreadable"]).optional(), place: PlaceSchema.nullable() }),
  z.object({ type: z.literal("menu_translation"), items: z.array(z.object({ name_vi: z.string(), name_en: z.string(), how_to_eat: z.string(), tags: z.array(z.string()), price: z.number().nullable(), order_phrase_vi: z.string() })) }),
  z.object({ type: z.literal("price_check"), item: z.string(), reference_min: z.number(), reference_max: z.number(), user_price: z.number(), verdict: z.enum(["fair", "a_bit_high", "too_high"]), tip: z.string(), source: z.string(), checked_at: z.string() }),
  z.object({ type: z.literal("context_prompt"), question: z.string(), options: z.array(z.string()) }),
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
    z.object({ kind: z.literal("image"), media_type: z.enum(["image/jpeg", "image/png", "image/webp"]), data_b64: z.string(), text: z.string().max(500).optional() }),
    z.object({ kind: z.literal("sim"), sim: z.enum(["rain", "late40", "arrive_ben_thanh", "budget_near"]) }),
    z.object({ kind: z.literal("group_vote") }), z.object({ kind: z.literal("story"), place_id: z.string() }),
    z.object({ kind: z.literal("edit_plan"), add: z.string().optional(), remove: z.string().optional() }),
    z.object({ kind: z.literal("context_reply"), option: z.enum(["nearby", "not_yet", "something_cool"]) }),
  ]),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string() })).max(10),
  state: z.object({ lang: z.enum(["en", "vi"]), location: z.object({ lat: z.number(), lng: z.number(), label: z.string(), source: z.enum(["gps", "picked"]) }), now: z.string(), itinerary: ItinerarySchema.optional(), budget_cap: z.number().optional(), offline: z.boolean() }),
  session_id: z.string().optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
