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
  TLight extends HTMLElement = HTMLElement,
>(options?: { rotate?: number; depth?: number }) {
  const cardRef = useRef<TCard>(null);
  const depthRef = useRef<TDepth>(null);
  const lightRef = useRef<TLight>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const raf = useRef<number | null>(null);
  const rotate = options?.rotate ?? 7;
  const depth = options?.depth ?? 18;

  const current = useRef({
    rotateX: 0,
    rotateY: 0,
    imageX: 0,
    imageY: 0,
    imageZ: 24,
    imageScale: 1.02,
    lightX: 0,
    lightY: 0,
    lightOpacity: 0,
    shadowX: 0,
    shadowY: 30,
    imgLightOpacity: 0,
  });

  const target = useRef({
    rotateX: 0,
    rotateY: 0,
    imageX: 0,
    imageY: 0,
    imageZ: 24,
    imageScale: 1.02,
    lightX: 0,
    lightY: 0,
    lightOpacity: 0,
    shadowX: 0,
    shadowY: 30,
    imgLightOpacity: 0,
  });

  const render = useCallback(() => {
    const card = cardRef.current;
    const depthEl = depthRef.current;
    const lightEl = lightRef.current;
    if (!card) return;

    const lerpAmount = 0.08; // smooth floaty delay
    current.current.rotateX = lerp(current.current.rotateX, target.current.rotateX, lerpAmount);
    current.current.rotateY = lerp(current.current.rotateY, target.current.rotateY, lerpAmount);
    current.current.imageX = lerp(current.current.imageX, target.current.imageX, lerpAmount);
    current.current.imageY = lerp(current.current.imageY, target.current.imageY, lerpAmount);
    current.current.imageZ = lerp(current.current.imageZ, target.current.imageZ, lerpAmount);
    current.current.imageScale = lerp(current.current.imageScale, target.current.imageScale, lerpAmount);
    current.current.lightX = lerp(current.current.lightX, target.current.lightX, lerpAmount);
    current.current.lightY = lerp(current.current.lightY, target.current.lightY, lerpAmount);
    current.current.lightOpacity = lerp(current.current.lightOpacity, target.current.lightOpacity, lerpAmount);
    current.current.shadowX = lerp(current.current.shadowX, target.current.shadowX, lerpAmount);
    current.current.shadowY = lerp(current.current.shadowY, target.current.shadowY, lerpAmount);
    current.current.imgLightOpacity = lerp(current.current.imgLightOpacity, target.current.imgLightOpacity, lerpAmount);

    card.style.transform = `perspective(1000px) rotateX(${current.current.rotateX.toFixed(2)}deg) rotateY(${current.current.rotateY.toFixed(2)}deg)`;
    card.style.setProperty("--shadow-x", `${current.current.shadowX.toFixed(2)}px`);
    card.style.setProperty("--shadow-y", `${current.current.shadowY.toFixed(2)}px`);
    card.style.setProperty("--img-light-opacity", `${current.current.imgLightOpacity.toFixed(3)}`);

    if (lightEl) {
      // 3D placement: 40px translateZ places it just in front of the image for layered depth parallax
      lightEl.style.transform = `translate3d(${current.current.lightX.toFixed(1)}px, ${current.current.lightY.toFixed(1)}px, 40px)`;
      lightEl.style.opacity = `${current.current.lightOpacity.toFixed(3)}`;
    }

    if (depthEl) {
      depthEl.style.transform = `translate3d(${current.current.imageX.toFixed(2)}px, ${current.current.imageY.toFixed(2)}px, ${current.current.imageZ.toFixed(2)}px) scale(${current.current.imageScale.toFixed(4)})`;
    }

    const epsilon = 0.005;
    const stillMoving =
      Math.abs(current.current.rotateX - target.current.rotateX) > epsilon ||
      Math.abs(current.current.rotateY - target.current.rotateY) > epsilon ||
      Math.abs(current.current.imageX - target.current.imageX) > epsilon ||
      Math.abs(current.current.imageY - target.current.imageY) > epsilon ||
      Math.abs(current.current.imageZ - target.current.imageZ) > epsilon ||
      Math.abs(current.current.imageScale - target.current.imageScale) > epsilon ||
      Math.abs(current.current.lightOpacity - target.current.lightOpacity) > epsilon ||
      Math.abs(current.current.shadowY - target.current.shadowY) > epsilon ||
      Math.abs(current.current.imgLightOpacity - target.current.imgLightOpacity) > epsilon;

    if (stillMoving) {
      raf.current = requestAnimationFrame(render);
    } else {
      raf.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (raf.current === null) {
      raf.current = requestAnimationFrame(render);
    }
  }, [render]);

  const onPointerEnter = useCallback((event: ReactPointerEvent<TCard>) => {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    rectRef.current = rect;
    event.currentTarget.style.transition = "none";
    if (depthRef.current) depthRef.current.style.transition = "none";
    
    // Set initial enter coordinates immediately to avoid jumps/snapping
    const enterX = event.clientX - rect.left;
    const enterY = event.clientY - rect.top;
    current.current.lightX = enterX;
    current.current.lightY = enterY;
    target.current.lightX = enterX;
    target.current.lightY = enterY;
    target.current.lightOpacity = 1;
    target.current.imgLightOpacity = 0.7;
    
    start();
  }, [start]);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<TCard>) => {
      if (event.pointerType === "touch") return;
      const rect = rectRef.current;
      if (!rect) return;

      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const x = mouseX / rect.width;
      const y = mouseY / rect.height;

      target.current.rotateX = (0.5 - y) * rotate;
      target.current.rotateY = (x - 0.5) * rotate;
      target.current.imageX = (x - 0.5) * depth;
      target.current.imageY = (y - 0.5) * depth;
      target.current.imageZ = 32;
      target.current.imageScale = 1.055;
      
      target.current.lightX = mouseX;
      target.current.lightY = mouseY;
      target.current.lightOpacity = 1;
      
      target.current.shadowX = -(x - 0.5) * 16;
      target.current.shadowY = 30 - (y - 0.5) * 16;
      target.current.imgLightOpacity = 0.7 + (0.5 - y) * 0.3;

      start();
    },
    [depth, rotate, start],
  );

  const onPointerLeave = useCallback((event: ReactPointerEvent<TCard>) => {
    rectRef.current = null;
    target.current = {
      rotateX: 0,
      rotateY: 0,
      imageX: 0,
      imageY: 0,
      imageZ: 24,
      imageScale: 1.02,
      lightX: current.current.lightX,
      lightY: current.current.lightY,
      lightOpacity: 0,
      shadowX: 0,
      shadowY: 30,
      imgLightOpacity: 0,
    };
    start();
  }, [start]);

  return { cardRef, depthRef, lightRef, onPointerEnter, onPointerMove, onPointerLeave };
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