

interface Props {
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  source?: string;
}

const SIZE_CLASSES = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-14 h-14 text-lg',
  lg: 'w-20 h-20 text-2xl',
  xl: 'w-28 h-28 text-4xl',
};

const AVATAR_COLORS = [
  'from-red-400 to-red-600',
  'from-purple-400 to-violet-500',
  'from-blue-400 to-indigo-500',
  'from-teal-400 to-emerald-500',
  'from-orange-400 to-amber-500',
  'from-rose-400 to-red-500',
];

const SOURCE_BADGE: Record<string, string> = {
  google: 'bg-green-400',
  facebook: 'bg-blue-500',
  instagram: 'bg-purple-500',
  manual: 'bg-gray-300',
  phone: 'bg-teal-400',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getColor(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function ContactAvatar({ name, photoUrl, size = 'lg', source }: Props) {
  const sizeClass = SIZE_CLASSES[size];
  const colorClass = getColor(name);

  return (
    <div className="relative inline-block">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className={`${sizeClass} rounded-full object-cover ring-4 ring-white shadow-md`}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div
          className={`${sizeClass} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center ring-4 ring-white shadow-md font-bold text-white`}
        >
          {getInitials(name)}
        </div>
      )}
      {source && (
        <span
          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${SOURCE_BADGE[source] ?? 'bg-gray-300'}`}
        />
      )}
    </div>
  );
}
