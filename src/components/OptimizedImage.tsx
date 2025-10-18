interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fetchPriority?: "high" | "low" | "auto";
}

export const OptimizedImage = ({ 
  src, 
  alt, 
  className, 
  width, 
  height,
  priority = false,
  fetchPriority = "auto"
}: OptimizedImageProps) => {
  // Generate WebP source from original image path
  const webpSrc = typeof src === 'string' ? src.replace(/\.(png|jpg|jpeg)$/i, '.webp') : src;
  
  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        width={width}
        height={height}
        fetchPriority={fetchPriority}
      />
    </picture>
  );
};
