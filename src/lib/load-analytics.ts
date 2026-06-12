export function loadAnalytics() {
  if (typeof window === "undefined") return;

  const GA_ID = "G-J6MCZS5VTY";

  (window as any).dataLayer = (window as any).dataLayer || [];
  if (typeof (window as any).gtag !== "function") {
    (window as any).gtag = function (...args: any[]) {
      (window as any).dataLayer.push(args);
    };
  }

  const scriptId = "google-analytics-gtag";
  if (!document.getElementById(scriptId)) {
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);
  }

  (window as any).gtag("js", new Date());
  (window as any).gtag("config", GA_ID);
}
