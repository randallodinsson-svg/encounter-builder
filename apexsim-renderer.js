// ------------------------------------------------------------
// APEXSIM RENDERER v7.2 — CHUNK 1 / 3
// Core setup, draw helpers, grid, entities, enemies, threat
// ------------------------------------------------------------
console.log("APEXSIM Renderer - initializing");

import {
    getSimState,
    getEntities,
    getEnemies,
    getThreatCenter,
    getThreatMagnitude,
    drawHeatmap
} from "./apexsim.js";

import {
    getCameraState,
    getExportState,
    getRadialMenuState,
    isHeatmapEnabled,
    isPerformanceMode,
    getReplayState
} from "./index.js";

// ------------------------------------------------------------
// CANVAS
// ------------------------------------------------------------
const canvas = document.getElementById("apex-canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1280;
canvas.height = 720;

// ------------------------------------------------------------
// CAMERA + DIRECTOR
// ------------------------------------------------------------
const camera = {
    x: 640, y: 360, zoom: 1,
    tx: 640, ty: 360, tz: 1,
    shake: 0
};

const director = {
    timer: 0,
    duration: 3,
    last: "",
    wLead: 3,
    wHot: 2,
    wCen: 1,
    wThr: 1
};

let lastTime = performance.now();
const DEBUG = true;

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const smooth = (a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};

const w2s = (x,y)=>({
    x:(x-camera.x)*camera.zoom + canvas.width/2,
    y:(y-camera.y)*camera.zoom + canvas.height/2
});

// ------------------------------------------------------------
// DRAW PRIMITIVES
// ------------------------------------------------------------
function circ(x,y,r,c,a=1){
    const p=w2s(x,y);
    ctx.save(); ctx.globalAlpha=a;
    ctx.beginPath(); ctx.arc(p.x,p.y,r*camera.zoom,0,Math.PI*2);
    ctx.fillStyle=c; ctx.fill(); ctx.restore();
}

function ring(x,y,r,t,c,a=1){
    const p=w2s(x,y);
    ctx.save(); ctx.globalAlpha=a;
    ctx.beginPath(); ctx.arc(p.x,p.y,r*camera.zoom,0,Math.PI*2);
    ctx.lineWidth=t*camera.zoom; ctx.strokeStyle=c; ctx.stroke();
    ctx.restore();
}

function line(x1,y1,x2,y2,c,w=1,a=1){
    const p1=w2s(x1,y1), p2=w2s(x2,y2);
    ctx.save(); ctx.globalAlpha=a;
    ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);
    ctx.strokeStyle=c; ctx.lineWidth=w*camera.zoom; ctx.stroke();
    ctx.restore();
}

function label(x,y,t,c="#FFF",s=12){
    const p=w2s(x,y);
    ctx.save();
    ctx.font=`${s*camera.zoom}px system-ui`;
    ctx.fillStyle=c; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(t,p.x,p.y);
    ctx.restore();
}

// ------------------------------------------------------------
// GRID
// ------------------------------------------------------------
function drawGrid(){
    ctx.save();
    ctx.fillStyle="#05070A";
    ctx.fillRect(0,0,1280,720);

    ctx.strokeStyle="rgba(255,255,255,0.04)";
    ctx.lineWidth=1;

    const sp=40;
    const left=(0-camera.x)/camera.zoom+640;
    const right=(1280-camera.x)/camera.zoom+640;
    const top=(0-camera.y)/camera.zoom+360;
    const bottom=(720-camera.y)/camera.zoom+360;

    const sx=Math.floor(left/sp)*sp;
    const ex=Math.ceil(right/sp)*sp;
    const sy=Math.floor(top/sp)*sp;
    const ey=Math.ceil(bottom/sp)*sp;

    ctx.beginPath();
    for(let x=sx;x<=ex;x+=sp){
        const p1=w2s(x,top), p2=w2s(x,bottom);
        ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);
    }
    for(let y=sy;y<=ey;y+=sp){
        const p1=w2s(left,y), p2=w2s(right,y);
        ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);
    }
    ctx.stroke();
    ctx.restore();
}

// ------------------------------------------------------------
// ENTITIES
// ------------------------------------------------------------
function drawEntities(){
    for(const e of getEntities()){
        circ(e.x,e.y,e.type.size,e.type.color,0.95);
        if(DEBUG && (e.vx||e.vy))
            line(e.x,e.y,e.x+e.vx*0.5,e.y+e.vy*0.5,"rgba(0,255,200,0.5)",1,0.8);
    }
}

// ------------------------------------------------------------
// ENEMIES
// ------------------------------------------------------------
function drawEnemies(){
    for(const en of getEnemies()){
        circ(en.x,en.y,8,"#FF4D4D",0.9);
        ring(en.x,en.y,26,1.5,"rgba(255,77,77,0.6)",0.9);

        const p=w2s(en.x,en.y);
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(en.facing||0);
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.arc(0,0,80*camera.zoom,-Math.PI/8,Math.PI/8);
        ctx.closePath();
        ctx.fillStyle="rgba(255,77,77,0.18)";
        ctx.fill();
        ctx.restore();
    }
}

// ------------------------------------------------------------
// THREAT + HOTSPOT
// ------------------------------------------------------------
function drawThreat(){
    const sim=getSimState();
    if(isHeatmapEnabled()) drawHeatmap(ctx,sim);

    const tc=getThreatCenter();
    const m=getThreatMagnitude();
    ring(tc.x,tc.y,40+m*4,2,"rgba(0,255,200,0.5)",0.8);
}

function drawThreatArcs(){
    const tc=getThreatCenter();
    const m=getThreatMagnitude();
    ring(tc.x,tc.y,80+m*3,2,"rgba(255,0,0,0.25)",0.8);
    ring(tc.x,tc.y,(80+m*3)*1.3,1.5,"rgba(255,0,0,0.15)",0.6);
}

function drawHotspotPulse(){
    const sim=getSimState();
    const h=sim.cameraAnchors.engagementHotspot;
    const r=30+(Math.sin(sim.time*2)+1)*10;
    ring(h.x,h.y,r,2,"rgba(0,200,255,0.5)",0.9);
}
// ------------------------------------------------------------
// RADIAL MENU
// ------------------------------------------------------------
function drawRadialMenu(){
    const r=getRadialMenuState();
    if(!r.visible) return;

    const p=w2s(r.x,r.y);
    ctx.save(); ctx.translate(p.x,p.y);

    const inner=20*camera.zoom, outer=80*camera.zoom;
    ctx.beginPath();
    ctx.arc(0,0,outer,0,Math.PI*2);
    ctx.arc(0,0,inner,Math.PI*2,0,true);
    ctx.fillStyle="rgba(5,10,20,0.95)";
    ctx.fill();

    const opts=r.options||[], seg=(Math.PI*2)/opts.length;
    ctx.font=`${10*camera.zoom}px system-ui`;
    ctx.textAlign="center"; ctx.textBaseline="middle";

    for(let i=0;i<opts.length;i++){
        const a=i*seg+seg/2;
        const tx=Math.cos(a)*(inner+(outer-inner)*0.6);
        const ty=Math.sin(a)*(inner+(outer-inner)*0.6);
        ctx.fillStyle="rgba(0,255,200,0.9)";
        ctx.fillText(opts[i].label,tx,ty);
    }

    ctx.restore();
}

// ------------------------------------------------------------
// FORMATION GHOSTS
// ------------------------------------------------------------
function drawFormationGhosts(){
    const sim=getSimState(), ents=sim.entities;
    const lead=ents.find(e=>e.id===sim.formation.leaderId);
    if(!lead) return;

    const n=ents.length, mode=sim.formation.mode;

    for(let i=0;i<n;i++){
        const e=ents[i]; if(e.id===lead.id) continue;
        let ox=0, oy=0;

        if(mode==="tight"){
            const a=(i/n)*Math.PI*2; ox=Math.cos(a)*60; oy=Math.sin(a)*60;
        } else if(mode==="spread"){
            const a=(i/n)*Math.PI*2; ox=Math.cos(a)*110; oy=Math.sin(a)*110;
        } else if(mode==="line"){
            ox=(i-n/2)*26;
        } else if(mode==="wedge"){
            const row=Math.floor(i/4), col=i%4;
            ox=(col-1.5)*26*(row+1); oy=row*26;
        }

        ring(lead.x+ox,lead.y+oy,10,1.5,"rgba(255,255,255,0.15)",0.6);
    }

    const c=sim.cameraAnchors.squadCentroid;
    label(c.x,c.y-40,"SQUAD","rgba(255,255,255,0.7)",11);
}

// ------------------------------------------------------------
// CAMERA SHAKE
// ------------------------------------------------------------
function applyCameraShake(){
    if(camera.shake>0.001){
        const i=camera.shake*camera.zoom;
        camera.x+=(Math.random()-0.5)*i;
        camera.y+=(Math.random()-0.5)*i;
        camera.shake*=0.92;
    }
}

export function triggerImpactPulse(s=1){
    camera.shake=Math.min(camera.shake+s*0.5,3);
}

// ------------------------------------------------------------
// AUTO-DIRECTOR
// ------------------------------------------------------------
function chooseDirectorShot(sim){
    const a=sim.cameraAnchors;
    const list=[
        {n:"leader",x:a.leader.x,y:a.leader.y,w:director.wLead},
        {n:"hotspot",x:a.engagementHotspot.x,y:a.engagementHotspot.y,w:director.wHot},
        {n:"centroid",x:a.squadCentroid.x,y:a.squadCentroid.y,w:director.wCen},
        {n:"threat",x:a.threatCenter.x,y:a.threatCenter.y,w:director.wThr}
    ];

    const pool=list.filter(s=>s.n!==director.last);
    const shots=pool.length?pool:list;

    let r=Math.random()*shots.reduce((a,s)=>a+s.w,0);
    for(const s of shots){
        if(r<s.w){ director.last=s.n; return s; }
        r-=s.w;
    }
    return shots[0];
}

function updateAutoDirector(sim,dt){
    director.timer-=dt;
    if(director.timer<=0){
        const s=chooseDirectorShot(sim);
        camera.tx=s.x; camera.ty=s.y;
        director.timer=director.duration;
    }
}

// ------------------------------------------------------------
// CAMERA MODES
// ------------------------------------------------------------
function updateCameraMode(sim,dt){
    const cam=getCameraState(), a=sim.cameraAnchors;

    if(cam.mode==="tracking"){
        camera.tx=a.leader.x; camera.ty=a.leader.y;

    } else if(cam.mode==="orbit"){
        const t=sim.time*0.4, r=140;
        camera.tx=a.engagementHotspot.x+Math.cos(t)*r;
        camera.ty=a.engagementHotspot.y+Math.sin(t)*r;

    } else if(cam.mode==="rail"){
        camera.tx=a.squadCentroid.x; camera.ty=a.squadCentroid.y;

    } else if(cam.mode==="auto"){
        updateAutoDirector(sim,dt);
    }

    const m=getThreatMagnitude();
    camera.tz=cam.zoom + smooth(10,40,m)*0.25;
}

// ------------------------------------------------------------
// CAMERA UPDATE
// ------------------------------------------------------------
function updateCamera(dt){
    const sim=getSimState();
    updateCameraMode(sim,dt);

    const p=2.5*dt*(isPerformanceMode()?0.7:1);
    camera.x+=(camera.tx-camera.x)*p;
    camera.y+=(camera.ty-camera.y)*p;

    const z=3*dt;
    camera.zoom+=(camera.tz-camera.zoom)*z;

    applyCameraShake();
}

// ------------------------------------------------------------
// REPLAY CAMERA
// ------------------------------------------------------------
function updateCameraReplay(dt){
    const r=getReplayState();
    if(!r.playing||!r.frames.length){ updateCamera(dt); return; }

    const f=r.frames.find(f=>f.time>=r.time);
    if(!f){ updateCamera(dt); return; }

    const a=f.cameraAnchors, cam=getCameraState();
    camera.tx=a.engagementHotspot.x;
    camera.ty=a.engagementHotspot.y;

    const p=2.5*dt;
    camera.x+=(camera.tx-camera.x)*p;
    camera.y+=(camera.ty-camera.y)*p;

    const z=3*dt;
    camera.zoom+=(cam.zoom-camera.zoom)*z;

    applyCameraShake();
}

function updateCameraFromState(dt){
    updateCameraReplay(dt);
}
// ------------------------------------------------------------
// MINIMAP
// ------------------------------------------------------------
function drawMinimap(){
    const sim=getSimState(), ents=sim.entities, ens=sim.enemies;
    const w=180,h=120,x0=1280-w-20,y0=720-h-20;

    ctx.save();
    ctx.fillStyle="rgba(5,10,20,0.85)";
    ctx.fillRect(x0,y0,w,h);
    ctx.strokeStyle="rgba(255,255,255,0.1)";
    ctx.strokeRect(x0,y0,w,h);

    const mx=x=>x0+(x/1280)*w, my=y=>y0+(y/720)*h;

    for(const e of ents){
        ctx.fillStyle=e.type.color;
        ctx.fillRect(mx(e.x),my(e.y),3,3);
    }
    for(const en of ens){
        ctx.fillStyle="#FF4D4D";
        ctx.fillRect(mx(en.x),my(en.y),3,3);
    }

    ctx.restore();
}

// ------------------------------------------------------------
// HUD
// ------------------------------------------------------------
function drawHud(){
    const sim=getSimState(), r=getReplayState();
    const cam=getCameraState(), exp=getExportState();

    ctx.save();
    ctx.fillStyle="rgba(5,10,20,0.96)";
    ctx.fillRect(0,0,1280,40);

    ctx.font="12px system-ui"; 
    ctx.fillStyle="#9FA8B8";
    ctx.textBaseline="middle";
    ctx.fillText("APEXSIM // ENCOUNTER BUILDER",20,20);

    const lead=sim.entities.find(e=>e.id===sim.formation.leaderId);
    const lt=lead?`${lead.x|0},${lead.y|0}`:"N/A";

    const txt=[
        `Tactical:${sim.tactics.state.toUpperCase()}`,
        `Formation:${sim.formation.mode.toUpperCase()}`,
        `Leader:${lt}`,
        `Order:${sim.command.highLevelOrder.toUpperCase()}`,
        `Replay:${r.playing?"ON":"OFF"}`,
        `Perf:${isPerformanceMode()?"ON":"OFF"}`,
        `Cam:${cam.mode.toUpperCase()}`,
        `Zoom:${cam.zoom.toFixed(2)}`,
        `Export:${exp.active?exp.mode.toUpperCase():"OFF"}`
    ].join(" | ");

    ctx.fillText(txt,260,20);
    ctx.restore();
}

// ------------------------------------------------------------
// LETTERBOX
// ------------------------------------------------------------
function drawLetterbox(){
    const exp=getExportState();
    if(!exp.active || exp.mode==="hud") return;

    ctx.save();
    ctx.fillStyle="rgba(0,0,0,0.9)";
    ctx.fillRect(0,0,1280,60);
    ctx.fillRect(0,720-60,1280,60);
    ctx.restore();
}

// ------------------------------------------------------------
// EXPORT CAPTURE
// ------------------------------------------------------------
let exportFrames=[];
let exportMetadata=[];

function captureFrame(){
    const exp=getExportState();
    if(!exp.active) return;

    exportFrames.push(ctx.getImageData(0,0,1280,720));

    const sim=getSimState();
    exportMetadata.push({
        time:sim.time,
        camera:{x:camera.x,y:camera.y,zoom:camera.zoom},
        tactics:{...sim.tactics},
        formation:{...sim.formation},
        command:{...sim.command}
    });
}

// ------------------------------------------------------------
// DEBUG OVERLAY
// ------------------------------------------------------------
function drawDebugOverlay(){
    if(!DEBUG) return;

    const sim=getSimState(), r=getReplayState();
    ctx.save();
    ctx.font="10px system-ui"; 
    ctx.fillStyle="rgba(255,255,255,0.7)";
    let y=50;

    for(const t of [
        `TIME:${sim.time.toFixed(2)}`,
        `CAM:(${camera.x.toFixed(1)},${camera.y.toFixed(1)}) Z=${camera.zoom.toFixed(2)}`,
        `MODE:${getCameraState().mode.toUpperCase()}`,
        `REPLAY:${r.playing?"ON":"OFF"} ${r.time.toFixed(2)}/${r.duration.toFixed(2)}`,
        `THREAT:${getThreatMagnitude().toFixed(1)}`,
        `SHAKE:${camera.shake.toFixed(2)}`
    ]){
        ctx.fillText(t,20,y);
        y+=12;
    }

    ctx.restore();
}

// ------------------------------------------------------------
// MAIN RENDER LOOP
// ------------------------------------------------------------
function renderFrame(t){
    const dt=clamp((t-lastTime)/1000,0.001,0.05);
    lastTime=t;

    updateCameraFromState(dt);

    drawGrid();
    drawThreat();
    drawThreatArcs();
    drawHotspotPulse();
    drawFormationGhosts();
    drawEntities();
    drawEnemies();
    drawRadialMenu();

    const exp=getExportState();
    if(exp.mode!=="clean"){
        drawHud();
        drawMinimap();
    }

    drawLetterbox();
    drawDebugOverlay();
    captureFrame();

    requestAnimationFrame(renderFrame);
}

requestAnimationFrame(renderFrame);

console.log("APEXSIM Renderer - online");
