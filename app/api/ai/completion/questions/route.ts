import { refinementQuestionsSchema } from "@/lib/schemas/refinement-questions";
import { openai } from "@ai-sdk/openai";
import { Output, streamText } from "ai";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { question } = body;

		if (!question) {
			return Response.json(
				{ success: false, error: "Question is required" },
				{ status: 400 },
			);
		}

		console.log("🚀 API: Starting generateRefinementQuestions for:", question);

		const result = streamText({
			model: openai("gpt-4o-mini"),
			messages: [
				{
					role: "system",
					content:
						"You are an expert research assistant. Generate thoughtful refinement questions to help improve research quality.",
				},
				{
					role: "user",
					content: `Generate 3 refinement questions for: "What are the benefits of meditation?"`,
				},
				{
					role: "assistant",
					content: `{
            "questions": [
              {
                "id": "aspect",
                "question": "What specific type of meditation are you most interested in?",
                "placeholder": "e.g., mindfulness, transcendental, guided meditation"
              },
              {
                "id": "purpose",
                "question": "What is the primary goal of your research?",
                "placeholder": "e.g., personal practice, academic study, health benefits"
              },
              {
                "id": "constraints",
                "question": "Are there any specific populations or contexts you want to focus on?",
                "placeholder": "e.g., beginners, stress relief, workplace wellness"
              }
            ]
          }`,
				},
				{
					role: "user",
					content: `Perfect! Now generate 3 thoughtful refinement questions for this research query: "${question}"
          
          The questions should help clarify:
          1. Specific aspects or focus areas the user is interested in
          2. The purpose or context of their research  
          3. Any constraints, requirements, or preferences they have
          
          Each question should be:
          - Clear and specific
          - Relevant to the original query
          - Designed to improve research quality
          - Not too technical or complex
          
          Provide appropriate placeholders that guide the user on how to answer.
          Use IDs like "aspect", "purpose", "constraints" for the questions.`,
				},
			],
			temperature: 0.7,
			experimental_output: Output.object({
				schema: refinementQuestionsSchema,
			}),
		});

		console.log("✅ API: Returning streamText result");
		return result.toTextStreamResponse();
	} catch (error) {
		console.error("❌ API: Error generating refinement questions:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
}
