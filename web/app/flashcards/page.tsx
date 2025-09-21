"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Settings,
  RefreshCcw,
  X,
  Check,
  Filter,
  BookOpen,
  Library,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import Navbar from "../components/Navbar";

interface Card {
  id: number;
  front: string;
  back: string;
  learned?: boolean;
  encountered?: boolean;
}

interface FilterSettings {
  termSource: 'all' | 'encountered';
  includeLearned: boolean;
}

const supabaseUrl = "https://myynwsmgvnrpekpzvhkp.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);
const ELEVENLABS_VOICE_ID_ENGLISH = "21m00Tcm4TlvDq8ikWAM";
const ELEVENLABS_VOICE_ID_SPANISH = "ThT5KcBeYPX3keUQqHPh"; // Spanish voice

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function FlashcardGame(): React.ReactElement {
  const [sourceCards, setSourceCards] = useState<Card[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [filterSettings, setFilterSettings] = useState<FilterSettings>({
    termSource: 'all',
    includeLearned: true,
  });

  useEffect(() => {
    const keyFromEnv = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    if (keyFromEnv) {
      setApiKey(keyFromEnv);
    }

    fetchAndSetCards();
  }, []);

  const fetchAndSetCards = async () => {
    setLoading(true);
    
    // Get all terms
    const { data: termsData, error: termsError } = await supabase
      .from("Term")
      .select("id, term, translation_spanish, learned");

    if (termsError) {
      console.error("Error fetching terms:", termsError);
      setLoading(false);
      return;
    }

    // Get encountered term IDs
    const { data: encountersData, error: encountersError } = await supabase
      .from("Encounter")
      .select("term_id");

    if (encountersError) {
      console.error("Error fetching encounters:", encountersError);
      setLoading(false);
      return;
    }

    const encounteredTermIds = new Set(encountersData?.map(e => e.term_id) || []);

    if (termsData) {
      const formattedCards: Card[] = termsData.map((term) => ({
        id: term.id,
        front: term.term,
        back: term.translation_spanish,
        learned: term.learned || false,
        encountered: encounteredTermIds.has(term.id),
      }));

      setSourceCards(formattedCards);
      setLoading(false);
    }
  };

  // Filter cards based on current settings
  const filteredCards = useMemo(() => {
    let filtered = [...sourceCards];

    // Filter by term source (all vs encountered)
    if (filterSettings.termSource === 'encountered') {
      filtered = filtered.filter(card => card.encountered);
    }

    // Filter by learned status
    if (!filterSettings.includeLearned) {
      filtered = filtered.filter(card => !card.learned);
    }

    return filtered;
  }, [sourceCards, filterSettings]);

  // Update cards when filters change
  useEffect(() => {
    if (filteredCards.length > 0) {
      setCards(shuffleArray(filteredCards));
      setCurrentIndex(0);
      setIsFlipped(false);
      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  }, [filteredCards]);

  const currentCard = cards[currentIndex];

  const answerOptions = useMemo<string[]>(() => {
    if (!currentCard) return [];
    const correctAnswer = currentCard.back;
    // Always use all source cards for answer options, not just filtered ones
    const wrongAnswers = sourceCards
      .filter((card) => card.id !== currentCard.id)
      .map((card) => card.back);
    const shuffledWrongAnswers = shuffleArray(wrongAnswers).slice(0, 3);
    return shuffleArray([correctAnswer, ...shuffledWrongAnswers]);
  }, [currentIndex, cards, currentCard, sourceCards]);

  const handleTextToSpeech = async (text: string, isSpanish: boolean = false) => {
    if (!text || isSpeaking || !apiKey) return;
    setIsSpeaking(true);

    const voiceId = isSpanish ? ELEVENLABS_VOICE_ID_SPANISH : ELEVENLABS_VOICE_ID_ENGLISH;
    const modelId = isSpanish ? "eleven_multilingual_v2" : "eleven_monolingual_v1";

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            text: text,
            model_id: modelId,
          }),
        }
      );

      if (!response.ok)
        throw new Error(`ElevenLabs TTS Error: ${await response.text()}`);

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => setIsSpeaking(false);
    } catch (error) {
      console.error("Error with ElevenLabs TTS:", error);
      alert("Sorry, the audio couldn't be generated.");
      setIsSpeaking(false);
    }
  };

  const handleNext = (): void => {
    setIsFlipped(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handlePrev = (): void => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSelectAnswer = (answer: string): void => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    if (answer === currentCard.back) {
      setIsCorrect(true);
      setCorrectCount((prev) => prev + 1);
    } else {
      setIsCorrect(false);
      setIncorrectCount((prev) => prev + 1);
    }
    setTimeout(() => handleNext(), 1500);
  };

  const handleRestart = (): void => {
    setCards(shuffleArray(filteredCards));
    setCurrentIndex(0);
    setIsFlipped(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setCorrectCount(0);
    setIncorrectCount(0);
    setShowSummary(false);
  };

  const getButtonClass = (answer: string): string => {
    if (!selectedAnswer) return "bg-white hover:bg-gray-100";
    if (answer === currentCard.back)
      return "bg-green-100 text-green-800 border-green-500";
    if (answer === selectedAnswer)
      return "bg-red-100 text-red-800 border-red-500";
    return "bg-white text-gray-500";
  };

  const progress: number =
    cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  const handleFilterChange = (newSettings: Partial<FilterSettings>) => {
    setFilterSettings(prev => ({ ...prev, ...newSettings }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 4rem)" }}
        >
          <p className="text-gray-600 text-lg">Loading Game...</p>
        </div>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div
          className="flex flex-col items-center justify-center p-4"
          style={{ minHeight: "calc(100vh - 4rem)" }}
        >
          <div className="w-full max-w-2xl text-center bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Quiz Complete!
            </h2>
            <div className="grid grid-cols-2 gap-4 text-left mx-auto max-w-xs mb-8">
              <div className="bg-green-100 p-4 rounded-lg">
                <p className="text-xl font-semibold text-green-800">Correct</p>
                <p className="text-4xl font-bold text-green-600">
                  {correctCount}
                </p>
              </div>
              <div className="bg-red-100 p-4 rounded-lg">
                <p className="text-xl font-semibold text-red-800">Incorrect</p>
                <p className="text-4xl font-bold text-red-600">
                  {incorrectCount}
                </p>
              </div>
            </div>
            <button
              onClick={handleRestart}
              className="w-full max-w-xs bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Navbar />
      <div
        className="flex flex-col items-center justify-center p-4"
        style={{ minHeight: "calc(100vh - 4rem)" }}
      >
        {/* Settings Panel */}
        {showSettings && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.4)'}}>
            <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Filter Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Term Source Filter */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Term Source</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="termSource"
                        value="all"
                        checked={filterSettings.termSource === 'all'}
                        onChange={() => handleFilterChange({ termSource: 'all' })}
                        className="text-blue-600"
                      />
                      <Library size={18} className="text-gray-500" />
                      <span>All Terms ({sourceCards.length})</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="termSource"
                        value="encountered"
                        checked={filterSettings.termSource === 'encountered'}
                        onChange={() => handleFilterChange({ termSource: 'encountered' })}
                        className="text-blue-600"
                      />
                      <BookOpen size={18} className="text-gray-500" />
                      <span>Encountered Terms ({sourceCards.filter(c => c.encountered).length})</span>
                    </label>
                  </div>
                </div>

                {/* Learned Terms Filter */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Learned Terms</h4>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={filterSettings.includeLearned}
                      onChange={(e) => handleFilterChange({ includeLearned: e.target.checked })}
                      className="text-blue-600"
                    />
                    <span>Include learned terms</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {filterSettings.includeLearned 
                      ? "All terms will be included" 
                      : "Only terms marked as not learned will be shown"}
                  </p>
                </div>

                {/* Results Summary */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>{filteredCards.length}</strong> terms match your current filters
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowSettings(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {cards.length > 0 && currentCard ? (
          <div className="w-full max-w-2xl">
            {/* Filter indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Filter size={16} />
                <span>
                  {filterSettings.termSource === 'all' ? 'All Terms' : 'Encountered Terms'}
                  {!filterSettings.includeLearned && ' (Unlearned only)'}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {filteredCards.length} terms available
              </span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-4">
                <div
                  className="bg-green-500 h-2.5 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">
                {currentIndex + 1} / {cards.length}
              </span>
            </div>
            <div className="relative perspective-1000">
              <div
                className={`w-full h-64 transition-transform duration-700 transform-style-preserve-3d rounded-xl shadow-lg cursor-pointer ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className="absolute w-full h-full backface-hidden bg-white flex flex-col items-center justify-center p-6 rounded-xl border">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTextToSpeech(currentCard.front, false); // English
                    }}
                    disabled={isSpeaking}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:text-gray-200"
                  >
                    <Volume2 size={24} />
                  </button>
                  <p className="text-4xl font-bold text-center">
                    {currentCard.front}
                  </p>
                  {/* Show indicators */}
                  <div className="absolute bottom-4 left-4 flex space-x-2">
                    {currentCard.learned && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                        Learned
                      </span>
                    )}
                    {currentCard.encountered && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                        Encountered
                      </span>
                    )}
                  </div>
                </div>
                <div className="absolute w-full h-full backface-hidden bg-white flex flex-col items-center justify-center p-6 rounded-xl border rotate-y-180">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTextToSpeech(currentCard.back, true); // Spanish
                    }}
                    disabled={isSpeaking}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:text-gray-200"
                  >
                    <Volume2 size={24} />
                  </button>
                  <p className="text-2xl font-medium text-blue-600 text-center leading-relaxed">
                    {currentCard.back}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {answerOptions.map((answer, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(answer)}
                  disabled={selectedAnswer !== null}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${getButtonClass(
                    answer
                  )}`}
                >
                  <span className="font-semibold text-base text-left">
                    {answer}
                  </span>
                  {selectedAnswer === answer &&
                    (isCorrect ? (
                      <Check className="text-green-600" />
                    ) : (
                      <X className="text-red-600" />
                    ))}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between mt-8">
              <button 
                onClick={() => setShowSettings(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Settings size={24} />
              </button>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="p-3 rounded-full bg-white border shadow-sm disabled:opacity-50 hover:bg-gray-100"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={handleNext}
                  className="p-3 rounded-full bg-white border shadow-sm hover:bg-gray-100"
                >
                  <ChevronRight size={28} />
                </button>
              </div>
              <button
                onClick={handleRestart}
                className="text-gray-400 hover:text-gray-600"
              >
                <RefreshCcw size={24} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-700">
              No terms match your current filters.
            </h2>
            <p className="text-gray-500 mt-2 mb-4">
              Try adjusting your filter settings to see more terms.
            </p>
            <button
              onClick={() => setShowSettings(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Adjust Filters
            </button>
          </div>
        )}
      </div>
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}