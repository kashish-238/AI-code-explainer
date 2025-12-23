import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#1F2937] bg-[#0B0F19]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left */}
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()}{" "}
            <span className="text-gray-200 font-medium">ClearCode</span>.  
            Built to help developers understand code better.
          </div>

          {/* Right */}
          <div className="flex items-center gap-4 text-sm">

            <a
              href="https://github.com/kashish-238"
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-white transition"
            >
              GitHub
            </a>

            <span className="text-gray-600">•</span>

            <span className="text-gray-500">
              Made with ❤️ by Kashish
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
