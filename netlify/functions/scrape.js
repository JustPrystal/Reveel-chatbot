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
      console.log(err);
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

    // Prepare numbered list for GPT (titles only)
    const articleList = articles
      .map((a, i) => `${i + 1}. ${a.title}`)
      .join("\n");

    const prompt = `
You are a strict knowledge base assistant. Here is a numbered list of article titles:
${articleList}

Your rules:
- If the input is NOT an interrogative (not a question), reply ONLY with: I can only answer questions.
- If the input IS a question, reply ONLY with the number of the most relevant article (just the number, nothing else). If none are relevant, reply ONLY with: article-doesnt-exist.
- Never reply with anything except a number, "article-doesnt-exist", or "I can only answer questions".
- Do NOT format your answer as markdown, do NOT include the title, do NOT add any extra text, explanation, or greeting.
- Do NOT answer questions that are not in the knowledge base; reply ONLY with "article-doesnt-exist".
- Do NOT answer non-questions; reply ONLY with "I can only answer questions".
- Do NOT answer with anything except the above options.

Examples of non-questions and their expected answer:
Input: "hello"
Answer: I can only answer questions

Input: "sigma"
Answer: I can only answer questions

Input: "123123@gmail.com"
Answer: I can only answer questions

Input: "wsg gng"
Answer: I can only answer questions

Examples of questions and their expected answer:
Input: "what is reveel about"
Answer: 7

Input: "how do i sign up for reveel"
Answer: 5

Input: "Are subtitles required for monetization?"
Answer: 25

Examples of questions that aren't in the knowledge base:
Input: "who can use reveel?"
Answer: article-doesnt-exist

Input: "is there batch uploading?"
Answer: article-doesnt-exist

Input: "what is the meaning of life?"
Answer: article-doesnt-exist

Do NOT answer with anything except a number, "article-doesnt-exist", or "I can only answer questions".
Do NOT format your answer as markdown, do NOT include the title, do NOT add any extra text.

Input: "${query}"
`;

    const gptResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o", // Fast and cheap
          messages: [
            {
              role: "system",
              content: "You are a strict knowledge base assistant.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0,
        }),
      }
    );

    const result = await gptResponse.json();
    const answer =
      result.choices &&
      result.choices[0] &&
      result.choices[0].message &&
      result.choices[0].message.content
        ? result.choices[0].message.content.trim()
        : "";

    if (answer === "article-doesnt-exist") {
      return {
        statusCode: 200,
        body: JSON.stringify({ error: "article-doesnt-exist" }),
      };
    }
    if (answer === "I can only answer questions") {
      return {
        statusCode: 200,
        body: JSON.stringify("I can only answer questions"),
      };
    }

    const index = parseInt(answer, 10) - 1;
    if (
      isNaN(index) ||
      !articles[index] ||
      !articles[index].title ||
      !articles[index].link
    ) {
      return {
        statusCode: 200,
        body: JSON.stringify({ error: "article-doesnt-exist" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(
        `Here is a blog matching your question: ${articles[index].link}`
      ),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
