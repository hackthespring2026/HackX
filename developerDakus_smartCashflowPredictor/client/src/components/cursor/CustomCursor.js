import React, { useEffect, useRef } from "react";

/**
 * CustomCursor — smooth animated cursor system.
 * - Dot follows mouse exactly (requestAnimationFrame).
 * - Ring follows with lerp delay for a fluid feel.
 * - Scales on hoverable elements.
 * - Automatically disabled on touch devices.
 */
function CustomCursor() {
    const dotRef = useRef(null);
    const ringRef = useRef(null);

    useEffect(() => {
        const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) return;

        let mouseX = 0, mouseY = 0;
        let ringX = 0, ringY = 0;
        const LERP = 0.18;

        const onMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        const onEnter = () => {
            dotRef.current?.classList.add("hovering");
            ringRef.current?.classList.add("hovering");
        };

        const onLeave = () => {
            dotRef.current?.classList.remove("hovering");
            ringRef.current?.classList.remove("hovering");
        };

        const HOVER_SELECTORS = "a, button, [role='button'], label, input, select, textarea, .nav-link, .btn, .primary-btn, .feat-card, .lift-card, .file-dropzone";

        const attachListeners = () => {
            document.querySelectorAll(HOVER_SELECTORS).forEach((el) => {
                el.addEventListener("mouseenter", onEnter);
                el.addEventListener("mouseleave", onLeave);
            });
        };

        const observer = new MutationObserver(attachListeners);
        observer.observe(document.body, { childList: true, subtree: true });
        attachListeners();

        let animId;
        const loop = () => {
            ringX += (mouseX - ringX) * LERP;
            ringY += (mouseY - ringY) * LERP;

            if (dotRef.current) {
                dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
            }
            if (ringRef.current) {
                ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
            }

            animId = requestAnimationFrame(loop);
        };
        loop();

        window.addEventListener("mousemove", onMove);
        return () => {
            window.removeEventListener("mousemove", onMove);
            cancelAnimationFrame(animId);
            observer.disconnect();
        };
    }, []);

    return (
        <>
            <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
            <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
        </>
    );
}

export default CustomCursor;
