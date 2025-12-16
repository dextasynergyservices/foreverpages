"use client";

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const photos = [
  { id: 1, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764683428/memory8_y7fruu.png', tag: 'Family', year: '2020' },
  { id: 2, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764683424/memory12_qgyxxm.png', tag: 'Travel', year: '1975' },
  { id: 3, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764683421/memory11_mos2g5.png', tag: 'Travel', year: '1972' },
  { id: 4, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764683419/memory4_i3nrkz.png', tag: 'Celebrations', year: '1969' },
  { id: 5, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764683419/memory7_n3ji76.png', tag: 'Grandchildren', year: '2022' },
  { id: 6, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764683409/memory6_mgveyg.png', tag: 'Hobbies', year: '2015' },
  { id: 7, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764683405/memory5_imwwmj.png', tag: 'Nature', year: '1968' },
  { id: 8, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764683402/memory2_jqezdm.png', tag: 'Friends', year: '1970' },
  { id: 9, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764683393/memory10_vxbby5.png', tag: 'Events', year: '2021' },
  { id: 10, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764683394/memory9_yuhuvw.png', tag: 'Travel', year: '1963' },
  { id: 11, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764683388/memory1_byflff.png', tag: 'Family', year: '2016' },
]

// Pagination configuration
const ITEMS_PER_PAGE = 9

export const GalleryModern = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // Calculate total pages
  const totalPages = Math.ceil(photos.length / ITEMS_PER_PAGE)
  
  // Get current photos to display
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentPhotos = photos.slice(startIndex, endIndex)

  const openLightbox = (index: number) => {
    // Adjust index for pagination
    const globalIndex = startIndex + index
    setSelectedImage(globalIndex)
    setLightboxOpen(true)
  }

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % photos.length)
  }

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + photos.length) % photos.length)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      
      if (e.key === 'Escape') {
        setLightboxOpen(false)
      } else if (e.key === 'ArrowRight') {
        nextImage()
      } else if (e.key === 'ArrowLeft') {
        prevImage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen])

  // Reset to page 1 when component mounts
  useEffect(() => {
    setCurrentPage(1)
  }, [])

  return (
    <section
      id="photos"
      className="bg-gradient-to-br from-burgundy/90 via-burgundy/80 to-deep-plum/90 px-4 py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 animate-fade-in text-center">
          <h2 className="mb-1 font-heading text-2xl font-bold leading-tight text-cream md:mb-2 md:text-6xl">
            Photo Memories
          </h2>
          <p className="text-cream/80">Moments that made life beautiful</p>
        </div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {currentPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative animate-fade-in-up cursor-pointer overflow-hidden rounded-2xl shadow-soft transition-smooth hover:shadow-hover"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => openLightbox(index)}
            >
              <img
                src={photo.src}
                alt={`Memory ${photo.id}`}
                className="h-72 w-full object-cover transition-smooth group-hover:scale-110"
              />

              {/* Memory Tag Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-smooth group-hover:opacity-100">
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-celebration-charcoal">
                      {photo.tag}
                    </span>
                    <span className="font-medium text-white">{photo.year}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-12 flex animate-fade-in items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-cream transition-smooth hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-10 w-10 items-center justify-center rounded-full font-medium transition-smooth ${
                  currentPage === page
                    ? 'bg-white text-burgundy'
                    : 'bg-white/10 text-cream hover:bg-white/20'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-cream transition-smooth hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox with Navigation Arrows */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          {/* Close Button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 text-white transition-smooth hover:text-white/70 md:right-8 md:top-8"
          >
            <X className="h-8 w-8 md:h-10 md:w-10" />
          </button>

          {/* Previous Button */}
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-white transition-smooth hover:text-white/70 md:left-8"
          >
            <ChevronLeft className="h-8 w-8 md:h-12 md:w-12" />
          </button>

          {/* Next Button */}
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-white transition-smooth hover:text-white/70 md:right-8"
          >
            <ChevronRight className="h-8 w-8 md:h-12 md:w-12" />
          </button>

          {/* Image Container */}
          <div className="relative max-h-[90vh] max-w-full">
            <img
              src={photos[selectedImage].src}
              alt={`Memory ${photos[selectedImage].id}`}
              className="max-h-[80vh] max-w-full rounded-lg object-contain"
            />
            
            {/* Image Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-celebration-charcoal">
                  {photos[selectedImage].tag}
                </span>
                <div className="flex items-center space-x-4">
                  <span className="font-medium text-white">{photos[selectedImage].year}</span>
                  <span className="text-white/80">
                    {selectedImage + 1} / {photos.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnail Navigation */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2 overflow-x-auto py-2 md:bottom-8">
            {photos.slice(
              Math.max(0, selectedImage - 2),
              Math.min(photos.length, selectedImage + 3)
            ).map((photo, index) => {
              const actualIndex = Math.max(0, selectedImage - 2) + index
              return (
                <button
                  key={photo.id}
                  onClick={() => setSelectedImage(actualIndex)}
                  className={`flex-shrink-0 overflow-hidden rounded-lg transition-smooth ${
                    actualIndex === selectedImage
                      ? 'ring-2 ring-white'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={photo.src}
                    alt={`Thumb ${photo.id}`}
                    className="h-16 w-16 object-cover md:h-20 md:w-20"
                  />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}