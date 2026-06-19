import { render } from "@testing-library/react";
import { SwingLine } from "./SwingLine";

describe("SwingLine", () => {
  it("shows an opening hint when pre is null", () => {
    const { container } = render(
      <SwingLine
        pre={null}
        final={null}
        liveTally={{ a: 0, b: 0 }}
        labelA="正方"
        labelB="反方"
      />,
    );
    expect(container.textContent).toContain("开场 —");
  });

  it("shows the swing leader and total from liveTally", () => {
    const { container } = render(
      <SwingLine
        pre={{ a: 10, b: 10 }}
        final={null}
        liveTally={{ a: 18, b: 14 }}
        labelA="正方"
        labelB="反方"
      />,
    );
    expect(container.textContent).toContain("开场 10/10");
    expect(container.textContent).toContain("正方 +4");
    expect(container.textContent).toContain("32 票");
  });

  it("prefers final snapshot over liveTally when present", () => {
    const { container } = render(
      <SwingLine
        pre={{ a: 10, b: 10 }}
        final={{ a: 12, b: 20 }}
        liveTally={{ a: 18, b: 14 }}
        labelA="正方"
        labelB="反方"
      />,
    );
    expect(container.textContent).toContain("反方 +8");
    expect(container.textContent).toContain("32 票");
  });

  it("shows 平 on a tie", () => {
    const { container } = render(
      <SwingLine
        pre={{ a: 10, b: 10 }}
        final={null}
        liveTally={{ a: 12, b: 12 }}
        labelA="正方"
        labelB="反方"
      />,
    );
    expect(container.textContent).toContain("平");
  });
});
