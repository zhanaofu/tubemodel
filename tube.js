/*
The MIT License (MIT)
Copyright (c) 2020 Zhanao Fu
*/

let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');


let ppc = 50; // pixel per cm
let width_cm = 21; // width of drawing area in cm
let height_cm = 4;
let margin = screen.width/2-ppc/2*width_cm; // margin in pixel
let marginv = 50;

let k = 4; // initial number of sections
let l = [0,7,11,13,14]; // initial section boundaries
let w = [0.1,0.5,0.1,0.5,2,5]; // initial section radius


let mousepress = 0; // initial mouse button/location
let x = 0; // mouse location
let y = 0;
let xdown = 0; // mouse location when a button is pressed
let ydown = 0;
let li = -1; // left boundary of the section the mouse is hovering
let cl = canvas.getBoundingClientRect();

function axes() {
    // set up canvas with HiDPI support
    const dpr = window.devicePixelRatio || 1;
    const cssW = ppc * width_cm + 2 * margin;
    const cssH = ppc * height_cm + 2 * marginv;
    canvas.width  = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width  = cssW + 'px';
    canvas.style.height = cssH + 'px';
    context.scale(dpr, dpr);

    context.font = "15px system-ui, Arial, sans-serif";
    context.fillText('Unit:cm', margin, 25);

    context.fillText('Glottis', margin, cssH - marginv + 20);
    context.fillText('Lips', cssW - margin - 40, cssH - marginv + 20);

    context.strokeStyle = '#E0E0E0';
    context.lineWidth = 1;
    context.font = "14px system-ui, Arial, sans-serif";
    context.textBaseline = 'middle';
    context.textAlign = 'right';


    // y-axis
    for (let i = 0; i <= Math.floor(height_cm/2); i++){

        if (i == 0) {
            context.fillText(i, margin-10, cssH/2)
        } else {
        context.fillText(-i, margin-10, cssH/2 + i*ppc);
        context.fillText(i, margin-10, cssH/2 - i*ppc);

        context.beginPath();
        context.moveTo(margin,cssH/2+i*ppc);
        context.lineTo(cssW-margin,cssH/2+i*ppc);
        context.stroke();

        context.beginPath();
        context.moveTo(margin,cssH/2-i*ppc);
        context.lineTo(cssW-margin,cssH/2-i*ppc);
        context.stroke();
        }
    }

    // x-axis
    for (let i = 0; i <= Math.floor(width_cm); i++){

        if (i != 0) {
        context.fillText(i-1, margin+i*ppc-2, cssH/2 +15);

        context.beginPath();
        context.moveTo(margin+i*ppc,cssH-marginv);
        context.lineTo(margin+i*ppc,marginv);
        context.stroke();
        }
    }

    // axes
    context.beginPath();
    context.moveTo(margin,marginv);
    context.lineTo(margin,cssH-marginv);
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.stroke();

    context.beginPath();
    context.moveTo(margin,cssH/2);
    context.lineTo(cssW-margin,cssH/2);
    context.stroke();

    // glottis
    context.fillStyle = 'red';
    context.fillRect(margin+ppc-8, cssH/2-4, 8, 8);
    context.fillStyle = 'black';

    //lips
    context.lineWidth = 5;
    context.strokeStyle = 'red';

    context.beginPath();
    context.moveTo(l[k]*ppc+margin+ppc,cssH/2+w[k]*ppc);
    context.lineTo(l[k]*ppc+margin+ppc,cssH/2+w[k]*ppc+ppc);
    context.stroke();

    context.beginPath();
    context.moveTo(l[k]*ppc+margin+ppc,cssH/2-w[k]*ppc);
    context.lineTo(l[k]*ppc+margin+ppc,cssH/2-w[k]*ppc-ppc);
    context.stroke();

    context.beginPath();
    context.moveTo(margin+ppc,cssH/2);
    context.lineTo(margin+ppc,cssH/2+w[1]*ppc);
    context.stroke();

    context.beginPath();
    context.moveTo(margin+ppc,cssH/2);
    context.lineTo(margin+ppc,cssH/2-w[1]*ppc);
    context.stroke();
}


function draw(k=2,l=[0,15,17,],w=[0,0.5,0.7,]){
    const mid = parseFloat(canvas.style.height) / 2;

    for (let i=1; i<k+1; i++){

        context.lineWidth = 5;
        context.strokeStyle = 'red';

        context.beginPath();
        context.moveTo(l[i-1]*ppc+margin+ppc,mid+w[i-1]*ppc);
        context.lineTo(l[i-1]*ppc+margin+ppc,mid+w[i]*ppc);
        context.stroke();

        context.beginPath();
        context.moveTo(l[i-1]*ppc+margin+ppc,mid-w[i-1]*ppc);
        context.lineTo(l[i-1]*ppc+margin+ppc,mid-w[i]*ppc);
        context.stroke();

        context.beginPath();
        context.moveTo(l[i-1]*ppc+margin+ppc,mid-w[i]*ppc);
        context.lineTo(l[i]*ppc+margin+ppc,mid-w[i]*ppc);
        context.stroke();

        context.beginPath();
        context.moveTo(l[i-1]*ppc+margin+ppc,mid+w[i]*ppc);
        context.lineTo(l[i]*ppc+margin+ppc,mid+w[i]*ppc);
        context.stroke();

        context.lineWidth = 2;
        context.strokeStyle = 'black';

        context.beginPath();
        context.arc(l[i]*ppc+margin+ppc, mid-w[i]*ppc, 6, 0, 2 * Math.PI);
        context.stroke();

        context.beginPath();
        context.arc(l[i]*ppc+margin+ppc, mid+w[i]*ppc, 6, 0, 2 * Math.PI);
        context.stroke();
    }
    }

function mousepos(e){
    cl = canvas.getBoundingClientRect();
    x = e.clientX - cl.left;
    y = e.clientY - cl.top;

}

function update(e){
    mousepress = e.which;
    mousepos(e);

    xdown = x;
    ydown = y;

    for (let i=0;i<=k;i++){
        if (xdown > l[i]*ppc+margin+ppc-6){
            li = i;
        } else {
            break
        }
    }
    if (mousepress == 3){
        if (k>1 && li >0 && xdown < l[li]*ppc+margin+ppc+6 &&(Math.abs(ydown-parseFloat(canvas.style.height)/2-ppc*w[li])<7 || Math.abs(ydown-parseFloat(canvas.style.height)/2+ppc*w[li])<7)){
            l.splice(li,1)
            w.splice(li,1)
            k--
        } else if (li>=0 && li <k && xdown > l[li]*ppc+margin+ppc+6){
            l.splice(li+1,0,(xdown-margin-ppc)/ppc)
            w.splice(li+1,0,w[li+1])
            k++
        }
    }
    context.clearRect(0, 0, parseFloat(canvas.style.width), parseFloat(canvas.style.height));
    axes()
    draw(k,l,w)
}

function move(e){
    mousepos(e);
    if (mousepress == 1 && li >=0) {
        if (xdown < l[li]*ppc+margin+ppc+3){
            if (li>0) {
                if (x<l[li-1]*ppc+margin+ppc+10){
                    x = l[li-1]*ppc+margin+ppc+10
                } else if (li<k && x>l[li+1]*ppc+margin+ppc-10){
                    x = l[li+1]*ppc+margin+ppc-10
                } else if (x>parseFloat(canvas.style.width)-margin) {
                    x = parseFloat(canvas.style.width)-margin
                }
                l.splice(li,1, x/ppc-1-margin/ppc)
                context.clearRect(0, 0, parseFloat(canvas.style.width), parseFloat(canvas.style.height));
            }
        } else if (Math.abs(ydown-parseFloat(canvas.style.height)/2-ppc*w[li+1])<4 || Math.abs(ydown-parseFloat(canvas.style.height)/2+ppc*w[li+1])<4) {
            if (y-parseFloat(canvas.style.height)/2>0){
                if (y-parseFloat(canvas.style.height)/2>height_cm/2*ppc){
                    y = parseFloat(canvas.style.height)/2+height_cm/2*ppc
                }
            } else if (y-parseFloat(canvas.style.height)/2<0){
                if (y-parseFloat(canvas.style.height)/2< -height_cm/2*ppc){
                    y = parseFloat(canvas.style.height)/2-height_cm/2*ppc
                }
            } else {
                y = parseFloat(canvas.style.height)/2+1
            }
            w.splice(li+1,1, Math.abs(y-parseFloat(canvas.style.height)/2)/ppc)
            context.clearRect(0, 0, parseFloat(canvas.style.width), parseFloat(canvas.style.height));
        }
    axes()
    draw(k,l,w)
    xdown = x;
    ydown = y;
    }
}


// ---------------------------------------------------------------------------
// Vowel presets — tube shapes derived from Fant-style two/three-tube models.
// Each entry: k sections, l[] boundary positions (cm), w[] section radii (cm).
// w[0] and w[k+1] are placeholders overwritten by the glottis/lips inputs.
// Total tract length: 17 cm (typical male vocal tract).
// ---------------------------------------------------------------------------
const vowelPresets = {
    i:  { k: 4, l: [0,  7, 10, 15, 17],   w: [0.1,  1.6,  0.80, 0.25, 0.90,  5] },
    a:  { k: 3, l: [0,  8.5, 10, 17],     w: [0.1,  0.7,  1.40, 1.85,        5] },
    o:  { k: 4, l: [0,  5,  8, 12, 17],   w: [0.1,  1.0,  0.50, 1.50, 1.30,  5] },
};

function loadPreset(id, play = true) {
    const p = vowelPresets[id];
    k = p.k;
    l = p.l.slice();
    w = p.w.slice();
    context.clearRect(0, 0, parseFloat(canvas.style.width), parseFloat(canvas.style.height));
    axes();
    draw(k, l, w);
    buttonA();       // synthesize glottal source + fill b1
    buttonB();       // synthesize vowel + fill b2
    if (play) playBuffer(b2);
}

axes()
draw(k,l,w)

canvas.addEventListener('mousedown', update);
canvas.addEventListener('mouseup', () => { mousepress = 0; });
canvas.addEventListener('mousemove', move);
