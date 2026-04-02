import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import ProjectCard from "./ProjectCard";

// Freeze system time so relative-time assertions are deterministic
const FIXED_NOW = new Date("2026-04-02T12:00:00.000Z");
vi.useFakeTimers({ now: FIXED_NOW });

const project = {
  id: "test-project",
  issue_number: 1,
  title: "Test Project",
  slug: "test-project",
  description: "A test project",
  organization: {
    name: "Test Org",
    short_name: "Test",
    url: "https://example.com",
  },
  status: {
    state: "active" as const,
    usage: "experimental" as const,
    notes: "",
  },
  tags: ["test", "maps", "mobile"],
  media: {
    logo: "https://example.com/logo.png",
    images: [],
  },
  links: {
    homepage: "https://example.com",
    repository: "https://github.com/test/project",
    documentation: "https://docs.example.com",
  },
  timestamps: {
    created_at: "2024-01-01T00:00:00.000Z",
    last_updated_at: "2024-01-02T00:00:00.000Z",
  },
};

describe("ProjectCard", () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("renders as a semantic button that is keyboard focusable", () => {
    const onClick = vi.fn();

    render(
      <I18nextProvider i18n={i18n}>
        <ProjectCard project={project} onClick={onClick} />
      </I18nextProvider>,
    );

    const button = screen.getByRole("button", {
      name: "View details for Test Project",
    });

    expect(button.tagName).toBe("BUTTON");
    button.focus();
    expect(button).toHaveFocus();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0]).toBe(button);
  });

  it("formats project dates as relative time using the active app language", async () => {
    await act(async () => {
      await i18n.changeLanguage("pt");
    });

    render(
      <I18nextProvider i18n={i18n}>
        <ProjectCard project={project} onClick={vi.fn()} />
      </I18nextProvider>,
    );

    // project.timestamps.last_updated_at is 2024-01-02, FIXED_NOW is 2026-04-02 → ~2 years ago
    const expected = new Intl.RelativeTimeFormat("pt", {
      numeric: "auto",
    }).format(-2, "year");

    expect(
      screen.getByText((_, node) => {
        return node?.tagName === "DIV" &&
          node?.textContent ===
          `${i18n.t("projects.updated")} ${expected}`;
      }),
    ).toBeInTheDocument();
  });
});
