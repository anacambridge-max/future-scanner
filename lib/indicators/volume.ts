export type VolumeBar = {
  timestamp: string | Date;
  volume: number;
};

export type VolumeAnalysis = {
  currentVolume: number;
  averageVolume: number | null;
  relativeVolume: number | null;
  volumeRatio: number | null;
  isVolumeSpike: boolean;
  isAboveAverage: boolean;
  sampleSize: number;
  period: number;
};

export type VolumeConfig = {
  period?: number;
  spikeThreshold?: number;
  minSamples?: number;
};

const DEFAULT_PERIOD = 20;
const DEFAULT_SPIKE_THRESHOLD = 1.5;
const DEFAULT_MIN_SAMPLES = 5;

function validVolume(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Calculates simple average volume from the preceding bars.
 * The current bar is intentionally excluded from the baseline.
 */
export function averageVolume(
  volumes: number[],
  period = DEFAULT_PERIOD,
): number | null {
  if (!Number.isInteger(period) || period <= 0) return null;
  const valid = volumes.filter(validVolume);
  if (valid.length < period) return null;
  const sample = valid.slice(-period);
  return sample.reduce((sum, value) => sum + value, 0) / period;
}

/**
 * Relative volume = current volume / average volume baseline.
 */
export function relativeVolume(
  currentVolume: number,
  previousVolumes: number[],
  period = DEFAULT_PERIOD,
): number | null {
  if (!validVolume(currentVolume)) return null;
  const avg = averageVolume(previousVolumes, period);
  if (avg === null || avg <= 0) return null;
  return currentVolume / avg;
}

export function analyzeVolume(
  bars: VolumeBar[],
  config: VolumeConfig = {},
): VolumeAnalysis {
  const period = config.period ?? DEFAULT_PERIOD;
  const spikeThreshold = config.spikeThreshold ?? DEFAULT_SPIKE_THRESHOLD;
  const minSamples = config.minSamples ?? DEFAULT_MIN_SAMPLES;

  if (!Number.isInteger(period) || period <= 0) {
    throw new Error("Volume period must be a positive integer");
  }
  if (!Number.isFinite(spikeThreshold) || spikeThreshold <= 0) {
    throw new Error("Volume spike threshold must be greater than zero");
  }
  if (!Number.isInteger(minSamples) || minSamples < 1) {
    throw new Error("Minimum volume samples must be a positive integer");
  }
  if (bars.length === 0) {
    return {
      currentVolume: 0,
      averageVolume: null,
      relativeVolume: null,
      volumeRatio: null,
      isVolumeSpike: false,
      isAboveAverage: false,
      sampleSize: 0,
      period,
    };
  }

  const current = bars[bars.length - 1];
  const previous = bars.slice(0, -1).filter((bar) => validVolume(bar.volume));
  const baseline = previous.slice(-period);
  const avg = baseline.length >= Math.max(period, minSamples)
    ? baseline.reduce((sum, bar) => sum + bar.volume, 0) / baseline.length
    : null;
  const rv = avg !== null && avg > 0 ? current.volume / avg : null;

  return {
    currentVolume: current.volume,
    averageVolume: avg,
    relativeVolume: rv,
    volumeRatio: rv,
    isVolumeSpike: rv !== null && rv >= spikeThreshold,
    isAboveAverage: rv !== null && rv > 1,
    sampleSize: baseline.length,
    period,
  };
}
