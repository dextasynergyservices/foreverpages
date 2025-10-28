import React, { useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroBanner } from "@/components/allFuneralPages/HeroBanner";
import { SearchSection } from "@/components/allFuneralPages/SearchSection";
import { MemorialGrid } from "@/components/allFuneralPages/MemorialGrid";

interface FuneralPage {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdBy: string;
}

// Placeholder data - replace with API/Query data
const allFuneralPages: FuneralPage[] = Array.from({ length: 30 }).map((_, i) => ({
  id: String(i + 1),
  title: `Memorial ${i + 1}`,
  description: "A heartfelt collection of memories from family and friends.",
  imageUrl: `https://picsum.photos/seed/memorial-${i}/800/600`,
  createdBy: ["Johnson", "Brown", "Martinez", "Lee", "Patel"][i % 5] + " Family",
}));

export const FuneralPages: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredPages = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return allFuneralPages.filter(
      (p) => p.title.toLowerCase().includes(q) || p.createdBy.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPages.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPages.length / itemsPerPage);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <HeroBanner />
      <SearchSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
      />
      <MemorialGrid
        currentItems={currentItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      <Footer />
    </div>
  );
};

export default FuneralPages;
