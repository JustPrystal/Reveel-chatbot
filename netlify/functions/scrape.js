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
    const articleList = articles.map((article, idx) => ({
      index: idx,
      title: article.title,
    }));

    console.log("Article List:\n", articleList);

    const prompt = `
You are a knowledge base assistant. Here is a list of article objects with their respective indices:
${JSON.stringify(articleList, null, 2)}

This is the user question: "${query}"

First, check if the user's question statement in the inverted commas is actually an interrogative statement (i.e. Is it a question?).
If it is a question:
1. Check if the question contains any keywords or topics that match or are closely related to the article titles (even if there are extra words, typos, or the phrasing is not exact). If so, respond ONLY with the index of the article that best answers the question.
2. If there is no match, respond ONLY with "-1".
If the question is not an interrogative statement, respond ONLY with "-2".

Examples:
User question: "what is reveel"
Response: 7

User question: "what is reveeel"
Response: 7

User question: "what is reveel gng pls tell gng plsssss"
Response: 7

User question: "how do i sign up for reveel"
Response: 5

User question: "how do I contact support"
Response: -1

User question: "Are subtitles required for monetization?"
Response: 25


Always respond ONLY with the index number, "-1", or "-2" as described above. Do not add any extra text.
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

    if (answer === "-1") {
      return {
        statusCode: 200,
        body: JSON.stringify({ error: "article-doesnt-exist" }),
      };
    }
    if (answer === "-2") {
      return {
        statusCode: 200,
        body: JSON.stringify("I cannot answer that."),
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
