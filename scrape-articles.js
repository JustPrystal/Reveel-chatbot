import * as cheerio from "cheerio";
import { writeFileSync } from "fs";
import path from "path";
import process from "process";

const BASE_URL = "https://help.reveel.net";
const START_URL = `${BASE_URL}/support/solutions`;

async function fetchHtml(url) {
  const response = await fetch(url);
  return await response.text();
}

async function getArticlesAndFolders(url, seenFolders, seenArticles) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const articles = [];
  const folderLinks = [];

  $("a[href^='/support/solutions/folders/']").each((i, link) => {
    const href = $(link).attr("href");
    if (!href) return;
    const fullFolderLink = href.startsWith("http") ? href : BASE_URL + href;
    if (!seenFolders.has(fullFolderLink)) {
      folderLinks.push(fullFolderLink);
      seenFolders.add(fullFolderLink);
    }
  });

  $("a[href^='/support/solutions/articles/']").each((i, link) => {
    const href = $(link).attr("href");
    if (!href) return;
    const fullArticleLink = href.startsWith("http") ? href : BASE_URL + href;
    const title = $(link).find(".line-clamp-2").text().trim() || $(link).text().trim();
    if (title && !seenArticles.has(fullArticleLink)) {
      articles.push({ link: fullArticleLink, title });
      seenArticles.add(fullArticleLink);
    }
  });

  return { articles, folderLinks };
}

async function main() {
  const seenFolders = new Set([START_URL]);
  const seenArticles = new Set();
  const articles = [];

  // BFS queue for folders
  const queue = [START_URL];

  while (queue.length > 0) {
    const currentFolder = queue.shift();
    const { articles: foundArticles, folderLinks } = await getArticlesAndFolders(
      currentFolder,
      seenFolders,
      seenArticles
    );
    articles.push(...foundArticles);
    queue.push(...folderLinks);
  }

  const articlesPath = path.join(process.cwd(), "articles.json");
  writeFileSync(articlesPath, JSON.stringify(articles, null, 2), "utf-8");
  console.log(`Saved ${articles.length} articles to articles.json`);
}

main();