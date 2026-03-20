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
  ThumbsDown,
  FileCsv,
  Subtitles,
  GearSix,
  CaretDown,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import BlobGradient from "@/components/BlobGradient";
import SmoothScroll from "@/components/SmoothScroll";

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
  screenshot_b64?: string;
}

interface AnalysisResult {
  total_errors: number;
  high_confidence_errors: number;
  medium_confidence_errors: number;
  processing_time_seconds: number;
  total_wall_time_seconds?: number;
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
  const [currentStep, setCurrentStep] = useState<string>("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [netflixMode, setNetflixMode] = useState(false);
  const [dismissedErrors, setDismissedErrors] = useState<Set<number>>(new Set());
  const [showOptions, setShowOptions] = useState(false);
  const [eta, setEta] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus("uploading");
    setProgress(5);

    try {
      // Step 1: Upload video → get job_id
      const formData = new FormData();
      formData.append("video", file);
      formData.append("netflix_mode", netflixMode ? "true" : "false");

      const uploadRes = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(err.detail || `HTTP ${uploadRes.status}`);
      }

      const { job_id } = await uploadRes.json();
      setJobId(job_id);
      setStatus("analyzing");
      setProgress(15);

      // Step 2: Poll job status until done
      let attempts = 0;
      const maxAttempts = 600; // 30 min max (3s * 600)

      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 3000));
        attempts++;

        const pollRes = await fetch(`${API_URL}/jobs/${job_id}`);
        if (!pollRes.ok) throw new Error("Failed to check job status");

        const job = await pollRes.json();

        // Update progress and step from backend
        if (job.progress) setProgress(Math.max(job.progress, 15));
        if (job.step) setCurrentStep(job.step);

        // Estimate remaining time based on progress
        const pct = job.progress || 0;
        if (pct > 10 && pct < 95) {
          const elapsed = attempts * 3;
          const total = (elapsed / pct) * 100;
          const remaining = Math.max(0, Math.round(total - elapsed));
          if (remaining > 60) {
            setEta(`~${Math.round(remaining / 60)} min restantes`);
          } else if (remaining > 5) {
            setEta(`~${remaining}s restantes`);
          } else {
            setEta("Presque termin\u00e9...");
          }
        }

        if (job.status === "done" && job.result) {
          setResult(job.result);
          setProgress(100);
          setStatus("done");
          return;
        }

        if (job.status === "error") {
          const msg = job.error || "Analysis failed";
          if (msg.includes("timeout")) {
            throw new Error("La vid\u00e9o est trop longue pour le GPU. Essaie avec une vid\u00e9o plus courte (<10 min).");
          }
          throw new Error(msg);
        }

        // Smooth progress simulation between polls (increment by small steps)
        setProgress((prev) => {
          const backendPct = job.progress || 0;
          // If backend is ahead, jump to it; otherwise creep up slowly
          if (backendPct > prev) return backendPct;
          return Math.min(prev + 1, 90);
        });
      }

      throw new Error("Analysis timed out after 15 minutes");
    } catch (err) {
      console.error("Analysis failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Une erreur est survenue");
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setFile(null);
    setResult(null);
    setProgress(0);
    setActiveError(null);
    setDismissedErrors(new Set());
    setActiveFilter("all");
    setNetflixMode(false);
  };

  const seekToError = (error: SpellError, index: number) => {
    setActiveError(index);
    if (videoRef.current) {
      videoRef.current.currentTime = error.seconds;
      videoRef.current.play();
    }
  };

  const exportPremiere = async () => {
    if (!result) return;
    // Try FCPXML from backend (best for Premiere Pro import)
    if (jobId) {
      try {
        const res = await fetch(`${API_URL}/jobs/${jobId}/fcpxml`);
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `SpellCut_${file?.name?.replace(/\.[^.]+$/, "") || "video"}.fcpxml`;
          a.click();
          URL.revokeObjectURL(url);
          return;
        }
      } catch {
        // Fallback to client-side CSV
      }
    }
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

  const exportSRT = async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`${API_URL}/jobs/${jobId}/srt`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SpellCut_${file?.name?.replace(/\.[^.]+$/, "") || "video"}.srt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {}
  };

  const exportCSV = async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`${API_URL}/jobs/${jobId}/csv`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SpellCut_${file?.name?.replace(/\.[^.]+$/, "") || "video"}_errors.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {}
  };

  const dismissError = async (index: number, error: SpellError) => {
    setDismissedErrors((prev) => new Set(prev).add(index));
    if (!jobId) return;
    try {
      await fetch(`${API_URL}/jobs/${jobId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error_index: index,
          word: error.word,
          correction: error.correction,
          error_type: error.type,
          feedback: "false_positive",
        }),
      });
    } catch {}
  };

  return (
    <div className="relative min-h-screen">
      {/* Animated blob gradient + grain */}
      <BlobGradient />
      <SmoothScroll />

      <main className="relative z-10 mx-auto max-w-2xl px-6">
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
              <p className="text-[15px] text-[#d1d5db] max-w-md mx-auto leading-relaxed">
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
                  className="glass-card p-5 group"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <Icon
                      size={16}
                      weight="regular"
                      className="text-white"
                    />
                    <span className="text-[11px] font-medium text-[#e5e7eb] tracking-wider uppercase">
                      {step}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-white mb-0.5">
                    {label}
                  </p>
                  <p className="text-[12px] text-[#d1d5db]">{sub}</p>
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
                className={`group relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111] glass-upload ${
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
                    <FileVideo
                      size={22}
                      weight="regular"
                      className="text-white shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-[12px] text-[#d1d5db]">
                        {(file.size / (1024 * 1024)).toFixed(1)} Mo
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      aria-label="Retirer le fichier"
                      className="p-2 hover:bg-white/[0.08] transition-colors"
                    >
                      <X size={16} className="text-[#d1d5db]" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <UploadSimple
                      size={28}
                      weight="regular"
                      className="text-white mx-auto mb-5 group-hover:scale-105 transition-transform duration-300"
                    />
                    <p className="text-[15px] font-medium text-white mb-1.5">
                      Glisse ta vid&eacute;o ici
                    </p>
                    <p className="text-[13px] text-[#d1d5db]">
                      ou clique pour parcourir &middot; MP4, MOV
                    </p>
                  </div>
                )}
              </div>

              {file && (
                <div className="mt-6 flex flex-col items-center gap-4">
                  {/* Options toggle */}
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="flex items-center gap-1.5 text-[12px] text-[#d1d5db] hover:text-white transition-colors"
                  >
                    <GearSix size={13} weight="regular" />
                    Options
                    <CaretDown
                      size={10}
                      weight="regular"
                      className={`transition-transform ${showOptions ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showOptions && (
                    <div className="w-full glass-card p-4 space-y-3 animate-fade-up">
                      {/* Netflix mode toggle */}
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="text-[13px] font-medium text-white">
                            Mode Netflix
                          </p>
                          <p className="text-[11px] text-[#d1d5db]">
                            V&eacute;rifie les r&egrave;gles de sous-titrage Netflix FR
                          </p>
                        </div>
                        <button
                          role="switch"
                          aria-checked={netflixMode}
                          onClick={() => setNetflixMode(!netflixMode)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            netflixMode ? "bg-[#e50914]" : "bg-white/[0.15]"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                              netflixMode ? "translate-x-5" : ""
                            }`}
                          />
                        </button>
                      </label>
                    </div>
                  )}

                  <Button
                    onClick={handleAnalyze}
                    className="h-11 px-7 rounded-none gap-2.5 text-[13px] font-semibold bg-white text-black hover:bg-white/90 transition-all active:scale-[0.98]"
                  >
                    <Play size={14} weight="regular" />
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
            <div className="mb-6 mx-auto w-fit">
              <SpinnerGap
                size={28}
                weight="regular"
                className="text-white animate-spin"
              />
            </div>
            <p className="text-[16px] font-medium text-white mb-2">
              Analyse en cours
            </p>
            <p className="text-[13px] text-[#d1d5db] mb-6">
              {currentStep
                ? `${currentStep}...`
                : status === "uploading"
                  ? "Envoi de la vid\u00e9o..."
                  : "D\u00e9marrage de l\u2019analyse..."}
            </p>

            {/* Steps indicator */}
            <div className="max-w-[280px] mx-auto mb-8">
              {[
                { label: "Envoi", threshold: 5 },
                { label: "Lecture vidéo", threshold: 15 },
                { label: "Détection du texte", threshold: 30 },
                { label: "Vérification orthographe", threshold: 65 },
                { label: "Analyse grammaire", threshold: 80 },
                { label: "Finalisation", threshold: 88 },
              ].map(({ label, threshold }, idx) => {
                const done = progress >= threshold;
                const active = progress >= threshold - 15 && progress < threshold + 10;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2.5 py-1 transition-opacity duration-500 ${
                      done
                        ? "opacity-100"
                        : active
                          ? "opacity-70"
                          : "opacity-30"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-none shrink-0 transition-colors ${
                        done ? "bg-[#51cf66]" : active ? "bg-white animate-pulse" : "bg-[#555]"
                      }`}
                    />
                    <span className="text-[11px] text-[#e5e7eb]">{label}</span>
                    {done && (
                      <CheckCircle size={10} weight="regular" className="text-[#51cf66] ml-auto" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="max-w-[240px] mx-auto">
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-[#e5e7eb] mt-3 font-mono">
                {progress}%{eta && (
                  <span className="text-[#d1d5db] ml-2">&middot; {eta}</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════ RESULTS ═══════════════ */}
        {status === "done" && result && (
          <div className="mt-6 animate-fade-up delay-1">
            {/* Video player preview */}
            {videoUrl && (
              <div className="mb-8 glass-card rounded-none overflow-hidden">
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
                  <p className="text-[12px] text-[#d1d5db]">
                    Clique sur une erreur pour aller au timecode
                  </p>
                  <Cursor size={14} className="text-[#e5e7eb]" />
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
                <p className="text-[12px] text-[#d1d5db] mt-1">
                  {file?.name} &middot;{" "}
                  {result.video_info?.duration && result.video_info.duration > 60
                    ? `${Math.round(result.video_info.duration / 60)} min`
                    : `${result.video_info?.duration.toFixed(0)}s`} &middot;{" "}
                  Analys&eacute; en{" "}
                  {result.processing_time_seconds > 60
                    ? `${Math.round(result.processing_time_seconds / 60)} min`
                    : `${result.processing_time_seconds.toFixed(0)}s`}
                </p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportPremiere}
                  className="h-8 px-3 rounded-none text-[11px] font-medium text-[#e5e7eb] hover:text-white hover:bg-white/[0.06] gap-1"
                  aria-label="Exporter FCPXML"
                >
                  <DownloadSimple size={12} />
                  FCPXML
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportSRT}
                  className="h-8 px-3 rounded-none text-[11px] font-medium text-[#e5e7eb] hover:text-white hover:bg-white/[0.06] gap-1"
                  aria-label="Exporter SRT"
                >
                  <Subtitles size={12} />
                  SRT
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportCSV}
                  className="h-8 px-3 rounded-none text-[11px] font-medium text-[#e5e7eb] hover:text-white hover:bg-white/[0.06] gap-1"
                  aria-label="Exporter CSV"
                >
                  <FileCsv size={12} />
                  CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportJSON}
                  className="h-8 px-3 rounded-none text-[11px] font-medium text-[#e5e7eb] hover:text-white hover:bg-white/[0.06] gap-1"
                  aria-label="Exporter JSON"
                >
                  <DownloadSimple size={12} />
                  JSON
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="h-8 px-3 rounded-none text-[11px] font-medium text-[#e5e7eb] hover:text-white hover:bg-white/[0.06] gap-1 ml-auto"
                >
                  Nouvelle analyse
                </Button>
              </div>
            </div>

            {/* Error list — Orthographe */}
            {result.errors.filter(e => !["ligne_trop_longue", "trop_de_lignes", "vitesse_lecture", "duree_min", "duree_max"].includes(e.type)).length > 0 && (
              <>
                <h3 className="text-[14px] font-medium text-white mb-3">
                  Orthographe &amp; grammaire
                </h3>
                {/* Filter buttons */}
                <div className="inline-flex gap-1.5 mb-4 flex-wrap">
                  {[
                    { key: "all", label: "Tout" },
                    { key: "orthographe", label: "Orthographe" },
                    { key: "grammaire", label: "Grammaire" },
                    { key: "accent", label: "Accents" },
                    { key: "typographie", label: "Typographie" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveFilter(key)}
                      className={`text-[11px] px-2.5 py-1 rounded-none backdrop-blur-md border transition-colors ${
                        activeFilter === key
                          ? "bg-white/[0.15] border-white/[0.2] text-white"
                          : "bg-white/[0.05] border-white/[0.08] text-[#d1d5db] hover:bg-white/[0.1] hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="space-y-3">
              {result.errors.map((error, i) => {
                // Skip Netflix errors in this section
                if (["ligne_trop_longue", "trop_de_lignes", "vitesse_lecture", "duree_min", "duree_max"].includes(error.type)) return null;
                if (dismissedErrors.has(i)) return null;
                // Apply type filter
                if (activeFilter !== "all" && !error.type.toLowerCase().includes(activeFilter)) return null;
                return (
                  <div
                    key={i}
                    className={`error-card relative group w-full text-left p-5 rounded-none glass-card transition-all duration-200 ${
                      activeError === i ? "ring-1 ring-white/20" : ""
                    }`}
                  >
                    {/* Dismiss button — hover reveal */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissError(i, error);
                      }}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-none hover:bg-white/[0.08]"
                      aria-label="Pas une erreur"
                      title="Pas une erreur"
                    >
                      <ThumbsDown size={14} className="text-[#d1d5db]" />
                    </button>

                    <button
                      onClick={() => seekToError(error, i)}
                      className="w-full text-left cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        {/* Timecode */}
                        <span className="shrink-0 mt-0.5 text-[11px] font-mono text-white bg-white/[0.08] px-2.5 py-1 rounded-none">
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
                              weight="regular"
                              className="text-[#d1d5db]"
                            />
                            <span className="text-[#51cf66] font-semibold text-[14px]">
                              {error.correction}
                            </span>
                          </div>
                          <p className="text-[13px] text-[#d1d5db] leading-relaxed">
                            {error.explanation}
                          </p>
                          <p className="text-[12px] text-[#e5e7eb] mt-1.5">
                            &laquo;&nbsp;{error.context}&nbsp;&raquo;
                          </p>

                          {/* Screenshot proof */}
                          {error.screenshot_b64 && (
                            <div className="mt-3 rounded-none overflow-hidden border border-white/[0.08]">
                              <img
                                src={error.screenshot_b64}
                                alt={`Preuve: ${error.word}`}
                                className="w-full max-h-32 object-contain bg-black/50"
                              />
                            </div>
                          )}
                        </div>

                        {/* Confidence */}
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <span
                            className={`text-[13px] font-semibold ${
                              error.confidence >= 90
                                ? "text-[#ff6b6b]"
                                : error.confidence >= 70
                                  ? "text-[#ffaa00]"
                                  : "text-[#51cf66]"
                            }`}
                          >
                            {error.confidence}%
                          </span>
                          <span className="text-[10px] text-[#e5e7eb] uppercase tracking-wider">
                            {error.type}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Netflix errors section */}
            {result.errors.filter(e => ["ligne_trop_longue", "trop_de_lignes", "vitesse_lecture", "duree_min", "duree_max"].includes(e.type)).length > 0 && (
              <div className="mt-8">
                <h3 className="text-[14px] font-medium text-white mb-3 flex items-center gap-2">
                  <span className="text-[#e50914]">N</span>
                  R&egrave;gles Netflix
                </h3>
                <div className="space-y-2">
                  {result.errors
                    .map((error, i) => ({ error, i }))
                    .filter(({ error }) => ["ligne_trop_longue", "trop_de_lignes", "vitesse_lecture", "duree_min", "duree_max"].includes(error.type))
                    .map(({ error, i }) => (
                      <button
                        key={i}
                        onClick={() => seekToError(error, i)}
                        className="w-full text-left p-4 glass-card rounded-none transition-all hover:bg-white/[0.04]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="shrink-0 text-[11px] font-mono text-white bg-[#e50914]/20 px-2 py-0.5 rounded-none">
                            {error.timecode}
                          </span>
                          <span className="text-[13px] text-[#d1d5db] flex-1">
                            {error.explanation}
                          </span>
                          <span className="text-[10px] text-[#e5e7eb] uppercase tracking-wider">
                            {error.type.replace(/_/g, " ")}
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-8 px-4 py-3 rounded-none bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[11px] text-[#d1d5db] leading-relaxed">
                Les r&eacute;sultats sont fournis &agrave; titre indicatif.
                La d&eacute;tection d&eacute;pend de la qualit&eacute; vid&eacute;o, de la police
                utilis&eacute;e et du contexte. V&eacute;rifiez toujours les suggestions
                avant de corriger. SpellCut ne garantit pas l&apos;exhaustivit&eacute; de la d&eacute;tection.
              </p>
            </div>

            {result.total_errors === 0 && (
              <div className="text-center py-24">
                <div className="w-16 h-16 rounded-none glass flex items-center justify-center mx-auto mb-5">
                  <CheckCircle
                    size={32}
                    weight="regular"
                    className="text-[#51cf66]"
                  />
                </div>
                <p className="text-[16px] font-medium text-white">
                  Aucune erreur d&eacute;tect&eacute;e
                </p>
                <p className="text-[13px] text-[#d1d5db] mt-2">
                  Tous les textes de ta vid&eacute;o sont corrects.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ ERROR ═══════════════ */}
        {status === "error" && (
          <div className="mt-32 text-center">
            <div className="w-16 h-16 rounded-none glass flex items-center justify-center mx-auto mb-6">
              <Warning size={28} weight="regular" className="text-[#ff6b6b]" />
            </div>
            <p className="text-[16px] font-medium text-white mb-2">
              Erreur
            </p>
            <p className="text-[13px] text-[#d1d5db] mb-8 max-w-sm mx-auto">
              {errorMessage || "V\u00e9rifie ta connexion et r\u00e9essaie."}
            </p>
            <Button
              variant="ghost"
              onClick={reset}
              className="rounded-none text-[13px] text-[#d1d5db] hover:text-white"
            >
              R&eacute;essayer
            </Button>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8 mt-16">
        <div className="mx-auto max-w-2xl px-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[#d1d5db]">
              &copy; {new Date().getFullYear()} SpellCut
            </p>
            <p className="text-[11px] text-[#d1d5db]">
              Par Tahina Randrianandraina
            </p>
          </div>
          <p className="text-[10px] text-[#d1d5db] leading-relaxed">
            Outil d&apos;aide &agrave; la d&eacute;tection. Les r&eacute;sultats d&eacute;pendent
            de la qualit&eacute; vid&eacute;o, des polices et du contexte. SpellCut ne se
            substitue pas &agrave; une relecture humaine.
          </p>
        </div>
      </footer>
    </div>
  );
}
