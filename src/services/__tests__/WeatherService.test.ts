import { createWeatherService } from "../WeatherService";
import { createFakeWeatherService } from "../FakeWeatherService";

const coordinates = { latitude: 37.7749, longitude: -122.4194 };

const jsonResponse = (payload: unknown, ok = true) =>
  ({
    ok,
    json: jest.fn().mockResolvedValue(payload),
  }) as unknown as Response;

describe("createWeatherService", () => {
  const originalFetch = globalThis.fetch;
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = mockFetch as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns Clear weather for weather_code 0 with URL assertions", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        current: { temperature_2m: 22.5, weather_code: 0 },
      }),
    );

    const service = createWeatherService();
    const result = await service.getCurrentWeather(coordinates);

    expect(result).toEqual({
      ok: true,
      weather: { temperatureCelsius: 22.5, condition: "Clear" },
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("latitude=37.7749"),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("longitude=-122.4194"),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("temperature_2m"),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("weather_code"),
    );
  });

  it("maps weather_code 61 to Rain", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        current: { temperature_2m: 18, weather_code: 61 },
      }),
    );

    const service = createWeatherService();
    const result = await service.getCurrentWeather(coordinates);

    expect(result).toEqual({
      ok: true,
      weather: { temperatureCelsius: 18, condition: "Rain" },
    });
  });

  it("maps unknown weather_code 999 to Unknown condition", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        current: { temperature_2m: 10, weather_code: 999 },
      }),
    );

    const service = createWeatherService();
    const result = await service.getCurrentWeather(coordinates);

    expect(result).toEqual({
      ok: true,
      weather: { temperatureCelsius: 10, condition: "Unknown" },
    });
  });

  it("returns weatherFailed when response is not ok", async () => {
    mockFetch.mockResolvedValue(jsonResponse({}, false));

    const service = createWeatherService();
    const result = await service.getCurrentWeather(coordinates);

    expect(result).toEqual({
      ok: false,
      error: {
        type: "weatherFailed",
        message: "Weather data could not be loaded.",
        retryable: true,
      },
    });
  });

  it("returns networkUnavailable when fetch rejects", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));

    const service = createWeatherService();
    const result = await service.getCurrentWeather(coordinates);

    expect(result).toEqual({
      ok: false,
      error: {
        type: "networkUnavailable",
        message: "Network is unavailable. Please try again.",
        retryable: true,
      },
    });
  });

  it("returns weatherFailed when json() rejects", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockRejectedValue(new Error("parse error")),
    } as unknown as Response);

    const service = createWeatherService();
    const result = await service.getCurrentWeather(coordinates);

    expect(result).toEqual({
      ok: false,
      error: {
        type: "weatherFailed",
        message: "Weather data could not be loaded.",
        retryable: true,
      },
    });
  });

  it("returns weatherFailed when temperature_2m is missing", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        current: { weather_code: 0 },
      }),
    );

    const service = createWeatherService();
    const result = await service.getCurrentWeather(coordinates);

    expect(result).toEqual({
      ok: false,
      error: {
        type: "weatherFailed",
        message: "Weather data could not be loaded.",
        retryable: true,
      },
    });
  });
});

describe("createFakeWeatherService", () => {
  it("returns default weather result", async () => {
    const fake = createFakeWeatherService();
    const result = await fake.getCurrentWeather(coordinates);

    expect(result).toEqual({
      ok: true,
      weather: { temperatureCelsius: 22.5, condition: "Clear" },
    });
    expect(fake.requestCount()).toBe(1);
    expect(fake.lastCoordinates()).toEqual(coordinates);
  });

  it("returns configured network failure result", async () => {
    const networkError = {
      ok: false as const,
      error: {
        type: "networkUnavailable" as const,
        message: "Network is unavailable. Please try again.",
        retryable: true as const,
      },
    };
    const fake = createFakeWeatherService(networkError);
    const result = await fake.getCurrentWeather(coordinates);

    expect(result).toEqual(networkError);
    expect(fake.lastCoordinates()).toEqual(coordinates);
  });

  it("increments requestCount and tracks last coordinates", async () => {
    const fake = createFakeWeatherService();
    const secondCoords = { latitude: 40.7128, longitude: -74.006 };

    await fake.getCurrentWeather(coordinates);
    await fake.getCurrentWeather(secondCoords);

    expect(fake.requestCount()).toBe(2);
    expect(fake.lastCoordinates()).toEqual(secondCoords);
  });
});
