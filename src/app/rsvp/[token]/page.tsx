"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { isValidRSVPTokenFormat, isRSVPTokenExpired } from "@/lib/rsvpTokens";

interface InvitationData {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  rsvpStatus: "ATTENDING" | "NOT_ATTENDING" | "MAYBE" | null;
  rsvpMessage: string | null;
  rsvpAt: string | null;
  expiresAt: string | null;
}

interface MemorialData {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  deathDate: string | null;
  biography: string | null;
  profilePhoto: string | null;
}

export default function RSVPPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [memorial, setMemorial] = useState<MemorialData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [rsvpStatus, setRsvpStatus] = useState<"ATTENDING" | "NOT_ATTENDING" | "MAYBE" | null>(
    null
  );
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("");

  useEffect(() => {
    async function fetchInvitation() {
      // Validate token format
      if (!isValidRSVPTokenFormat(token)) {
        setError("Invalid RSVP link. Please check the URL and try again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/invitations/rsvp?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load invitation details");
          setLoading(false);
          return;
        }

        // Check if token is expired
        if (data.invitation?.expiresAt && isRSVPTokenExpired(new Date(data.invitation.expiresAt))) {
          setError("This RSVP link has expired. Please contact the organizer.");
          setLoading(false);
          return;
        }

        // Check if already RSVPed
        if (data.invitation?.rsvpStatus) {
          setSubmitted(true);
          setRsvpStatus(data.invitation.rsvpStatus);
        }

        setInvitation(data.invitation);
        setMemorial(data.memorial);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching invitation:", err);
        setError("Failed to load invitation details. Please try again later.");
        setLoading(false);
      }
    }

    if (token) {
      fetchInvitation();
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!rsvpStatus) {
      setError("Please select an RSVP option");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/invitations/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          rsvpStatus,
          rsvpMessage: rsvpMessage.trim() || undefined,
          plusOnes: plusOnes > 0 ? plusOnes : undefined,
          dietaryRestrictions: dietaryRestrictions.trim() || undefined,
          accessibilityNeeds: accessibilityNeeds.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to submit RSVP");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setSubmitting(false);
    } catch (err) {
      console.error("Error submitting RSVP:", err);
      setError("Failed to submit RSVP. Please try again later.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load RSVP</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">RSVP Received!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for responding. Your RSVP has been recorded.
          </p>
          {rsvpStatus === "ATTENDING" && (
            <p className="text-purple-600 font-semibold mb-4">We look forward to seeing you!</p>
          )}
          {rsvpStatus === "NOT_ATTENDING" && (
            <p className="text-gray-600 mb-4">Thank you for letting us know.</p>
          )}
          {rsvpStatus === "MAYBE" && (
            <p className="text-gray-600 mb-4">
              We understand. Please let us know once you&apos;ve decided.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Memorial Service RSVP</h1>
            <div className="w-20 h-1 bg-purple-600 mx-auto mb-4"></div>
            {memorial && (
              <>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  {memorial.firstName} {memorial.lastName}
                </h2>
                {(memorial.birthDate || memorial.deathDate) && (
                  <p className="text-gray-600">
                    {memorial.birthDate &&
                      new Date(memorial.birthDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    {memorial.birthDate && memorial.deathDate && " - "}
                    {memorial.deathDate &&
                      new Date(memorial.deathDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                  </p>
                )}
                {memorial.biography && (
                  <p className="text-gray-600 mt-4 text-sm line-clamp-3">{memorial.biography}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* RSVP Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* RSVP Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Will you be attending? *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRsvpStatus("ATTENDING")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    rsvpStatus === "ATTENDING"
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="text-2xl mb-1">✓</div>
                  <div className="font-semibold">Yes</div>
                  <div className="text-xs">I&apos;ll be there</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRsvpStatus("NOT_ATTENDING")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    rsvpStatus === "NOT_ATTENDING"
                      ? "border-red-600 bg-red-50 text-red-700"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="text-2xl mb-1">✗</div>
                  <div className="font-semibold">No</div>
                  <div className="text-xs">Can&apos;t attend</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRsvpStatus("MAYBE")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    rsvpStatus === "MAYBE"
                      ? "border-yellow-600 bg-yellow-50 text-yellow-700"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="text-2xl mb-1">?</div>
                  <div className="font-semibold">Maybe</div>
                  <div className="text-xs">Not sure yet</div>
                </button>
              </div>
            </div>

            {/* Plus Ones */}
            {rsvpStatus === "ATTENDING" && (
              <div>
                <label
                  htmlFor="plusOnes"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Number of additional guests
                </label>
                <input
                  type="number"
                  id="plusOnes"
                  min="0"
                  max="10"
                  value={plusOnes}
                  onChange={(e) => setPlusOnes(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
            )}

            {/* Dietary Restrictions */}
            {rsvpStatus === "ATTENDING" && (
              <div>
                <label
                  htmlFor="dietaryRestrictions"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Dietary restrictions (optional)
                </label>
                <textarea
                  id="dietaryRestrictions"
                  rows={2}
                  value={dietaryRestrictions}
                  onChange={(e) => setDietaryRestrictions(e.target.value)}
                  placeholder="e.g., Vegetarian, Gluten-free, Nut allergy..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                />
              </div>
            )}

            {/* Accessibility Needs */}
            {rsvpStatus === "ATTENDING" && (
              <div>
                <label
                  htmlFor="accessibilityNeeds"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Accessibility needs (optional)
                </label>
                <textarea
                  id="accessibilityNeeds"
                  rows={2}
                  value={accessibilityNeeds}
                  onChange={(e) => setAccessibilityNeeds(e.target.value)}
                  placeholder="e.g., Wheelchair access, Sign language interpreter..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                />
              </div>
            )}

            {/* Message */}
            <div>
              <label
                htmlFor="rsvpMessage"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Personal message (optional)
              </label>
              <textarea
                id="rsvpMessage"
                rows={3}
                value={rsvpMessage}
                onChange={(e) => setRsvpMessage(e.target.value)}
                placeholder="Share your thoughts or memories..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!rsvpStatus || submitting}
              className="w-full py-3 px-6 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Submitting..." : "Submit RSVP"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
