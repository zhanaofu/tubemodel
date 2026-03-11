/*
The MIT License (MIT)
Copyright (c) 2020 Zhanao Fu
*/

const sf = 44100;       // sampling frequency
const len = 0.5 * sf;   // length of audio in samples
// Lip radiation coefficient. H(z) = 1 − α·z⁻¹.
// α = 0.97 looks correct on paper but at 44.1 kHz creates a +21 dB slope
// (DC→Nyquist), wiping out the fundamental and all low harmonics that define
// vowel identity. α = 0.30 gives a gentle +5 dB slope and keeps the formants
// perceptible while still providing the standard radiation pre-emphasis.
const alpha = 0.30;
const c = 34000;        // speed of sound (cm/s)
const vlm = 0.12;       // RMS normalization target (raise/lower to adjust volume)
const samps = 1024;     // DFT window size
const tubeLoss = 0.9957; // per-sample loss; shifts poles inward → ~60 Hz formant bandwidth

const AudioContext = window.AudioContext || window.webkitAudioContext;
// FIX: sampleRate must be passed to the constructor; it is read-only after creation
const audioContext = new AudioContext({ sampleRate: sf });

let sa1 = new Float32Array(len);
let sa2 = new Float32Array(len);
let sa3 = new Float32Array(len);
let b1 = audioContext.createBuffer(1, len, sf);
let b2 = audioContext.createBuffer(1, len, sf);


// ---------------------------------------------------------------------------
// Numerical polynomial arithmetic — replaces the Algebrite CAS library.
//
// Polynomials are represented as Float64Arrays where index i holds the
// coefficient of z^i (i.e. index 0 = constant term).
// ---------------------------------------------------------------------------

function polyMul(a, b) {
    const result = new Float64Array(a.length + b.length - 1);
    for (let i = 0; i < a.length; i++)
        for (let j = 0; j < b.length; j++)
            result[i + j] += a[i] * b[j];
    return result;
}

function polyAdd(a, b) {
    const result = new Float64Array(Math.max(a.length, b.length));
    for (let i = 0; i < a.length; i++) result[i] += a[i];
    for (let i = 0; i < b.length; i++) result[i] += b[i];
    return result;
}

// Multiply polynomial by z^n (shift coefficients up by n positions).
function polyShift(a, n) {
    const result = new Float64Array(a.length + n);
    result.set(a, n);
    return result;
}

// 2×2 matrix multiplication where every entry is a polynomial.
function matMulPoly(A, B) {
    return [
        [polyAdd(polyMul(A[0][0], B[0][0]), polyMul(A[0][1], B[1][0])),
         polyAdd(polyMul(A[0][0], B[0][1]), polyMul(A[0][1], B[1][1]))],
        [polyAdd(polyMul(A[1][0], B[0][0]), polyMul(A[1][1], B[1][0])),
         polyAdd(polyMul(A[1][0], B[0][1]), polyMul(A[1][1], B[1][1]))]
    ];
}

// Compute IIR filter coefficients from the current tube model.
// Returns { poly, gain } where poly[i] is the coefficient of z^i in the
// denominator polynomial (poly[0] is always 1) and gain is the overall scale.
function transfer(k, w, l) {
    w[0] = parseFloat(document.getElementById("glottis").value);
    w[w.length - 1] = parseFloat(document.getElementById("lips").value);

    const r = new Array(k + 1);
    let g = 1;

    for (let i = 0; i <= k; i++) {
        r[i] = (w[i + 1] ** 2 - w[i] ** 2) / (w[i + 1] ** 2 + w[i] ** 2);
    }

    let M = null;
    let totalIntDelay = 0;
    for (let i = 0; i < k; i++) {
        const exactN = 2 * (l[i + 1] - l[i]) * sf / c;
        const N = Math.floor(exactN);
        totalIntDelay += N;
        // Section matrix: [[1, -r·z^N], [-r, z^N]]
        const S = [
            [new Float64Array([1]),     polyShift(new Float64Array([-r[i]]), N)],
            [new Float64Array([-r[i]]), polyShift(new Float64Array([1]), N)]
        ];
        M = (M === null) ? S : matMulPoly(M, S);
        g *= (1 + r[i]);
    }

    // Lip termination (no propagation delay)
    const Slip = [
        [new Float64Array([1]),     new Float64Array([-r[k]])],
        [new Float64Array([-r[k]]), new Float64Array([1])]
    ];
    M = (M === null) ? Slip : matMulPoly(M, Slip);
    g *= (1 + r[k]);

    // Apply tube wall losses: multiply poly[j] by tubeLoss^j to shift all poles
    // uniformly inward, replacing the lossless model's infinite-Q resonances with
    // realistic formant bandwidths (~60 Hz at the default tubeLoss value).
    const poly = M[0][0];
    let lj = tubeLoss;
    for (let j = 1; j < poly.length; j++, lj *= tubeLoss) {
        poly[j] *= lj;
    }

    // Fractional delay correction: floor() on each section delay introduces a
    // round-trip timing error of up to k samples.  Compensate with an integer
    // warmup extension (intCorr) plus a first-order allpass for the sub-sample
    // remainder (fracCorr), so formant frequencies match theory.
    const exactTotalDelay = 2 * l[k] * sf / c;
    const residual = exactTotalDelay - totalIntDelay;   // always >= 0
    const intCorr  = Math.floor(residual);
    const fracCorr = residual - intCorr;

    return { poly, gain: g, intCorr, fracCorr };
}

// IIR filter: to[i] = gain·af[i-d] − Σ poly[j]·to[i-j]  (j=1..degree)
// intCorr extra zero samples are prepended so the effective round-trip delay
// matches the exact (non-integer) section lengths.  A first-order allpass then
// corrects the remaining sub-sample residual fracCorr.
function filt(af, to, d, tfResult) {
    const { poly, gain, intCorr, fracCorr } = tfResult;
    const degree = poly.length - 1;
    const warmup = degree + intCorr;
    for (let i = 0; i <= warmup; i++) {
        to[i] = 0;
    }
    for (let i = warmup + 1; i < len; i++) {
        to[i] = gain * af[i - d];
        for (let j = 1; j <= degree; j++) {
            to[i] -= poly[j] * to[i - j];
        }
    }
    // First-order allpass: y[n] = a·x[n] + x[n-1] − a·y[n-1]
    // Group delay at DC = fracCorr samples,  a = (1−fracCorr)/(1+fracCorr)
    if (fracCorr > 0.001) {
        const a = (1 - fracCorr) / (1 + fracCorr);
        let xPrev = 0, yPrev = 0;
        for (let i = 0; i < len; i++) {
            const x = to[i];
            to[i] = a * x + xPrev - a * yPrev;
            xPrev = x;
            yPrev = to[i];
        }
    }
}

// Lip radiation filter: H(z) = 1 − α·z⁻¹  (first-order differentiator).
// The original code used from[i-d] (full tract delay) with the wrong sign —
// this is the acoustically correct 1-sample version.
function radi(from, output, alpha) {
    output[0] = from[0];
    for (let i = 1; i < len; i++) {
        output[i] = from[i] - alpha * from[i - 1];
    }
}

function normalize(cra) {
    let sum = 0;
    for (let i = 0; i < cra.length; i++) sum += cra[i] * cra[i];
    const rms = Math.sqrt(sum / cra.length);
    return cra.map(x => x * vlm / rms);
}

function copyToBuffer(a, b) {
    const output = b.getChannelData(0);
    const fadeIn  = Math.floor(sf * 0.020); // 20 ms raised-cosine fade-in
    const fadeOut = Math.floor(sf * 0.060); // 60 ms raised-cosine fade-out
    for (let i = 0; i < len; i++) {
        let env = 1;
        if (i < fadeIn) {
            env = 0.5 * (1 - Math.cos(Math.PI * i / fadeIn));
        } else if (i >= len - fadeOut) {
            env = 0.5 * (1 + Math.cos(Math.PI * (i - (len - fadeOut)) / fadeOut));
        }
        output[i] = a[i] * env;
    }
}

function playBuffer(buffer) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

function drawCanvas(canvasId, h = 200, w = 520, m = 30, f = [], wav = []) {
    const canvasEl = document.getElementById(canvasId);
    const ctx = canvasEl.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvasEl.width  = w * dpr;
    canvasEl.height = h * dpr;
    canvasEl.style.width  = w + 'px';
    canvasEl.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    ctx.font = "15px system-ui, Arial, sans-serif";
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.textAlign = "center";
    ctx.fillText('0 s', m, h - 5);
    ctx.fillText('0.5 s', w - m, h - 5);

    ctx.beginPath();
    ctx.moveTo(m, 2 * m);
    ctx.lineTo(m, h - m);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(m, h - m);
    ctx.lineTo(w - m, h - m);
    ctx.stroke();

    if (f.length === 0) {
        const st = Math.floor(wav.length / (w - 2 * m));
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < w - 2 * m + 1; i++) {
            ctx.lineTo(m + i, h - m - (wav[i * st] + 1) / 2 * (h - 2 * m));
        }
        ctx.stroke();
    } else {
        const st = (h - 3 * m) / (f.length - 1);
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';
        ctx.fillText('kHz', m, m);
        for (let i = 0; i < f.length; i++) {
            ctx.fillText(f[i], m - 10, h - m - i * st);
        }
        drawSpectrogram(wav, ctx, m, h - m, w - 2 * m, h - 3 * m);
    }
}

function drawSpectrogram(wav, con, x, y, ww, hh) {
    const dft = new DFT(samps, sf);
    const freqRes = sf / samps;
    const k6 = Math.floor(6000 / freqRes);
    const hs = hh / k6;
    const ss = Math.floor((len - samps) / ww);
    const mm = samps / len * ww / 2;
    const sca = chroma.scale(['white', 'yellow', 'red', 'black']).domain([0, 0.001, 0.01, 0.2]);

    for (let i = 0; i < ww - 2 * mm; i++) {
        dft.forward(wav.slice(i * ss + samps / 2, i * ss + samps * 1.5));
        const spectrum = dft.spectrum;
        for (let j = 0; j < k6 + 1; j++) {
            con.fillStyle = sca(spectrum[j + 1]).hex();
            con.fillRect(x + i + mm, y - (j + 1) * hs - 1, 1, hs);
        }
    }
}

function generateGlottalSource(a) {
    const t0 = parseFloat(document.getElementById("t0").value);
    const f0 = parseFloat(document.getElementById("f0").value);
    let phs = 0;
    let acp = 0;
    const dph = f0 / sf;
    for (let i = 0; i < len; i++) {
        a[i] = acp ** 2 - acp ** 3;
        phs = (phs + dph) % 1;
        acp = (phs < t0) ? 0 : (phs - t0) / (1 - t0);
    }
}

function buttonA() {
    generateGlottalSource(sa1);
    copyToBuffer(normalize(sa1), b1);
    drawCanvas('wa',  200, 520, 30, [], sa1);
    drawCanvas('waa', 400, 520, 30, [0, 1, 2, 3, 4, 5, 6], sa1);
}

function buttonB() {
    generateGlottalSource(sa1);
    const d = Math.floor(l[k] * sf / c);
    filt(sa1, sa2, d, transfer(k, w, l));
    radi(sa2, sa3, alpha);
    copyToBuffer(normalize(sa3), b2);
    drawCanvas('wb',  200, 520, 30, [], sa2);
    drawCanvas('wbb', 400, 520, 30, [0, 1, 2, 3, 4, 5, 6], sa2);
}

loadPreset('a', false);
