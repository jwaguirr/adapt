"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  ArrowDownAZ,
  History,
  Languages,
  BookOpen,
  CheckCircle,
  RotateCw,
} from "lucide-react";
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
  learned?: boolean;
}

const supabaseUrl = "https://myynwsmgvnrpekpzvhkp.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

type SortOrder = "recent" | "alphabetical";
type DisplayMode = "context" | "translation";

export default function Dashboard(): React.ReactElement {
  // Format helpers
  function formatDisplayTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (entryDay.getTime() === today.getTime()) return `Today, ${timeStr}`;
    if (entryDay.getTime() === yesterday.getTime()) return `Yesterday at ${timeStr}`;
    return date.toLocaleDateString();
  }

  function formatContext(context: string, term: string): string {
    if (!term) return context;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return context.replace(regex, "<mark><i>$1</i></mark>");
  }

  const [phrases, setPhrases] = useState<PhraseCard[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("translation");
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingTermIds, setUpdatingTermIds] = useState<Set<number>>(new Set());

  // Fetch data
  const fetchPhrases = useCallback(async () => {
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
          translation_spanish,
          learned,
          last_reviewed_at
        )
      `
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (error) {
      console.error("Error fetching phrases:", error);
      setPhrases([]);
    } else if (data) {
      const mapped = data.map((item: any) => ({
        id: item.id,
        phrase: item.Term?.term ?? item.term ?? "",
        context: item.context ?? item.Term?.example ?? "",
        translation: item.Term?.translation_spanish ?? "",
        location: item.location ?? item.Term?.location ?? "",
        created_at: item.created_at,
        example: item.Term?.example,
        desc: item.Term?.desc,
        term_id: item.Term?.id,
        term: item.Term?.term,
        term_location: item.Term?.location,
        term_translation: item.Term?.translation_spanish,
        learned: !!item.Term?.learned,
      }));
      setPhrases(mapped);
    } else {
      setPhrases([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPhrases();
  }, [fetchPhrases]);

  // Sorting / filtering
  const sortedPhrasesForDisplay = useMemo(() => {
    const baseList = displayMode === "context" ? phrases : phrases.filter((p) => !p.learned);
    const sorted = [...baseList];

    if (sortOrder === "recent") {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      sorted.sort((a, b) => {
        const cmp = a.phrase.localeCompare(b.phrase);
        return cmp !== 0 ? cmp : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    if (displayMode === "translation") {
      const seen = new Set<string>();
      return sorted.filter((card) => {
        if (seen.has(card.phrase)) return false;
        seen.add(card.phrase);
        return true;
      });
    }

    return sorted;
  }, [phrases, sortOrder, displayMode]);

  // Learned list (unique)
  const learnedUnique = useMemo(() => {
    const learned = phrases.filter((p) => p.learned);
    const map = new Map<number | string, PhraseCard>();
    learned.forEach((p) => map.set(p.term_id ?? p.phrase, p));
    return Array.from(map.values()).sort((a, b) => a.phrase.localeCompare(b.phrase));
  }, [phrases]);

  // Optimistic update handlers
  const markAsLearned = async (term_id?: number) => {
    if (!term_id) return;
    setUpdatingTermIds((s) => new Set(s).add(term_id));
    setPhrases((prev) => prev.map((p) => (p.term_id === term_id ? { ...p, learned: true } : p)));
    const { error } = await supabase
      .from("Term")
      .update({ learned: true, last_reviewed_at: new Date().toISOString() })
      .eq("id", term_id);
    if (error) {
      console.error("Error marking as learned:", error);
      setPhrases((prev) => prev.map((p) => (p.term_id === term_id ? { ...p, learned: false } : p)));
    }
    setUpdatingTermIds((s) => {
      const next = new Set(s);
      next.delete(term_id);
      return next;
    });
  };

  const unmarkAsLearned = async (term_id?: number) => {
    if (!term_id) return;
    setUpdatingTermIds((s) => new Set(s).add(term_id));
    setPhrases((prev) => prev.map((p) => (p.term_id === term_id ? { ...p, learned: false } : p)));
    const { error } = await supabase.from("Term").update({ learned: false }).eq("id", term_id);
    if (error) {
      console.error("Error unmarking learned:", error);
      setPhrases((prev) => prev.map((p) => (p.term_id === term_id ? { ...p, learned: true } : p)));
    }
    setUpdatingTermIds((s) => {
      const next = new Set(s);
      next.delete(term_id);
      return next;
    });
  };

  // Button helpers
  const sortButtonClass = (order: SortOrder) =>
    order === sortOrder ? "bg-blue-100 text-blue-700" : "bg-white text-gray-600 hover:bg-gray-100";

  const displayButtonClass = (mode: DisplayMode) =>
    mode === displayMode ? "bg-blue-100 text-blue-700" : "bg-white text-gray-600 hover:bg-gray-100";

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <main>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-lg text-gray-600 mt-2">
              Your collection of phrases and their translations and real-world context.
            </p>
          </header>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSortOrder("recent")}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-colors border ${sortButtonClass(
                  "recent"
                )}`}
              >
                <History size={16} className="mr-2" />
                Most Recent
              </button>
              <button
                onClick={() => setSortOrder("alphabetical")}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-colors border ${sortButtonClass(
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
                className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-colors border ${displayButtonClass(
                  "translation"
                )}`}
              >
                <Languages size={16} className="mr-2" />
                Show Translations
              </button>
              <button
                onClick={() => setDisplayMode("context")}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-colors border ${displayButtonClass(
                  "context"
                )}`}
              >
                <BookOpen size={16} className="mr-2" />
                Show Encounters
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center text-gray-500">Loading phrases...</div>
          ) : (
            <div className="space-y-4">
              {/* Header row */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2">
                <h3 className="col-span-12 md:col-span-3 text-sm font-bold text-gray-500 uppercase tracking-wider">
                  Phrase
                </h3>
                {displayMode === "context" ? (
                  <>
                    <h3 className="col-span-12 md:col-span-7 text-sm font-bold text-gray-500 uppercase tracking-wider">
                      Context
                    </h3>
                    <h3 className="col-span-12 md:col-span-1 text-sm font-bold text-gray-500 uppercase tracking-wider">
                      Location
                    </h3>
                    <h3 className="col-span-12 md:col-span-1 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">
                      Learned
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

              {/* Rows */}
              {sortedPhrasesForDisplay.map((card) => {
                const isUpdating = !!card.term_id && updatingTermIds.has(card.term_id);
                return (
                  <div
                    key={card.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Phrase */}
                      <div className="col-span-12 md:col-span-3">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{card.phrase}</h3>
                        {displayMode === "context" && (
                          <span className="text-xs text-gray-500 uppercase tracking-wider">
                            {formatDisplayTime(card.created_at)}
                          </span>
                        )}
                      </div>

                      {displayMode === "context" ? (
                        <>
                          {/* Context */}
                          <div className="col-span-12 md:col-span-7">
                            <p
                              className="text-gray-700 leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: formatContext(card.context, card.phrase),
                              }}
                            />
                          </div>

                          {/* Location */}
                          <div className="col-span-12 md:col-span-1">
                            <p className="text-gray-700 leading-relaxed text-sm">{card.location}</p>
                          </div>

                          {/* Sleek learned button */}
                          <div className="col-span-12 md:col-span-1 flex justify-end">
                            {card.term_id && (
                              <button
                                onClick={() =>
                                  card.learned
                                    ? unmarkAsLearned(card.term_id)
                                    : markAsLearned(card.term_id)
                                }
                                disabled={isUpdating}
                                className={`flex items-center space-x-1 text-sm font-medium ${
                                  card.learned
                                    ? "text-green-500 hover:text-green-600"
                                    : "text-gray-500 hover:text-green-600"
                                }`}
                              >
                                <CheckCircle
                                  size={18}
                                  className={
                                    card.learned ? "fill-green-500" : ""
                                  }
                                />
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Translation */}
                          <div className="col-span-12 md:col-span-6">
                            <p className="text-gray-700 leading-relaxed">{card.translation}</p>
                            {card.desc && (
                              <p className="text-xs text-gray-500 mt-1">{card.desc}</p>
                            )}
                          </div>

                          {/* Example + Mark button */}
                          <div className="col-span-12 md:col-span-3 flex items-center justify-between">
                            <p className="text-gray-700">{card.example || ""}</p>
                            {card.term_id && (
                              <button
                                onClick={() => markAsLearned(card.term_id)}
                                disabled={card.learned || isUpdating}
                                className={`ml-3 flex items-center space-x-1 text-sm font-medium ${
                                  card.learned
                                    ? "text-green-500 cursor-default"
                                    : "text-gray-500 hover:text-green-600"
                                }`}
                              >
                                <CheckCircle
                                  size={18}
                                  className={card.learned ? "fill-green-500" : ""}
                                />
                                <span>
                                  {card.learned ? "" : isUpdating ? "..." : ""}
                                </span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Learned list (translation mode only) */}
              {displayMode === "translation" && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Learned Words</h2>
                  {learnedUnique.length === 0 ? (
                    <p className="text-gray-500">No words learned yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {learnedUnique.map((card) => {
                        const isUpdating =
                          !!card.term_id && updatingTermIds.has(card.term_id);
                        return (
                          <div
                            key={`learned-${card.term_id ?? card.id}`}
                            className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-6"
                          >
                            <div className="grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-12 md:col-span-3">
                                <h3 className="text-lg font-semibold text-green-800 mb-1">
                                  {card.phrase}
                                </h3>
                                <p className="text-xs text-green-600">Learned ✓</p>
                              </div>
                              <div className="col-span-12 md:col-span-6">
                                <p className="text-green-700 leading-relaxed">
                                  {card.translation}
                                </p>
                                {card.example && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Example: {card.example}
                                  </p>
                                )}
                              </div>
                              <div className="col-span-12 md:col-span-3 flex justify-end">
                                {card.term_id && (
                                  <button
                                    onClick={() => unmarkAsLearned(card.term_id)}
                                    disabled={isUpdating}
                                    className={`flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                                      isUpdating
                                        ? "bg-yellow-100 text-yellow-900 cursor-wait"
                                        : "bg-white text-gray-700 border hover:bg-gray-50"
                                    }`}
                                  >
                                    <RotateCw size={14} className="mr-1" />
                                    {isUpdating ? "Working..." : "Unmark"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
