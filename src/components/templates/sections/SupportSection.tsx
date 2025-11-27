import React from "react";
import { Memorial } from "@/generated/prisma";

interface SupportSectionProps {
  memorial: Memorial;
  layout?: string;
}

export const SupportSection: React.FC<SupportSectionProps> = ({ memorial }) => {
  // Show support options like donations, virtual candles, flowers
  const hasSupport = memorial.charityName || memorial.donationInfo;

  if (!hasSupport && !memorial.allowCandles && !memorial.allowFlowers) return null;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8">Support the Family</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {memorial.charityName && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Charitable Donations</h3>
              <p className="text-gray-700 mb-4">
                In lieu of flowers, the family suggests donations to:
              </p>
              <p className="font-medium text-gray-900">{memorial.charityName}</p>
              {memorial.charityUrl && (
                <a
                  href={memorial.charityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
                >
                  Visit Charity Website →
                </a>
              )}
              {memorial.donationInfo && (
                <p className="text-sm text-gray-600 mt-2">{memorial.donationInfo}</p>
              )}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Virtual Tributes</h3>
            <p className="text-gray-700 mb-4">
              Show your support with virtual candles and flowers.
            </p>
            <div className="space-y-2">
              {memorial.allowCandles && (
                <p className="text-sm text-gray-600">🕯️ Light a virtual candle</p>
              )}
              {memorial.allowFlowers && (
                <p className="text-sm text-gray-600">🌹 Send virtual flowers</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
