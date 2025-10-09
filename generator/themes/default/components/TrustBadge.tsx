import React from 'react';

interface TrustBadgeProps {
  items: string[];
}

export function TrustBadge({ items }: TrustBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && (
            <span className="h-4 w-px bg-white/30" aria-hidden="true" />
          )}
          <span>{item}</span>
        </React.Fragment>
      ))}
    </div>
  );
}




