import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#0B0F19",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* ClearCode Logo */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left brace */}
          <path
            d="M22 14C16 18 14 22 14 32C14 42 16 46 22 50"
            stroke="#A5B4FC"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Right brace */}
          <path
            d="M42 14C48 18 50 22 50 32C50 42 48 46 42 50"
            stroke="#A5B4FC"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Center execution line */}
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
      </div>
    ),
    size
  );
}
