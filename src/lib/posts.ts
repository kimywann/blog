import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import Prism from "prismjs";

// 필요한 언어들을 import
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-sql";

// marked 설정
marked.use({
  renderer: {
    code(token) {
      const lang = token.lang || "";
      const code = token.text;

      if (lang && Prism.languages[lang]) {
        try {
          const highlightedCode = Prism.highlight(
            code,
            Prism.languages[lang],
            lang
          );
          return `<pre class="language-${lang}"><code class="language-${lang}">${highlightedCode}</code></pre>`;
        } catch (err) {
          console.error(err);
        }
      }
      return `<pre><code>${code}</code></pre>`;
    },
  },
});

const postsDirectory = path.join(process.cwd(), "posts");

export interface PostData {
  slug: string;
  title: string;
  date: string;
  description: string;
  content?: string;
  htmlContent?: string;
}

export async function getSortedPostsData(): Promise<PostData[]> {
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = await Promise.all(
    fileNames
      .filter((name) => name.endsWith(".md"))
      .map(async (fileName) => {
        const slug = fileName.replace(/\.md$/, "");
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, "utf8");

        const matterResult = matter(fileContents);

        return {
          slug,
          title: matterResult.data.title,
          date: matterResult.data.date,
          description: matterResult.data.description,
          content: matterResult.content,
          htmlContent: await marked.parse(matterResult.content),
        };
      })
  );
  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getAllPostSlugs() {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter((name) => name.endsWith(".md"))
    .map((fileName) => ({
      params: {
        slug: fileName.replace(/\.md$/, ""),
      },
    }));
}

export async function getPostData(slug: string): Promise<PostData> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");

  const matterResult = matter(fileContents);

  return {
    slug,
    title: matterResult.data.title,
    date: matterResult.data.date,
    description: matterResult.data.description,
    content: matterResult.content,
    htmlContent: await marked.parse(matterResult.content), // await 추가
  };
}
