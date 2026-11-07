
"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  user_id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};
type ProfilePost = {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  category: string | null;
};

export default function ProfilePage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [publishedPosts, setPublishedPosts] = useState<ProfilePost[]>([]);
const [postsLoading, setPostsLoading] = useState(true);

  // LOAD PROFILE
  useEffect(() => {
    let active = true;

    async function loadProfile() {
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

        if (!active) return;

        setEmail(user.email ?? "");

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;

        const currentProfile: Profile = data ?? {
          user_id: user.id,
          username: user.email?.split("@")[0] ?? "",
          full_name: "",
          bio: "",
          avatar_url: null,
        };

        setProfile(currentProfile);
        setFullName(currentProfile.full_name ?? "");
        setUsername(currentProfile.username ?? "");
        setBio(currentProfile.bio ?? "");
        setAvatarPreview(currentProfile.avatar_url ?? "");
        // LOAD MY PUBLISHED POSTS
const { data: posts, error: postsError } = await supabase
  .from("posts")
  .select("id, title, description, image_url, category")
  .eq("user_id", user.id)
  .eq("status", "published")
  .order("created_at", { ascending: false });

if (postsError) {
  console.error("Published posts loading error:", postsError);
} else {
  setPublishedPosts(posts ?? []);
}


      } catch (error) {
        console.error("Profile loading error:", error);
        if (active) setMessage("Unable to load your profile.");
     } finally {
  if (active) {
    setLoading(false);
    setPostsLoading(false);
  }
}
    }
    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  // SELECT PROFILE PHOTO
  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please select a JPG, PNG or WebP image.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Your profile photo must be smaller than 2 MB.");
      e.target.value = "";
      return;
    }

    setMessage("");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  // SAVE PROFILE AND PHOTO
  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!profile) return;

    setSaving(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Please sign in again.");

      let avatarUrl = profile.avatar_url;

      // UPLOAD PHOTO TO SUPABASE STORAGE
      if (avatarFile) {
        const extension = avatarFile.name.split(".").pop()?.toLowerCase();

        const safeExtension =
          extension && ["jpg", "jpeg", "png", "webp"].includes(extension)
            ? extension
            : "jpg";

        const filePath = `${user.id}/avatar-${Date.now()}.${safeExtension}`;

        const { error: uploadError } = await supabase.storage
          .from("viora-avatars")
          .upload(filePath, avatarFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: avatarFile.type,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("viora-avatars")
          .getPublicUrl(filePath);

        avatarUrl = publicUrlData.publicUrl;
      }

      // SAVE PROFILE DETAILS
      const updatedProfile = {
        user_id: user.id,
        username: username.trim(),
        full_name: fullName.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .upsert(updatedProfile, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;

      setProfile(data as Profile);
      setAvatarPreview(data.avatar_url ?? "");
      setAvatarFile(null);
      setEditing(false);
      setMessage("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <p className="text-gray-500">Loading your profile...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <p className="text-gray-500">
          {message || "Profile could not be loaded."}
        </p>
      </main>
    );
  }

  const displayName =
    profile.full_name || profile.username || "Viora Creator";

  return (
    <main className="min-h-screen bg-[#faf8f5] px-5 py-10 text-[#242424]">
      <div className="mx-auto max-w-4xl">

        {/* NAVIGATION */}
        <nav className="mb-10 flex items-center justify-between">
          <a href="/" className="text-3xl font-black tracking-tight">
            viora<span className="text-[#df8272]">.</span>
          </a>

          <div className="flex gap-3">
            <a href="/" className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-white">
              Discover
            </a>
            <a href="/studio" className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-white">
              Create
            </a>
          </div>
        </nav>

        {/* PROFILE CARD */}
        <section className="rounded-3xl border border-[#eee7df] bg-white p-7 shadow-sm sm:p-10">

          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">

            {/* PROFILE PHOTO */}
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#fce9e6] text-4xl font-bold text-[#df8272]">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>

            {/* PROFILE DETAILS */}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-bold tracking-[0.2em] text-[#df8272]">
                VIORA CREATOR
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                {displayName}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                @{profile.username || "creator"}
              </p>

              <p className="mt-4 max-w-xl leading-7 text-gray-600">
                {profile.bio || "Share something about yourself and your creativity."}
              </p>

              <p className="mt-3 text-sm text-gray-400">{email}</p>

              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setEditing(!editing);
                }}
                className="mt-5 rounded-full bg-[#242424] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#df8272]"
              >
                {editing ? "Cancel Editing" : "Edit Profile"}
              </button>
            </div>
          </div>

          {/* EDIT PROFILE FORM */}
          {editing && (
            <form onSubmit={handleSave} className="mt-9 space-y-5 border-t border-[#eee7df] pt-8">

              <h2 className="text-xl font-bold">Edit your profile</h2>

              {/* PHOTO UPLOAD */}
              <div>
                <label className="mb-3 block text-sm font-semibold">
                  Profile photo
                </label>

                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#fce9e6] text-2xl font-bold text-[#df8272]">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Selected profile preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="avatar"
                      className="inline-block cursor-pointer rounded-full bg-[#fce9e6] px-5 py-3 text-sm font-semibold text-[#c96f61] hover:bg-[#f8dcd7]"
                    >
                      Choose photo
                    </label>

                    <input
                      id="avatar"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />

                    <p className="mt-2 text-xs text-gray-400">
                      JPG, PNG or WebP · Maximum 2 MB
                    </p>
                  </div>
                </div>
              </div>

              {/* FULL NAME */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Full name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={80}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#df8272]"
                />
              </div>

              {/* USERNAME */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Username
                </label>
                <input
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                    )
                  }
                  required
                  minLength={3}
                  maxLength={30}
                  placeholder="Choose a username"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#df8272]"
                />
              </div>

              {/* BIO */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={250}
                  rows={4}
                  placeholder="Tell the Viora community about yourself..."
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#df8272]"
                />
                <p className="mt-1 text-right text-xs text-gray-400">
                  {bio.length}/250
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#df8272] px-7 py-3 font-semibold text-white transition hover:bg-[#c96f61] disabled:opacity-50"
              >
                {saving ? "Uploading and saving..." : "Save Changes"}
              </button>
            </form>
          )}

          {message && (
            <p className="mt-5 rounded-xl bg-[#fff3ef] p-3 text-sm text-[#a94f40]">
              {message}
            </p>
          )}
        </section>

        {/* PROFILE LINKS */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold">Your creative space</h2>
          <p className="mt-2 text-gray-500">
            Your Viora profile is where your inspiration lives.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <a
              href="/studio"
              className="rounded-2xl border border-[#eee7df] bg-white p-6 transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="text-3xl">✨</span>
              <h3 className="mt-3 font-bold">Create a post</h3>
              <p className="mt-1 text-sm text-gray-500">
                Share your latest inspiration with the community.
              </p>
            </a>

            <a
              href="/saved"
              className="rounded-2xl border border-[#eee7df] bg-white p-6 transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="text-3xl">🔖</span>
              <h3 className="mt-3 font-bold">Saved posts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Revisit ideas you have bookmarked.
              </p>
            </a>
          </div>
        </section>
        {/* MY PUBLISHED POSTS */}
<section className="mt-12">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold">My Published Posts</h2>
    <a
      href="/studio"
      className="text-sm font-semibold text-[#d47d6e] hover:underline"
    >
      Create new post →
    </a>
  </div>

  {publishedPosts.length === 0 ? (
    <div className="rounded-2xl border border-[#eee7df] bg-white p-10 text-center">
      <p className="text-gray-500">
        You haven't published any posts yet.
      </p>
    </div>
  ) : (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {publishedPosts.map((post) => (
        <article
          key={post.id}
          className="overflow-hidden rounded-2xl border border-[#eee7df] bg-white"
        >
          <img
            src={post.image_url}
            alt={post.title || "My published post"}
            className="h-72 w-full object-cover"
          />
          <div className="p-4">
            <h3 className="font-bold">{post.title}</h3>
            <p className="mt-2 text-sm text-gray-500">
              {post.description}
            </p>
            <p className="mt-3 text-xs text-[#d47d6e]">
              {post.category}
            </p>
          </div>
        </article>
      ))}
    </div>
  )}
</section>

      </div>
    </main>
  );
}

