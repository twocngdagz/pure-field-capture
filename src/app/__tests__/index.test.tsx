import { render, screen } from "@testing-library/react-native";
import Index from "../index";

describe("Index scaffold screen", () => {
  it("renders the placeholder status copy", () => {
    render(<Index />);
    expect(screen.getByText("Scaffold ready")).toBeTruthy();
    expect(screen.getByText("Milestone 2 in progress")).toBeTruthy();
  });
});
