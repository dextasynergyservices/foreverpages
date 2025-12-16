import { Card, CardContent } from './card'
import { Button } from './button'
import { Textarea } from './textarea'
import { Input } from './input'
import { Flame, Share2, Facebook, Twitter, Mail } from 'lucide-react'
"use client";

import { useState } from 'react'

const sampleTributes = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    relation: 'Former Student',
    message:
      'Mrs. Thompson changed my life. She believed in me when no one else did. Her kindness and dedication will never be forgotten.',
    candle: true,
  },
  {
    id: 2,
    name: 'Robert Thompson Jr.',
    relation: 'Son',
    message:
      'Mom was the heart of our family. Her love, wisdom, and laughter filled our home with joy every single day.',
    candle: true,
  },
  {
    id: 3,
    name: 'Linda Parker',
    relation: 'Colleague',
    message:
      '35 years of teaching together, and Eleanor inspired me every single day. A true educator and friend.',
    candle: true,
  },
]

export const TributesModern = () => {
  const [candleCount, setCandleCount] = useState(147)

  const lightCandle = () => {
    setCandleCount((prev) => prev + 1)
  }

  return (
    <section id="legacy" className="relative overflow-hidden px-4 py-20">
      <div className="z-2 absolute inset-0">
        {/* Theme Color Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-burgundy/80 via-burgundy/70 to-deep-plum/80 mix-blend-multiply" />
        {/* Subtle pattern overlay for texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-burgundy/20 to-deep-plum/30" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-12 animate-fade-in text-center">
          <h2 className="mb-1 font-heading text-2xl font-bold leading-tight text-cream md:mb-2 md:text-6xl">
            Share Your Memories
          </h2>
          <p className="text-cream/80">
            Leave a tribute and light a candle in Eleanor&apos;s honor
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Tributes */}
          <div className="space-y-6 lg:col-span-2">
            {sampleTributes.map((tribute, index) => (
              <div
                key={tribute.id}
                className="animate-fade-in-up rounded-2xl border border-cream/20 bg-cream/10 p-6 shadow-elegant backdrop-blur-lg transition-smooth hover:border-soft-gold/30"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-soft-gold text-lg font-bold text-burgundy">
                    {tribute.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-cream">
                          {tribute.name}
                        </h3>
                        <p className="text-sm text-cream/80">
                          {tribute.relation}
                        </p>
                      </div>
                      {tribute.candle && (
                        <Flame className="h-5 w-5 animate-flicker text-soft-gold" />
                      )}
                    </div>
                    <p className="leading-relaxed text-cream/90">
                      {tribute.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Light Candle & Share */}
          <div className="space-y-6">
            {/* Candle Counter */}
            <div className="rounded-2xl border border-cream/20 bg-cream/10 p-6 text-center shadow-elegant backdrop-blur-lg">
              {/* Flame Video with Overlay */}
              <div className="relative mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                >
                  <source src='https://res.cloudinary.com/dxoorukfj/video/upload/v1764690139/candle1_cjbd2x.mp4' type="video/mp4" />
                  <div className="h-full w-full bg-gradient-to-br from-orange-900 via-orange-800 to-yellow-900" />
                </video>
                {/* Gold overlay for the flame video */}
                <div className="absolute inset-0 rounded-full bg-soft-gold/30 mix-blend-overlay" />
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-soft-gold/50" />
              </div>

              <p className="mb-2 text-4xl font-bold text-soft-gold">
                {candleCount}
              </p>
              <p className="mb-4 text-cream/80">Candles Lit</p>
              <Button
                onClick={lightCandle}
                className="w-full transform rounded-full bg-soft-gold font-semibold text-burgundy transition-all duration-300 hover:scale-105 hover:bg-soft-gold/90"
              >
                Light a Candle
              </Button>
            </div>

            {/* Social Sharing */}
            <div className="rounded-2xl border border-cream/20 bg-cream/10 p-6 shadow-elegant backdrop-blur-lg">
              <h3 className="mb-4 text-center font-semibold text-cream">
                Share This Memorial
              </h3>
              <div className="space-y-2">
                <Button className="w-full justify-start gap-3 border-2 border-soft-gold bg-transparent font-semibold text-soft-gold transition-all duration-300 hover:bg-soft-gold hover:text-burgundy">
                  <Facebook className="h-5 w-5" />
                  Share on Facebook
                </Button>
                <Button className="w-full justify-start gap-3 border-2 border-soft-gold bg-transparent font-semibold text-soft-gold transition-all duration-300 hover:bg-soft-gold hover:text-burgundy">
                  <Twitter className="h-5 w-5" />
                  Share on Twitter
                </Button>
                <Button className="w-full justify-start gap-3 border-2 border-soft-gold bg-transparent font-semibold text-soft-gold transition-all duration-300 hover:bg-soft-gold hover:text-burgundy">
                  <Mail className="h-5 w-5" />
                  Share via Email
                </Button>
                <Button className="w-full justify-start gap-3 border-2 border-soft-gold bg-transparent font-semibold text-soft-gold transition-all duration-300 hover:bg-soft-gold hover:text-burgundy">
                  <Share2 className="h-5 w-5" />
                  Copy Link
                </Button>
              </div>
            </div>

            {/* Add Tribute Form */}
            <div className="rounded-2xl border border-cream/20 bg-cream/10 p-6 shadow-elegant backdrop-blur-lg">
              <h3 className="mb-4 text-center font-semibold text-cream">
                Leave a Tribute
              </h3>
              <div className="space-y-4">
                <Input
                  placeholder="Your Name"
                  className="border-cream/30 bg-cream/20 text-cream placeholder-cream/60 focus:border-soft-gold focus:ring-soft-gold/20"
                />
                <Input
                  placeholder="Relationship"
                  className="border-cream/30 bg-cream/20 text-cream placeholder-cream/60 focus:border-soft-gold focus:ring-soft-gold/20"
                />
                <Textarea
                  placeholder="Share your favorite memory..."
                  className="min-h-[100px] border-cream/30 bg-cream/20 text-cream placeholder-cream/60 focus:border-soft-gold focus:ring-soft-gold/20"
                />
                <Button className="w-full transform rounded-full bg-soft-gold font-semibold text-burgundy transition-all duration-300 hover:scale-105 hover:bg-soft-gold/90">
                  Post Tribute
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
