'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Product', href: '#product' },
    { name: 'Demo', href: '#demo' },
    { name: 'Specs', href: '#specs' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'Support', href: '#support' },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-500 ${
        scrolled 
          ? 'pt-4 px-4' 
          : 'pt-0 px-0 sticky top-0'
      }`}
    >
      <div className={`mx-auto transition-all duration-500 ${
        scrolled 
          ? 'max-w-6xl' 
          : 'max-w-full'
      }`}>
        <div className={`transition-all duration-500 ${
          scrolled 
            ? 'bg-white/20 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl hover:bg-white/25' 
            : 'bg-neutral-50/80 backdrop-blur-md border-b border-neutral-200/20'
        }`}>
          <div className={`flex justify-center items-center h-16 md:h-18 transition-all duration-500 ${
            scrolled ? 'px-8' : 'px-4 sm:px-6 lg:px-8'
          }`}>
            {/* Desktop Navigation - All Centered */}
            <div className="hidden md:flex items-center justify-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`transition-colors duration-200 font-medium relative group ${
                    scrolled 
                      ? 'text-neutral-800 hover:text-neutral-900' 
                      : 'text-neutral-700 hover:text-neutral-900'
                  }`}
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neutral-800 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
              
              {/* Get Started Button */}
              <Link
                href="/dashboard"
                className="bg-neutral-800 hover:bg-neutral-900 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200 ml-4"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden relative w-6 h-6 focus:outline-none"
              aria-label="Toggle menu"
            >
              <span
                className={`absolute top-0 left-0 w-6 h-0.5 transform transition-all duration-300 ${
                  scrolled ? 'bg-neutral-800' : 'bg-neutral-700'
                } ${isOpen ? 'rotate-45 translate-y-2.5' : ''}`}
              ></span>
              <span
                className={`absolute top-2.5 left-0 w-6 h-0.5 transition-all duration-300 ${
                  scrolled ? 'bg-neutral-800' : 'bg-neutral-700'
                } ${isOpen ? 'opacity-0' : ''}`}
              ></span>
              <span
                className={`absolute top-5 left-0 w-6 h-0.5 transform transition-all duration-300 ${
                  scrolled ? 'bg-neutral-800' : 'bg-neutral-700'
                } ${isOpen ? '-rotate-45 -translate-y-2.5' : ''}`}
              ></span>
            </button>
          </div>

          {/* Mobile Navigation */}
          <div
            className={`md:hidden transition-all duration-300 ease-in-out ${
              isOpen 
                ? 'max-h-96 opacity-100' 
                : 'max-h-0 opacity-0 overflow-hidden'
            }`}
          >
            <div className={`py-4 space-y-4 transition-all duration-500 ${
              scrolled 
                ? 'px-8 border-t border-white/20' 
                : 'px-4 sm:px-6 lg:px-8 border-t border-neutral-200/20'
            }`}>
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block transition-colors duration-200 font-medium py-2 ${
                    scrolled 
                      ? 'text-neutral-800 hover:text-neutral-900' 
                      : 'text-neutral-700 hover:text-neutral-900'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className={`pt-4 transition-all duration-500 ${
                scrolled ? 'border-t border-white/20' : 'border-t border-neutral-200/20'
              }`}>
                <Link
                  href="#get-started"
                  className="block bg-neutral-800 hover:bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium text-center hover:shadow-lg transition-all duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}