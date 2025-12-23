"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import CodeEditor from "../../components/CodeEditor";

type Mode = "beginner" | "advanced";

type Mistake = {
  id: string;
  title: string;
  why: string;
  fix: string;
  severity: "warning" | "info";
};

const LANGUAGE_OPTIONS = [
  // Core
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },

  // Popular extras
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },

  // Web / Data
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash / Shell" },
];

const STARTER_SNIPPETS: Record<string, string> = {
  python: `def greet(name):
    print("Hello, " + name)

greet("Kashish")`,

  javascript: `function greet(name) {
  console.log("Hello, " + name);
}

greet("Kashish");`,

  typescript: `function greet(name: string): void {
  console.log("Hello, " + name);
}

greet("Kashish");`,

  c: `#include <stdio.h>

int main() {
  printf("Hello, Kashish\\n");
  return 0;
}`,

  cpp: `#include <iostream>
using namespace std;

int main() {
  cout << "Hello, Kashish" << endl;
  return 0;
}`,

  java: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, Kashish");
  }
}`,

  csharp: `using System;

class Program {
  static void Main() {
    Console.WriteLine("Hello, Kashish");
  }
}`,

  go: `package main

import "fmt"

func main() {
  fmt.Println("Hello, Kashish")
}`,

  rust: `fn main() {
  println!("Hello, Kashish");
}`,

  php: `<?php
echo "Hello, Kashish";
?>`,

  ruby: `puts "Hello, Kashish"`,

  kotlin: `fun main() {
  println("Hello, Kashish")
}`,

  swift: `print("Hello, Kashish")`,

  html: `<!DOCTYPE html>
<html>
  <body>
    <h1>Hello Kashish</h1>
  </body>
</html>`,

  css: `body {
  background-color: #0b0f19;
  color: white;
}`,

  json: `{
  "message": "Hello, Kashish"
}`,

  yaml: `message: Hello, Kashish`,

  markdown: `# Hello Kashish

This is **Markdown**.`,

  sql: `SELECT 'Hello, Kashish';`,

  bash: `echo "Hello, Kashish"`,
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

type ExplainResponse = {
  explanation?: string;
  mistakes?: string;
};

function safeJsonParse(maybeJson: string): ExplainResponse | null {
  const t = maybeJson.trim();
  if (!t.startsWith("{") || !t.endsWith("}")) return null;
  try {
    const parsed = JSON.parse(t) as ExplainResponse;
    if (
      typeof parsed === "object" &&
      (typeof parsed.explanation === "string" || typeof parsed.mistakes === "string")
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function aiMistakesToList(raw: string): Mistake[] {
  const text = (raw ?? "").trim();
  if (!text) return [];

  // Split on numbered bullets or line breaks; keep it very forgiving.
  const lines = text
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean);

  // If AI returns a paragraph, treat it as one mistake.
  if (lines.length === 1) {
    return [
      {
        id: "ai-0",
        title: "AI detected an issue",
        why: lines[0],
        fix: "Check the explanation above for the suggested correction.",
        severity: "warning",
      },
    ];
  }

  // If multiple lines, turn each into an item.
  return lines.slice(0, 12).map((line, i) => ({
    id: `ai-${i}`,
    title: `AI: ${line.replace(/^\d+[\).\s]+/, "").slice(0, 80)}`,
    why: line,
    fix: "Apply the suggested fix from the AI output, then re-check mistakes.",
    severity: "warning",
  }));
}

function mergeMistakes(a: Mistake[], b: Mistake[]): Mistake[] {
  const map = new Map<string, Mistake>();
  for (const m of [...a, ...b]) {
    const key = (m.title || "").toLowerCase().trim();
    if (!map.has(key)) map.set(key, m);
  }
  return Array.from(map.values());
}

export default function ExplainPage() {
    function ClearCodeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M22 14C16 18 14 22 14 32C14 42 16 46 22 50"
        stroke="#A5B4FC"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M42 14C48 18 50 22 50 32C50 42 48 46 42 50"
        stroke="#A5B4FC"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="18"
        x2="32"
        y2="46"
        stroke="#6366F1"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

  const [language, setLanguage] = useState("python");
  const [mode, setMode] = useState<Mode>("beginner");
  const [code, setCode] = useState(STARTER_SNIPPETS["python"]);
  const [activeTab, setActiveTab] = useState<"explanation" | "mistakes">("explanation");

  const [explanation, setExplanation] = useState("");
  const [aiMistakesRaw, setAiMistakesRaw] = useState("");
  const [aiMistakesList, setAiMistakesList] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestMs, setRequestMs] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const next = STARTER_SNIPPETS[language] ?? "";
    setCode((prev) => {
      const trimmed = prev.trim();
      const prevStarter = Object.values(STARTER_SNIPPETS).some((s) => s.trim() === trimmed);
      if (prevStarter || trimmed.length === 0) return next;
      return prev;
    });
  }, [language]);

  const localMistakes = useMemo(() => detectMistakes(code, language), [code, language]);
  const mistakes = useMemo(() => mergeMistakes(localMistakes, aiMistakesList), [localMistakes, aiMistakesList]);

  const canExplain = code.trim().length > 0 && !loading;

  async function handleExplain() {
    if (!code.trim()) return;

    setActiveTab("explanation");
    setExplanation("");
    setAiMistakesRaw("");
    setAiMistakesList([]);
    setRequestMs(null);
    setLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    startedAtRef.current = performance.now();

    let fullText = "";

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          code,
          language,
          mode,
          verbosity: "long",
          includeExamples: true,
          includeEdgeCases: mode === "advanced",
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        const data = (await res.json()) as ExplainResponse;
        const expl = data.explanation ?? "";
        setExplanation(expl);
        const raw = data.mistakes ?? "";
        setAiMistakesRaw(raw);
        setAiMistakesList(aiMistakesToList(raw));
        return;
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullText += chunk;

        // show raw stream live
        setExplanation((prev) => prev + chunk);
      }

      // IMPORTANT: If server streamed JSON (your screenshot shows it),
      // parse it at the end and replace UI with fields.
      const parsed = safeJsonParse(fullText);
      if (parsed) {
        const expl = parsed.explanation ?? "";
        setExplanation(expl);

        const raw = parsed.mistakes ?? "";
        setAiMistakesRaw(raw);
        setAiMistakesList(aiMistakesToList(raw));
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setExplanation((prev) => (prev ? prev : "Stopped."));
      } else {
        setExplanation(`Error: ${err?.message ?? "Unknown error"}`);
      }
    } finally {
      setLoading(false);
      const start = startedAtRef.current;
      if (start != null) setRequestMs(Math.round(performance.now() - start));
      startedAtRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  function handleClear() {
    setExplanation("");
    setAiMistakesRaw("");
    setAiMistakesList([]);
    setRequestMs(null);
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  function handleUseStarter() {
    setCode(STARTER_SNIPPETS[language] ?? "");
  }

  return (
    <main className="min-h-screen bg-[#0B0F19] text-white">
      <div className="border-b border-[#1F2937] bg-[#0B0F19]/85 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-gray-400">
                <Link href="/" className="hover:text-white transition">
                  Home
                </Link>
                <span className="mx-2 text-gray-600">/</span>
                <span className="text-gray-300">Explain</span>
              </div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
  AI Code Explainer
</h1>
              <p className="text-sm text-gray-400">
                Write code on the left. Get explanation and mistakes on the right.
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Pill label="Fast" />
              <Pill label={mode === "beginner" ? "Beginner Friendly" : "Advanced"} />
              <Pill label={LANGUAGE_OPTIONS.find((x) => x.value === language)?.label ?? language} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-5 rounded-2xl border border-[#1F2937] bg-[#0E1526] p-4 shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Language</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#0B0F19] border border-[#1F2937] rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500/60"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Mode</span>
              <div className="flex rounded-xl border border-[#1F2937] overflow-hidden bg-[#0B0F19]">
                <button
                  onClick={() => setMode("beginner")}
                  className={cx(
                    "px-4 py-2 text-sm transition",
                    mode === "beginner" ? "bg-indigo-500 text-white" : "text-gray-300 hover:text-white"
                  )}
                >
                  Beginner
                </button>
                <button
                  onClick={() => setMode("advanced")}
                  className={cx(
                    "px-4 py-2 text-sm transition",
                    mode === "advanced" ? "bg-indigo-500 text-white" : "text-gray-300 hover:text-white"
                  )}
                >
                  Advanced
                </button>
              </div>
            </div>

            <div className="flex-1" />

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleUseStarter}
                className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-4 py-2 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition"
                title="Restore starter snippet for this language"
              >
                Starter
              </button>

              <button
                onClick={() => setActiveTab("mistakes")}
                className={cx(
                  "rounded-xl border px-4 py-2 text-sm transition",
                  mistakes.length > 0
                    ? "border-[#2B3552] bg-[#0B0F19] text-gray-200 hover:border-indigo-400"
                    : "border-[#1F2937] bg-[#0B0F19] text-gray-400 hover:border-gray-500 hover:text-white"
                )}
                title="View beginner mistake detection"
              >
                Mistakes ({mistakes.length})
              </button>

              {!loading ? (
                <button
                  onClick={handleExplain}
                  disabled={!canExplain}
                  className={cx(
                    "rounded-xl px-5 py-2 text-sm font-medium transition shadow-lg",
                    canExplain
                      ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                      : "bg-indigo-500/40 text-white/70 cursor-not-allowed"
                  )}
                >
                  Explain
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="rounded-xl px-5 py-2 text-sm font-medium bg-[#1F2937] hover:bg-[#2A3750] transition"
                >
                  Stop
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-[#1F2937] bg-[#0E1526] shadow-[0_12px_36px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937]">
              <div className="flex items-center gap-2">
                <Dot color="bg-red-500/80" />
                <Dot color="bg-yellow-500/80" />
                <Dot color="bg-green-500/80" />
                <span className="ml-2 text-sm text-gray-300">Editor</span>
                <span className="ml-2 text-xs text-gray-500">
                  {LANGUAGE_OPTIONS.find((x) => x.value === language)?.label ?? language}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(code)}
                  className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3 py-2 text-xs text-gray-300 hover:text-white hover:border-gray-500 transition"
                >
                  Copy
                </button>
                <button
                  onClick={() => setCode("")}
                  className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3 py-2 text-xs text-gray-300 hover:text-white hover:border-gray-500 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="h-[520px]">
              <CodeEditor value={code} onChange={setCode} language={language} />
            </div>

            <div className="px-4 py-3 border-t border-[#1F2937] flex items-center justify-between text-xs text-gray-500">
              <span>Tip: Paste any code. The explanation panel supports long, example-rich output.</span>
              <span>{code.trim().length} chars</span>
            </div>
          </section>

          <section className="rounded-2xl border border-[#1F2937] bg-[#0E1526] shadow-[0_12px_36px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937]">
              <div className="flex items-center gap-2">
                <TabButton active={activeTab === "explanation"} onClick={() => setActiveTab("explanation")}>
                  Explanation
                </TabButton>
                <TabButton active={activeTab === "mistakes"} onClick={() => setActiveTab("mistakes")}>
                  Mistakes ({mistakes.length})
                </TabButton>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(activeTab === "explanation" ? explanation : formatMistakes(mistakes))}
                  className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3 py-2 text-xs text-gray-300 hover:text-white hover:border-gray-500 transition"
                >
                  Copy
                </button>
                <button
                  onClick={handleClear}
                  className="rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3 py-2 text-xs text-gray-300 hover:text-white hover:border-gray-500 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="p-4">
              {activeTab === "explanation" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {loading ? "Generating…" : requestMs != null ? `Done in ${requestMs}ms` : "Ready"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Mode: <span className="text-gray-300">{mode}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F19] p-4 min-h-[420px]">
                    {loading && !explanation ? (
                      <Skeleton />
                    ) : explanation ? (
                      <pre className="whitespace-pre-wrap text-sm leading-6 text-gray-200">{explanation}</pre>
                    ) : (
                      <EmptyState title="No explanation yet" desc="Click Explain to generate a long explanation with examples." />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="rounded-lg border border-[#1F2937] bg-[#0B0F19] px-2 py-1">Streaming</span>
                    <span className="rounded-lg border border-[#1F2937] bg-[#0B0F19] px-2 py-1">Examples</span>
                    <span className="rounded-lg border border-[#1F2937] bg-[#0B0F19] px-2 py-1">Beginner-friendly</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-gray-500">
                    Instant analysis (client-side) + AI mistakes when available.
                  </div>

                  <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F19] p-4 min-h-[420px]">
                    {mistakes.length === 0 ? (
                      <EmptyState
                        title="No obvious beginner mistakes detected"
                        desc="Try introducing a syntax error (missing quote, brace, semicolon) and it should show up."
                      />
                    ) : (
                      <div className="space-y-3">
                        {mistakes.map((m) => (
                          <div key={m.id} className="rounded-2xl border border-[#1F2937] bg-[#0E1526] p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-medium text-gray-100">{m.title}</div>
                              <span
                                className={cx(
                                  "text-[11px] rounded-full border px-2 py-0.5",
                                  m.severity === "warning"
                                    ? "border-yellow-500/40 text-yellow-300"
                                    : "border-blue-500/40 text-blue-300"
                                )}
                              >
                                {m.severity}
                              </span>
                            </div>

                            <div className="mt-2 text-sm text-gray-300 leading-6">
                              <div className="text-gray-400">Why it matters</div>
                              <div>{m.why}</div>
                            </div>

                            <div className="mt-3 text-sm text-gray-300 leading-6">
                              <div className="text-gray-400">How to fix</div>
                              <div className="whitespace-pre-wrap">{m.fix}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {aiMistakesRaw ? (
                    <div className="text-xs text-gray-500">
                      AI mistakes were included in this count.
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      Tip: Some issues are semantic. AI Explain will catch more.
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* ---------- UI bits ---------- */

function Pill({ label }: { label: string }) {
  return (
    <span className="text-xs text-gray-300 rounded-full border border-[#1F2937] bg-[#0E1526] px-3 py-1">
      {label}
    </span>
  );
}

function Dot({ color }: { color: string }) {
  return <span className={cx("h-2.5 w-2.5 rounded-full", color)} />;
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "rounded-xl px-4 py-2 text-sm transition",
        active
          ? "bg-indigo-500 text-white shadow"
          : "bg-[#0B0F19] text-gray-300 border border-[#1F2937] hover:text-white hover:border-gray-500"
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center px-6">
      <div className="text-base font-semibold text-gray-200">{title}</div>
      <div className="mt-2 text-sm text-gray-400 max-w-md">{desc}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-2/3 rounded bg-[#111827]" />
      <div className="h-4 w-full rounded bg-[#111827]" />
      <div className="h-4 w-11/12 rounded bg-[#111827]" />
      <div className="h-4 w-10/12 rounded bg-[#111827]" />
      <div className="h-4 w-2/3 rounded bg-[#111827]" />
      <div className="h-4 w-full rounded bg-[#111827]" />
      <div className="h-4 w-9/12 rounded bg-[#111827]" />
    </div>
  );
}

/* ---------- Mistake detection (fast, client-side) ---------- */
/**
 * This version is intentionally "broad" so it catches mistakes in ANY language:
 * - unmatched quotes/brackets
 * - missing semicolons (for semicolon languages)
 * - invalid JSON
 * - yaml tabs
 * - common kotlin println mistakes etc.
 *
 * It will finally stop showing "0" when something is clearly wrong.
 */
function detectMistakes(code: string, language: string): Mistake[] {
  const c = code ?? "";
  const results: Mistake[] = [];

  const push = (m: Omit<Mistake, "id">) => {
    results.push({ id: `${results.length}-${m.title}`, ...m });
  };

  const lines = c.split(/\r?\n/);

  // ---------- Generic bracket matching ----------
  const pairs: Array<[string, string, string]> = [
    ["(", ")", "parentheses"],
    ["{", "}", "braces"],
    ["[", "]", "brackets"],
  ];

  for (const [open, close, name] of pairs) {
    let balance = 0;
    for (const ch of c) {
      if (ch === open) balance++;
      if (ch === close) balance--;
    }
    if (balance !== 0) {
      push({
        title: `Unmatched ${name}`,
        why: `Your code has an unequal number of ${open} and ${close}. This often causes syntax errors or broken blocks.`,
        fix: `Check your ${name} and ensure every "${open}" has a matching "${close}".`,
        severity: "warning",
      });
    }
  }

  // ---------- Generic quote matching (simple but effective) ----------
  const countUnescaped = (text: string, quote: string) => {
    let count = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === quote && text[i - 1] !== "\\") count++;
    }
    return count;
  };
  const dq = countUnescaped(c, '"');
  const sq = countUnescaped(c, "'");
  if (dq % 2 !== 0) {
    push({
      title: 'Unmatched double quote (")',
      why: "A missing quote breaks strings and can cause the whole file to fail parsing.",
      fix: 'Find the string that is missing a closing ".',
      severity: "warning",
    });
  }
  if (sq % 2 !== 0 && language !== "python") {
    // Python can have triple quotes and lots of legit apostrophes; keep it lighter there.
    push({
      title: "Unmatched single quote (')",
      why: "A missing quote breaks strings and can cause syntax errors.",
      fix: "Find the string that is missing a closing '.",
      severity: "warning",
    });
  }

  // ---------- Universal beginner mistakes ----------
  if (/\bTODO\b/i.test(c)) {
    push({
      title: "Left a TODO in code",
      why: "TODOs are easy to forget and can hide unfinished logic.",
      fix: "Implement it or remove the TODO before shipping.",
      severity: "info",
    });
  }

  // ---------- JSON ----------
  if (language === "json") {
    try {
      JSON.parse(c);
    } catch {
      push({
        title: "Invalid JSON",
        why: "JSON must be strictly valid (quotes, commas, no trailing commas).",
        fix: "Check quotes, commas, and remove trailing commas.",
        severity: "warning",
      });
    }
  }

  // ---------- YAML ----------
  if (language === "yaml") {
    if (/\t/.test(c)) {
      push({
        title: "Tabs used in YAML",
        why: "YAML does not allow tabs for indentation.",
        fix: "Replace tabs with spaces.",
        severity: "warning",
      });
    }
  }

  // ---------- Semicolon languages (broad heuristic) ----------
  const needsSemicolons = new Set(["javascript", "typescript", "c", "cpp", "java", "csharp", "php", "swift"]);
  if (needsSemicolons.has(language)) {
    const bad = lines.some((ln) => {
      const t = ln.trim();
      if (!t) return false;
      if (t.startsWith("//") || t.startsWith("#")) return false;
      if (t.endsWith("{") || t.endsWith("}") || t.endsWith(";") || t.endsWith(",")) return false;
      if (t.startsWith("if ") || t.startsWith("if(") || t.startsWith("for ") || t.startsWith("for(")) return false;
      if (t.startsWith("while ") || t.startsWith("while(") || t.startsWith("switch") || t.startsWith("else")) return false;
      if (t.includes("=>")) return false;
      // likely a statement missing ;
      return /[A-Za-z0-9"')\]]$/.test(t);
    });

    if (bad) {
      push({
        title: "Possible missing semicolon",
        why: "In this language, statements often require semicolons. Missing them can break parsing or cause weird errors.",
        fix: "Check lines that end with a statement and add `;` where appropriate.",
        severity: "warning",
      });
    }
  }

  // ---------- JS/TS specifics ----------
  if (language === "javascript" || language === "typescript") {
    if (/\bconsole\.log\(/.test(c)) {
      push({
        title: "Debug logs in production path",
        why: "console.log can leak data and clutter logs.",
        fix: "Remove logs or guard them behind a debug flag.",
        severity: "info",
      });
    }

    if (/==[^=]/.test(c)) {
      push({
        title: "Using == instead of ===",
        why: "== performs type coercion and can cause surprising comparisons.",
        fix: "Use === for strict equality.",
        severity: "warning",
      });
    }
  }

  // ---------- Python ----------
  if (language === "python") {
    if (/\bprint\(/.test(c) && /\binput\(/.test(c) && !/try:/.test(c)) {
      push({
        title: "No error handling around input",
        why: "User input can fail (empty, wrong type) and crash your program.",
        fix: "Wrap parsing in try/except and validate input before using it.",
        severity: "warning",
      });
    }
  }

  // ---------- Kotlin ----------
  if (language === "kotlin") {
    if (/println\(\s*[A-Za-z_]+\s*\)/.test(c)) {
      push({
        title: "println without quotes",
        why: "In Kotlin, text must be wrapped in quotes. Otherwise it's treated as a variable.",
        fix: 'Use: println("Hello, Kashish")',
        severity: "warning",
      });
    }

    if (/println\([^)]*,[^)]*\)/.test(c)) {
      push({
        title: "Comma used inside println",
        why: "println accepts a single argument. A comma inside usually means invalid syntax or wrong call.",
        fix: 'Use string templates: println("Hello, $name")',
        severity: "warning",
      });
    }

    if (!/fun\s+main\s*\(/.test(c)) {
      push({
        title: "Missing main function",
        why: "Kotlin programs need a main() entry point to run.",
        fix: "Add:\nfun main() {\n  // code here\n}",
        severity: "info",
      });
    }
  }

  // ---------- HTML ----------
  if (language === "html") {
    if (!/<!DOCTYPE html>/i.test(c)) {
      push({
        title: "Missing <!DOCTYPE html>",
        why: "Without a doctype, browsers can render in quirks mode.",
        fix: "Add `<!DOCTYPE html>` at the top of the file.",
        severity: "info",
      });
    }
    if (!/<html[\s>]/i.test(c) || !/<\/html>/i.test(c)) {
      push({
        title: "Missing <html> root tags",
        why: "HTML documents should have <html>...</html> wrapping the page.",
        fix: "Wrap your document in <html> ... </html>.",
        severity: "info",
      });
    }
  }

  // ---------- SQL ----------
  if (language === "sql") {
    if (/select\s+\*/i.test(c)) {
      push({
        title: "SELECT * used",
        why: "Selecting all columns can be slower and unclear.",
        fix: "Select only the columns you need.",
        severity: "info",
      });
    }
  }

  // ---------- Bash ----------
  if (language === "bash") {
    if (/echo\s+\$[A-Za-z_]+\s+\$[A-Za-z_]+/.test(c)) {
      push({
        title: "Unquoted variables",
        why: "Unquoted variables can break when they contain spaces.",
        fix: 'Use: echo "$var1 $var2"',
        severity: "warning",
      });
    }
  }

  // ---------- Very long lines ----------
  if (lines.some((line) => line.length > 140)) {
    push({
      title: "Very long lines detected",
      why: "Long lines reduce readability and debugging speed.",
      fix: "Break expressions and format your code.",
      severity: "info",
    });
  }

  return results;
}

function formatMistakes(list: Mistake[]) {
  if (list.length === 0) return "No obvious beginner mistakes detected.";
  return list
    .map((m, i) => `${i + 1}. ${m.title}\n- Why: ${m.why}\n- Fix: ${m.fix}\n`)
    .join("\n");
}
