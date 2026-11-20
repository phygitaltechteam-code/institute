import { createFileRoute } from '@tanstack/react-router';
import { BlogPost } from '@/components/academy/public/BlogPages';

/** Public blog post — no login needed. */
const BlogPostPage = () => {
  const { slug } = Route.useParams();
  return <BlogPost slug={slug} />;
};

export const Route = createFileRoute('/blogs/$slug')({
  component: BlogPostPage,
});
