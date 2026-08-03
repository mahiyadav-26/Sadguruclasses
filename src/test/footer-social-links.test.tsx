import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Footer from "@/components/Landing/Footer";

describe("landing footer social links", () => {
  it("renders working YouTube and Telegram links without dead image assets", () => {
    const { container } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /YouTube/i })).toHaveAttribute(
      "href",
      "https://youtube.com/@sadgurucoachingclasses",
    );
    expect(screen.getByRole("link", { name: /Telegram/i })).toHaveAttribute(
      "href",
      "https://t.me/sadgurucoachingclasses",
    );
    expect(container.querySelectorAll('img[src*="/__l5e/assets-v1/"]')).toHaveLength(0);
  });
});