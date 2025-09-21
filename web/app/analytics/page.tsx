"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Legend } from 'recharts';
import { Zap, Brain, Calendar, Loader2, AlertCircle, Sparkles, CheckCircle, Target } from 'lucide-react';
import { format, isToday, isPast, differenceInDays } from 'date-fns';

const supabaseUrl = 'https://myynwsmgvnrpekpzvhkp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Term {
    id: number;
    term: string;
    learned: boolean;
    srs_level: number;
    next_review_at: string;
    last_reviewed_at: string | null;
}
interface PracticeLog {
    term_id: number;
    event_type: string;
}

const srsLevelNames = ["New", "Learning", "Learning", "Maturing", "Maturing", "Known", "Known", "Mastered"];

const getReviewReason = (term: Term) => {
    const nextReviewDate = new Date(term.next_review_at);
    if (isPast(nextReviewDate) || isToday(nextReviewDate)) {
        return { text: "Due for review", color: "text-red-500", icon: <Calendar size={16} /> };
    }
    if (term.srs_level === 0 && !term.last_reviewed_at) {
        return { text: "New term", color: "text-blue-500", icon: <Sparkles size={16} /> };
    }
    if (term.srs_level > 0) {
         const daysUntilNext = differenceInDays(nextReviewDate, new Date());
         return { text: `Review in ${daysUntilNext + 1} day(s)`, color: "text-green-600", icon: <CheckCircle size={16} /> };
    }
    return { text: "Recently practiced", color: "text-gray-500", icon: <Brain size={16} /> };
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
                <p className="font-bold text-gray-800">{data.term}</p>
                <p className="text-sm text-gray-600">Strength: {srsLevelNames[data.srs_level]}</p>
                <p className="text-sm text-gray-600">Difficulty: {data.difficultyScore.toFixed(2)}</p>
            </div>
        );
    }
    return null;
};

export default function LearningVelocityPage() {
    const [terms, setTerms] = useState<Term[]>([]);
    const [practiceLogs, setPracticeLogs] = useState<PracticeLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            const [termRes, logRes] = await Promise.all([
                supabase.from('Term').select('*'),
                supabase.from('PracticeLog').select('term_id, event_type').eq('game', 'Flashcards')
            ]);

            if (termRes.error) console.error("Error fetching terms:", termRes.error);
            else setTerms(termRes.data as Term[] || []);

            if (logRes.error) console.error("Error fetching logs:", logRes.error);
            else setPracticeLogs(logRes.data as PracticeLog[] || []);
            
            setLoading(false);
        };
        fetchData();
    }, []);

    const priorityQueue = useMemo(() => {
        return [...terms].sort((a, b) => new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime()).slice(0, 10);
    }, [terms]);
    
    const memoryStrengthData = useMemo(() => {
        const uniqueNames = [...new Set(srsLevelNames)];
        return uniqueNames.map(name => {
            const count = terms.filter(t => srsLevelNames[t.srs_level] === name).length;
            return { name, count };
        });
    }, [terms]);

    const cognitiveLoadData = useMemo(() => {
        const stats: { [key: number]: { correct: number, incorrect: number, total: number } } = {};

        for (const log of practiceLogs) {
            if (!stats[log.term_id]) {
                stats[log.term_id] = { correct: 0, incorrect: 0, total: 0 };
            }
            stats[log.term_id].total++;
            if (log.event_type === 'correct_answer') {
                stats[log.term_id].correct++;
            } else {
                stats[log.term_id].incorrect++;
            }
        }

        return terms.map(term => {
            const termStats = stats[term.id];
            let difficultyScore = 0; 

            if (termStats && termStats.total > 0) {
                 difficultyScore = (termStats.incorrect / termStats.total) * Math.log10(termStats.total + 1);
            }

            return {
                term: term.term,
                srs_level: term.srs_level,
                difficultyScore: difficultyScore,
            };
        });
    }, [terms, practiceLogs]);


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="ml-2 text-gray-600 text-lg">Analyzing your learning patterns...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <Navbar />
            <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">Learning Velocity Dashboard</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border">
                        <div className="flex items-center mb-4"><Zap className="w-6 h-6 text-blue-600 mr-3" /><h3 className="text-xl font-semibold text-gray-900">Priority Review Queue</h3></div>
                        <p className="text-sm text-gray-500 mb-4">Your optimized study list. Choose how to practice each term.</p>
                        <div className="space-y-3">
                            {priorityQueue.map(term => {
                                const reason = getReviewReason(term);
                                return (
                                    <div key={term.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-semibold text-gray-800">{term.term}</p>
                                            <div className={`flex items-center text-xs mt-1 ${reason.color}`}>{reason.icon}<span className="ml-1.5">{reason.text}</span></div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <a href={`/flashcards?termId=${term.id}`} className="bg-white border border-gray-300 text-gray-700 font-semibold py-1 px-3 rounded-lg text-sm hover:bg-gray-100">Flashcard</a>
                                            <a href={`/dialogue-duel?termId=${term.id}`} className="bg-blue-600 text-white font-semibold py-1 px-3 rounded-lg text-sm hover:bg-blue-700">Dialogue</a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md border">
                        <div className="flex items-center mb-4"><Brain className="w-6 h-6 text-green-600 mr-3" /><h3 className="text-xl font-semibold text-gray-900">Memory Strength</h3></div>
                        <p className="text-sm text-gray-500 mb-4">Your entire vocabulary, sorted by how well you know it.</p>
                        <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={memoryStrengthData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} /><Tooltip cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }} /><Bar dataKey="count" fill="#10b981" name="Terms"/></BarChart></ResponsiveContainer></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border">
                     <div className="flex items-center mb-4"><Target className="w-6 h-6 text-red-600 mr-3" /><h3 className="text-xl font-semibold text-gray-900">Cognitive Load Analysis</h3></div>
                     <p className="text-sm text-gray-500 mb-4">Discover which terms are truly difficult vs. just new. Focus your energy on the "Tricky Terms" in the top-left.</p>
                     <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid />
                                <XAxis type="number" dataKey="srs_level" name="Memory Strength" unit="" domain={[0, 8]} ticks={[0, 2, 4, 6, 8]} tickFormatter={(val) => srsLevelNames[val]}/>
                                <YAxis type="number" dataKey="difficultyScore" name="Difficulty Score" unit="" />
                                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter name="Terms" data={cognitiveLoadData} fill="#ef4444" />
                            </ScatterChart>
                        </ResponsiveContainer>
                     </div>
                </div>

            </main>
        </div>
    );
}