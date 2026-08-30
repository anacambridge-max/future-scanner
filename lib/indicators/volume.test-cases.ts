import { analyzeVolume, averageVolume, relativeVolume } from "./volume";

export const volumeEngineAcceptanceCases = {
  averageVolume: averageVolume([100, 110, 90, 100, 100], 5) === 100,
  relativeVolume: relativeVolume(200, [100, 100, 100, 100, 100], 5) === 2,
  insufficientHistory: relativeVolume(200, [100, 100], 5) === null,
  spike: analyzeVolume(
    [
      { timestamp: "2026-01-01T09:15:00+05:30", volume: 100 },
      { timestamp: "2026-01-01T09:20:00+05:30", volume: 100 },
      { timestamp: "2026-01-01T09:25:00+05:30", volume: 100 },
      { timestamp: "2026-01-01T09:30:00+05:30", volume: 200 },
    ],
    { period: 3, spikeThreshold: 1.5, minSamples: 3 },
  ).isVolumeSpike,
};
