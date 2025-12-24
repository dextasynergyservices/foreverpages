
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        {/* Option 1: Using a local video file */}
        <video autoPlay muted loop playsInline className="w-full h-full object-cover">
          <source src='https://res.cloudinary.com/dxoorukfj/video/upload/v1764851059/video1_yusbe0.mp4' type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Video Overlay */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 animate-fade-in-up">
        <div className="relative w-60 h-60 md:w-80 md:h-80 mx-auto rounded-full border-4 border-white/30 overflow-hidden ">
          <div className="text-6xl">
            <img
              src="https://res.cloudinary.com/dxoorukfj/image/upload/v1764851048/image1_blm2dv.png"
              alt="Beloved Person"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Name */}
        <h1 className="font-heading text-3xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
          Robert Nyesom
        </h1>

        {/* Dates */}
        <p className="font-body text-xl text-white/90 mb-8 drop-shadow">1940 - 2025</p>

        {/* Verse */}
        <div className="max-w-2xl mx-auto glass-effect rounded-2xl p-8 shadow-soft">
          <p className="font-body text-lg md:text-xl text-foreground italic leading-relaxed">
            "Those we love don't go away, they walk beside us every day"
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
