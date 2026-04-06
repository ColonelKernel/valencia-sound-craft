import { useEffect, useRef } from "react";

export function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observedNodes = new WeakSet<Element>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    const observeFadeElements = (node: Element) => {
      if (node.classList.contains("fade-up") && !observedNodes.has(node)) {
        observedNodes.add(node);
        observer.observe(node);
      }

      node.querySelectorAll(".fade-up").forEach((child) => {
        if (!observedNodes.has(child)) {
          observedNodes.add(child);
          observer.observe(child);
        }
      });
    };

    observeFadeElements(el);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            observeFadeElements(node);
          }
        });
      });
    });

    mutationObserver.observe(el, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return ref;
}
