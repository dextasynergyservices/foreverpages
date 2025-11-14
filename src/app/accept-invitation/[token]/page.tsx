"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Edit,
  Eye,
  Users,
  Calendar,
  Heart,
} from "lucide-react";
import Image from "next/image";
import toastNotification from "@/lib/toastNotifications";

interface InvitationData {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  role: string;
  status: string;
  message?: string;
  expiresAt: string;
  sentAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  memorial: {
    id: string;
    slug: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    coverPhoto?: string;
    birthDate: string;
    deathDate: string;
  };
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case "ADMIN":
      return <Shield className="h-6 w-6" />;
    case "EDITOR":
      return <Edit className="h-6 w-6" />;
    case "CONTRIBUTOR":
      return <Users className="h-6 w-6" />;
    case "VIEWER":
      return <Eye className="h-6 w-6" />;
    default:
      return <Shield className="h-6 w-6" />;
  }
};

const getRolePermissions = (role: string) => {
  switch (role) {
    case "ADMIN":
      return [
        "Manage all memorial settings",
        "Approve and moderate tributes",
        "Upload and organize photos",
        "Invite other collaborators",
        "View analytics and insights",
      ];
    case "EDITOR":
      return [
        "Edit memorial content",
        "Approve and moderate tributes",
        "Manage gallery and timeline",
        "View analytics",
      ];
    case "CONTRIBUTOR":
      return ["Upload photos and videos", "Add tributes and comments", "Share memories"];
    case "VIEWER":
      return ["View memorial content", "Read tributes and comments"];
    default:
      return [];
  }
};

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invitations/accept?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load invitation");
        return;
      }

      setInvitation(data.data.invitation);
      // Pre-fill email if available
      if (data.data.invitation.email) {
        setEmail(data.data.invitation.email);
      }
      if (data.data.invitation.name) {
        setName(data.data.invitation.name);
      }
    } catch (err) {
      console.error("Error fetching invitation:", err);
      setError("Failed to load invitation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!email.trim()) {
      toastNotification.error("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toastNotification.error("Please enter a valid email address");
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email: email.toLowerCase(),
          name: name.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toastNotification.error(data.message || "Failed to accept invitation");
        return;
      }

      toastNotification.success("Invitation accepted successfully!");

      // Redirect based on response
      // Collaborators don't need subscriptions - they access via owner's subscription
      setTimeout(() => {
        router.push(data.data.redirectUrl);
      }, 1500);
    } catch (err) {
      console.error("Error accepting invitation:", err);
      toastNotification.error("An error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm("Are you sure you want to decline this invitation?")) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch("/api/invitations/decline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        toastNotification.error(data.message || "Failed to decline invitation");
        return;
      }

      toastNotification.success("Invitation declined");
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      console.error("Error declining invitation:", err);
      toastNotification.error("An error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="h-6 w-6" />
                Invitation Not Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error || "This invitation could not be found or is no longer valid."}
              </p>
              <Button onClick={() => router.push("/")} variant="outline">
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Handle already accepted
  if (invitation.status === "ACCEPTED") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-6 w-6" />
                Invitation Already Accepted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This invitation was accepted on{" "}
                {new Date(invitation.acceptedAt!).toLocaleDateString()}.
              </p>
              <Button onClick={() => router.push("/login")} variant="memorial">
                Sign In to Access Memorial
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Handle declined
  if (invitation.status === "DECLINED") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <XCircle className="h-6 w-6" />
                Invitation Declined
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This invitation was declined on{" "}
                {new Date(invitation.declinedAt!).toLocaleDateString()}.
              </p>
              <Button onClick={() => router.push("/")} variant="outline">
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const memorialImage =
    invitation.memorial.profilePhoto ||
    invitation.memorial.coverPhoto ||
    "https://images.unsplash.com/photo-1494621930069-4fd4b2e24a11?w=800&h=400&fit=crop";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2">
            Memorial Management Invitation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You&apos;ve been invited to help manage a memorial page
          </p>
        </div>

        {/* Memorial Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="relative h-48 w-full">
            <Image src={memorialImage} alt="Memorial" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h2 className="text-2xl font-serif font-bold">
                In Memory of {invitation.memorial.firstName} {invitation.memorial.lastName}
              </h2>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(invitation.memorial.birthDate).getFullYear()} -{" "}
                  {new Date(invitation.memorial.deathDate).getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Invitation Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Invitation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Invited by:</p>
              <p className="font-semibold">
                {invitation.invitedBy.name || invitation.invitedBy.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Role offered:</p>
              <div className="flex items-center gap-2 mt-1">
                {getRoleIcon(invitation.role)}
                <span className="font-semibold text-lg">{invitation.role}</span>
              </div>
            </div>

            {invitation.message && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Personal message:</p>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="italic text-gray-700 dark:text-gray-300">
                    &quot;{invitation.message}&quot;
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Expires on {new Date(invitation.expiresAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>As a {invitation.role}, you will be able to:</CardTitle>
            <CardDescription>Here&apos;s what you can do with this level of access</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {getRolePermissions(invitation.role).map((permission, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{permission}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Accept Form */}
        <Card>
          <CardHeader>
            <CardTitle>Accept Invitation</CardTitle>
            <CardDescription>
              Enter your details to accept this invitation and start managing the memorial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Your Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email">
                Your Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                We&apos;ll link this invitation to your account or help you create one
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAccept}
                disabled={processing || !email.trim()}
                className="flex-1"
                size="lg"
                variant="memorial"
              >
                {processing ? "Processing..." : "Accept Invitation"}
              </Button>
              <Button onClick={handleDecline} disabled={processing} variant="outline" size="lg">
                Decline
              </Button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              By accepting, you agree to help manage this memorial respectfully and in accordance
              with our Terms of Service.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
