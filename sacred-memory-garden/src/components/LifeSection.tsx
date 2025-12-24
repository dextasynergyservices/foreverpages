import bgImage from '@/assets/image1.png';

const LifeSection = () => {
  return (
    <section id="life" className="relative py-20 px-4 text-white overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url(https://res.cloudinary.com/dxoorukfj/image/upload/v1764851048/image1_blm2dv.png)` }}
      ></div>

      {/* Light green gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#3a4b2f]/90 via-[#2e3a25]/90 to-[#1f2615]/80 z-0"></div>

      {/* Enhanced soft light overlay for sunlight glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(252, 228, 181, 0.15),transparent_60%)] pointer-events-none z-0"></div>

      {/* Additional gradient for smoother transition */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none z-0"></div>

      {/* Optional texture overlay for depth */}
      <div className="absolute inset-0 bg-[url('/textures/forest-light.png')] opacity-5 mix-blend-overlay pointer-events-none z-0"></div>

      <div className="relative container mx-auto max-w-4xl z-10">
        <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 md:p-12 border border-white/15 shadow-[0_0_40px_rgba(0,0,0,0.3)] animate-fade-in-up">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-center mb-8 text-amber-100">
            A Life Well Lived
          </h2>

          <div className="space-y-6 font-body text-lg leading-relaxed text-amber-50/90">
            <p>
              [Name] was a beacon of light in this world, touching countless lives with [his/her]
              kindness, wisdom, and unwavering faith. Born in [location], [he/she] grew up with a
              deep love for [interests/passions].
            </p>

            <p>
              Throughout [his/her] life, [Name] dedicated [himself/herself] to
              [achievements/passions]. [His/Her] legacy lives on through [family members,
              accomplishments, or impact on community].
            </p>

            <p>
              [Name] is survived by [family members] and will forever be remembered for [his/her]
              [key qualities]. Though [he/she] has moved on to be with the Lord, [his/her] spirit
              continues to guide and inspire us all.
            </p>
          </div>

          <div className="mt-10 p-6 bg-gradient-to-r from-amber-800/25 to-emerald-800/15 rounded-2xl border border-amber-700/25 shadow-inner">
            <p className="font-body italic text-center text-lg text-amber-100">
              "I have fought the good fight, I have finished the race, I have kept the faith."
              <br />
              <span className="text-sm text-amber-200/70">— 2 Timothy 4:7</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LifeSection;
