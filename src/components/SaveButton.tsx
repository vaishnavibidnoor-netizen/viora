
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SaveButtonProps = {
  postId: string | number;
};

export default function SaveButton({ postId }: SaveButtonProps) {
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const postIdText = String(postId);

  useEffect(() => {
    let active = true;

    async function checkSavedPost() {
      try {
        const { data: { user }, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;
        if (!active) return;

        setUserId(user?.id ?? null);

        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("post_saves")
          .select("id")
          .eq("user_id", user.id)
          .eq("post_id", postIdText)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;

        setIsSaved(Boolean(data));
      } catch (error) {
        console.error("Save status error:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    checkSavedPost();

    return () => {
      active = false;
    };
  }, [postIdText]);

  async function handleSave() {
    if (!userId) {
      window.location.href = "/login";
      return;
    }

    if (saving || loading) return;

    setSaving(true);
    setMessage("");

    try {
      if (isSaved) {
        const { error } = await supabase
          .from("post_saves")
          .delete()
          .eq("user_id", userId)
          .eq("post_id", postIdText);

        if (error) throw error;

        setIsSaved(false);
        setMessage("Removed from saved posts");
      } else {
        const { error } = await supabase
          .from("post_saves")
          .insert({
            user_id: userId,
            post_id: postIdText,
          });

        if (error) throw error;

        setIsSaved(true);
        setMessage("Post saved successfully!");
      }
    } catch (error) {
      console.error("Save post error:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update saved post."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleSave}
        disabled={loading || saving}
        aria-pressed={isSaved}
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
          isSaved
            ? "bg-[#fce9e6] text-[#c96f61]"
            : "bg-[#f6f3ee] text-gray-600 hover:bg-[#f0e4df]"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span>{isSaved ? "🔖" : "♧"}</span>
        {loading
          ? "Loading..."
          : saving
            ? "Saving..."
            : isSaved
              ? "Saved"
              : "Save"}
      </button>

      {message && (
        <p className="max-w-[180px] text-right text-xs text-gray-500">
          {message}
        </p>
      )}
    </div>
  );
}
