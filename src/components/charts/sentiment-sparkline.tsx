"use client";

interface SparklineProps {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function SentimentSparkline({
  points,
  width = 60,
  height = 20,
  color = "#00ff88",
}: SparklineProps) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${x},${y}`;
  });

  const lastPoint = points[points.length - 1];
  const endColor = lastPoint > 0 ? "#00ff88" : lastPoint < 0 ? "#ff4444" : "#ffaa00";

  return (
    <svg width={width} height={height} className="inline-block align-middle">
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={(points.length - 1) / (points.length - 1) * width}
        cy={height - ((lastPoint - min) / range) * height}
        r="2"
        fill={endColor}
      />
    </svg>
  );
}
