import { MapPin, Calendar, Heart } from "lucide-react";

export const Biography = () => {
  return (
    <section
      id="biography"
      className="bg-gradient-to-br from-burgundy/90 via-burgundy/80 to-deep-plum/90 px-4 py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 animate-fade-in text-center">
          <h2 className="mb-1 font-heading text-2xl font-bold leading-tight text-cream md:mb-2 md:text-6xl">
            A Life Remembered
          </h2>
          <div className="mx-auto h-1 w-32 rounded-full bg-soft-gold" />
        </div>

        <div className="grid gap-12 md:grid-cols-3">
          {/* Left Sidebar - Quick Facts */}
          <div className="md:col-span-1">
            <div className="sticky top-16 rounded-2xl border border-cream/20 bg-cream/10 p-8 backdrop-blur-sm transition-smooth hover:border-soft-gold/30">
              <h3 className="mb-6 border-b-2 border-soft-gold pb-3 font-heading text-2xl font-semibold text-cream">
                Life Overview
              </h3>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Calendar className="mt-1 h-6 w-6 flex-shrink-0 text-soft-gold" />
                  <div>
                    <p className="font-semibold text-cream">Born</p>
                    <p className="text-cream/80">March 15, 1945</p>
                    <p className="text-sm text-cream/70">Boston, Massachusetts</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Heart className="mt-1 h-6 w-6 flex-shrink-0 text-soft-gold" />
                  <div>
                    <p className="font-semibold text-cream">Passed</p>
                    <p className="text-cream/80">November 2, 2024</p>
                    <p className="text-sm text-cream/70">Age 79</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="mt-1 h-6 w-6 flex-shrink-0 text-soft-gold" />
                  <div>
                    <p className="font-semibold text-cream">Residence</p>
                    <p className="text-cream/80">Lagos, Nigeria</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t-2 border-cream/20 pt-6">
                <p className="text-center font-accent text-sm italic text-cream">
                  Loving mother, grandmother, and friend to all who knew her
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Life Story */}
          <div className="animate-fade-in space-y-8 md:col-span-2">
            <div className="rounded-2xl border border-cream/20 bg-cream/10 p-8 backdrop-blur-sm md:p-12">
              <div className="prose prose-lg max-w-none">
                <p className="text-lg leading-relaxed text-cream first-letter:float-left first-letter:mr-3 first-letter:font-heading first-letter:text-6xl first-letter:leading-none first-letter:text-soft-gold">
                  Eleanor Grace Thompson was a beacon of warmth and kindness who touched countless
                  lives throughout her 79 years. Born in the spring of 1945 in Boston,
                  Massachusetts, Eleanor grew up with a deep appreciation for family, education, and
                  service to others.
                </p>

                <div className="my-8 rounded-r-2xl border-l-4 border-soft-gold bg-soft-gold/10 py-2 pl-6">
                  <p className="font-accent text-xl italic text-cream">
                    "Her smile could light up a room, and her laughter was contagious. She had a
                    gift for making everyone feel special and loved."
                  </p>
                  <p className="mt-2 text-sm text-cream/70">— Her daughter, Sarah</p>
                </div>

                <p className="text-lg leading-relaxed text-cream">
                  After graduating from Boston University with a degree in Education, Eleanor
                  dedicated 35 years to teaching elementary school children. Her classroom was a
                  place of wonder, creativity, and endless patience. Former students often recalled
                  how Mrs. Thompson made learning an adventure and believed in every child&apos;s
                  potential.
                </p>

                <p className="text-lg leading-relaxed text-cream">
                  In 1968, Eleanor married her college sweetheart, Robert Thompson, and together
                  they built a beautiful life filled with love, laughter, and adventure. They raised
                  three wonderful children and were blessed with seven grandchildren who were the
                  light of Eleanor&apos;s later years.
                </p>

                <div className="my-8 h-px bg-gradient-to-r from-transparent via-soft-gold to-transparent" />

                <p className="text-lg leading-relaxed text-cream">
                  Eleanor was passionate about gardening, classic literature, and volunteering at
                  the local library. She was known for her famous apple pie, her green thumb, and
                  her ability to recite poetry from memory. Her home was always open, her table
                  always welcoming, and her heart always generous.
                </p>

                <p className="text-lg leading-relaxed text-cream">
                  She leaves behind a legacy of love, compassion, and countless beautiful memories.
                  While we mourn her passing, we celebrate a life well-lived and a love that will
                  endure forever in our hearts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
