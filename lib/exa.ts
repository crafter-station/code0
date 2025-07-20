import Exa from "exa-js";

if (!process.env.EXA_API_KEY) {
	throw new Error("EXA_API_KEY environment variable is required");
}

export const exa = new Exa(process.env.EXA_API_KEY);
