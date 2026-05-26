import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";

type TiltTarget = {
  rotateX: number;
  rotateY: number;
  imageX: number;
  imageY: number;
};

const idleTilt: TiltTarget = {
  rotateX: 0,
  rotateY: 0,
  imageX: 0,
  imageY: 0,
};

function setVar(element: HTMLElement | null, name: string, value: string) {
  element?.style.setProperty(name, value);
}

function lerp(current: number, target: number, amount: number) {
  return current + (target - current) * amount;
}

export function usePremiumTilt<
  TCard extends HTMLElement,
  TDepth extends HTMLElement,
>(options?: { rotate?: number; depth?: number }) {
  const cardRef = useRef<TCard>(null);
  const depthRef = useRef<TDepth>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const rotate = options?.rotate ?? 7;
  const depth = options?.depth ?? 18;

  const onPointerEnter = useCallback((event: ReactPointerEvent<TCard>) => {
    if (event.pointerType === "touch") return;
    rectRef.current = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.transition = "none";
    if (depthRef.current) depthRef.current.style.transition = "none";
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<TCard>) => {
      if (event.pointerType === "touch") return;
      const rect = rectRef.current ?? event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * rotate;
      const rotateY = (x - 0.5) * rotate;
      const imageX = (x - 0.5) * depth;
      const imageY = (y - 0.5) * depth;

      event.currentTarget.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;

      if (depthRef.current) {
        depthRef.current.style.transform = `translate3d(${imageX.toFixed(2)}px, ${imageY.toFixed(2)}px, 32px) scale(1.055)`;
      }
    },
    [depth, rotate],
  );

  const onPointerLeave = useCallback((event: ReactPointerEvent<TCard>) => {
    rectRef.current = null;
    event.currentTarget.style.transition = "transform 360ms cubic-bezier(0.23, 1, 0.32, 1)";
    event.currentTarget.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";

    if (depthRef.current) {
      depthRef.current.style.transition = "transform 360ms cubic-bezier(0.23, 1, 0.32, 1)";
      depthRef.current.style.transform = "translate3d(0px, 0px, 24px) scale(1.02)";
    }
  }, []);

  return { cardRef, depthRef, onPointerEnter, onPointerMove, onPointerLeave };
}
export function useMagnetic<TElement extends HTMLElement>(options?: {
  strength?: number;
  scale?: number;
}) {
  const ref = useRef<TElement>(null);
  const raf = useRef<number | null>(null);
  const current = useRef({ x: 0, y: 0, scale: 1 });
  const target = useRef({ x: 0, y: 0, scale: 1 });
  const strength = options?.strength ?? 8;
  const scale = options?.scale ?? 1.035;

  const render = useCallback(() => {
    const element = ref.current;
    current.current.x = lerp(current.current.x, target.current.x, 0.18);
    current.current.y = lerp(current.current.y, target.current.y, 0.18);
    current.current.scale = lerp(current.current.scale, target.current.scale, 0.18);

    if (element) {
      element.style.transform = `translate3d(${current.current.x.toFixed(2)}px, ${current.current.y.toFixed(2)}px, 0) scale(${current.current.scale.toFixed(4)})`;
    }

    const stillMoving =
      Math.abs(current.current.x - target.current.x) > 0.05 ||
      Math.abs(current.current.y - target.current.y) > 0.05 ||
      Math.abs(current.current.scale - target.current.scale) > 0.002;

    if (stillMoving) {
      raf.current = requestAnimationFrame(render);
    } else {
      raf.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (raf.current === null) raf.current = requestAnimationFrame(render);
  }, [render]);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<TElement>) => {
      if (event.pointerType === "touch") return;
      const rect = event.currentTarget.getBoundingClientRect();
      target.current = {
        x: ((event.clientX - rect.left) / rect.width - 0.5) * strength,
        y: ((event.clientY - rect.top) / rect.height - 0.5) * strength,
        scale,
      };
      start();
    },
    [scale, start, strength],
  );

  const onPointerLeave = useCallback(() => {
    target.current = { x: 0, y: 0, scale: 1 };
    start();
  }, [start]);

  useEffect(() => {
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}

export function useScrollReveal<TElement extends HTMLElement>(
  ref: RefObject<TElement>,
  delay = 0,
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.style.setProperty("--reveal-delay", `${delay}ms`);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          element.classList.add("is-visible");
          observer.unobserve(element);
        }
      },
      { threshold: 0.22, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [delay, ref]);
}

export function useHeroParallax<TElement extends HTMLElement>() {
  const ref = useRef<TElement>(null);
  const raf = useRef<number | null>(null);
  const current = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  const render = useCallback(() => {
    const element = ref.current;
    current.current.x = lerp(current.current.x, target.current.x, 0.08);
    current.current.y = lerp(current.current.y, target.current.y, 0.08);

    if (element) {
      const x = current.current.x;
      const y = current.current.y;
      setVar(element, "--hero-grid-x", `${(-x * 8).toFixed(2)}px`);
      setVar(element, "--hero-grid-y", `${(-y * 8).toFixed(2)}px`);
      setVar(element, "--hero-glow-x", `${(x * 18).toFixed(2)}px`);
      setVar(element, "--hero-glow-y", `${(y * 14).toFixed(2)}px`);
      setVar(element, "--hero-product-x", `${(x * 10).toFixed(2)}px`);
      setVar(element, "--hero-product-y", `${(y * 8).toFixed(2)}px`);
    }

    if (Math.abs(current.current.x - target.current.x) > 0.002 || Math.abs(current.current.y - target.current.y) > 0.002) {
      raf.current = requestAnimationFrame(render);
    } else {
      raf.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (raf.current === null) raf.current = requestAnimationFrame(render);
  }, [render]);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<TElement>) => {
      if (event.pointerType === "touch") return;
      const rect = event.currentTarget.getBoundingClientRect();
      target.current = {
        x: (event.clientX - rect.left) / rect.width - 0.5,
        y: (event.clientY - rect.top) / rect.height - 0.5,
      };
      start();
    },
    [start],
  );

  const onPointerLeave = useCallback(() => {
    target.current = { x: 0, y: 0 };
    start();
  }, [start]);

  useEffect(() => {
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}