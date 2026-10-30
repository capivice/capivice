/* Crystal Defender: key art animada do hero.
   Cristal facetado girando, círculo rúnico, inimigos chegando pela névoa
   e raios do cristal derrubando cada um. Tudo procedural em canvas 2D. */
(() => {
    const canvas = document.querySelector(".hero-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ORANGE = [255, 91, 0];
    const CYAN = [63, 212, 216];
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    const rand = (a, b) => a + Math.random() * (b - a);
    const TAU = Math.PI * 2;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let t = 0;
    let running = true;
    let raf = 0;

    // Layout dinâmico (cristal à direita no desktop, centralizado no mobile)
    const scene = { cx: 0, cy: 0, size: 0, groundY: 0, ringR: 0 };
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    let stars = [];
    let motes = [];
    let embers = [];
    let enemies = [];
    let bolts = [];
    let bursts = [];
    let ridges = [];
    let flash = 0;
    let spawnTimer = 0;

    function layout() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const mobile = w < 860;
        scene.cx = mobile ? w * 0.5 : w * 0.68;
        scene.size = Math.min(w, h) * (mobile ? 0.15 : 0.17);
        // No mobile o cristal fica no espaço livre acima do título (header de 64px)
        scene.cy = mobile ? 64 + scene.size * 1.75 : h * 0.42;
        scene.groundY = scene.cy + scene.size * 1.9;
        scene.ringR = scene.size * (mobile ? 2.1 : 2.6);

        stars = Array.from({ length: Math.round((w * h) / 9000) }, () => ({
            x: Math.random() * w,
            y: Math.random() * scene.groundY,
            r: Math.random() * 1.2 + 0.2,
            p: Math.random() * TAU,
            depth: Math.random() * 0.6 + 0.2,
        }));

        motes = Array.from({ length: 70 }, () => ({
            a: Math.random() * TAU,
            r: rand(scene.size * 1.1, scene.size * 3.4),
            y: rand(-scene.size * 1.6, scene.size * 1.4),
            s: rand(0.002, 0.008) * (Math.random() < 0.5 ? 1 : -1),
            size: rand(0.6, 2.2),
        }));

        embers = Array.from({ length: 50 }, () => newEmber(true));

        // Silhueta de montanhas em duas camadas
        ridges = [0.55, 0.85].map((amp, i) => {
            const pts = [];
            const step = 40;
            let y = 0;
            for (let x = -step; x <= w + step; x += step) {
                y += rand(-1, 1) * 18 * amp;
                y *= 0.92;
                pts.push([x, y + Math.sin(x * 0.004 + i * 2) * 40 * amp]);
            }
            return { pts, depth: i === 0 ? 0.3 : 0.6, base: scene.groundY - (i === 0 ? 90 : 40) * amp };
        });
    }

    function newEmber(initial) {
        return {
            x: Math.random() * w,
            y: initial ? Math.random() * h : h + 10,
            vy: rand(0.2, 0.8),
            vx: rand(-0.2, 0.2),
            size: rand(0.6, 2),
            life: rand(0.4, 1),
            hue: Math.random() < 0.75 ? ORANGE : CYAN,
        };
    }

    function spawnEnemy() {
        const side = Math.random() < 0.5 ? -1 : 1;
        const depth = Math.random();
        enemies.push({
            ang: side < 0 ? rand(Math.PI * 0.85, Math.PI * 1.15) : rand(-0.15, 0.15),
            dist: rand(1.9, 2.4),
            depth,
            speed: rand(0.0025, 0.0045),
            bob: Math.random() * TAU,
            size: rand(0.8, 1.25),
            hit: false,
            dying: 1,
        });
    }

    // Projeta um ponto no "chão" elíptico em volta do cristal
    function groundPoint(ang, distFactor) {
        const r = scene.ringR * distFactor;
        return {
            x: scene.cx + Math.cos(ang) * r,
            y: scene.groundY + Math.sin(ang) * r * 0.22,
        };
    }

    function zap(enemy) {
        const p = groundPoint(enemy.ang, enemy.dist);
        const ex = p.x;
        const ey = p.y - 14 * enemy.size;
        const sx = scene.cx;
        const sy = scene.cy;
        const segs = [];
        const n = 14;
        for (let i = 0; i <= n; i++) {
            const k = i / n;
            const jitter = i === 0 || i === n ? 0 : rand(-1, 1) * 26 * Math.sin(k * Math.PI);
            segs.push([sx + (ex - sx) * k + jitter, sy + (ey - sy) * k + jitter * 0.5]);
        }
        bolts.push({ segs, life: 1 });
        for (let i = 0; i < 26; i++) {
            const a = Math.random() * TAU;
            const v = rand(0.6, 3.2);
            bursts.push({ x: ex, y: ey, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: 1, c: Math.random() < 0.6 ? CYAN : ORANGE });
        }
        enemy.hit = true;
        flash = 1;
    }

    function update() {
        t += 1;
        mouse.x += (mouse.tx - mouse.x) * 0.05;
        mouse.y += (mouse.ty - mouse.y) * 0.05;

        spawnTimer -= 1;
        if (spawnTimer <= 0 && enemies.length < 7) {
            spawnEnemy();
            spawnTimer = rand(50, 120);
        }

        for (const e of enemies) {
            if (e.hit) {
                e.dying -= 0.06;
                continue;
            }
            e.dist -= e.speed;
            e.bob += 0.18;
            if (e.dist < 1.25 + e.depth * 0.25) zap(e);
        }
        enemies = enemies.filter((e) => e.dying > 0);

        for (const b of bolts) b.life -= 0.07;
        bolts = bolts.filter((b) => b.life > 0);

        for (const p of bursts) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.04;
            p.vx *= 0.97;
            p.life -= 0.022;
        }
        bursts = bursts.filter((p) => p.life > 0);

        for (const m of motes) m.a += m.s;

        for (let i = 0; i < embers.length; i++) {
            const e = embers[i];
            e.y -= e.vy;
            e.x += e.vx + Math.sin((t + i * 30) * 0.01) * 0.2;
            if (e.y < -10) embers[i] = newEmber(false);
        }

        flash *= 0.9;
    }

    function drawSky() {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#04080b");
        g.addColorStop(0.5, "#0a1418");
        g.addColorStop(0.75, "#1a0d06");
        g.addColorStop(1, "#050505");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        // Brilho do cristal no céu
        const glowR = scene.size * 6 * (1 + flash * 0.15);
        const sg = ctx.createRadialGradient(scene.cx, scene.cy, 0, scene.cx, scene.cy, glowR);
        sg.addColorStop(0, rgba(CYAN, 0.32 + flash * 0.2));
        sg.addColorStop(0.35, rgba(CYAN, 0.08));
        sg.addColorStop(1, rgba(CYAN, 0));
        ctx.fillStyle = sg;
        ctx.fillRect(0, 0, w, h);

        // Brasa do horizonte
        const hg = ctx.createRadialGradient(scene.cx, scene.groundY, 0, scene.cx, scene.groundY, w * 0.7);
        hg.addColorStop(0, rgba(ORANGE, 0.22));
        hg.addColorStop(1, rgba(ORANGE, 0));
        ctx.fillStyle = hg;
        ctx.fillRect(0, 0, w, h);

        for (const s of stars) {
            const a = 0.35 + Math.sin(t * 0.03 + s.p) * 0.3;
            ctx.fillStyle = `rgba(246,234,217,${a * s.depth})`;
            ctx.fillRect(s.x - mouse.x * 14 * s.depth, s.y - mouse.y * 8 * s.depth, s.r, s.r);
        }
    }

    function drawRidges() {
        for (const r of ridges) {
            const ox = -mouse.x * 30 * r.depth;
            ctx.beginPath();
            ctx.moveTo(-50, h);
            for (const [x, y] of r.pts) ctx.lineTo(x + ox, r.base + y);
            ctx.lineTo(w + 50, h);
            ctx.closePath();
            ctx.fillStyle = r.depth < 0.5 ? "#0a1114" : "#07090a";
            ctx.fill();
        }

        // Chão
        const gg = ctx.createLinearGradient(0, scene.groundY - 20, 0, h);
        gg.addColorStop(0, "#0b0d0e");
        gg.addColorStop(1, "#050505");
        ctx.fillStyle = gg;
        ctx.fillRect(0, scene.groundY - 6, w, h);
    }

    function drawRuneRing() {
        const { cx, groundY, ringR } = scene;
        ctx.save();
        ctx.translate(cx, groundY);
        ctx.scale(1, 0.22);

        const pulse = 0.5 + Math.sin(t * 0.04) * 0.15 + flash * 0.4;
        ctx.lineWidth = 2;
        ctx.strokeStyle = rgba(CYAN, 0.35 * pulse + 0.15);
        ctx.shadowColor = rgba(CYAN, 0.8);
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, TAU);
        ctx.stroke();

        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, ringR * 0.78, 0, TAU);
        ctx.stroke();

        // Runas girando
        ctx.rotate(t * 0.004);
        ctx.strokeStyle = rgba(ORANGE, 0.55 * pulse + 0.2);
        ctx.shadowColor = rgba(ORANGE, 0.8);
        for (let i = 0; i < 24; i++) {
            const a = (i / 24) * TAU;
            const r1 = ringR * 0.82;
            const r2 = ringR * (i % 3 === 0 ? 0.96 : 0.9);
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
            ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
            ctx.stroke();
        }

        // Estrela interna
        ctx.rotate(-t * 0.009);
        ctx.strokeStyle = rgba(CYAN, 0.25 * pulse + 0.1);
        ctx.beginPath();
        // Estrela de 5 pontas (pula um vértice a cada traço)
        for (let i = 0; i <= 5; i++) {
            const a = (i / 5) * TAU * 2 - Math.PI / 2;
            const px = Math.cos(a) * ringR * 0.7;
            const py = Math.sin(a) * ringR * 0.7;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();

        // Luz no chão
        const lg = ctx.createRadialGradient(cx, groundY, 0, cx, groundY, ringR);
        lg.addColorStop(0, rgba(CYAN, 0.25 + flash * 0.2));
        lg.addColorStop(1, rgba(CYAN, 0));
        ctx.save();
        ctx.translate(cx, groundY);
        ctx.scale(1, 0.22);
        ctx.translate(-cx, -groundY);
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.arc(cx, groundY, ringR, 0, TAU);
        ctx.fill();
        ctx.restore();
    }

    function drawCrystal() {
        const { size } = scene;
        const cx = scene.cx + mouse.x * 10;
        const cy = scene.cy + Math.sin(t * 0.02) * size * 0.08 + mouse.y * 6;
        const sides = 6;
        const rot = t * 0.008;
        const top = { x: 0, y: -size * 1.35, z: 0 };
        const bottom = { x: 0, y: size * 1.0, z: 0 };
        const ring = [];
        for (let i = 0; i < sides; i++) {
            const a = rot + (i / sides) * TAU;
            ring.push({ x: Math.cos(a) * size * 0.62, y: -size * 0.05, z: Math.sin(a) * size * 0.62 });
        }

        const faces = [];
        for (let i = 0; i < sides; i++) {
            const a = ring[i];
            const b = ring[(i + 1) % sides];
            const mid = (a.z + b.z) / 2;
            const ang = rot + ((i + 0.5) / sides) * TAU;
            faces.push({ pts: [top, a, b], z: mid, light: Math.cos(ang - 2.2), up: true });
            faces.push({ pts: [bottom, a, b], z: mid, light: Math.cos(ang - 2.2), up: false });
        }
        faces.sort((p, q) => p.z - q.z);

        // Aura
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const ag = ctx.createRadialGradient(cx, cy, size * 0.2, cx, cy, size * 2.4);
        ag.addColorStop(0, rgba(CYAN, 0.35 + flash * 0.3));
        ag.addColorStop(1, rgba(CYAN, 0));
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 2.4, 0, TAU);
        ctx.fill();
        ctx.restore();

        // Motes de trás
        drawMotes(cx, cy, false);

        for (const f of faces) {
            if (f.z < 0) continue;
            const l = (f.light + 1) / 2;
            const base = f.up ? 0.55 : 0.35;
            const r = Math.round(20 + 140 * l * base + flash * 60);
            const g = Math.round(90 + 150 * l * base + flash * 60);
            const b = Math.round(110 + 140 * l + flash * 40);
            ctx.beginPath();
            ctx.moveTo(cx + f.pts[0].x, cy + f.pts[0].y);
            ctx.lineTo(cx + f.pts[1].x, cy + f.pts[1].y);
            ctx.lineTo(cx + f.pts[2].x, cy + f.pts[2].y);
            ctx.closePath();
            ctx.fillStyle = `rgba(${Math.min(r, 255)},${Math.min(g, 255)},${Math.min(b, 255)},0.92)`;
            ctx.fill();
            ctx.strokeStyle = rgba([180, 255, 255], 0.35 + l * 0.4);
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Núcleo
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const cg = ctx.createRadialGradient(cx, cy - size * 0.1, 0, cx, cy - size * 0.1, size * 0.7);
        cg.addColorStop(0, `rgba(255,255,255,${0.55 + Math.sin(t * 0.06) * 0.15 + flash * 0.4})`);
        cg.addColorStop(0.4, rgba(CYAN, 0.25));
        cg.addColorStop(1, rgba(CYAN, 0));
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(cx, cy - size * 0.1, size * 0.7, 0, TAU);
        ctx.fill();
        ctx.restore();

        drawMotes(cx, cy, true);

        // Feixe vertical até o chão
        const bg = ctx.createLinearGradient(0, cy + size, 0, scene.groundY);
        bg.addColorStop(0, rgba(CYAN, 0.35));
        bg.addColorStop(1, rgba(CYAN, 0));
        ctx.fillStyle = bg;
        ctx.fillRect(cx - 1, cy + size, 2, scene.groundY - cy - size);
    }

    function drawMotes(cx, cy, front) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (const m of motes) {
            const z = Math.sin(m.a);
            if (front !== z > 0) continue;
            const x = cx + Math.cos(m.a) * m.r;
            const y = cy + m.y + z * m.r * 0.12;
            const a = 0.25 + (z + 1) * 0.3;
            ctx.fillStyle = rgba(CYAN, a);
            ctx.beginPath();
            ctx.arc(x, y, m.size * (0.7 + (z + 1) * 0.3), 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawEnemy(e) {
        const p = groundPoint(e.ang, e.dist);
        const s = 14 * e.size * (0.8 + Math.sin(e.ang) * 0.2 + 0.2);
        const hop = Math.abs(Math.sin(e.bob)) * s * 0.25;
        const alpha = e.hit ? e.dying : Math.min(1, (2.4 - e.dist) * 3 + 0.2);
        const x = p.x;
        const y = p.y - hop;
        const facing = Math.cos(e.ang) > 0 ? -1 : 1;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Sombra
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 2, s * 0.9, s * 0.22, 0, 0, TAU);
        ctx.fill();

        // Corpo (bolha com chifrinhos)
        ctx.fillStyle = "#0d0a09";
        ctx.strokeStyle = rgba(ORANGE, 0.35);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - s, y);
        ctx.quadraticCurveTo(x - s * 1.05, y - s * 1.5, x - s * 0.45, y - s * 1.7);
        ctx.lineTo(x - s * 0.6, y - s * 2.25);
        ctx.lineTo(x - s * 0.15, y - s * 1.8);
        ctx.quadraticCurveTo(x, y - s * 1.85, x + s * 0.15, y - s * 1.8);
        ctx.lineTo(x + s * 0.6, y - s * 2.25);
        ctx.lineTo(x + s * 0.45, y - s * 1.7);
        ctx.quadraticCurveTo(x + s * 1.05, y - s * 1.5, x + s, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Olhos
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = rgba(ORANGE, 1);
        ctx.shadowColor = rgba(ORANGE, 1);
        ctx.shadowBlur = 12;
        const ey = y - s * 1.1;
        const ex = x + facing * s * 0.15;
        ctx.fillRect(ex - s * 0.38, ey, s * 0.22, s * 0.12);
        ctx.fillRect(ex + s * 0.16, ey, s * 0.22, s * 0.12);
        ctx.restore();
    }

    function drawBolts() {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (const b of bolts) {
            for (const [lw, c, a] of [[8, CYAN, 0.15], [3, CYAN, 0.6], [1.2, [255, 255, 255], 1]]) {
                ctx.strokeStyle = rgba(c, a * b.life);
                ctx.lineWidth = lw;
                ctx.beginPath();
                b.segs.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
                ctx.stroke();
            }
        }
        for (const p of bursts) {
            ctx.fillStyle = rgba(p.c, p.life);
            ctx.fillRect(p.x, p.y, 2.2, 2.2);
        }
        ctx.restore();
    }

    function drawEmbers() {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (const e of embers) {
            const a = e.life * Math.min(1, e.y / h + 0.2);
            ctx.fillStyle = rgba(e.hue, a * 0.8);
            ctx.beginPath();
            ctx.arc(e.x - mouse.x * 20, e.y, e.size, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }

    function draw() {
        drawSky();
        drawRidges();
        drawRuneRing();

        // Inimigos atrás do cristal primeiro
        const sorted = [...enemies].sort((a, b) => Math.sin(a.ang) - Math.sin(b.ang));
        for (const e of sorted) if (Math.sin(e.ang) <= 0) drawEnemy(e);
        drawCrystal();
        for (const e of sorted) if (Math.sin(e.ang) > 0) drawEnemy(e);

        drawBolts();
        drawEmbers();
    }

    function loop() {
        if (!running) return;
        update();
        draw();
        raf = requestAnimationFrame(loop);
    }

    layout();

    if (reduceMotion) {
        for (let i = 0; i < 160; i++) update();
        draw();
    } else {
        loop();
    }

    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            layout();
            if (reduceMotion) draw();
        }, 120);
    });

    window.addEventListener("pointermove", (e) => {
        mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Pausa quando o hero sai da tela
    new IntersectionObserver(([entry]) => {
        if (reduceMotion) return;
        const visible = entry.isIntersecting;
        if (visible && !running) {
            running = true;
            loop();
        } else if (!visible) {
            running = false;
            cancelAnimationFrame(raf);
        }
    }).observe(canvas);
})();
