import { createEvent, DateArray, EventAttributes } from "ics";

interface MemorialData {
  id: string;
  firstName: string;
  lastName: string;
  funeralDate?: Date | null;
  funeralLocation?: string | null;
  funeralDetails?: string | null;
  biography?: string | null;
}

interface InvitationData {
  email: string;
  name: string;
}

interface CalendarInviteResult {
  success: boolean;
  icsContent?: string;
  error?: string;
}

/**
 * Converts a JavaScript Date to the DateArray format required by the ics library
 * @param date - JavaScript Date object
 * @returns DateArray [year, month, day, hour, minute]
 */
function dateToDateArray(date: Date): DateArray {
  return [
    date.getFullYear(),
    date.getMonth() + 1, // Month is 0-indexed in JS, 1-indexed in ics
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ];
}

/**
 * Generates an iCalendar (.ics) file content for a memorial service
 * @param memorial - Memorial data including service details
 * @param invitation - Invitation data including guest email
 * @returns CalendarInviteResult with ics content or error
 */
export function generateMemorialCalendarInvite(
  memorial: MemorialData,
  invitation: InvitationData
): CalendarInviteResult {
  // Validate that we have a funeral date
  if (!memorial.funeralDate) {
    return {
      success: false,
      error: "Memorial service date is not set",
    };
  }

  const serviceDate = new Date(memorial.funeralDate);

  // Calculate end time (assume 2 hours duration if not specified)
  const endDate = new Date(serviceDate);
  endDate.setHours(endDate.getHours() + 2);

  // Build description with memorial details
  const descriptionParts: string[] = [];

  descriptionParts.push(`Memorial Service for ${memorial.firstName} ${memorial.lastName}`);
  descriptionParts.push("");

  if (memorial.biography) {
    // Truncate biography to keep description reasonable
    const bioPreview =
      memorial.biography.length > 200
        ? memorial.biography.substring(0, 200) + "..."
        : memorial.biography;
    descriptionParts.push(bioPreview);
    descriptionParts.push("");
  }

  if (memorial.funeralDetails) {
    descriptionParts.push("Service Details:");
    descriptionParts.push(memorial.funeralDetails);
    descriptionParts.push("");
  }

  descriptionParts.push("You have been invited to attend this memorial service.");
  descriptionParts.push("Please RSVP using the link in your invitation email.");

  // Create the event configuration
  const event: EventAttributes = {
    start: dateToDateArray(serviceDate),
    end: dateToDateArray(endDate),
    title: `Memorial Service - ${memorial.firstName} ${memorial.lastName}`,
    description: descriptionParts.join("\n"),
    location: memorial.funeralLocation || "Location to be determined",
    status: "CONFIRMED",
    busyStatus: "BUSY",
    organizer: {
      name: "ForeverPages Memorial Services",
      email: "noreply@foreverpages.online",
    },
    attendees: [
      {
        name: invitation.name,
        email: invitation.email,
        rsvp: true,
        role: "REQ-PARTICIPANT",
      },
    ],
    // Set alarm/reminder for 1 day before
    alarms: [
      {
        action: "display",
        description: `Reminder: Memorial Service for ${memorial.firstName} ${memorial.lastName}`,
        trigger: { hours: 24, before: true },
      },
    ],
  };

  // Generate the ICS content
  const { error, value } = createEvent(event);

  if (error) {
    return {
      success: false,
      error: `Failed to create calendar event: ${error.message}`,
    };
  }

  return {
    success: true,
    icsContent: value,
  };
}

/**
 * Generates a filename for the calendar invite
 * @param memorial - Memorial data
 * @returns Filename string
 */
export function generateCalendarInviteFilename(memorial: MemorialData): string {
  const lastName = memorial.lastName.replace(/[^a-zA-Z0-9]/g, "");
  const firstName = memorial.firstName.replace(/[^a-zA-Z0-9]/g, "");
  return `memorial-${firstName}-${lastName}.ics`;
}
