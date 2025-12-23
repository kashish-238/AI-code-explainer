import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { code, mode } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "No code provided" },
        { status: 400 }
      );
    }

    const systemPrompt =
      mode === "beginner"
        ? `
You are a friendly programming tutor.

First, explain the given code in plain English for a beginner.
Write a detailed explanation (6–10 sentences).
Explain what each part of the code does and include small examples or analogies if helpful.

Then write exactly:
MISTAKES:

After that, describe common beginner mistakes found in the code.
Explain why each mistake is a problem and how to fix it.
If there are no mistakes, clearly say that no beginner mistakes were found.

Rules:
- Do NOT use markdown, bullet points, or headings.
- Write in clean paragraphs only.
`
        : `
You are a senior software engineer.

Explain the given code in a detailed and technical way.
Mention logic, intent, and possible pitfalls or improvements.

Do NOT use markdown or bullet points.
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: code },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const raw =
      completion.choices?.[0]?.message?.content?.trim();

    if (!raw) {
      return NextResponse.json(
        { error: "Model returned no output" },
        { status: 500 }
      );
    }

    const [explanationPart, mistakesPart] = raw.split("MISTAKES:");

    return NextResponse.json({
      explanation: explanationPart.trim(),
      mistakes: mistakesPart
        ? mistakesPart.trim()
        : "No obvious beginner mistakes were found in this code.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Groq request failed",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
