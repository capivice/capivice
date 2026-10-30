/* Crystal Defender: camada de brasas e faíscas mágicas por cima das screenshots do hero */
(() => {
    const canvas = document.querySelector(".hero-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const ORANGE = [255, 91, 0];
    const CYAN = [63, 212, 216];
    const rand = (a, b) => a + Math.random() * (b - a);

    let w = 0;
    let h = 0;
    let t = 0;
    let running = true;
    let raf = 0;
    let particles = [];
    const mouse = { x: 0, tx: 0 };

    function spawn(initial) {
        const magic = Math.random() < 0.25;
        return {
            x: Math.random() * w,
            y: initial ? Math.random() * h : h + 10,
            vy: magic ? rand(0.15, 0.4) : rand(0.3, 1.1),
            vx: rand(-0.25, 0.25),
            size: magic ? rand(1, 2.4) : rand(0.6, 1.8),
            depth: rand(0.3, 1),
            phase: Math.random() * Math.PI * 2,
            color: magic ? CYAN : ORANGE,
        };
    }

    function layout() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.round(Math.min(110, (w * h) / 14000));
        particles = Array.from({ length: count }, () => spawn(true));
    }

    function frame() {
        if (!running) return;
        t += 1;
        mouse.x += (mouse.tx - mouse.x) * 0.04;
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.y -= p.vy * p.depth;
            p.x += p.vx + Math.sin(t * 0.01 + p.phase) * 0.3;
            if (p.y < -10) {
                particles[i] = spawn(false);
                continue;
            }
            const flicker = 0.6 + Math.sin(t * 0.08 + p.phase) * 0.4;
            const fade = Math.min(1, p.y / (h * 0.35));
            const [r, g, b] = p.color;
            ctx.fillStyle = `rgba(${r},${g},${b},${0.75 * flicker * fade * p.depth})`;
            ctx.beginPath();
            ctx.arc(p.x - mouse.x * 24 * p.depth, p.y, p.size * p.depth, 0, Math.PI * 2);
            ctx.fill();
        }

        raf = requestAnimationFrame(frame);
    }

    layout();
    frame();

    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(layout, 120);
    });

    window.addEventListener("pointermove", (e) => {
        mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    });

    // Pausa quando o hero sai da tela
    new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !running) {
            running = true;
            frame();
        } else if (!entry.isIntersecting) {
            running = false;
            cancelAnimationFrame(raf);
        }
    }).observe(canvas);
})();
