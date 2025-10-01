import { notFound } from "next/navigation";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { getPostData, getSortedPostsData } from "@/lib/posts";
import type { Metadata } from "next";

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
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
  params: Promise<PostPageProps["params"]>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const post = await getPostData(slug);
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
  params: Promise<PostPageProps["params"]>;
}) {
  try {
    const { slug } = await params;
    const post = await getPostData(slug);

    return (
      <article className="max-w-none">
        <header className="mb-8 pb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {post.title}
          </h1>
          <time className="text-gray-500 text-sm">
            {format(new Date(post.date), "MMM dd, yyyy", { locale: enUS })}
          </time>
        </header>

        <div className="max-w-none">
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-ul:my-4 prose-li:my-1"
            dangerouslySetInnerHTML={{ __html: post.htmlContent || "" }}
          />
        </div>
      </article>
    );
  } catch {
    notFound();
  }
}
