import { useEffect } from "react";

/**
 * IntersectionObserver-based reveal-on-scroll.
 * Adds `.in-view` to any element with class `.reveal` once it enters the viewport.
 * The CSS keyframe `reveal` (defined in styles.css) handles the fade-up animation.
 */
export function useReveal(deps = []) {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.in-view)");
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default useReveal;
