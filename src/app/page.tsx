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
  Eye,
  DownloadSimple,
  X,
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
  video_info?: {
    duration: number;
    resolution: string;
  };
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
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type.startsWith("video/")) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) setFile(selected);
    },
    []
  );

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus("uploading");
    setProgress(10);

    // Simulate (replace with real API)
    const steps = [
      { progress: 20, delay: 500 },
      { progress: 40, delay: 2000 },
      { progress: 60, delay: 3000 },
      { progress: 80, delay: 2000 },
      { progress: 95, delay: 2000 },
    ];

    setStatus("analyzing");
    for (const step of steps) {
      await new Promise((r) => setTimeout(r, step.delay));
      setProgress(step.progress);
    }

    setResult({
      total_errors: 3,
      high_confidence_errors: 3,
      medium_confidence_errors: 0,
      processing_time_seconds: 12.4,
      video_info: { duration: 62.2, resolution: "1920x1080" },
      errors: [
        {
          timecode: "00:00:13.00",
          word: "fond",
          correction: "fonds",
          type: "orthographe",
          confidence: 99,
          confidence_level: "high",
          explanation:
            "Dans le contexte financier, il faut \u00ab fonds \u00bb (portefeuille) et non \u00ab fond \u00bb (dessous).",
          context: "G\u00e9rant de fond \u00e9mergent",
        },
        {
          timecode: "00:00:42.00",
          word: "premiere",
          correction: "premi\u00e8re",
          type: "accent",
          confidence: 99,
          confidence_level: "high",
          explanation:
            "L\u2019accent grave est obligatoire sur \u00ab premi\u00e8re \u00bb.",
          context: "Aujourd\u2019hui la premiere question",
        },
        {
          timecode: "00:00:36.00",
          word: "EMERGENTS",
          correction: "\u00c9MERGENTS",
          type: "accent",
          confidence: 100,
          confidence_level: "high",
          explanation:
            "Les accents sur les majuscules sont obligatoires en fran\u00e7ais.",
          context: "CARMIGNAC EMERGENTS",
        },
      ],
    });

    setProgress(100);
    setStatus("done");
  };

  const resetAnalysis = () => {
    setStatus("idle");
    setFile(null);
    setResult(null);
    setProgress(0);
  };

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <TextAa weight="bold" size={16} className="text-background" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              SpellCut
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:block tracking-wide">
            Chaque erreur est v\u00e9rifi\u00e9e visuellement par l&apos;IA
          </span>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 pt-28 pb-20">
        {/* Hero */}
        {status === "idle" && !file && (
          <section className="text-center mb-20">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/60 text-[11px] text-muted-foreground mb-8 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--sc-success)]" />
              Moteur v1 &mdash; 0 faux positif sur vid\u00e9o r\u00e9elle
            </div>

            <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-tight leading-[1.15] mb-5">
              Les fautes dans tes vid\u00e9os,
              <br />
              <span className="text-muted-foreground">
                trouv\u00e9es en un clic.
              </span>
            </h1>
            <p className="text-[15px] text-muted-foreground max-w-lg mx-auto mb-14 leading-relaxed">
              Drop ta vid\u00e9o. SpellCut d\u00e9tecte chaque erreur
              d&apos;orthographe, grammaire et typographie dans tes titres,
              lower thirds et sous-titres.
            </p>

            {/* How it works */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-16">
              {[
                {
                  icon: UploadSimple,
                  step: "01",
                  title: "Drop ta vid\u00e9o",
                  desc: "MP4, MOV, 4K \u2014 tous formats",
                },
                {
                  icon: Eye,
                  step: "02",
                  title: "L\u2019IA lit chaque pixel",
                  desc: "Claude Vision v\u00e9rifie visuellement",
                },
                {
                  icon: CheckCircle,
                  step: "03",
                  title: "R\u00e9sultat avec timecodes",
                  desc: "Rapport + markers DaVinci Resolve",
                },
              ].map(({ icon: Icon, step, title, desc }) => (
                <div
                  key={step}
                  className="p-5 rounded-2xl border border-border/40 text-left"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="text-[10px] font-medium text-muted-foreground tracking-widest">
                      {step}
                    </span>
                    <Icon size={20} weight="regular" className="text-muted-foreground" />
                  </div>
                  <h3 className="text-[13px] font-medium mb-0.5">{title}</h3>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upload Zone */}
        {status === "idle" && (
          <section className="mb-16">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`upload-zone rounded-2xl p-16 text-center cursor-pointer ${
                dragOver ? "drag-over" : ""
              } ${file ? "border-foreground/20 bg-card/40" : ""}`}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center justify-center gap-4">
                  <FileVideo
                    size={36}
                    weight="regular"
                    className="text-muted-foreground"
                  />
                  <div className="text-left">
                    <p className="text-[14px] font-medium">{file.name}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(1)} Mo
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="ml-4 p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X size={14} className="text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <UploadSimple
                    size={40}
                    weight="regular"
                    className="text-muted-foreground mx-auto mb-4"
                  />
                  <p className="text-[14px] font-medium mb-1">
                    Glisse ta vid\u00e9o ici
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    ou clique pour parcourir &mdash; MP4, MOV, MKV, jusqu&apos;\u00e0
                    2 Go
                  </p>
                </>
              )}
            </div>

            {file && (
              <div className="mt-6 flex justify-center">
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  className="rounded-xl px-8 gap-2 text-[13px] font-semibold h-11"
                >
                  <MagnifyingGlass size={16} weight="bold" />
                  Analyser la vid\u00e9o
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Analyzing */}
        {(status === "uploading" || status === "analyzing") && (
          <section className="text-center py-24">
            <SpinnerGap
              size={40}
              weight="bold"
              className="text-muted-foreground mx-auto mb-6 animate-spin"
            />
            <h2 className="text-lg font-semibold mb-2">
              {status === "uploading"
                ? "Upload en cours..."
                : "Analyse en cours..."}
            </h2>
            <p className="text-[13px] text-muted-foreground mb-10 max-w-sm mx-auto leading-relaxed">
              {progress < 40
                ? "Extraction des frames de la vid\u00e9o..."
                : progress < 70
                  ? "OCR \u2014 lecture du texte dans chaque image..."
                  : progress < 90
                    ? "Claude Vision v\u00e9rifie chaque erreur..."
                    : "Finalisation du rapport..."}
            </p>

            <div className="max-w-xs mx-auto">
              <div className="h-[3px] bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-2.5">
                {progress}%
              </p>
            </div>
          </section>
        )}

        {/* Results */}
        {status === "done" && result && (
          <section>
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  {result.total_errors === 0
                    ? "Aucune erreur"
                    : `${result.total_errors} erreur${result.total_errors > 1 ? "s" : ""} trouv\u00e9e${result.total_errors > 1 ? "s" : ""}`}
                </h2>
                <p className="text-[12px] text-muted-foreground mt-1">
                  {file?.name} &middot; {result.video_info?.resolution} &middot;{" "}
                  {result.video_info?.duration.toFixed(0)}s &middot; analys\u00e9 en{" "}
                  {result.processing_time_seconds.toFixed(1)}s
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-lg gap-1.5 text-[11px] h-8"
                >
                  <DownloadSimple size={13} />
                  FCPXML
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-lg gap-1.5 text-[11px] h-8"
                >
                  <DownloadSimple size={13} />
                  JSON
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAnalysis}
                  className="rounded-lg text-[11px] h-8"
                >
                  Nouvelle analyse
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                {
                  label: "Haute confiance",
                  value: result.high_confidence_errors,
                  color: "text-[var(--sc-error)]",
                },
                {
                  label: "\u00c0 v\u00e9rifier",
                  value: result.medium_confidence_errors,
                  color: "text-[var(--sc-warning)]",
                },
                {
                  label: "Faux positifs",
                  value: 0,
                  color: "text-[var(--sc-success)]",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="p-4 rounded-xl border border-border/40 text-center"
                >
                  <p className={`text-2xl font-semibold ${color}`}>{value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Error list */}
            <div className="space-y-2.5">
              {result.errors.map((error, i) => (
                <div
                  key={i}
                  className="group p-4 rounded-xl border border-border/40 hover:border-border/80 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[11px] font-mono mt-0.5">
                      <Timer size={11} />
                      {error.timecode}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[var(--sc-error)] font-semibold text-[13px] line-through decoration-1">
                          {error.word}
                        </span>
                        <ArrowRight
                          size={12}
                          className="text-muted-foreground"
                        />
                        <span className="text-[var(--sc-success)] font-semibold text-[13px]">
                          {error.correction}
                        </span>
                        <span className="ml-1.5 text-[9px] uppercase tracking-widest text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {error.type}
                        </span>
                      </div>
                      <p className="text-[12px] text-muted-foreground leading-relaxed">
                        {error.explanation}
                      </p>
                      {error.context && (
                        <p className="text-[11px] text-muted-foreground/50 mt-1">
                          \u00ab {error.context} \u00bb
                        </p>
                      )}
                    </div>

                    <span
                      className={`shrink-0 text-[13px] font-semibold ${
                        error.confidence >= 90
                          ? "text-[var(--sc-success)]"
                          : "text-[var(--sc-warning)]"
                      }`}
                    >
                      {error.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {result.total_errors === 0 && (
              <div className="text-center py-20">
                <CheckCircle
                  size={56}
                  weight="regular"
                  className="text-[var(--sc-success)] mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold mb-1.5">
                  Aucune erreur d\u00e9tect\u00e9e
                </h3>
                <p className="text-[13px] text-muted-foreground">
                  Tous les textes de ta vid\u00e9o sont corrects.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Error state */}
        {status === "error" && (
          <section className="text-center py-24">
            <Warning
              size={40}
              weight="regular"
              className="text-[var(--sc-error)] mx-auto mb-4"
            />
            <h2 className="text-lg font-semibold mb-2">
              Erreur lors de l&apos;analyse
            </h2>
            <p className="text-[13px] text-muted-foreground mb-6">
              R\u00e9essaye ou contacte le support.
            </p>
            <Button
              variant="secondary"
              onClick={resetAnalysis}
              className="rounded-xl"
            >
              R\u00e9essayer
            </Button>
          </section>
        )}
      </main>

      <footer className="border-t border-border/30 py-6">
        <div className="mx-auto max-w-5xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <TextAa size={14} weight="bold" />
            SpellCut
          </div>
          <p className="text-[11px] text-muted-foreground">
            Propuls\u00e9 par Claude Vision
          </p>
        </div>
      </footer>
    </div>
  );
}
