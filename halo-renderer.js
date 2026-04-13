/*
    APEXCORE v4.2 — HALO Renderer (FULLNUKE Edition)
*/

(function () {

    let canvas = null;
    let ctx = null;

    function init() {
        canvas = document.getElementById("haloCanvas");

        if (!canvas) {
            console.error("HALO Renderer — ERROR: <canvas id='haloCanvas'> not found.");
            return;
        }

        ctx = canvas.getContext("2d");
        if (!ctx) {
            console.error("HALO Renderer — ERROR: 2D context could not be created.");
            return;
        }

        resize();
        window.addEventListener("resize", resize);

        console.log("HALO Renderer initialized");
    }

    function resize() {
        if (!canvas) return;
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    function render() {
        if (!ctx || !canvas) return;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const ents = APEX.get("entities");
        if (ents && typeof ents.all === "function") {
            for (const e of ents.all()) {
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const forms = APEX.get("formations");
        if (forms && typeof forms.all === "function") {
            ctx.strokeStyle = "rgba(0,255,0,0.4)";
            for (const f of forms.all()) {
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    APEX.register("renderer", { type: "renderer", start: init, render });

})();
