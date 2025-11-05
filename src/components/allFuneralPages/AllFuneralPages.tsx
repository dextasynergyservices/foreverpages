import React, { useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroBanner } from "@/components/allFuneralPages/HeroBanner";
import { SearchSection } from "@/components/allFuneralPages/SearchSection";
import { MemorialGrid } from "@/components/allFuneralPages/MemorialGrid";
import { useMemorials } from "@/hooks/useQueries";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";

interface FuneralPage {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdBy: string;
}

export const FuneralPages: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Use TanStack Query to fetch memorials
  const { data: memorialsData, isLoading } = useMemorials(currentPage, itemsPerPage);

  // Transform API data to match component interface
  const allFuneralPages: FuneralPage[] = useMemo(() => {
    if (!memorialsData?.data?.memorials) return [];

    return memorialsData.data.memorials.map((memorial) => ({
      id: memorial.id,
      title: memorial.title,
      description: memorial.description,
      imageUrl: memorial.imageUrl,
      createdBy: memorial.createdBy,
    }));
  }, [memorialsData]);

  const totalPages = Math.ceil((memorialsData?.data?.total || 0) / itemsPerPage);

  const filteredPages = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return allFuneralPages.filter(
      (p) => p.title.toLowerCase().includes(q) || p.createdBy.toLowerCase().includes(q)
    );
  }, [searchQuery, allFuneralPages]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPages.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  return (
    <QueryErrorBoundary>
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
          isLoading={isLoading}
        />
        <Footer />
      </div>
    </QueryErrorBoundary>
  );
};

export default FuneralPages;
