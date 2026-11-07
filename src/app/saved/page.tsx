
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type SavedPost = {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  category: string | null;
  tags: string[] | null;
};

export default function SavedPage() {
  const supabase = createClient();

  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function loadSavedPosts() {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        window.location.replace("/login");
        return;
      }

      // Get the saved post IDs
      const { data: savedItems, error: savedError } = await supabase
        .from("post_saves")
        .select("post_id")
        .eq("user_id", user.id);

      if (savedError) throw savedError;

      const postIds = (savedItems ?? [])
      .map((item) => item.post_id)
       .filter((id) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );

      if (postIds.length === 0) {
        setPosts([]);
        return;
      }

      // Get the actual posts
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("id, title, description, image_url, category, tags")
        .in("id", postIds)
        .eq("status", "published");

      if (postError) throw postError;

      setPosts((postData ?? []) as SavedPost[]);
    } catch (error: any) {
  console.error("Saved posts loading error:", error);

  setMessage(
    error?.message ||
    error?.details ||
    error?.hint ||
    JSON.stringify(error) ||
    "Unable to load saved posts."
  );
} finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSavedPosts();
  }, []);

  async function removeSavedPost(postId: string) {
    setRemovingId(postId);
    setMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Please sign in again.");

      const { error } = await supabase
        .from("post_saves")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);

      if (error) throw error;

      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== postId)
      );
    } catch (error) {
      console.error("Remove saved post error:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to remove saved post."
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#252525]">
      <header className="flex items-center justify-between border-b border-[#eee7df] bg-white px-6 py-5">
        <Link href="/" className="text-3xl font-black">
          viora<span className="text-[#d47d6e]">.</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-semibold">
          <Link href="/" className="hover:text-[#d47d6e]">
            Discover
          </Link>
          <Link href="/profile" className="hover:text-[#d47d6e]">
            My Profile
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-[1500px] px-6 py-10">
        <p className="text-xs font-bold uppercase tracking-[4px] text-[#d47d6e]">
          YOUR PERSONAL COLLECTION
        </p>

        <div className="mb-8 mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl font-black">Saved Posts</h1>

          <span className="text-sm text-gray-500">
            {posts.length} saved posts
          </span>
        </div>

        {message && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-[#eee7df] bg-white p-12 text-center">
            Loading your saved posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-[#eee7df] bg-white px-6 py-20 text-center">
            <div className="mb-4 text-5xl">🔖</div>

            <h2 className="text-2xl font-bold">
              No saved posts yet
            </h2>

            <p className="mt-2 text-gray-500">
              Discover beautiful ideas and save the ones you love.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-full bg-[#252525] px-7 py-3 font-semibold text-white hover:bg-[#d47d6e]"
            >
              Explore Discover
            </Link>
          </div>
        ) : (
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="mb-6 break-inside-avoid overflow-hidden rounded-2xl border border-[#eee7df] bg-white shadow-sm"
              >
                <img
                  src={post.image_url}
                  alt={post.title ?? "Saved post"}
                  className="w-full object-cover"
                />

                <div className="p-4">
                  <h2 className="text-lg font-bold">
                    {post.title || "Untitled post"}
                  </h2>

                  {post.description && (
                    <p className="mt-2 text-sm text-gray-600">
                      {post.description}
                    </p>
                  )}

                  {post.category && (
                    <p className="mt-3 text-sm text-[#d47d6e]">
                      {post.category}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => removeSavedPost(post.id)}
                    disabled={removingId === post.id}
                    className="mt-4 w-full rounded-full bg-[#fce9e6] px-4 py-2 text-sm font-semibold text-[#c96f61] hover:bg-[#f6d9d3] disabled:opacity-50"
                  >
                    {removingId === post.id
                      ? "Removing..."
                      : "Remove from saved"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
