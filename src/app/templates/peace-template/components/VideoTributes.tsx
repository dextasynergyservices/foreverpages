"use client";

import { Play } from "lucide-react";
import { useTemplate } from "../TemplateProvider";

export const VideoTributes = () => {
  const { sectionsData } = useTemplate();

  // Get VIDEO_TRIBUTES section data with fallbacks
  const videoData = (sectionsData?.VIDEO_TRIBUTES as any) || {};
  const defaultVideos = [
    {
      id: 1,
      title: "Memorial Service Highlights",
      thumbnail:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop",
      duration: "12:34",
    },
    {
      id: 2,
      title: "Family Remembers Eleanor",
      thumbnail:
        "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop",
      duration: "8:45",
    },
    {
      id: 3,
      title: "Teaching Legacy",
      thumbnail:
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop",
      duration: "15:20",
    },
  ];

  const videos = videoData.videos || defaultVideos;

  return (
    <section className="bg-gradient-to-br from-burgundy/90 via-burgundy/80 to-deep-plum/90 px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 animate-fade-in text-center">
          <h2 className="mb-1 font-heading text-2xl font-bold leading-tight text-cream md:mb-2 md:text-6xl">
            Video Tributes
          </h2>
          <p className="text-cream/80">Celebrate Eleanor&apos;s life through shared memories</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {videos.map((video: any, index: number) => (
            <div
              key={video.id}
              className="group relative animate-fade-in-up cursor-pointer overflow-hidden rounded-2xl border border-cream/20 bg-cream/10 shadow-elegant backdrop-blur-sm transition-smooth hover:border-soft-gold/30 hover:shadow-lg"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-full w-full object-cover transition-smooth group-hover:scale-110"
                />

                {/* Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-smooth group-hover:bg-black/60">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-soft-gold/90 transition-smooth group-hover:scale-110 group-hover:bg-soft-gold">
                    <Play className="ml-1 h-8 w-8 text-burgundy" fill="currentColor" />
                  </div>
                </div>

                {/* Duration */}
                <div className="absolute bottom-2 right-2 rounded bg-burgundy/80 px-2 py-1 text-xs text-cream">
                  {video.duration}
                </div>
              </div>

              {/* Title */}
              <div className="p-4">
                <h3 className="font-semibold text-cream">{video.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
