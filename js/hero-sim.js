/**
 * hero-sim.js
 * Hero visual: a car on an occupancy grid plans with A* and tracks the plan
 * with Pure Pursuit on a kinematic bicycle model. Click to set a new goal.
 */

const HeroSim = {
    start(canvas) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const bg = document.createElement('canvas');
        const bgx = bg.getContext('2d');
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

        const CELL = 18;          // px per grid cell
        const WB = 15;            // wheelbase, px
        const LD = 34;            // lookahead distance, px
        const VMAX = 70;          // px/s
        const MAX_STEER = 0.6;    // rad
        const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

        let W, H, dpr, cols, rows, grid, reach = [], reachable;
        let car, path = [], pi = 0, goal = null, trail = [], look = null, horizon = [];
        let colors = {}, visible = true, last = 0, waitUntil = 0, frame = 0, goalTimer;

        let seed = 11;
        const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const idx = (c, r) => r * cols + c;
        const inGrid = (c, r) => c >= 0 && r >= 0 && c < cols && r < rows;
        const free = (c, r) => inGrid(c, r) && grid[idx(c, r)] === 0;
        const center = i => ({ x: (i % cols + 0.5) * CELL, y: (Math.floor(i / cols) + 0.5) * CELL });
        const cellAt = (x, y) => idx(
            Math.min(cols - 1, Math.max(0, Math.floor(x / CELL))),
            Math.min(rows - 1, Math.max(0, Math.floor(y / CELL))));

        function readColors() {
            const s = getComputedStyle(canvas);
            const v = n => s.getPropertyValue(n).trim();
            colors = { surface: v('--surface'), line: v('--line'), ink: v('--ink'), muted: v('--muted'), accent: v('--accent'), signal: v('--signal') };
        }

        // ---------- world ----------
        function flood(start) {
            const seen = new Uint8Array(cols * rows), out = [start];
            seen[start] = 1;
            for (let k = 0; k < out.length; k++) {
                const c = out[k] % cols, r = Math.floor(out[k] / cols);
                for (let d = 0; d < 4; d++) {
                    const nc = c + DIRS[d][0], nr = r + DIRS[d][1];
                    if (free(nc, nr) && !seen[idx(nc, nr)]) { seen[idx(nc, nr)] = 1; out.push(idx(nc, nr)); }
                }
            }
            return { list: out, set: seen };
        }

        function buildWorld() {
            const rect = canvas.getBoundingClientRect();
            W = rect.width; H = rect.height;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = bg.width = Math.round(W * dpr);
            canvas.height = bg.height = Math.round(H * dpr);
            cols = Math.ceil(W / CELL); rows = Math.ceil(H / CELL);
            grid = new Uint8Array(cols * rows);
            seed = 11;

            // Obstacles: rectangular blocks, kept off the outer ring.
            const blocks = Math.round(cols * rows / 48);
            for (let b = 0; b < blocks; b++) {
                const w = 1 + Math.floor(rand() * 4), h = 1 + Math.floor(rand() * 3);
                const c0 = 2 + Math.floor(rand() * Math.max(1, cols - w - 4));
                const r0 = 2 + Math.floor(rand() * Math.max(1, rows - h - 4));
                for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) if (inGrid(c, r)) grid[idx(c, r)] = 1;
            }
            // Inflation layer (2) around obstacles and along the edges.
            const inflated = grid.slice();
            for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
                if (grid[idx(c, r)] !== 1) continue;
                for (const [dc, dr] of DIRS) if (inGrid(c + dc, r + dr) && grid[idx(c + dc, r + dr)] === 0) inflated[idx(c + dc, r + dr)] = 2;
            }
            for (let c = 0; c < cols; c++) { if (!inflated[c]) inflated[c] = 2; if (!inflated[idx(c, rows - 1)]) inflated[idx(c, rows - 1)] = 2; }
            for (let r = 0; r < rows; r++) { if (!inflated[idx(0, r)]) inflated[idx(0, r)] = 2; if (!inflated[idx(cols - 1, r)]) inflated[idx(cols - 1, r)] = 2; }
            grid = inflated;

            // Start in the largest open region, near the left edge.
            const freeCount = grid.reduce((n, v) => n + (v === 0), 0);
            let best = null;
            for (let t = 0; t < 40; t++) {
                const c = t === 0 ? 3 : 2 + Math.floor(rand() * (cols - 4));
                const r = t === 0 ? Math.floor(rows / 2) : 2 + Math.floor(rand() * (rows - 4));
                if (!free(c, r)) continue;
                const f = flood(idx(c, r));
                if (!best || f.list.length > best.list.length) best = f;
                if (f.list.length > freeCount * 0.6) break;
            }
            reach = best ? best.list : [];
            reachable = best ? best.set : new Uint8Array(cols * rows);
            if (!reach.length) return false;

            const s = center(reach[0]);
            car = { x: s.x, y: s.y, th: 0, v: 0, steer: 0 };
            trail = []; path = []; goal = null;
            return true;
        }

        // ---------- planning ----------
        function astar(s, g) {
            const N = cols * rows;
            const gs = new Float32Array(N).fill(Infinity), f = new Float32Array(N).fill(Infinity);
            const from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
            const gc = g % cols, gr = Math.floor(g / cols);
            const h = i => {
                const dx = Math.abs(i % cols - gc), dy = Math.abs(Math.floor(i / cols) - gr);
                return Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
            };
            const open = [s];
            gs[s] = 0; f[s] = h(s);
            while (open.length) {
                // ponytail: linear scan of the open list; grid is a few thousand cells. Binary heap if it grows.
                let bi = 0;
                for (let k = 1; k < open.length; k++) if (f[open[k]] < f[open[bi]]) bi = k;
                const cur = open[bi];
                open[bi] = open[open.length - 1]; open.pop();
                if (cur === g) break;
                if (closed[cur]) continue;
                closed[cur] = 1;
                const cc = cur % cols, cr = Math.floor(cur / cols);
                for (const [dc, dr] of DIRS) {
                    const nc = cc + dc, nr = cr + dr;
                    if (!free(nc, nr)) continue;
                    if (dc && dr && (!free(cc + dc, cr) || !free(cc, cr + dr))) continue; // no corner cutting
                    const ni = idx(nc, nr);
                    if (closed[ni]) continue;
                    const ng = gs[cur] + (dc && dr ? 1.414 : 1);
                    if (ng < gs[ni]) { gs[ni] = ng; f[ni] = ng + h(ni); from[ni] = cur; open.push(ni); }
                }
            }
            if (s !== g && from[g] === -1) return null;
            const cells = [];
            for (let i = g; i !== -1; i = from[i]) cells.push(i);
            return cells.reverse();
        }

        function lineOfSight(a, b) {
            const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (CELL / 4));
            for (let k = 0; k <= n; k++) {
                const x = a.x + (b.x - a.x) * k / n, y = a.y + (b.y - a.y) * k / n;
                if (!free(Math.floor(x / CELL), Math.floor(y / CELL))) return false;
            }
            return true;
        }

        function smooth(cells) {
            // String-pull the grid path, then round the corners (Chaikin, 2 passes), then resample.
            const pts = cells.map(center);
            pts[0] = { x: car.x, y: car.y };
            let pulled = [pts[0]];
            for (let k = 1, anchor = 0; k < pts.length; k++) {
                if (k === pts.length - 1 || !lineOfSight(pts[anchor], pts[k + 1])) { pulled.push(pts[k]); anchor = k; }
            }
            for (let pass = 0; pass < 2; pass++) {
                const out = [pulled[0]];
                for (let k = 0; k < pulled.length - 1; k++) {
                    const a = pulled[k], b = pulled[k + 1];
                    out.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 }, { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
                }
                out.push(pulled[pulled.length - 1]);
                pulled = out;
            }
            const dense = [pulled[0]];
            for (let k = 1; k < pulled.length; k++) {
                const a = pulled[k - 1], b = pulled[k], n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4));
                for (let j = 1; j <= n; j++) dense.push({ x: a.x + (b.x - a.x) * j / n, y: a.y + (b.y - a.y) * j / n });
            }
            return dense;
        }

        function setGoal(cell) {
            const cells = astar(cellAt(car.x, car.y), cell);
            if (!cells) return false;
            goal = center(cell);
            path = smooth(cells);
            pi = 0;
            return true;
        }

        function randomGoal() {
            const diag = Math.hypot(W, H);
            for (let t = 0; t < 60; t++) {
                const cell = reach[Math.floor(rand() * reach.length)];
                const p = center(cell);
                if (Math.hypot(p.x - car.x, p.y - car.y) > diag * 0.4 && setGoal(cell)) return;
            }
            setGoal(reach[Math.floor(rand() * reach.length)]);
        }

        function nearestReachable(x, y) {
            const c = cellAt(x, y);
            if (reachable[c]) return c;
            let best = reach[0], bd = Infinity;
            for (const i of reach) {
                const p = center(i), d = (p.x - x) ** 2 + (p.y - y) ** 2;
                if (d < bd) { bd = d; best = i; }
            }
            return best;
        }

        // ---------- control ----------
        function step(dt, now) {
            if (!path.length || now < waitUntil) return;
            if (!goal || Math.hypot(goal.x - car.x, goal.y - car.y) < 6) {
                car.v = 0;
                waitUntil = now + 900;
                path = [];
                goalTimer = setTimeout(randomGoal, 900);
                return;
            }
            // Advance the nearest-point index (search a short window ahead).
            let bd = Infinity;
            for (let k = pi; k < Math.min(path.length, pi + 40); k++) {
                const d = Math.hypot(path[k].x - car.x, path[k].y - car.y);
                if (d < bd) { bd = d; pi = k; }
            }
            let k = pi;
            while (k < path.length - 1 && Math.hypot(path[k].x - car.x, path[k].y - car.y) < LD) k++;
            look = path[k];

            let alpha = Math.atan2(look.y - car.y, look.x - car.x) - car.th;
            alpha = Math.atan2(Math.sin(alpha), Math.cos(alpha));
            const target = Math.max(-MAX_STEER, Math.min(MAX_STEER, Math.atan2(2 * WB * Math.sin(alpha), LD)));
            car.steer += (target - car.steer) * Math.min(1, dt * 10);

            const toGoal = Math.hypot(goal.x - car.x, goal.y - car.y);
            const vTarget = VMAX * Math.min(1, Math.max(0.2, toGoal / 70)) * (1 - 0.45 * Math.abs(car.steer) / MAX_STEER);
            car.v += (vTarget - car.v) * Math.min(1, dt * 3);

            car.x += car.v * Math.cos(car.th) * dt;
            car.y += car.v * Math.sin(car.th) * dt;
            car.th += car.v / WB * Math.tan(car.steer) * dt;
            // ponytail: no reverse gear, so a U-turn can swing wide; keep the car on the canvas.
            car.x = Math.min(W - 10, Math.max(10, car.x));
            car.y = Math.min(H - 10, Math.max(10, car.y));

            const lastT = trail[trail.length - 1];
            if (!lastT || Math.hypot(lastT.x - car.x, lastT.y - car.y) > 5) {
                trail.push({ x: car.x, y: car.y });
                if (trail.length > 500) trail.shift();
            }
        }

        function predict() {
            // Roll the bicycle model forward under the current steering command.
            horizon = [];
            let { x, y, th } = car;
            const v = Math.max(car.v, 25), h = 0.1;
            for (let n = 0; n < 14; n++) {
                x += v * Math.cos(th) * h; y += v * Math.sin(th) * h; th += v / WB * Math.tan(car.steer) * h;
                horizon.push({ x, y });
            }
        }

        // ---------- drawing ----------
        function drawStatic() {
            bgx.setTransform(dpr, 0, 0, dpr, 0, 0);
            bgx.fillStyle = colors.surface;
            bgx.fillRect(0, 0, W, H);

            bgx.fillStyle = colors.accent;
            bgx.globalAlpha = 0.08;
            for (let i = 0; i < grid.length; i++) if (grid[i] === 2) bgx.fillRect((i % cols) * CELL, Math.floor(i / cols) * CELL, CELL, CELL);

            bgx.globalAlpha = 0.7;
            bgx.strokeStyle = colors.line;
            bgx.lineWidth = 1;
            bgx.beginPath();
            for (let c = 1; c < cols; c++) { bgx.moveTo(c * CELL + 0.5, 0); bgx.lineTo(c * CELL + 0.5, H); }
            for (let r = 1; r < rows; r++) { bgx.moveTo(0, r * CELL + 0.5); bgx.lineTo(W, r * CELL + 0.5); }
            bgx.stroke();

            bgx.globalAlpha = 0.9;
            bgx.fillStyle = colors.ink;
            for (let i = 0; i < grid.length; i++) if (grid[i] === 1) bgx.fillRect((i % cols) * CELL, Math.floor(i / cols) * CELL, CELL, CELL);
            bgx.globalAlpha = 1;
        }

        function polyline(pts, from = 0) {
            ctx.beginPath();
            ctx.moveTo(pts[from].x, pts[from].y);
            for (let k = from + 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
            ctx.stroke();
        }

        function draw() {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(bg, 0, 0);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.lineCap = ctx.lineJoin = 'round';

            if (trail.length > 1) {
                ctx.strokeStyle = colors.muted; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]);
                polyline(trail.concat([{ x: car.x, y: car.y }]));
                ctx.setLineDash([]);
            }
            if (path.length > 1 && pi < path.length - 1) {
                ctx.strokeStyle = colors.accent; ctx.lineWidth = 2.5;
                polyline(path, pi);
            }
            if (goal) {
                ctx.strokeStyle = colors.accent; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(goal.x, goal.y, 8, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = colors.accent;
                ctx.beginPath(); ctx.arc(goal.x, goal.y, 2.5, 0, Math.PI * 2); ctx.fill();
            }
            if (look && path.length) {
                ctx.strokeStyle = colors.signal; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(car.x, car.y); ctx.lineTo(look.x, look.y); ctx.stroke();
                ctx.beginPath(); ctx.arc(look.x, look.y, 4, 0, Math.PI * 2); ctx.stroke();
            }
            if (path.length) {
                ctx.fillStyle = colors.signal;
                horizon.forEach((p, n) => {
                    ctx.globalAlpha = 1 - n / horizon.length * 0.75;
                    ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2); ctx.fill();
                });
                ctx.globalAlpha = 1;
            }

            // Car: body, wheels (front wheels show the steering angle), heading mark.
            ctx.save();
            ctx.translate(car.x, car.y);
            ctx.rotate(car.th);
            ctx.fillStyle = colors.ink;
            const wheel = (x, y, a) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillRect(-4, -1.6, 8, 3.2); ctx.restore(); };
            wheel(-WB / 2, -7.5, 0); wheel(-WB / 2, 7.5, 0); wheel(WB / 2, -7.5, car.steer); wheel(WB / 2, 7.5, car.steer);
            ctx.beginPath(); ctx.roundRect(-13, -6, 26, 12, 3); ctx.fill();
            ctx.fillStyle = colors.signal;
            ctx.fillRect(6, -4, 3, 8);
            ctx.restore();
        }

        // ---------- loop ----------
        function tick(now) {
            const dt = Math.min(0.05, (now - last) / 1000 || 0);
            last = now;
            step(dt, now);
            if (++frame % 2 === 0) predict();
            draw();
            if (visible) requestAnimationFrame(tick);
        }

        function reset() {
            clearTimeout(goalTimer);
            readColors();
            if (!buildWorld()) return;
            drawStatic();
            randomGoal();
            predict();
            draw();
        }

        reset();

        canvas.addEventListener('pointerdown', e => {
            const r = canvas.getBoundingClientRect();
            clearTimeout(goalTimer);
            setGoal(nearestReachable(e.clientX - r.left, e.clientY - r.top));
            waitUntil = 0;
            predict();
            if (reduce) draw();
        });

        document.addEventListener('themechange', () => { readColors(); drawStatic(); draw(); });

        let resizeTimer;
        new ResizeObserver(() => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(reset, 150);
        }).observe(canvas);

        if (reduce) return; // Static frame only: path and car, no motion.

        new IntersectionObserver(([entry]) => {
            const was = visible;
            visible = entry.isIntersecting;
            if (visible && !was) { last = performance.now(); requestAnimationFrame(tick); }
        }).observe(canvas);
        requestAnimationFrame(t => { last = t; tick(t); });
    }
};

window.HeroSim = HeroSim;
