export function trackEvent(name: string, params: Record<string, unknown>) {
  const fire = () => {
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", name, params);
    }
  };

  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    fire();
  } else {
    // gtag not ready yet — wait for it
    window.addEventListener("load", fire, { once: true });
  }
}
