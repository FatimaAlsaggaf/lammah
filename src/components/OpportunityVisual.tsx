import React, { useState } from 'react';
import { CalendarDays, Compass, Users } from 'lucide-react';
import type { Opportunity } from '../types/domain';

const IMAGE_URLS: Record<Opportunity['imageVariant'], string> = {
  workshop: '/src/assets/images/lammah_cx_workshop_1795302989784.jpg',
  networking: '/src/assets/images/lammah_cx_networking_1795302990444.jpg',
  volunteering: '/src/assets/images/lammah_cx_volunteering_1795302990444.jpg',
};

export function OpportunityVisual({
  variant,
  alt,
  className = 'w-full h-40 object-cover',
}: {
  variant: Opportunity['imageVariant'];
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    const FallbackIcon =
      variant === 'networking' ? Users : variant === 'volunteering' ? Compass : CalendarDays;
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0F1B35] via-[#17274A] to-[#3B2667] text-white/90 ${className}`}
      >
        <FallbackIcon className="w-7 h-7 mb-2 text-blue-300" />
        <span className="text-xs font-medium px-3 text-center line-clamp-1">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={IMAGE_URLS[variant]}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
