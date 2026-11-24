const ROBOT_MOVES = { up: { r: -1, c: 0 }, down: { r: 1, c: 0 }, left: { r: 0, c: -1 }, right: { r: 0, c: 1 } };
const CHESS_FILES = 'abcdefgh'.split('');
const CHESS_RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

const activityComputed = {
    // robot puzzle
    robotGridStyle() {
        return { gridTemplateColumns: 'repeat(' + (this.activity ? this.activity.size : 5) + ', 1fr)' };
    },
    robotCells() {
        if (!this.activity || this.a.engine !== 'robot') return [];
        const c = this.activity;
        const a = this.a;
        const same = function (p, r, col) { return p.r === r && p.c === col; };
        const cells = [];
        for (let r = 0; r < c.size; r++) {
            for (let col = 0; col < c.size; col++) {
                cells.push({
                    key: r + '-' + col,
                    wall: c.walls.some(function (w) { return same(w, r, col); }),
                    goal: same(c.goal, r, col),
                    item: c.items.some(function (it, i) { return same(it, r, col) && !a.collected.includes(i); }),
                    robot: same(a.pos, r, col)
                });
            }
        }
        return cells;
    },

    // colour mixing
    colourTarget() {
        if (!this.activity || this.a.engine !== 'colour') return null;
        const name = this.activity.rounds[this.a.round];
        return Object.values(this.activity.mixes).find(function (m) { return m.name === name; });
    },

    // memory game
    rhythmPattern() {
        if (!this.activity || this.a.engine !== 'rhythm') return [];
        return this.activity.patterns[this.a.round];
    },

    // mcq game
    triviaQuestion() {
        if (!this.activity || this.a.engine !== 'quiz') return null;
        return this.activity.questions[this.a.index];
    },

    // sliders game
    sliderResult() {
        if (!this.activity || this.a.engine !== 'slider') return null;
        return this.activity.evaluate(this.a.values);
    },
    sliderInZone() {
        const result = this.sliderResult;
        return !!result && result.meter >= this.activity.target[0] && result.meter <= this.activity.target[1];
    },
    sliderBandStyle() {
        const target = this.activity.target;
        return { left: target[0] + '%', width: (target[1] - target[0]) + '%' };
    },
    sliderFillStyle() {
        return { height: Math.min(100, this.sliderResult.meter) + '%', background: this.activity.fillColour || '#FF7F3F' };
    },

    // chess puzzle
    chessSquares() {
        if (!this.activity || this.a.engine !== 'chess') return [];
        const squares = [];
        const pieces = this.a.pieces;
        CHESS_RANKS.forEach(function (rank, ri) {
            CHESS_FILES.forEach(function (file, fi) {
                const sq = file + rank;
                squares.push({ sq: sq, dark: (ri + fi) % 2 === 1, piece: pieces.find(function (p) { return p.sq === sq; }) || null });
            });
        });
        return squares;
    },
    // valid squares for rook to move
    chessLegal() {
        if (!this.activity || this.a.engine !== 'chess' || !this.a.selected) return [];
        const from = this.a.selected;
        const pieces = this.a.pieces;
        const mover = pieces.find(function (p) { return p.sq === from; });
        const legal = [];
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dir) {
            let f = CHESS_FILES.indexOf(from[0]) + dir[0];
            let r = Number(from[1]) + dir[1];
            while (f >= 0 && f < 8 && r >= 1 && r <= 8) {
                const sq = CHESS_FILES[f] + r;
                const other = pieces.find(function (p) { return p.sq === sq; });
                if (other) {
                    if (other.side !== mover.side) legal.push(sq);
                    break;
                }
                legal.push(sq);
                f += dir[0];
                r += dir[1];
            }
        });
        return legal;
    }
};

const activityMethods = {
    startActivity() {
        this.stopActivityTimers();
        this.a = this.activity ? this.makeActivityState(this.activity) : {};
    },
    stopActivityTimers() {
        clearTimeout(this.robotTimer);
        clearTimeout(this.wrongTimer);
        this.rhythmTimers.forEach(clearTimeout);
        this.rhythmTimers = [];
    },
    makeActivityState(c) {
        const state = { engine: c.engine };
        if (c.engine === 'robot') {
            return Object.assign(state, { pos: { r: c.start.r, c: c.start.c }, collected: [], commands: [], running: false,
                activeIndex: -1, status: 'idle', message: 'Add arrow commands, then press Run.' });
        }
        if (c.engine === 'colour') {
            return Object.assign(state, { round: 0, picked: [], result: null, mistakes: 0, feedback: 'Pick two colours to mix.',
                state: '', locked: false, done: false });
        }
        if (c.engine === 'rhythm') {
            return Object.assign(state, { round: 0, phase: 'ready', lit: -1, input: [], mistakes: 0, muted: false, state: '',
                message: 'Press Start to see the pattern.' });
        }
        if (c.engine === 'quiz') {
            return Object.assign(state, { index: 0, picked: null, score: 0, finished: false });
        }
        if (c.engine === 'order') {
            return Object.assign(state, { pool: this.shuffleItems(c.steps.map(function (text, id) { return { id: id, text: text }; })),
                placed: [], mistakes: 0, wrong: -1, done: false });
        }
        if (c.engine === 'match') {
            return Object.assign(state, { right: this.shuffleItems(c.pairs.map(function (p, id) { return { id: id, text: p.right }; })),
                selected: -1, matched: [], mistakes: 0, wrong: -1, done: false });
        }
        if (c.engine === 'slider') {
            const values = {};
            c.sliders.forEach(function (s) { values[s.id] = s.value; });
            return Object.assign(state, { values: values, attempts: 0, solved: false });
        }
        if (c.engine === 'chess') {
            return Object.assign(state, { pieces: c.pieces.map(function (p) { return Object.assign({}, p); }), selected: '',
                attempts: 0, solved: false, message: 'White to move. Select the rook.', state: '' });
        }
        return state;
    },
    // shuffles list 
    shuffleItems(items) {
        const mixed = items.slice();
        do {
            for (let i = mixed.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = mixed[i];
                mixed[i] = mixed[j];
                mixed[j] = temp;
            }
        } while (mixed.length > 1 && mixed.every(function (m, i) { return m.id === i; }));
        return mixed;
    },
    finishActivity(score, max) {
        this.onActivityComplete({ id: this.currentActivityId, score: score, max: max });
    },

    // robot actions
    robotAdd(direction) {
        if (this.a.running || this.a.commands.length >= this.activity.maxCommands) return;
        this.a.commands.push(direction);
        this.robotReset();
    },
    robotUndo() {
        if (this.a.running) return;
        this.a.commands.pop();
        this.robotReset();
    },
    robotClear() {
        if (this.a.running) return;
        this.a.commands = [];
        this.robotReset();
    },
    robotReset() {
        clearTimeout(this.robotTimer);
        const a = this.a;
        a.running = false;
        a.pos = { r: this.activity.start.r, c: this.activity.start.c };
        a.collected = [];
        a.activeIndex = -1;
        a.status = 'idle';
        a.message = a.commands.length ? 'Ready when you are. Press Run!' : 'Add arrow commands, then press Run.';
    },
    robotRun() {
        if (this.a.running || this.a.commands.length === 0) return;
        this.robotReset();
        this.a.running = true;
        this.robotStep(0);
    },
    robotStep(i) {
        const a = this.a;
        const c = this.activity;
        if (i >= a.commands.length) return this.robotFinish();
        a.activeIndex = i;
        const move = ROBOT_MOVES[a.commands[i]];
        const next = { r: a.pos.r + move.r, c: a.pos.c + move.c };
        const outside = next.r < 0 || next.c < 0 || next.r >= c.size || next.c >= c.size;
        const blocked = c.walls.some(function (w) { return w.r === next.r && w.c === next.c; });
        if (outside || blocked) {
            a.running = false;
            a.status = 'crash';
            a.message = 'Bonk! The robot hit ' + (outside ? 'the edge' : 'a crate') + '. Fix your program and try again.';
            return;
        }
        a.pos = next;
        const itemIndex = c.items.findIndex(function (it) { return it.r === next.r && it.c === next.c; });
        if (itemIndex > -1 && !a.collected.includes(itemIndex)) a.collected.push(itemIndex);
        if (next.r === c.goal.r && next.c === c.goal.c) return this.robotFinish();
        this.robotTimer = setTimeout(() => this.robotStep(i + 1), 420);
    },
    robotFinish() {
        const a = this.a;
        const c = this.activity;
        a.running = false;
        const atGoal = a.pos.r === c.goal.r && a.pos.c === c.goal.c;
        const total = c.items.length;
        if (atGoal && a.collected.length === total) {
            a.status = 'success';
            a.message = 'Delivered! The robot collected every ' + c.itemName + ' and reached the dock.';
            this.finishActivity(total + 1, total + 1);
        } else if (atGoal) {
            a.status = 'short';
            a.message = 'You reached the dock, but missed ' + (total - a.collected.length) + ' ' + c.itemName + '(s). Plan a route through them all.';
        } else {
            a.status = 'short';
            a.message = 'The robot stopped short of the dock. Add more commands!';
        }
    },

    // colour mixing activity
    colourOf(id) {
        return this.activity.colours.find(function (c) { return c.id === id; });
    },
    colourSlotStyle(i) {
        const picked = this.a.picked[i] ? this.colourOf(this.a.picked[i]) : null;
        return { background: picked ? picked.hex : 'transparent' };
    },
    colourPick(id) {
        const a = this.a;
        if (a.locked || a.done) return;
        if (a.picked.length >= 2) {
            a.picked = [];
            a.result = null;
            a.state = '';
        }
        a.picked.push(id);
        if (a.picked.length === 2) this.colourEvaluate();
        else a.feedback = 'Now pick a second colour.';
    },
    colourEvaluate() {
        const a = this.a;
        const c = this.activity;
        const first = a.picked[0];
        const second = a.picked[1];
        if (first === second) {
            a.result = this.colourOf(first);
            a.state = 'bad';
            a.mistakes++;
            a.feedback = 'Mixing a colour with itself changes nothing. Pick two different colours!';
            return;
        }
        const mix = c.mixes[[first, second].sort().join('+')];
        a.result = mix;
        if (mix.name === c.rounds[a.round]) {
            a.state = 'ok';
            a.locked = true;
            if (a.round === c.rounds.length - 1) {
                a.done = true;
                a.feedback = 'Brilliant! You mixed all three secondary colours.';
                this.finishActivity(Math.max(1, 3 - a.mistakes), 3);
            } else {
                a.feedback = 'Yes! ' + this.colourOf(first).name + ' + ' + this.colourOf(second).name + ' makes ' + mix.name + '.';
            }
        } else {
            a.state = 'bad';
            a.mistakes++;
            a.feedback = 'That makes ' + mix.name + '. We need ' + c.rounds[a.round] + ', try again!';
        }
    },
    colourNext() {
        this.a.round++;
        this.colourClear();
    },
    colourClear() {
        const a = this.a;
        a.picked = [];
        a.result = null;
        a.state = '';
        a.locked = false;
        a.feedback = 'Pick two colours to mix.';
    },

    // memory game
    playTone(frequency) {
        if (!this.activity.sound || this.a.muted || !frequency) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            if (!this.audioCtx) this.audioCtx = new AudioContextClass();
            const ctx = this.audioCtx;
            const oscillator = ctx.createOscillator();
            const volume = ctx.createGain();
            oscillator.type = 'triangle';
            oscillator.frequency.value = frequency;
            volume.gain.setValueAtTime(0.25, ctx.currentTime);
            volume.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            oscillator.connect(volume);
            volume.connect(ctx.destination);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.4);
        } catch (e) { /* sound is optional */ }
    },
    rhythmLater(fn, ms) {
        this.rhythmTimers.push(setTimeout(fn, ms));
    },
    rhythmFlash(id) {
        this.a.lit = id;
        this.playTone(this.activity.pads[id].freq);
        this.rhythmLater(() => { if (this.a.lit === id) this.a.lit = -1; }, 280);
    },
    rhythmListen() {
        const a = this.a;
        if (a.phase === 'playing') return;
        this.rhythmTimers.forEach(clearTimeout);
        this.rhythmTimers = [];
        a.input = [];
        a.state = '';
        a.phase = 'playing';
        a.message = 'Watch carefully...';
        const pattern = this.rhythmPattern;
        pattern.forEach((padId, i) => this.rhythmLater(() => this.rhythmFlash(padId), 300 + i * 600));
        this.rhythmLater(() => {
            a.phase = 'input';
            a.message = 'Your turn! Repeat the ' + this.activity.noun + '.';
        }, 300 + pattern.length * 600);
    },
    rhythmTap(id) {
        const a = this.a;
        this.rhythmFlash(id);
        if (a.phase !== 'input') return;
        a.input.push(id);
        const pattern = this.rhythmPattern;
        if (pattern[a.input.length - 1] !== id) {
            a.phase = 'ready';
            a.input = [];
            a.state = 'bad';
            a.mistakes++;
            a.message = 'Not quite. Press Replay and try again!';
            return;
        }
        if (a.input.length === pattern.length) {
            if (a.round === this.activity.patterns.length - 1) {
                a.phase = 'won';
                a.state = 'ok';
                a.message = 'Nailed it! All three patterns matched.';
                this.finishActivity(Math.max(1, 3 - a.mistakes), 3);
            } else {
                a.round++;
                a.phase = 'ready';
                a.input = [];
                a.state = 'ok';
                a.message = 'Nice! The next one is longer. Press Replay.';
            }
        }
    },

    // mcq quiz
    triviaChoose(i) {
        const a = this.a;
        if (a.picked !== null) return;
        a.picked = i;
        if (i === this.triviaQuestion.answer) a.score++;
    },
    triviaNext() {
        const a = this.a;
        const total = this.activity.questions.length;
        if (a.index === total - 1) {
            a.finished = true;
            this.finishActivity(a.score, total);
        } else {
            a.index++;
            a.picked = null;
        }
    },

    // order puzzle
    orderTap(item) {
        const a = this.a;
        if (a.done) return;
        if (item.id === a.placed.length) {
            a.placed.push(item);
            a.pool = a.pool.filter(function (p) { return p.id !== item.id; });
            if (a.placed.length === this.activity.steps.length) {
                a.done = true;
                const total = this.activity.steps.length;
                this.finishActivity(Math.max(1, total - a.mistakes), total);
            }
        } else {
            a.mistakes++;
            a.wrong = item.id;
            clearTimeout(this.wrongTimer);
            this.wrongTimer = setTimeout(() => { this.a.wrong = -1; }, 600);
        }
    },

    // matching activity
    matchPickLeft(i) {
        if (!this.a.matched.includes(i) && !this.a.done) this.a.selected = i;
    },
    matchPickRight(item) {
        const a = this.a;
        if (a.selected < 0 || a.matched.includes(item.id) || a.done) return;
        if (item.id === a.selected) {
            a.matched.push(item.id);
            a.selected = -1;
            const total = this.activity.pairs.length;
            if (a.matched.length === total) {
                a.done = true;
                this.finishActivity(Math.max(1, total - a.mistakes), total);
            }
        } else {
            a.mistakes++;
            a.wrong = item.id;
            clearTimeout(this.wrongTimer);
            this.wrongTimer = setTimeout(() => { this.a.wrong = -1; }, 600);
        }
    },

    // sliders actions
    sliderLockIn() {
        const a = this.a;
        if (a.solved) return;
        a.attempts++;
        if (this.sliderInZone) {
            a.solved = true;
            this.finishActivity(Math.max(1, 4 - a.attempts), 3);
        }
    },
    sliderReset() {
        const a = this.a;
        this.activity.sliders.forEach(function (s) { a.values[s.id] = s.value; });
        a.attempts = 0;
        a.solved = false;
    },

    // chess actions
    chessClick(square) {
        const a = this.a;
        const c = this.activity;
        if (a.solved) return;
        if (square.piece && square.piece.movable) {
            a.selected = a.selected === square.sq ? '' : square.sq;
            a.message = a.selected ? 'Now choose where the rook goes.' : 'White to move. Select the rook.';
            a.state = '';
            return;
        }
        if (!a.selected) {
            a.message = 'Select the white rook first.';
            return;
        }
        if (!this.chessLegal.includes(square.sq)) {
            a.message = 'Rooks move in straight lines, across empty squares.';
            a.state = 'bad';
            return;
        }
        a.attempts++;
        if (a.selected === c.solution.from && square.sq === c.solution.to) {
            a.pieces.find(function (p) { return p.sq === a.selected; }).sq = square.sq;
            a.solved = true;
            a.selected = '';
            a.state = 'ok';
            a.message = 'Checkmate! The king\'s own pawns trap it. That pattern is called a back-rank mate.';
            this.finishActivity(Math.max(1, 4 - a.attempts), 3);
        } else {
            a.selected = '';
            a.state = 'bad';
            a.message = 'That isn\'t checkmate. ' + c.hint;
        }
    }
};