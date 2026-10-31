import Image from "next/image"
import { SIZE_CHART_MEASURE_TIPS } from "./size-chart-data"

type SizeChartPanelProps = {
  imageUrl?: string | null
}

export function SizeChartPanel({ imageUrl }: SizeChartPanelProps) {
  return (
    <div className="size-chart">
      <div className="size-chart__tip">
        <div className="size-chart__tip-icon" aria-hidden>
          💡
        </div>
        <div>
          <h4 className="size-chart__tip-title">Pro Tip</h4>
          <p className="size-chart__tip-text">
            Measure yourself in inches before ordering. If you are between sizes,
            choose the larger size for a comfortable ethnic fit. For saree blouses,
            match your bust measurement to the blouse size chart.
          </p>
        </div>
      </div>

      <div className="size-chart__measure">
        <h4 className="size-chart__section-title">How to measure</h4>
        <ul className="size-chart__measure-list">
          {SIZE_CHART_MEASURE_TIPS.map((tip) => (
            <li key={tip.title}>
              <strong>{tip.title}:</strong> {tip.text}
            </li>
          ))}
        </ul>
      </div>

      {imageUrl && (
        <div className="size-chart__image-wrap">
          <Image
            src={imageUrl}
            alt="Size chart"
            width={800}
            height={1000}
            className="size-chart__image"
            sizes="(max-width: 768px) 100vw, 420px"
          />
        </div>
      )}
    </div>
  )
}
