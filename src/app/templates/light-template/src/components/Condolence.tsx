import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Button } from "./ui/button.tsx";
import { Textarea } from "./ui/textarea.tsx";
import { Input } from "./ui/input.tsx";
import {
  Download,
  Upload,
  Heart,
  FileText,
  Eye,
  X,
  FileImage,
  File,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface Condolence {
  id: string;
  name: string;
  message: string;
  date: string;
  letterFile?: {
    type: "image" | "pdf";
    url: string;
    name: string;
  };
}

const CondolenceWall = () => {
  // Generate more sample data for pagination
  const generateSampleData = (): Condolence[] => {
    const sampleMessages = [
      "Your light continues to shine in our hearts. May you rest in eternal peace.",
      "A true servant of God. Your legacy of kindness will never be forgotten.",
      "Thank you for being such an inspiration to our community. You will be deeply missed.",
      "Your wisdom and guidance shaped so many lives. Forever in our hearts.",
      "A beautiful soul who touched everyone they met. Rest in peace.",
      "Your memory will live on through the lives you've touched.",
      "Heaven has gained an angel. You will be forever missed.",
      "Your kindness knew no bounds. Thank you for everything.",
      "A life well-lived and a legacy that will endure for generations.",
      "Your spirit will continue to guide and inspire us always.",
    ];

    const sampleNames = [
      "Sarah M.",
      "Robert K.",
      "Emily W.",
      "Michael T.",
      "Jennifer L.",
      "David R.",
      "Lisa P.",
      "Christopher M.",
      "Amanda B.",
      "James K.",
      "Maria S.",
      "Thomas W.",
      "Nancy P.",
      "Richard B.",
      "Susan M.",
    ];

    return Array.from({ length: 24 }, (_, index) => ({
      id: (index + 1).toString(),
      name: sampleNames[index % sampleNames.length],
      message: sampleMessages[index % sampleMessages.length],
      date: new Date(2024, 10, 30 - index).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      letterFile:
        index % 3 === 0
          ? {
              type: index % 2 === 0 ? "image" : "pdf",
              url:
                index % 2 === 0
                  ? "https://images.unsplash.com/photo-1548607997-1a023f76374e?w=600&h=800&fit=crop"
                  : "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              name: index % 2 === 0 ? "personal_letter.jpg" : "memories_with_john.pdf",
            }
          : undefined,
    }));
  };

  const [condolences] = useState<Condolence[]>(generateSampleData());
  const [newCondolence, setNewCondolence] = useState({
    name: "",
    message: "",
    letterFile: null as File | null,
  });
  const [showFileInput, setShowFileInput] = useState(false);
  const [selectedFile, setSelectedFile] = useState<Condolence | null>(null);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // itemsPerPage is fixed at 4, kept as const to avoid unused variable warning

  // Pagination calculations
  const itemsPerPage = 4;
  const totalItems = condolences.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = condolences.slice(startIndex, endIndex);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newCondolence.name && newCondolence.message) {
      // In a real app, you would add the new condolence to the state
      // For now, we'll just reset the form
      setNewCondolence({ name: "", message: "", letterFile: null });
      setShowFileInput(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Show success message or redirect to first page to see the new entry
      setCurrentPage(1);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isValidType = file.type.startsWith("image/") || file.type === "application/pdf";
      const isValidSize = file.size <= 10 * 1024 * 1024;

      if (!isValidType) {
        alert("Please upload only images (JPEG, PNG) or PDF files.");
        return;
      }

      if (!isValidSize) {
        alert("File size must be less than 10MB.");
        return;
      }

      setNewCondolence({ ...newCondolence, letterFile: file });
    }
  };

  const downloadFile = (condolence: Condolence) => {
    if (condolence.letterFile) {
      const link = document.createElement("a");
      link.href = condolence.letterFile.url;
      link.download = condolence.letterFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const openFileViewer = (condolence: Condolence) => {
    setSelectedFile(condolence);
    setPdfZoom(100);
  };

  const closeFileViewer = () => {
    setSelectedFile(null);
    setPdfZoom(100);
  };

  const getFileIcon = (type: "image" | "pdf") => {
    return type === "image" ? FileImage : File;
  };

  const getFileTypeText = (type: "image" | "pdf") => {
    return type === "image" ? "Image Letter" : "PDF Letter";
  };

  const increaseZoom = () => {
    setPdfZoom((prev) => Math.min(prev + 25, 200));
  };

  const decreaseZoom = () => {
    setPdfZoom((prev) => Math.max(prev - 25, 50));
  };

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
    <section id="condolences" className="relative py-20 px-4 md:px-8">
      {/* Background with Memorial Image */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: `url(https://res.cloudinary.com/dt7ozsctz/image/upload/v1764166687/lighting-bg_qa2mdh.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundAttachment: "fixed",
          }}
        />
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80"></div>
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Section Header with Image */}
        <div className="text-center mb-16">
          <div className="inline-block mb-8">
            {/* Memorial Portrait */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-primary/20 rounded-full blur-xl scale-125"></div>
            </div>

            <div className="inline-flex items-center gap-4 mb-6">
              <div className="h-px w-20 bg-primary/30"></div>
              <Heart className="h-6 w-6 text-primary fill-primary" />
              <h2 className="font-script text-2xl md:text-6xl text-gold">Condolence Wall</h2>
              <Heart className="h-6 w-6 text-primary fill-primary" />
              <div className="h-px w-20 bg-primary/30"></div>
            </div>
          </div>
          <p className="text-foreground/70 text-lg italic max-w-2xl mx-auto">
            Share your heartfelt messages and upload condolence letters as images or PDFs
          </p>
        </div>

        {/* Condolence Form */}
        <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 rounded-2xl p-8 mb-16 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 border border-primary/30 mb-4">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-primary font-semibold">Share Your Condolences</span>
            </div>
            {/* <h3 className="font-heading text-2xl text-foreground">Leave a Tribute</h3> */}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Input
                  placeholder="Your Name"
                  value={newCondolence.name}
                  onChange={(e) => setNewCondolence({ ...newCondolence, name: e.target.value })}
                  className="bg-background border-2 border-primary/30 focus:border-primary focus:ring-primary text-foreground rounded-xl px-4 py-3"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={showFileInput ? "default" : "outline"}
                  onClick={() => setShowFileInput(!showFileInput)}
                  className="flex-1 border-2 border-primary/30 rounded-xl"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {showFileInput ? "Cancel Upload" : "Upload Letter"}
                </Button>
              </div>
            </div>

            <div>
              <Textarea
                placeholder="Your heartfelt message or condolence..."
                value={newCondolence.message}
                onChange={(e) => setNewCondolence({ ...newCondolence, message: e.target.value })}
                className="bg-background border-2 border-primary/30 focus:border-primary focus:ring-primary text-foreground rounded-xl px-4 py-3 min-h-32"
                required
              />
            </div>

            {showFileInput && (
              <div className="space-y-4 p-6 bg-background/50 rounded-xl border-2 border-dashed border-primary/30">
                <label className="text-foreground font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Upload Condolence Letter (Image or PDF)
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,image/*,application/pdf"
                  onChange={handleFileChange}
                  className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />

                <div className="flex items-center gap-2 text-sm text-foreground/60">
                  <File className="h-3 w-3" />
                  <span>Supported formats: JPG, PNG, PDF (Max 10MB)</span>
                </div>

                {newCondolence.letterFile && (
                  <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                    {newCondolence.letterFile.type.includes("image") ? (
                      <FileImage className="h-4 w-4 text-primary" />
                    ) : (
                      <File className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-foreground text-sm flex-1">
                      {newCondolence.letterFile.name}
                    </span>
                    <span className="text-foreground/60 text-xs">
                      {(newCondolence.letterFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-heading uppercase tracking-wider border-2 border-primary rounded-xl py-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50 hover:scale-105"
            >
              <Heart className="h-5 w-5 mr-2" />
              Share Condolence
            </Button>
          </form>
        </div>

        {/* Results Count and Items Per Page Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="text-foreground/70">
            Showing{" "}
            <span className="text-primary font-semibold">
              {startIndex + 1}-{Math.min(endIndex, totalItems)}
            </span>{" "}
            of <span className="text-primary font-semibold">{totalItems}</span> condolences
          </div>
        </div>

        {/* Condolence Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {currentItems.map((condolence, index) => {
            const FileIcon = condolence.letterFile
              ? getFileIcon(condolence.letterFile.type)
              : FileText;
            return (
              <div
                key={condolence.id}
                className="group bg-card/80 backdrop-blur-sm border-2 border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Header with decorative elements */}
                <div className="relative mb-6">
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Heart className="h-3 w-3 text-primary fill-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-heading text-xl text-primary mb-2">{condolence.name}</h3>
                    <div className="text-foreground/50 text-sm">{condolence.date}</div>
                  </div>
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Heart className="h-3 w-3 text-primary fill-primary" />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-4">
                  <div className="border-l-4 border-primary/30 pl-4 py-2">
                    <p className="text-foreground leading-relaxed italic">{condolence.message}</p>
                  </div>

                  {/* File Section */}
                  {condolence.letterFile && (
                    <div className="bg-background/50 rounded-lg p-4 border border-primary/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-primary">
                          <FileIcon className="h-4 w-4" />
                          <span className="font-semibold text-sm">
                            {getFileTypeText(condolence.letterFile.type)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openFileViewer(condolence)}
                            className="border-primary/30 hover:border-primary hover:bg-primary/10 rounded-lg"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(condolence)}
                            className="border-primary/30 hover:border-primary hover:bg-primary/10 rounded-lg"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                      <p className="text-foreground/80 text-sm">{condolence.letterFile.name}</p>
                    </div>
                  )}
                </div>

                {/* Bottom decorative line */}
                <div className="mt-6 pt-4 border-t border-primary/10">
                  <div className="flex justify-center">
                    <div className="w-16 h-px bg-primary/30"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Beautiful Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6 border-t border-primary/10">
          {/* Page Info */}
          <div className="text-foreground/70 text-sm">
            Page <span className="text-primary font-semibold">{currentPage}</span> of{" "}
            <span className="text-primary font-semibold">{totalPages}</span>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            {/* First Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="border-primary/30 hover:border-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="border-primary/30 hover:border-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 mx-2">
              {getPageNumbers().map((page, index) =>
                page === "..." ? (
                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-foreground/50">
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
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-primary/30 hover:border-primary hover:bg-primary/10"
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
              className="border-primary/30 hover:border-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="border-primary/30 hover:border-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* File Viewer Modal */}
        {selectedFile && selectedFile.letterFile && (
          <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative bg-card border-4 border-primary/30 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header with Controls */}
              <div className="flex items-center justify-between p-6 border-b border-primary/20 bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 border border-primary/30">
                    {selectedFile.letterFile.type === "image" ? (
                      <FileImage className="h-4 w-4 text-primary" />
                    ) : (
                      <File className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-primary font-semibold">
                      {getFileTypeText(selectedFile.letterFile.type)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-heading text-xl text-primary">From {selectedFile.name}</h3>
                    <p className="text-foreground/60 text-sm">{selectedFile.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* PDF Zoom Controls */}
                  {selectedFile.letterFile.type === "pdf" && (
                    <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-1 border border-primary/20">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={decreaseZoom}
                        className="h-6 w-6 p-0 hover:bg-primary/10"
                      >
                        <ZoomOut className="h-3 w-3" />
                      </Button>
                      <span className="text-foreground text-sm min-w-[3rem] text-center">
                        {pdfZoom}%
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={increaseZoom}
                        className="h-6 w-6 p-0 hover:bg-primary/10"
                      >
                        <ZoomIn className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  <Button
                    onClick={() => downloadFile(selectedFile)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>

                  <button
                    onClick={closeFileViewer}
                    className="bg-background/80 backdrop-blur-sm border-2 border-primary/30 rounded-full p-2 text-primary hover:text-foreground hover:border-primary transition-all duration-300"
                    aria-label="Close viewer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Message */}
              <div className="px-6 pt-4">
                <div className="bg-background/50 rounded-lg p-4 border border-primary/20">
                  <p className="text-foreground leading-relaxed italic text-center">
                    &quot;{selectedFile.message}&quot;
                  </p>
                </div>
              </div>

              {/* File Content */}
              <div className="flex-1 p-6 overflow-auto">
                <div className="bg-background/30 rounded-lg border border-primary/20 h-full">
                  {selectedFile.letterFile.type === "image" ? (
                    <div className="flex justify-center items-center h-full p-4">
                      <img
                        src={selectedFile.letterFile.url}
                        alt="Condolence letter"
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="h-full w-full">
                      <iframe
                        src={`${selectedFile.letterFile.url}#view=fitH&zoom=${pdfZoom}`}
                        className="w-full h-full min-h-[500px] rounded-lg"
                        title={selectedFile.letterFile.name}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CondolenceWall;
