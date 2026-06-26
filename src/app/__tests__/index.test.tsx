import { render, screen } from "@testing-library/react-native";
import Index from "../index";

jest.mock("@/features/capture/CaptureScreen", () => {
  const { Text } = require("react-native");

  return {
    CaptureScreen: () => <Text>Capture screen route</Text>,
  };
});

describe("Index route", () => {
  it("renders the capture screen", () => {
    render(<Index />);

    expect(screen.getByText("Capture screen route")).toBeTruthy();
  });
});
