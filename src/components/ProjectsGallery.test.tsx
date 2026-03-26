import { beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import ProjectsGallery from "./ProjectsGallery";

const projects = [
  {
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
    tags: ["test"],
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
  },
];

describe("ProjectsGallery", () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("provides an accessible label for the search field", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ProjectsGallery projects={projects} />
      </I18nextProvider>,
    );

    expect(screen.getByLabelText("Search projects")).toBeInTheDocument();
  });

  it("exposes filter selection state with aria-pressed", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ProjectsGallery projects={projects} />
      </I18nextProvider>,
    );

    const allButton = screen.getByRole("button", { name: "All" });
    const activeButton = screen.getByRole("button", { name: "Active" });

    expect(allButton).toHaveAttribute("aria-pressed", "true");
    expect(activeButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(activeButton);

    expect(allButton).toHaveAttribute("aria-pressed", "false");
    expect(activeButton).toHaveAttribute("aria-pressed", "true");
  });
});
