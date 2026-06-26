import type {
  AppError,
  Coordinates,
  WeatherSummary,
} from "@/features/capture/captureTypes";

export type WeatherResult =
  | { ok: true; weather: WeatherSummary }
  | { ok: false; error: AppError };

export type WeatherService = {
  getCurrentWeather: (coordinates: Coordinates) => Promise<WeatherResult>;
};

const networkUnavailableError = (): AppError => ({
  type: "networkUnavailable",
  message: "Network is unavailable. Please try again.",
  retryable: true,
});

const weatherFailedError = (): AppError => ({
  type: "weatherFailed",
  message: "Weather data could not be loaded.",
  retryable: true,
});

const weatherCodeToCondition = (code: number): string => {
  if (code === 0) return "Clear";
  if (code === 1 || code === 2 || code === 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 95 && code <= 99) return "Thunderstorm";

  return "Unknown";
};

const buildOpenMeteoUrl = (coordinates: Coordinates): string => {
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    current: "temperature_2m,weather_code",
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
};

const parseOpenMeteoWeather = (payload: unknown): WeatherSummary => {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("current" in payload) ||
    typeof payload.current !== "object" ||
    payload.current === null
  ) {
    throw new Error("Invalid weather payload");
  }

  const current = payload.current as Record<string, unknown>;
  const temperature = current.temperature_2m;
  const weatherCode = current.weather_code;

  if (typeof temperature !== "number" || typeof weatherCode !== "number") {
    throw new Error("Invalid weather fields");
  }

  return {
    temperatureCelsius: temperature,
    condition: weatherCodeToCondition(weatherCode),
  };
};

export const createWeatherService = (): WeatherService => ({
  getCurrentWeather: async (coordinates) => {
    let response: Response;

    try {
      response = await fetch(buildOpenMeteoUrl(coordinates));
    } catch {
      return { ok: false, error: networkUnavailableError() };
    }

    if (!response.ok) {
      return { ok: false, error: weatherFailedError() };
    }

    try {
      const payload = await response.json();
      const weather = parseOpenMeteoWeather(payload);

      return { ok: true, weather };
    } catch {
      return { ok: false, error: weatherFailedError() };
    }
  },
});
