/*
The MIT License (MIT)
Copyright (c) 2020 Zhanao Fu
*/

let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');


let ppc = 60; // pixel per cm
let width_cm = 21; // width of drawing area in cm
let height_cm = 4;
let margin = 50; // margin in pixel

let k = 3; // initial number of sections
let l = [0,7,11,14]; // initial section boundaries
let w = [0.1,0.5,0.1,0.7,5]; // initial section radius


let mousepress = 0; // initial mouse button/location 
let x = 0; // mouse location
let y = 0;
let xdown = 0; // mouse location when a button is pressed
let ydown = 0;
let li = -1; // left boundary of the section the mouse is hovering
let cl = canvas.getBoundingClientRect();

function axes() {
    // set up canvas
    canvas.width = ppc * width_cm + 2 * margin;
    canvas.height = ppc * height_cm + 2 * margin;

    context.font = "25px Times";
    context.fillText('Unit:cm', 20, 25);

    context.fillText('Glottis', margin, canvas.height - margin + 20);
    context.fillText('Lips', canvas.width-margin-40, canvas.height - margin + 20);

    context.strokeStyle = '#E0E0E0';
    context.lineWidth = 1;
    context.font = "18px Times";
    context.textBaseline = 'middle';
    context.textAlign = 'right';


    // y-axis
    for (i = 0; i <= Math.floor(height_cm/2); i++){
        
        if (i == 0) {
            context.fillText(i, margin-10, canvas.height/2)
        } else {
        context.fillText(-i, margin-10, canvas.height/2 + i*ppc);
        context.fillText(i, margin-10, canvas.height/2 - i*ppc);

        context.beginPath();
        context.moveTo(margin,canvas.height/2+i*ppc);
        context.lineTo(canvas.width-margin,canvas.height/2+i*ppc);
        context.stroke();

        context.beginPath();
        context.moveTo(margin,canvas.height/2-i*ppc);
        context.lineTo(canvas.width-margin,canvas.height/2-i*ppc);
        context.stroke();
        }
    }

    // x-axis
    for (i = 0; i <= Math.floor(width_cm); i++){
        
        if (i != 0) {
        context.fillText(i-1, margin+i*ppc-2, canvas.height/2 +15);

        context.beginPath();
        context.moveTo(margin+i*ppc,canvas.height-margin);
        context.lineTo(margin+i*ppc,margin);
        context.stroke();
        }
    }

    // axes
    context.beginPath();
    context.moveTo(margin,margin);
    context.lineTo(margin,canvas.height-margin);
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.stroke();

    context.beginPath();
    context.moveTo(margin,canvas.height/2);
    context.lineTo(canvas.width-margin,canvas.height/2);
    context.stroke();

    // glottis
    context.fillStyle = 'red';
    context.fillRect(margin+ppc-8, canvas.height/2-4, 8, 8);
    context.fillStyle = 'black';

    //lips
    context.lineWidth = 5;
    context.strokeStyle = 'red'; 

    context.beginPath();
    context.moveTo(l[k]*ppc+margin+ppc,canvas.height/2+w[k]*ppc);
    context.lineTo(l[k]*ppc+margin+ppc,canvas.height/2+w[k]*ppc+ppc);
    context.stroke();

    context.beginPath();
    context.moveTo(l[k]*ppc+margin+ppc,canvas.height/2-w[k]*ppc);
    context.lineTo(l[k]*ppc+margin+ppc,canvas.height/2-w[k]*ppc-ppc);
    context.stroke();

    context.beginPath();
    context.moveTo(margin+ppc,canvas.height/2);
    context.lineTo(margin+ppc,canvas.height/2+w[1]*ppc);
    context.stroke();

    context.beginPath();
    context.moveTo(margin+ppc,canvas.height/2);
    context.lineTo(margin+ppc,canvas.height/2-w[1]*ppc);
    context.stroke();
}


function draw(k=2,l=[0,15,17,],w=[0,0.5,0.7,]){


    for (i=1; i<k+1; i++){

        context.lineWidth = 5;
        context.strokeStyle = 'red';    

        context.beginPath();
        context.moveTo(l[i-1]*ppc+margin+ppc,canvas.height/2+w[i-1]*ppc);
        context.lineTo(l[i-1]*ppc+margin+ppc,canvas.height/2+w[i]*ppc);
        context.stroke();

        context.beginPath();
        context.moveTo(l[i-1]*ppc+margin+ppc,canvas.height/2-w[i-1]*ppc);
        context.lineTo(l[i-1]*ppc+margin+ppc,canvas.height/2-w[i]*ppc);
        context.stroke();

        context.beginPath();
        context.moveTo(l[i-1]*ppc+margin+ppc,canvas.height/2-w[i]*ppc);
        context.lineTo(l[i]*ppc+margin+ppc,canvas.height/2-w[i]*ppc);
        context.stroke();
        
        context.beginPath();
        context.moveTo(l[i-1]*ppc+margin+ppc,canvas.height/2+w[i]*ppc);
        context.lineTo(l[i]*ppc+margin+ppc,canvas.height/2+w[i]*ppc);
        context.stroke();

        context.lineWidth = 2;
        context.strokeStyle = 'black';
    
        context.beginPath();
        context.arc(l[i]*ppc+margin+ppc, canvas.height/2-w[i]*ppc, 6, 0, 2 * Math.PI);
        context.stroke();

        context.beginPath();
        context.arc(l[i]*ppc+margin+ppc, canvas.height/2+w[i]*ppc, 6, 0, 2 * Math.PI);
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
    
    for (i=0;i<=k;i++){
        if (xdown > l[i]*ppc+margin+ppc-6){
            li = i;
        } else {
            break
        }
    }
    if (mousepress == 3){
        if (k>1 & li >0 & xdown < l[li]*ppc+margin+ppc+6 &(Math.abs(ydown-canvas.height/2-ppc*w[li])<7 || Math.abs(ydown-canvas.height/2+ppc*w[li])<7)){
            l.splice(li,1)
            w.splice(li,1)
            k--
        } else if (li>=0 & li <k & xdown > l[li]*ppc+margin+ppc+6){
            l.splice(li+1,0,(xdown-margin-ppc)/ppc)
            w.splice(li+1,0,w[li+1])
            k++
        }
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    axes()
    draw(k,l,w)
}

function move(e){
    mousepos(e);
    if (mousepress == 1 & li >=0) {
        if (xdown < l[li]*ppc+margin+ppc+3){
            if (li>0) {
                if (x<l[li-1]*ppc+margin+ppc+10){
                    x = l[li-1]*ppc+margin+ppc+10
                } else if (li<k & x>l[li+1]*ppc+margin+ppc-10){
                    x = l[li+1]*ppc+margin+ppc-10
                } else if (x>canvas.width-margin) {
                    x = canvas.width-margin
                }
                l.splice(li,1, x/ppc-1-margin/ppc)
                context.clearRect(0, 0, canvas.width, canvas.height);
            }
        } else if (Math.abs(ydown-canvas.height/2-ppc*w[li+1])<4 || Math.abs(ydown-canvas.height/2+ppc*w[li+1])<4) {
            if (y-canvas.height/2>0){
                if (y-canvas.height/2>height_cm/2*ppc){
                    y = canvas.height/2+height_cm/2*ppc
                }
            } else if (y-canvas.height/2<0){
                if (y-canvas.height/2< -height_cm/2*ppc){
                    y = canvas.height/2-height_cm/2*ppc
                }
            } else {
                y = canvas.height/2+1
            }
            w.splice(li+1,1, Math.abs(y-canvas.height/2)/ppc)
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
    axes()
    draw(k,l,w)
    xdown = x;
    ydown = y;
    }
}


axes()
draw(k,l,w)

$("#canvas").mousedown(function(e) {
    update(e);
});

$("#canvas").mouseup(function(e) {
    mousepress = 0;
});

$("#canvas").mousemove(function(e) {
    move(e)
});