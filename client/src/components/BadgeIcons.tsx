import {
  Trophy,
  Medal,
  Star,
  Award,
  Crown,
  Target,
  Flame,
  Heart,
  Zap,
  Shield,
  Gem,
  Rocket,
  Sun,
  Users,
  HandHeart,
  CircleDollarSign,
} from 'lucide-react';

export const BADGE_ICONS = [
  { id: 'trophy', name: 'Trofej', icon: Trophy, color: '#FFD700' },
  { id: 'medal', name: 'Medalja', icon: Medal, color: '#C0C0C0' },
  { id: 'star', name: 'Zvijezda', icon: Star, color: '#FFA500' },
  { id: 'award', name: 'Nagrada', icon: Award, color: '#4CAF50' },
  { id: 'crown', name: 'Kruna', icon: Crown, color: '#9C27B0' },
  { id: 'target', name: 'Meta', icon: Target, color: '#F44336' },
  { id: 'flame', name: 'Plamen', icon: Flame, color: '#FF5722' },
  { id: 'heart', name: 'Srce', icon: Heart, color: '#E91E63' },
  { id: 'zap', name: 'Munja', icon: Zap, color: '#FFEB3B' },
  { id: 'shield', name: 'Štit', icon: Shield, color: '#2196F3' },
  { id: 'gem', name: 'Dijamant', icon: Gem, color: '#00BCD4' },
  { id: 'rocket', name: 'Raketa', icon: Rocket, color: '#607D8B' },
  { id: 'sun', name: 'Sunce', icon: Sun, color: '#FFC107' },
  { id: 'users', name: 'Zajednica', icon: Users, color: '#3F51B5' },
  { id: 'hand-heart', name: 'Donator', icon: HandHeart, color: '#8BC34A' },
  { id: 'dollar', name: 'Vakif', icon: CircleDollarSign, color: '#4CAF50' },
];

export function getBadgeIcon(iconId: string | null | undefined) {
  return BADGE_ICONS.find(b => b.id === iconId) || BADGE_ICONS[0];
}

interface BadgeIconDisplayProps {
  iconId: string | null | undefined;
  size?: number;
}

export function BadgeIconDisplay({ iconId, size = 40 }: BadgeIconDisplayProps) {
  const badge = getBadgeIcon(iconId);
  const Icon = badge.icon;
  
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: `${badge.color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={size * 0.6} color={badge.color} />
    </div>
  );
}

interface BadgeIconSelectorProps {
  value: string | null | undefined;
  onChange: (iconId: string) => void;
}

export function BadgeIconSelector({ value, onChange }: BadgeIconSelectorProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {BADGE_ICONS.map((badge) => {
        const Icon = badge.icon;
        const isSelected = value === badge.id;
        return (
          <button
            key={badge.id}
            type="button"
            onClick={() => onChange(badge.id)}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: isSelected ? `3px solid ${badge.color}` : '2px solid #e0e0e0',
              backgroundColor: isSelected ? `${badge.color}20` : '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title={badge.name}
            data-testid={`badge-icon-${badge.id}`}
          >
            <Icon size={24} color={badge.color} />
          </button>
        );
      })}
    </div>
  );
}
