interface DzematLogoProps {
  size?: number;
}

export function DzematLogo({ size = 64 }: DzematLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer rounded square border */}
      <rect
        x="8"
        y="8"
        width="84"
        height="84"
        rx="16"
        stroke="#2196F3"
        strokeWidth="6"
        fill="none"
      />
      
      {/* Crescent moon */}
      <path
        d="M 50 20 A 12 12 0 1 1 50 35 A 9 9 0 1 0 50 20 Z"
        fill="#2196F3"
      />
      
      {/* Book - main rectangle */}
      <rect
        x="32"
        y="40"
        width="36"
        height="38"
        rx="4"
        fill="#2196F3"
      />
      
      {/* Book - bottom white curve */}
      <path
        d="M 32 70 Q 35 78 40 78 L 60 78 Q 65 78 68 70 L 68 78 L 32 78 Z"
        fill="white"
      />
    </svg>
  );
}
