"use client";

import Link from "next/link";
import Image from "next/image";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1F2937] bg-[#0B0F19]/85 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo + Name */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-90 transition"
          >
            {/* ✅ SVG from /public — THIS IS THE FIX */}
            <Image
              src="/clearcode-icon.svg"
              alt="ClearCode logo"
              width={28}
              height={28}
              priority
              className="drop-shadow-[0_0_6px_rgba(99,102,241,0.35)]"
            />

            <span className="text-lg font-semibold tracking-tight text-white">
              ClearCode
            </span>
          </Link>

          {/* Right-side links (keep minimal for clean UI) */}
          <nav className="flex items-center gap-6 text-sm text-gray-300">
            <Link
              href="/explain"
              className="hover:text-white transition"
            >
              Explain
            </Link>

            <Link
              href="https://github.com"
              target="_blank"
              className="hover:text-white transition"
            >
              GitHub
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
