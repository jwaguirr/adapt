"use client";

import React, { useState, useEffect } from 'react';

export default function Navbar(): React.ReactElement {
    const [activePath, setActivePath] = useState('');

    useEffect(() => {
        setActivePath(window.location.pathname);
    }, []);

    const getLinkClass = (paths: string[]): string => {
        const isActive = paths.includes(activePath);
        return `text-sm font-semibold transition-colors px-4 py-2 rounded-lg ${
            isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
        }`;
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20 border-b border-gray-200 w-full">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <a href="/" className="text-2xl font-bold text-gray-800"><span className="text-blue-600">Adapt</span></a>
                    </div>
                    <div className="flex items-center space-x-2">
                        <a 
                            href="/dashboard" 
                            className={getLinkClass(['/dashboard'])}
                        >
                            Dashboard
                        </a>
                        <a 
                            href="/analytics" 
                            className={getLinkClass(['/analytics'])}
                        >
                            Analytics
                        </a>
                        <a 
                            href="/flashcards" 
                            className={getLinkClass(['/flashcards'])}
                        >
                            Flashcards
                        </a>
                        <a 
                            href="/dialogue-duel" 
                            className={getLinkClass(['/dialogue-duel'])}
                        >
                            Dialogue Duel
                        </a>
                        <a 
                            href="/replay-conversation" 
                            className={getLinkClass(['/replay-conversation'])}
                        >
                            Conversation Replay
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    );
};