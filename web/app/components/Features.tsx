'use client';

import { useState, useRef, useEffect } from 'react';

interface LiveTranslationDemoProps {
  delay: number;
}

interface AnimatedTextProps {
  text: string;
  currentStep: number;
  stepIndex: number;
  className?: string;
  isTranslation?: boolean;
}

function AnimatedText({ text, currentStep, stepIndex, className = "", isTranslation = false }: AnimatedTextProps) {
  const [visibleWords, setVisibleWords] = useState<number>(0);
  const words = text.split(' ');

  useEffect(() => {
    // Reset animation when step changes
    setVisibleWords(0);
    
    // Only animate if this is the current step
    if (currentStep === stepIndex) {
      const initialDelay = isTranslation ? 1000 : 300; // Delay translation bubble
      const timer = setTimeout(() => {
        // Stagger word appearance
        const wordTimer = setInterval(() => {
          setVisibleWords(prev => {
            if (prev >= words.length) {
              clearInterval(wordTimer);
              return prev;
            }
            return prev + 1;
          });
        }, 150); // 150ms delay between words

        return () => clearInterval(wordTimer);
      }, initialDelay);

      return () => clearTimeout(timer);
    }
  }, [currentStep, stepIndex, words.length, isTranslation]);

  return (
    <span className={className}>
      {words.map((word, index) => (
        <span
          key={`${stepIndex}-${index}`}
          className={`inline-block transition-all duration-500 ease-out ${
            index < visibleWords 
              ? 'opacity-100 transform translate-y-0' 
              : 'opacity-0 transform translate-y-2'
          }`}
          style={{
            transitionDelay: currentStep === stepIndex ? `${index * 50}ms` : '0ms'
          }}
        >
          {word}
          {index < words.length - 1 && '\u00A0'} {/* Non-breaking space */}
        </span>
      ))}
    </span>
  );
}

function LiveTranslationDemo({ delay }: LiveTranslationDemoProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isFullyExpanded, setIsFullyExpanded] = useState(false);
  const [isShrinking, setIsShrinking] = useState(false);
  const [shouldStopScroll, setShouldStopScroll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<NodeJS.Timeout | null>(null);
  const lockScrollY = useRef(0);

  const translationSteps = [
    { 
      original: "Sus niveles de presión arterial están elevados.", 
      translation: "Your blood pressure levels are elevated.", 
      speaker: "Doctor",
      context: "Medical assessment"
    },
    { 
      original: "Necesita tomar este medicamento dos veces al día.", 
      translation: "You need to take this medication twice a day.", 
      speaker: "Doctor",
      context: "Treatment instructions"
    },
    { 
      original: "Es importante que regrese en dos semanas para control.", 
      translation: "It's important that you return in two weeks for follow-up.", 
      speaker: "Doctor",
      context: "Follow-up care"
    },
    { 
      original: "Debe evitar alimentos con mucha sal y azúcar.", 
      translation: "You should avoid foods high in salt and sugar.", 
      speaker: "Doctor",
      context: "Dietary advice"
    },
    { 
      original: "El ejercicio moderado será beneficioso para su condición.", 
      translation: "Moderate exercise will be beneficial for your condition.", 
      speaker: "Doctor",
      context: "Lifestyle recommendation"
    },
  ];

  // Simple fade in on page load
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Auto-expand when component comes into view
  useEffect(() => {
    const handleScroll = (e: Event) => {
      // IMMEDIATELY prevent scroll if locked - no other logic needed
      if (isExpanding || isShrinking || shouldStopScroll) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Check if div is visible in viewport
      const isInView = rect.top < windowHeight * 0.8 && rect.bottom > windowHeight * 0.2;

      // FORCE STOP scrolling and start expansion when div comes into view
      if (isInView && !isExpanding && !isFullyExpanded && !isShrinking && !shouldStopScroll) {
        e.preventDefault();
        e.stopPropagation();
        setShouldStopScroll(true);
        lockScrollY.current = window.scrollY;
        
        // Start expansion animation immediately
        setTimeout(() => {
          setIsExpanding(true);
          
          // Complete expansion after animation
          setTimeout(() => {
            setIsExpanding(false);
            setIsFullyExpanded(true);
            setShouldStopScroll(false);
          }, 1000); // 1 second animation
        }, 100); // Very short delay
        
        return false;
      }

      // FORCE STOP when fully expanded and trying to scroll up
      if (isFullyExpanded && rect.top > windowHeight * 0.6) {
        e.preventDefault();
        e.stopPropagation();
        setShouldStopScroll(true);
        lockScrollY.current = window.scrollY;
        
        // Start shrinking animation
        setTimeout(() => {
          setIsFullyExpanded(false);
          setIsShrinking(true);
          
          // Complete shrinking after animation
          setTimeout(() => {
            setIsShrinking(false);
            setShouldStopScroll(false);
          }, 1000); // 1 second animation
        }, 100);
        
        return false;
      }
    };

    const handleResize = () => {
      // Reset expansion state on resize
      if (isExpanding || isFullyExpanded || isShrinking || shouldStopScroll) {
        setIsExpanding(false);
        setIsFullyExpanded(false);
        setIsShrinking(false);
        setShouldStopScroll(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: false });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
    };
  }, [isExpanding, isFullyExpanded, isShrinking, shouldStopScroll]);


  // Simple conversation rotation
  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % translationSteps.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isVisible, translationSteps.length]);

  const currentTranslation = translationSteps[currentStep];

  // Calculate maximum scale needed to reach screen edges
  const calculateMaxScale = () => {
    if (!containerRef.current) return 3;
    
    const containerWidth = containerRef.current.offsetWidth;
    const windowWidth = window.innerWidth;
    const padding = 0;
    
    const maxScale = (windowWidth - padding) / containerWidth;
    return Math.max(1, Math.min(maxScale, 8));
  };

  // Determine animation class based on state
  const getAnimationClass = () => {
    if (isExpanding) return 'animate-expand';
    if (isFullyExpanded) return 'expanded';
    if (isShrinking) return 'animate-shrink';
    return '';
  };

  // Determine bubble animation class based on state
  const getBubbleAnimationClass = (side: 'left' | 'right') => {
    if (isExpanding) return side === 'left' ? 'animate-bubble-shrink-left' : 'animate-bubble-shrink-right';
    if (isFullyExpanded) return side === 'left' ? 'bubble-tiny-left' : 'bubble-tiny-right';
    if (isShrinking) return side === 'left' ? 'animate-bubble-grow-left' : 'animate-bubble-grow-right';
    return 'opacity-0'; // Hide bubbles when not expanded
  };

  return (
    <>
      <style jsx>{`
        .animate-expand {
          animation: expandToScreen 1s ease-out forwards;
        }
        
        .expanded {
          transform: scale(var(--max-scale, 3));
        }
        
        .animate-shrink {
          animation: shrinkToNormal 1s ease-out forwards;
        }
        
        @keyframes expandToScreen {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(var(--max-scale, 3));
          }
        }
        
        @keyframes shrinkToNormal {
          0% {
            transform: scale(var(--max-scale, 3));
          }
          100% {
            transform: scale(1);
          }
        }
        
        .animate-bubble-shrink-left {
          animation: bubbleShrinkLeft 1s ease-out forwards;
        }
        
        .animate-bubble-shrink-right {
          animation: bubbleShrinkRight 1s ease-out forwards;
        }
        
        .bubble-tiny-left {
          transform: scale(0.5) translateX(-100px);
          opacity: 1;
        }
        
        .bubble-tiny-right {
          transform: scale(0.5) translateX(100px);
          opacity: 1;
        }
        
        .animate-bubble-grow-left {
          animation: bubbleGrowLeft 1s ease-out forwards;
        }
        
        .animate-bubble-grow-right {
          animation: bubbleGrowRight 1s ease-out forwards;
        }
        
        @keyframes bubbleShrinkLeft {
          0% {
            transform: scale(1) translateX(0);
            opacity: 0;
          }
          100% {
            transform: scale(0.5) translateX(-100px);
            opacity: 1;
          }
        }
        
        @keyframes bubbleShrinkRight {
          0% {
            transform: scale(1) translateX(0);
            opacity: 0;
          }
          100% {
            transform: scale(0.5) translateX(100px);
            opacity: 1;
          }
        }
        
        @keyframes bubbleGrowLeft {
          0% {
            transform: scale(0.5) translateX(-200px);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateX(0);
            opacity: 0;
          }
        }
        
        @keyframes bubbleGrowRight {
          0% {
            transform: scale(0.5) translateX(200px);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateX(0);
            opacity: 0;
          }
        }
      `}</style>
      
      <div ref={containerRef} className="flex justify-center w-full">
        <div
        className={`relative max-w-4xl w-full bg-white border border-white/20 p-8 md:p-12 hover:bg-white transition-opacity duration-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        } ${getAnimationClass()}`}
        style={{
          borderRadius: isFullyExpanded ? '0px' : '24px',
          transformOrigin: 'center center',
          '--max-scale': calculateMaxScale()
        } as React.CSSProperties}
      >
      {/* Glassmorphism gradient overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-neutral-900/5"
        style={{ borderRadius: isFullyExpanded ? '0px' : '24px' }}
      ></div>
      
      {/* AR Glasses View - Outdoor Scene */}
      <div 
        className="relative overflow-hidden mb-6 min-h-[400px] md:min-h-[500px]"
        style={{ borderRadius: isFullyExpanded ? '0px' : '24px' }}
      >
        {/* First person POV video background */}
        <video 
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/First_Person_POV_Conversation_Video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Realistic lens tint overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/5"></div>

        {/* Glasses frame overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top frame */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-800/60 to-transparent"></div>
          {/* Bottom frame */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-800/60 to-transparent"></div>
          {/* Left frame */}
          <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-gray-800/60 to-transparent"></div>
          {/* Right frame */}
          <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-gray-800/60 to-transparent"></div>
          
          {/* Nose bridge shadow */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-gray-800/30 rounded-b-full blur-sm"></div>
        </div>

        {/* AR UI overlay layer */}
        <div className="absolute inset-0 z-10 p-8 md:p-12 w-full">

          {/* Conversation bubbles positioned in scene */}
          <div className="relative h-full flex items-end justify-between w-full pb-32">
            {/* Bubbles container - same horizontal level */}
            <div className="flex justify-end items-center w-full">
              {/* Original speech bubble */}
              <div className="flex justify-start w-1/2">
                <div className={`w-full max-w-md transition-transform duration-1000 ${getBubbleAnimationClass('left')}`}>
                  <div className="bg-white/30 backdrop-blur-md rounded-lg px-5 py-4 border border-white/50 min-h-[80px] flex flex-col justify-center">
                    <div className="flex items-center space-x-1 mb-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-sm font-medium text-white">{currentTranslation.speaker}</span>
                    </div>
                    <div className="text-sm font-medium text-white whitespace-nowrap overflow-hidden text-ellipsis">
                      <AnimatedText 
                        text={currentTranslation.original}
                        currentStep={currentStep}
                        stepIndex={currentStep}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Translation bubble */}
              <div className="flex justify-end w-1/2">
                <div className={`w-full max-w-md transition-transform duration-1000 ${getBubbleAnimationClass('right')}`}>
                  <div className="bg-black/75 backdrop-blur-md rounded-lg px-5 py-4 border border-gray-600/60 min-h-[80px] flex flex-col justify-center">
                    <div className="flex items-center space-x-1 mb-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm font-medium text-green-300">TRANSLATION</span>
                    </div>
                    <div className="text-sm font-medium text-white whitespace-nowrap overflow-hidden text-ellipsis">
                      <AnimatedText 
                        text={currentTranslation.translation}
                        currentStep={currentStep}
                        stepIndex={currentStep}
                        isTranslation={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subtle AR grid overlay for authenticity */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="w-full h-full" style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}></div>
          </div>
        </div>
      </div>
      </div>
    </div>
    </>
  );
}


export default function Features() {
  return (
    <section id="demo" className="relative">

      {/* Translation Demo - Spanning the Divide */}
      <div className="relative overflow-hidden">
        {/* Background split */}
        <div className="absolute inset-0">
          <div className="h-1/2 bg-neutral-50"></div>
          <div className="h-1/2 bg-stone-900"></div>
        </div>
        
        {/* Demo positioned over the divide */}
        <div className="relative z-10 py-32 md:py-40 lg:py-48">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <LiveTranslationDemo delay={200} />
          </div>
        </div>
      </div>
    </section>
  );
}