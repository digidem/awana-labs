import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import Header from "@/components/Header";
import { useScrollListener } from "@/hooks/useScrollPosition";

vi.mock("@/hooks/useScrollPosition", () => ({
  useScrollListener: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/components/LanguageSwitcher", () => ({
  default: () => <div data-testid="language-switcher">LanguageSwitcher</div>,
}));

vi.mock("@/components/GithubIcon", () => ({
  GithubIcon: ({ className }: { className?: string }) => (
    <svg data-testid="github-icon" className={className} />
  ),
}));

describe("Header", () => {
  let scrollCallback: (scrollY: number) => void;
  let heroElement: HTMLElement;
  let mockH1: HTMLElement;

  beforeEach(() => {
    vi.mocked(useScrollListener).mockImplementation((cb) => {
      scrollCallback = cb;
    });

    mockH1 = document.createElement("h1");
    heroElement = document.createElement("div");
    heroElement.id = "hero";
    heroElement.querySelector = vi.fn().mockReturnValue(mockH1);
    mockH1.getBoundingClientRect = vi.fn().mockReturnValue({ top: 200 });

    vi.spyOn(document, "getElementById").mockReturnValue(heroElement);

    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });

    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders header element with correct structure", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
    expect(header.tagName).toBe("HEADER");
    expect(header).toHaveClass("fixed", "top-0", "left-0", "right-0", "z-50");
  });

  it("shows language switcher and GitHub link", () => {
    render(<Header />);
    expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
    const githubLink = screen.getByRole("link");
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/digidem/awana-labs",
    );
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("has transparent background initially (no blur)", () => {
    render(<Header />);
    // Simulate the real hook's initial cb(window.scrollY) call that happens
    // in useEffect on mount (useScrollPosition.ts:32).
    act(() => {
      scrollCallback(window.scrollY);
    });
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("bg-transparent");
    expect(header).not.toHaveClass("backdrop-blur-lg");
  });

  it("adds blur/border when scrolled (scrollY > 10)", () => {
    render(<Header />);
    act(() => {
      scrollCallback(50);
    });
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("backdrop-blur-lg", "border-b");
    expect(header).not.toHaveClass("bg-transparent");
  });

  it("logo container starts hidden (opacity 0)", () => {
    render(<Header />);
    // Simulate the real hook's initial cb(window.scrollY) call that happens
    // in useEffect on mount (useScrollPosition.ts:32).
    act(() => {
      scrollCallback(window.scrollY);
    });
    const logoButton = screen.getByRole("button", { name: /hero\.title/ });
    const logoContainer = logoButton.parentElement!;
    expect(logoContainer).toHaveStyle({ opacity: "0" });
    expect(logoContainer).toHaveStyle({ transform: "translateX(100px)" });
    expect(logoContainer).toHaveStyle({ pointerEvents: "none" });
  });

  it("logo appears when hero title scrolls out of view", () => {
    render(<Header />);
    // heroTitleDocumentTop = getBoundingClientRect().top + scrollY = 200 + 0 = 200
    // currentTop = 200 - scrollY
    // LOGO_FADE_START = 150, LOGO_FULL_OPACITY = 50
    // At scrollY = 200: currentTop = 0, which is <= LOGO_FULL_OPACITY => opacity = 1
    act(() => {
      scrollCallback(200);
    });
    const logoButton = screen.getByRole("button", { name: /hero\.title/ });
    const logoContainer = logoButton.parentElement!;
    expect(logoContainer).toHaveStyle({ opacity: "1" });
    expect(logoContainer).toHaveStyle({ transform: "translateX(0px)" });
    expect(logoContainer).toHaveStyle({ pointerEvents: "auto" });
  });

  it("clicking logo scrolls to top", () => {
    render(<Header />);
    // Make logo interactive first so the button is clickable
    act(() => {
      scrollCallback(200);
    });
    const logoButton = screen.getByRole("button", { name: /hero\.title/ });
    fireEvent.click(logoButton);
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });

  it("adds blur on mount when scrollY is already past threshold", () => {
    // Simulates a mid-page refresh: window.scrollY is already > 10
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 50,
    });
    render(<Header />);
    // Simulate the real hook's initial cb(window.scrollY) call that happens
    // in useEffect on mount (useScrollPosition.ts:32).
    act(() => {
      scrollCallback(window.scrollY);
    });
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("backdrop-blur-lg", "border-b");
    expect(header).not.toHaveClass("bg-transparent");
  });
});
