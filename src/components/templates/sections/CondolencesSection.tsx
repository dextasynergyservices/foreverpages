"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Memorial } from "@/generated/prisma";
import { useTranslations } from "@/hooks/useTranslations";
import { useSession } from "next-auth/react";
import {
  useCondolences,
  useCreateCondolence,
  useDeleteCondolence,
  formatCondolenceDate,
  type Condolence,
} from "@/hooks/useCondolences";
import { Heart, MessageSquare, Loader2, Send, Trash2, User, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textArea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface CondolencesSectionProps {
  memorial: Memorial;
  layout?: string;
}

export const CondolencesSection: React.FC<CondolencesSectionProps> = ({ memorial }) => {
  const { t } = useTranslations();
  const { data: session } = useSession();
  const { data: condolencesData, isLoading, error } = useCondolences(memorial.id);
  const createCondolence = useCreateCondolence(memorial.id);
  const deleteCondolence = useDeleteCondolence(memorial.id);

  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const condolences = condolencesData?.data || [];

  const sectionStyle: React.CSSProperties = {
    paddingTop: "var(--spacing, 3rem)",
    paddingBottom: "var(--spacing, 3rem)",
    backgroundColor: "var(--color-body-bg, #f3f4f6)",
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: "var(--container-width, 64rem)",
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: "var(--spacing, 1.5rem)",
    paddingRight: "var(--spacing, 1.5rem)",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "var(--font-heading-size, 1.875rem)",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "2rem",
    color: "var(--color-header-text, #1f2937)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
  };

  const contentBoxStyle: React.CSSProperties = {
    backgroundColor: "var(--color-header-bg, white)",
    borderRadius: "var(--border-radius, 0.5rem)",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    padding: "2rem",
  };

  const formBoxStyle: React.CSSProperties = {
    backgroundColor: "var(--color-header-bg, white)",
    borderRadius: "var(--border-radius, 0.5rem)",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    padding: "1.5rem",
    marginBottom: "1.5rem",
  };

  const condolenceCardStyle: React.CSSProperties = {
    backgroundColor: "var(--color-body-bg, #f9fafb)",
    borderRadius: "var(--border-radius, 0.5rem)",
    padding: "1.25rem",
    marginBottom: "1rem",
    border: "1px solid rgba(0, 0, 0, 0.05)",
  };

  const avatarStyle: React.CSSProperties = {
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: "50%",
    backgroundColor: "var(--color-primary, #6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "600",
    fontSize: "1rem",
    flexShrink: 0,
    overflow: "hidden",
  };

  const authorNameStyle: React.CSSProperties = {
    fontWeight: "600",
    color: "var(--color-header-text, #1f2937)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
    fontSize: "var(--font-body-size, 0.9375rem)",
  };

  const dateStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    color: "var(--color-body-text, #6b7280)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
  };

  const contentStyle: React.CSSProperties = {
    color: "var(--color-body-text, #374151)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
    fontSize: "var(--font-body-size, 1rem)",
    lineHeight: "1.625",
    whiteSpace: "pre-wrap",
    marginTop: "0.75rem",
  };

  const loadingStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "3rem",
    color: "var(--color-body-text, #6b7280)",
  };

  const emptyStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "2rem",
    color: "var(--color-body-text, #6b7280)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error(t("condolences.errors.emptyMessage", {}, "Please enter a message"));
      return;
    }

    if (!session?.user) {
      toast.error(
        t("condolences.errors.loginRequired", {}, "Please sign in to leave a condolence")
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await createCondolence.mutateAsync({
        content: message.trim(),
        isAnonymous,
      });
      setMessage("");
      setIsAnonymous(false);
      toast.success(t("condolences.success.posted", {}, "Your condolence has been posted"));
    } catch {
      toast.error(
        t("condolences.errors.postFailed", {}, "Failed to post condolence. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (
      !confirm(
        t("condolences.confirmDelete", {}, "Are you sure you want to delete this condolence?")
      )
    ) {
      return;
    }

    try {
      await deleteCondolence.mutateAsync(postId);
      toast.success(t("condolences.success.deleted", {}, "Condolence deleted"));
    } catch {
      toast.error(t("condolences.errors.deleteFailed", {}, "Failed to delete condolence"));
    }
  };

  const getAuthorName = (condolence: Condolence): string => {
    // Check if anonymous: either isAnonymous flag or authorName is "Anonymous"
    const isAnon =
      condolence.isAnonymous ||
      condolence.authorName === "Anonymous" ||
      (!condolence.author && !condolence.authorId);
    if (isAnon) {
      return t("condolences.anonymous", {}, "Anonymous");
    }
    return condolence.author?.name || t("condolences.anonymous", {}, "Anonymous");
  };

  const getInitials = (name: string): string => {
    if (name === "Anonymous" || !name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const canDelete = (condolence: Condolence): boolean => {
    if (!session?.user?.id) return false;
    return condolence.authorId === session.user.id || memorial.ownerId === session.user.id;
  };

  return (
    <section style={sectionStyle}>
      <div style={containerStyle}>
        <h2 style={titleStyle}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <Heart size={28} />
            {t("condolences.title", {}, "Condolences")}
          </span>
        </h2>

        {/* Condolence Form */}
        {session?.user ? (
          <div style={formBoxStyle}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "1rem" }}>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t(
                    "condolences.placeholder",
                    {
                      name: `${memorial.firstName || ""} ${memorial.lastName || ""}`.trim(),
                    },
                    "Share your thoughts and memories..."
                  )}
                  rows={4}
                  maxLength={5000}
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    color: "var(--color-body-text, #6b7280)",
                  }}
                >
                  <Checkbox
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                    disabled={isSubmitting}
                  />
                  <EyeOff size={16} />
                  {t("condolences.postAnonymously", {}, "Post anonymously")}
                </label>

                <Button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {t("condolences.submit", {}, "Send Condolence")}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ ...formBoxStyle, textAlign: "center" }}>
            <p style={{ color: "var(--color-body-text, #6b7280)", marginBottom: "0.5rem" }}>
              {t("condolences.signInToPost", {}, "Sign in to leave a condolence message")}
            </p>
          </div>
        )}

        {/* Condolences List */}
        <div style={contentBoxStyle}>
          {isLoading ? (
            <div style={loadingStyle}>
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : error ? (
            <div style={emptyStyle}>
              <p>{t("condolences.errors.loadFailed", {}, "Failed to load condolences")}</p>
            </div>
          ) : condolences.length === 0 ? (
            <div style={emptyStyle}>
              <MessageSquare size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
              <p>
                {t(
                  "condolences.empty",
                  {},
                  "No condolences yet. Be the first to share your thoughts."
                )}
              </p>
            </div>
          ) : (
            <div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-body-text, #6b7280)",
                  marginBottom: "1rem",
                  fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
                }}
              >
                {t(
                  "condolences.count",
                  { count: condolencesData?.pagination.totalCount || condolences.length },
                  `${condolencesData?.pagination.totalCount || condolences.length} condolence${(condolencesData?.pagination.totalCount || condolences.length) === 1 ? "" : "s"}`
                )}
              </div>

              {condolences.map((condolence) => {
                const authorName = getAuthorName(condolence);
                return (
                  <div key={condolence.id} style={condolenceCardStyle}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                      }}
                    >
                      <div style={avatarStyle}>
                        {condolence.isAnonymous ||
                        condolence.authorName === "Anonymous" ||
                        !condolence.author ? (
                          <User size={18} />
                        ) : condolence.author?.image ? (
                          <Image
                            src={condolence.author.image}
                            alt={authorName}
                            width={40}
                            height={40}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          getInitials(authorName)
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.5rem",
                          }}
                        >
                          <div>
                            <span style={authorNameStyle}>{authorName}</span>
                            <span style={{ ...dateStyle, marginLeft: "0.75rem" }}>
                              {formatCondolenceDate(condolence.createdAt)}
                            </span>
                          </div>

                          {canDelete(condolence) && (
                            <button
                              onClick={() => handleDelete(condolence.id)}
                              title={t("condolences.delete", {}, "Delete")}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "0.25rem",
                                color: "var(--color-body-text, #9ca3af)",
                                opacity: 0.7,
                                transition: "opacity 0.2s",
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
                              onMouseOut={(e) => (e.currentTarget.style.opacity = "0.7")}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div style={contentStyle}>{condolence.content}</div>

                        {condolence._count.comments > 0 && (
                          <div
                            style={{
                              marginTop: "0.75rem",
                              fontSize: "0.875rem",
                              color: "var(--color-body-text, #6b7280)",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <MessageSquare size={14} />
                            {condolence._count.comments}{" "}
                            {condolence._count.comments === 1
                              ? t("condolences.reply", {}, "reply")
                              : t("condolences.replies", {}, "replies")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {condolencesData?.pagination.hasMore && (
                <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                  <Button variant="outline">{t("condolences.loadMore", {}, "Load More")}</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
