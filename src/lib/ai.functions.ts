import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  system: z.string().optional(),
  prompt: z.string().min(1),
  temperature: z.number().optional(),
});

export const generateAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    try {
      const result = await generateText({
        model,
        system: data.system,
        prompt: data.prompt,
        temperature: data.temperature ?? 0.7,
      });
      // Basic confidence heuristic based on length + certainty language
      const text = result.text;
      const lower = text.toLowerCase();
      const uncertainMarkers = ["might", "maybe", "possibly", "unclear", "uncertain", "i think"];
      const uncertainty = uncertainMarkers.reduce(
        (acc, m) => acc + (lower.split(m).length - 1),
        0,
      );
      const confidence = Math.max(55, Math.min(98, 92 - uncertainty * 6));
      return { text, confidence };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("Rate limit reached. Please retry in a moment.");
      if (msg.includes("402"))
        throw new Error("AI credits exhausted. Please add credits to your workspace.");
      throw new Error(msg);
    }
  });
