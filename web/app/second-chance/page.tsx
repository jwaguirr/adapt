"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play, Mic, Square, Ear, Rewind, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://myynwsmgvnrpekpzvhkp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type GameState = 'LOADING' | 'TIMELINE' | 'REPLAY' | 'PHRASE_BUILDER' | 'REHEARSAL' | 'PERFORMANCE' | 'FINAL_CUT' | 'FEEDBACK';
type WordBlock = { id: number; text: string; category: string; };
type Conversation = { speaker: string; text: string; }[];
type PhraseBlocks = WordBlock[]; // Updated to be a single array
type TimelineEvent = {
    id: number;
    time: string;
    description: string;
    originalPhrase: string;
    context: Conversation;
    phraseBlocks: PhraseBlocks;
    feedback: {
        excellent: string;
        interesting: string;
    };
};

const Navbar = () => {
    const [activePath, setActivePath] = useState('');
    useEffect(() => {
        setActivePath(window.location.pathname);
    }, []);
    const getLinkClass = (paths: string[]) => {
        const isActive = paths.includes(activePath);
        return `text-sm font-semibold transition-colors px-4 py-2 rounded-lg ${
            isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-900 hover:bg-gray-100'
        }`;
    };
    return (
        <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20 border-b border-gray-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <a href="/" className="text-2xl font-bold text-black">Lingo<span className="text-blue-600">Games</span></a>
                    </div>
                    <div className="flex items-center space-x-2">
                        <a href="/" className={getLinkClass(['/', '/dashboard'])}>Phrases</a>
                        <a href="/flashcards" className={getLinkClass(['/flashcards'])}>Flashcards</a>
                        <a href="/dialogue-duel" className={getLinkClass(['/dialogue-duel'])}>Dialogue Duel</a>
                        <a href="/second-chance" className={getLinkClass(['/second-chance'])}>Second Chance</a>
                    </div>
                </div>
            </div>
        </nav>
    );
};

const TimelineView = ({ onSelectEvent, timelineData }: { onSelectEvent: (event: TimelineEvent) => void; timelineData: TimelineEvent[] }) => {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-6 text-black">Your Day's Timeline</h2>
            <p className="mb-4 text-gray-900">Select a moment to get a second chance.</p>
            <div className="space-y-4">
                {timelineData.length > 0 ? (
                    timelineData.map((event) => (
                        <div
                            key={event.id}
                            onClick={() => {
                                onSelectEvent(event);
                            }}
                            className="flex items-center p-4 bg-white rounded-lg shadow-md border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex-shrink-0 w-24 text-sm font-semibold text-blue-600">
                                {event.time}
                            </div>
                            <div className="flex-1 ml-4 text-left">
                                <h3 className="font-semibold text-lg text-black">{event.description}</h3>
                                <p className="text-sm text-gray-600">Revisit this conversation</p>
                            </div>
                            <Play className="text-blue-500 hover:text-blue-700" size={24} />
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 py-10">
                        <p>No timeline data found. Check your Supabase table.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const PhraseBuilderView = ({
    selectedEvent,
    builtPhrase,
    handleAddToPhrase,
    handleResetPhrase,
    onLockInPhrase,
    onBackToTimeline
}: {
    selectedEvent: TimelineEvent;
    builtPhrase: WordBlock[];
    handleAddToPhrase: (block: WordBlock) => void;
    handleResetPhrase: () => void;
    onLockInPhrase: () => void;
    onBackToTimeline: () => void;
}) => {
    const constructedText = builtPhrase.map(b => b.text).join(' ');
    const isPhraseComplete = builtPhrase.length > 0;

    const renderBlockButtons = (blocks: WordBlock[]) => (
        <div className="flex flex-wrap gap-2 justify-center">
            {blocks.map(block => (
                <button
                    key={block.id}
                    onClick={() => handleAddToPhrase(block)}
                    className="bg-white border-2 border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-black"
                    disabled={builtPhrase.some(b => b.id === block.id)}
                >
                    {block.text}
                </button>
            ))}
        </div>
    );

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <button onClick={onBackToTimeline} className="text-gray-600 hover:underline flex items-center">
                    <ArrowLeft size={16} className="mr-1" /> Back
                </button>
                <h2 className="text-2xl font-bold text-center text-black flex-1">The Phrase-Builder</h2>
                <div className="w-12"></div>
            </div>
            
            <p className="text-center text-gray-900 mb-6">Click the blocks in the correct order to form a new phrase.</p>
            <div className="bg-gray-100 p-4 rounded-lg min-h-[6rem] mb-4 text-center flex items-center justify-center">
                <p className="text-2xl font-semibold text-black">{constructedText || "Your new phrase will appear here..."}</p>
            </div>
            
            <h3 className="text-lg font-semibold text-black mt-6 mb-2">Phrase Blocks</h3>
            {renderBlockButtons(selectedEvent.phraseBlocks)}
            
            <div className="flex justify-center gap-4 mt-8">
                <button onClick={handleResetPhrase} className="bg-gray-200 font-semibold py-2 px-6 rounded-lg text-black">Reset</button>
                <button onClick={onLockInPhrase} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:bg-blue-300" disabled={!isPhraseComplete}>Lock In Phrase</button>
            </div>
        </div>
    );
};

export default function SecondChanceGame(): React.ReactElement {
    const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);
    const [gameState, setGameState] = useState<GameState>('LOADING');
    const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
    const [builtPhrase, setBuiltPhrase] = useState<WordBlock[]>([]);
    const [isRehearsing, setIsRehearsing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [userAudio, setUserAudio] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string>('');
    const [isGeneratingFinalCut, setIsGeneratingFinalCut] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const getGeminiResponse = async (
        originalPhrase: string,
        constructedPhrase: string,
        context: Conversation,
        geminiApiKey: string
    ): Promise<string> => {
        const prompt = `
        You are an AI language coach named "Gemini Coach". Your task is to provide nuanced feedback on a user's choice of a new phrase.

        Here is the original conversation context:
        ${context.map(line => `${line.speaker}: ${line.text}`).join('\n')}

        The original phrase that was spoken was: "${originalPhrase}".

        The user's new, constructed phrase is: "${constructedPhrase}".

        Analyze the user's new phrase. Compare it to the original. Provide a rating out of 10. The analysis should be insightful and helpful, focusing on tone, formality, and linguistic effectiveness.

        Use a conversational and encouraging tone. Your response should be direct and to the point. Start your response with a rating (e.g., "Rating: 9/10.").
        `;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
        const payload = { contents: [{ parts: [{ text: prompt }] }] };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                console.error("API Error:", response.status, await response.text());
                return "Sorry, I encountered an error. Please check the API key and try again.";
            }
            const result = await response.json();
            return result.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
        } catch (error) {
            console.error("Network or other error:", error);
            return "There was an issue connecting to the AI service.";
        }
    };
    
    const getPhraseBlocks = async (
    originalPhrase: string,
    geminiApiKey: string
): Promise<WordBlock[]> => {
    const prompt = `
        You are an expert linguistic analyst. Your task is to generate a single list of phrase blocks for a language learning game. The user needs to construct a grammatically correct and coherent sentence from these blocks.

        1.  **Analyze the Original Phrase**: The original phrase is: "${originalPhrase}".
        2.  **Generate a Solution Sentence**: Your primary goal is to first internally generate a single, complete sentence that is a compelling, high-quality alternative to the original phrase. This sentence should improve upon the original for clarity, tone, or emotional impact.
        3.  **Create Correct Blocks**: Break down your generated solution sentence into 3-5 short, logical phrase blocks. These blocks should be grammatically sound fragments that, when combined in the correct order, form the complete sentence.
        4.  **Create Incorrect Blocks**: Generate 3-5 additional phrase blocks that are linguistically related to the correct blocks (e.g., they might be incorrect verb tenses, awkward phrasings, or unrelated but plausible words). These blocks should be designed to be convincing distractions but will not form the correct solution sentence. They should not contain the original phrase or any of the correct blocks.
        5.  **Combine and Output**: Combine the correct and incorrect blocks into a single JSON array named "phraseBlocks". The total number of blocks should be between 6 and 10.
        6.  **Avoid Punctuation**: Do NOT include any punctuation in the generated blocks (e.g., no periods, commas, or question marks).
        7.  **Final Output**: The final output must be a single, valid JSON object with the "phraseBlocks" array. Do not include any other text or explanation.

        **Example for the phrase "hit the nail on the head":**
        \`\`\`json
        {
          "phraseBlocks": [
            "Your analysis was",
            "the problem",
            "insightful and",
            "he hit it",
            "capture the essence",
            "on the top"
          ]
        }
        \`\`\`
    `;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("API Error:", response.status, await response.text());
            return [];
        }

        const result = await response.json();
        let jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        jsonText = jsonText.replace(/```json\n?|```/g, '');

        const blocks = JSON.parse(jsonText);

        return blocks.phraseBlocks.map((text: string, index: number) => ({ id: index + 1, text, category: "all" }));

    } catch (error) {
        console.error("Network or other error:", error);
        return [];
    }
};
    
    useEffect(() => {
        const fetchTimelineData = async () => {
            try {
                const { data, error } = await supabase
                    .from('Data')
                    .select('phrase, context, created_at')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                
                const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;

                const formattedData: TimelineEvent[] = await Promise.all(data.map(async (row, index) => {
                    const originalPhrase = row.phrase;
                    const fullText = row.context;
                    
                    const sentences: string[] = fullText.split(/(?<=[.?!])\s+/).filter((s: string) => s.trim() !== '');
                    const phraseIndex = sentences.findIndex((s: string) => s.includes(originalPhrase));

                    let parsedContext: Conversation = [];

                    if (phraseIndex !== -1) {
                        for (let i = 0; i < phraseIndex; i++) {
                            parsedContext.push({ speaker: 'Speaker A', text: sentences[i].trim() });
                        }

                        parsedContext.push({ speaker: 'You', text: sentences[phraseIndex].trim() });
                        
                        for (let i = phraseIndex + 1; i < sentences.length; i++) {
                            parsedContext.push({ speaker: 'Speaker B', text: sentences[i].trim() });
                        }
                    } else {
                        parsedContext = [
                            { speaker: 'Speaker A', text: 'An unexpected conversation occurred.' },
                            { speaker: 'You', text: originalPhrase },
                            { speaker: 'Speaker B', text: 'This moment is a little fuzzy.' }
                        ];
                    }

                    const phraseBlocks = await getPhraseBlocks(originalPhrase, geminiApiKey);

                    return {
                        id: index + 1,
                        time: new Date(row.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                        description: `Moment at ${new Date(row.created_at).toLocaleTimeString()}`,
                        originalPhrase: originalPhrase,
                        context: parsedContext,
                        phraseBlocks: phraseBlocks,
                        feedback: {
                            excellent: `Excellent alternative! '${row.phrase}' is a perfect substitute. It maintains the professional but frustrated tone of the original conversation. This would have been a great thing to say. 10/10.`,
                            interesting: "Interesting choice! 'That's a bummer' is grammatically correct, but it might have sounded a little too casual for this meeting. It's a better fit for social situations. 6/10.",
                        }
                    };
                }));

                setTimelineData(formattedData);
                setGameState('TIMELINE');
            } catch (err) {
                console.error("Error fetching or processing data from Supabase:", err);
                setGameState('TIMELINE'); 
            }
        };

        const keyFromEnv = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
        if (keyFromEnv) {
            setApiKey(keyFromEnv);
        }

        fetchTimelineData();
    }, []);

    const constructedText = builtPhrase.map(b => b.text).join(' ');

    const handleAddToPhrase = (block: WordBlock) => {
        if (!builtPhrase.some(b => b.id === block.id)) {
            setBuiltPhrase([...builtPhrase, block]);
        }
    };

    const handleResetPhrase = () => {
        setBuiltPhrase([]);
    };

    const handleSelectEvent = (event: TimelineEvent) => {
        setSelectedEvent(event);
        setGameState('REPLAY');
    };
    
    const handleRehearse = async () => {
        if (!constructedText || isRehearsing || !apiKey) return;
        setIsRehearsing(true);
        const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
        const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
                body: JSON.stringify({ text: constructedText, model_id: 'eleven_monolingual_v1' }),
            });
            if (!response.ok) throw new Error(`ElevenLabs TTS Error: ${await response.text()}`);
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
            audio.onended = () => setIsRehearsing(false);
        } catch (error) {
            console.error("Error with ElevenLabs TTS:", error);
            alert("Sorry, the rehearsal audio couldn't be generated.");
            setIsRehearsing(false);
        }
    };

    const handlePerformance = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;
                const audioChunks: Blob[] = [];
                recorder.ondataavailable = (event) => audioChunks.push(event.data);
                recorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    setUserAudio(audioUrl);
                    setGameState('FINAL_CUT');
                };
                recorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Microphone access denied:", err);
                alert("Microphone access is required. Please allow access and try again.");
            }
        }
    };

    const handlePlayFinalCut = async () => {
        if (!userAudio || !apiKey || isGeneratingFinalCut || !selectedEvent) return;
        setIsGeneratingFinalCut(true);

        const TARGET_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

        try {
            const userPerformanceAudio = new Audio(userAudio);
            
            const otherLines = selectedEvent.context
                .filter(conv => conv.speaker !== 'You')
                .map(conv => conv.text);
            
            const otherAudioUrls = [];
            for (const line of otherLines) {
                const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${TARGET_VOICE_ID}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
                    body: JSON.stringify({ text: line, model_id: 'eleven_monolingual_v1' }),
                });
                if (!res.ok) throw new Error(`ElevenLabs TTS Error: ${await res.text()}`);
                const blob = await res.blob();
                otherAudioUrls.push(URL.createObjectURL(blob));
            }

            const playAudioSequence = async (audios: HTMLAudioElement[], index: number) => {
                if (index >= audios.length) {
                    const constructedText = builtPhrase.map(b => b.text).join(' ');
                    const geminiFeedback = await getGeminiResponse(
                        selectedEvent.originalPhrase,
                        constructedText,
                        selectedEvent.context,
                        process.env.NEXT_PUBLIC_GEMINI_API_KEY as string
                    );
                    setFeedback(geminiFeedback);
                    setIsGeneratingFinalCut(false);
                    setGameState('FEEDBACK');
                    return;
                }
                audios[index].play();
                audios[index].onended = () => {
                    playAudioSequence(audios, index + 1);
                };
            };
            
            const allAudios = [];
            const userLineIndex = selectedEvent.context.findIndex(c => c.speaker === 'You');
            let otherIndex = 0;
            for (let i = 0; i < selectedEvent.context.length; i++) {
                if (i === userLineIndex) {
                    allAudios.push(userPerformanceAudio);
                } else {
                    allAudios.push(new Audio(otherAudioUrls[otherIndex]));
                    otherIndex++;
                }
            }
            playAudioSequence(allAudios, 0);

        } catch (error) {
            console.error("Error with ElevenLabs STS:", error);
            alert("Sorry, the final cut couldn't be generated.");
            setIsGeneratingFinalCut(false);
        }
    };
    
    const renderGameState = () => {
        switch (gameState) {
            case 'LOADING':
                return (
                    <div className="text-center">
                        <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
                        <p className="mt-4 text-gray-900">Loading your timeline...</p>
                    </div>
                );
            case 'TIMELINE':
                return <TimelineView onSelectEvent={handleSelectEvent} timelineData={timelineData} />;
            case 'REPLAY':
                if (!selectedEvent) return <p>Error: No event selected.</p>;
                return (
                    <div className="text-center">
                        <div className="mb-4 flex items-center justify-between">
                            <button onClick={() => setGameState('TIMELINE')} className="text-gray-600 hover:underline flex items-center">
                                <ArrowLeft size={16} className="mr-1" /> Back
                            </button>
                            <h2 className="text-2xl font-bold text-center text-black flex-1">The Replay</h2>
                            <div className="w-12"></div>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg text-left space-y-2 mb-6 text-gray-900">
                             {selectedEvent.context.map((line, index) => (
                                <p key={index} className={line.speaker === 'You' ? "bg-yellow-200 p-2 rounded" : ""}>
                                    <span className="font-bold">{line.speaker}:</span> {line.text}
                                </p>
                            ))}
                        </div>
                        <p className="mb-6 text-gray-900">The original phrase was "<span className="font-semibold">{selectedEvent.originalPhrase}</span>." Let's build a better one.</p>
                        <button onClick={() => setGameState('PHRASE_BUILDER')} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">Start Building</button>
                    </div>
                );
            case 'PHRASE_BUILDER':
                if (!selectedEvent) return <p>Error: No event selected.</p>;
                return (
                    <PhraseBuilderView
                        selectedEvent={selectedEvent}
                        builtPhrase={builtPhrase}
                        handleAddToPhrase={handleAddToPhrase}
                        handleResetPhrase={handleResetPhrase}
                        onLockInPhrase={() => setGameState('REHEARSAL')}
                        onBackToTimeline={() => setGameState('TIMELINE')}
                    />
                );
            case 'REHEARSAL':
            case 'PERFORMANCE':
            case 'FINAL_CUT':
                if (!selectedEvent) return <p>Error: No event selected.</p>;
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-center text-black">The Performance Round</h2>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg text-center mb-6">
                            <p className="text-2xl font-semibold text-blue-900">"{constructedText}"</p>
                        </div>
                        <div className="text-center mb-8">
                            <h3 className="font-bold text-lg mb-2 text-black">Step 1: Rehearse It</h3>
                            <p className="text-gray-900 mb-3">Hear how it sounds with realistic AI voice.</p>
                            <button onClick={handleRehearse} disabled={isRehearsing} className="bg-gray-700 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center mx-auto w-48">
                                <Ear className="mr-2"/> {isRehearsing ? 'Listening...' : 'Rehearse'}
                            </button>
                        </div>
                        <div className="text-center mb-8">
                            <h3 className="font-bold text-lg mb-2 text-black">Step 2: Perform It</h3>
                            <p className="text-gray-900 mb-3">Now, it's your turn. Say the phrase out loud.</p>
                            <button onClick={handlePerformance} className={`${isRecording ? 'bg-red-600' : 'bg-green-600'} text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center mx-auto w-48`}>
                                {isRecording ? <><Square className="mr-2"/> Stop</> : <><Mic className="mr-2"/> Perform</>}
                            </button>
                        </div>
                        {gameState === 'FINAL_CUT' && userAudio && (
                            <div className="text-center p-4 border-t-2 mt-4">
                                <h3 className="font-bold text-lg mb-2 text-black">Step 3: Hear the Final Cut</h3>
                                <p className="text-gray-900 mb-3">Listen to the conversation with your voice dubbed in!</p>
                                <button onClick={handlePlayFinalCut} disabled={isGeneratingFinalCut} className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center mx-auto w-48 disabled:bg-purple-300">
                                    {isGeneratingFinalCut ? <Loader2 className="mr-2 animate-spin"/> : <Play className="mr-2"/>}
                                    {isGeneratingFinalCut ? 'Generating...' : 'Play Final Cut'}
                                </button>
                            </div>
                        )}
                        <div className="text-center mt-8">
                            <button onClick={() => { setGameState('TIMELINE'); setBuiltPhrase([]); setUserAudio(null); setSelectedEvent(null); }} className="text-sm text-gray-800 hover:underline"><Rewind className="inline mr-1" size={16}/> Start Over</button>
                        </div>
                    </div>
                );
            case 'FEEDBACK':
                return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4 text-black">AI Coach Feedback</h2>
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg text-left mb-6">
                            <p className="text-lg text-green-900 font-semibold">{feedback}</p>
                        </div>
                        <p className="mb-6 text-gray-900">How did it feel to perform your new phrase?</p>
                        <button onClick={() => { setGameState('TIMELINE'); setBuiltPhrase([]); setUserAudio(null); setSelectedEvent(null); setFeedback(null); }} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">Play Again</button>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
            <Navbar />
            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg border">
                    {renderGameState()}
                </div>
            </main>
        </div>
    );
}