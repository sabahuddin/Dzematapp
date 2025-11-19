interface DzematLogoProps {
  size?: number;
}

export function DzematLogo({ size = 64 }: DzematLogoProps) {
  return (
    <img
      src="/logo.png?v=3"
      alt="DžematApp Logo"
      width={size}
      height={size}
      style={{
        objectFit: 'contain',
        display: 'block'
      }}
    />
  );
}
