import { useState, useEffect } from "react";
import { Button } from "./ui/button.tsx";
import { Textarea } from "./ui/textarea.tsx";
import { Input } from "./ui/input.tsx";
import { Heart, Quote, Download, Gift, ChevronLeft, ChevronRight } from "lucide-react";

interface Tribute {
  id: string;
  name: string;
  relationship: string;
  message: string;
  date: string;
  favorite?: boolean;
}

const TributeSection = () => {
  const [tributes, setTributes] = useState<Tribute[]>([
    {
      id: "1",
      name: "Sarah Anderson",
      relationship: "Wife",
      message:
        "My dearest John, your love was the anchor of our family. Your wisdom, kindness, and unwavering faith continue to guide us every day. The memories we built over 49 years will forever be my greatest treasure.",
      date: "December 1, 2024",
      favorite: true,
    },
    {
      id: "2",
      name: "Emily Anderson",
      relationship: "Daughter",
      message:
        "Dad, you were my hero and my guiding light. Thank you for teaching me about strength, compassion, and what it means to be a good person. I will carry your lessons with me always.",
      date: "November 30, 2024",
      favorite: true,
    },
    {
      id: "3",
      name: "Michael Anderson",
      relationship: "Son",
      message:
        "Dad, your legacy lives on through all of us. Thank you for being the rock of our family and showing us what true character means.",
      date: "November 29, 2024",
    },
    {
      id: "4",
      name: "Robert Johnson",
      relationship: "Brother",
      message:
        "John was the best brother anyone could ask for. His laughter and wisdom will be deeply missed by all who knew him.",
      date: "November 28, 2024",
    },
    {
      id: "5",
      name: "Jennifer Martinez",
      relationship: "Friend",
      message:
        "John had a heart of gold and always knew how to make everyone feel special. He will be deeply missed.",
      date: "November 27, 2024",
    },
  ]);

  const [newTribute, setNewTribute] = useState({
    name: "",
    relationship: "",
    message: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationForm, setDonationForm] = useState({
    name: "",
    email: "",
    amount: "",
    message: "",
  });
  const tributesPerPage = 4;

  // Calculate pagination values - MOVED TO USE EFFECT to ensure they're always current
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    startIndex: 0,
    endIndex: 0,
    currentTributes: [] as Tribute[],
  });

  useEffect(() => {
    const totalItems = tributes.length;
    const totalPages = Math.ceil(totalItems / tributesPerPage);
    const startIndex = (currentPage - 1) * tributesPerPage;
    const endIndex = Math.min(startIndex + tributesPerPage, totalItems);
    const currentTributes = tributes.slice(startIndex, endIndex);

    setPagination({
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      currentTributes,
    });

    // If current page is invalid after data changes, reset to page 1
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [tributes, currentPage, tributesPerPage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTribute.name || !newTribute.message) return;

    const tribute: Tribute = {
      id: Date.now().toString(),
      name: newTribute.name,
      relationship: newTribute.relationship || "Friend",
      message: newTribute.message,
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    setTributes([tribute, ...tributes]);
    setNewTribute({ name: "", relationship: "", message: "" });
    // Reset to page 1 when new tribute is added so user sees their tribute
    setCurrentPage(1);
  };

  const toggleFavorite = (id: string) => {
    setTributes(
      tributes.map((tribute) =>
        tribute.id === id ? { ...tribute, favorite: !tribute.favorite } : tribute
      )
    );
  };

  const downloadTributes = () => {
    const content = tributes
      .map(
        (tribute) => `
From: ${tribute.name} (${tribute.relationship})
Date: ${tribute.date}
${tribute.favorite ? "⭐ Special Tribute" : ""}

"${tribute.message}"

${"=".repeat(50)}
    `
      )
      .join("\n");

    const blob = new Blob([`Tributes for John Michael Anderson\n\n${content}`], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tributes-for-john-anderson.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // handleDonationSubmit is not used but kept for future donation feature
  // const handleDonationSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   console.log("Donation submitted:", donationForm);
  //   setDonationForm({ name: "", email: "", amount: "", message: "" });
  //   setShowDonationModal(false);
  //   alert("Thank you for your generous donation! The family will be notified.");
  // };

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Generate page numbers with ellipsis for better UX
  const getPageNumbers = () => {
    const { totalPages } = pagination;
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        end = 3;
      }
      if (currentPage >= totalPages - 1) {
        start = totalPages - 2;
      }

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <section id="tributes" className="relative py-16 px-4 md:px-8">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: `url(https://res.cloudinary.com/dt7ozsctz/image/upload/v1764166686/light-bg_wckphi.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundAttachment: "fixed",
          }}
        />
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="h-px w-8 md:w-16 bg-primary/50 flex-1 max-w-16"></div>
            <Quote className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <h2 className="font-script text-4xl md:text-5xl lg:text-6xl text-gold px-2">
              Loving Tributes
            </h2>
            <Quote className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <div className="h-px w-8 md:w-16 bg-primary/50 flex-1 max-w-16"></div>
          </div>
          <p className="text-gray-300 text-base md:text-lg italic max-w-2xl mx-auto px-4">
            Share your memories, stories, and messages of love and remembrance
          </p>
        </div>

        {/* Tribute Form */}
        <div className="bg-black/90 backdrop-blur-sm border-2 border-primary/30 rounded-xl md:rounded-2xl p-6 md:p-8 mb-12 md:mb-16 max-w-4xl mx-auto shadow-2xl">
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-3 py-1 md:px-4 md:py-2 border border-primary/40 mb-3 md:mb-4">
              <Heart className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              <span className="text-primary font-semibold text-sm md:text-base">
                Share Your Tribute
              </span>
            </div>
            <h3 className="font-heading text-xl md:text-2xl text-white mb-2">Leave a Message</h3>
            <p className="text-gray-400 text-xs md:text-sm">Your words will be cherished forever</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <Input
                  placeholder="Your Name"
                  value={newTribute.name}
                  onChange={(e) => setNewTribute({ ...newTribute, name: e.target.value })}
                  className="bg-black border-2 border-primary/40 focus:border-primary focus:ring-primary text-white rounded-lg md:rounded-xl px-3 py-2 md:px-4 md:py-3 text-sm md:text-base placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <Input
                  placeholder="Your Relationship"
                  value={newTribute.relationship}
                  onChange={(e) => setNewTribute({ ...newTribute, relationship: e.target.value })}
                  className="bg-black border-2 border-primary/40 focus:border-primary focus:ring-primary text-white rounded-lg md:rounded-xl px-3 py-2 md:px-4 md:py-3 text-sm md:text-base placeholder-gray-500"
                />
              </div>
            </div>
            <div>
              <Textarea
                placeholder="Share your favorite memory, message, or story..."
                value={newTribute.message}
                onChange={(e) => setNewTribute({ ...newTribute, message: e.target.value })}
                className="bg-black border-2 border-primary/40 focus:border-primary focus:ring-primary text-white rounded-lg md:rounded-xl px-3 py-2 md:px-4 md:py-3 min-h-24 md:min-h-32 text-sm md:text-base placeholder-gray-500"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-heading uppercase tracking-wider border-2 border-primary rounded-lg md:rounded-xl py-4 md:py-6 text-sm md:text-base transition-all duration-300 hover:shadow-lg hover:shadow-primary/50 hover:scale-105"
            >
              <Heart className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Share Tribute
            </Button>
          </form>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="text-gray-300 text-sm md:text-base">
            <span className="text-primary font-semibold">{pagination.totalItems}</span> Tributes
            Shared
            {pagination.totalPages > 1 && (
              <span className="text-gray-400 ml-2">
                (Page {currentPage} of {pagination.totalPages})
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={downloadTributes}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white text-xs md:text-sm"
            >
              <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Download All
            </Button>
            <Button
              onClick={() => setShowDonationModal(true)}
              className="bg-gold hover:bg-gold/90 text-white border-2 border-gold text-xs md:text-sm"
            >
              <Gift className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Support the Family
            </Button>
          </div>
        </div>

        {/* Tributes Grid */}
        <div className="grid gap-4 md:gap-6 mb-8 md:mb-12">
          {pagination.currentTributes.length > 0 ? (
            pagination.currentTributes.map((tribute) => (
              <div
                key={tribute.id}
                className={`bg-black/80 backdrop-blur-sm border-2 rounded-xl md:rounded-2xl p-4 md:p-6 transition-all duration-300 hover:shadow-2xl ${
                  tribute.favorite
                    ? "border-gold/50 hover:border-gold"
                    : "border-primary/30 hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                      <h3 className="font-heading text-lg md:text-xl text-white">{tribute.name}</h3>
                      {tribute.favorite && (
                        <Star className="h-4 w-4 md:h-5 md:w-5 text-gold fill-gold" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm md:text-base text-gray-400 mb-3 md:mb-4">
                      <span>{tribute.relationship}</span>
                      <span>•</span>
                      <span>{tribute.date}</span>
                    </div>
                    <p className="text-gray-300 text-sm md:text-base leading-relaxed italic">
                      "{tribute.message}"
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(tribute.id)}
                    className={`self-start md:self-auto ${
                      tribute.favorite
                        ? "text-gold hover:text-gold/80"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Star
                      className={`h-4 w-4 md:h-5 md:w-5 ${tribute.favorite ? "fill-current" : ""}`}
                    />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              No tributes found. Be the first to share a memory.
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm px-3 md:px-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <div className="flex gap-1">
                {getPageNumbers().map((page, index) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 py-1 text-gray-400 flex items-center"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => goToPage(page as number)}
                      className={`${
                        currentPage === page
                          ? "bg-primary text-white border-primary"
                          : "border-primary text-primary hover:bg-primary hover:text-white"
                      } text-xs md:text-sm min-w-8 md:min-w-10 h-8 md:h-10 font-medium`}
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                onClick={goToNextPage}
                disabled={currentPage === pagination.totalPages}
                className="border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm px-3 md:px-4"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="text-gray-400 text-sm text-center">
              Showing {pagination.startIndex + 1}-{pagination.endIndex} of {pagination.totalItems}{" "}
              tributes
            </div>
          </div>
        )}

        {/* Donation Modal */}
        {showDonationModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            {/* ... modal content remains the same ... */}
          </div>
        )}
      </div>
    </section>
  );
};

export default TributeSection;
