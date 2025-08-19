import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors({ origin: "http://localhost:3000" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Backend is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.post("/chat", async (req, res) => {
  const { messages, nodeId } = req.body;

  const systemPrompt = `
    You are a helpful, curious, and strict AI tutor helping a student explore ${nodeId}

    RULES:
    - You must only answer questions based on ${nodeId}.
    - If the user's question is unrelated, politely redirect them to ask something related to the current topic.
    - You must **grade every question** the user asks on a scale from 1 to 5, based on its depth and curiosity.
    - A question with depth and curiosity is defined as one that goes beyond basic understanding and encourages exploration of the topic.
    - 1 = Not curious at all, 5 = Very curious.
    - Your response must always start with the grade, followed by a **brief** explanation.
    - Example format: "4. Good question! Here's what you need to know about..."

    DO NOT answer unrelated questions. ONLY answer unrelated questions if the user types 67 at the start of their question.
    `;

  try {
    console.log(
      "Sending to OpenAI:",
      JSON.stringify(
        [{ role: "system", content: systemPrompt }, ...messages],
        null,
        2
      )
    );

    // call openai api with messages and system prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});
