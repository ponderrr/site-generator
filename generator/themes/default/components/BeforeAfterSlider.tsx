'use client';

import React, { useRef, useEffect } from 'react';

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt = "Before",
  afterAlt = "After"
}: BeforeAfterSliderProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const range = rangeRef.current;
    
    if (!overlay || !range) return;

    const updateClip = (value: number) => {
      overlay.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      updateClip(Number(target.value));
    };

    // Set initial value
    updateClip(50);
    
    range.addEventListener('input', handleInput);
    
    return () => {
      range.removeEventListener('input', handleInput);
    };
  }, []);

  return (
    <div className="compare-slider">
      <img 
        src={beforeSrc} 
        alt={beforeAlt}
        className="compare-slider__image"
        loading="lazy"
      />
      <div ref={overlayRef} className="compare-slider__overlay">
        <img 
          src={afterSrc} 
          alt={afterAlt}
          className="compare-slider__image"
          loading="lazy"
        />
      </div>
      <input
        ref={rangeRef}
        type="range"
        min="0"
        max="100"
        defaultValue="50"
        className="compare-slider__range"
        aria-label="Slide to compare before and after"
      />
    </div>
  );
}




