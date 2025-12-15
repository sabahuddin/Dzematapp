import {
  Award,
  Trophy,
  Star,
  Medal,
  Crown,
  Heart,
  Flame,
  Target,
  Shield,
  HandHeart,
  Users,
  BookOpen,
  Sparkles,
  Zap,
  Gift,
  Sun,
  LucideIcon
} from 'lucide-react';

export interface BadgeIconConfig {
  id: string;
  name: string;
  Icon: LucideIcon;
  color: string;
}

export const BADGE_ICONS: BadgeIconConfig[] = [
  { id: 'award', name: 'Nagrada', Icon: Award, color: '#FFD700' },
  { id: 'trophy', name: 'Trofej', Icon: Trophy, color: '#FFB300' },
  { id: 'star', name: 'Zvijezda', Icon: Star, color: '#FFC107' },
  { id: 'medal', name: 'Medalja', Icon: Medal, color: '#FF9800' },
  { id: 'crown', name: 'Kruna', Icon: Crown, color: '#9C27B0' },
  { id: 'heart', name: 'Srce', Icon: Heart, color: '#E91E63' },
  { id: 'flame', name: 'Plamen', Icon: Flame, color: '#FF5722' },
  { id: 'target', name: 'Cilj', Icon: Target, color: '#4CAF50' },
  { id: 'shield', name: 'Štit', Icon: Shield, color: '#3F51B5' },
  { id: 'handheart', name: 'Pomoć', Icon: HandHeart, color: '#00BCD4' },
  { id: 'users', name: 'Zajednica', Icon: Users, color: '#009688' },
  { id: 'book', name: 'Znanje', Icon: BookOpen, color: '#795548' },
  { id: 'sparkles', name: 'Sjaj', Icon: Sparkles, color: '#673AB7' },
  { id: 'zap', name: 'Energija', Icon: Zap, color: '#FFEB3B' },
  { id: 'gift', name: 'Dar', Icon: Gift, color: '#F44336' },
  { id: 'sun', name: 'Sunce', Icon: Sun, color: '#FF9800' },
];

export function getBadgeIconById(iconId: string | null | undefined): BadgeIconConfig {
  return BADGE_ICONS.find(icon => icon.id === iconId) || BADGE_ICONS[0];
}

interface BadgeIconDisplayProps {
  iconId: string | null | undefined;
  size?: number;
  className?: string;
}

export function BadgeIconDisplay({ iconId, size = 32, className = '' }: BadgeIconDisplayProps) {
  const iconConfig = getBadgeIconById(iconId);
  const IconComponent = iconConfig.Icon;
  
  return (
    <div 
      className={`flex items-center justify-center rounded-full ${className}`}
      style={{ 
        width: size + 8, 
        height: size + 8, 
        backgroundColor: `${iconConfig.color}20`
      }}
    >
      <IconComponent 
        size={size} 
        style={{ color: iconConfig.color }}
        strokeWidth={2}
      />
    </div>
  );
}
