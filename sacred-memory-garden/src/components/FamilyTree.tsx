import { Users } from 'lucide-react';

const FamilyTree = () => {
  const familyData = {
    name: 'Robert Nyesom',
    photo: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852176/thomas1_itt2fo.png',
    spouse: {
      name: 'Wife Name',
      photo: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852084/wife_ljyofq.png',
    },
    children: [
      {
        id: 1,
        name: 'Chima Nyesom',
        photo: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852082/son1_mv9fh2.png',
        grandchildren: [
          { id: 1, name: 'Grandchild 1', photo: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852080/grand-daughter1_q6jocp.png' },
          { id: 2, name: 'Grandchild 2', photo: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852081/grand-daughter2_tqroux.png' },
        ],
      },
      {
        id: 2,
        name: 'Chidi Nyesom',
        photo: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852083/son2_y4u8mz.png',
        grandchildren: [{ id: 3, name: 'Grandchild 3', photo: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852084/grandson1_k7vl7f.png' }],
      },
      {
        id: 3,
        name: 'Chinyere George',
        photo: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852091/daughter_ywjod0.png',
        grandchildren: [
          { id: 4, name: 'Grandchild 4', photo: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852085/grandson2_j8ogni.png' },
          { id: 5, name: 'Grandchild 5', photo: 'https://res.cloudinary.com/dxoorukfj/image/upload/v1764852081/grand-daughter3_az7l0h.png' },
        ],
      },
    ],
  };

  return (
    <section id="family" className="relative py-20 px-4 text-white overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url(https://res.cloudinary.com/dxoorukfj/image/upload/v1764852092/family_pzt4mm.png)` }}
      ></div>

      {/* Light green gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#3a4b2f]/90 via-[#2e3a25] to-[#1f2615]/90 z-0"></div>

      {/* Enhanced soft light overlay for sunlight glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(252, 228, 181, 0.15),transparent_60%)] pointer-events-none z-0"></div>

      {/* Additional gradient for smoother transition */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none z-0"></div>

      {/* Optional texture overlay for depth */}
      <div className="absolute inset-0 bg-[url('/textures/forest-light.png')] opacity-5 mix-blend-overlay pointer-events-none z-0"></div>

      <div className="relative container mx-auto max-w-6xl z-10">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 mb-4">
            <Users className="w-8 h-8 text-amber-200" />
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-amber-100">
              Family Tree
            </h2>
          </div>
          <p className="font-body text-amber-50/80 text-lg">
            A legacy of love that lives on through generations
          </p>
        </div>

        {/* Root - Deceased Person & Spouse */}
        <div className="flex flex-col items-center mb-16 animate-fade-in-up">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-8">
            {/* Deceased Person */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full animate-glow-pulse" />
                <img
                  src={familyData.photo}
                  alt={familyData.name}
                  className="relative w-60 h-60 rounded-full object-cover border-4 border-amber-300/40 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                />
              </div>
              <h3 className="font-heading text-2xl md:text-3xl font-bold mt-4 text-amber-100">
                {familyData.name}
              </h3>
              <p className="font-body text-amber-200/70 italic">In Loving Memory</p>
            </div>

            {/* Spouse */}
            {familyData.spouse && (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400/10 blur-xl rounded-full" />
                  <img
                    src={familyData.spouse.photo}
                    alt={familyData.spouse.name}
                    className="relative w-48 h-48 rounded-full object-cover border-4 border-amber-200/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                  />
                </div>
                <h3 className="font-heading text-xl md:text-2xl font-bold mt-4 text-amber-100">
                  {familyData.spouse.name}
                </h3>
                <p className="font-body text-amber-200/70 italic">Beloved Spouse</p>
              </div>
            )}
          </div>

          {/* Heart connector between spouses */}
          {familyData.spouse && (
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-12 h-0.5 bg-gradient-to-r from-amber-300/50 to-transparent"></div>
              <div className="text-2xl text-amber-300/60">❤</div>
              <div className="w-12 h-0.5 bg-gradient-to-l from-amber-300/50 to-transparent"></div>
            </div>
          )}
        </div>

        {/* Connector Line to Children */}
        <div className="flex justify-center mb-8">
          <div className="w-0.5 h-12 bg-gradient-to-b from-amber-300/50 to-transparent" />
        </div>

        {/* Children Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {familyData.children.map((child, index) => (
            <div
              key={child.id}
              className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/15 shadow-[0_0_20px_rgba(0,0,0,0.2)] animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Child */}
              <div className="flex flex-col items-center mb-6">
                <img
                  src={child.photo}
                  alt={child.name}
                  className="w-48 h-48 rounded-full object-cover border-3 border-amber-300/30 shadow-soft mb-3"
                />
                <h4 className="font-heading text-xl font-semibold text-amber-100 text-center">
                  {child.name}
                </h4>
                <p className="font-body text-sm text-amber-200/70">Child</p>
              </div>

              {/* Grandchildren */}
              {child.grandchildren.length > 0 && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-amber-300/30 to-transparent" />
                  </div>
                  <div className="space-y-3">
                    {child.grandchildren.map(grandchild => (
                      <div
                        key={grandchild.id}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10"
                      >
                        <img
                          src={grandchild.photo}
                          alt={grandchild.name}
                          className="w-32 h-32 rounded-full object-cover border-2 border-amber-300/20"
                        />
                        <div>
                          <p className="font-body font-medium text-amber-100 text-sm">
                            {grandchild.name}
                          </p>
                          <p className="font-body text-xs text-amber-200/60">Grandchild</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-block backdrop-blur-md bg-white/10 rounded-2xl px-8 py-4 border border-white/15 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
            <p className="font-body text-amber-100/80 italic">
              "A family's love is life's greatest blessing"
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FamilyTree;
