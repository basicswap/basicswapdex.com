// The v0.19.0 release animation's ribbon shader (basicswap-blog
// .local/remotion-ribbon-v0190/src/shader.ts, mode 5), adapted for the site:
//
// - Draws light with alpha instead of onto a navy fill, so the page
//   background shows through and the same shader works in both themes.
// - Works from uv coordinates and the element's CSS size instead of
//   gl_FragCoord, so a drawing buffer smaller or larger than requested
//   cannot shift or crop the picture.
// - Adapts to any element size: 16:9 and wider elements get the original
//   framing exactly; narrower ones zoom in smoothly (see `unit`).
// - `zone` controls how much the centre is dimmed for the copy on top
//   (the original dims the release number the same way).
// - `amp` stretches the waves vertically for wide, short bands.
//
// The curve, strand count, colours, pulse and fresnel are unchanged. One
// fix: the type-zone pow() calls take abs() (see below). The strand loop is
// reorganised for speed (shared terms hoisted, far strands skipped); rendered
// side by side with the original, no pixel differs by a visible amount.

export const vertex = `#version 300 es
in vec2 position;
out vec2 uv;
void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;

export const fragment = `#version 300 es
precision highp float;
uniform vec2 size;
in vec2 uv;
uniform float phase;
uniform float intensity;
uniform float zone;
uniform float amp;
// The palette (ribbon-palettes.ts): the upper bank's colour, the lower
// bank's, the sparkle's tint, and how far each bank shades to the other.
uniform vec3 colA;
uniform vec3 colB;
uniform vec3 glint;
uniform float blend;
uniform float bloomScale;
out vec4 fragColor;
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
 vec3 light=colA*.022*centre;
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
 vec3 sparkle=mix(glint,vec3(1.),.75)*travelling*(.018+pulse*.08);
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
   float bloom=(exp(-d*85.)*.14+exp(-d*19.)*.018)*bloomScale;
   vec3 tint=mix(colA,colB,bank==0?f*blend:1.-blend+f*blend);
   float energy=energyBase+fresnel*.5;
   light+=tint*(core*.43+bloom)*energy;
   light+=sparkle*core;
  }
 }
 light+=mix(colA,colB,.5+.5*sin(phase))*centre*pulse*.10;
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

/** One loop: the release animation's 8 s, slowed 5x. Frame rate is unchanged
 *  (one frame per display refresh); only the motion per frame is smaller. */
export const LOOP_MS = 40_000;
