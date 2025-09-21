"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ArrowDownAZ, History, Play, Languages, BookOpen } from "lucide-react"; 
import { createClient } from "@supabase/supabase-js";
import Navbar from "../components/Navbar";

interface PhraseCard {
  id: number;
  phrase: string;
  context: string;
  translation: string;
  location: string;
  created_at: string;
  example?: string;
  desc?: string;
  term_id?: number;
  term?: string;
  term_location?: string;
  term_translation?: string;
}

const supabaseUrl = "https://myynwsmgvnrpekpzvhkp.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

type SortOrder = "recent" | "alphabetical";
type DisplayMode = "context" | "translation";

export default function Dashboard(): React.ReactElement {
  function formatDisplayTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const entryDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (entryDay.getTime() === today.getTime()) {
      return `Today, ${timeStr}`;
    } else if (entryDay.getTime() === yesterday.getTime()) {
      return `Yesterday at ${timeStr}`;
    } else {
      return date.toLocaleDateString();
    }
  }

  function formatContext(context: string, term: string): string {
    const regex = new RegExp(
      `(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    return context.replace(regex, "<mark><i>$1</i></mark>");
  }

  const [phrases, setPhrases] = useState<PhraseCard[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("translation");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPhrases = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("Encounter")
        .select(
          `
          *,
          Term (
            id,
            location,
            term,
            desc,
            example,
            translation_spanish
          )
        `
        )
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
      console.log("Fetched data:", data, "Error:", error);

      if (error) {
        console.error("Error fetching phrases:", error);
      } else if (data) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          phrase: item.Term?.term || item.term || "",
          context: item.context || item.Term?.example || "",
          translation: item.Term?.translation_spanish || "",
          location: item.location || item.Term?.location || "",
          created_at: item.created_at,
          example: item.Term?.example,
          desc: item.Term?.desc,
          term_id: item.Term?.id,
          term: item.Term?.term,
          term_location: item.Term?.location,
          term_translation: item.Term?.translation_spanish,
        }));
        setPhrases(mapped);
      }
      setLoading(false);
    };

    fetchPhrases();
  }, []);

  // Filter to unique phrases (by phrase text)
  // Show all instances in context mode, unique in translation mode
  const sortedPhrasesForDisplay = useMemo(() => {
    const sorted = [...phrases];
    if (sortOrder === "recent") {
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortOrder === "alphabetical") {
      sorted.sort((a, b) => {
        const phraseCompare = a.phrase.localeCompare(b.phrase);
        if (phraseCompare !== 0) return phraseCompare;
        // If phrases are equal, sort by created_at descending
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    }
    if (displayMode === "context") {
      return sorted;
    } else {
      // Only show unique phrases in translation mode
      const seen = new Set<string>();
      const unique: PhraseCard[] = [];
      for (const card of sorted) {
        if (!seen.has(card.phrase)) {
          seen.add(card.phrase);
          unique.push(card);
        }
      }
      return unique;
    }
  }, [phrases, sortOrder, displayMode]);

  const getButtonClass = (order: SortOrder | DisplayMode) => {
    const isSelected = sortOrder === order || displayMode === order;
    return isSelected
      ? "bg-blue-100 text-blue-700"
      : "bg-white text-gray-600 hover:bg-gray-100";
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-lg text-gray-600 mt-2">
              Your collection of phrases and their translations and real-world
              context.
            </p>
          </header>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSortOrder("recent")}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-colors border ${getButtonClass(
                  "recent"
                )}`}
              >
                <History size={16} className="mr-2" />
                Most Recent
              </button>
              <button
                onClick={() => setSortOrder("alphabetical")}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-colors border ${getButtonClass(
                  "alphabetical"
                )}`}
              >
                <ArrowDownAZ size={16} className="mr-2" />
                Alphabetical
              </button>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <button
                onClick={() => setDisplayMode("translation")}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-colors border ${getButtonClass(
                  "translation"
                )}`}
              >
                <Languages size={16} className="mr-2" />
                Show Translations
              </button>
              <button
                onClick={() => setDisplayMode("context")}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-colors border ${getButtonClass(
                  "context"
                )}`}
              >
                <BookOpen size={16} className="mr-2" />
                Show Encounters
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-500">Loading phrases...</div>
          ) : (
            <div className="space-y-4">
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2">
                <h3 className="col-span-12 md:col-span-3 text-sm font-bold text-gray-500 uppercase tracking-wider">
                  Phrase
                </h3>
                {displayMode === "context" ? (
                  <>
                    <h3 className="col-span-12 md:col-span-8 text-sm font-bold text-gray-500 uppercase tracking-wider">
                      Context
                    </h3>
                    <h3 className="col-span-12 md:col-span-1 text-sm font-bold text-gray-500 uppercase tracking-wider">
                      Location
                    </h3>
                  </>
                ) : (
                  <>
                    <h3 className="col-span-12 md:col-span-6 text-sm font-bold text-gray-500 uppercase tracking-wider">
                      Translation
                    </h3>
                    <h3 className="col-span-12 md:col-span-3 text-sm font-bold text-gray-500 uppercase tracking-wider">
                      Example
                    </h3>
                  </>
                )}
              </div>
              
              {sortedPhrasesForDisplay.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-3">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {card.phrase}
                      </h3>
                      {displayMode === "context" ? (
                        <span className="text-xs text-gray-500 uppercase tracking-wider">
                            {formatDisplayTime(card.created_at)}
                        </span>
                      ) : null}
                    </div>
                    
                    {displayMode === "context" ? (
                      <>
                        <div className="col-span-12 md:col-span-8">
                          <p
                            className="text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: formatContext(card.context, card.phrase),
                            }}
                          />
                          {card.example && (
                            <p className="text-xs text-gray-400 mt-1">
                              Example: {card.example}
                            </p>
                          )}
                        </div>
                        <div className="col-span-12 md:col-span-1">
                          <p className="text-gray-700 leading-relaxed text-sm">
                            {card.location}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="col-span-12 md:col-span-6">
                          <p className="text-gray-700 leading-relaxed">
                            {card.translation}
                          </p>
                          {card.desc && (
                            <p className="text-xs text-gray-500 mt-1">
                              {card.desc}
                            </p>
                          )}
                        </div>
                        <div className="col-span-12 md:col-span-3">
                          <p className="text-gray-700 leading-relaxed">
                            {card.example || ""}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}