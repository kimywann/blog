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

        <div
          className="prose prose-lg prose-gray max-w-none
                      prose-headings:text-gray-900 prose-headings:font-semibold
                      prose-p:text-gray-700 prose-p:leading-relaxed
                      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                      prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:overflow-x-auto
                      prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:px-4 prose-blockquote:py-2
                      prose-ul:text-gray-700 prose-ol:text-gray-700
                      prose-li:text-gray-700 font-serif font-medium text-lg"
        >
          <div dangerouslySetInnerHTML={{ __html: post.htmlContent || "" }} />
        </div>
      </article>
    );
  } catch {
    notFound();
  }
}
