"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play, Mic, Square, Ear, Rewind, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';

const supabaseUrl = 'https://myynwsmgvnrpekpzvhkp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type GameState = 'LOADING' | 'TIMELINE' | 'REPLAY' | 'INPUT' | 'REHEARSAL' | 'PERFORMANCE' | 'FINAL_CUT' | 'FEEDBACK';
type Conversation = { speaker: string; text: string; }[];
type TimelineEvent = {
    id: number;
    time: string;
    description: string;
    originalPhrase: string;
    context: Conversation;
};

const TimelineView = ({ onSelectEvent, timelineData }: { onSelectEvent: (event: TimelineEvent) => void; timelineData: TimelineEvent[] }) => {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-6 text-black">Your Day's Timeline</h2>
            <p className="mb-4 text-gray-900">Select an encounter to replay the conversation.</p>
            <div className="space-y-4">
                {timelineData.length > 0 ? (
                    timelineData.map((event) => (
                        <div
                            key={event.id}
                            onClick={() => onSelectEvent(event)}
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
                        <p>No encounters found. Add some to your collection to play.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const InputView = ({
    context,
    onPhraseSubmit,
    onBackToTimeline
}: {
    context: Conversation;
    onPhraseSubmit: (newPhrase: string) => void;
    onBackToTimeline: () => void;
}) => {
    const [userInput, setUserInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userInput.trim()) {
            onPhraseSubmit(userInput.trim());
        }
    };

    const contextToShow = context.filter(line => line.speaker !== 'You');

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <button onClick={onBackToTimeline} className="text-gray-600 hover:underline flex items-center">
                    <ArrowLeft size={16} className="mr-1" /> Back
                </button>
                <h2 className="text-2xl font-bold text-center text-black flex-1">Your Second Chance</h2>
                <div className="w-20"></div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg text-left space-y-2 mb-6 text-gray-900">
                {contextToShow.map((line, index) => (
                    <p key={index}>
                        <span className="font-bold">{line.speaker}:</span> {line.text}
                    </p>
                ))}
            </div>
            
            <p className="text-center text-gray-900 mb-4">What should you have said here?</p>
            
            <form onSubmit={handleSubmit} className="flex flex-col text-black items-center gap-4">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your new phrase here..."
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                />
                <button 
                    type="submit" 
                    className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:bg-blue-300"
                    disabled={!userInput.trim()}
                >
                    Lock In Phrase
                </button>
            </form>
        </div>
    );
};


export default function SecondChanceGame(): React.ReactElement {
    const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);
    const [gameState, setGameState] = useState<GameState>('LOADING');
    const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
    const [userTypedPhrase, setUserTypedPhrase] = useState('');
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
        const fullContextText = context.map(line => `${line.speaker}: ${line.text}`).join('\n');
        const prompt = `
        You are an AI language coach. Analyze a user's new phrase in the context of a conversation.
        Original Context:
        ${fullContextText}
        The original phrase spoken by "You" was: "${originalPhrase}"
        The user's new phrase is: "${constructedPhrase}"
        Provide a rating out of 10 and brief, insightful feedback on the new phrase's tone, formality, and effectiveness compared to the original. Start with the rating (e.g., "Rating: 9/10.").`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) {
                // Better error logging to see the actual API response
                console.error("API Error:", response.status, await response.text());
                return "Sorry, I encountered an error. Please check the API key and try again.";
            }
            const result = await response.json();
            
            // Handle cases where the API returns OK but no content (e.g., safety filters)
            if (!result.candidates || result.candidates.length === 0) {
                console.warn("Gemini API returned no candidates. This might be due to safety filters.");
                return "The AI could not generate a response, possibly due to safety settings.";
            }

            return result.candidates[0]?.content?.parts?.[0]?.text || "Could not generate feedback.";
        } catch (error) {
            console.error("Gemini API network error:", error);
            return "There was an issue connecting to the AI service.";
        }
    };
    
    useEffect(() => {
        const fetchTimelineData = async () => {
            try {
                // Fetch encounters and join with the related term
                const { data, error } = await supabase
                    .from('Encounter')
                    .select('id, created_at, context, location, Term(term)')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const formattedData: TimelineEvent[] = data
                    .map((encounter: any) => {
                        // Safely access term, whether it's an object or array of one
                        const termData = Array.isArray(encounter.Term) ? encounter.Term[0] : encounter.Term;
                        const originalPhrase = termData?.term;

                        if (!originalPhrase) {
                            console.warn("Encounter is missing a term and will be skipped:", encounter.id);
                            return null;
                        }

                        const fullContext = encounter.context;
                        
                        // Use a more robust regex to split sentences, even without spaces after punctuation.
                        const sentences = fullContext.split(/(?<=[.?!])\s*/).filter(Boolean);
                        
                        // Add explicit types to parameters to fix TypeScript error
                        const parsedContext: Conversation = sentences.map((sentence: string, index: number) => {
                            const speaker = (index === sentences.length - 1) ? 'You' : 'Speaker A';
                            return { speaker, text: sentence.trim() };
                        });

                        return {
                            id: encounter.id,
                            time: new Date(encounter.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                            description: `Encounter at ${encounter.location || 'Unknown Location'}`,
                            originalPhrase: originalPhrase,
                            context: parsedContext,
                        };
                    })
                    .filter((event): event is TimelineEvent => event !== null); // Use a type guard to filter out nulls

                setTimelineData(formattedData);
                setGameState('TIMELINE');
            } catch (err) {
                console.error("Error fetching data from Supabase:", err);
                setGameState('TIMELINE'); 
            }
        };

        const keyFromEnv = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
        if (keyFromEnv) setApiKey(keyFromEnv);
        fetchTimelineData();
    }, []);

    const handleSelectEvent = (event: TimelineEvent) => {
        setSelectedEvent(event);
        setGameState('REPLAY');
    };
    
    const handleRehearse = async () => {
        if (!userTypedPhrase || isRehearsing || !apiKey) return;
        setIsRehearsing(true);
        const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
        const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
                body: JSON.stringify({ text: userTypedPhrase, model_id: 'eleven_monolingual_v1' }),
            });
            if (!response.ok) throw new Error(`ElevenLabs TTS Error: ${await response.text()}`);
            const audioBlob = await response.blob();
            const audio = new Audio(URL.createObjectURL(audioBlob));
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
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;
                const audioChunks: Blob[] = [];
                recorder.ondataavailable = (event) => audioChunks.push(event.data);
                recorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    setUserAudio(URL.createObjectURL(audioBlob));
                    setGameState('FINAL_CUT');
                };
                recorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Microphone access denied:", err);
                alert("Microphone access is required. Please allow access and try again.");
            }
        }
        setIsRecording(!isRecording);
    };

    const findTermIdByPhrase = async (phrase: string): Promise<number | null> => {
        const { data, error } = await supabase.from('Term').select('id').eq('term', phrase).single();
        if (error) { console.error('Could not find term_id:', error); return null; }
        return data.id;
    };

    const handlePlayFinalCut = async () => {
        if (!userAudio || !apiKey || isGeneratingFinalCut || !selectedEvent) return;
        setIsGeneratingFinalCut(true);

        try {
            const otherLines = selectedEvent.context.filter(line => line.speaker !== 'You').map(line => line.text);
            
            const otherAudioUrls = await Promise.all(otherLines.map(async line => {
                const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
                    body: JSON.stringify({ text: line, model_id: 'eleven_monolingual_v1' }),
                });
                if (!res.ok) throw new Error(`ElevenLabs TTS Error: ${await res.text()}`);
                const blob = await res.blob();
                return URL.createObjectURL(blob);
            }));

            const finalAudioSequence = selectedEvent.context.map(line => {
                if (line.speaker === 'You') return new Audio(userAudio);
                const otherLineIndex = selectedEvent.context.filter(l => l.speaker !== 'You' && selectedEvent.context.indexOf(l) < selectedEvent.context.indexOf(line)).length;
                return new Audio(otherAudioUrls[otherLineIndex]);
            });

            const playAudioSequence = (index: number) => {
                if (index >= finalAudioSequence.length) {
                    (async () => {
                        const geminiFeedback = await getGeminiResponse(
                            selectedEvent.originalPhrase, userTypedPhrase, selectedEvent.context, process.env.NEXT_PUBLIC_GEMINI_API_KEY as string
                        );
                        setFeedback(geminiFeedback);
                        const ratingMatch = geminiFeedback.match(/Rating:\s*(\d{1,2})\/10/);
                        const score = ratingMatch ? parseInt(ratingMatch[1], 10) : null;
                        const termId = await findTermIdByPhrase(selectedEvent.originalPhrase);
                        if (termId) {
                            await supabase.from('PracticeLog').insert({
                                term_id: termId, game: 'SecondChance', event_type: 'phrase_rebuilt', score,
                                metadata: { original_phrase: selectedEvent.originalPhrase, new_phrase: userTypedPhrase }
                            });
                        }
                        setIsGeneratingFinalCut(false);
                        setGameState('FEEDBACK');
                    })();
                    return;
                }
                const audio = finalAudioSequence[index];
                audio.play();
                audio.onended = () => playAudioSequence(index + 1);
            };

            playAudioSequence(0);

        } catch (error) {
            console.error("Error generating final cut:", error);
            alert("Sorry, the final cut couldn't be generated.");
            setIsGeneratingFinalCut(false);
        }
    };
    
    const resetGame = () => {
        setGameState('TIMELINE');
        setSelectedEvent(null);
        setUserTypedPhrase('');
        setUserAudio(null);
        setFeedback(null);
    };
    
    const renderGameState = () => {
        switch (gameState) {
            case 'LOADING': return <div className="text-center"><Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" /><p className="mt-4 text-gray-900">Loading your timeline...</p></div>;
            case 'TIMELINE': return <TimelineView onSelectEvent={handleSelectEvent} timelineData={timelineData} />;
            case 'REPLAY':
                if (!selectedEvent) return null;
                return (
                    <div className="text-center">
                        <div className="mb-4 flex items-center justify-between"><button onClick={resetGame} className="text-gray-600 hover:underline flex items-center"><ArrowLeft size={16} className="mr-1" /> Back</button><h2 className="text-2xl font-bold text-center text-black flex-1">The Replay</h2><div className="w-12"></div></div>
                        <div className="bg-gray-100 p-4 rounded-lg text-left space-y-2 mb-6 text-gray-900">
                             {selectedEvent.context.map((line, index) => {
                                 if (line.speaker === 'You') {
                                     return (
                                         <p key={index}>
                                             <span className="font-bold">You:</span> <span className="bg-black text-black select-none rounded px-1">
                                                 {line.text}
                                             </span>
                                         </p>
                                     )
                                 }
                                 return (<p key={index}><span className="font-bold">{line.speaker}:</span> {line.text}</p>)
                             })}
                        </div>
                        <p className="mb-6 text-gray-900">Your original response has been hidden. Try to come up with an appropriate phrase to fit the conversation.</p>
                        <button onClick={() => setGameState('INPUT')} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">Create Phrase</button>
                    </div>
                );
            case 'INPUT':
                if (!selectedEvent) return null;
                return <InputView 
                    context={selectedEvent.context}
                    onBackToTimeline={resetGame}
                    onPhraseSubmit={(phrase) => {
                        setUserTypedPhrase(phrase);
                        setGameState('REHEARSAL');
                    }}
                />;
            case 'REHEARSAL':
            case 'PERFORMANCE':
            case 'FINAL_CUT':
                if (!selectedEvent) return null;
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-center text-black">The Performance Round</h2>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg text-center mb-6"><p className="text-2xl font-semibold text-blue-900">"{userTypedPhrase}"</p></div>
                        <div className="text-center mb-8"><h3 className="font-bold text-lg mb-2 text-black">Step 1: Rehearse It</h3><p className="text-gray-900 mb-3">Hear how it sounds.</p><button onClick={handleRehearse} disabled={isRehearsing} className="bg-gray-700 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center mx-auto w-48"><Ear className="mr-2"/> {isRehearsing ? 'Listening...' : 'Rehearse'}</button></div>
                        <div className="text-center mb-8"><h3 className="font-bold text-lg mb-2 text-black">Step 2: Perform It</h3><p className="text-gray-900 mb-3">Now, it's your turn. Say the phrase out loud.</p><button onClick={handlePerformance} className={`${isRecording ? 'bg-red-600' : 'bg-green-600'} text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center mx-auto w-48`}>{isRecording ? <><Square className="mr-2"/> Stop</> : <><Mic className="mr-2"/> Perform</>}</button></div>
                        {gameState === 'FINAL_CUT' && userAudio && (<div className="text-center p-4 border-t-2 mt-4"><h3 className="font-bold text-lg mb-2 text-black">Step 3: Hear the Final Cut</h3><p className="text-gray-900 mb-3">Listen to the conversation with your voice dubbed in!</p><button onClick={handlePlayFinalCut} disabled={isGeneratingFinalCut} className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center mx-auto w-48 disabled:bg-purple-300">{isGeneratingFinalCut ? <Loader2 className="mr-2 animate-spin"/> : <Play className="mr-2"/>} {isGeneratingFinalCut ? 'Playing...' : 'Play Final Cut'}</button></div>)}
                        <div className="text-center mt-8"><button onClick={resetGame} className="text-sm text-gray-800 hover:underline"><Rewind className="inline mr-1" size={16}/> Start Over</button></div>
                    </div>
                );
            case 'FEEDBACK':
                if (!selectedEvent) return null;
                return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4 text-black">AI Coach Feedback</h2>
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg text-left mb-6"><p className="text-lg text-green-900 font-semibold">{feedback}</p></div>
                        <div className="text-left bg-gray-50 p-4 rounded-lg space-y-2 mb-6">
                             <div><p className="text-sm font-semibold text-gray-600">YOUR NEW PHRASE</p><p className="text-lg text-blue-600 font-semibold">"{userTypedPhrase}"</p></div>
                             <div><p className="text-sm font-semibold text-gray-600">ORIGINAL PHRASE</p><p className="text-lg text-gray-800">"{selectedEvent.originalPhrase}"</p></div>
                        </div>
                        <button onClick={resetGame} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">Play Again</button>
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