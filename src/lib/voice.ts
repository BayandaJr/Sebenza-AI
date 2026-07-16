import { useCallback, useEffect, useRef, useState } from "react";

// Minimal Web Speech API types
type SpeechRecognitionResult = {
  0: { transcript: string };
  isFinal: boolean;
};
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResult };
};
type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognitionCtor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const recRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    setSupported(!!getRecognitionCtor());
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      if (finalText) setTranscript((prev) => (prev ? prev + " " : "") + finalText.trim());
      setInterim(interimText);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setInterim("");
    rec.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setInterim("");
  }, []);

  return { supported, listening, transcript, interim, start, stop, reset };
}

export function speak(text: string, opts?: { rate?: number; pitch?: number }) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts?.rate ?? 1;
  u.pitch = opts?.pitch ?? 1;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
}

export function classifyVoiceCommand(text: string): "email" | "task" | "research" | "meeting" | "general" {
  const t = text.toLowerCase();
  if (/\b(email|write to|reply to|message)\b/.test(t)) return "email";
  if (/\b(task|todo|plan|remind me|schedule)\b/.test(t)) return "task";
  if (/\b(research|find out|look up|investigate)\b/.test(t)) return "research";
  if (/\b(meeting|summari[sz]e|notes|minutes)\b/.test(t)) return "meeting";
  return "general";
}
