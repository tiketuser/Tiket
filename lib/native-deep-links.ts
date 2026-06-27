import { isNative } from "./platform";

type Handler = (url: URL) => void | Promise<void>;

const handlers = new Map<string, Handler>();
let initialized = false;

export function registerDeepLinkHandler(prefix: string, handler: Handler): void {
  handlers.set(prefix, handler);
}

export async function initDeepLinks(navigate: (path: string) => void): Promise<void> {
  if (!isNative() || initialized) return;
  initialized = true;

  const { App } = await import("@capacitor/app");

  registerDeepLinkHandler("/stripe/payment-complete", (url) => {
    const target = `${url.pathname}${url.search}`;
    navigate(target);
  });

  registerDeepLinkHandler("/auth/email-verified", (url) => {
    navigate(url.pathname);
  });

  await App.addListener("appUrlOpen", ({ url: rawUrl }) => {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      return;
    }

    for (const [prefix, handler] of handlers) {
      if (url.pathname.startsWith(prefix)) {
        void handler(url);
        return;
      }
    }

    navigate(`${url.pathname}${url.search}`);
  });
}
