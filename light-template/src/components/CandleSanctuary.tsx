import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { Flame, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface Candle {
  id: string;
  name: string;
  date: string;
  message?: string;
}

const CandleSanctuary = () => {
  const [candles, setCandles] = useState<Candle[]>([
    { id: "1", name: "Sarah Johnson", date: "December 1, 2024", message: "In loving memory" },
    { id: "2", name: "Michael Brown", date: "December 1, 2024", message: "Forever in our hearts" },
    { id: "3", name: "Emily Davis", date: "November 30, 2024", message: "Rest in peace" },
    { id: "4", name: "Robert Wilson", date: "November 30, 2024", message: "Always remembered" },
    {
      id: "5",
      name: "Jennifer Lee",
      date: "November 29, 2024",
      message: "Gone but never forgotten",
    },
    { id: "6", name: "David Chen", date: "November 29, 2024", message: "In our prayers" },
    { id: "7", name: "Maria Garcia", date: "November 28, 2024", message: "Eternal light" },
    { id: "8", name: "Thomas Reed", date: "November 28, 2024", message: "With love and respect" },
    { id: "9", name: "Lisa Wang", date: "November 27, 2024", message: "Beautiful soul" },
    { id: "10", name: "James Miller", date: "November 27, 2024", message: "Forever missed" },
    { id: "11", name: "Anna Taylor", date: "November 26, 2024", message: "In God's care" },
    { id: "12", name: "Kevin Martinez", date: "November 26, 2024", message: "Peaceful rest" },
  ]);

  const [lightingName, setLightingName] = useState("");
  const [lightingMessage, setLightingMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  // Video controls not currently used but kept for future enhancement
  const candlesPerPage = 8;

  const totalItems = candles.length;
  const totalPages = Math.ceil(totalItems / candlesPerPage);
  const startIndex = (currentPage - 1) * candlesPerPage;
  const endIndex = startIndex + candlesPerPage;
  const currentCandles = candles.slice(startIndex, endIndex);

  const lightCandle = (e: FormEvent) => {
    e.preventDefault();
    if (!lightingName) return;

    const newCandle: Candle = {
      id: Date.now().toString(),
      name: lightingName,
      message: lightingMessage || "In loving memory",
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    setCandles([newCandle, ...candles]);
    setLightingName("");
    setLightingMessage("");
    setCurrentPage(1);
  };

  // Video playback and mute functions are not currently used
  // but kept for future enhancement

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <section
      id="candles"
      className="relative py-16 px-4 md:px-8 min-h-screen flex items-center justify-center"
    >
      {/* Background with subtle overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: `url(https://res.cloudinary.com/dt7ozsctz/image/upload/v1764166687/crackle-bg_mx0bsi.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundAttachment: "fixed",
          }}
        />
        {/* <div className="absolute inset-0 bg-black/10"></div> */}
        <div className="absolute inset-0 bg-black/90"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 w-full">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="h-px w-20 bg-amber-400/50"></div>
            <Flame className="h-8 w-8 text-amber-400 fill-amber-400" />
            <h2 className="font-script text-4xl md:text-5xl lg:text-6xl text-gold px-2">
              Candle Sanctuary
            </h2>
            <Flame className="h-8 w-8 text-amber-400 fill-amber-400" />
            <div className="h-px w-20 bg-amber-400/50"></div>
          </div>
          <p className="text-amber-100/80 text-lg italic max-w-2xl mx-auto">
            Light a virtual candle and join others in peaceful remembrance
          </p>
        </div>

        {/* Lighting Form */}
        <div className="bg-black/50 backdrop-blur-md border-2 border-amber-400/30 rounded-2xl p-8 mb-12 max-w-2xl mx-auto shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-amber-400/10 rounded-full px-4 py-2 border border-amber-400/30 mb-4">
              <Flame className="h-4 w-4 text-amber-400" />
              <span className="text-amber-400 font-semibold">Light a Candle</span>
            </div>
            <h3 className="font-heading text-2xl text-amber-200 mb-2">In Loving Memory</h3>
            <p className="text-amber-200/60 text-sm">Share your tribute and light a candle</p>
          </div>

          <form onSubmit={lightCandle} className="space-y-4">
            <div>
              <Input
                placeholder="Your name or dedication..."
                value={lightingName}
                onChange={(e) => setLightingName(e.target.value)}
                className="bg-black/40 backdrop-blur-sm border-2 border-amber-400/30 focus:border-amber-400 focus:ring-amber-400 text-amber-100 rounded-xl px-4 py-3 placeholder-amber-200/50"
                required
              />
            </div>
            <div>
              <Input
                placeholder="Optional message (e.g., 'In loving memory', 'Rest in peace')..."
                value={lightingMessage}
                onChange={(e) => setLightingMessage(e.target.value)}
                className="bg-black/40 backdrop-blur-sm border-2 border-amber-400/30 focus:border-amber-400 focus:ring-amber-400 text-amber-100 rounded-xl px-4 py-3 placeholder-amber-200/50"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-50 font-heading uppercase tracking-wider border-2 border-amber-400 rounded-xl py-6 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105"
            >
              <Flame className="mr-2 h-5 w-5" />
              Light Candle
            </Button>
          </form>
        </div>

        {/* Candle Counter */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 bg-black/40 backdrop-blur-sm rounded-full px-8 py-4 border-2 border-amber-400/30 shadow-lg">
            <Flame className="h-6 w-6 text-amber-400 fill-amber-400" />
            <span className="text-amber-200 font-heading text-xl">
              {totalItems} {totalItems === 1 ? "Candle" : "Candles"} Lit
            </span>
            <Flame className="h-6 w-6 text-amber-400 fill-amber-400" />
          </div>
        </div>

        {/* Candle Grid with Individual Candle Videos */}
        {candles.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-8">
              {currentCandles.map((candle) => (
                <div
                  key={candle.id}
                  className="group bg-black/40 backdrop-blur-sm border-2 border-amber-400/20 rounded-2xl  hover:border-amber-400/40 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-400/20"
                >
                  {/* Candle Video Container */}
                  <div className="relative mb-4 aspect-square overflow-hidden bg-black">
                    <video
                      src="https://res.cloudinary.com/dt7ozsctz/video/upload/v1764165638/candle1_uzr4ic.mp4"
                      className="w-full h-full object-cover rounded-t-2xl"
                      autoPlay
                      loop
                      muted
                      playsInline
                      title="Candle Video"
                    ></video>

                    {/* Glow effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-400/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Subtle border glow */}
                    <div className="absolute inset-0 border-2 border-amber-400/0 group-hover:border-amber-400/30 rounded-lg transition-all duration-500" />
                  </div>

                  {/* Candle Info */}
                  <div className="text-center space-y-2 p-4">
                    <h3 className="text-amber-200 font-heading text-sm leading-tight line-clamp-2">
                      {candle.name}
                    </h3>
                    <h5 className="text-amber-200/80 font-heading text-sm leading-tight line-clamp-2 italic">
                      {" "}
                      lit a candle
                    </h5>
                    {/* {candle.message && (
                      <p className="text-amber-300/80 text-xs italic leading-relaxed line-clamp-2">
                        "{candle.message}"
                      </p>
                    )} */}
                    {/* <p className="text-amber-400/60 text-xs">
                      {candle.date}
                    </p> */}
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6 border-t border-amber-400/10">
              {/* Page Info */}
              <div className="text-amber-200/70 text-sm">
                Page <span className="text-amber-400 font-semibold">{currentPage}</span> of{" "}
                <span className="text-amber-400 font-semibold">{totalPages}</span>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2">
                {/* First Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="border-amber-400/30 hover:border-amber-400 hover:bg-amber-400/10 text-amber-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                {/* Previous Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="border-amber-400/30 hover:border-amber-400 hover:bg-amber-400/10 text-amber-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 mx-2">
                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-2 text-amber-400/50">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page as number)}
                        className={`${
                          currentPage === page
                            ? "bg-amber-500 text-amber-50 border-amber-500"
                            : "border-amber-400/30 hover:border-amber-400 hover:bg-amber-400/10 text-amber-200"
                        } rounded-lg min-w-[40px]`}
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>

                {/* Next Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="border-amber-400/30 hover:border-amber-400 hover:bg-amber-400/10 text-amber-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Last Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="border-amber-400/30 hover:border-amber-400 hover:bg-amber-400/10 text-amber-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Items Info */}
              <div className="text-amber-200/70 text-sm">
                Showing{" "}
                <span className="text-amber-400 font-semibold">
                  {startIndex + 1}-{Math.min(endIndex, totalItems)}
                </span>{" "}
                candles
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border-2 border-amber-400/20 max-w-md mx-auto">
              <Flame className="h-16 w-16 text-amber-400/50 mx-auto mb-4" />
              <p className="text-amber-200/80 text-lg font-body mb-2">
                Be the first to light a candle
              </p>
              <p className="text-amber-200/60 text-sm">Share your tribute and start the memorial</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CandleSanctuary;
