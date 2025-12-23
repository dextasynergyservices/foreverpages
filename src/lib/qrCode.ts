import QRCode from "qrcode";

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generates a QR code as a data URL (base64 encoded image)
 * @param url - The URL to encode in the QR code
 * @param options - QR code generation options
 * @returns Data URL string that can be used directly in img src
 */
export async function generateQRCodeDataURL(url: string, options?: QRCodeOptions): Promise<string> {
  const qrOptions = {
    width: options?.width || 300,
    margin: options?.margin || 2,
    color: {
      dark: options?.color?.dark || "#000000",
      light: options?.color?.light || "#FFFFFF",
    },
    errorCorrectionLevel: "M" as const,
  };

  try {
    const dataUrl = await QRCode.toDataURL(url, qrOptions);
    return dataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generates a QR code as a buffer (for server-side use)
 * @param url - The URL to encode in the QR code
 * @param options - QR code generation options
 * @returns Buffer containing PNG image data
 */
export async function generateQRCodeBuffer(url: string, options?: QRCodeOptions): Promise<Buffer> {
  const qrOptions = {
    width: options?.width || 300,
    margin: options?.margin || 2,
    color: {
      dark: options?.color?.dark || "#000000",
      light: options?.color?.light || "#FFFFFF",
    },
    errorCorrectionLevel: "M" as const,
  };

  try {
    const buffer = await QRCode.toBuffer(url, qrOptions);
    return buffer;
  } catch (error) {
    console.error("Error generating QR code buffer:", error);
    throw new Error("Failed to generate QR code buffer");
  }
}

/**
 * Generates a QR code for an invitation RSVP link
 * @param rsvpToken - The RSVP token
 * @param baseUrl - Base URL of the application
 * @param options - QR code generation options
 * @returns Data URL string for the QR code
 */
export async function generateInvitationRSVPQRCode(
  rsvpToken: string,
  baseUrl: string,
  options?: QRCodeOptions
): Promise<string> {
  const rsvpUrl = `${baseUrl}/rsvp/${rsvpToken}`;
  return generateQRCodeDataURL(rsvpUrl, options);
}

/**
 * Generates a QR code for an invitation acceptance link
 * @param invitationToken - The invitation token
 * @param baseUrl - Base URL of the application
 * @param options - QR code generation options
 * @returns Data URL string for the QR code
 */
export async function generateInvitationAcceptQRCode(
  invitationToken: string,
  baseUrl: string,
  options?: QRCodeOptions
): Promise<string> {
  const acceptUrl = `${baseUrl}/invitations/accept?token=${invitationToken}`;
  return generateQRCodeDataURL(acceptUrl, options);
}

/**
 * Generates a QR code for a memorial page
 * @param memorialSlug - The memorial page slug
 * @param baseUrl - Base URL of the application
 * @param options - QR code generation options
 * @returns Data URL string for the QR code
 */
export async function generateMemorialPageQRCode(
  memorialSlug: string,
  baseUrl: string,
  options?: QRCodeOptions
): Promise<string> {
  const memorialUrl = `${baseUrl}/${memorialSlug}`;
  return generateQRCodeDataURL(memorialUrl, options);
}
