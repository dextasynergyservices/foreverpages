"use client";

import { useState, useEffect } from 'react'

const lifeStages = [
  {
    id: 1,
    image: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764670890/recent_h90dne.png",
    stage: 'Mama in Her Recent Years',
    age: '70-79',
    description: 'Wisdom and grace in her golden years',
  },
  {
    id: 2,
    image: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764670889/prime_xfxwj0.png",
    stage: 'Mama in Her Prime of Life',
    age: '40-69',
    description: 'Thriving in her career and family life',
  },
  {
    id: 3,
    image: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764670889/young_torvo8.png",
    stage: 'Mama as a Young Adult',
    age: '20-39',
    description: 'Starting her teaching career and family',
  },
  {
    id: 4,
    image: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764670889/child_nholqm.png",
    stage: 'Mama as a Child',
    age: '0-19',
    description: 'Growing up full of dreams and laughter',
  },
]

export const HeroModern = () => {
  const [currentStage, setCurrentStage] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  // Auto-rotate when not hovering
  useEffect(() => {
    if (!isHovering) {
      const interval = setInterval(() => {
        setCurrentStage((prev) => (prev + 1) % lifeStages.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [isHovering])

  return (
    <section
      id="home"
      className="flex min-h-screen items-center bg-gradient-to-br from-burgundy/90 via-burgundy/80 to-deep-plum/90 pb-16 pt-24 sm:pb-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Left: Portrait */}
          <div
            className="relative animate-fade-in"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="group aspect-square overflow-hidden rounded-3xl shadow-elegant transition-smooth hover:scale-105">
              <img
                key={lifeStages[currentStage].id} // Force re-render on change
                src={lifeStages[currentStage].image}
                alt={`Eleanor - ${lifeStages[currentStage].stage}`}
                className="h-full w-full object-cover transition-all duration-700 ease-in-out"
              />
              {/* Gold overlay on hover */}
              <div className="absolute inset-0 bg-soft-gold/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>

            {/* Life stage badge */}
            <div className="absolute bottom-4 left-4 max-w-[200px] rounded-2xl bg-cream/95 px-4 py-3 shadow-soft backdrop-blur-sm">
              <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-burgundy">
                <span className="h-2 w-2 animate-pulse rounded-full bg-soft-gold" />
                {lifeStages[currentStage].stage}
              </p>
              <p className="text-xs text-deep-plum/80">
                {lifeStages[currentStage].description}
              </p>
            </div>

            {/* Navigation dots */}
            <div className="absolute bottom-4 right-4 flex gap-2 rounded-full bg-cream/90 px-3 py-2 backdrop-blur-sm">
              {lifeStages.map((stage, index) => (
                <button
                  key={stage.id}
                  onClick={() => setCurrentStage(index)}
                  className={`h-3 w-3 rounded-full transition-all duration-300 ${
                    index === currentStage
                      ? 'scale-125 bg-soft-gold'
                      : 'bg-burgundy/40 hover:bg-burgundy/60'
                  }`}
                  title={stage.stage}
                />
              ))}
            </div>

            {/* Stage indicator */}
            <div className="absolute left-4 top-4 rounded-full bg-soft-gold/20 px-3 py-1 backdrop-blur-sm">
              <p className="text-xs font-medium text-cream">
                {lifeStages[currentStage].age}
              </p>
            </div>
          </div>

          {/* Right: Details */}
          <div className="animate-fade-in-up space-y-8">
            <div className="space-y-4">
              {/* Decorative element */}
              <div className="mb-2 flex items-center gap-3">
                <div className="h-1 w-8 rounded-full bg-soft-gold" />
                <span className="font-accent text-sm italic text-cream/80">
                  In Loving Memory
                </span>
                <div className="h-1 w-8 rounded-full bg-soft-gold" />
              </div>

              <h1 className="mb-2 font-heading text-2xl font-bold leading-tight text-cream md:text-6xl">
                Eleanor Grace Thompson
              </h1>
              <p className="font-accent text-xl text-soft-gold md:text-3xl">
                March 15, 1945 — November 2, 2024
              </p>
            </div>

            <div className="space-y-4 text-cream/90">
              <div className="flex items-center gap-4 rounded-2xl border border-cream/20 bg-cream/10 p-4 backdrop-blur-sm transition-smooth hover:border-soft-gold/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-soft-gold/20">
                  <span className="text-xl">🎂</span>
                </div>
                <div>
                  <p className="font-semibold text-cream">Age</p>
                  <p>79 years young</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-cream/20 bg-cream/10 p-4 backdrop-blur-sm transition-smooth hover:border-soft-gold/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-soft-gold/20">
                  <span className="text-xl">📍</span>
                </div>
                <div>
                  <p className="font-semibold text-cream">Home</p>
                  <p>Lagos, Nigeria</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-cream/20 bg-cream/10 p-4 backdrop-blur-sm transition-smooth hover:border-soft-gold/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-soft-gold/20">
                  <span className="text-xl">💼</span>
                </div>
                <div>
                  <p className="font-semibold text-cream">Profession</p>
                  <p>Beloved Elementary School Teacher</p>
                </div>
              </div>
            </div>

            {/* Quote */}
            <blockquote className="rounded-r-2xl border-l-4 border-soft-gold bg-cream/5 py-4 pl-6 backdrop-blur-sm">
              <p className="text-l font-accent italic leading-relaxed text-cream md:text-xl">
                "A life beautifully lived deserves to be beautifully remembered"
              </p>
            </blockquote>

            {/* CTA Buttons - Updated for mobile */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
              <a
                className="transform rounded-full bg-soft-gold px-4 py-2.5 text-center text-sm font-semibold text-burgundy shadow-lg transition-all duration-300 hover:scale-105 hover:bg-soft-gold/90 sm:px-6 sm:py-3 sm:text-base"
                href="#legacy"
              >
                Light a Candle
              </a>
              <a
                className="transform rounded-full border-2 border-soft-gold px-4 py-2.5 text-center text-sm font-semibold text-cream transition-all duration-300 hover:scale-105 hover:bg-soft-gold/10 sm:px-6 sm:py-3 sm:text-base"
                href="#legacy"
              >
                Share a Memory
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
