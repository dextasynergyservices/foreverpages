import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TemplateConfiguration, FormSection } from "@/types/formConfig";

/**
 * Default section configurations for templates
 * These define the form structure for different memorial templates
 */
const DEFAULT_SECTIONS: Record<string, FormSection[]> = {
  classic: [
    {
      id: "basic-info",
      title: "Basic Information",
      description: "Tell us about your loved one",
      columns: 2,
      fields: [
        {
          id: "fullName",
          name: "fullName",
          type: "text",
          label: "Full Name",
          placeholder: "Enter the full name",
          required: true,
          translationKey: "dashboard.pageBuilder.basicInfo.fullName.label",
          translationPlaceholderKey: "dashboard.pageBuilder.basicInfo.fullName.placeholder",
        },
        {
          id: "birthDate",
          name: "birthDate",
          type: "date",
          label: "Birth Date",
          required: false,
          translationKey: "dashboard.pageBuilder.basicInfo.birthDate.label",
        },
        {
          id: "passingDate",
          name: "passingDate",
          type: "date",
          label: "Date of Passing",
          required: false,
          translationKey: "dashboard.pageBuilder.basicInfo.passingDate.label",
        },
        {
          id: "relationship",
          name: "relationship",
          type: "select",
          label: "Your Relationship",
          required: false,
          options: [
            {
              value: "spouse",
              label: "Spouse",
              translationKey: "dashboard.pageBuilder.basicInfo.relationship.options.spouse",
            },
            {
              value: "child",
              label: "Child",
              translationKey: "dashboard.pageBuilder.basicInfo.relationship.options.child",
            },
            {
              value: "parent",
              label: "Parent",
              translationKey: "dashboard.pageBuilder.basicInfo.relationship.options.parent",
            },
            {
              value: "sibling",
              label: "Sibling",
              translationKey: "dashboard.pageBuilder.basicInfo.relationship.options.sibling",
            },
            {
              value: "family",
              label: "Other Family",
              translationKey: "dashboard.pageBuilder.basicInfo.relationship.options.family",
            },
            {
              value: "friend",
              label: "Friend",
              translationKey: "dashboard.pageBuilder.basicInfo.relationship.options.friend",
            },
          ],
          translationKey: "dashboard.pageBuilder.basicInfo.relationship.label",
        },
      ],
    },
    {
      id: "biography",
      title: "Biography",
      description: "Share their story",
      columns: 1,
      fields: [
        {
          id: "shortBio",
          name: "shortBio",
          type: "textarea",
          label: "Brief Biography",
          placeholder:
            "Share a few words about their life, personality, and what made them special...",
          required: false,
          translationKey: "dashboard.pageBuilder.basicInfo.shortBio.label",
          translationPlaceholderKey: "dashboard.pageBuilder.basicInfo.shortBio.placeholder",
        },
      ],
    },
    {
      id: "photos",
      title: "Photos & Media",
      description: "Upload meaningful images",
      columns: 1,
      fields: [
        {
          id: "profilePhoto",
          name: "profilePhoto",
          type: "file",
          label: "Profile Photo",
          helpText: "Upload a beautiful photo that represents them",
          required: false,
          translationKey: "dashboard.pageBuilder.memorialDetails.profilePhoto.label",
          translationHelpTextKey: "dashboard.pageBuilder.memorialDetails.profilePhoto.helpText",
        },
        {
          id: "backgroundImage",
          name: "backgroundImage",
          type: "file",
          label: "Background Image (Optional)",
          helpText: "A meaningful place or memory",
          required: false,
          translationKey: "dashboard.pageBuilder.memorialDetails.backgroundImage.label",
          translationHelpTextKey: "dashboard.pageBuilder.memorialDetails.backgroundImage.helpText",
        },
      ],
    },
    {
      id: "memorial",
      title: "Memorial Message",
      description: "Final touches",
      columns: 1,
      fields: [
        {
          id: "memorialMessage",
          name: "memorialMessage",
          type: "textarea",
          label: "Memorial Message",
          placeholder: "A special message or quote that captures their spirit...",
          required: false,
          translationKey: "dashboard.pageBuilder.memorialDetails.memorialMessage.label",
          translationPlaceholderKey:
            "dashboard.pageBuilder.memorialDetails.memorialMessage.placeholder",
        },
        {
          id: "privacySetting",
          name: "privacySetting",
          type: "select",
          label: "Privacy Setting",
          required: true,
          defaultValue: "public",
          options: [
            {
              value: "public",
              label: "Public - Anyone can view",
              translationKey: "dashboard.pageBuilder.memorialDetails.privacySetting.options.public",
            },
            {
              value: "unlisted",
              label: "Unlisted - Only with link",
              translationKey:
                "dashboard.pageBuilder.memorialDetails.privacySetting.options.unlisted",
            },
            {
              value: "private",
              label: "Private - Invited only",
              translationKey:
                "dashboard.pageBuilder.memorialDetails.privacySetting.options.private",
            },
          ],
          translationKey: "dashboard.pageBuilder.memorialDetails.privacySetting.label",
        },
      ],
    },
  ],
  modern: [
    {
      id: "basic-info",
      title: "Basic Information",
      description: "Tell us about your loved one",
      columns: 2,
      fields: [
        {
          id: "fullName",
          name: "fullName",
          type: "text",
          label: "Full Name",
          placeholder: "Enter the full name",
          required: true,
          translationKey: "dashboard.pageBuilder.basicInfo.fullName.label",
          translationPlaceholderKey: "dashboard.pageBuilder.basicInfo.fullName.placeholder",
        },
        {
          id: "birthDate",
          name: "birthDate",
          type: "date",
          label: "Birth Date",
          required: false,
          translationKey: "dashboard.pageBuilder.basicInfo.birthDate.label",
        },
        {
          id: "passingDate",
          name: "passingDate",
          type: "date",
          label: "Date of Passing",
          required: false,
          translationKey: "dashboard.pageBuilder.basicInfo.passingDate.label",
        },
      ],
    },
    {
      id: "gallery",
      title: "Photo Gallery",
      description: "Showcase meaningful moments",
      columns: 1,
      fields: [
        {
          id: "profilePhoto",
          name: "profilePhoto",
          type: "file",
          label: "Profile Photo",
          required: false,
          translationKey: "dashboard.pageBuilder.memorialDetails.profilePhoto.label",
        },
        {
          id: "galleryPhotos",
          name: "galleryPhotos",
          type: "file",
          label: "Gallery Photos (Multiple)",
          required: false,
        },
      ],
    },
    {
      id: "memorial",
      title: "Memorial Message",
      columns: 1,
      fields: [
        {
          id: "memorialMessage",
          name: "memorialMessage",
          type: "textarea",
          label: "Memorial Message",
          required: false,
          translationKey: "dashboard.pageBuilder.memorialDetails.memorialMessage.label",
        },
      ],
    },
  ],
  garden: [
    {
      id: "basic-info",
      title: "Personal Details",
      columns: 2,
      fields: [
        {
          id: "fullName",
          name: "fullName",
          type: "text",
          label: "Full Name",
          required: true,
          translationKey: "dashboard.pageBuilder.basicInfo.fullName.label",
        },
        {
          id: "birthDate",
          name: "birthDate",
          type: "date",
          label: "Birth Date",
          required: false,
          translationKey: "dashboard.pageBuilder.basicInfo.birthDate.label",
        },
      ],
    },
    {
      id: "memories",
      title: "Cherished Memories",
      columns: 1,
      fields: [
        {
          id: "shortBio",
          name: "shortBio",
          type: "textarea",
          label: "Their Story",
          required: false,
          translationKey: "dashboard.pageBuilder.basicInfo.shortBio.label",
        },
      ],
    },
  ],
  celebration: [
    {
      id: "basic-info",
      title: "Celebration Details",
      columns: 2,
      fields: [
        {
          id: "fullName",
          name: "fullName",
          type: "text",
          label: "Full Name",
          required: true,
          translationKey: "dashboard.pageBuilder.basicInfo.fullName.label",
        },
        {
          id: "birthDate",
          name: "birthDate",
          type: "date",
          label: "Birth Date",
          required: false,
          translationKey: "dashboard.pageBuilder.basicInfo.birthDate.label",
        },
        {
          id: "passingDate",
          name: "passingDate",
          type: "date",
          label: "Date of Passing",
          required: false,
          translationKey: "dashboard.pageBuilder.basicInfo.passingDate.label",
        },
      ],
    },
    {
      id: "celebration",
      title: "Celebrate Their Life",
      columns: 1,
      fields: [
        {
          id: "memorialMessage",
          name: "memorialMessage",
          type: "textarea",
          label: "Happy Memories & Stories",
          required: false,
          translationKey: "dashboard.pageBuilder.memorialDetails.memorialMessage.label",
        },
        {
          id: "profilePhoto",
          name: "profilePhoto",
          type: "file",
          label: "Favorite Photo",
          required: false,
          translationKey: "dashboard.pageBuilder.memorialDetails.profilePhoto.label",
        },
      ],
    },
  ],
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "Template ID is required" }, { status: 400 });
    }

    // Fetch template from database
    const template = await prisma.template.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        supportedSections: true,
      },
    });

    if (!template) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    // Get the default sections for this template
    const templateSlug = template.slug.toLowerCase();
    const sections = DEFAULT_SECTIONS[templateSlug] || DEFAULT_SECTIONS.classic;

    // Filter sections by what template supports
    const filteredSections =
      template.supportedSections && Array.isArray(template.supportedSections)
        ? sections.filter((section) =>
            (template.supportedSections as string[]).includes(section.id)
          )
        : sections;

    const config: TemplateConfiguration = {
      id: template.id,
      name: template.name,
      slug: template.slug,
      sections: filteredSections,
      version: 1,
      supportedSections: template.supportedSections || [],
    };

    return NextResponse.json({
      message: "Template configuration retrieved successfully",
      data: config,
    });
  } catch (error) {
    console.error("Error fetching template configuration:", error);
    return NextResponse.json(
      { message: "Failed to fetch template configuration" },
      { status: 500 }
    );
  }
}
