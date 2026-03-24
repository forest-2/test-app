import { IdeaInput } from "@/components/features/game/IdeaInput";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("IdeaInput", () => {
  it("submit button is disabled when textarea is empty", () => {
    render(<IdeaInput isSubmitting={false} isDisabled={false} onSubmit={() => {}} />);
    const button = screen.getByRole("button", { name: "送信" });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("enables submit button when text is entered", async () => {
    const user = userEvent.setup();
    render(<IdeaInput isSubmitting={false} isDisabled={false} onSubmit={() => {}} />);
    await user.type(screen.getByLabelText("アイデア入力"), "テストアイデア");
    const button = screen.getByRole("button", { name: "送信" });
    expect(button.hasAttribute("disabled")).toBe(false);
  });

  it("accepts text up to 500 chars", async () => {
    const user = userEvent.setup();
    render(<IdeaInput isSubmitting={false} isDisabled={false} onSubmit={() => {}} />);
    const textarea = screen.getByLabelText("アイデア入力");
    await user.type(textarea, "a".repeat(500));
    expect((textarea as HTMLTextAreaElement).value.length).toBe(500);
  });

  it("calls onSubmit with trimmed value", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<IdeaInput isSubmitting={false} isDisabled={false} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("アイデア入力"), "  テストアイデア  ");
    await user.click(screen.getByRole("button", { name: "送信" }));
    expect(onSubmit).toHaveBeenCalledWith("テストアイデア");
  });

  it("shows 採点中… and disables button when submitting", () => {
    render(<IdeaInput isSubmitting={true} isDisabled={false} onSubmit={() => {}} />);
    expect(screen.getByText("採点中…")).toBeDefined();
    expect(screen.getByRole("button", { name: "採点中…" }).hasAttribute("disabled")).toBe(true);
  });
});
