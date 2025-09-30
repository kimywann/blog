import Link from "next/link";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { getSortedPostsData } from "@/lib/posts";
import Header from "@/components/Header";

export default async function Home() {
  const allPostsData = await getSortedPostsData();

  return (
    <>
      <section className="mb-14">
        <Header />
      </section>
      <div className="space-y-6">
        {allPostsData.map(({ slug, title, date, description }) => (
          <article key={slug} className="group">
            <Link href={`/posts/${slug}`} className="block">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold group-hover:text-blue-500 transition-colors">
                  {title}
                </h2>
                <p className="text-gray-500 text-sm">{description}</p>
                <time className="text-gray-500 text-xs">
                  {format(new Date(date), "MMM dd, yyyy", { locale: enUS })}
                </time>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
