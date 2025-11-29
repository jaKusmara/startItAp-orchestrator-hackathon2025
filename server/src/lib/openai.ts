// src/lib/openai.ts
import "dotenv/config";
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // logLevel: "debug", // ak chceš vidieť všetky HTTP requesty
});

export default openai;
