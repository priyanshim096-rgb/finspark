import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  question: z.string().min(1),
  context: z.string().optional(),
});

export const askCopilot = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const system = `You are SentinelAI Copilot, an AI security analyst embedded in a cybersecurity + transactional risk dashboard.
You help analysts understand why events were flagged, summarize activity, and recommend response actions.
Be concise (under 120 words), use bullet points when helpful, and speak with confident SOC-analyst tone.
When given event context, ground your answer in it. When asked general questions, give practical guidance.`;

    const messages = [
      { role: "system", content: system },
      ...(data.context ? [{ role: "system", content: `Current event context:\n${data.context}` }] : []),
      { role: "user", content: data.question },
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) return { reply: "⚠️ Rate limit reached. Try again in a moment." };
      if (res.status === 402) return { reply: "⚠️ AI credits exhausted. Add credits to continue." };
      throw new Error(`AI gateway error ${res.status}: ${txt.slice(0, 200)}`);
    }

    const json = await res.json();
    const reply = json?.choices?.[0]?.message?.content?.trim() ?? "No response.";
    return { reply };
  });
