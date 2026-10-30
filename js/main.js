/* Capivice: interações do site */
(() => {
    const body = document.body;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- Loader ---------- */
    const loader = document.querySelector(".loader");
    const bar = loader.querySelector(".loader-bar span");
    const pct = loader.querySelector(".loader-pct");
    const minTime = reduceMotion ? 0 : 1400;
    const start = performance.now();
    let pageLoaded = false;

    // Espera as fontes pra não mostrar o título "pulando" de fonte
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => (pageLoaded = true));
    // Segurança: nunca prende o usuário no loader
    setTimeout(() => (pageLoaded = true), 4000);

    (function tick(now) {
        const elapsed = now - start;
        const target = pageLoaded ? 1 : 0.85;
        const progress = Math.min(target, elapsed / minTime || 1);
        bar.style.transform = `scaleX(${progress})`;
        pct.textContent = Math.round(progress * 100);

        if (progress >= 1 && elapsed >= minTime) {
            loader.classList.add("is-done");
            body.classList.remove("is-loading");
            setTimeout(() => body.classList.add("is-ready"), reduceMotion ? 0 : 350);
            setTimeout(() => loader.remove(), 1300);
            return;
        }
        requestAnimationFrame(tick);
    })(start);

    /* ---------- Menu mobile ---------- */
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.getElementById("mobile-menu");
    const menuOpen = () => toggle.getAttribute("aria-expanded") === "true";

    function setMenu(open) {
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
        menu.hidden = !open;
        body.style.overflow = open ? "hidden" : "";
    }

    toggle.addEventListener("click", () => setMenu(!menuOpen()));
    menu.addEventListener("click", (e) => {
        if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && menuOpen()) setMenu(false);
    });

    /* ---------- Header: esconde ao descer, volta ao subir ---------- */
    const header = document.querySelector(".site-header");
    let lastY = window.scrollY;

    function onScroll() {
        const y = window.scrollY;
        header.classList.toggle("is-scrolled", y > 40);
        header.classList.toggle("is-hidden", y > lastY && y > 400 && !menuOpen());
        lastY = y;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* ---------- Reveal on scroll ---------- */
    const revealObserver = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                entry.target.classList.add("is-in");
                revealObserver.unobserve(entry.target);
            }
        },
        { rootMargin: "0px 0px -12% 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => revealObserver.observe(el));

    /* ---------- Nav ativa conforme a seção ---------- */
    const navLinks = [...document.querySelectorAll(".nav a")];
    const navObserver = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                const id = entry.target.id;
                navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
            }
        },
        { rootMargin: "-45% 0px -50% 0px" }
    );
    document.querySelectorAll("main section[id]").forEach((s) => navObserver.observe(s));

    /* ---------- Contadores ---------- */
    const countObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target;
            const end = Number(el.dataset.count);
            const duration = reduceMotion ? 0 : 1600;
            const t0 = performance.now();
            (function step(now) {
                const k = duration ? Math.min(1, (now - t0) / duration) : 1;
                el.textContent = Math.round(end * (1 - Math.pow(1 - k, 4)));
                if (k < 1) requestAnimationFrame(step);
            })(t0);
            countObserver.unobserve(el);
        }
    });
    document.querySelectorAll("[data-count]").forEach((el) => countObserver.observe(el));

    /* ---------- Statement: palavras acendem com o scroll ---------- */
    const statement = document.querySelector("[data-words]");
    const hotWords = ["próprios", "jogos.", "começar", "largar."];
    let words = [];

    if (statement) {
        const text = statement.textContent.trim().replace(/\s+/g, " ");
        statement.setAttribute("aria-label", text);
        statement.innerHTML = text
            .split(" ")
            .map((word) => `<span class="w${hotWords.includes(word) ? " hot" : ""}" aria-hidden="true">${word}</span>`)
            .join(" ");
        words = [...statement.querySelectorAll(".w")];
    }

    function lightWords() {
        if (!words.length) return;
        const rect = statement.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0 quando o topo entra a 85% da tela, 1 quando o fim passa de 45%
        const progress = (vh * 0.85 - rect.top) / (rect.height + vh * 0.4);
        const lit = Math.floor(Math.max(0, Math.min(1, progress)) * words.length);
        words.forEach((w, i) => {
            const on = i < lit;
            w.classList.toggle("is-lit", on && !w.classList.contains("hot"));
            w.classList.toggle("is-hot", on && w.classList.contains("hot"));
        });
    }

    /* ---------- Processo: passo ativo + contador ---------- */
    const steps = [...document.querySelectorAll(".step")];
    const counter = document.querySelector(".process-counter-num");
    let currentStep = "";

    function updateSteps() {
        const mid = window.innerHeight * 0.5;
        let active = steps[0];
        for (const s of steps) {
            if (s.getBoundingClientRect().top < mid) active = s;
        }
        steps.forEach((s) => s.classList.toggle("is-active", s === active));

        const num = active.dataset.step;
        if (num !== currentStep && counter) {
            currentStep = num;
            counter.classList.add("is-swapping");
            setTimeout(() => {
                counter.textContent = num;
                counter.classList.remove("is-swapping");
            }, 200);
        }
    }

    /* ---------- Parallax do logo do estúdio ---------- */
    const studioLogo = document.querySelector(".studio-logo");

    function parallax() {
        if (!studioLogo || reduceMotion) return;
        const rect = studioLogo.getBoundingClientRect();
        const k = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
        studioLogo.style.transform = `translateY(${k * -60}px) rotate(${k * -6}deg)`;
    }

    let ticking = false;
    function onScrollFrame() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            lightWords();
            updateSteps();
            parallax();
            ticking = false;
        });
    }

    window.addEventListener("scroll", onScrollFrame, { passive: true });
    window.addEventListener("resize", onScrollFrame);
    onScrollFrame();

    /* ---------- Cards: tilt + spotlight seguindo o mouse ---------- */
    if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
        document.querySelectorAll("[data-tilt]").forEach((card) => {
            card.addEventListener("pointermove", (e) => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width;
                const y = (e.clientY - r.top) / r.height;
                card.style.setProperty("--mx", `${x * 100}%`);
                card.style.setProperty("--my", `${y * 100}%`);
                card.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 6}deg) rotateX(${(0.5 - y) * 6}deg)`;
            });
            card.addEventListener("pointerleave", () => {
                card.style.transform = "";
            });
        });

        /* Botões magnéticos */
        document.querySelectorAll(".btn").forEach((btn) => {
            btn.addEventListener("pointermove", (e) => {
                const r = btn.getBoundingClientRect();
                const x = e.clientX - r.left - r.width / 2;
                const y = e.clientY - r.top - r.height / 2;
                btn.style.translate = `${x * 0.18}px ${y * 0.3}px`;
            });
            btn.addEventListener("pointerleave", () => {
                btn.style.translate = "";
            });
        });
    }
})();
