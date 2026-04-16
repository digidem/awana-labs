import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import ProjectModal from "./ProjectModal";
import { createMockProject } from "@/test/fixtures";

const project = createMockProject({
  media: {
    logo: "https://example.com/logo.png",
    images: [
      "https://example.com/image-1.png",
      "https://example.com/image-2.png",
    ],
  },
});

function renderModal(
  isOpen: boolean,
  onClose = vi.fn(),
  triggerElement: HTMLElement | null = null,
) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ProjectModal
        project={project}
        isOpen={isOpen}
        onClose={onClose}
        triggerElement={triggerElement}
      />
    </I18nextProvider>,
  );
}

describe("ProjectModal", () => {
  const imageAlt = (index: number) =>
    i18n.t("projectModal.imageAlt", {
      title: project.title,
      index,
    });

  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("focuses the close button on open and restores focus on close", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = renderModal(true, vi.fn(), trigger);

    expect(screen.getByRole("button", { name: "Close modal" })).toHaveFocus();

    rerender(
      <I18nextProvider i18n={i18n}>
        <ProjectModal
          project={project}
          isOpen={false}
          onClose={vi.fn()}
          triggerElement={trigger}
        />
      </I18nextProvider>,
    );

    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it("handles arrow keys and Escape within the open dialog", async () => {
    const onClose = vi.fn();
    renderModal(true, onClose);

    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "ArrowRight" });

    await waitFor(() => {
      expect(screen.getByAltText(imageAlt(2))).toBeInTheDocument();
    });

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows a fallback state when an image fails to load", () => {
    renderModal(true);

    const image = screen.getByAltText(imageAlt(1));
    fireEvent.error(image);

    expect(
      screen.getByText(i18n.t("projectModal.imageUnavailable")),
    ).toBeInTheDocument();
  });
});
