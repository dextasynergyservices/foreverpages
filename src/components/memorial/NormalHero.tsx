"use client";

import Image from "next/image";
import { Calendar, Flame, Eye } from "lucide-react";
import { format } from "date-fns";

interface Memorial {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  biography: string | null;
  birthDate: string;
  deathDate: string;
  profilePhoto: string | null;
  coverPhoto: string | null;
  allowComments: boolean;
  password: string | null;
  viewCount: number;
  candleCount: number;
}

interface NormalHeroProps {
  memorial: Memorial;
}

export default function NormalHero({ memorial }: NormalHeroProps) {
  const fullName = `${memorial.firstName} ${memorial.middleName ? memorial.middleName + " " : ""}${memorial.lastName}`;
  const birthDate = new Date(memorial.birthDate);
  const deathDate = new Date(memorial.deathDate);

  return (
    <section className="relative w-full">
      {/* Cover Photo */}
      <div className="relative w-full h-[400px] md:h-[500px] bg-gradient-to-b from-gray-900 to-gray-800">
        {memorial.coverPhoto ? (
          <Image
            src={memorial.coverPhoto}
            alt={`${fullName} cover`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black" />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Profile & Info Section */}
      <div className="relative -mt-32 pb-16">
        <div className="container mx-auto px-4">
          {/* Profile Photo */}
          <div className="flex justify-center mb-6">
            <div className="relative w-48 h-48 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gray-200">
              {memorial.profilePhoto ? (
                <Image
                  src={memorial.profilePhoto}
                  alt={fullName}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600">
                  <span className="text-6xl font-serif text-white">
                    {memorial.firstName.charAt(0)}
                    {memorial.lastName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Name & Dates */}
          <div className="text-center text-white mb-8">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{fullName}</h1>
            <div className="flex items-center justify-center gap-2 text-lg md:text-xl text-gray-300">
              <Calendar className="h-5 w-5" />
              <span>
                {format(birthDate, "MMMM d, yyyy")} - {format(deathDate, "MMMM d, yyyy")}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="flex items-center gap-2 text-white">
              <Eye className="h-5 w-5 text-gray-400" />
              <span className="text-sm">{memorial.viewCount.toLocaleString()} views</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Flame className="h-5 w-5 text-amber-400" />
              <span className="text-sm">{memorial.candleCount} candles lit</span>
            </div>
          </div>

          {/* Biography */}
          {memorial.biography && (
            <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur-sm rounded-lg p-8 shadow-xl">
              <h2 className="text-2xl font-serif font-semibold mb-4 text-gray-900">
                In Loving Memory
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {memorial.biography}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
