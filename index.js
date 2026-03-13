/**
 * ASCENT | Toposonic Corpus Explorer
 * Pro Engine & UI Logic
 */

class AudioEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.buffer = null;
        this.isPlaying = false;
        this.isRecording = false;
        
        // Settings
        this.settings = {
            rate: 20,
            size: 0.1,
            radius: 0.2,
            spread: 0.5,
            jitter: 0.1,
            mode: 'point',
            reverbMix: 0.3,
            delayFeedback: 0.4,
            envelope: 'gaussian'
        };

        this.setupNodes();
    }

    setupNodes() {
        this.masterBus = this.ctx.createGain();
        this.masterBus.gain.value = 0.8;

        // Recording Destination
        this.recDest = this.ctx.createMediaStreamDestination();
        this.masterBus.connect(this.recDest);
        this.masterBus.connect(this.ctx.destination);

        // FX Chain: Reverb & Delay
        this.reverbNode = this.ctx.createConvolver();
        this.reverbDry = this.ctx.createGain();
        this.reverbWet = this.ctx.createGain();
        
        this.delayNode = this.ctx.createDelay(2.0);
        this.delayFeedback = this.ctx.createGain();
        this.delayWet = this.ctx.createGain();

        // Chain Connections
        this.delayNode.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delayNode);
        this.delayNode.connect(this.delayWet);
        
        this.reverbDry.connect(this.masterBus);
        this.reverbWet.connect(this.masterBus);
        this.delayWet.connect(this.masterBus);

        this.updateFX();
        this.createSimpleReverb();
    }

    createSimpleReverb() {
        // Create an artificial impulse response
        const length = this.ctx.sampleRate * 2;
        const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
        for (let i = 0; i < length; i++) {
            const decay = Math.pow(1 - i / length, 2);
            impulse.getChannelData(0)[i] = (Math.random() * 2 - 1) * decay;
            impulse.getChannelData(1)[i] = (Math.random() * 2 - 1) * decay;
        }
        this.reverbNode.buffer = impulse;
    }

    updateFX() {
        this.reverbWet.gain.setTargetAtTime(this.settings.reverbMix, this.ctx.currentTime, 0.1);
        this.reverbDry.gain.setTargetAtTime(1 - this.settings.reverbMix, this.ctx.currentTime, 0.1);
        this.delayFeedback.gain.setTargetAtTime(this.settings.delayFeedback, this.ctx.currentTime, 0.1);
        this.delayWet.gain.setTargetAtTime(0.3, this.ctx.currentTime, 0.1);
    }

    async loadBuffer(file) {
        const arrayBuffer = await file.arrayBuffer();
        this.buffer = await this.ctx.decodeAudioData(arrayBuffer);
        return this.buffer;
    }

    start() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.isPlaying = true;
        this.scheduleGrains();
    }

    stop() {
        this.isPlaying = false;
    }

    scheduleGrains() {
        if (!this.isPlaying) return;
        const now = this.ctx.currentTime;
        this.triggerGrain(now);
        const interval = 1.0 / this.settings.rate;
        setTimeout(() => this.scheduleGrains(), interval * 1000);
    }

    triggerGrain(time) {
        if (!this.buffer) return;

        const posX = this.currentX || 0.5;
        const offset = posX * this.buffer.duration;
        const duration = this.settings.size * (1 + (Math.random() - 0.5) * this.settings.jitter);
        
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffer;

        const env = this.ctx.createGain();
        const panner = this.ctx.createStereoPanner();

        panner.pan.value = (Math.random() - 0.5) * this.settings.spread * 2;

        source.connect(env);
        env.connect(panner);
        
        // Connect to dry/wet split
        panner.connect(this.reverbDry);
        panner.connect(this.reverbNode);
        panner.connect(this.delayNode);

        this.applyEnvelope(env, time, duration);

        source.start(time, offset, duration);
        source.stop(time + duration);

        source.onended = () => {
            source.disconnect();
            env.disconnect();
            panner.disconnect();
        };
    }

    applyEnvelope(node, time, duration) {
        const attack = duration * 0.1;
        const release = duration * 0.9;

        node.gain.setValueAtTime(0, time);
        
        if (this.settings.envelope === 'gaussian') {
            node.gain.setTargetAtTime(1, time, attack * 0.5);
            node.gain.setTargetAtTime(0, time + attack, release * 0.5);
        } else if (this.settings.envelope === 'triangle') {
            node.gain.linearRampToValueAtTime(1, time + duration / 2);
            node.gain.linearRampToValueAtTime(0, time + duration);
        } else {
            node.gain.exponentialRampToValueAtTime(1, time + attack);
            node.gain.exponentialRampToValueAtTime(0.001, time + duration);
        }
    }

    updatePosition(x, y) {
        this.currentX = x;
        this.currentY = y;
    }

    toggleRecording() {
        if (this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
        } else {
            this.chunks = [];
            this.mediaRecorder = new MediaRecorder(this.recDest.stream);
            this.mediaRecorder.ondataavailable = (e) => this.chunks.push(e.data);
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.chunks, { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ascent-session-${Date.now()}.wav`;
                a.click();
            };
            this.mediaRecorder.start();
            this.isRecording = true;
            this.recStartTime = Date.now();
        }
        return this.isRecording;
    }
}

class Visualizer {
    constructor(topoId, waveId) {
        this.topoCanvas = document.getElementById(topoId);
        this.waveCanvas = document.getElementById(waveId);
        this.topoCtx = this.topoCanvas.getContext('2d');
        this.waveCtx = this.waveCanvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.noiseData = [];
        this.generateNoise();
    }

    resize() {
        this.width = this.topoCanvas.parentElement.clientWidth;
        this.height = this.topoCanvas.parentElement.clientHeight;
        this.topoCanvas.width = this.width;
        this.topoCanvas.height = this.height;
        
        this.waveWidth = this.waveCanvas.parentElement.clientWidth;
        this.waveHeight = this.waveCanvas.parentElement.clientHeight;
        this.waveCanvas.width = this.waveWidth;
        this.waveCanvas.height = this.waveHeight;
    }

    generateNoise() {
        const res = 20;
        for (let y = 0; y <= res; y++) {
            this.noiseData[y] = [];
            for (let x = 0; x <= res; x++) {
                this.noiseData[y][x] = Math.random();
            }
        }
    }

    getNoise(x, y) {
        const res = 20;
        const gx = x * res;
        const gy = y * res;
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const x1 = Math.min(x0 + 1, res);
        const y1 = Math.min(y0 + 1, res);
        const sx = gx - x0;
        const sy = gy - y0;
        const n0 = this.noiseData[y0][x0];
        const n1 = this.noiseData[y0][x1];
        const n2 = this.noiseData[y1][x0];
        const n3 = this.noiseData[y1][x1];
        const ix0 = n0 + sx * (n1 - n0);
        const ix1 = n2 + sx * (n3 - n2);
        return ix0 + sy * (ix1 - ix0);
    }

    drawWaveform(buffer) {
        if (!buffer) return;
        const data = buffer.getChannelData(0);
        const step = Math.ceil(data.length / this.waveWidth);
        const amp = this.waveHeight / 2;
        
        this.waveCtx.clearRect(0, 0, this.waveWidth, this.waveHeight);
        this.waveCtx.beginPath();
        this.waveCtx.strokeStyle = 'rgba(0, 242, 255, 0.5)';
        this.waveCtx.moveTo(0, amp);

        for (let i = 0; i < this.waveWidth; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            this.waveCtx.lineTo(i, (1 + min) * amp);
            this.waveCtx.lineTo(i, (1 + max) * amp);
        }
        this.waveCtx.stroke();
    }

    drawTopo() {
        this.topoCtx.clearRect(0, 0, this.width, this.height);
        const levels = 15;
        const res = 80;
        
        for (let l = 1; l <= levels; l++) {
            const threshold = l / levels;
            this.topoCtx.beginPath();
            this.topoCtx.strokeStyle = `hsla(${200 + l * 8}, 100%, 50%, ${0.1 + threshold * 0.4})`;
            
            for (let y = 0; y < res; y++) {
                for (let x = 0; x < res; x++) {
                    const nx = x / res;
                    const ny = y / res;
                    const val = this.getNoise(nx, ny);
                    if (Math.abs(val - threshold) < 0.015) {
                        const px = nx * this.width;
                        const py = ny * this.height;
                        if (x === 0) this.topoCtx.moveTo(px, py);
                        else this.topoCtx.lineTo(px, py);
                    }
                }
            }
            this.topoCtx.stroke();
        }
        requestAnimationFrame(() => this.drawTopo());
    }
}

class App {
    constructor() {
        this.engine = new AudioEngine();
        this.visualizer = new Visualizer('topo-canvas', 'waveform-canvas');
        this.visualizer.drawTopo();
        this.initUI();
    }

    initUI() {
        const loadBtn = document.getElementById('load-btn');
        const audioInput = document.getElementById('audio-input');
        const playBtn = document.getElementById('play-btn');
        const recBtn = document.getElementById('rec-btn');
        const explorer = document.getElementById('explorer-container');
        const pin = document.getElementById('explorer-pin');
        const marker = document.getElementById('grain-marker');
        const status = document.getElementById('status-indicator');

        // Tabs
        document.querySelectorAll('.tab-link').forEach(link => {
            link.addEventListener('click', () => {
                document.querySelectorAll('.tab-link, .tab-content').forEach(el => el.classList.remove('active'));
                link.classList.add('active');
                document.getElementById(link.dataset.tab).classList.add('active');
            });
        });

        // Envelopes
        document.querySelectorAll('.env-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.env-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.engine.settings.envelope = btn.dataset.env;
            });
        });

        // Audio Load
        audioInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('loading-overlay').classList.remove('hidden');
                const buffer = await this.engine.loadBuffer(file);
                this.visualizer.drawWaveform(buffer);
                document.getElementById('loading-overlay').classList.add('hidden');
                loadBtn.textContent = file.name.substring(0, 15) + '...';
            }
        });
        loadBtn.addEventListener('click', () => audioInput.click());

        // Play / Stop
        playBtn.addEventListener('click', () => {
            if (this.engine.isPlaying) {
                this.engine.stop();
                playBtn.classList.remove('active');
                status.className = 'idle';
            } else {
                this.engine.start();
                playBtn.classList.add('active');
                status.className = 'active';
            }
        });

        // Recording
        recBtn.addEventListener('click', () => {
            const isRec = this.engine.toggleRecording();
            recBtn.classList.toggle('active', isRec);
            document.getElementById('rec-status').classList.toggle('hidden', !isRec);
            if (isRec) this.updateRecTimer();
        });

        // Sliders
        const sliderMap = {
            'grain-rate': 'rate',
            'grain-size': (v) => v / 1000,
            'grain-radius': 'radius',
            'grain-spread': 'spread',
            'grain-jitter': 'jitter',
            'fx-reverb': 'reverbMix',
            'fx-delay': 'delayFeedback'
        };

        Object.entries(sliderMap).forEach(([id, mapper]) => {
            const el = document.getElementById(id);
            el.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (typeof mapper === 'function') {
                    this.engine.settings[id.split('-')[1]] = mapper(val);
                } else {
                    this.engine.settings[mapper] = val;
                }
                if (id.startsWith('fx-')) this.engine.updateFX();
                el.nextElementSibling.textContent = e.target.value + (id.includes('size') ? 'ms' : (id.includes('rate') ? 'Hz' : ''));
            });
        });

        // Interaction
        explorer.addEventListener('mousemove', (e) => {
            const rect = explorer.getBoundingClientRect();
            const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
            const y = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
            
            pin.style.left = `${x * 100}%`;
            pin.style.top = `${y * 100}%`;
            marker.style.left = `${x * 100}%`;
            
            this.engine.updatePosition(x, y);
        });
    }

    updateRecTimer() {
        if (!this.engine.isRecording) return;
        const sec = Math.floor((Date.now() - this.engine.recStartTime) / 1000);
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        document.getElementById('rec-time').textContent = `${m}:${s}`;
        setTimeout(() => this.updateRecTimer(), 1000);
    }
}

window.addEventListener('load', () => {
    window.ascent = new App();
});
