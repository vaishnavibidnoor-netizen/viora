
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const categories = [
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

export default function CreatorStudio() {
  const supabase = useMemo(() => createClient(), []);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [image, setImage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Fashion");
  const [tags, setTags] = useState("");
  const [message, setMessage] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // CHECK AUTHENTICATION WHEN STUDIO OPENS
  useEffect(() => {
    let active = true;

    async function checkAuthentication() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (!active) return;

        if (error || !data.user) {
          window.location.replace("/login");
          return;
        }

        setIsAuthenticated(true);
      } catch {
        if (active) {
          window.location.replace("/login");
        }
      } finally {
        if (active) {
          setCheckingAuth(false);
        }
      }
    }

    checkAuthentication();

    return () => {
      active = false;
    };
  }, [supabase]);

  // IMAGE UPLOAD AND PREVIEW
  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please select a JPG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Image size must be below 10 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setIsPublished(false);
    setMessage("");

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result as string);
    };

    reader.onerror = () => {
      setMessage("Unable to preview this image. Please try again.");
      setSelectedFile(null);
      setImage("");
    };

    reader.readAsDataURL(file);
  }

  // REMOVE SELECTED IMAGE
  function removeImage() {
    setImage("");
    setSelectedFile(null);
    setIsPublished(false);
    setMessage("");

    const input = document.getElementById(
      "image-upload"
    ) as HTMLInputElement | null;

    if (input) input.value = "";
  }

  // PUBLISH POST
  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPublishing) return;

    if (!selectedFile) {
      setMessage("Please upload an image first.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setMessage("Please complete your title and description.");
      return;
    }

    setIsPublishing(true);
    setIsPublished(false);
    setMessage("");

    let uploadedFilePath: string | null = null;

    try {
      // 1. VERIFY USER
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        window.location.replace("/login");
        return;
      }

      // 2. CREATE UNIQUE FILE PATH
      const safeFileName = selectedFile.name.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      );

      const filePath = `${user.id}/${Date.now()}-${safeFileName}`;

      // 3. UPLOAD IMAGE TO STORAGE
      const { error: uploadError } = await supabase.storage
        .from("viora-posts")
        .upload(filePath, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      uploadedFilePath = filePath;

      // 4. GET PUBLIC IMAGE URL
      const { data: imageData } = supabase.storage
        .from("viora-posts")
        .getPublicUrl(filePath);

      const imageUrl = imageData.publicUrl;

      // 5. FORMAT TAGS
      const formattedTags = tags
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean);

      // 6. SAVE POST TO DATABASE
      const { error: insertError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          image_url: imageUrl,
          category,
          tags: formattedTags,
          status: "published",
        });

      if (insertError) throw insertError;

      // 7. SHOW SUCCESS
      setIsPublished(true);
      setMessage("Your post has been published successfully!");

      setSelectedFile(null);
      setImage("");
      setTitle("");
      setDescription("");
      setCategory("Fashion");
      setTags("");

      const input = document.getElementById(
        "image-upload"
      ) as HTMLInputElement | null;

      if (input) input.value = "";

    } catch (error) {
      // REMOVE IMAGE IF DATABASE INSERT FAILED
      if (uploadedFilePath) {
        const { error: cleanupError } = await supabase.storage
          .from("viora-posts")
          .remove([uploadedFilePath]);

        if (cleanupError) {
          console.error("Image cleanup failed:", cleanupError.message);
        }
      }

      console.error("Publishing error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while publishing."
      );
    } finally {
      setIsPublishing(false);
    }
  }

  // AUTHENTICATION LOADING SCREEN
  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <p className="text-lg font-semibold text-gray-500">
          Checking your account...
        </p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#252525]">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-[#eeeae3] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <a href="/" className="text-3xl font-black tracking-tight">
            viora<span className="text-[#e87968]">.</span>
          </a>

          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-sm font-semibold text-gray-500 hover:text-black"
            >
              ← Back to Discover
            </a>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0ddd7] font-bold text-[#a64f45]">
              V
            </div>
          </div>
        </div>
      </header>

      {/* PAGE TITLE */}
      <section className="mx-auto max-w-7xl px-5 pb-8 pt-12">
        <p className="text-xs font-bold uppercase tracking-[3px] text-[#c27a6d]">
          Viora Creator Studio
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Create something{" "}
          <span className="font-serif italic text-[#d47d6e]">
            beautiful.
          </span>
        </h1>

        <p className="mt-4 max-w-xl text-gray-500">
          Share your creativity with the world. Upload your inspiration,
          tell your story and publish your first discovery.
        </p>
      </section>

      {/* MAIN CONTENT */}
      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-20 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT: CREATION FORM */}
        <form
          onSubmit={handlePublish}
          className="rounded-3xl border border-[#eeeae3] bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="mb-7">
            <h2 className="text-2xl font-bold">Create a post</h2>
            <p className="mt-1 text-sm text-gray-500">
              Add your image and post details.
            </p>
          </div>

          {/* IMAGE UPLOAD */}
          <div>
            <label className="mb-3 block text-sm font-bold">
              Upload your image *
            </label>

            <label
              htmlFor="image-upload"
              className="flex min-h-[250px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#e6dcd4] bg-[#faf9f6] text-center transition hover:border-[#d47d6e]"
            >
              {image ? (
                <img
                  src={image}
                  alt="Selected upload"
                  className="max-h-[350px] w-full object-contain"
                />
              ) : (
                <>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0e4df] text-3xl">
                    ↑
                  </div>

                  <p className="font-bold">Choose an image</p>

                  <p className="mt-2 text-sm text-gray-500">
                    Click to browse files from your device
                  </p>

                  <p className="mt-3 text-xs text-gray-400">
                    JPG, PNG, WEBP · Maximum 10 MB
                  </p>
                </>
              )}
            </label>

            <input
              id="image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />

            {image && (
              <button
                type="button"
                onClick={removeImage}
                className="mt-3 text-sm font-semibold text-rose-600"
              >
                Remove image
              </button>
            )}
          </div>

          {/* TITLE */}
          <div className="mt-7">
            <label className="mb-2 block text-sm font-bold">
              Post title *
            </label>

            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsPublished(false);
              }}
              placeholder="Give your post a beautiful title..."
              maxLength={100}
              required
              className="w-full rounded-xl border border-[#e9e4dc] bg-[#faf9f6] px-4 py-4 text-sm outline-none focus:border-[#d47d6e]"
            />

            <p className="mt-1 text-right text-xs text-gray-400">
              {title.length}/100
            </p>
          </div>

          {/* DESCRIPTION */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold">
              Description *
            </label>

            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setIsPublished(false);
              }}
              placeholder="Tell everyone about your inspiration..."
              rows={4}
              maxLength={1000}
              required
              className="w-full resize-none rounded-xl border border-[#e9e4dc] bg-[#faf9f6] px-4 py-4 text-sm outline-none focus:border-[#d47d6e]"
            />

            <p className="mt-1 text-right text-xs text-gray-400">
              {description.length}/1000
            </p>
          </div>

          {/* CATEGORY */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold">
              Select category *
            </label>

            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setIsPublished(false);
              }}
              className="w-full rounded-xl border border-[#e9e4dc] bg-[#faf9f6] px-4 py-4 text-sm outline-none focus:border-[#d47d6e]"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* TAGS */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold">
              Tags
            </label>

            <input
              value={tags}
              onChange={(e) => {
                setTags(e.target.value);
                setIsPublished(false);
              }}
              placeholder="fashion, aesthetic, inspiration..."
              className="w-full rounded-xl border border-[#e9e4dc] bg-[#faf9f6] px-4 py-4 text-sm outline-none focus:border-[#d47d6e]"
            />

            <p className="mt-2 text-xs text-gray-400">
              Separate your keywords using commas.
            </p>
          </div>

          {/* STATUS MESSAGE */}
          {message && (
            <div
              role="status"
              className={`mt-5 rounded-xl p-4 text-sm ${
                isPublished
                  ? "bg-green-50 text-green-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {message}
            </div>
          )}

          {/* PUBLISH BUTTON */}
          <button
            type="submit"
            disabled={isPublishing}
            className="mt-8 w-full rounded-full bg-[#252525] px-6 py-4 font-bold text-white transition hover:bg-[#d47d6e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPublishing
              ? "Uploading your post..."
              : isPublished
                ? "✓ Post published"
                : "Publish your post →"}
          </button>

          <p className="mt-3 text-center text-xs text-gray-400">
            Your image and post details will be saved to Viora.
          </p>
        </form>

        {/* RIGHT: LIVE PREVIEW */}
        <aside>
          <div className="sticky top-28 rounded-3xl border border-[#eeeae3] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Live preview</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Your post appearance
                </p>
              </div>

              <span className="rounded-full bg-[#f5e9e4] px-3 py-2 text-xs font-bold text-[#b56b5e]">
                PREVIEW
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#eeeae3]">
              <div className="relative bg-[#f2eee8]">
                {image ? (
                  <img
                    src={image}
                    alt="Post preview"
                    className="max-h-[440px] w-full object-contain"
                  />
                ) : (
                  <div className="flex h-[360px] flex-col items-center justify-center text-gray-400">
                    <span className="text-5xl">▧</span>
                    <p className="mt-3 text-sm">
                      Your image will appear here
                    </p>
                  </div>
                )}
              </div>

              <div className="p-5">
                <span className="text-xs font-bold uppercase tracking-widest text-[#c27a6d]">
                  {category}
                </span>

                <h3 className="mt-2 text-xl font-bold">
                  {title || "Your post title"}
                </h3>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-500">
                  {description || "Your description will appear here."}
                </p>

                {tags && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tags
                      .split(",")
                      .filter((tag) => tag.trim())
                      .map((tag, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-[#f6f3ee] px-3 py-2 text-xs text-gray-600"
                        >
                          #{tag.trim().replace(/^#/, "").replace(/\s+/g, "")}
                        </span>
                      ))}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-[#eeeae3] pt-4">
                  <span className="text-sm font-bold">Viora Creator</span>
                  <span className="text-lg">♡</span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-[#faf9f6] p-4">
              <p className="text-sm font-bold">✦ Creator tip</p>
              <p className="mt-2 text-xs leading-6 text-gray-500">
                Use a high-quality image, a clear title and relevant tags
                to help people discover your content.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <footer className="border-t border-[#eeeae3] bg-white py-8 text-center text-sm text-gray-400">
        Viora Creator Studio · Create something beautiful.
      </footer>
    </main>
  );
}


