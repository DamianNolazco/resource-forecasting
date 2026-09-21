import { it, expect, vi } from "vitest";
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Page from "../app/page";
import { initialPlan, STORAGE_KEY } from "../lib/planning";
const start = async () => {
  const result = render(<Page />);
  await screen.findByRole("heading", { name: "Resource timeline" });
  return result;
};
it("saves an unassigned staffing allocation, persists after remount, and supports undo", async () => {
  const u = userEvent.setup();
  const rendered = await start();
  await u.click(
    screen.getByRole("button", { name: "Allocation", exact: true }),
  );
  await u.click(screen.getByRole("button", { name: "50%", exact: true }));
  await u.click(screen.getByRole("button", { name: "Save allocation" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  await waitFor(() =>
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).bars).toHaveLength(
      initialPlan.bars.length + 1,
    ),
  );
  await u.click(screen.getByRole("button", { name: "Undo last change" }));
  await waitFor(() =>
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).bars).toHaveLength(
      initialPlan.bars.length,
    ),
  );
  await u.click(
    screen.getAllByRole("button", { name: "Edit Skypod FE allocation" })[0],
  );
  await u.click(screen.getByRole("button", { name: "75%", exact: true }));
  await u.click(screen.getByRole("button", { name: "Save allocation" }));
  await waitFor(() =>
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY)!).bars.find(
        (bar: any) => bar.id === "G-SP-2",
      ).allocation,
    ).toBe(0.75),
  );
  rendered.unmount();
  await start();
  await u.click(
    screen.getAllByRole("button", { name: "Edit Skypod FE allocation" })[0],
  );
  expect(
    (screen.getByLabelText("Allocation percentage") as HTMLInputElement).value,
  ).toBe("75");
});
it("creates a resource and project, filters resources by year and department, and edits milestones", async () => {
  const u = userEvent.setup();
  await start();
  await u.click(screen.getByRole("button", { name: "Resources", exact: true }));
  await u.click(
    screen.getByRole("button", { name: "Add resource", exact: true }),
  );
  await u.type(screen.getByLabelText("Full name"), "Test Engineer");
  await u.click(screen.getByRole("button", { name: "Save resource" }));
  await u.type(
    screen.getByRole("textbox", { name: "Search people, role or location" }),
    "Test Engineer",
  );
  expect(screen.getAllByRole("row")).toHaveLength(2);
  await u.selectOptions(screen.getByLabelText("Resource year"), "2027");
  await u.selectOptions(screen.getByLabelText("Department filter"), "FE");
  expect(screen.getByText("No resources match your filters.")).toBeTruthy();
  await u.click(screen.getByRole("button", { name: /^Projects/ }));
  await u.click(screen.getByRole("button", { name: "New project" }));
  await u.type(screen.getByLabelText("Project name"), "Test Project");
  await u.type(screen.getByLabelText("Project code"), "TEST");
  await u.click(screen.getByRole("button", { name: "Save project" }));
  expect(screen.getByRole("heading", { name: "Test Project" })).toBeTruthy();
  await u.click(
    within(
      screen.getByRole("heading", { name: "Test Project" }).closest("article")!,
    ).getByRole("button", { name: "Open resource plan" }),
  );
  await u.click(screen.getByRole("button", { name: "Milestone", exact: true }));
  await u.type(screen.getByLabelText("Milestone name"), "QA Go Live");
  await u.selectOptions(screen.getByLabelText("Target month"), "23");
  await u.click(screen.getByRole("button", { name: "Save milestone" }));
  await u.click(
    screen.getByRole("button", { name: "Edit milestone QA Go Live" }),
  );
  expect(
    (screen.getByLabelText("Target month") as HTMLSelectElement).value,
  ).toBe("23");
  await u.click(screen.getByRole("button", { name: "Delete", exact: true }));
  expect(
    screen.queryByRole("button", { name: "Edit milestone QA Go Live" }),
  ).toBeNull();
});
it("moves and resizes allocations without losing duration or exceeding the horizon", async () => {
  const u = userEvent.setup();
  await start();
  const bar = screen.getAllByRole("button", { name: "Edit Skypod FE allocation" })[0];
  fireEvent.pointerDown(bar, { button: 0, clientX: 300 });
  fireEvent.pointerMove(window, { clientX: 380 });
  fireEvent.pointerUp(window);
  await waitFor(() => {
    const b = JSON.parse(localStorage.getItem(STORAGE_KEY)!).bars.find(
      (b: any) => b.id === "G-SP-2",
    );
    expect(b.start).toBe(12);
    expect(b.end).toBe(20);
  });
  await u.click(screen.getByRole("button", { name: "Undo last change" }));
  fireEvent.pointerDown(bar.querySelector(".resize-handle.right")!, {
    button: 0,
    clientX: 300,
  });
  fireEvent.pointerMove(window, { clientX: 9000 });
  fireEvent.pointerUp(window);
  await waitFor(() => {
    const b = JSON.parse(localStorage.getItem(STORAGE_KEY)!).bars.find(
      (b: any) => b.id === "G-SP-2",
    );
    expect(b.start).toBe(10);
    expect(b.end).toBe(23);
  });
});
it("shows department charts and accurately flags FE hiring need", async () => {
  const u = userEvent.setup();
  await start();
  await u.click(screen.getByRole("button", { name: "Capacity", exact: true }));
  expect(
    screen.getByRole("heading", { name: "Demand & capacity." }),
  ).toBeTruthy();
  const card = screen
    .getByRole("heading", { name: "Field Engineers" })
    .closest("article")!;
  expect(within(card).getByText("+22 hires at 85%")).toBeTruthy();
});
it("does not overwrite invalid saved data and closes the drawer with Escape", async () => {
  localStorage.setItem(STORAGE_KEY, "broken data");
  const u = userEvent.setup();
  await start();
  expect(screen.getByText("Could not load saved plan")).toBeTruthy();
  await u.click(
    screen.getByRole("button", { name: "Allocation", exact: true }),
  );
  await u.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(localStorage.getItem(STORAGE_KEY)).toBe("broken data");
});
