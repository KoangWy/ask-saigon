export type Message = { role: 'system'|'user'|'assistant'|'tool'; content: unknown; tool_call_id?: string; tool_calls?: unknown[] };
export interface LlmProvider { runTurn(messages:Message[],tools:unknown[],sessionId:string,signal:AbortSignal,maxTokens?:number):Promise<{text:string;toolCalls:{id:string;name:string;arguments:string}[];raw:Message;refusal:boolean}>; }
export class OpenAICompatible implements LlmProvider {
 async runTurn(messages:Message[],tools:unknown[],sessionId:string,signal:AbortSignal,maxTokens=1200): ReturnType<LlmProvider["runTurn"]> {
  // Tool-call turns need room for JSON arguments; text turns are capped near a short reply so a
  // rambling flash model cannot spend seconds generating prose the user never reads.
  const response=await fetch(`${(process.env.LLM_BASE_URL??'https://opencode.ai/zen/go/v1').replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.LLM_API_KEY??''}`,'x-opencode-session':sessionId},body:JSON.stringify({model:process.env.LLM_MODEL??'deepseek-v4.1-flash',max_tokens:maxTokens,reasoning_effort:'low',messages,...(tools.length?{tools}:{})}),signal});
  if(!response.ok)throw new Error(`Provider error (${response.status})`);
  const result=await response.json(); const choice=result.choices?.[0]; if(!choice?.message)throw new Error('Invalid provider response'); const msg=choice.message; return {text:typeof msg.content==='string'?msg.content:'',toolCalls:(msg.tool_calls??[]).map((c:{id:string;function:{name:string;arguments:string}})=>({id:c.id,name:c.function.name,arguments:c.function.arguments})),raw:{role:'assistant' as const,content:msg.content??null,tool_calls:msg.tool_calls},refusal:!!msg.refusal||(choice.finish_reason==='content_filter'||choice.finish_reason==='refusal')};
 }
}
