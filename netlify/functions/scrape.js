import { readFileSync } from "fs";
import path from "path";
import process from "process";

export const handler = async (event) => {
  try {
    const query = event.queryStringParameters?.query;
    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing query parameter." }),
      };
    }

    const articlesPath = path.join(process.cwd(), "articles.json");
    let articles = [];
    try {
      const fileData = readFileSync(articlesPath, "utf-8");
      articles = JSON.parse(fileData);
    } catch (err) {
      console.error("Error reading articles.json:", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Could not read articles.json" }),
      };
    }

    if (articles.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify("Knowledge base is empty."),
      };
    }

    const openAiApiKey = process.env.OPENAI_API_KEY;

    // Use 1-based indices for clarity
    const articleList = articles.map((article, idx) => ({
      index: idx + 1,
      title: article.title,
    }));

    const prompt = `
      You are a strict knowledge base assistant. Here is a list of article objects (indices are 1-based):
      ${JSON.stringify(articleList, null, 2)}

      This is the user question: "${query}"

      Rules:
      - If the input is NOT a question, respond ONLY with -2.
      - If it IS a question and matches an article, respond ONLY with the article's numeric index (one integer).
      - If it IS a question but there is no relevant article, respond ONLY with -1.
      - DO NOT add any extra text, punctuation, quotes, newlines, or explanation.

      Examples:
      Question: "What is Reveel?" => 1
      Question: "Hello" => -2
      Question: "Does Reveel have phone support?" => 23
      `;

    const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a strict knowledge base assistant." },
          { role: "user", content: prompt },
        ],
        temperature: 0,
        max_tokens: 4,
      }),
    });

    const result = await gptResponse.json();
    const rawAnswer = result.choices?.[0]?.message?.content?.trim() || "";
    console.log("Raw GPT output:", rawAnswer);

    // Extract numeric answer using regex
    const match = rawAnswer.match(/-?\d+/);
    if (!match) {
      return {
        statusCode: 200,
        body: JSON.stringify({ error: "Could You rephrase your question?" }),
      };
    }

    const answerNum = Number(match[0]);
    if (answerNum === -1) {
      return {
        statusCode: 200,
        body: JSON.stringify({ error: "article-doesnt-exist" }),
      };
    }
    if (answerNum === -2) {
      return {
        statusCode: 200,
        body: JSON.stringify("I cannot answer that."),
      };
    }

    const index = answerNum - 1; // Convert to 0-based
    if (!articles[index] || !articles[index].link) {
      return {
        statusCode: 200,
        body: JSON.stringify({ error: "article-doesnt-exist" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(`Here is a blog matching your question: ${articles[index].link}`),
    };
  } catch (err) {
    console.error("Handler error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
