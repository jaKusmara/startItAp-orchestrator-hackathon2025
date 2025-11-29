import OpenAI from "openai";
import "dotenv/config";

export default new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
