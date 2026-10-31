"use client"

import { clx } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { getMetadataFieldDisplayValue } from "./product-metadata-fields"

function getMetadataDisplay(
  metadata: Record<string, unknown> | null | undefined,
  key: string
) {
  return getMetadataFieldDisplayValue(metadata, key)
}

export function ProductHighlightsSection({ product }: { product: HttpTypes.StoreProduct }) {
  return (
    <div className="product-highlights flex flex-col gap-6 py-8 border-t border-[#e5e5e5]">
      <div className="flex items-center gap-3">
        <div className="product-highlights__accent" aria-hidden />
        <h3 className="product-highlights__title">Product highlights</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2">
        {(() => {
          // Extract unique colors from variants/options instead of metadata
          const colorOpt = product.options?.find((opt: HttpTypes.StoreProductOption) =>
            opt.title?.toLowerCase().includes("color") ||
            opt.title?.toLowerCase().includes("colour")
          )
          const variantColors =
            colorOpt?.values?.map((v: { value?: string }) => v.value).filter(Boolean) || []
          const uniqueColors = Array.from(new Set(variantColors))
          const colorValue = uniqueColors.length > 0 ? uniqueColors.join(', ') : null

          const highlights = [
            { id: 'style', label: "Style", value: getMetadataDisplay(product.metadata, 'style'), icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
            { id: 'fabric', label: "Fabric", value: getMetadataDisplay(product.metadata, 'fabric'), icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
            { id: 'weave_pattern', label: "Weave Pattern", value: getMetadataDisplay(product.metadata, 'weave_pattern'), icon: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z' },
            { id: 'top_length', label: "Top Length", value: getMetadataDisplay(product.metadata, 'top_length'), icon: 'M12 19V5M5 12l7-7 7 7' },
            { id: 'color', label: "Available Colors", value: colorValue, icon: 'M12 2.25l-7.5 12.13a6.75 6.75 0 1015 0L12 2.25z' },
          ].filter(h => h.value)

          return highlights.map((highlight) => (
            <div 
              key={highlight.id} 
              className={clx(
                "product-highlights__card group flex items-center gap-3 sm:gap-4 p-3 sm:p-4",
                highlight.id === 'color' && "col-span-2"
              )}
            >
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-surface-muted flex items-center justify-center group-hover:bg-purple-50 transition-all duration-300 shadow-inner overflow-hidden">
                {highlight.id === 'color' ? (
                  <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform group-hover:scale-110 transition-transform duration-300">
                    {/* Palette Body */}
                    <path d="M75 55c0 15-12 27-27 27S21 70 21 55s12-27 27-27 27 12 27 27z" fill="#E8B088" stroke="#333" strokeWidth="3" />
                    
                    {/* Color Dots */}
                    <circle cx="40" cy="45" r="5" fill="#FF4D4D" stroke="#333" strokeWidth="1.5" /> {/* Red */}
                    <circle cx="56" cy="46" r="5" fill="#2ECC71" stroke="#333" strokeWidth="1.5" /> {/* Green */}
                    <circle cx="42" cy="62" r="5" fill="#3498DB" stroke="#333" strokeWidth="1.5" /> {/* Blue */}
                    <circle cx="58" cy="64" r="5" fill="#F06292" stroke="#333" strokeWidth="1.5" /> {/* Pink */}
                    
                    {/* Brush */}
                    <g transform="rotate(25 70 40)">
                      <rect x="68" y="15" width="6" height="35" rx="3" fill="#F39C12" stroke="#333" strokeWidth="2" /> {/* Handle */}
                      <path d="M68 12c0-4 3-8 3-8s3 4 3 8H68z" fill="#AED6F1" stroke="#333" strokeWidth="2" /> {/* Tip */}
                      <rect x="68" y="45" width="6" height="4" fill="#BDC3C7" stroke="#333" strokeWidth="1.5" /> {/* Ferrule */}
                    </g>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-brand-accent">
                    <path d={highlight.icon} />
                  </svg>
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[9px] sm:text-[10px] font-black text-gray-800 uppercase tracking-widest mb-0.5 sm:mb-1">{highlight.label}</span>
                <div className="flex items-center gap-2">
                  {highlight.id === 'color' ? (
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {String(highlight.value || '').split(/[,\s]+/).map((color, i) => {
                        const trimmedColor = color.trim().toLowerCase()
                        if (!trimmedColor) return null
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <div 
                              className="w-3.5 h-3.5 rounded-full border border-gray-100 shadow-sm"
                              style={{ backgroundColor: trimmedColor }}
                            />
                            <span className="text-sm text-gray-800 font-semibold capitalize leading-none tracking-tight">{trimmedColor}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-xs sm:text-sm text-gray-800 font-semibold tracking-tight truncate">
                      {String(highlight.value || '')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        })()}
      </div>
    </div>
  )
}
