"use client"

import { useState } from "react"
import Link from "next/link"
import { Copy, Check } from "lucide-react"

export default function PromoBarContent({ text, code: explicitCode, value: explicitValue }: { text: string; code: string | null; value: string | null }) {
  const [copied, setCopied] = useState(false)

  // Regex for code and value
  const codeRegex = /\b[A-Z0-9]{4,}\b/;
  const valueRegex = /(\d+%\s?(OFF)?)|([₹$]\d+)|(\d+\s?(Rs|₹|%|OFF))/gi;

  let currentText = text;
  let codeToCopy = explicitCode || "";
  
  // Find code part
  let codeMatch = explicitCode && currentText.includes(explicitCode) 
    ? { text: explicitCode, index: currentText.indexOf(explicitCode) }
    : null;

  if (!codeMatch) {
    const regMatch = currentText.match(codeRegex);
    if (regMatch) {
      codeMatch = { text: regMatch[0], index: regMatch.index! };
      if (!explicitCode) codeToCopy = regMatch[0];
    }
  }

  // Find value part
  let valueMatch = explicitValue && currentText.includes(explicitValue)
    ? { text: explicitValue, index: currentText.indexOf(explicitValue) }
    : null;

  if (!valueMatch) {
    const regMatch = Array.from(currentText.matchAll(valueRegex));
    if (regMatch.length > 0) {
      const firstValue = regMatch[0];
      valueMatch = { text: firstValue[0], index: firstValue.index! };
    }
  }

  // Handle priority: if explicitCode/explicitValue exist but not found in text, 
  // we replace the detected ones or append if none detected? 
  // User said "replace" essentially by saying priority.

  // To render precisely, we need to collect all segments.
  const segments: Array<{ text: string; type: 'text' | 'code' | 'value' }> = [];
  let lastIndex = 0;

  const matches = [
    ...(codeMatch ? [{ ...codeMatch, type: 'code' as const }] : []),
    ...(valueMatch ? [{ ...valueMatch, type: 'value' as const }] : [])
  ].sort((a, b) => a.index - b.index);

  // Avoid overlaps
  let filteredMatches: typeof matches = [];
  let currentPos = 0;
  for (const match of matches) {
    if (match.index >= currentPos) {
      filteredMatches.push(match);
      currentPos = match.index + match.text.length;
    }
  }

  filteredMatches.forEach(match => {
    if (match.index > lastIndex) {
      segments.push({ text: currentText.substring(lastIndex, match.index), type: 'text' });
    }
    
    // Use explicit values if they exist, even if the text match was different (Priority logic)
    const displayText = match.type === 'code' ? (explicitCode || match.text) : (explicitValue || match.text);
    segments.push({ text: displayText, type: match.type });
    lastIndex = match.index + match.text.length;
  });

  if (lastIndex < currentText.length) {
    segments.push({ text: currentText.substring(lastIndex), type: 'text' });
  }

  // Fallback for cases where no match was found but explicit values exist: 
  // (Optional: we could append them, but usually text should contain them)

  const handleCopy = () => {
    navigator.clipboard.writeText(codeToCopy || text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-[1440px] mx-auto w-full relative z-10 flex flex-row items-center justify-start lg:justify-center gap-x-4 text-center font-medium overflow-hidden whitespace-nowrap py-0.5">
      {/* Visual Feedback Overlay for Copy Success - Mobile Only */}
      {copied && (
        <div className="absolute inset-0 z-50 flex sm:hidden items-center justify-center bg-gradient-to-r from-[#8B5AB1] via-[#9B6BC1] to-[#8B5AB1] animate-in fade-in zoom-in duration-200">
          <span className="text-yellow-300 text-[11px] sm:text-[13px] font-extrabold tracking-wider uppercase flex items-center gap-2 drop-shadow-md">
            PROMOCODE COPIED! APPLY AT CHECKOUT 🎁
          </span>
        </div>
      )}

      <div className="flex items-center lg:animate-none animate-marquee whitespace-nowrap min-w-full lg:min-w-0">
        <button 
          onClick={handleCopy}
          className="group/btn flex items-center justify-center gap-1.5 focus:outline-none flex-shrink-0"
          title={codeToCopy ? `Click to copy promo code: ${codeToCopy}` : "Click to copy"}
        >
          {/* Main Content Segment */}
          <div className="flex items-center gap-1.5 px-2 sm:px-0">
            <span className="text-[11px] sm:text-[12.5px] font-bold tracking-[0.05em] uppercase drop-shadow-sm group-hover/btn:text-yellow-100 transition-colors flex items-center">
              {segments.length > 0 ? segments.map((s, i) => (
                s.type === 'text' ? (
                  <span key={i}>{s.text}</span>
                ) : (
                  <span key={i} className="text-yellow-300 text-[12px] sm:text-[13.5px] mx-1 font-extrabold shadow-sm group-hover/btn:text-yellow-200 transition-colors drop-shadow-md">
                    "{s.text}"
                  </span>
                )
              )) : text}
            </span>
            <span className="bg-white/20 p-1 rounded-md group-hover/btn:bg-white/30 transition-colors flex items-center justify-center flex-shrink-0 ml-1">
              {copied ? (
                <Check size={13} className="text-green-300" strokeWidth={3} />
              ) : (
                <Copy size={13} className="text-white/80 group-hover/btn:text-white" strokeWidth={2.5} />
              )}
            </span>
          </div>
        </button>
 
        <div className="mx-4 h-3 w-px bg-white/30 flex-shrink-0" />
 
        <Link 
          href="/store" 
          className="text-[11px] sm:text-[12.5px] font-bold tracking-[0.02em] uppercase text-yellow-300 hover:text-white underline underline-offset-4 decoration-white/40 hover:decoration-white transition-all flex items-center group/link flex-shrink-0 mr-8 sm:mr-0"
        >
          SHOP NOW
          <svg 
            className="ml-1 w-3 h-3 transform group-hover/link:translate-x-1 transition-transform" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
 
        {/* Duplicated Content for Seamless Loop on Mobile and Tablet */}
        <div className="flex lg:hidden items-center gap-x-4">
          <div className="mx-4 h-3 w-px bg-white/30 flex-shrink-0" />
          <div className="flex items-center gap-1.5 px-2">
            <span className="text-[11px] font-bold tracking-[0.05em] uppercase drop-shadow-sm flex items-center">
              {segments.length > 0 ? segments.map((s, i) => (
                s.type === 'text' ? (
                  <span key={i}>{s.text}</span>
                ) : (
                  <span key={i} className="text-yellow-300 text-[12px] mx-1 font-extrabold">
                    "{s.text}"
                  </span>
                )
              )) : text}
            </span>
            <span className="bg-white/20 p-1 rounded-md flex items-center justify-center flex-shrink-0 ml-1">
              <Copy size={13} className="text-white/80" strokeWidth={2.5} />
            </span>
          </div>
          <div className="mx-4 h-3 w-px bg-white/30 flex-shrink-0" />
          <span className="text-[11px] font-bold tracking-[0.02em] uppercase text-yellow-300 flex items-center mr-8">
            SHOP NOW
          </span>
        </div>
      </div>
    </div>
  )
}
