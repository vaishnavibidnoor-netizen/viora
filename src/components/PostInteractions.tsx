
"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type PostInteractionsProps = {
  postId: string | number;
};

export default function PostInteractions({
  postId,
}: PostInteractionsProps) {
  const supabase = useMemo(() => createClient(), []);
  const postIdText = String(postId);

  const [userId, setUserId] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [deletingComment, setDeletingComment] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showComments, setShowComments] = useState(false);

  // LOAD LIKES AND COMMENTS
  useEffect(() => {
    let active = true;

    async function loadInteractions() {
      setLoading(true);
      setErrorMessage("");

      try {
        const { data: userData } = await supabase.auth.getUser();
        const currentUser = userData.user;

        if (!active) return;

        setUserId(currentUser?.id ?? null);

        const [likesResult, commentsResult] = await Promise.all([
          supabase
            .from("post_likes")
            .select("id", { count: "exact", head: true })
            .eq("post_id", postIdText),

          supabase
            .from("post_comments")
            .select("id, post_id, user_id, content, created_at")
            .eq("post_id", postIdText)
            .order("created_at", { ascending: false }),
        ]);

        if (likesResult.error) throw likesResult.error;
        if (commentsResult.error) throw commentsResult.error;

        let likedByUser = false;

        if (currentUser) {
          const { data: likeData, error: likeError } = await supabase
            .from("post_likes")
            .select("id")
            .eq("post_id", postIdText)
            .eq("user_id", currentUser.id)
            .maybeSingle();

          if (likeError) throw likeError;

          likedByUser = Boolean(likeData);
        }

        if (!active) return;

        setLikeCount(likesResult.count ?? 0);
        setIsLiked(likedByUser);
        setComments((commentsResult.data ?? []) as Comment[]);
      } catch (error) {
        console.error("Interaction loading error:", error);

        if (active) {
          setErrorMessage("Unable to load interactions. Please refresh.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInteractions();

    return () => {
      active = false;
    };
  }, [supabase, postIdText]);

  // LIKE OR UNLIKE
  async function handleLike() {
    if (!userId) {
      window.location.href = "/login";
      return;
    }

    if (liking) return;

    setLiking(true);
    setErrorMessage("");

    try {
      if (isLiked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postIdText)
          .eq("user_id", userId);

        if (error) throw error;

        setIsLiked(false);
        setLikeCount((count) => Math.max(0, count - 1));
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert({
            post_id: postIdText,
            user_id: userId,
          });

        if (error) throw error;

        setIsLiked(true);
        setLikeCount((count) => count + 1);
      }
    } catch (error) {
      console.error("Like update error:", error);
      setErrorMessage("Unable to update your like. Please try again.");
    } finally {
      setLiking(false);
    }
  }

  // ADD COMMENT
  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      window.location.href = "/login";
      return;
    }

    const content = commentText.trim();

    if (!content || submitting) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("post_comments")
        .insert({
          post_id: postIdText,
          user_id: userId,
          content,
        })
        .select("id, post_id, user_id, content, created_at")
        .single();

      if (error) throw error;

      setComments((previous) => [data as Comment, ...previous]);
      setCommentText("");
    } catch (error) {
      console.error("Comment submission error:", error);
      setErrorMessage("Unable to post your comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // DELETE OWN COMMENT
  async function handleDeleteComment(commentId: string) {
    if (!userId || deletingComment) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?"
    );

    if (!confirmed) return;

    setDeletingComment(commentId);
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("post_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", userId);

      if (error) throw error;

      setComments((previous) =>
        previous.filter((comment) => comment.id !== commentId)
      );
    } catch (error) {
      console.error("Comment deletion error:", error);
      setErrorMessage("Unable to delete this comment.");
    } finally {
      setDeletingComment(null);
    }
  }


  return (
  <div className="border-t border-[#f0ebe6] bg-white px-4 py-3">

    {/* COMPACT LIKE AND COMMENT BAR */}
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleLike}
          disabled={liking || loading}
          aria-pressed={isLiked}
          className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition hover:scale-105 ${
            isLiked
              ? "bg-[#fff0ee] text-[#df8272]"
              : "bg-[#faf7f3] text-gray-600 hover:bg-[#fff0ee] hover:text-[#df8272]"
          }`}
        >
          <span className="text-lg">{isLiked ? "♥" : "♡"}</span>
          {isLiked ? "Liked" : "Like"}
        </button>

        <span className="text-xs text-gray-500">
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setShowComments((value) => !value)}
        className="rounded-full px-3 py-2 text-xs font-semibold text-[#b87568] transition hover:bg-[#fff4f0]"
      >
        💬 {comments.length} Comments
        <span className="ml-1">{showComments ? "↑" : "↓"}</span>
      </button>
    </div>

    {/* COLLAPSIBLE COMMENTS */}
    {showComments && (
      <div className="mt-4 border-t border-[#f0ebe6] pt-4">
        <h4 className="mb-3 text-sm font-bold text-[#302c29]">
          Conversation
        </h4>

        <form onSubmit={handleCommentSubmit}>
          <div className="flex items-center gap-2 rounded-full border border-[#eee7df] bg-[#faf9f6] p-2 focus-within:border-[#df8272]">
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Write a comment..."
              maxLength={1000}
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
            />

            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="shrink-0 rounded-full bg-[#df8272] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#c96f60] disabled:opacity-50"
            >
              {submitting ? "..." : "Post"}
            </button>
          </div>
        </form>

        <p className="mt-1 text-right text-[10px] text-gray-400">
          {commentText.length}/1000
        </p>

        <div className="mt-3 space-y-3">
          {loading ? (
            <p className="text-xs text-gray-400">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="rounded-xl bg-[#faf9f6] p-3 text-center text-xs text-gray-500">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="rounded-xl bg-[#faf9f6] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f5e3dc] text-xs font-bold text-[#bc7465]">
                      {comment.user_id === userId ? "Y" : "V"}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[#39322e]">
                        {comment.user_id === userId ? "You" : "Viora member"}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {comment.user_id === userId && (
                    <button
                      type="button"
                      disabled={deletingComment === comment.id}
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-700 disabled:opacity-50"
                    >
                      {deletingComment === comment.id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-5 text-gray-600">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    )}
  </div>
);

    <div className="border-t border-[#f0ebe6] bg-white px-4 py-5 sm:px-5">

      {/* LIKE AND COMMENT COUNTS */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        <button
          type="button"
          onClick={handleLike}
          disabled={liking || loading}
          aria-label={isLiked ? "Unlike post" : "Like post"}
          aria-pressed={isLiked}
          className={`group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 ${
            isLiked
              ? "bg-[#fff0ee] text-[#df8272]"
              : "bg-[#faf7f3] text-[#625b55] hover:bg-[#fff0ee] hover:text-[#df8272]"
          }`}
        >
          <span
            className={`text-xl transition-transform duration-200 ${
              isLiked ? "scale-110" : "group-hover:scale-125"
            }`}
          >
            {isLiked ? "♥" : "♡"}
          </span>

          {isLiked ? "Liked" : "Like"}
        </button>

        <div className="flex items-center gap-4 text-xs font-medium text-[#99918a] sm:text-sm">
          <span>
            {likeCount} {likeCount === 1 ? "like" : "likes"}
          </span>

          <span className="h-4 w-px bg-[#eae5df]" />

          <span>
            {comments.length}{" "}
            {comments.length === 1 ? "comment" : "comments"}
          </span>
        </div>
      </div>

      {/* COMMENT FORM */}
      <div className="mt-5">

        <h4 className="mb-3 text-sm font-bold text-[#302c29]">
          Join the conversation
        </h4>

        <form onSubmit={handleCommentSubmit}>
          <div className="rounded-2xl border border-[#eee7df] bg-[#faf9f6] p-3 transition focus-within:border-[#df8272] focus-within:bg-white">

            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder={
                userId
                  ? "Share your thoughts..."
                  : "Sign in to join the conversation..."
              }
              rows={2}
              maxLength={1000}
              className="w-full resize-none bg-transparent px-1 py-1 text-sm leading-6 text-[#302c29] outline-none placeholder:text-[#aaa29a]"
            />

            <div className="mt-2 flex items-center justify-between border-t border-[#eee7df] pt-3">
              <span className="text-[11px] text-[#aaa29a]">
                {commentText.length}/1000
              </span>

              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="rounded-full bg-[#df8272] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#c96f60] hover:shadow-md disabled:cursor-not-allowed disabled:bg-[#d8d2cc] disabled:shadow-none"
              >
                {submitting ? "Posting..." : "Post comment ↗"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-[#fff0ee] px-3 py-2 text-xs text-[#b94f43]"
        >
          {errorMessage}
        </p>
      )}

      {/* COMMENTS */}
      <div className="mt-6">

        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#302c29]">
            Comments
          </h4>

          <span className="rounded-full bg-[#faf7f3] px-3 py-1 text-[11px] font-semibold text-[#958b82]">
            {comments.length}
          </span>
        </div>

        {loading ? (
          <div className="animate-pulse rounded-2xl bg-[#faf7f3] p-5">
            <div className="h-3 w-1/3 rounded bg-[#e9e2da]" />
            <div className="mt-3 h-3 w-2/3 rounded bg-[#e9e2da]" />
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl bg-[#faf9f6] px-4 py-6 text-center">
            <span className="text-2xl">✦</span>
            <p className="mt-2 text-sm font-semibold text-[#746b63]">
              No comments yet
            </p>
            <p className="mt-1 text-xs text-[#aaa29a]">
              Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-2xl border border-[#f0ebe6] bg-[#fffefd] p-4 transition hover:border-[#e9d8d0]"
              >
                <div className="flex items-start justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5e3dc] text-sm font-bold text-[#bc7465]">
                      {comment.user_id === userId ? "Y" : "V"}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#39322e]">
                        {comment.user_id === userId
                          ? "You"
                          : "Viora member"}
                      </p>

                      <p className="mt-0.5 text-[10px] text-[#aaa29a]">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {comment.user_id === userId && (
                    <button
                      type="button"
                      disabled={deletingComment === comment.id}
                      onClick={() => handleDeleteComment(comment.id)}
                      className="shrink-0 text-[11px] font-semibold text-[#d17c70] transition hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingComment === comment.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  )}
                </div>

                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#625b55]">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  
}

