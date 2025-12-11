import Link from "next/link";
import { format } from "date-fns";
import { getSortedPostsData } from "@/lib/posts";
import Image from "next/image";
import fs from "fs";
import path from "path";

/**
 * 이미지 파일 존재 여부 확인
 */
function imageExists(slug: string): boolean {
  const imagePath = path.join(
    process.cwd(),
    "public",
    "images",
    "posts",
    slug,
    "thumbnail.png"
  );
  return fs.existsSync(imagePath);
}

export default async function Home() {
  const allPostsData = await getSortedPostsData();

  return (
    <div className="space-y-8">
      {allPostsData.map(({ slug, title, date, description }) => {
        return (
          <article key={slug} className="group">
            <Link href={`/posts/${slug}`} className="block">
              <div className="flex gap-4 items-start">
                <div className="flex-1 space-y-1">
                  <h2 className="text-xl font-semibold text-black group-hover:text-indigo-400 transition-colors duration-300">
                    {title}
                  </h2>
                  <p className="text-gray-500 text-base line-clamp-2">
                    {description}
                  </p>
                  <time className="text-gray-500 text-sm">
                    {format(new Date(date), "yyyy년 MM월 dd일")}
                  </time>
                </div>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
