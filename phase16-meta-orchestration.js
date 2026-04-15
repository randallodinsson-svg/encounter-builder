// phase16-meta-orchestration.js
// APEXCORE v4.4 — Phase 16: Meta‑Formation Orchestration

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Meta = (APEX.Meta = APEX.Meta || {});

  Meta.config = {
    clusterRadius: 420,        // distance for meta‑grouping
    minClusterSize: 3,         // minimum formations to treat as a cluster
    globalScanInterval: 0.5,   // seconds between global meta scans
    pressureBias: 0.6          // how much global pressure shapes directives
  };

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function ensureMetaState(formation) {
    if (!formation.meta) {
      formation.meta = {
        clusterId: -1,
        role: "neutral" // "vanguard", "anchor", "flank", "reserve"
      };
    }
  }

  function distance2(a, b) {
    const dx = a.center.x - b.center.x;
    const dy = a.center.y - b.center.y;
    return dx * dx + dy * dy;
  }

  // Simple clustering: greedy grouping by proximity
  function buildClusters(formations) {
    const cfg = Meta.config;
    const r2 = cfg.clusterRadius * cfg.clusterRadius;
    const clusters = [];
    const visited = new Set();

    for (let i = 0; i < formations.length; i++) {
      const f = formations[i];
      if (visited.has(f)) continue;

      const cluster = [];
      const stack = [f];
      visited.add(f);

      while (stack.length) {
        const cur = stack.pop();
        cluster.push(cur);

        for (let j = 0; j < formations.length; j++) {
          const other = formations[j];
          if (visited.has(other)) continue;
          if (distance2(cur, other) <= r2) {
            visited.add(other);
            stack.push(other);
          }
        }
      }

      if (cluster.length >= cfg.minClusterSize) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  function computeClusterCenter(cluster) {
    let sx = 0, sy = 0;
    for (let i = 0; i < cluster.length; i++) {
      sx += cluster[i].center.x;
      sy += cluster[i].center.y;
    }
    const inv = 1 / cluster.length;
    return { x: sx * inv, y: sy * inv };
  }

  function computeClusterPressure(cluster) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < cluster.length; i++) {
      const mem = cluster[i].memory || {};
      if (mem.lastPressure != null) {
        sum += mem.lastPressure;
        count++;
      }
    }
    if (!count) return 0.5;
    return clamp01(sum / count);
  }

  function assignClusterRoles(cluster, clusterId) {
    const center = computeClusterCenter(cluster);

    // sort by distance to center
    const sorted = cluster.slice().sort((a, b) => {
      const da = distance2(a, { center });
      const db = distance2(b, { center });
      return da - db;
    });

    const n = sorted.length;
    const vanguardCount = Math.max(1, Math.floor(n * 0.25));
    const anchorCount = Math.max(1, Math.floor(n * 0.25));
    const flankCount = Math.max(1, Math.floor(n * 0.25));
    // rest = reserve

    for (let i = 0; i < n; i++) {
      const f = sorted[i];
      ensureMetaState(f);
      f.meta.clusterId = clusterId;

      if (i < vanguardCount) {
        f.meta.role = "vanguard";
      } else if (i < vanguardCount + anchorCount) {
        f.meta.role = "anchor";
      } else if (i < vanguardCount + anchorCount + flankCount) {
        f.meta.role = "flank";
      } else {
        f.meta.role = "reserve";
      }
    }
  }

  function pushMetaRoleCommands(formation) {
    const cmds = (formation.pendingCommands = formation.pendingCommands || []);
    const role = formation.meta ? formation.meta.role : "neutral";

    switch (role) {
      case "vanguard":
        cmds.push({ type: "SET_MODE", mode: "aggressive" });
        cmds.push({ type: "PUSH_FRONT" });
        break;
      case "anchor":
        cmds.push({ type: "SET_MODE", mode: "defensive" });
        cmds.push({ type: "HOLD_LINE" });
        break;
      case "flank":
        cmds.push({ type: "SET_MODE", mode: "cunning" });
        cmds.push({ type: "SEEK_FLANK" });
        break;
      case "reserve":
        cmds.push({ type: "SET_MODE", mode: "neutral" });
        cmds.push({ type: "SHADOW_CLUSTER" });
        break;
      default:
        break;
    }
  }

  // Per‑formation meta update (called from formation‑ai)
  Meta.updateFormationMetaState = function (formation, formations, dt) {
    ensureMetaState(formation);
    // local behavior is mostly driven by global meta pass,
    // but we can still enforce role‑based commands here:
    pushMetaRoleCommands(formation);
  };

  // Global meta pass — builds clusters and assigns roles
  Meta.updateGlobalMeta = (function () {
    let time = 0;
    let lastScan = -999;
    let cachedClusters = [];

    return function (formations, dt) {
      time += dt;
      const cfg = Meta.config;

      if (time - lastScan >= cfg.globalScanInterval) {
        lastScan = time;
        cachedClusters = buildClusters(formations);

        for (let i = 0; i < cachedClusters.length; i++) {
          assignClusterRoles(cachedClusters[i], i);
        }
      }

      // Optional: global pressure‑based directive (future extension)
      // For now, clustering + roles is enough for Phase 16.
    };
  })();

  console.log("PHASE16_META — online (Meta‑Formation Orchestration).");
})(this);
