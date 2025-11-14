import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BroadcasterInterface from "@/components/livestream/broadcaster/BroadcasterInterface";

export const metadata: Metadata = {
  title: "Broadcast Livestream | Forever Pages",
  description: "Broadcast memorial service livestream",
};

interface BroadcastPageProps {
  params: {
    id: string;
  };
}

export default async function BroadcastPage({ params }: BroadcastPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/stream/broadcast/" + params.id);
  }

  // Fetch stream and verify ownership
  const stream = await prisma.memorialStream.findUnique({
    where: { id: params.id },
    include: {
      memorial: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          slug: true,
          ownerId: true,
        },
      },
    },
  });

  if (!stream) {
    redirect("/user-dashboard?section=livestreams");
  }

  // Check if user owns the memorial
  if (stream.memorial.ownerId !== session.user.id) {
    redirect("/user-dashboard?section=livestreams");
  }

  // Check if stream is in a broadcastable state
  if (!["SCHEDULED", "STARTING", "LIVE", "PAUSED"].includes(stream.status)) {
    redirect("/user-dashboard?section=livestreams");
  }

  return (
    <div className="min-h-screen bg-black">
      <BroadcasterInterface
        streamId={stream.id}
        streamTitle={stream.title}
        streamStatus={stream.status}
        memorialName={`${stream.memorial.firstName} ${stream.memorial.lastName}`}
        memorialSlug={stream.memorial.slug}
        enableChat={stream.allowComments}
        enableReactions={stream.allowComments} // Use allowComments for reactions too
        quality={stream.streamQuality}
        scheduledFor={stream.scheduledFor}
        scheduledEnd={stream.scheduledEnd}
        autoStart={stream.autoStart}
        autoEnd={stream.autoEnd}
      />
    </div>
  );
}
