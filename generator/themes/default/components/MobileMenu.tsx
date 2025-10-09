'use client';

import React, { useState, useEffect } from 'react';

interface MobileMenuProps {
  items: { label: string; href: string }[];
  ctaLabel?: string;
  ctaHref?: string;
}

export function MobileMenu({ items, ctaLabel, ctaHref }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Prevent scroll when menu is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden inline-flex items-center p-2 rounded-lg border border-zinc-300 hover:bg-zinc-100 transition focus-ring"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          {isOpen ? (
            <path d="M6 6l12 12M6 18L18 6" />
          ) : (
            <path d="M3 6h18M3 12h18M3 18h18" />
          )}
        </svg>
      </button>

      <div 
        className="mobile-menu__overlay"
        data-state={isOpen ? "open" : "closed"}
        onClick={() => setIsOpen(false)}
        aria-hidden={!isOpen}
      />

      <nav 
        className="mobile-menu" 
        data-state={isOpen ? "open" : "closed"}
        aria-label="Mobile navigation"
      >
        <ul className="flex flex-col p-6 gap-2">
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="block px-4 py-3 text-lg font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 rounded-lg transition"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            </li>
          ))}
          {ctaLabel && ctaHref && (
            <li className="mt-4">
              <a
                href={ctaHref}
                className="block text-center px-6 py-3 bg-zinc-900 text-white font-medium rounded-full hover:scale-105 transition"
                onClick={() => setIsOpen(false)}
              >
                {ctaLabel}
              </a>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}




