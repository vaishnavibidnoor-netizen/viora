
"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SaveButton from "@/components/SaveButton";
import PostInteractions from "@/components/PostInteractions";


const categories = [
  "All",
  "Fashion",
  "Interior Design",
  "Travel",
  "Photography",
  "Architecture",
  "Art",
  "Food",
  "Lifestyle",
  "Technology",
];

type Post = {
  id: string | number;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
  tags: string[] | null;
};

const samplePosts: Post[] = [
  {
    id: "sample-1",
    title: "Minimal Living Room Inspiration",
    description: "Beautiful and peaceful interior design ideas.",
    image_url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85",
    category: "Interior Design",
    tags: ["interior", "home", "minimal"],
  },
  {
    id: "sample-2",
    title: "Elegant Everyday Fashion",
    description: "Simple outfits with timeless style.",
    image_url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=85",
    category: "Fashion",
    tags: ["fashion", "style"],
  },
  {
    id: "sample-3",
    title: "Beautiful Mountain Escape",
    description: "Find inspiration for your next adventure.",
    image_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85",
    category: "Travel",
    tags: ["travel", "nature"],
  },
  {
    id: "sample-4",
    title: "Creative Architecture",
    description: "Modern architecture and beautiful spaces.",
    image_url: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=900&q=85",
    category: "Architecture",
    tags: ["architecture", "design"],
  },
  {
    id: "sample-5",
    title: "Aesthetic Coffee Moments",
    description: "Little moments that make everyday life special.",
    image_url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=900&q=85",
    category: "Lifestyle",
    tags: ["coffee", "lifestyle"],
  },
  {
    id: "sample-6",
    title: "Creative Photography",
    description: "Discover new perspectives through photography.",
    image_url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=85",
    category: "Photography",
    tags: ["photography", "nature"],
  },
  {
    id: "sample-7",
    title: "Artistic Inspiration",
    description: "Explore colours, creativity and imagination.",
    image_url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=900&q=85",
    category: "Art",
    tags: ["art", "creative"],
  },
  {
    id: "sample-8",
    title: "Delicious Food Ideas",
    description: "Discover delicious food and beautiful presentation.",
    image_url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=85",
    category: "Food",
    tags: ["food", "cooking"],
  },
  {
    id: "sample-9",
    title: "Modern Workspace",
    description: "Design a workspace that inspires productivity.",
    image_url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85",
    category: "Technology",
    tags: ["workspace", "technology"],
  },
  {
    id: "sample-10",
    title: "Beautiful Natural Details",
    description: "Find beauty in the smallest details of nature.",
    image_url: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=85",
    category: "Photography",
    tags: ["nature", "photography"],
  },
];

export default function HomePage() {
  const supabase = useMemo(() => createClient(), []);

  const [posts, setPosts] = useState<Post[]>(samplePosts);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    let active = true;

    async function loadHomepage() {
      try {
        const { data: userData } = await supabase.auth.getUser();

        if (active) {
          setUserEmail(userData.user?.email ?? "");
        }

        const { data, error } = await supabase
          .from("posts")
          .select("id, title, description, image_url, category, tags")
          .eq("status", "published")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Unable to load posts:", error.message);
        } else if (active && data && data.length > 0) {
          setPosts(data as Post[]);
        }
      } catch (error) {
        console.error("Homepage loading error:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadHomepage();

    return () => {
      active = false;
    };
  }, [supabase]);

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      selectedCategory === "All" ||
      post.category === selectedCategory;

    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      !searchText ||
      post.title.toLowerCase().includes(searchText) ||
      (post.description ?? "").toLowerCase().includes(searchText) ||
      post.category.toLowerCase().includes(searchText) ||
      (post.tags ?? []).some((tag) =>
        tag.toLowerCase().includes(searchText)
      );

    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#252525]">
      <header className="sticky top-0 z-40 border-b border-[#eeeae3] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4">
          <a href="/" className="shrink-0 text-3xl font-black tracking-tight">
            viora<span className="text-[#df8272]">.</span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="/" className="text-sm font-bold text-[#d47d6e]">
              Discover
            </a>
            <a href="/studio" className="text-sm font-semibold text-gray-600 hover:text-black">
              Create
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {userEmail ? (
              <>
                <span className="hidden max-w-[160px] truncate text-sm text-gray-500 lg:block">
                  {userEmail}
                </span>
                <a
  href="/profile"
  className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
>
  My Profile
</a>

<a
  href="/studio"
  className="rounded-full bg-[#252525] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#d47d6e]"
>
  Creator Studio
</a>
              </>
            ) : (
              <>
                <a href="/login" className="rounded-full px-4 py-3 text-sm font-semibold hover:bg-gray-100">
                  Sign In
                </a>
                <a href="/login" className="rounded-full bg-[#252525] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#d47d6e]">
                  Get Started
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-5 pb-8 pt-14 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[4px] text-[#d47d6e]">
            Discover · Create · Inspire
          </p>
          <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight sm:text-7xl">
            Find your next{" "}
            <span className="font-serif italic text-[#d47d6e]">
              inspiration.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-gray-500 sm:text-lg">
            Explore creative ideas, discover beautiful visuals and collect inspiration from a world full of possibilities.
          </p>
        </div>

        <div className="mx-auto mt-9 flex max-w-2xl items-center gap-3 rounded-full border border-[#eee7df] bg-white px-6 py-4 shadow-sm focus-within:border-[#d47d6e]">
          <span className="text-xl text-gray-400">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas, fashion, travel, interiors..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 sm:text-base"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="text-sm font-semibold text-gray-400 hover:text-black">
              Clear
            </button>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 pb-8 pt-5">
        <div className="flex gap-3 overflow-x-auto pb-3">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`shrink-0 rounded-full px-5 py-3 text-sm font-semibold transition ${
                selectedCategory === category
                  ? "bg-[#252525] text-white"
                  : "border border-[#eee7df] bg-white text-gray-600 hover:border-[#d47d6e] hover:text-[#d47d6e]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 pb-20">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[3px] text-[#c27a6d]">
              Your inspiration feed
            </p>
            <h2 className="mt-2 text-3xl font-black">Explore ideas</h2>
          </div>
          <p className="text-sm text-gray-400">
            {filteredPosts.length} discoveries
          </p>
        </div>

        {loading && (
          <p className="py-10 text-center text-sm text-gray-500">
            Loading discoveries...
          </p>
        )}

        {!loading && filteredPosts.length === 0 && (
          <div className="rounded-3xl border border-[#eee7df] bg-white px-5 py-16 text-center">
            <p className="text-3xl">⌕</p>
            <h3 className="mt-4 text-xl font-bold">No discoveries found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try another search or select a different category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
              }}
              className="mt-5 rounded-full bg-[#252525] px-6 py-3 text-sm font-semibold text-white"
            >
              Clear filters
            </button>
          </div>
        )}

        {!loading && filteredPosts.length > 0 && (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-[#eeeae3] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative overflow-hidden bg-[#f1eee8]">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    loading="lazy"
                    className="block h-auto w-full object-cover transition duration-500 hover:scale-[1.03]"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#a66b60]">
                    {post.category}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="text-base font-bold leading-6">{post.title}</h3>
                  {post.description && (
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      {post.description}
                    </p>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span key={`${post.id}-${index}`} className="rounded-full bg-[#f6f3ee] px-3 py-1.5 text-xs text-gray-500">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-[#eeeae3] pt-3">
                    <span className="text-xs font-semibold text-gray-400">
                      Viora Community
                    </span>
                    <span className="text-xl text-[#d47d6e]">✦</span>
                  </div>
                </div>
                <div className="flex justify-end px-4 py-2">
                   <SaveButton postId={post.id} />
                </div>
                <PostInteractions postId={post.id} />
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="bg-[#f0e7df] px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[3px] text-[#b56b5e]">
            Your creativity matters
          </p>
          <h2 className="mt-4 text-4xl font-black sm:text-5xl">
            Have something beautiful to share?
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-gray-600">
            Turn your ideas into discoveries. Upload your images, share your stories and inspire the Viora community.
          </p>
          <a href="/studio" className="mt-8 inline-block rounded-full bg-[#252525] px-8 py-4 font-semibold text-white transition hover:bg-[#d47d6e]">
            Start Creating →
          </a>
        </div>
      </section>

      <footer className="bg-white px-5 py-10">
        <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-5 sm:flex-row">
          <a href="/" className="text-2xl font-black">
            viora<span className="text-[#df8272]">.</span>
          </a>
          <p className="text-center text-sm text-gray-400">
            Discover ideas. Create stories. Inspire the world.
          </p>
          <div className="flex gap-5 text-sm text-gray-500">
            <a href="/" className="hover:text-black">Discover</a>
            <a href="/login" className="hover:text-black">Login</a>
            <a href="/studio" className="hover:text-black">Create</a>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-gray-400">
        © 2026 Viora. All rights reserved.
        </p>
      </footer>
    </main>
  );
}






