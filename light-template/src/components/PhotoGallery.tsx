import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Expand, Heart } from "lucide-react";

const photos = [
  {
    url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&h=800&fit=crop",
    caption: "Early Years",
    year: "1952",
    description: "A bright beginning filled with hope and promise",
  },
  {
    url: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600&h=800&fit=crop",
    caption: "Family Time",
    year: "1975",
    description: "Cherished moments with loved ones",
  },
  {
    url: "https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=600&h=800&fit=crop",
    caption: "Achievements",
    year: "1982",
    description: "Celebrating professional milestones",
  },
  {
    url: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&h=800&fit=crop",
    caption: "Golden Years",
    year: "1995",
    description: "Wisdom and grace in later life",
  },
  {
    url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=800&fit=crop",
    caption: "Celebrations",
    year: "2000",
    description: "Joyous occasions with family and friends",
  },
  {
    url: "https://images.unsplash.com/photo-1543269664-7eef42226a21?w=600&h=800&fit=crop",
    caption: "Special Moments",
    year: "2010",
    description: "Precious memories that last forever",
  },
  {
    url: "https://images.unsplash.com/photo-1529068755536-a5ade0dcb4e8?w=600&h=800&fit=crop",
    caption: "Cherished Memories",
    year: "2015",
    description: "The legacy of love continues",
  },
  {
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop",
    caption: "Forever Remembered",
    year: "2024",
    description: "Eternal peace and loving memory",
  },
];

const PhotoGallery = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  const openModal = (index: number) => {
    setSelectedPhoto(index);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
  };

  const nextPhoto = () => {
    if (selectedPhoto !== null) {
      setSelectedPhoto((selectedPhoto + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    if (selectedPhoto !== null) {
      setSelectedPhoto((selectedPhoto - 1 + photos.length) % photos.length);
    }
  };

  return (
    <section id="gallery" className="relative py-20 px-4 md:px-8">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: `url(https://res.cloudinary.com/dt7ozsctz/image/upload/v1764166670/water-bg_vugsnw.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundAttachment: "fixed",
          }}
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80"></div>
      </div>
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="h-px w-20 bg-primary/30"></div>
            <h2 className="font-script text-2xl md:text-6xl text-gold">Treasured Moments</h2>
            <div className="h-px w-20 bg-primary/30"></div>
          </div>
          <p className="text-foreground/70 text-lg italic max-w-2xl mx-auto">
            A visual journey through a life filled with love, faith, and beautiful memories
          </p>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="group cursor-pointer relative overflow-hidden rounded-xl"
              onClick={() => openModal(index)}
            >
              {/* Main Photo Container */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
                <Image
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Hover Expand Icon */}
                <div className="absolute top-4 right-4 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="bg-background/80 backdrop-blur-sm rounded-full p-2 border border-primary/30">
                    <Expand className="h-4 w-4 text-primary" />
                  </div>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                  {/* Year Badge */}
                  <div className="inline-flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full border border-primary/30 mb-3">
                    <Heart className="h-3 w-3 text-primary fill-primary" />
                    <span className="text-primary text-sm font-semibold">{photo.year}</span>
                  </div>

                  {/* Caption */}
                  <h3 className="text-white font-heading text-lg mb-2">{photo.caption}</h3>

                  {/* Description */}
                  <p className="text-white/80 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                    {photo.description}
                  </p>
                </div>

                {/* Golden Frame Effect */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/30 rounded-xl transition-all duration-500" />
              </div>

              {/* Floating Shadow Effect */}
              <div className="absolute inset-0 rounded-xl shadow-2xl shadow-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Modal */}
      {selectedPhoto !== null && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl max-h-[90vh] flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-20 bg-background/80 backdrop-blur-sm border-2 border-primary/30 rounded-full p-3 text-primary hover:text-foreground hover:border-primary transition-all duration-300 hover:scale-110"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>

            {/* Navigation Buttons */}
            <button
              onClick={prevPhoto}
              className="absolute left-4 z-20 bg-background/80 backdrop-blur-sm border-2 border-primary/30 rounded-full p-3 text-primary hover:text-foreground hover:border-primary transition-all duration-300 hover:scale-110"
              aria-label="Previous photo"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={nextPhoto}
              className="absolute right-4 z-20 bg-background/80 backdrop-blur-sm border-2 border-primary/30 rounded-full p-3 text-primary hover:text-foreground hover:border-primary transition-all duration-300 hover:scale-110"
              aria-label="Next photo"
            >
              <ChevronRight size={24} />
            </button>

            {/* Photo Container */}
            <div className="relative rounded-2xl overflow-hidden border-4 border-primary/20 bg-card/50 backdrop-blur-sm">
              <Image
                src={photos[selectedPhoto].url}
                alt={photos[selectedPhoto].caption}
                className="w-full h-full max-h-[70vh] object-contain"
                width={1200}
                height={900}
              />

              {/* Modal Caption */}
              <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm p-6 border-t border-primary/20">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="bg-primary/20 rounded-full px-3 py-1 border border-primary/30">
                        <span className="text-primary font-semibold text-sm">
                          {photos[selectedPhoto].year}
                        </span>
                      </div>
                      <h3 className="text-foreground font-heading text-xl">
                        {photos[selectedPhoto].caption}
                      </h3>
                    </div>
                    <p className="text-foreground/70 italic">{photos[selectedPhoto].description}</p>
                  </div>
                  <div className="text-primary/60 text-sm">
                    {selectedPhoto + 1} / {photos.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PhotoGallery;
