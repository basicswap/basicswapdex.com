// The homepage hero's ribbon, rendered with the site's own WebGL2 shader
// (src/scripts/ribbon-shader.ts, copied verbatim below) so the film's ribbon
// is the same as the one on basicswapdex.com: hair-thin strands with bloom,
// the fresnel shimmer along them, a travelling sparkle, and the pulse that
// flares when the phase passes PI.
//
// heroRibbon(w, h, phase, o) draws into an offscreen WebGL2 canvas and
// returns it, ready for ctx.drawImage; it returns null where WebGL2 is not
// available, and callers fall back to the canvas ribbon in ribbon.js.
// o: { intensity (1 is the site's dark theme), amp (vertical stretch),
// zone (0..1 dims the centre for type, as the hero does behind its title) }

const VERTEX = `#version 300 es
in vec2 position;
out vec2 uv;
void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 size;
in vec2 uv;
uniform float phase;
uniform float intensity;
uniform float zone;
uniform float amp;
out vec4 fragColor;
const vec3 blue=vec3(0.,115.,255.)/255.;
const vec3 interactive=vec3(59.,130.,246.)/255.;
const vec3 violet=vec3(168.,85.,247.)/255.;
const float PI=3.14159265359;
float bell(float x,float n){return pow(.5+.5*cos(x),n);}
void main(){
 // Wide boxes (16:9 and wider) get the release animation's exact framing.
 // Narrower boxes zoom in gradually so the ribbon keeps a usable height;
 // the framing is continuous across every size.
 // Positions come from uv (0..1 across the canvas) and the element's CSS
 // size, never from gl_FragCoord, so the picture always fills the whole
 // canvas whatever drawing-buffer size the browser actually allocates.
 float aspect=size.x/size.y;
 float unit=min(size.y,size.x/clamp(aspect*1.2,1.2,1.7778));
 vec2 p=(uv-.5)*size/unit*2.;
 p.y/=amp;
 float pulse=bell(phase-PI,26.);
 float centre=exp(-dot(p*vec2(.6,1.3),p*vec2(.6,1.3)));
 vec3 light=blue*.022*centre;
 // Everything below that doesn't change from strand to strand is worked out
 // once per pixel (or once per bank) instead of 28 times, and the per-strand
 // fresnel's cosine comes from angle addition with offsets that are constants
 // once the loop unrolls. The maths is the original's; only the order of
 // work moves.
 float A=.27+.035*cos(phase);
 float travelling=bell(p.x*1.8-phase+PI,15.);
 float pulseWave=pulse*sin(p.x*3.);
 float a2=p.x*2.8-phase;
 float aq=p.x*2.4-phase*2.;
 float sq=sin(aq),cq=cos(aq);
 float energyBase=.33+travelling*.6+pulse*.65;
 vec3 sparkle=mix(interactive,vec3(1.),.75)*travelling*(.018+pulse*.08);
 for(int bank=0;bank<2;bank++){
  float side=bank==0?1.:-1.;
  float a1=p.x*1.5+phase+side*.45;
  float base=side*.21+A*sin(a1)+side*.10*pulseWave;
  float slope=A*1.5*cos(a1);
  float spread=.25+.13*sin(p.x+phase+side);
  for(int i=0;i<14;i++){
   float f=float(i)/13.;
   // The curve keeps its own sin/cos: rebuilding them by angle addition
   // rounds differently, which the hair-thin cores turn into visible edges.
   float curve=base+.11*sin(a2+f*.7)+(f-.5)*spread;
   float deriv=slope+.308*cos(a2+f*.7);
   float d=abs(p.y-curve)*inversesqrt(1.+deriv*deriv);
   // Past d=.4 a strand adds under 1/28 of half an 8-bit step, so even all
   // 28 together can't change a pixel: skip the rest of the work.
   if(d>.4)continue;
   // cos(aq+f*1.8) by angle addition; pow(x,5.) as multiplications
   float sf=sin(f*1.8),cf=cos(f*1.8);
   float w=.5+.5*(cq*cf-sq*sf);
   float w2=w*w;
   float fresnel=.2+.8*w2*w2*w;
   float width=.0014+.001*f+.002*pulse;
   float core=1.-smoothstep(width,width+.0024,d);
   float bloom=exp(-d*85.)*.14+exp(-d*19.)*.018;
   vec3 tint=mix(blue,violet,bank==0?f*.38:.62+f*.38);
   float energy=energyBase+fresnel*.5;
   light+=tint*(core*.43+bloom)*energy;
   light+=sparkle*core;
  }
 }
 light+=mix(blue,violet,.5+.5*sin(phase))*centre*pulse*.10;
 // abs(): GLSL pow() is undefined for negative bases. Software renderers
 // forgive it, NVIDIA returns NaN and blanks three quarters of the canvas.
 float typeZone=exp(-pow(abs(p.x)/1.12,6.)-pow(abs(p.y)/.21,4.));
 // On narrow boxes the type zone would cover the whole width, so the
 // dimming fades out as the box approaches portrait.
 light*=1.-.46*zone*smoothstep(1.,1.6,aspect)*typeZone;
 light*=1.-.82*smoothstep(.70,.95,abs(p.y));
 float vignette=1.-.30*smoothstep(.6,2.0,length(p*vec2(.7,1.)));
 vec3 c=clamp(light*vignette*intensity,0.,1.);
 fragColor=vec4(c,max(c.r,max(c.g,c.b)));
}`;

let state;

function setup() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true });
  if (!gl) return { gl: null };
  const compile = (type, source) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERTEX), fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vs || !fs) return { gl: null };
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return { gl: null };
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const u = (name) => gl.getUniformLocation(program, name);
  return { canvas, gl, size: u('size'), phase: u('phase'), intensity: u('intensity'), zone: u('zone'), amp: u('amp') };
}

export function heroRibbon(w, h, phase, o = {}) {
  if (!state) {
    try {
      state = setup();
    } catch {
      state = { gl: null };
    }
  }
  const { gl, canvas } = state;
  if (!gl) return null;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform2f(state.size, w, h);
  gl.uniform1f(state.phase, phase);
  gl.uniform1f(state.intensity, o.intensity ?? 1);
  gl.uniform1f(state.zone, o.zone ?? 0);
  gl.uniform1f(state.amp, o.amp ?? 1);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  return canvas;
}

// The homepage's loop: one turn of the phase every 40 seconds.
export const heroPhase = (seconds) => ((seconds % 40) / 40) * Math.PI * 2;
