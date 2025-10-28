import Image from "next/image";
import { useTheme } from "@/hooks/useThemeOptimized";

interface OptimizedImageProps {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  style?: React.CSSProperties;
}

export function OptimizedImage({
  lightSrc,
  darkSrc,
  alt,
  fill = false,
  priority = false,
  className = "",
  sizes,
  style,
}: OptimizedImageProps) {
  const { theme } = useTheme();
  const imageSrc = theme === "dark" ? darkSrc : lightSrc;

  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        fill
        priority={priority}
        className={className}
        sizes={sizes}
        style={style}
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      priority={priority}
      className={className}
      sizes={sizes}
      style={style}
    />
  );
}

// Server-side version without theme dependency
interface OptimizedImageServerProps {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  style?: React.CSSProperties;
}

export function OptimizedImageServer({
  src,
  alt,
  fill = false,
  priority = false,
  className = "",
  sizes,
  style,
}: OptimizedImageServerProps) {
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className={className}
        sizes={sizes}
        style={style}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      priority={priority}
      className={className}
      sizes={sizes}
      style={style}
    />
  );
}
