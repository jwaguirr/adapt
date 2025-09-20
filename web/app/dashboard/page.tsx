'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ArrowDownAZ, History, Play, Languages, BookOpen } from 'lucide-react'; // Import new icons
import { createClient } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';

interface PhraseCard {
    id: number;
    phrase: string;
    context: string;
    translation: string;
    location: string;
    created_at: string;
}

const supabaseUrl = 'https://myynwsmgvnrpekpzvhkp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type SortOrder = 'recent' | 'alphabetical';
type DisplayMode = 'context' | 'translation';

export default function Dashboard(): React.ReactElement {
    const [phrases, setPhrases] = useState<PhraseCard[]>([]);
    const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
    const [displayMode, setDisplayMode] = useState<DisplayMode>('translation');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchPhrases = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('Data').select('*');

            if (error) {
                console.error('Error fetching phrases:', error);
            } else if (data) {
                setPhrases(data);
            }
            setLoading(false);
        };

        fetchPhrases();
    }, []);

    const sortedPhrases = useMemo(() => {
        const sorted = [...phrases];
        if (sortOrder === 'recent') {
            sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (sortOrder === 'alphabetical') {
            sorted.sort((a, b) => a.phrase.localeCompare(b.phrase));
        }
        return sorted;
    }, [phrases, sortOrder]);

    const getButtonClass = (order: SortOrder | DisplayMode) => {
        const isSelected = (sortOrder === order) || (displayMode === order);
        return isSelected ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-100';
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar />

            <main>
                <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                    <header className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
                        <p className="text-lg text-gray-600 mt-2">Your collection of phrases and their translations and real-world context.</p>
                    </header>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setSortOrder('recent')}
                                className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-colors border ${getButtonClass('recent')}`}
                            >
                                <History size={16} className="mr-2" />
                                Most Recent
                            </button>
                            <button
                                onClick={() => setSortOrder('alphabetical')}
                                className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-colors border ${getButtonClass('alphabetical')}`}
                            >
                                <ArrowDownAZ size={16} className="mr-2" />
                                Alphabetical
                            </button>
                        </div>
                        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                            <button
                                onClick={() => setDisplayMode('translation')}
                                className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-colors border ${getButtonClass('translation')}`}
                            >
                                <Languages size={16} className="mr-2" />
                                Show Translations
                            </button>
                            <button
                                onClick={() => setDisplayMode('context')}
                                className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-colors border ${getButtonClass('context')}`}
                            >
                                <BookOpen size={16} className="mr-2" />
                                Show Context
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center text-gray-500">Loading phrases...</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2">
                                <h3 className="col-span-12 md:col-span-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Phrase</h3>
                                <h3 className="col-span-12 md:col-span-8 text-sm font-bold text-gray-500 uppercase tracking-wider">
                                    {displayMode === 'context' ? 'Context' : 'Translation'}
                                </h3>
                            </div>
                            {sortedPhrases.map((card) => (
                                <div key={card.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 p-4 sm:p-6">
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-12 md:col-span-4">
                                            <p className="font-semibold text-lg text-gray-900">{card.phrase}</p>
                                        </div>
                                        <div className="col-span-12 md:col-span-8">
                                            <p className="text-gray-700 leading-relaxed">
                                                {displayMode === 'context' ? card.context : card.translation}
                                            </p>
                                        </div>
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
