import { useState } from 'react';
import { Box } from '@mui/material';

interface OptimizedImageProps {
  src: string;
  alt: string;
  type?: 'profile' | 'card' | 'banner';
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function OptimizedImage({ 
  src, 
  alt, 
  type = 'card',
  className = '',
  onClick,
  style 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const getClassNames = () => {
    const baseClass = type === 'profile' ? 'img-profile' : 
                      type === 'banner' ? 'img-banner' : 
                      'img-card';
    
    const loadedClass = isLoaded ? 'img-loaded' : 'img-loading';
    const hoverClass = onClick ? 'img-hover' : '';
    
    return `${baseClass} ${loadedClass} ${hoverClass} ${className}`.trim();
  };

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      className={getClassNames()}
      onLoad={() => setIsLoaded(true)}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      loading="lazy"
    />
  );
}
