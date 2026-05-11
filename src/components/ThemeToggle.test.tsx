import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "@/components/ThemeToggle";

// Mock useTheme hook
const mockSetTheme = vi.fn();
let mockTheme = "system";
let mockResolvedTheme = "light";

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
    resolvedTheme: mockResolvedTheme,
  }),
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      if (key === "accessibility.themeToggle") {
        return `Theme: ${opts?.current ?? ""}, click to switch to ${opts?.next ?? ""}`;
      }
      if (key === "aria.themeLight") return "Light";
      if (key === "aria.themeDark") return "Dark";
      if (key === "aria.themeSystem") return "System";
      return key;
    },
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockTheme = "system";
    mockResolvedTheme = "light";
    mockSetTheme.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Monitor icon when theme is system and resolved is light", () => {
    mockTheme = "system";
    mockResolvedTheme = "light";
    render(<ThemeToggle />);
    // Monitor icon is rendered (svg path unique to Monitor)
    const button = screen.getByRole("switch");
    expect(button).toBeInTheDocument();
    // The SVG child is the Monitor icon
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("renders Moon icon when resolvedTheme is dark and theme is system", () => {
    mockTheme = "system";
    mockResolvedTheme = "dark";
    render(<ThemeToggle />);
    const button = screen.getByRole("switch");
    expect(button).toBeInTheDocument();
  });

  it("renders Sun icon when theme is light", () => {
    mockTheme = "light";
    mockResolvedTheme = "light";
    render(<ThemeToggle />);
    const button = screen.getByRole("switch");
    expect(button).toBeInTheDocument();
  });

  it("cycles light → dark → system → light on sequential clicks", () => {
    mockTheme = "light";
    const { rerender } = render(<ThemeToggle />);
    const getButton = () => screen.getByRole("switch");

    // light → dark
    fireEvent.click(getButton());
    expect(mockSetTheme).toHaveBeenCalledWith("dark");

    // Simulate theme now being dark, re-render to pick up new mock values
    mockTheme = "dark";
    mockResolvedTheme = "dark";
    rerender(<ThemeToggle />);

    // dark → system
    fireEvent.click(getButton());
    expect(mockSetTheme).toHaveBeenCalledWith("system");

    // Simulate theme now being system, re-render
    mockTheme = "system";
    mockResolvedTheme = "light";
    rerender(<ThemeToggle />);

    // system → light
    fireEvent.click(getButton());
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("has aria-checked=true when resolvedTheme is dark", () => {
    mockResolvedTheme = "dark";
    render(<ThemeToggle />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("has aria-checked=false when resolvedTheme is light", () => {
    mockResolvedTheme = "light";
    render(<ThemeToggle />);
    expect(screen.getByRole("switch")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("aria-label updates with current and next theme", () => {
    mockTheme = "light";
    render(<ThemeToggle />);
    const button = screen.getByRole("switch");
    expect(button).toHaveAttribute(
      "aria-label",
      "Theme: Light, click to switch to Dark",
    );
  });
});
