import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const PhotoGallery = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Define images for each category
  const categoryImages = {
    childhood: [
      { id: 1, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764853741/as-a-child1_xlhhb2.png', alt: 'Thomas childhood photo' },
      { id: 2, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764854020/as-a-child2_oezam9.png', alt: 'Thomas young age' },
    ],
    wedding: [
      { id: 1, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764683419/memory4_i3nrkz.png', alt: 'Wedding photo' },
      { id: 2, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764683405/memory5_imwwmj.png', alt: 'Wedding ceremony' },
    ],
    family: [
      { id: 1, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852092/family_pzt4mm.png', alt: 'Family photo' },
      { id: 2, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852082/son1_mv9fh2.png', alt: 'Son 1' },
      { id: 3, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852083/son2_y4u8mz.png', alt: 'Son 2' },
      { id: 4, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852091/daughter_ywjod0.png', alt: 'Daughter' },
      { id: 5, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852176/thomas1_itt2fo.png', alt: 'Family gathering' },
      { id: 6, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852084/wife_ljyofq.png', alt: 'Family portrait' },
    ],
    celebration: [
      { id: 1, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764853552/celebration1_blnmox.png', alt: 'Birthday celebration' },
      { id: 2, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764853747/celebration2_qllkxn.png', alt: 'Anniversary party' },
      { id: 3, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764853751/celebration3_w4u8f5.png', alt: 'Anniversary party' },
    ],
    recent: [
      { id: 1, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852176/thomas1_itt2fo.png', alt: 'Recent photo 1' },
      { id: 2, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852084/wife_ljyofq.png', alt: 'Recent photo 2' },
    ],
    cherished: [
      { id: 1, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764854848/cherished2_bn4jvn.png', alt: 'Cherished photo 1' },
      { id: 2, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764854858/cherished1_xqtu2v.png', alt: 'Cherished photo 2' },
      { id: 3, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764855297/cherished3_ha60cg.png', alt: 'Cherished photo 3' },
      { id: 4, src: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764855298/cherished4_xkc58r.png', alt: 'Cherished photo 4' },
    ],
  };

  const photos = [
    { id: 1, label: 'Childhood', key: 'childhood' },
    { id: 2, label: 'Wedding Day', key: 'wedding' },
    { id: 3, label: 'Family Time', key: 'family' },
    { id: 4, label: 'Celebration', key: 'celebration' },
    { id: 5, label: 'Recent Years', key: 'recent' },
    { id: 6, label: 'Cherished Moments', key: 'cherished' },
  ];

  const handleCategoryClick = categoryKey => {
    setSelectedCategory(categoryKey);
    setSelectedImage(null);
    setCurrentImageIndex(0);
  };

  const handleImageClick = (image, index) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
  };

  const handleCloseModal = () => {
    setSelectedCategory(null);
    setSelectedImage(null);
    setCurrentImageIndex(0);
  };

  const handleNextImage = () => {
    const images = categoryImages[selectedCategory];
    setCurrentImageIndex(prev => (prev + 1) % images.length);
    setSelectedImage(images[(currentImageIndex + 1) % images.length]);
  };

  const handlePrevImage = () => {
    const images = categoryImages[selectedCategory];
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
    setSelectedImage(images[(currentImageIndex - 1 + images.length) % images.length]);
  };

  const handleKeyDown = e => {
    if (e.key === 'Escape') handleCloseModal();
    if (e.key === 'ArrowRight') handleNextImage();
    if (e.key === 'ArrowLeft') handlePrevImage();
  };

  return (
    <>
      <section id="photos" className="relative py-20 px-4 text-white overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: `url(https://res.cloudinary.com/dxoorukfj/image/upload/v1764852706/thomas2_sgyf6j.png)` }}
        ></div>

        {/* Light green gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a4b2f]/70 via-[#2e3a25]/90 to-[#1f2615]/80 z-0"></div>

        {/* Enhanced soft light overlay for sunlight glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(252, 228, 181, 0.15),transparent_60%)] pointer-events-none z-0"></div>

        {/* Additional gradient for smoother transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none z-0"></div>

        {/* Optional texture overlay for depth */}
        <div className="absolute inset-0 bg-[url('/textures/forest-light.png')] opacity-5 mix-blend-overlay pointer-events-none z-0"></div>

        <div className="relative container mx-auto max-w-6xl z-10">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-center mb-12 text-amber-100 animate-fade-in-up">
            Sacred Memories
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => handleCategoryClick(photo.key)}
                className="group relative aspect-square rounded-2xl overflow-hidden backdrop-blur-md bg-white/10 border border-white/15 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all duration-300 cursor-pointer animate-fade-in-up hover:scale-105 hover:border-amber-300/30"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-full h-full bg-gradient-to-br from-amber-400/10 to-emerald-400/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4 opacity-80">📷</div>
                    <p className="font-body text-sm text-amber-100/80">{photo.label}</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

                {/* Hover overlay effect */}
                <div className="absolute inset-0 bg-amber-100/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Modal */}
      {selectedCategory && !selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div
            className="relative bg-gradient-to-br from-[#2a3b1f] to-[#1f2615] rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-amber-300/20 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-amber-300/20">
              <h3 className="font-heading text-2xl md:text-3xl font-bold text-amber-100">
                {photos.find(p => p.key === selectedCategory)?.label}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-amber-300/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-amber-200" />
              </button>
            </div>

            {/* Images Grid */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryImages[selectedCategory]?.map((image, index) => (
                  <div
                    key={image.id}
                    onClick={() => handleImageClick(image, index)}
                    className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300"
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-lg z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div
            className="relative max-w-7xl w-full max-h-[90vh] flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Navigation Arrows */}
            <button
              onClick={handlePrevImage}
              className="absolute left-4 z-10 p-3 bg-amber-300/10 hover:bg-amber-300/20 rounded-full transition-all border border-amber-300/30"
            >
              <ChevronLeft className="w-8 h-8 text-amber-200" />
            </button>

            <button
              onClick={handleNextImage}
              className="absolute right-4 z-10 p-3 bg-amber-300/10 hover:bg-amber-300/20 rounded-full transition-all border border-amber-300/30"
            >
              <ChevronRight className="w-8 h-8 text-amber-200" />
            </button>

            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-10 p-3 bg-amber-300/10 hover:bg-amber-300/20 rounded-full transition-all border border-amber-300/30"
            >
              <X className="w-6 h-6 text-amber-200" />
            </button>

            {/* Image Counter */}
            <div className="absolute top-4 left-4 z-10 bg-amber-300/10 px-4 py-2 rounded-full border border-amber-300/30">
              <span className="font-body text-amber-200 text-sm">
                {currentImageIndex + 1} / {categoryImages[selectedCategory]?.length}
              </span>
            </div>

            {/* Image */}
            <div className="relative max-w-full max-h-full">
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoGallery;
