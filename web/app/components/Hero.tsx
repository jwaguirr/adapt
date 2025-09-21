'use client';

import Image from "next/image";
import { useEffect, useState } from 'react';

export default function Hero() {
  const [visibleLetters, setVisibleLetters] = useState(0);
  const [showGlasses, setShowGlasses] = useState(false);
  const text = "ADAPT";

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setVisibleLetters(prev => {
          if (prev < text.length) {
            return prev + 1;
          }
          clearInterval(interval);
          return prev;
        });
      }, 200); // 200ms delay between each letter

      return () => clearInterval(interval);
    }, 500); // Initial delay before animation starts

    return () => clearTimeout(timer);
  }, [text.length]);

  // Trigger glasses animation after text animation completes
  useEffect(() => {
    const glassesTimer = setTimeout(() => {
      setShowGlasses(true);
    }, 500 + (text.length * 200) + 800); // Wait for text animation + extra delay

    return () => clearTimeout(glassesTimer);
  }, [text.length]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-50 pt-16">
      {/* Large background text */}
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <h1 className="text-[20rem] lg:text-[20rem] xl:text-[25rem] font-bold text-neutral-200 select-none pointer-events-none leading-none">
          {text.split('').map((letter, index) => (
            <span
              key={index}
              className={`inline-block transition-all duration-700 ease-out ${
                index < visibleLetters
                  ? 'opacity-100 blur-none translate-x-0'
                  : 'opacity-0 blur-md translate-x-8'
              }`}
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
            >
              {letter}
            </span>
          ))}
        </h1>
      </div>
      
      {/* Spline scene on top */}
      <main className="relative z-10 h-full w-full flex items-center justify-center">
        <div className={`transition-all duration-1000 ease-out ${
          showGlasses 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}>
          <Image src="/glasses.png" alt="Adapt" width={1000} height={1000} />
        </div>
      </main>
    </div>
  );
}
