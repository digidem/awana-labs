import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ScrollToTop from "@/components/ScrollToTop";
import { useScrollListener } from "@/hooks/useScrollPosition";

vi.mock("@/hooks/useScrollPosition", () => ({
  useScrollListener: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

let scrollCallback: (scrollY: number) => void;

beforeEach(() => {
  vi.mocked(useScrollListener).mockImplementation((cb) => {
    scrollCallback = cb;
  });
  Object.defineProperty(window, "scrollTo", {
    value: vi.fn(),
    writable: true,
  });
});

describe("ScrollToTop", () => {
  it("does not show button when scroll position is below threshold", () => {
    render(<ScrollToTop />);
    act(() => scrollCallback(100));

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-visible", "false");
  });

  it("shows button when scrolled past threshold", () => {
    render(<ScrollToTop />);
    act(() => scrollCallback(500));

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-visible", "true");
  });

  it("scrolls to top on click", () => {
    render(<ScrollToTop />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });

  it("has correct aria-label", () => {
    render(<ScrollToTop />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "accessibility.scrollToTop");
  });

  it("has data-visible attribute reflecting visibility state", () => {
    render(<ScrollToTop />);

    const button = screen.getByRole("button");

    act(() => scrollCallback(100));
    expect(button).toHaveAttribute("data-visible", "false");

    act(() => scrollCallback(401));
    expect(button).toHaveAttribute("data-visible", "true");

    act(() => scrollCallback(0));
    expect(button).toHaveAttribute("data-visible", "false");
  });

  it("starts with data-visible false when mounted at scrollY 0", () => {
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });
    render(<ScrollToTop />);
    // Simulate the real hook's initial cb(window.scrollY) call that happens
    // in useEffect on mount (useScrollPosition.ts:32).
    act(() => {
      scrollCallback(window.scrollY);
    });

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-visible", "false");
  });

  it("starts with data-visible true when mounted at non-zero scrollY", () => {
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 500,
    });
    render(<ScrollToTop />);
    // Simulate the real hook's initial cb(window.scrollY) call that happens
    // in useEffect on mount (useScrollPosition.ts:32).
    act(() => {
      scrollCallback(window.scrollY);
    });

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-visible", "true");
  });
});
