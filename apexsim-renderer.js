// apexim-renderer.js — APEXSIM Renderer v7.2 (Compact Full Version)
console.log("APEXSIM Renderer - initializing");

import {
    getSimState, getEntities, getEnemies,
    getThreatCenter, getThreatMagnitude, drawHeatmap
} from "./apexsim.js";

import {
    getCameraState, getExportState, getRadialMenuState,
    isHeatmapEnabled, isPerformanceMode, getReplayState
} from "./index.js";

// ------------------------------------------------------------
// CANVAS + CORE STATE
// ------------------------------------------------------------
const canvas = document.getElementById("apex-canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1280; canvas.height = 720;

const DEBUG = true;

const camera = {
    x: 640, y: 360, zoom: 1,
    targetX: 640, targetY: 360, targetZoom: 1,
    shake: 0
};

const director = {
    shotTimer: 0, shotDuration: 3,
    lastShot: "", weightLeader: 3,
    weightHotspot: 2, weightCentroid: 1, weightThreat: 1
};

let exportFrames = [];
let exportMetadata = [];
let lastTimestamp = performance.now();

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const smoothstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};

const worldToScreen=(x,y)=>({
    x:(x-camera.x)*camera.zoom+canvas.width/2,
    y:(y-camera.y)*camera.zoom+canvas.height/2
});

// ------------------------------------------------------------
// DRAW PRIMITIVES
// ------------------------------------------------------------
function drawCircle(x,y,r,c,a=1){
    const p=worldToScreen(x,y);
    ctx.save(); ctx.globalAlpha=a;
    ctx.beginPath(); ctx.arc(p.x,p.y,r*camera.zoom,0,Math.PI*2);
    ctx.fillStyle=c; ctx.fill(); ctx.restore();
}

function drawRing(x,y,r,t,c,a=1){
    const p=worldToScreen(x,y);
    ctx.save(); ctx.globalAlpha=a;
    ctx.beginPath(); ctx.arc(p.x,p.y,r*camera.zoom,0,Math.PI*2);
    ctx.lineWidth=t*camera.zoom; ctx.strokeStyle=c; ctx.stroke();
    ctx.restore();
}

function drawLine(x1,y1,x2,y2,c,w=1,a=1){
    const p1=worldToScreen(x1,y1), p2=worldToScreen(x2,y2);
    ctx.save(); ctx.globalAlpha=a;
    ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);
    ctx.strokeStyle=c; ctx.lineWidth=w*camera.zoom; ctx.stroke();
    ctx.restore();
}

function drawLabel(x,y,text,c="#FFF",align="center",size=12){
    const p=worldToScreen(x,y);
    ctx.save();
    ctx.font=`${size*camera.zoom}px system-ui`;
    ctx.fillStyle=c; ctx.textAlign=align; ctx.textBaseline="middle";
    ctx.fillText(text,p.x,p.y);
    ctx.restore();
}

// ------------------------------------------------------------
// GRID
// ------------------------------------------------------------
function drawGrid(){
    ctx.save();
    ctx.fillStyle="#05070A"; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle="rgba(255,255,255,0.04)"; ctx.lineWidth=1;

    const spacing=40;
    const left=screenToWorld(0,0).x, right=screenToWorld(canvas.width,0).x;
    const top=screenToWorld(0,0).y, bottom=screenToWorld(0,canvas.height).y;

    const sx=Math.floor(left/spacing)*spacing, ex=Math.ceil(right/spacing)*spacing;
    const sy=Math.floor(top/spacing)*spacing, ey=Math.ceil(bottom/spacing)*spacing;

    ctx.beginPath();
    for(let x=sx;x<=ex;x+=spacing){
        const p1=worldToScreen(x,top), p2=worldToScreen(x,bottom);
        ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);
    }
    for(let y=sy;y<=ey;y+=spacing){
        const p1=worldToScreen(left,y), p2=worldToScreen(right,y);
        ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);
    }
    ctx.stroke(); ctx.restore();
}

// ------------------------------------------------------------
// ENTITIES + ENEMIES
// ------------------------------------------------------------
function drawEntities(){
    for(const e of getEntities()){
        drawCircle(e.x,e.y,e.type.size,e.type.color,0.95);
        if(DEBUG && (e.vx||e.vy))
            drawLine(e.x,e.y,e.x+e.vx*0.5,e.y+e.vy*0.5,"rgba(0,255,200,0.5)",1,0.8);
    }
}

function drawEnemies(){
    for(const en of getEnemies()){
        drawCircle(en.x,en.y,8,"#FF4D4D",0.9);
        drawRing(en.x,en.y,26,1.5,"rgba(255,77,77,0.6)",0.9);

        const p=worldToScreen(en.x,en.y);
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(en.facing||0);
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.arc(0,0,80*camera.zoom,-Math.PI/8,Math.PI/8);
        ctx.closePath();
        ctx.fillStyle="rgba(255,77,77,0.18)";
        ctx.fill(); ctx.restore();
    }
}

// ------------------------------------------------------------
// THREAT + HOTSPOT
// ------------------------------------------------------------
function drawThreat(){
    const sim=getSimState();
    if(isHeatmapEnabled()) drawHeatmap(ctx,sim);

    const tc=getThreatCenter(), mag=getThreatMagnitude();
    drawRing(tc.x,tc.y,40+mag*4,2,"rgba(0,255,200,0.5)",0.8);
}

function drawThreatArcs(){
    const tc=getThreatCenter(), mag=getThreatMagnitude();
    drawRing(tc.x,tc.y,80+mag*3,2,"rgba(255,0,0,0.25)",0.8);
    drawRing(tc.x,tc.y,(80+mag*3)*1.3,1.5,"rgba(255,0,0,0.15)",0.6);
}

function drawHotspotPulse(){
    const sim=getSimState(), h=sim.cameraAnchors.engagementHotspot;
    const r=30+(Math.sin(sim.time*2)+1)*10;
    drawRing(h.x,h.y,r,2,"rgba(0,200,255,0.5)",0.9);
}

// ------------------------------------------------------------
// RADIAL MENU
// ------------------------------------------------------------
function drawRadialMenu(){
    const r=getRadialMenuState();
    if(!r.visible) return;

    const p=worldToScreen(r.x,r.y);
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
    const leader=ents.find(e=>e.id===sim.formation.leaderId);
    if(!leader) return;

    const count=ents.length, mode=sim.formation.mode;

    for(let i=0;i<count;i++){
        const e=ents[i]; if(e.id===leader.id) continue;

        let ox=0, oy=0;
        if(mode==="tight"){
            const a=(i/count)*Math.PI*2; ox=Math.cos(a)*60; oy=Math.sin(a)*60;
        } else if(mode==="spread"){
            const a=(i/count)*Math.PI*2; ox=Math.cos(a)*110; oy=Math.sin(a)*110;
        } else if(mode==="line"){
            ox=(i-count/2)*26;
        } else if(mode==="wedge"){
            const row=Math.floor(i/4), col=i%4;
            ox=(col-1.5)*26*(row+1); oy=row*26;
        }

        drawRing(leader.x+ox,leader.y+oy,10,1.5,"rgba(255,255,255,0.15)",0.6);
    }

    const c=sim.cameraAnchors.squadCentroid;
    drawLabel(c.x,c.y-40,"SQUAD","rgba(255,255,255,0.7)", "center",11);
}

// ------------------------------------------------------------
// MINIMAP
// ------------------------------------------------------------
function drawMinimap(){
    const sim=getSimState(), ents=sim.entities, ens=sim.enemies;
    const w=180,h=120,x0=canvas.width-w-20,y0=canvas.height-h-20;

    ctx.save();
    ctx.fillStyle="rgba(5,10,20,0.85)";
    ctx.fillRect(x0,y0,w,h);
    ctx.strokeStyle="rgba(255,255,255,0.1)";
    ctx.strokeRect(x0,y0,w,h);

    const mapX=x=>x0+(x/1280)*w, mapY=y=>y0+(y/720)*h;

    for(const e of ents){
        ctx.fillStyle=e.type.color;
        ctx.fillRect(mapX(e.x),mapY(e.y),3,3);
    }
    for(const en of ens){
        ctx.fillStyle="#FF4D4D";
        ctx.fillRect(mapX(en.x),mapY(en.y),3,3);
    }

    ctx.restore();
}

// ------------------------------------------------------------
// HUD + LETTERBOX
// ------------------------------------------------------------
function drawHud(){
    const sim=getSimState(), replay=getReplayState();
    const cam=getCameraState(), exp=getExportState();

    ctx.save();
    ctx.fillStyle="rgba(5,10,20,0.96)";
    ctx.fillRect(0,0,canvas.width,40);

    ctx.font="12px system-ui"; ctx.fillStyle="#9FA8B8";
    ctx.textBaseline="middle";
    ctx.fillText("APEXSIM // ENCOUNTER BUILDER",20,20);

    const leader=sim.entities.find(e=>e.id===sim.formation.leaderId);
    const leaderText=leader?`${leader.x|0}, ${leader.y|0}`:"N/A";

    const summary=[
        `Tactical: ${sim.tactics.state.toUpperCase()}`,
        `Formation: ${sim.formation.mode.toUpperCase()}`,
        `Leader: ${leaderText}`,
        `Order: ${sim.command.highLevelOrder.toUpperCase()}`,
        `Replay: ${replay.playing?"REPLAY":"LIVE"}`,
        `Perf: ${isPerformanceMode()?"ON":"OFF"}`,
        `Cam: ${cam.mode.toUpperCase()}`,
        `Zoom: ${cam.zoom.toFixed(2)}`,
        `Export: ${exp.active?exp.mode.toUpperCase():"OFF"}`
    ].join("   |   ");

    ctx.fillText(summary,260,20);
    ctx.restore();
}

function drawLetterbox(){
    const exp=getExportState();
    if(!exp.active || exp.mode==="hud") return;

    ctx.save();
    ctx.fillStyle="rgba(0,0,0,0.9)";
    ctx.fillRect(0,0,canvas.width,60);
    ctx.fillRect(0,canvas.height-60,canvas.width,60);
    ctx.restore();
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
    const shots=[
        {name:"leader",x:a.leader.x,y:a.leader.y,w:director.weightLeader},
        {name:"hotspot",x:a.engagementHotspot.x,y:a.engagementHotspot.y,w:director.weightHotspot},
        {name:"centroid",x:a.squadCentroid.x,y:a.squadCentroid.y,w:director.weightCentroid},
        {name:"threat",x:a.threatCenter.x,y:a.threatCenter.y,w:director.weightThreat}
    ];

    const pool=shots.filter(s=>s.name!==director.lastShot);
    const list=pool.length?pool:shots;

    let r=Math.random()*list.reduce((a,s)=>a+s.w,0);
    for(const s of list){
        if(r<s.w){ director.lastShot=s.name; return s; }
        r-=s.w;
    }
    return list[0];
}

function updateAutoDirector(sim,dt){
    director.shotTimer-=dt;
    if(director.shotTimer<=0){
        const s=chooseDirectorShot(sim);
        camera.targetX=s.x; camera.targetY=s.y;
        director.shotTimer=director.shotDuration;
    }
}

// ------------------------------------------------------------
// CAMERA MODES
// ------------------------------------------------------------
function updateCameraMode(sim,dt){
    const cam=getCameraState(), a=sim.cameraAnchors;

    if(cam.mode==="tracking"){
        camera.targetX=a.leader.x; camera.targetY=a.leader.y;
    } else if(cam.mode==="orbit"){
        const t=sim.time*0.4, r=140;
        camera.targetX=a.engagementHotspot.x+Math.cos(t)*r;
        camera.targetY=a.engagementHotspot.y+Math.sin(t)*r;
    } else if(cam.mode==="rail"){
        camera.targetX=a.squadCentroid.x; camera.targetY=a.squadCentroid.y;
    } else if(cam.mode==="auto"){
        updateAutoDirector(sim,dt);
    }

    const mag=getThreatMagnitude();
    camera.targetZoom=cam.zoom+smoothstep(10,40,mag)*0.25;
}

function updateCamera(dt){
    const sim=getSimState();
    updateCameraMode(sim,dt);

    const p=2.5*dt*(isPerformanceMode()?0.7:1);
    camera.x+=(camera.targetX-camera.x)*p;
    camera.y+=(camera.targetY-camera.y)*p;

    const z=3*dt;
    camera.zoom+=(camera.targetZoom-camera.zoom)*z;

    applyCameraShake();
}

function updateCameraReplay(dt){
    const r=getReplayState();
    if(!r.playing||!r.frames.length){ updateCamera(dt); return; }

    const f=r.frames.find(f=>f.time>=r.time);
    if(!f){ updateCamera(dt); return; }

    const a=f.cameraAnchors, cam=getCameraState();
    camera.targetX=a.engagementHotspot.x;
    camera.targetY=a.engagementHotspot.y;

    const p=2.5*dt;
    camera.x+=(camera.targetX-camera.x)*p;
    camera.y+=(camera.targetY-camera.y)*p;

    const z=3*dt;
    camera.zoom+=(cam.zoom-camera.zoom)*z;

    applyCameraShake();
}

function updateCameraFromState(dt){
    updateCameraReplay(dt);
}

// ------------------------------------------------------------
// EXPORT CAPTURE
// ------------------------------------------------------------
function captureFrame(){
    const exp=getExportState();
    if(!exp.active) return;

    exportFrames.push(ctx.getImageData(0,0,canvas.width,canvas.height));

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
function drawDebug(){
    if(!DEBUG) return;

    const sim=getSimState(), r=getReplayState();
    ctx.save();
    ctx.font="10px system-ui"; ctx.fillStyle="rgba(255,255,255,0.7)";
    let y=50;
    for(const line of [
        `TIME: ${sim.time.toFixed(2)}`,
        `CAM: (${camera.x.toFixed(1)},${camera.y.toFixed(1)}) Z=${camera.zoom.toFixed(2)}`,
        `MODE: ${getCameraState().mode.toUpperCase()}`,
        `REPLAY: ${r.playing?"ON":"OFF"} t=${r.time.toFixed(2)}/${r.duration.toFixed(2)}`,
        `THREAT: ${getThreatMagnitude().toFixed(1)}`,
        `SHAKE: ${camera.shake.toFixed(2)}`
    ]){
        ctx.fillText(line,20,y); y+=12
