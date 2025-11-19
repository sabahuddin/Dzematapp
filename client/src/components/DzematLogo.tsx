interface DzematLogoProps {
  size?: number;
}

export function DzematLogo({ size = 64 }: DzematLogoProps) {
  return (
    <img
      src="/logo-v3.png"
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
