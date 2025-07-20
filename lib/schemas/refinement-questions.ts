import { z } from "zod";

export const singleQuestionSchema = z.object({
	id: z.string(),
	question: z.string(),
	placeholder: z.string(),
});

export const refinementQuestionsSchema = z.object({
	questions: z.array(singleQuestionSchema),
});

export type SingleQuestionType = z.infer<typeof singleQuestionSchema>;
export type RefinementQuestionsType = z.infer<typeof refinementQuestionsSchema>;
