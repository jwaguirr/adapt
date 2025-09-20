"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Settings,
  Shuffle,
  X,
  Check,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import Navbar from "../components/Navbar";

interface Card {
  id: number;
  front: string;
  back: string;
}

const supabaseUrl = "https://myynwsmgvnrpekpzvhkp.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);
const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

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

  useEffect(() => {
    const keyFromEnv = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    if (keyFromEnv) {
      setApiKey(keyFromEnv);
    }

    const fetchAndSetCards = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("Data")
        .select("id, phrase, translation");

      if (error) {
        console.error("Error fetching cards:", error);
        setLoading(false);
      } else if (data) {
        const added = new Set<string>();
        const formattedCards: Card[] = [];
        for (const item of data) {
          if (!added.has(item.phrase)) {
            added.add(item.phrase);
            formattedCards.push({
              id: item.id,
              front: item.phrase,
              back: item.translation,
            });
          }
        }
        setSourceCards(formattedCards);
        setCards(shuffleArray(formattedCards));
        setLoading(false);
      }
    };
    fetchAndSetCards();
  }, []);

  const currentCard = cards[currentIndex];

  const answerOptions = useMemo<string[]>(() => {
    if (!currentCard) return [];
    const correctAnswer = currentCard.back;
    const wrongAnswers = sourceCards
      .filter((card) => card.id !== currentCard.id)
      .map((card) => card.back);
    const shuffledWrongAnswers = shuffleArray(wrongAnswers).slice(0, 3);
    return shuffleArray([correctAnswer, ...shuffledWrongAnswers]);
  }, [currentIndex, cards, currentCard, sourceCards]);

  const handleTextToSpeech = async (text: string) => {
    if (!text || isSpeaking || !apiKey) return;
    setIsSpeaking(true);

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_monolingual_v1",
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
    setCards(shuffleArray(sourceCards));
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
        {cards.length > 0 && currentCard ? (
          <div className="w-full max-w-2xl">
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
                      handleTextToSpeech(currentCard.front);
                    }}
                    disabled={isSpeaking}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:text-gray-200"
                  >
                    <Volume2 size={24} />
                  </button>
                  <p className="text-4xl font-bold text-center">
                    {currentCard.front}
                  </p>
                </div>
                <div className="absolute w-full h-full backface-hidden bg-white flex flex-col items-center justify-center p-6 rounded-xl border rotate-y-180">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTextToSpeech(currentCard.back);
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
              <button className="text-gray-400 hover:text-gray-600">
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
                <Shuffle size={24} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-700">
              No phrases found.
            </h2>
            <p className="text-gray-500 mt-2">
              Please add some phrases to your database to start playing.
            </p>
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
