/* Overhead Now: the 3D globe (WebGL2, no libraries).
   © 2026 Randy Barnhill. All rights reserved.

   Drawn in an Earth-fixed frame, in Earth radii: +x through 0°N 0°E, +y through 90°E, +z through the North Pole.
   Everything shown is computed, nothing is decorative data: satellites sit at their true altitude, the day/night line
   comes from the sun's position this second, and there is no starfield (random dots on a satellite tracker would look
   like objects). The page falls back to the classic 2D canvas when WebGL2 is missing or the context is lost. */
(function () {
  'use strict';
  var D2R = Math.PI / 180, RE = 6371, FOV = 30 * D2R;

  function sh(gl, type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader'); return s; }
  function prog(gl, vs, fs, attribs) {
    var p = gl.createProgram(); gl.attachShader(p, sh(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl, gl.FRAGMENT_SHADER, fs));
    attribs.forEach(function (a, i) { gl.bindAttribLocation(p, i, a); });
    gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var info = gl.getActiveUniform(p, i), name = info.name.replace(/\[0\]$/, ''); u[name] = gl.getUniformLocation(p, name); }
    return { p: p, u: u };
  }
  // 4x4 matrices, column-major
  function persp(fovy, aspect, near, far) { var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far); return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]; }
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function mul(a, b) { var o = new Array(16); for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; }
  function xyz(lat, lon, r) { var la = lat * D2R, lo = lon * D2R; return [r * Math.cos(la) * Math.cos(lo), r * Math.cos(la) * Math.sin(lo), r * Math.sin(la)]; }

  // Land mask: the coastline polygons filled on an equirectangular canvas (used only for the land/ocean tint).
  function landCanvas(coast) {
    var W = 2048, H = 1024, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.fillStyle = '#fff';
    coast.forEach(function (ring) {
      if (!ring.length) return;
      var pts = [], prev = ring[0][0], off = 0, sum = 0;
      ring.forEach(function (q) { var d = q[0] - prev; if (d > 180) off -= 360; else if (d < -180) off += 360; prev = q[0]; pts.push([q[0] + off, q[1]]); sum += q[1]; });
      // A ring that circles a pole (Antarctica) does not close in longitude: close it through the pole.
      if (Math.abs(pts[pts.length - 1][0] - pts[0][0]) > 180) { var pole = sum / ring.length < 0 ? -90 : 90; pts.push([pts[pts.length - 1][0], pole], [pts[0][0], pole]); }
      [-360, 0, 360].forEach(function (k) {
        x.beginPath(); pts.forEach(function (q, i) { var px = (q[0] + k + 180) / 360 * W, py = (90 - q[1]) / 180 * H; if (i) x.lineTo(px, py); else x.moveTo(px, py); });
        x.closePath(); x.fill();
      });
    });
    return c;
  }

  var VS_EARTH = '#version 300 es\nin vec3 p;uniform mat4 mvp;uniform float scale;out vec3 n;void main(){n=p*scale;gl_Position=mvp*vec4(p*scale,1.);}';
  var FS_EARTH = '#version 300 es\nprecision highp float;in vec3 n;uniform sampler2D land;uniform vec3 sun,eye,cOcean,cLand,cLine,cGlow;uniform float night;out vec4 o;\n' +
    'float grid(float v,float st){float x=v/st;float f=abs(fract(x-.5)-.5);return 1.-smoothstep(0.,fwidth(x)*1.3,f);}\n' +
    'void main(){vec3 N=normalize(n);float lat=asin(clamp(N.z,-1.,1.));float lon=atan(N.y,N.x);\n' +
    ' float m=textureLod(land,vec2(lon/6.2831853+.5,.5-lat/3.14159265),0.).r;\n' +
    ' float latd=degrees(lat),lond=degrees(lon);\n' +
    ' float g=0.;if(abs(latd)<75.)g=grid(latd,30.);g=max(g,grid(lond,30.)*step(abs(latd),88.));\n' +
    ' float eq=(1.-smoothstep(0.,fwidth(latd)*1.8,abs(latd)))*step(.5,fract(lond/4.));\n' +
    ' vec3 base=mix(cOcean,cLand,m);base=mix(base,cLine,max(g*.7,eq*.95));\n' +
    ' float ndl=dot(N,sun);float day=smoothstep(-.1,.1,ndl);\n' +
    ' vec3 col=mix(base*night,base*(.82+.28*max(ndl,0.)),day);\n' +
    ' float rim=pow(1.-max(dot(N,normalize(eye-N)),0.),3.);col=mix(col,cGlow,rim*.45*(.35+.65*day));\n' +
    ' o=vec4(col,1.);}';
  // Atmosphere: a shell just outside the limb. Brightness depends on how close the line of sight passes to the surface.
  var FS_HALO = '#version 300 es\nprecision highp float;in vec3 n;uniform vec3 sun,eye,cGlow;uniform float thick;out vec4 o;\n' +
    'void main(){vec3 d=normalize(n-eye);float t=-dot(eye,d);vec3 c=eye+d*t;float b=length(c);\n' +
    ' float i=clamp(1.-(b-1.)/thick,0.,1.);i=i*i*i*step(1.,b);\n' +
    ' float lit=.3+.7*smoothstep(-.25,.3,dot(normalize(c),sun));o=vec4(cGlow,i*.75*lit);}';
  var VS_LINE = '#version 300 es\nin vec3 a;in vec3 b;in float s;in float u;uniform mat4 mvp;uniform vec2 vp;uniform float hw;out float vu;\n' +
    'void main(){vec4 pa=mvp*vec4(a,1.),pb=mvp*vec4(b,1.);vec2 d=(pb.xy/pb.w-pa.xy/pa.w)*vp;float l=length(d);d=l>1e-5?d/l:vec2(1.,0.);\n' +
    ' pa.xy+=vec2(-d.y,d.x)*s*hw*2./vp*pa.w;gl_Position=pa;vu=u;}';
  var FS_LINE = '#version 300 es\nprecision highp float;in float vu;uniform vec4 col;uniform float dash;out vec4 o;void main(){if(dash>0.&&fract(vu*dash)>.55)discard;o=col;}';
  // Satellites: position at the last calculation plus velocity times the seconds since, so they glide between updates.
  var VS_PT = '#version 300 es\nin vec3 pos;in vec3 vel;in float meta;uniform mat4 mvp;uniform vec3 eyeDir;uniform float dt,px,ring,ptScale;uniform vec3 cols[5];uniform vec3 cUp;out vec4 col;\n' +
    'void main(){float m=meta;float hid=floor(m/16.);m-=hid*16.;float up=floor(m/8.);m-=up*8.;int cat=int(m+.5);\n' +
    ' vec3 P=(pos+vel*dt)/6371.;gl_Position=mvp*vec4(P,1.);\n' +
    ' if(hid>.5||(ring>.5&&up<.5)){gl_Position=vec4(2.,2.,2.,1.);gl_PointSize=1.;col=vec4(0.);return;}\n' +
    ' float r=cat==4?4.2:(cat==1?.96:1.56);r*=ptScale;\n' +
    ' float back=dot(P,eyeDir)<0.?.4:1.;\n' +
    ' if(ring>.5){gl_PointSize=max(2.*r+5.5*ptScale,6.)*px;col=vec4(cUp,back);}else{gl_PointSize=max(2.*r,2.2)*px;col=vec4(cols[cat],back);}}';
  var FS_PT = '#version 300 es\nprecision highp float;in vec4 col;uniform float ring;out vec4 o;\n' +
    'void main(){float r=length(gl_PointCoord-.5)*2.;float a=ring>.5?smoothstep(.62,.72,r)*(1.-smoothstep(.9,1.,r)):1.-smoothstep(.75,1.,r);if(a<.02)discard;o=vec4(col.rgb,col.a*a);}';

  window.Globe3D = function (canvas, overlay, coast) {
    var gl = null;
    try { gl = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'high-performance' }); } catch (e) { gl = null; }
    if (!gl) return null;
    var P;
    try {
      P = { earth: prog(gl, VS_EARTH, FS_EARTH, ['p']), halo: prog(gl, VS_EARTH, FS_HALO, ['p']), line: prog(gl, VS_LINE, FS_LINE, ['a', 'b', 's', 'u']), pt: prog(gl, VS_PT, FS_PT, ['pos', 'vel', 'meta']) };
    } catch (e) { if (window.console) console.warn('Overhead Now 3D unavailable:', e.message); return null; }

    // sphere mesh
    var NLAT = 48, NLON = 96, sv = [], si = [];
    for (var i = 0; i <= NLAT; i++) for (var j = 0; j <= NLON; j++) { var q = xyz(90 - 180 * i / NLAT, -180 + 360 * j / NLON, 1); sv.push(q[0], q[1], q[2]); }
    for (i = 0; i < NLAT; i++) for (j = 0; j < NLON; j++) { var a = i * (NLON + 1) + j, b = a + NLON + 1; si.push(a, b, a + 1, a + 1, b, b + 1); }
    var sphereVao = gl.createVertexArray(); gl.bindVertexArray(sphereVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sv), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(si), gl.STATIC_DRAW);

    var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, landCanvas(coast));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // thick lines: 6 vertices a segment, each carrying its own end, the other end, a side and a dash coordinate
    function lineMesh(points, r) { // points: array of polylines of [x,y,z]
      var out = [], u = 0;
      points.forEach(function (pl) {
        for (var k = 0; k + 1 < pl.length; k++) {
          var A = pl[k], B = pl[k + 1], u0 = u, u1 = u + 1; u = u1;
          var v = [[A, B, 1, u0], [A, B, -1, u0], [B, A, -1, u1], [B, A, -1, u1], [A, B, -1, u0], [B, A, 1, u1]];
          v.forEach(function (w) { out.push(w[0][0] * r, w[0][1] * r, w[0][2] * r, w[1][0] * r, w[1][1] * r, w[1][2] * r, w[2], w[3]); });
        }
      });
      return new Float32Array(out);
    }
    function lineVao(usage) {
      var vao = gl.createVertexArray(), buf = gl.createBuffer(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      [[0, 3, 0], [1, 3, 12], [2, 1, 24], [3, 1, 28]].forEach(function (d) { gl.enableVertexAttribArray(d[0]); gl.vertexAttribPointer(d[0], d[1], gl.FLOAT, false, 32, d[2]); });
      return { vao: vao, buf: buf, n: 0, usage: usage };
    }
    function setLine(L, data) { gl.bindBuffer(gl.ARRAY_BUFFER, L.buf); gl.bufferData(gl.ARRAY_BUFFER, data, L.usage); L.n = data.length / 8; }
    var coastL = lineVao(gl.STATIC_DRAW), trailL = lineVao(gl.DYNAMIC_DRAW);
    setLine(coastL, lineMesh(coast.map(function (ring) { return ring.map(function (q) { return xyz(q[1], q[0], 1); }); }), 1.003));

    // satellites
    var ptVao = gl.createVertexArray(), ptBuf = gl.createBuffer(), ptN = 0, ptData = null;
    gl.bindVertexArray(ptVao); gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
    [[0, 3, 0], [1, 3, 12], [2, 1, 24]].forEach(function (d) { gl.enableVertexAttribArray(d[0]); gl.vertexAttribPointer(d[0], d[1], gl.FLOAT, false, 28, d[2]); });
    gl.bindVertexArray(null);

    var cam = { eye: [0, 0, 5], mvp: null, right: null, up: null, fwd: null, w: 1, h: 1, dpr: 1 }, lost = false, scaleCap = 2;
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); lost = true; if (api.onLost) api.onLost(); });

    function resize() {
      var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, scaleCap);
      var w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      if (overlay && (overlay.width !== w || overlay.height !== h)) { overlay.width = w; overlay.height = h; }
      cam.w = r.width; cam.h = r.height; cam.dpr = dpr;
    }
    function setCamera(rot, zoom) {
      var t = 0.98 * Math.tan(FOV / 2) / zoom, d = Math.sqrt(1 + t * t) / t; // the Earth fills the same share of the view as in the 2D globe
      var dir = xyz(rot.lat, rot.lon, 1), eye = [dir[0] * d, dir[1] * d, dir[2] * d];
      var f = norm([-eye[0], -eye[1], -eye[2]]), s = norm(cross(f, [0, 0, 1])), u = cross(s, f);
      var view = [s[0], u[0], -f[0], 0, s[1], u[1], -f[1], 0, s[2], u[2], -f[2], 0, -dot(s, eye), -dot(u, eye), dot(f, eye), 1];
      cam.eye = eye; cam.fwd = f; cam.right = s; cam.up = u; cam.d = d;
      cam.mvp = mul(persp(FOV, cam.w / cam.h, 0.05, d + 120), view);
    }
    // world point (Earth radii) -> CSS pixel, or null when off-screen or hidden behind the Earth
    function project(p) {
      var m = cam.mvp, w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15]; if (w <= 0) return null;
      var x = (m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12]) / w, y = (m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13]) / w;
      var e = cam.eye, D = [p[0] - e[0], p[1] - e[1], p[2] - e[2]], tt = -dot(e, D) / dot(D, D);
      if (tt > 0 && tt < 1) { var c = [e[0] + D[0] * tt, e[1] + D[1] * tt, e[2] + D[2] * tt]; if (dot(c, c) < 0.99) return null; }
      return [(x * 0.5 + 0.5) * cam.w, (0.5 - y * 0.5) * cam.h];
    }
    // CSS pixel -> [lat, lon] on the surface, or null when the tap misses the Earth
    function pick(px, py) {
      var nx = px / cam.w * 2 - 1, ny = 1 - py / cam.h * 2, th = Math.tan(FOV / 2), asp = cam.w / cam.h;
      var d = norm([cam.fwd[0] + cam.right[0] * nx * th * asp + cam.up[0] * ny * th, cam.fwd[1] + cam.right[1] * nx * th * asp + cam.up[1] * ny * th, cam.fwd[2] + cam.right[2] * nx * th * asp + cam.up[2] * ny * th]);
      var e = cam.eye, bq = dot(e, d), cq = dot(e, e) - 1, disc = bq * bq - cq; if (disc < 0) return null;
      var t = -bq - Math.sqrt(disc), h = [e[0] + d[0] * t, e[1] + d[1] * t, e[2] + d[2] * t];
      return [Math.asin(Math.max(-1, Math.min(1, h[2]))) / D2R, Math.atan2(h[1], h[0]) / D2R];
    }

    var api = {
      onLost: null,
      project: project, pick: pick, resize: resize,
      setScaleCap: function (v) { scaleCap = v; },
      // How many different colors a 5x5 grid of pixels holds, read straight after a draw: 1 means a blank canvas.
      // Used once by the page so the site check can tell the 3D globe really drew.
      sample: function () {
        var px = new Uint8Array(4), seen = {}, n = 0;
        for (var i = 0; i < 5; i++) for (var j = 0; j < 5; j++) { gl.readPixels(Math.floor(canvas.width * (i + 0.5) / 5), Math.floor(canvas.height * (j + 0.5) / 5), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); var k = px[0] + ',' + px[1] + ',' + px[2]; if (!seen[k]) { seen[k] = 1; n++; } }
        return n;
      },
      // list: [{ex,ey,ez (km, Earth-fixed), vx,vy,vz (km/s), c3 (category 0-4), up3, hid3}] in draw order
      setSats: function (list) {
        if (!ptData || ptData.length !== list.length * 7) ptData = new Float32Array(list.length * 7);
        for (var k = 0; k < list.length; k++) { var s = list[k], o = k * 7; ptData[o] = s.ex || 0; ptData[o + 1] = s.ey || 0; ptData[o + 2] = s.ez || 0; ptData[o + 3] = s.vx || 0; ptData[o + 4] = s.vy || 0; ptData[o + 5] = s.vz || 0; ptData[o + 6] = s.c3 + (s.up3 ? 8 : 0) + (s.hid3 ? 16 : 0); }
        gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf); gl.bufferData(gl.ARRAY_BUFFER, ptData, gl.DYNAMIC_DRAW); ptN = list.length;
      },
      setTrail: function (pts) { setLine(trailL, lineMesh(pts.length > 1 ? [pts] : [], 1)); }, // pts in Earth radii
      draw: function (st) { // st: rot, zoom, dt, sun [x,y,z], colors {bg,ocean,land,line,coast,glow,trail,up,cats[5]}, night, ptScale
        if (lost) return;
        resize(); setCamera(st.rot, st.zoom);
        var W = canvas.width, H = canvas.height, c = st.colors, m = new Float32Array(cam.mvp);
        gl.viewport(0, 0, W, H); gl.clearColor(c.bg[0], c.bg[1], c.bg[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.disable(gl.BLEND); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.frontFace(gl.CCW);
        // Earth
        var e = P.earth; gl.useProgram(e.p); gl.bindVertexArray(sphereVao);
        gl.uniformMatrix4fv(e.u.mvp, false, m); gl.uniform1f(e.u.scale, 1); gl.uniform3fv(e.u.sun, st.sun); gl.uniform3fv(e.u.eye, cam.eye);
        gl.uniform3fv(e.u.cOcean, c.ocean); gl.uniform3fv(e.u.cLand, c.land); gl.uniform3fv(e.u.cLine, c.line); gl.uniform3fv(e.u.cGlow, c.glow); gl.uniform1f(e.u.night, st.night);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(e.u.land, 0);
        gl.drawElements(gl.TRIANGLES, si.length, gl.UNSIGNED_SHORT, 0);
        // atmosphere shell (inside faces, behind the Earth)
        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.cullFace(gl.FRONT);
        var h = P.halo; gl.useProgram(h.p); gl.uniformMatrix4fv(h.u.mvp, false, m); gl.uniform1f(h.u.scale, 1.09); gl.uniform1f(h.u.thick, 0.09);
        gl.uniform3fv(h.u.sun, st.sun); gl.uniform3fv(h.u.eye, cam.eye); gl.uniform3fv(h.u.cGlow, c.glow);
        gl.drawElements(gl.TRIANGLES, si.length, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.CULL_FACE);
        // coastlines, then the ISS orbit
        var l = P.line; gl.useProgram(l.p); gl.uniformMatrix4fv(l.u.mvp, false, m); gl.uniform2f(l.u.vp, W, H);
        gl.bindVertexArray(coastL.vao); gl.uniform1f(l.u.hw, 0.6 * cam.dpr); gl.uniform1f(l.u.dash, 0); gl.uniform4f(l.u.col, c.coast[0], c.coast[1], c.coast[2], 0.95); gl.drawArrays(gl.TRIANGLES, 0, coastL.n);
        if (trailL.n) { gl.bindVertexArray(trailL.vao); gl.uniform1f(l.u.hw, 0.75 * cam.dpr); gl.uniform1f(l.u.dash, 1); gl.uniform4f(l.u.col, c.trail[0], c.trail[1], c.trail[2], 0.9); gl.drawArrays(gl.TRIANGLES, 0, trailL.n); }
        // satellites, then the rings on the ones above the observer's horizon
        if (ptN) {
          var p = P.pt; gl.useProgram(p.p); gl.bindVertexArray(ptVao); gl.uniformMatrix4fv(p.u.mvp, false, m);
          var ed = norm(cam.eye); gl.uniform3f(p.u.eyeDir, ed[0], ed[1], ed[2]); gl.uniform1f(p.u.dt, st.dt); gl.uniform1f(p.u.px, cam.dpr * Math.max(0.5, Math.min(1, cam.w / 720))); // dots and rings shrink with the canvas, as on the classic globe gl.uniform1f(p.u.ptScale, st.ptScale);
          gl.uniform3fv(p.u.cols, new Float32Array([].concat.apply([], c.cats))); gl.uniform3fv(p.u.cUp, c.up);
          gl.uniform1f(p.u.ring, 0); gl.drawArrays(gl.POINTS, 0, ptN);
          gl.uniform1f(p.u.ring, 1); gl.drawArrays(gl.POINTS, 0, ptN);
        }
        gl.bindVertexArray(null); gl.depthMask(true);
      }
    };
    return api;
  };
})();
