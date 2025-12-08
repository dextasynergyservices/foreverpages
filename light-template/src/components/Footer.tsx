const SimpleFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-12 px-4 text-center border-t-2 border-primary/30 bg-black/60">
      <p className="text-primary font-script text-2xl mb-2">May eternal light shine upon them</p>
      <p className="text-gray-400 text-sm mb-2">John Michael Anderson • 1952 - 2024</p>
      <p className="text-gray-500 text-xs">Created with love and remembrance • © {currentYear}</p>
    </footer>
  );
};

export default SimpleFooter;
