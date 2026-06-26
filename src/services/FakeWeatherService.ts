import type { Coordinates } from "@/features/capture/captureTypes";
import type { WeatherResult, WeatherService } from "./WeatherService";

export const createFakeWeatherService = (
  result: WeatherResult = {
    ok: true,
    weather: { temperatureCelsius: 22.5, condition: "Clear" },
  },
): WeatherService & {
  requestCount: () => number;
  lastCoordinates: () => Coordinates | null;
} => {
  let count = 0;
  let lastCoords: Coordinates | null = null;

  return {
    getCurrentWeather: async (coordinates) => {
      count += 1;
      lastCoords = coordinates;
      return result;
    },
    requestCount: () => count,
    lastCoordinates: () => lastCoords,
  };
};
