import { screen } from "@testing-library/react";
import { mockApi, renderRoute } from "../../test/renderWithProviders";

describe("AppShell", () => {
  it("shows a signed-in operator the navigation with the current section marked", async () => {
    mockApi((url) =>
      url === "/api/session"
        ? {
            status: 200,
            body: {
              subject: "op-1",
              roles: ["Operator"],
              expiresAt: "2030-01-01T00:00:00Z",
            },
          }
        : url.startsWith("/api/steward/incidents")
          ? { status: 200, body: [] }
          : undefined,
    );

    renderRoute("/incidents");

    expect(
      await screen.findByRole("link", { name: "Incidents" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      await screen.findByRole("heading", { name: "No incidents" }),
    ).toBeInTheDocument();
  });

  it("signs a visitor straight in where the preview offers demo sign-in", async () => {
    let signedIn = false;
    mockApi((url) => {
      if (url === "/api/session/demo") {
        signedIn = true;
        return { status: 200, body: { expiresIn: 600 } };
      }
      if (url === "/api/session") {
        return signedIn
          ? {
              status: 200,
              body: {
                subject: "op-1",
                roles: ["Operator"],
                expiresAt: "2030-01-01T00:00:00Z",
              },
            }
          : {
              status: 401,
              body: {
                status: 401,
                code: "unauthenticated",
                title: "Unauthorized",
              },
            };
      }
      return url.startsWith("/api/steward/incidents")
        ? { status: 200, body: [] }
        : undefined;
    });

    renderRoute("/incidents");

    expect(
      await screen.findByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
  });

  it("asks a signed-out visitor to sign in instead of showing any data", async () => {
    mockApi((url) =>
      url === "/api/session"
        ? {
            status: 401,
            body: {
              status: 401,
              code: "unauthenticated",
              title: "Unauthorized",
            },
          }
        : url === "/api/session/demo"
          ? {
              status: 404,
              body: {
                status: 404,
                code: "demo_sign_in_disabled",
                title: "Not Found",
              },
            }
          : undefined,
    );

    renderRoute("/incidents");

    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Primary" }),
    ).not.toBeInTheDocument();
  });
});
