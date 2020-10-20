/*
The MIT License (MIT)
Copyright (c) 2020 Zhanao Fu
*/

let sf = 44100; // sampling frequency
let len = 0.5 * sf; // length of audio in samples
let t0 = 0.3; // ratio of closure period in a glottal pulse
let alpha = 0.97; // lip radiation
let c = 34000; // sound speed
let d = 1;
let vlm = 0.5; // amplitude normlizaiton
let samps = 1024; // sample size

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
audioContext.sampleRate = sf


let sa1 = new Float32Array(len);
let sa2 = new Float32Array(len);
let sa3 = new Float32Array(len);
let b1 = audioContext.createBuffer(1,len,sf); 
let b2 = audioContext.createBuffer(1,len,sf);


    
function e(a,b,m='*') {
    return Algebrite.run(`(${a})${m}(${b})`)
}

function mt (a, b) {
    return [[e(e(a[0][0],b[0][0]),e(a[0][1],b[1][0]),'+'),
    e(e(a[0][0],b[0][1]),e(a[0][1],b[1][1]),'+')],
    [e(e(a[1][0],b[0][0]),e(a[1][1],b[1][0]),'+'),
    e(e(a[1][0],b[0][1]),e(a[1][1],b[1][1]),'+')]]
}

function transfer (k, w, l) {
    w[0] = document.getElementById("glottis").value; 
    w[w.length-1] = document.getElementById("lips").value; 
    r = []
    sg = []
    coef =[]
    g = 1

    for (i = 0; i<k+1; i++){
        r[i] = (w[i+1]**2-w[i]**2)/(w[i+1]**2+w[i]**2)
    }
    for (i = 0; i<k; i++){
        sg[i] =mt(
            [[1,-r[i]],[-r[i],1]],
            [[1,0],[0,`z^(${Math.floor(2*(l[i+1]-l[i])*sf/c)})`]],
        )
        g = g*(r[i]+1)
    }
    sg[k] = [[1,-r[k]],[-r[k],1]]
    g = g * (r[k]+1)
    tr = sg[0]
    for (i = 1; i<k+1; i++){
        tr = mt (tr,sg[i])
    }
    tr = tr[0][0]
    console.log(tr)

    for (i = 0; i<2*d+2; i++){
        coef[i]=Algebrite.coeff(tr,'z',i)
    }

    coef[2*d+2] = g
    return coef
}

function filt(af,to,d,t) {
    for (i = 0; i < 2*d+2; i++){
        to[i] = 0
    }
    for (i = 2*d+2; i<len; i++){
        to[i] = coef[2*d+2]*af[i-d];
        for (j=1; j<2*d+2; j++) {
            to[i] = to[i] - t[j]*to[i-j]
        } 
    }
}

function radi(from,output, alpha, d) {
    for  (i = 0; i<d; i++){
        output[0] = from[0]
    }
    for (i = d; i<len; i++){
        output[i] = from[i] + alpha* from[i-d]
    }
}

function nd(cra){
    m = Math.max.apply(null, cra.map(Math.abs));
    return cra.map((x) => {return x * vlm/m;});
}

function a2b(a,b){
    output = b.getChannelData(0);
    for (i = 0; i<len; i++){
        output[i] = a[i] 
    }
}

function playBuffer(buffer){
    source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
};

function axxx(c,h=200,w=520,m=30,f=[],wav=[]){
    let canvas = document.getElementById(c);
    let context = canvas.getContext('2d');
    canvas.height= h ;
    canvas.width = w ;

    context.font = "18px Times";
    context.strokeStyle = 'black';
    context.lineWidth = 2;

    context.textAlign="center"
    context.fillText('0 s', m, h-5);
    context.fillText('0.5 s', w-m, h-5);

    context.beginPath();
    context.moveTo(m,2*m);
    context.lineTo(m,h-m);
    context.stroke();

    context.beginPath();
    context.moveTo(m,h-m);
    context.lineTo(w-m,h-m);
    context.stroke();

    if (f.length==0){
    st = Math.floor(wav.length/(w-2*m))
    context.lineWidth = 1;
    context.beginPath();
    for (i = 0; i<w-2*m+1; i++) {
        context.lineTo(m+i,h-m-(wav[i*st]+1)/2*(h-2*m));
    }
    context.stroke();
    } else {
    st = (h-3*m)/(f.length-1)

    context.beginPath();
    context.moveTo(m,h-m)
    context.stroke();

    context.textBaseline = 'middle';
    context.textAlign ='right'
    context.fillText('kHz', m, m);
    for (i = 0; i<f.length; i++) {
        context.fillText(f[i], m-10, h-m-(i)*st);
    }

    gram(wav,context,m,h-m,w-2*m,h-3*m)
    }

}

function gram(wav,con,x,y,ww,hh) {
    dft = new DFT(samps,sf);

    freqs = sf/samps

    k6 = 6000/freqs

    hs = hh/k6

    ss = Math.floor((len-samps)/ww)

    mm = samps/len*ww/2

    sca = chroma.scale(['white','yellow','red','black']).domain([0,0.001,0.01,0.2])
  
    for (i=0;i<ww-2*mm;i++){
        dft.forward(wav.slice(i*ss+samps/2,i*ss+samps*1.5))
        spectrum = dft.spectrum;
        for (j=0;j<k6+1;j++){
            con.fillStyle =  sca(spectrum[j+1]).hex()
            con.fillRect(x+i+mm, y-(j+1)*hs-1, 1, hs);  
        }
        
    }
}

function gen(a,t0) {
    t0 = document.getElementById("t0").value;
    f0 = document.getElementById("f0").value; //f0
    phs = 0; // phase including silence
    acp = 0; // phase exluding silence
    dph = f0/sf; // delta phase
    for (i = 0; i < len; i++) {
        a[i] = (acp**2 - acp**3)
        phs = (phs+dph)%1
        acp = (phs < t0) ? 0 : (phs-t0)/(1-t0)
    }
}



function buttonA () {
    gen(sa1,t0);
    a2b(nd(sa1),b1)
    axxx('wa',200,520,30,[],sa1)
    axxx('waa',400,520,30,[0,1,2,3,4,5,6],sa1)
}
function buttonB () {
    gen(sa1,t0);
    d = Math.floor(l[k]*sf/c)
    filt(sa1,sa2,d,transfer(k, w,l));

    radi(sa2,sa3, alpha, d);
    a2b(nd(sa3),b2)
    axxx('wb',200,520,30,[],sa2)
    axxx('wbb',400,520,30,[0,1,2,3,4,5,6],sa2)
}

buttonA();
buttonB();
