import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/user/account - Permanently delete user account and all associated data
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Start a transaction to delete all user data
    // The schema has cascade deletes set up, so deleting the user will cascade to related records
    await prisma.$transaction(async (tx) => {
      // 1. Get all memorials owned by the user
      const ownedMemorials = await tx.memorial.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });

      const memorialIds = ownedMemorials.map((m: { id: string }) => m.id);

      // 2. Delete memorial-related data that might not cascade automatically
      if (memorialIds.length > 0) {
        // Delete timeline events
        await tx.timelineEvent.deleteMany({
          where: { memorialId: { in: memorialIds } },
        });

        // Delete family members
        await tx.familyMember.deleteMany({
          where: { memorialId: { in: memorialIds } },
        });

        // Delete invitations for owned memorials
        await tx.invitation.deleteMany({
          where: { memorialId: { in: memorialIds } },
        });

        // Delete activity logs for owned memorials
        await tx.activityLog.deleteMany({
          where: { memorialId: { in: memorialIds } },
        });

        // Delete posts on owned memorials
        await tx.post.deleteMany({
          where: { memorialId: { in: memorialIds } },
        });

        // Delete reactions on owned memorials
        await tx.reaction.deleteMany({
          where: { memorialId: { in: memorialIds } },
        });

        // Delete virtual candles on owned memorials
        await tx.virtualCandle.deleteMany({
          where: { memorialId: { in: memorialIds } },
        });

        // Delete virtual flowers on owned memorials
        await tx.virtualFlower.deleteMany({
          where: { memorialId: { in: memorialIds } },
        });

        // Delete guestbook entries on owned memorials
        await tx.guestbookEntry.deleteMany({
          where: { memorialId: { in: memorialIds } },
        });

        // Delete uploads on owned memorials
        await tx.upload.deleteMany({
          where: { memorialId: { in: memorialIds } },
        });

        // Delete memorial drafts
        await tx.memorialDraft.deleteMany({
          where: { memorialId: { in: memorialIds } },
        });

        // Delete memorial presence
        await tx.memorialPresence.deleteMany({
          where: { memorialId: { in: memorialIds } },
        });

        // Delete edit locks
        await tx.editLock.deleteMany({
          where: { memorialId: { in: memorialIds } },
        });

        // Delete comments on owned memorials
        await tx.comment.deleteMany({
          where: { memorialId: { in: memorialIds } },
        });

        // Finally, delete the memorials
        await tx.memorial.deleteMany({
          where: { id: { in: memorialIds } },
        });
      }

      // 3. Clean up user's activity on other memorials
      await tx.post.deleteMany({
        where: { authorId: userId },
      });

      await tx.comment.deleteMany({
        where: { authorId: userId },
      });

      await tx.reaction.deleteMany({
        where: { userId: userId },
      });

      await tx.activityLog.deleteMany({
        where: { userId: userId },
      });

      // 4. Delete user's sessions (they will be logged out)
      await tx.session.deleteMany({
        where: { userId: userId },
      });

      // 5. Delete OAuth accounts linked to user
      await tx.account.deleteMany({
        where: { userId: userId },
      });

      // 6. Delete user's notifications
      await tx.notification.deleteMany({
        where: { userId: userId },
      });

      // 7. Delete push subscriptions
      await tx.pushSubscription.deleteMany({
        where: { userId: userId },
      });

      // 8. Delete invitations sent by user
      await tx.invitation.deleteMany({
        where: { invitedById: userId },
      });

      // 9. Delete user templates
      await tx.userTemplate.deleteMany({
        where: { userId: userId },
      });

      // 10. Delete payments
      await tx.payment.deleteMany({
        where: { userId: userId },
      });

      // 11. Finally, delete the user
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return NextResponse.json(
      { message: "Account and all associated data have been permanently deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user account:", error);
    return NextResponse.json(
      { message: "Failed to delete account. Please try again or contact support." },
      { status: 500 }
    );
  }
}
