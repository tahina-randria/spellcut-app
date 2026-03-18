"use client";

import { useState, useCallback } from "react";
import {
  MagnifyingGlass,
  CheckCircle,
  UploadSimple,
  FileVideo,
  SpinnerGap,
  Warning,
  ArrowRight,
  Timer,
  TextAa,
  DownloadSimple,
  X,
  NumberOne,
  NumberTwo,
  NumberThree,
  Play,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

type AnalysisStatus = "idle" | "uploading" | "analyzing" | "done" | "error";

interface SpellError {
  timecode: string;
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

export default function Home() {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);

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
          timecode: "00:42",
          word: "premiere",
          correction: "premi\u00e8re",
          type: "accent",
          confidence: 99,
          confidence_level: "high",
          explanation: "Accent grave obligatoire.",
          context: "Aujourd\u2019hui la premiere question",
        },
        {
          timecode: "00:36",
          word: "EMERGENTS",
          correction: "\u00c9MERGENTS",
          type: "accent",
          confidence: 100,
          confidence_level: "high",
          explanation: "Accent obligatoire sur les majuscules.",
          context: "CARMIGNAC EMERGENTS",
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
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      {/* Subtle radial glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white/[0.02] rounded-full blur-[120px]" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TextAa weight="bold" size={18} />
            <span className="text-[14px] font-medium tracking-[-0.01em]">
              SpellCut
            </span>
          </div>
          {status === "done" && (
            <button
              onClick={reset}
              className="text-[12px] text-white/50 hover:text-white/80 transition-colors"
            >
              Nouvelle analyse
            </button>
          )}
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-3xl px-6 pt-24 pb-20">
        {/* IDLE — Guide + Upload */}
        {status === "idle" && (
          <>
            {/* Hero — court et direct */}
            <div className="mt-12 mb-16 text-center">
              <h1 className="text-[32px] font-medium tracking-[-0.02em] leading-[1.2] text-white mb-3">
                V\u00e9rifie l&apos;orthographe de ta vid\u00e9o
              </h1>
              <p className="text-[14px] text-white/40 max-w-md mx-auto">
                Titres, sous-titres, lower thirds. Chaque texte est lu et
                v\u00e9rifi\u00e9 directement depuis l&apos;image.
              </p>
            </div>

            {/* Guide — 3 \u00e9tapes visuelles */}
            <div className="mb-12 grid grid-cols-3 gap-px rounded-xl overflow-hidden border border-white/[0.06]">
              {[
                {
                  num: NumberOne,
                  label: "Drop ta vid\u00e9o",
                  sub: "MP4, MOV, 4K",
                },
                {
                  num: NumberTwo,
                  label: "Analyse automatique",
                  sub: "IA lit chaque frame",
                },
                {
                  num: NumberThree,
                  label: "Erreurs + timecodes",
                  sub: "Export DaVinci / FCP",
                },
              ].map(({ num: Num, label, sub }, i) => (
                <div
                  key={i}
                  className={`p-5 bg-white/[0.02] ${i === 0 ? "bg-white/[0.04]" : ""}`}
                >
                  <Num
                    size={20}
                    weight="bold"
                    className={`mb-3 ${i === 0 ? "text-white" : "text-white/30"}`}
                  />
                  <p className="text-[13px] font-medium text-white/90">
                    {label}
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Upload zone */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Zone de d\u00e9p\u00f4t vid\u00e9o"
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
              onClick={() => document.getElementById("file-input")?.click()}
              className={`group relative rounded-xl border transition-all duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
                dragOver
                  ? "border-white/30 bg-white/[0.04]"
                  : file
                    ? "border-white/15 bg-white/[0.03]"
                    : "border-dashed border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
              } ${file ? "p-5" : "p-14"}`}
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                    <FileVideo size={20} weight="regular" className="text-white/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white/90 truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-white/30">
                      {(file.size / (1024 * 1024)).toFixed(1)} Mo
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    aria-label="Retirer le fichier"
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                  >
                    <X size={14} className="text-white/40" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4 group-hover:bg-white/[0.06] transition-colors">
                    <UploadSimple size={22} weight="regular" className="text-white/50" />
                  </div>
                  <p className="text-[14px] font-medium text-white/80 mb-1">
                    Glisse ta vid\u00e9o ici
                  </p>
                  <p className="text-[12px] text-white/30">
                    ou clique pour parcourir
                  </p>
                </div>
              )}
            </div>

            {file && (
              <div className="mt-5 flex justify-center">
                <Button
                  onClick={handleAnalyze}
                  className="h-10 px-6 rounded-lg gap-2 text-[13px] font-medium bg-white text-black hover:bg-white/90"
                >
                  <Play size={14} weight="fill" />
                  Lancer l&apos;analyse
                </Button>
              </div>
            )}
          </>
        )}

        {/* ANALYZING */}
        {(status === "uploading" || status === "analyzing") && (
          <div className="mt-32 text-center">
            <SpinnerGap
              size={32}
              weight="bold"
              className="text-white/40 mx-auto mb-5 animate-spin"
            />
            <p className="text-[14px] font-medium text-white/80 mb-1">
              Analyse en cours
            </p>
            <p className="text-[12px] text-white/30 mb-8">
              {progress < 40
                ? "Extraction des frames..."
                : progress < 70
                  ? "Lecture du texte..."
                  : progress < 95
                    ? "V\u00e9rification visuelle par l\u2019IA..."
                    : "Finalisation..."}
            </p>
            <div className="max-w-[200px] mx-auto">
              <div className="h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/60 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {status === "done" && result && (
          <div className="mt-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-[20px] font-medium tracking-[-0.01em] text-white">
                  {result.total_errors} erreur
                  {result.total_errors > 1 ? "s" : ""} trouv\u00e9e
                  {result.total_errors > 1 ? "s" : ""}
                </h2>
                <p className="text-[12px] text-white/30 mt-1">
                  {file?.name} &middot;{" "}
                  {result.video_info?.duration.toFixed(0)}s &middot;{" "}
                  {result.processing_time_seconds.toFixed(1)}s d&apos;analyse
                </p>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 rounded-lg text-[11px] text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                >
                  <DownloadSimple size={13} className="mr-1" />
                  FCPXML
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 rounded-lg text-[11px] text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                >
                  <DownloadSimple size={13} className="mr-1" />
                  JSON
                </Button>
              </div>
            </div>

            {/* Error list */}
            <div className="space-y-2">
              {result.errors.map((error, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Timecode */}
                    <span className="shrink-0 mt-0.5 text-[11px] font-mono text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-md">
                      {error.timecode}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-red-400 font-medium text-[13px] line-through decoration-red-400/40">
                          {error.word}
                        </span>
                        <ArrowRight size={12} className="text-white/20" />
                        <span className="text-emerald-400 font-medium text-[13px]">
                          {error.correction}
                        </span>
                      </div>
                      <p className="text-[12px] text-white/40 leading-relaxed">
                        {error.explanation}
                      </p>
                      <p className="text-[11px] text-white/20 mt-1">
                        &laquo; {error.context} &raquo;
                      </p>
                    </div>

                    {/* Confidence */}
                    <span className="shrink-0 text-[12px] font-medium text-emerald-400/80">
                      {error.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {result.total_errors === 0 && (
              <div className="text-center py-20">
                <CheckCircle
                  size={48}
                  weight="regular"
                  className="text-emerald-400 mx-auto mb-4"
                />
                <p className="text-[15px] font-medium text-white/80">
                  Aucune erreur
                </p>
                <p className="text-[12px] text-white/30 mt-1">
                  Tous les textes sont corrects.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ERROR */}
        {status === "error" && (
          <div className="mt-32 text-center">
            <Warning
              size={32}
              weight="regular"
              className="text-red-400 mx-auto mb-4"
            />
            <p className="text-[14px] font-medium text-white/80 mb-1">
              Erreur
            </p>
            <p className="text-[12px] text-white/30 mb-6">
              R\u00e9essaye ou contacte le support.
            </p>
            <Button
              variant="ghost"
              onClick={reset}
              className="rounded-lg text-[12px] text-white/50 hover:text-white"
            >
              R\u00e9essayer
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
