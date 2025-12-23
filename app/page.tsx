import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0B0F19] text-white overflow-hidden">
      {/* HERO */}
      <section className="relative px-6 pt-32 pb-36">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/20 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Understand Code.
            <span className="text-indigo-400"> Learn Smarter.</span>
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI-powered code explanations with intelligent beginner mistake detection.
          </p>

          <div className="flex justify-center gap-4 pt-4">
            <Link
              href="/explain"
              className="bg-indigo-500 hover:bg-indigo-600 transition px-8 py-3 rounded-xl font-medium shadow-lg"
            >
              Start Explaining
            </Link>
            <a
              href="#features"
              className="px-8 py-3 rounded-xl border border-[#1F2937] text-gray-300 hover:text-white hover:border-gray-500 transition"
            >
              See Features
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-6 py-24 border-t border-[#1F2937]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            title="Plain-English Explanations"
            desc="Understand what your code is doing without jargon or confusion."
            demo={<ExplainDemo />}
          />

          <FeatureCard
            title="Beginner Mistake Detection"
            desc="Instantly see common mistakes and learn how to fix them."
            demo={<MistakeDemo />}
          />

          <FeatureCard
            title="VS Code–Like Editor"
            desc="Write and explore code in a familiar Monaco Editor environment."
            demo={<EditorDemo />}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-32">
        <div className="max-w-4xl mx-auto text-center bg-[#111827] border border-[#1F2937] rounded-2xl p-12 space-y-6">
          <h3 className="text-2xl font-semibold">
            Ready to actually understand your code?
          </h3>
          <Link
            href="/explain"
            className="inline-block bg-indigo-500 hover:bg-indigo-600 transition px-10 py-3 rounded-xl font-medium"
          >
            Try the Explainer
          </Link>
        </div>
      </section>
    </main>
  );
}

/* ---------- Feature Card ---------- */
function FeatureCard({
  title,
  desc,
  demo,
}: {
  title: string;
  desc: string;
  demo: React.ReactNode;
}) {
  return (
    <Link
      href="/explain"
      className="
        group relative bg-[#111827] border border-[#1F2937] rounded-2xl p-6
        cursor-pointer transition-all duration-300
        hover:-translate-y-1
        hover:border-indigo-400
        hover:shadow-[0_0_32px_rgba(99,102,241,0.25)]
      "
    >
      <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 opacity-0 group-hover:opacity-100 blur-2xl transition pointer-events-none" />

      <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-indigo-300 transition">
        {title}
      </h3>

      <p className="text-gray-400 text-sm">{desc}</p>

      {/* Demo (appears on hover) */}
      <div className="mt-4 opacity-0 group-hover:opacity-100 transition duration-300">
        {demo}
      </div>

      {/* Hover CTA */}
      <div className="mt-4 flex items-center gap-2 text-sm text-indigo-400 opacity-0 group-hover:opacity-100 transition">
        <span>Try in the editor</span>
        <span className="group-hover:translate-x-1 transition">→</span>
      </div>
    </Link>
  );
}

/* ---------- Demos ---------- */

function ExplainDemo() {
  return (
    <div className="rounded-lg bg-black/30 p-3 text-xs font-mono text-gray-300 animate-fadeIn">
      <p className="text-indigo-400">print("Hello")</p>
      <p className="mt-2 text-gray-400">→ Prints “Hello” to the console</p>
    </div>
  );
}

function MistakeDemo() {
  return (
    <div className="rounded-lg bg-black/30 p-3 text-xs font-mono animate-fadeIn">
      <p className="text-red-400">⚠ Missing return statement</p>
      <p className="mt-1 text-gray-400">Function may return undefined</p>
    </div>
  );
}

function EditorDemo() {
  return (
    <div className="rounded-lg bg-black/30 p-3 text-xs font-mono flex items-center gap-1">
      <span className="text-indigo-400 animate-blink">|</span>
      <span className="text-gray-400">Typing…</span>
    </div>
  );
}
