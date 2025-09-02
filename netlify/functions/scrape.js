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
    if (/^\d+$/.test(query)) {
      return {
        statusCode: 200,
        body: JSON.stringify("i cannot answer that"),
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
You are a strict Q&A classifier. You have a knowledge base of articles.

Articles:
${articleList}

Your job is to read the user's input and follow these exact rules:

RULES:
1. If the input is NOT a question (not interrogative), reply EXACTLY: I can only answer questions.
2. If the input IS a question:
    - If it semantically matches an article from the list, reply ONLY with the article number (just the number, no extra text).
    - If no article is relevant, reply EXACTLY: article-doesnt-exist.
    - If the input is a greeting, slang, random text, or just a number, reply EXACTLY: I can only answer questions.
3. NEVER explain your reasoning, NEVER output anything other than:
    - a single number (e.g., 2)
    - OR "article-doesnt-exist"
    - OR "I can only answer questions".

EXAMPLES:

Input: When did Reveel launch?
Output: 3

Input: how can I reset my password
Output: 1

Input: Where can I adjust the speed?
Output: 6

Input: i want to delete my account
Output: article-doesnt-exist

Input: how to save movies on Favorites
Output: 4

Input: how do I contact support
Output: article-doesnt-exist

Input: hi wsg what u up to
Output: I can only answer questions

Input: hi wsg
Output: I can only answer questions

Input: hello
Output: I can only answer questions

Input: hey
Output: I can only answer questions

Input: 123123@gmail.com
Output: I can only answer questions

Input: sigma
Output: I can only answer questions

Input: 2
Output: I can only answer questions

Input: 42
Output: I can only answer questions

Input: what's up
Output: I can only answer questions

Input: wsg
Output: I can only answer questions

Input: yo
Output: I can only answer questions

Input: sup
Output: I can only answer questions

Input: randomtext
Output: I can only answer questions

Input: asdfghjkl
Output: I can only answer questions



NOW follow the rules STRICTLY.

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
