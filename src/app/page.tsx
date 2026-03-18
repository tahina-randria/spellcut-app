"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  CheckCircle,
  UploadSimple,
  FileVideo,
  SpinnerGap,
  Warning,
  ArrowRight,
  DownloadSimple,
  X,
  Play,
  Cursor,
  Eye,
  Export,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
// GSAP available for future interactive animations
// import gsap from "gsap";

/* ──────────────────────────────── Types ──────────────────────────────── */

type AnalysisStatus = "idle" | "uploading" | "analyzing" | "done" | "error";

interface SpellError {
  timecode: string;
  seconds: number;
  word: string;
  correction: string;
  type: string;
  confidence: number;
  confidence_level: string;
  explanation: string;
  context: string;
}

interface AnalysisResult {
  total_errors: number;
  high_confidence_errors: number;
  medium_confidence_errors: number;
  processing_time_seconds: number;
  errors: SpellError[];
  video_info?: { duration: number; resolution: string };
}

/* ────────────────────────── Premiere Pro Export ────────────────────────── */

function generatePremiereCSV(errors: SpellError[]): string {
  const header = "Marker Name\tDescription\tIn\tOut\tDuration\tMarker Type";
  const rows = errors.map((e) => {
    const tc = secondsToTimecode(e.seconds);
    return `${e.word} → ${e.correction}\t${e.explanation}\t${tc}\t${tc}\t00:00:00:01\tComment`;
  });
  return [header, ...rows].join("\n");
}

function secondsToTimecode(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const f = Math.floor((sec % 1) * 25);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ──────────────────────────────── App ──────────────────────────────── */

export default function Home() {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeError, setActiveError] = useState<number | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Create video URL when file is selected
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoUrl(null);
    }
  }, [file]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("video/")) setFile(f);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) setFile(f);
    },
    []
  );

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus("uploading");
    setProgress(10);
    setStatus("analyzing");

    // Simulated analysis with GSAP-smoothed progress
    for (const s of [
      { p: 25, d: 800 },
      { p: 50, d: 2500 },
      { p: 75, d: 2500 },
      { p: 90, d: 2000 },
      { p: 98, d: 1500 },
    ]) {
      await new Promise((r) => setTimeout(r, s.d));
      setProgress(s.p);
    }

    setResult({
      total_errors: 3,
      high_confidence_errors: 3,
      medium_confidence_errors: 0,
      processing_time_seconds: 12.4,
      video_info: { duration: 62.2, resolution: "1920x1080" },
      errors: [
        {
          timecode: "00:13",
          seconds: 13,
          word: "fond",
          correction: "fonds",
          type: "orthographe",
          confidence: 99,
          confidence_level: "high",
          explanation:
            "En finance, on \u00e9crit \u00ab fonds \u00bb (portefeuille), pas \u00ab fond \u00bb.",
          context: "G\u00e9rant de fond \u00e9mergent",
        },
        {
          timecode: "00:36",
          seconds: 36,
          word: "EMERGENTS",
          correction: "\u00c9MERGENTS",
          type: "accent",
          confidence: 100,
          confidence_level: "high",
          explanation: "Accent obligatoire sur les majuscules.",
          context: "CARMIGNAC EMERGENTS",
        },
        {
          timecode: "00:42",
          seconds: 42,
          word: "premiere",
          correction: "premi\u00e8re",
          type: "accent",
          confidence: 99,
          confidence_level: "high",
          explanation: "Accent grave obligatoire.",
          context: "Aujourd\u2019hui la premiere question",
        },
      ],
    });
    setProgress(100);
    setStatus("done");
  };

  const reset = () => {
    setStatus("idle");
    setFile(null);
    setResult(null);
    setProgress(0);
    setActiveError(null);
  };

  const seekToError = (error: SpellError, index: number) => {
    setActiveError(index);
    if (videoRef.current) {
      videoRef.current.currentTime = error.seconds;
      videoRef.current.play();
    }
  };

  const exportPremiere = () => {
    if (!result) return;
    const csv = generatePremiereCSV(result.errors);
    downloadFile(csv, "spellcut-markers.tsv", "text/tab-separated-values");
  };

  const exportJSON = () => {
    if (!result) return;
    downloadFile(
      JSON.stringify(result, null, 2),
      "spellcut-result.json",
      "application/json"
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed top-[-150px] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full blur-[160px]"
        style={{
          background:
            "radial-gradient(ellipse, oklch(1 0 0 / 5%) 0%, transparent 70%)",
        }}
      />

      {/* ── Nav ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 glass-strong animate-fade-down"
      >
        <div className="mx-auto max-w-3xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
              <span className="text-[11px] font-bold text-black tracking-tight">
                SC
              </span>
            </div>
            <span className="text-[14px] font-semibold tracking-[-0.02em] text-white">
              SpellCut
            </span>
          </div>
          {status === "done" && (
            <button
              onClick={reset}
              className="text-[12px] text-[#ccc] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-white/30"
              aria-label="Nouvelle analyse"
            >
              Nouvelle analyse
            </button>
          )}
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-3xl px-6 pt-24 pb-12">
        {/* ═══════════════ IDLE — Hero + Guide + Upload ═══════════════ */}
        {status === "idle" && (
          <>
            {/* Hero */}
            <div className="mt-16 mb-14 text-center animate-fade-up delay-1">
              <h1 className="text-[36px] font-semibold tracking-[-0.03em] leading-[1.15] text-white mb-4">
                V&eacute;rifie l&apos;orthographe
                <br />
                de ta vid&eacute;o
              </h1>
              <p className="text-[15px] text-[#ccc] max-w-md mx-auto leading-relaxed">
                Titres, sous-titres, lower thirds. Chaque texte est lu
                directement depuis les pixels de ta vid&eacute;o.
              </p>
            </div>

            {/* Guide — 3 steps */}
            <div
              className="mb-10 grid grid-cols-3 gap-4 animate-fade-up delay-2"
            >
              {[
                {
                  icon: UploadSimple,
                  step: "01",
                  label: "Drop ta vid\u00e9o",
                  sub: "MP4, MOV, jusqu\u2019\u00e0 4K",
                },
                {
                  icon: Eye,
                  step: "02",
                  label: "Analyse pixel par pixel",
                  sub: "IA vision + OCR multi-moteur",
                },
                {
                  icon: Export,
                  step: "03",
                  label: "Erreurs + timecodes",
                  sub: "Export Premiere Pro / JSON",
                },
              ].map(({ icon: Icon, step, label, sub }) => (
                <div
                  key={step}
                  className="glass-card rounded-2xl p-5 group"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center">
                      <Icon
                        size={16}
                        weight="regular"
                        className="text-white"
                      />
                    </div>
                    <span className="text-[11px] font-medium text-[#bbb] tracking-wider uppercase">
                      {step}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-white mb-0.5">
                    {label}
                  </p>
                  <p className="text-[12px] text-[#ccc]">{sub}</p>
                </div>
              ))}
            </div>

            {/* Upload zone — glassmorphism */}
            <div className="animate-fade-up delay-3">
              <div
                role="button"
                tabIndex={0}
                aria-label="Zone de d\u00e9p\u00f4t vid\u00e9o — glisse un fichier ou clique pour parcourir"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    document.getElementById("file-input")?.click();
                }}
                onClick={() =>
                  document.getElementById("file-input")?.click()
                }
                className={`group relative rounded-2xl cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111] glass-upload ${
                  dragOver ? "drag-over" : ""
                } ${file ? "p-5" : "py-16 px-8"}`}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="S\u00e9lectionner un fichier vid\u00e9o"
                />

                {file ? (
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-white/[0.08] flex items-center justify-center shrink-0">
                      <FileVideo
                        size={22}
                        weight="regular"
                        className="text-white"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-[12px] text-[#ccc]">
                        {(file.size / (1024 * 1024)).toFixed(1)} Mo
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      aria-label="Retirer le fichier"
                      className="p-2 rounded-xl hover:bg-white/[0.08] transition-colors"
                    >
                      <X size={16} className="text-[#ccc]" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mx-auto mb-5 group-hover:scale-105 transition-transform duration-300">
                      <UploadSimple
                        size={24}
                        weight="regular"
                        className="text-white"
                      />
                    </div>
                    <p className="text-[15px] font-medium text-white mb-1.5">
                      Glisse ta vid&eacute;o ici
                    </p>
                    <p className="text-[13px] text-[#ccc]">
                      ou clique pour parcourir &middot; MP4, MOV
                    </p>
                  </div>
                )}
              </div>

              {file && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={handleAnalyze}
                    className="h-11 px-7 rounded-xl gap-2.5 text-[13px] font-semibold bg-white text-black hover:bg-white/90 transition-all active:scale-[0.98]"
                  >
                    <Play size={14} weight="fill" />
                    Lancer l&apos;analyse
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══════════════ ANALYZING ═══════════════ */}
        {(status === "uploading" || status === "analyzing") && (
          <div className="mt-32 text-center">
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-6">
              <SpinnerGap
                size={28}
                weight="bold"
                className="text-white animate-spin"
              />
            </div>
            <p className="text-[16px] font-medium text-white mb-2">
              Analyse en cours
            </p>
            <p className="text-[13px] text-[#ccc] mb-10">
              {progress < 40
                ? "Extraction des frames..."
                : progress < 70
                  ? "Lecture du texte par OCR..."
                  : progress < 95
                    ? "V\u00e9rification visuelle par l\u2019IA..."
                    : "Finalisation..."}
            </p>
            <div className="max-w-[240px] mx-auto">
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-[#bbb] mt-3 font-mono">
                {progress}%
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════ RESULTS ═══════════════ */}
        {status === "done" && result && (
          <div className="mt-6 animate-fade-up delay-1">
            {/* Video player preview */}
            {videoUrl && (
              <div className="mb-8 glass-card rounded-2xl overflow-hidden">
                <div className="video-player-container">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full"
                    controls
                    playsInline
                    aria-label="Pr\u00e9visualisation de la vid\u00e9o analys\u00e9e"
                  />
                </div>
                <div className="px-4 py-3 flex items-center justify-between border-t border-white/[0.06]">
                  <p className="text-[12px] text-[#ccc]">
                    Clique sur une erreur pour aller au timecode
                  </p>
                  <Cursor size={14} className="text-[#bbb]" />
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
                  {result.total_errors} erreur
                  {result.total_errors > 1 ? "s" : ""} trouv&eacute;e
                  {result.total_errors > 1 ? "s" : ""}
                </h2>
                <p className="text-[12px] text-[#ccc] mt-1">
                  {file?.name} &middot;{" "}
                  {result.video_info?.duration.toFixed(0)}s &middot;{" "}
                  {result.processing_time_seconds.toFixed(1)}s d&apos;analyse
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportPremiere}
                  className="h-9 px-4 rounded-xl text-[12px] font-medium text-[#bbb] hover:text-white hover:bg-white/[0.06] gap-1.5"
                  aria-label="Exporter les markers pour Premiere Pro"
                >
                  <DownloadSimple size={14} />
                  Premiere Pro
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportJSON}
                  className="h-9 px-4 rounded-xl text-[12px] font-medium text-[#bbb] hover:text-white hover:bg-white/[0.06] gap-1.5"
                  aria-label="Exporter en JSON"
                >
                  <DownloadSimple size={14} />
                  JSON
                </Button>
              </div>
            </div>

            {/* Error list */}
            <div className="space-y-3">
              {result.errors.map((error, i) => (
                <button
                  key={i}
                  onClick={() => seekToError(error, i)}
                  className={`error-card w-full text-left p-5 rounded-2xl glass-card transition-all duration-200 cursor-pointer hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-white/30 ${
                    activeError === i
                      ? "ring-1 ring-white/20"
                      : ""
                  }`}
                  aria-label={`Erreur \u00e0 ${error.timecode}: ${error.word} devrait \u00eatre ${error.correction}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Timecode */}
                    <span className="shrink-0 mt-0.5 text-[11px] font-mono text-white bg-white/[0.08] px-2.5 py-1 rounded-lg">
                      {error.timecode}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-[#ff6b6b] font-semibold text-[14px] line-through decoration-[#ff6b6b]/40">
                          {error.word}
                        </span>
                        <ArrowRight
                          size={12}
                          weight="bold"
                          className="text-[#aaa]"
                        />
                        <span className="text-[#51cf66] font-semibold text-[14px]">
                          {error.correction}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#aaa] leading-relaxed">
                        {error.explanation}
                      </p>
                      <p className="text-[12px] text-[#bbb] mt-1.5">
                        &laquo;&nbsp;{error.context}&nbsp;&raquo;
                      </p>
                    </div>

                    {/* Confidence */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-[13px] font-semibold text-[#51cf66]">
                        {error.confidence}%
                      </span>
                      <span className="text-[10px] text-[#bbb] uppercase tracking-wider">
                        {error.type}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {result.total_errors === 0 && (
              <div className="text-center py-24">
                <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-5">
                  <CheckCircle
                    size={32}
                    weight="regular"
                    className="text-[#51cf66]"
                  />
                </div>
                <p className="text-[16px] font-medium text-white">
                  Aucune erreur d&eacute;tect&eacute;e
                </p>
                <p className="text-[13px] text-[#ccc] mt-2">
                  Tous les textes de ta vid&eacute;o sont corrects.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ ERROR ═══════════════ */}
        {status === "error" && (
          <div className="mt-32 text-center">
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-6">
              <Warning size={28} weight="regular" className="text-[#ff6b6b]" />
            </div>
            <p className="text-[16px] font-medium text-white mb-2">
              Erreur
            </p>
            <p className="text-[13px] text-[#ccc] mb-8">
              V&eacute;rifie ta connexion et r&eacute;essaie.
            </p>
            <Button
              variant="ghost"
              onClick={reset}
              className="rounded-xl text-[13px] text-[#ccc] hover:text-white"
            >
              R&eacute;essayer
            </Button>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-6">
        <div className="mx-auto max-w-3xl px-6 flex items-center justify-between">
          <p className="text-[11px] text-[#aaa]">
            &copy; {new Date().getFullYear()} SpellCut
          </p>
          <p className="text-[11px] text-[#aaa]">
            Par Tahina Randrianandraina
          </p>
        </div>
      </footer>
    </div>
  );
}
