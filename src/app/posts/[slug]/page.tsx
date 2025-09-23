import { notFound } from "next/navigation";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { getPostData, getSortedPostsData } from "@/lib/posts";
import type { Metadata } from "next";
import Header from "@/components/Header";

interface PostPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const posts = await getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: PostPageProps["params"];
}): Promise<Metadata> {
  try {
    const post = await getPostData(params.slug);
    return {
      title: `${post.title}`,
      description: post.description,
    };
  } catch {
    return {
      title: "Post Not Found",
      description: "The requested post could not be found.",
    };
  }
}

export default async function PostPage({
  params,
}: {
  params: PostPageProps["params"];
}) {
  try {
    const post = await getPostData(params.slug);

    return (
      <article className="max-w-none">
        <section className="mb-14">
          <Header />
        </section>
        <header className="mb-8 pb-8 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {post.title}
          </h1>
          <time className="text-gray-500 text-sm font-mono">
            {format(new Date(post.date), "MMM dd, yyyy", { locale: enUS })}
          </time>
        </header>

        <div className="prose prose-lg prose-gray max-w-none font-serif font-medium text-xl">
          <div dangerouslySetInnerHTML={{ __html: post.htmlContent || "" }} />
        </div>
      </article>
    );
  } catch {
    notFound();
  }
}
