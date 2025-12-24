import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import {
  Upload,
  X,
  Share2,
  User,
  Building,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import bgVideo from '@/assets/candle2.mp4';

interface Condolence {
  id: number;
  name: string;
  organization?: string;
  relationship: string;
  message: string;
  letter?: string;
  date: string;
}

const CondolencesSection = () => {
  const [condolences, setCondolences] = useState<Condolence[]>([
    {
      id: 1,
      name: 'The Thompson Family',
      relationship: 'Family Friends',
      message:
        'Our deepest sympathies and prayers are with you all. [Name] was an incredible person who touched so many lives. We will miss [him/her] dearly. His kindness and wisdom guided us through many difficult times, and his memory will forever be etched in our hearts.',
      date: '2 days ago',
    },
    {
      id: 2,
      name: 'Dr. James Patterson',
      organization: "St. Mary's Hospital",
      relationship: 'Colleague',
      message:
        'A remarkable soul who made this world a better place. My heartfelt condolences to the entire family. May [his/her] memory be a blessing. Working alongside [Name] was a privilege I will always cherish.',
      date: '3 days ago',
    },
    {
      id: 3,
      name: 'Maria Gonzalez',
      relationship: 'Neighbor',
      message:
        "Heaven has gained another angel. Sending love, strength, and prayers to all who knew and loved [Name]. The neighborhood won't be the same without [his/her] warm presence.",
      date: '4 days ago',
    },
    {
      id: 4,
      name: 'Robert Wilson',
      relationship: 'Former Student',
      message:
        '[Name] was more than a teacher to me - [he/she] was a mentor and a guiding light. The lessons [he/she] taught extended far beyond the classroom and have shaped the person I am today.',
      date: '5 days ago',
    },
    {
      id: 5,
      name: 'The Johnson Family',
      relationship: 'Church Members',
      message:
        "Our church community mourns the loss of such a faithful servant. [Name]'s dedication and kindness touched everyone [he/she] met. May God's peace comfort the family.",
      date: '1 week ago',
    },
    {
      id: 6,
      name: 'Lisa Chen',
      organization: 'Community Center',
      relationship: 'Volunteer Partner',
      message:
        'Working alongside [Name] at the community center was an honor. [His/Her] compassion and commitment to helping others was truly inspiring. [He/She] will be deeply missed.',
      date: '1 week ago',
    },
  ]);

  const [newCondolence, setNewCondolence] = useState({
    name: '',
    organization: '',
    relationship: '',
    message: '',
    letter: '',
  });

  const [selectedCondolence, setSelectedCondolence] = useState<Condolence | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination settings
  const itemsPerPage = 3;
  const totalPages = Math.ceil(condolences.length / itemsPerPage);

  // Get current condolences for the page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCondolences = condolences.slice(indexOfFirstItem, indexOfLastItem);

  const handleSubmit = async () => {
    if (!newCondolence.name || !newCondolence.relationship) {
      toast.error('Please fill in name and relationship');
      return;
    }

    if (!newCondolence.message && !newCondolence.letter) {
      toast.error('Please write a message or upload a letter');
      return;
    }

    setIsSubmitting(true);

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const condolence: Condolence = {
      id: Date.now(),
      name: newCondolence.name,
      organization: newCondolence.organization || undefined,
      relationship: newCondolence.relationship,
      message: newCondolence.message,
      letter: newCondolence.letter || undefined,
      date: 'Just now',
    };

    setCondolences([condolence, ...condolences]);
    setNewCondolence({
      name: '',
      organization: '',
      relationship: '',
      message: '',
      letter: '',
    });
    setIsSubmitting(false);
    setCurrentPage(1); // Reset to first page when new condolence is added
    toast.success('Your condolence has been shared');
  };

  const handleLetterUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error('Please upload an image or PDF file');
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        setNewCondolence({ ...newCondolence, letter: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const openCondolenceModal = (condolence: Condolence) => {
    setSelectedCondolence(condolence);
  };

  const closeCondolenceModal = () => {
    setSelectedCondolence(null);
  };

  const downloadLetter = (condolence: Condolence) => {
    if (!condolence.letter) return;

    const link = document.createElement('a');
    link.href = condolence.letter;
    link.download = `condolence-letter-${condolence.name.replace(/\s+/g, '-').toLowerCase()}.${condolence.letter.startsWith('data:image/') ? 'png' : 'pdf'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const truncateMessage = (message: string, maxLength: number = 120) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <>
      <section
        id="condolences"
        className="relative py-12 md:py-20 px-4 text-white overflow-hidden min-h-screen"
      >
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover">
            <source src='https://res.cloudinary.com/dxoorukfj/video/upload/v1764690139/candle1_cjbd2x.mp4' type="video/mp4" />
          </video>
          {/* Your original green gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#3a4b2f]/70 via-[#2e3a25]/95 to-[#1f2615]/90 z-0"></div>

          {/* Enhanced soft light overlay for sunlight glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(252, 228, 181, 0.15),transparent_60%)] pointer-events-none z-0"></div>

          {/* Additional gradient for smoother transition */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none z-0"></div>
        </div>

        <div className="relative container mx-auto max-w-6xl z-10">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="font-heading text-3xl md:text-5xl font-bold mb-3 md:mb-4 text-amber-100">
              Condolences
            </h2>
            <p className="font-body text-amber-50/80 text-base md:text-lg max-w-2xl mx-auto px-4">
              Share your memories and messages of comfort
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-start">
            {/* Condolence Form */}
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/15 shadow-2xl">
              <h3 className="font-heading text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-amber-100 text-center">
                Leave Your Condolences
              </h3>

              <div className="space-y-4 md:space-y-6">
                {/* Name & Organization */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="font-body text-amber-200/80 text-sm mb-2 block">
                      Your Name *
                    </label>
                    <Input
                      value={newCondolence.name}
                      onChange={e => setNewCondolence({ ...newCondolence, name: e.target.value })}
                      className="bg-white/5 border-white/20 text-amber-100 placeholder-amber-100/50 backdrop-blur-sm"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="font-body text-amber-200/80 text-sm mb-2 block">
                      Organization (Optional)
                    </label>
                    <Input
                      value={newCondolence.organization}
                      onChange={e =>
                        setNewCondolence({ ...newCondolence, organization: e.target.value })
                      }
                      className="bg-white/5 border-white/20 text-amber-100 placeholder-amber-100/50 backdrop-blur-sm"
                      placeholder="Company, church, etc."
                    />
                  </div>
                </div>

                {/* Relationship */}
                <div>
                  <label className="font-body text-amber-200/80 text-sm mb-2 block">
                    Relationship *
                  </label>
                  <Input
                    value={newCondolence.relationship}
                    onChange={e =>
                      setNewCondolence({ ...newCondolence, relationship: e.target.value })
                    }
                    className="bg-white/5 border-white/20 text-amber-100 placeholder-amber-100/50 backdrop-blur-sm"
                    placeholder="e.g., Friend, Colleague, Family Member"
                  />
                </div>

                {/* Letter Upload */}
                <div>
                  <label className="font-body text-amber-200/80 text-sm mb-2 block">
                    Upload Condolence Letter (Optional)
                  </label>
                  <div className="flex items-center gap-3 md:gap-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLetterUpload}
                      accept="image/*,application/pdf"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="bg-white/5 border-white/20 text-amber-100 hover:bg-white/10 hover:text-amber-50 backdrop-blur-sm flex-1 text-sm md:text-base"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {newCondolence.letter ? 'Change Letter' : 'Upload Letter'}
                    </Button>
                    {newCondolence.letter && (
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border-2 border-amber-300/30 bg-white/5 flex items-center justify-center">
                        <div className="text-amber-300 text-xs text-center">
                          📄
                          <br />
                          Letter
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="font-body text-amber-200/60 text-xs mt-2">
                    Upload an image or PDF of your condolence letter
                  </p>
                </div>

                {/* Message */}
                <div>
                  <label className="font-body text-amber-200/80 text-sm mb-2 block">
                    Or Write Your Message {newCondolence.letter ? '(Optional)' : '*'}
                  </label>
                  <Textarea
                    value={newCondolence.message}
                    onChange={e => setNewCondolence({ ...newCondolence, message: e.target.value })}
                    className="bg-white/5 border-white/20 text-amber-100 placeholder-amber-100/50 backdrop-blur-sm min-h-[100px] md:min-h-[120px] text-sm md:text-base"
                    placeholder="Share your heartfelt condolences and memories..."
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-600/50 to-amber-700/40 hover:from-amber-600/60 hover:to-amber-700/50 border border-amber-400/30 text-amber-100 font-body font-semibold py-4 md:py-6 text-base md:text-lg transition-all duration-300 hover:scale-105 shadow-2xl backdrop-blur-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-amber-100 mr-2"></div>
                      Sharing...
                    </>
                  ) : (
                    'Share Your Condolences'
                  )}
                </Button>
              </div>
            </div>

            {/* Condolences Display */}
            <div className="space-y-6">
              {/* Condolences List */}
              <div className="space-y-4">
                {currentCondolences.map(condolence => (
                  <div
                    key={condolence.id}
                    className="backdrop-blur-xl bg-amber-500/10 border-amber-400/30 rounded-xl md:rounded-2xl p-4 md:p-6 border shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-101"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-amber-400/20 flex items-center justify-center border-2 border-amber-300/30 shadow-lg flex-shrink-0">
                          <User className="w-3 h-3 md:w-5 md:h-5 text-amber-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-body font-semibold text-amber-100 text-sm md:text-base truncate">
                              {condolence.name}
                            </h4>
                            {condolence.organization && (
                              <div className="flex items-center gap-1 text-amber-200/60 text-xs">
                                <Building className="w-3 h-3" />
                                <span className="truncate">{condolence.organization}</span>
                              </div>
                            )}
                          </div>
                          <p className="font-body text-amber-200/60 text-xs md:text-sm truncate">
                            {condolence.relationship}
                          </p>
                          <p className="font-body text-amber-200/40 text-xs">{condolence.date}</p>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="mb-3 md:mb-4">
                      <p className="font-body text-amber-50/90 leading-relaxed text-sm md:text-base">
                        {truncateMessage(condolence.message)}
                      </p>
                      {condolence.message.length > 120 && (
                        <button
                          onClick={() => openCondolenceModal(condolence)}
                          className="flex items-center gap-1 mt-2 text-amber-300 hover:text-amber-200 transition-colors font-body text-xs md:text-sm"
                        >
                          Read More
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-white/10">
                      <button
                        onClick={() => openCondolenceModal(condolence)}
                        className="flex items-center gap-1 md:gap-2 text-amber-200/70 hover:text-amber-100 transition-colors font-body text-xs md:text-sm"
                      >
                        <Share2 className="w-3 h-3 md:w-4 md:h-4" />
                        View Full
                      </button>

                      {condolence.letter && (
                        <button
                          onClick={() => downloadLetter(condolence)}
                          className="flex items-center gap-2 text-amber-200/70 hover:text-amber-100 transition-colors font-body text-xs md:text-sm"
                        >
                          <Download className="w-3 h-3 md:w-4 md:h-4" />
                          <span>Download Letter</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="bg-white/5 border-white/20 text-amber-100 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className={`${
                          currentPage === page
                            ? 'bg-amber-600/50 border-amber-400/30 text-amber-100'
                            : 'bg-white/5 border-white/20 text-amber-100 hover:bg-white/10'
                        }`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="bg-white/5 border-white/20 text-amber-100 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Page Info */}
              <div className="text-center">
                <p className="font-body text-amber-200/60 text-sm">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, condolences.length)} of{' '}
                  {condolences.length} condolences
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Condolence Modal */}
      {selectedCondolence && (
        <div
          className="fixed inset-0 bg-gradient-to-b from-[#3a4b2f]/90 via-[#2e3a25]/90 to-[#1f2615]/90 z-50 flex items-center justify-center p-2 md:p-4"
          onClick={closeCondolenceModal}
        >
          <div
            className="relative bg-gradient-to-b from-[#3a4b2f]/100 via-[#2e3a25]/100 to-[#1f2615]/100 rounded-2xl md:rounded-3xl w-full max-w-md md:max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-hidden border border-amber-300/20 shadow-2xl backdrop-blur-xl mx-2"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-amber-300/20">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber-400/20 flex items-center justify-center border-2 border-amber-300/30 flex-shrink-0">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-amber-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-body font-semibold text-amber-100 text-base md:text-lg truncate">
                    {selectedCondolence.name}
                  </h3>
                  <div className="flex items-center gap-2 text-amber-200/60 text-sm">
                    <span>{selectedCondolence.relationship}</span>
                    {selectedCondolence.organization && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          <span className="truncate">{selectedCondolence.organization}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="font-body text-amber-200/40 text-xs">{selectedCondolence.date}</p>
                </div>
              </div>
              <button
                onClick={closeCondolenceModal}
                className="p-1 md:p-2 hover:bg-amber-300/10 rounded-full transition-colors flex-shrink-0 ml-2"
              >
                <X className="w-4 h-4 md:w-6 md:h-6 text-amber-200" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(95vh-140px)] md:max-h-[calc(90vh-140px)]">
              {/* Letter Display */}
              {selectedCondolence.letter && (
                <div className="mb-4 md:mb-6 rounded-lg md:rounded-xl overflow-hidden border border-amber-300/20 bg-black/20">
                  {selectedCondolence.letter.startsWith('data:image/') ? (
                    <img
                      src={selectedCondolence.letter}
                      alt="Condolence letter"
                      className="w-full max-h-96 object-contain bg-white"
                    />
                  ) : (
                    <div className="p-8 text-center">
                      <div className="text-6xl mb-4">📄</div>
                      <p className="font-body text-amber-100 mb-4">Condolence Letter Document</p>
                      <Button
                        onClick={() => downloadLetter(selectedCondolence)}
                        className="bg-amber-600/30 hover:bg-amber-600/40 border border-amber-400/30 text-amber-100"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Letter
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Message */}
              {selectedCondolence.message && (
                <div>
                  <h4 className="font-body font-semibold text-amber-100 mb-3">Message</h4>
                  <p className="font-body text-amber-50/90 leading-relaxed text-lg whitespace-pre-wrap">
                    {selectedCondolence.message}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center p-4 md:p-6 border-t border-amber-300/20">
              <Button className="bg-amber-600/30 hover:bg-amber-600/40 border border-amber-400/30 text-amber-100">
                <Share2 className="w-4 h-4 mr-2" />
                Share Condolence
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CondolencesSection;
