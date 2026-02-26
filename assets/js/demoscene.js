/*
 *  DEMOSCENE PORTFOLIO ENGINE v3 — CG Research Focus
 *
 *  5 unique fullscreen effects, one per section:
 *    PART 01  HYPERSPACE   — Star Wars-inspired warp streaks
 *    PART 02  RASTERIZER   — Primitives, ship & space transforms
 *    PART 03  TRON         — Neon grid landscape & light cycles
 *    PART 04  RAYTRACER    — SDF raymarched scene with lighting
 *    PART 05  SIGNAL       — Amiga demoscene (copper, plasma, checker)
 *
 *  Effects crossfade smoothly as you scroll between sections.
 */

(function () {
    'use strict';

    /* CONFIG */
    var CFG = {
        STAR_COUNT:   2000,
        STAR_SPREAD:  50.0,
        STAR_SPEED:   10.0,
        BALL_R:       2.0,
        BALL_SLICES:  24,
        BALL_STACKS:  16
    };

    /* STATE */
    var canvas, gl;
    var W = 1, H = 1, DPR = 1;
    var mouseX = 0.5, mouseY = 0.5;
    var startTime = 0;

    var partWeights = [1, 0, 0, 0, 0];
    var activePart = 0;

    var progBG;
    var progStar;
    var progWire;

    var quadBuf;
    var starBuf, starN;
    var ballVBuf, ballIBuf, ballIC, ballCBuf;
    var shipVBuf, shipIBuf, shipIC;

    /* MAT4 MINI-LIB */
    var m4 = {
        create: function () { return new Float32Array(16); },
        identity: function (o) {
            o[0]=1;o[1]=0;o[2]=0;o[3]=0;o[4]=0;o[5]=1;o[6]=0;o[7]=0;
            o[8]=0;o[9]=0;o[10]=1;o[11]=0;o[12]=0;o[13]=0;o[14]=0;o[15]=1;
            return o;
        },
        perspective: function (o, fov, asp, zn, zf) {
            var f=1/Math.tan(fov*.5), nf=1/(zn-zf);
            o[0]=f/asp;o[1]=0;o[2]=0;o[3]=0;o[4]=0;o[5]=f;o[6]=0;o[7]=0;
            o[8]=0;o[9]=0;o[10]=(zf+zn)*nf;o[11]=-1;o[12]=0;o[13]=0;o[14]=2*zf*zn*nf;o[15]=0;
            return o;
        },
        lookAt: function (o, eye, ctr, up) {
            var zx=eye[0]-ctr[0],zy=eye[1]-ctr[1],zz=eye[2]-ctr[2];
            var zl=1/Math.sqrt(zx*zx+zy*zy+zz*zz);zx*=zl;zy*=zl;zz*=zl;
            var xx=up[1]*zz-up[2]*zy,xy=up[2]*zx-up[0]*zz,xz=up[0]*zy-up[1]*zx;
            var xl=Math.sqrt(xx*xx+xy*xy+xz*xz);
            if(xl){xl=1/xl;xx*=xl;xy*=xl;xz*=xl;}
            var yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
            o[0]=xx;o[1]=yx;o[2]=zx;o[3]=0;o[4]=xy;o[5]=yy;o[6]=zy;o[7]=0;
            o[8]=xz;o[9]=yz;o[10]=zz;o[11]=0;
            o[12]=-(xx*eye[0]+xy*eye[1]+xz*eye[2]);
            o[13]=-(yx*eye[0]+yy*eye[1]+yz*eye[2]);
            o[14]=-(zx*eye[0]+zy*eye[1]+zz*eye[2]);o[15]=1;
            return o;
        },
        multiply: function (o, a, b) {
            var a00=a[0],a01=a[1],a02=a[2],a03=a[3],a10=a[4],a11=a[5],a12=a[6],a13=a[7],
                a20=a[8],a21=a[9],a22=a[10],a23=a[11],a30=a[12],a31=a[13],a32=a[14],a33=a[15];
            var b0,b1,b2,b3;
            b0=b[0];b1=b[1];b2=b[2];b3=b[3];
            o[0]=b0*a00+b1*a10+b2*a20+b3*a30;o[1]=b0*a01+b1*a11+b2*a21+b3*a31;
            o[2]=b0*a02+b1*a12+b2*a22+b3*a32;o[3]=b0*a03+b1*a13+b2*a23+b3*a33;
            b0=b[4];b1=b[5];b2=b[6];b3=b[7];
            o[4]=b0*a00+b1*a10+b2*a20+b3*a30;o[5]=b0*a01+b1*a11+b2*a21+b3*a31;
            o[6]=b0*a02+b1*a12+b2*a22+b3*a32;o[7]=b0*a03+b1*a13+b2*a23+b3*a33;
            b0=b[8];b1=b[9];b2=b[10];b3=b[11];
            o[8]=b0*a00+b1*a10+b2*a20+b3*a30;o[9]=b0*a01+b1*a11+b2*a21+b3*a31;
            o[10]=b0*a02+b1*a12+b2*a22+b3*a32;o[11]=b0*a03+b1*a13+b2*a23+b3*a33;
            b0=b[12];b1=b[13];b2=b[14];b3=b[15];
            o[12]=b0*a00+b1*a10+b2*a20+b3*a30;o[13]=b0*a01+b1*a11+b2*a21+b3*a31;
            o[14]=b0*a02+b1*a12+b2*a22+b3*a32;o[15]=b0*a03+b1*a13+b2*a23+b3*a33;
            return o;
        },
        rotateX: function(o,a,r){var s=Math.sin(r),c=Math.cos(r),a10=a[4],a11=a[5],a12=a[6],a13=a[7],a20=a[8],a21=a[9],a22=a[10],a23=a[11];
            if(a!==o){o[0]=a[0];o[1]=a[1];o[2]=a[2];o[3]=a[3];o[12]=a[12];o[13]=a[13];o[14]=a[14];o[15]=a[15];}
            o[4]=a10*c+a20*s;o[5]=a11*c+a21*s;o[6]=a12*c+a22*s;o[7]=a13*c+a23*s;
            o[8]=a20*c-a10*s;o[9]=a21*c-a11*s;o[10]=a22*c-a12*s;o[11]=a23*c-a13*s;return o;},
        rotateY: function(o,a,r){var s=Math.sin(r),c=Math.cos(r),a00=a[0],a01=a[1],a02=a[2],a03=a[3],a20=a[8],a21=a[9],a22=a[10],a23=a[11];
            if(a!==o){o[4]=a[4];o[5]=a[5];o[6]=a[6];o[7]=a[7];o[12]=a[12];o[13]=a[13];o[14]=a[14];o[15]=a[15];}
            o[0]=a00*c-a20*s;o[1]=a01*c-a21*s;o[2]=a02*c-a22*s;o[3]=a03*c-a23*s;
            o[8]=a00*s+a20*c;o[9]=a01*s+a21*c;o[10]=a02*s+a22*c;o[11]=a03*s+a23*c;return o;},
        rotateZ: function(o,a,r){var s=Math.sin(r),c=Math.cos(r),a00=a[0],a01=a[1],a02=a[2],a03=a[3],a10=a[4],a11=a[5],a12=a[6],a13=a[7];
            if(a!==o){o[8]=a[8];o[9]=a[9];o[10]=a[10];o[11]=a[11];o[12]=a[12];o[13]=a[13];o[14]=a[14];o[15]=a[15];}
            o[0]=a00*c+a10*s;o[1]=a01*c+a11*s;o[2]=a02*c+a12*s;o[3]=a03*c+a13*s;
            o[4]=a10*c-a00*s;o[5]=a11*c-a01*s;o[6]=a12*c-a02*s;o[7]=a13*c-a03*s;return o;}
    };
    var _proj=m4.create(),_view=m4.create(),_model=m4.create(),_mvp=m4.create(),_tmp=m4.create();

    /* GL HELPERS */
    function compileShader(type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error('Shader error:', gl.getShaderInfoLog(s)); gl.deleteShader(s); return null; }
        return s;
    }
    function linkProgram(vs, fs) {
        var v = compileShader(gl.VERTEX_SHADER, vs);
        var f = compileShader(gl.FRAGMENT_SHADER, fs);
        if (!v || !f) return null;
        var p = gl.createProgram();
        gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            console.error('Link error:', gl.getProgramInfoLog(p)); return null; }
        return p;
    }

    /* SHADERS */

    var BG_VS = [
        'attribute vec2 aPos;',
        'void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }'
    ].join('\n');

    /* Master background fragment shader — 5 CG-themed effects */
    var BG_FS = [
        'precision highp float;',
        'uniform float uTime;',
        'uniform vec2  uRes;',
        'uniform vec2  uMouse;',
        'uniform float w0, w1, w2, w3, w4;',
        '',
        '/* EFFECT 0: HYPERSPACE — Star Wars warp streaks */',
        'vec3 fxHyperspace(vec2 uv, vec2 p, float t){',
        '    float r = length(p);',
        '    float a = atan(p.y, p.x);',
        '    vec3 col = vec3(0.0);',
        '    for(float i = 0.0; i < 4.0; i++){',
        '        float scale = 15.0 + i * 12.0;',
        '        float seg = floor(a * scale / 6.28318);',
        '        float hash = fract(sin(seg * 127.1 + i * 43.7) * 43758.5);',
        '        float speed = 0.5 + hash * 2.0;',
        '        float streak = fract(r * 3.0 - t * speed + hash * 10.0);',
        '        streak = pow(streak, 12.0) * smoothstep(0.0, 0.15, r);',
        '        col += vec3(0.2 + i*0.1, 0.35 + i*0.08, 0.9) * streak * 0.28;',
        '    }',
        '    col += vec3(0.08, 0.15, 0.5) * exp(-r * 3.0);',
        '    col += vec3(0.01, 0.01, 0.05) * (1.0 - r * 0.4);',
        '    return col;',
        '}',
        '',
        '/* helpers for rasterizer */',
        'float dSeg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);return length(pa-ba*h);}',
        'vec2 rot2(vec2 v,float a){float s=sin(a),c=cos(a);return vec2(v.x*c-v.y*s,v.x*s+v.y*c);}',
        '',
        '/* EFFECT 1: RASTERIZER — primitives, ship & space transforms */',
        'vec3 fxRasterGrid(vec2 uv,vec2 p,float t){',
        '    vec3 col=vec3(0.0);',
        '    float gx=smoothstep(0.012,0.0,abs(fract(p.x*4.0)-0.5)-0.49);',
        '    float gy=smoothstep(0.012,0.0,abs(fract(p.y*4.0)-0.5)-0.49);',
        '    col+=vec3(0.0,0.04,0.07)*(gx+gy)*0.2;',
        '    col+=vec3(0.0,0.12,0.2)*smoothstep(0.003,0.0,abs(p.x))*0.15;',
        '    col+=vec3(0.0,0.2,0.12)*smoothstep(0.003,0.0,abs(p.y))*0.15;',
        '    float scanY=mod(t*0.3,2.4)-1.2;',
        '    col+=vec3(0.0,0.25,0.4)*smoothstep(0.008,0.0,abs(p.y-scanY))*0.3;',
        '    for(float i=0.0;i<7.0;i++){',
        '        float ph=i*0.897;',
        '        float ang=t*(0.25+i*0.08)+ph;',
        '        float sz=0.10+0.06*sin(t*0.4+i*1.1);',
        '        vec2 ctr=vec2(sin(t*0.18+ph*2.2)*(0.5+i*0.08),cos(t*0.14+ph*1.7)*(0.35+i*0.05));',
        '        vec2 v0=ctr+sz*rot2(vec2(0.0,1.0),ang);',
        '        vec2 v1=ctr+sz*rot2(vec2(0.866,-0.5),ang);',
        '        vec2 v2=ctr+sz*rot2(vec2(-0.866,-0.5),ang);',
        '        float d=min(min(dSeg(p,v0,v1),dSeg(p,v1,v2)),dSeg(p,v2,v0));',
        '        float hue=fract(i*0.143);',
        '        col+=vec3(0.05+hue*0.15,0.35+hue*0.25,0.7-hue*0.15)*smoothstep(0.003,0.0,d)*0.45;',
        '        float dots=smoothstep(0.012,0.0,length(p-v0))+smoothstep(0.012,0.0,length(p-v1))+smoothstep(0.012,0.0,length(p-v2));',
        '        col+=vec3(0.0,0.8,0.55)*dots*0.5;',
        '    }',
        '    vec2 sp=p;sp.y-=sin(t*0.25)*0.05;sp=rot2(sp,sin(t*0.12)*0.15);',
        '    vec2 ns=vec2(0.0,0.35);',
        '    vec2 cL=vec2(-0.08,0.15),cR=vec2(0.08,0.15),cB=vec2(0.0,0.1);',
        '    vec2 mL=vec2(-0.12,-0.05),mR=vec2(0.12,-0.05),mB=vec2(0.0,-0.1);',
        '    vec2 wL=vec2(-0.45,-0.02),wR=vec2(0.45,-0.02);',
        '    vec2 wLb=vec2(-0.35,-0.12),wRb=vec2(0.35,-0.12);',
        '    vec2 rL=vec2(-0.1,-0.25),rR=vec2(0.1,-0.25),rB=vec2(0.0,-0.3);',
        '    vec2 eL=vec2(-0.06,-0.35),eR=vec2(0.06,-0.35);',
        '    float sd=min(dSeg(sp,ns,cL),dSeg(sp,ns,cR));',
        '    sd=min(sd,dSeg(sp,cL,cR));sd=min(sd,dSeg(sp,cL,cB));sd=min(sd,dSeg(sp,cR,cB));',
        '    sd=min(sd,dSeg(sp,cL,mL));sd=min(sd,dSeg(sp,cR,mR));sd=min(sd,dSeg(sp,cB,mB));',
        '    sd=min(sd,dSeg(sp,mL,mR));sd=min(sd,dSeg(sp,mL,mB));sd=min(sd,dSeg(sp,mR,mB));',
        '    sd=min(sd,dSeg(sp,mL,wL));sd=min(sd,dSeg(sp,mR,wR));',
        '    sd=min(sd,dSeg(sp,wL,wLb));sd=min(sd,dSeg(sp,wR,wRb));',
        '    sd=min(sd,dSeg(sp,wLb,mL));sd=min(sd,dSeg(sp,wRb,mR));',
        '    sd=min(sd,dSeg(sp,mL,rL));sd=min(sd,dSeg(sp,mR,rR));sd=min(sd,dSeg(sp,mB,rB));',
        '    sd=min(sd,dSeg(sp,rL,rR));sd=min(sd,dSeg(sp,rL,rB));sd=min(sd,dSeg(sp,rR,rB));',
        '    sd=min(sd,dSeg(sp,rL,eL));sd=min(sd,dSeg(sp,rR,eR));',
        '    sd=min(sd,dSeg(sp,rB,eL));sd=min(sd,dSeg(sp,rB,eR));',
        '    col+=vec3(0.0,0.55,0.95)*smoothstep(0.003,0.0,sd)*0.65;',
        '    col+=vec3(0.0,0.2,0.35)*smoothstep(0.08,0.0,sd)*0.15;',
        '    float sv=smoothstep(0.012,0.0,length(sp-ns))+smoothstep(0.008,0.0,length(sp-wL))+smoothstep(0.008,0.0,length(sp-wR))+smoothstep(0.008,0.0,length(sp-eL))+smoothstep(0.008,0.0,length(sp-eR));',
        '    col+=vec3(0.0,0.9,0.7)*sv*0.6;',
        '    for(float i=0.0;i<15.0;i++){',
        '        vec2 pt=vec2(fract(sin(i*127.1)*43758.5)*2.2-1.1,fract(sin(i*269.3)*43758.5)*1.8-0.9);',
        '        pt+=0.08*vec2(sin(t*0.4+i*0.9),cos(t*0.3+i*0.6));',
        '        float d=length(p-pt);',
        '        float pulse=sin(t*1.5+i*2.1)*0.5+0.5;',
        '        col+=vec3(0.15,0.5,0.8)*smoothstep(0.006,0.0,d)*(0.2+0.3*pulse);',
        '        col+=vec3(0.05,0.15,0.25)*smoothstep(0.04,0.0,d)*0.1*pulse;',
        '    }',
        '    for(float i=0.0;i<12.0;i++){',
        '        float j=i+1.0;',
        '        vec2 pa=vec2(fract(sin(i*127.1)*43758.5)*2.2-1.1,fract(sin(i*269.3)*43758.5)*1.8-0.9)+0.08*vec2(sin(t*0.4+i*0.9),cos(t*0.3+i*0.6));',
        '        vec2 pb=vec2(fract(sin(j*127.1)*43758.5)*2.2-1.1,fract(sin(j*269.3)*43758.5)*1.8-0.9)+0.08*vec2(sin(t*0.4+j*0.9),cos(t*0.3+j*0.6));',
        '        float dl=dSeg(p,pa,pb);',
        '        float fade=smoothstep(0.7,0.2,length(pa-pb));',
        '        col+=vec3(0.05,0.2,0.4)*smoothstep(0.002,0.0,dl)*fade*0.25;',
        '    }',
        '    vec2 axO=vec2(-0.7,0.5);',
        '    float axA=t*0.4;',
        '    vec2 axX=axO+0.15*rot2(vec2(1.0,0.0),axA);',
        '    vec2 axY=axO+0.15*rot2(vec2(0.0,1.0),axA);',
        '    col+=vec3(0.8,0.1,0.1)*smoothstep(0.002,0.0,dSeg(p,axO,axX))*0.4;',
        '    col+=vec3(0.1,0.8,0.1)*smoothstep(0.002,0.0,dSeg(p,axO,axY))*0.4;',
        '    col+=vec3(0.9,0.9,0.9)*smoothstep(0.006,0.0,length(p-axO))*0.5;',
        '    return col;',
        '}',
        '',
        '/* SDF helpers for raymarcher */',
        'float sdSph(vec3 p, vec3 c, float r){ return length(p - c) - r; }',
        '',
        'float sceneMap(vec3 p, float t){',
        '    float s1 = sdSph(p, vec3(0.0, 0.0, 0.0), 1.0);',
        '    float s2 = sdSph(p, vec3(sin(t)*2.5, cos(t*0.7)*0.5, cos(t)*2.5), 0.7);',
        '    float s3 = sdSph(p, vec3(-sin(t*0.6)*2.0, sin(t*0.4)*0.8, -cos(t*0.8)*2.0), 0.45);',
        '    float fl = p.y + 1.5;',
        '    return min(min(min(s1, s2), s3), fl);',
        '}',
        '',
        'vec3 sceneNorm(vec3 p, float t){',
        '    vec2 e = vec2(0.005, 0.0);',
        '    return normalize(vec3(',
        '        sceneMap(p + e.xyy, t) - sceneMap(p - e.xyy, t),',
        '        sceneMap(p + e.yxy, t) - sceneMap(p - e.yxy, t),',
        '        sceneMap(p + e.yyx, t) - sceneMap(p - e.yyx, t)',
        '    ));',
        '}',
        '',
        '/* shade helper: returns (colour, normal, hitType) for a ray */',
        '/*   hitType: 0.0 = miss, 1.0 = sphere 1, 2.0 = sphere 2, 3.0 = sphere 3, 4.0 = floor */',
        'vec4 marchRay(vec3 ro, vec3 rd, float t, out vec3 hitN, out float hitType){',
        '    float d = 0.0;',
        '    hitType = 0.0;',
        '    hitN = vec3(0.0, 1.0, 0.0);',
        '    vec3 bg = vec3(0.02, 0.02, 0.06);',
        '    vec3 L  = normalize(vec3(2.0, 4.0, -2.0));',
        '    vec3 L2 = normalize(vec3(-3.0, 2.0, 1.0));',
        '    for(int i = 0; i < 80; i++){',
        '        vec3 pos = ro + rd * d;',
        '        float h = sceneMap(pos, t);',
        '        if(h < 0.003){',
        '            vec3 n = sceneNorm(pos, t);',
        '            hitN = n;',
        '            float diff  = max(dot(n, L), 0.0);',
        '            float diff2 = max(dot(n, L2), 0.0) * 0.25;',
        '            float spec  = pow(max(dot(reflect(-L, n), -rd), 0.0), 48.0);',
        '            float s1v = sdSph(pos, vec3(0.0), 1.0);',
        '            float s2v = sdSph(pos, vec3(sin(t)*2.5, cos(t*0.7)*0.5, cos(t)*2.5), 0.7);',
        '            float s3v = sdSph(pos, vec3(-sin(t*0.6)*2.0, sin(t*0.4)*0.8, -cos(t*0.8)*2.0), 0.45);',
        '            float flv = pos.y + 1.5;',
        '            vec3 mat;',
        '            if(s1v <= s2v && s1v <= s3v && s1v <= flv){',
        '                mat = vec3(0.0, 0.5, 1.0); hitType = 1.0;',
        '            } else if(s2v <= s3v && s2v <= flv){',
        '                mat = vec3(1.0, 0.35, 0.0); hitType = 2.0;',
        '            } else if(s3v <= flv){',
        '                mat = vec3(0.1, 0.9, 0.4); hitType = 3.0;',
        '            } else {',
        '                float ch = mod(floor(pos.x) + floor(pos.z + t*0.3), 2.0);',
        '                mat = mix(vec3(0.04, 0.04, 0.08), vec3(0.12, 0.12, 0.2), ch);',
        '                hitType = 4.0;',
        '            }',
        '            vec3 col = mat * (0.10 + 0.90 * diff + diff2) + vec3(0.7, 0.85, 1.0) * spec * 0.6;',
        '            col *= exp(-0.010 * d * d);',
        '            return vec4(col, d);',
        '        }',
        '        d += h;',
        '        if(d > 28.0) break;',
        '    }',
        '    return vec4(bg, -1.0);',
        '}',
        '',
        '/* Fresnel (Schlick approx) */',
        'float fresnelS(float cosA, float f0){ return f0 + (1.0 - f0) * pow(1.0 - cosA, 5.0); }',
        '',
        '/* EFFECT 2: RAYTRACER — reflective SDF scene */',
        'vec3 fxRaymarch(vec2 uv, vec2 p, float t){',
        '    vec3 ro = vec3(0.0, 0.5, -5.0);',
        '    vec3 rd = normalize(vec3(p.x, p.y - 0.05, 1.3));',
        '    vec3 hitN; float hitType;',
        '',
        '    /* primary ray */',
        '    vec4 hit = marchRay(ro, rd, t, hitN, hitType);',
        '    vec3 col = hit.rgb;',
        '',
        '    /* reflection bounce (spheres only: hitType 1-3) */',
        '    if(hit.w > 0.0 && hitType >= 1.0 && hitType <= 3.0){',
        '        vec3 hitPos = ro + rd * hit.w;',
        '        vec3 refDir = reflect(rd, hitN);',
        '        vec3 refOri = hitPos + hitN * 0.02;',
        '',
        '        /* Fresnel: glancing angles reflect more */',
        '        float cosA = max(dot(-rd, hitN), 0.0);',
        '        float fresnel = fresnelS(cosA, 0.04);',
        '        float reflectivity = 0.30 + 0.70 * fresnel;',
        '',
        '        /* secondary march */',
        '        vec3 rN2; float rT2;',
        '        vec4 ref = marchRay(refOri, refDir, t, rN2, rT2);',
        '        vec3 refCol = ref.rgb;',
        '',
        '        /* environment fallback for misses: subtle gradient */',
        '        if(ref.w < 0.0){',
        '            float sky = max(refDir.y, 0.0);',
        '            refCol = mix(vec3(0.02, 0.02, 0.06), vec3(0.05, 0.12, 0.25), sky);',
        '            refCol += vec3(0.0, 0.4, 0.8) * pow(sky, 4.0) * 0.15;',
        '        }',
        '',
        '        col = mix(col, refCol, reflectivity);',
        '        /* add specular highlight on top */',
        '        vec3 L = normalize(vec3(2.0, 4.0, -2.0));',
        '        float sp = pow(max(dot(reflect(-L, hitN), -rd), 0.0), 64.0);',
        '        col += vec3(0.8, 0.9, 1.0) * sp * 0.7;',
        '    }',
        '',
        '    return col * 0.7;',
        '}',
        '',
        '/* EFFECT 3: TRON — digital frontier */',
        'vec3 fxTronGrid(vec2 uv, vec2 p, float t){',
        '    vec3 col = vec3(0.005, 0.005, 0.02);',
        '    vec3 cA = vec3(0.0, 0.75, 1.0);',
        '    vec3 cB = vec3(1.0, 0.45, 0.0);',
        '    vec3 wh = vec3(0.7, 0.85, 1.0);',
        '    vec2 gp = vec2(p.x, p.y + 0.2);',
        '',
        '    /* infinite floor */',
        '    if(gp.y < 0.0){',
        '        float d = -0.3 / gp.y;',
        '        float wx = gp.x * d * 2.0;',
        '        float wz = d + t * 2.5;',
        '        float lx = abs(fract(wx) - 0.5);',
        '        float lz = abs(fract(wz * 0.4) - 0.5);',
        '        float gx = smoothstep(0.04*d, 0.0, lx) / (1.0+d*0.12);',
        '        float gz = smoothstep(0.04*d, 0.0, lz) / (1.0+d*0.12);',
        '        float fade = smoothstep(16.0, 1.0, d);',
        '        col += cA * (gx + gz) * 0.35 * fade;',
        '        float major = smoothstep(0.12*d, 0.0, abs(fract(wx*0.25)-0.5)-0.49) / (1.0+d*0.15);',
        '        major += smoothstep(0.12*d, 0.0, abs(fract(wz*0.1)-0.5)-0.49) / (1.0+d*0.15);',
        '        col += wh * major * 0.12 * fade;',
        '        float pulse = sin(wz * 0.5 - t * 3.0) * 0.5 + 0.5;',
        '        col += cA * gz * pulse * 0.08 * smoothstep(10.0, 2.0, d);',
        '        col += cA * 0.02 * fade * smoothstep(0.4, 0.0, lx) * smoothstep(0.4, 0.0, lz);',
        '    }',
        '',
        '    /* ceiling mirror */',
        '    if(gp.y > 0.4){',
        '        float cd = 0.15 / (gp.y - 0.4 + 0.001);',
        '        float cwx = gp.x * cd * 2.0;',
        '        float cwz = cd + t * 2.5;',
        '        float clx = abs(fract(cwx) - 0.5);',
        '        float clz = abs(fract(cwz * 0.4) - 0.5);',
        '        float cg = smoothstep(0.04*cd, 0.0, clx) / (1.0+cd*0.15);',
        '        cg += smoothstep(0.04*cd, 0.0, clz) / (1.0+cd*0.15);',
        '        col += cA * cg * 0.06 * smoothstep(12.0, 1.0, cd);',
        '    }',
        '',
        '    /* horizon line */',
        '    float hz = exp(-abs(gp.y) * 18.0);',
        '    col += cA * hz * 0.5;',
        '    col += wh * exp(-abs(gp.y) * 40.0) * 0.2;',
        '',
        '    /* architecture: distant tower blocks */',
        '    for(float i = 0.0; i < 14.0; i++){',
        '        float xp = fract(sin(i*73.13)*43758.5) * 3.2 - 1.6;',
        '        float w = 0.006 + fract(sin(i*127.3)*43758.5) * 0.025;',
        '        float h = 0.03 + fract(sin(i*317.7)*43758.5) * 0.28;',
        '        float bx = smoothstep(w, w-0.002, abs(gp.x - xp));',
        '        float by = step(0.0, gp.y) * step(gp.y, h);',
        '        float tower = bx * by;',
        '        col += cA * tower * 0.04;',
        '        float edgeL = smoothstep(0.003, 0.0, abs(abs(gp.x-xp)-w));',
        '        float edgeT = smoothstep(0.003, 0.0, abs(gp.y - h)) * step(abs(gp.x-xp), w);',
        '        col += cA * (edgeL * by + edgeT) * 0.35;',
        '        float winGrid = step(0.4, fract(gp.y * 35.0)) * step(0.3, fract((gp.x-xp+w)*80.0));',
        '        float winFlicker = step(0.65, fract(sin(i*53.1 + floor(gp.y*35.0)*7.1 + floor(t*1.5))*43758.5));',
        '        col += cA * tower * winGrid * winFlicker * 0.12;',
        '    }',
        '',
        '    /* identity disc (rotating ring) */',
        '    vec2 dc = vec2(0.55, 0.25);',
        '    float dr = length(p - dc);',
        '    float discRing = smoothstep(0.003, 0.0, abs(dr - 0.12));',
        '    discRing += smoothstep(0.002, 0.0, abs(dr - 0.10)) * 0.6;',
        '    discRing += smoothstep(0.002, 0.0, abs(dr - 0.08)) * 0.3;',
        '    float da = atan(p.y-dc.y, p.x-dc.x);',
        '    float seg = step(0.3, fract(da*3.0/6.28318 + t*0.5));',
        '    col += cB * discRing * seg * 0.7;',
        '    col += cB * 0.08 * exp(-dr * 12.0);',
        '',
        '    /* data streams (vertical lines of bits) */',
        '    for(float i = 0.0; i < 8.0; i++){',
        '        float sx = fract(sin(i*213.7)*43758.5) * 2.4 - 1.2;',
        '        float streamX = smoothstep(0.003, 0.0, abs(p.x - sx));',
        '        float bit = step(0.5, fract(sin(floor((p.y+t*(0.8+i*0.15))*12.0)*127.1+i*43.7)*43758.5));',
        '        float yFade = smoothstep(-0.8, 0.8, p.y);',
        '        col += cA * streamX * bit * 0.08 * (1.0 - yFade);',
        '    }',
        '',
        '    /* circuit traces on floor */',
        '    if(gp.y < 0.0){',
        '        float d = -0.3 / gp.y;',
        '        float wx = gp.x * d * 2.0;',
        '        float wz = d + t * 2.5;',
        '        float fade = smoothstep(10.0, 1.5, d);',
        '        for(float i = 0.0; i < 3.0; i++){',
        '            float lane = fract(sin(i*97.3)*43758.5)*4.0 - 2.0;',
        '            float dist = abs(wx - lane);',
        '            float trace = smoothstep(0.06*d, 0.0, dist) / (1.0+d*0.2);',
        '            float energy = sin(wz*1.5 - t*5.0 + i*2.0)*0.5+0.5;',
        '            vec3 tc = (mod(i,2.0)<0.5) ? cA : cB;',
        '            col += tc * trace * energy * 0.2 * fade;',
        '        }',
        '    }',
        '',
        '    /* light cycle trails */',
        '    for(float i = 0.0; i < 3.0; i++){',
        '        float ly = -0.18 - i*0.06;',
        '        float sp = 1.0 + i*0.5;',
        '        float hx = sin(t*sp*0.3 + i*2.5)*0.5;',
        '        float tLen = 0.35;',
        '        float dy = abs(p.y - ly);',
        '        float mask = smoothstep(0.004, 0.0, dy);',
        '        float trail = smoothstep(hx-tLen, hx, p.x) * step(p.x, hx);',
        '        vec3 tc = (mod(i,2.0)<0.5) ? cA : cB;',
        '        col += tc * mask * trail * 0.4;',
        '        col += tc * smoothstep(0.015, 0.0, length(p-vec2(hx,ly))) * 1.5;',
        '        col += wh * smoothstep(0.006, 0.0, length(p-vec2(hx,ly))) * 0.6;',
        '    }',
        '',
        '    /* centre vanishing line */',
        '    col += cA * smoothstep(0.002, 0.0, abs(p.x)) * smoothstep(0.0, -0.5, gp.y) * 0.1;',
        '',
        '    /* subtle scanlines */',
        '    col *= 0.92 + 0.08 * step(0.5, fract(gl_FragCoord.y * 0.5));',
        '',
        '    return col;',
        '}',
        '',
        '/* EFFECT 4: AMIGA DEMOSCENE — copper bars, starfield, checker, plasma */',
        'vec3 fxSignal(vec2 uv, vec2 p, float t){',
        '    vec3 col = vec3(0.0);',
        '',
        '    /* copper bars: horizontal gradient bands */',
        '    float cy = p.y * 6.0 + t * 1.5;',
        '    for(float i = 0.0; i < 8.0; i++){',
        '        float off = sin(t * 0.8 + i * 0.9) * 0.6;',
        '        float bPos = sin(cy + i * 0.78 + off) * 0.5 + 0.5;',
        '        float bar = smoothstep(0.12, 0.0, abs(fract(p.y * 3.0 + i * 0.125 + sin(t + i) * 0.1) - 0.5) - 0.35);',
        '        float hue = fract(i * 0.125 + t * 0.05);',
        '        vec3 cCol = 0.5 + 0.5 * cos(6.2832 * (hue + vec3(0.0, 0.33, 0.67)));',
        '        col += cCol * bar * bPos * 0.10;',
        '    }',
        '',
        '    /* moving starfield */',
        '    for(float i = 0.0; i < 80.0; i++){',
        '        float sx = fract(sin(i * 127.1) * 43758.5);',
        '        float sy = fract(sin(i * 269.3) * 43758.5);',
        '        float sz = fract(sin(i * 419.7) * 43758.5) * 0.5 + 0.5;',
        '        float speed = sz * 1.2 + 0.3;',
        '        sx = fract(sx + t * speed * 0.08) * 2.4 - 1.2;',
        '        sy = sy * 2.0 - 1.0;',
        '        float bright = sz * sz;',
        '        float dist = length(p - vec2(sx, sy));',
        '        float star = smoothstep(0.008 * sz + 0.002, 0.0, dist);',
        '        float twinkle = sin(t * 3.0 + i * 7.7) * 0.3 + 0.7;',
        '        col += vec3(0.7, 0.8, 1.0) * star * bright * twinkle;',
        '    }',
        '',
        '    /* plasma layer (classic Amiga copper+plasma) */',
        '    float px = p.x * 4.0;',
        '    float py = p.y * 4.0;',
        '    float v = sin(px + t);',
        '    v += sin(py + t * 0.7);',
        '    v += sin((px + py + t) * 0.7);',
        '    v += sin(sqrt(px*px + py*py + 1.0) * 1.5 - t * 0.8);',
        '    v *= 0.25;',
        '    vec3 plasma = 0.5 + 0.5 * cos(3.14159 * v + vec3(0.0, 0.5, 1.0) + t * 0.2);',
        '    col += plasma * 0.08;',
        '',
        '    /* bouncing checkerboard plane */',
        '    float planeY = -0.35 + sin(t * 0.6) * 0.15;',
        '    if(p.y < planeY){',
        '        float d = (planeY - p.y) * 8.0;',
        '        float wx = p.x * d * 2.0;',
        '        float wz = d + t * 1.5;',
        '        float checker = mod(floor(wx) + floor(wz), 2.0);',
        '        vec3 cFloor = mix(vec3(0.04, 0.02, 0.12), vec3(0.25, 0.12, 0.35), checker);',
        '        float fade = smoothstep(18.0, 1.0, d);',
        '        col += cFloor * fade * 0.4;',
        '        float glx = smoothstep(0.06 * d, 0.0, abs(fract(wx) - 0.5) - 0.46);',
        '        float glz = smoothstep(0.06 * d, 0.0, abs(fract(wz) - 0.5) - 0.46);',
        '        col += vec3(0.4, 0.2, 0.7) * (glx + glz) * 0.06 * fade;',
        '    }',
        '',
        '    /* sine-wave raster bars (thick neon bands) */',
        '    for(float i = 0.0; i < 5.0; i++){',
        '        float yy = sin(t * (0.9 + i * 0.3) + i * 1.2) * 0.35;',
        '        float barD = abs(p.y - yy);',
        '        float bar = smoothstep(0.04, 0.0, barD);',
        '        float glow = smoothstep(0.18, 0.0, barD);',
        '        float hue = fract(i * 0.2 + t * 0.03);',
        '        vec3 bCol = 0.5 + 0.5 * cos(6.2832 * (hue + vec3(0.0, 0.33, 0.67)));',
        '        col += bCol * bar * 0.5;',
        '        col += bCol * glow * 0.08;',
        '    }',
        '',
        '    /* vertical scroll-text columns (simulated pixel blocks) */',
        '    for(float i = 0.0; i < 16.0; i++){',
        '        float xp = (i / 16.0) * 2.4 - 1.2;',
        '        float scroll = fract(t * 0.4 + i * 0.0625);',
        '        float yp = scroll * 2.6 - 1.3;',
        '        float bx = step(abs(p.x - xp), 0.03);',
        '        float by = step(abs(p.y - yp), 0.015);',
        '        float on = step(0.5, fract(sin(i * 73.1 + floor(t * 2.0 + i)) * 43758.5));',
        '        col += vec3(0.0, 0.7, 1.0) * bx * by * on * 0.3;',
        '    }',
        '',
        '    /* CRT scanlines + vignette */',
        '    float scan = 0.88 + 0.12 * sin(uv.y * 800.0);',
        '    col *= scan;',
        '    col *= 1.0 - 0.25 * pow(length(p) * 0.7, 2.0);',
        '',
        '    return col;',
        '}',
        '',
        'void main(){',
        '    vec2 uv = gl_FragCoord.xy / uRes;',
        '    vec2 p  = (gl_FragCoord.xy - 0.5*uRes) / min(uRes.x, uRes.y);',
        '    float t = uTime;',
        '    vec3 col = vec3(0.0);',
        '    if(w0 > 0.001) col += fxHyperspace(uv, p, t) * w0;',
        '    if(w1 > 0.001) col += fxRasterGrid(uv, p, t) * w1;',
        '    if(w2 > 0.001) col += fxTronGrid(uv, p, t) * w2;',
        '    if(w3 > 0.001) col += fxRaymarch(uv, p, t) * w3;',
        '    if(w4 > 0.001) col += fxSignal(uv, p, t) * w4;',
        '    col *= 1.0 - 0.35 * length(uv - 0.5);',
        '    gl_FragColor = vec4(col, 1.0);',
        '}'
    ].join('\n');

    /* STARFIELD POINTS (hyperspace warp) */
    var STAR_VS = [
        'attribute vec3 aPos;',
        'uniform mat4 uVP;',
        'uniform float uTime, uSpeed, uSpread;',
        'varying float vBright;',
        'void main(){',
        '    vec3 p = aPos;',
        '    p.z = mod(p.z - uTime*uSpeed, uSpread) - uSpread*0.5;',
        '    gl_Position = uVP * vec4(p, 1.0);',
        '    float depth = clamp(-p.z, 0.5, uSpread*0.5);',
        '    gl_PointSize = clamp(300.0/depth, 1.0, 10.0);',
        '    vBright = 1.0 - smoothstep(1.0, uSpread*0.5, depth);',
        '}'
    ].join('\n');
    var STAR_FS = [
        'precision highp float;',
        'varying float vBright;',
        'uniform float uAlpha;',
        'void main(){',
        '    vec2 c = gl_PointCoord - 0.5;',
        '    float d = length(c);',
        '    if(d > 0.5) discard;',
        '    float a = smoothstep(0.5, 0.0, d) * vBright * uAlpha;',
        '    vec3 col = mix(vec3(0.4, 0.6, 1.0), vec3(0.9, 0.95, 1.0), vBright);',
        '    gl_FragColor = vec4(col, a);',
        '}'
    ].join('\n');

    /* AMIGA BOUNCING BALL */
    var WIRE_VS = [
        'attribute vec3 aPos;',
        'attribute vec3 aCol;',
        'uniform mat4 uMVP;',
        'varying vec3 vCol;',
        'varying vec3 vN;',
        'void main(){',
        '    vCol = aCol;',
        '    vN = normalize(aPos);',
        '    gl_Position = uMVP * vec4(aPos, 1.0);',
        '}'
    ].join('\n');
    var WIRE_FS = [
        'precision highp float;',
        'varying vec3 vCol;',
        'varying vec3 vN;',
        'uniform float uTime, uAlpha;',
        'void main(){',
        '    vec3 L = normalize(vec3(0.5, 1.0, -0.3));',
        '    float diff = max(dot(vN, L), 0.0);',
        '    float amb = 0.25;',
        '    vec3 col = vCol * (amb + 0.75 * diff);',
        '    float rim = pow(1.0 - max(dot(vN, vec3(0.0, 0.0, 1.0)), 0.0), 2.0);',
        '    col += vec3(0.3, 0.3, 0.4) * rim * 0.3;',
        '    float spec = pow(max(dot(reflect(-L, vN), vec3(0.0, 0.0, 1.0)), 0.0), 24.0);',
        '    col += vec3(1.0) * spec * 0.35;',
        '    gl_FragColor = vec4(col, uAlpha * 0.85);',
        '}'
    ].join('\n');

    /* GEOMETRY */
    function makeQuad() {
        var d = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
        var b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
        return b;
    }
    function makeStars(n, spread) {
        var p = new Float32Array(n*3);
        for (var i=0;i<n;i++){p[i*3]=(Math.random()-.5)*spread;p[i*3+1]=(Math.random()-.5)*spread;p[i*3+2]=(Math.random()-.5)*spread;}
        var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,p,gl.STATIC_DRAW);
        return {buf:b, count:n};
    }
    function makeAmigaBall(R, slices, stacks) {
        var v = [], c = [], idx = [];
        var stride = slices + 1;
        /* build UV sphere vertices + checker colours */
        for (var i = 0; i <= stacks; i++) {
            var phi = Math.PI * i / stacks;
            var sp = Math.sin(phi), cp = Math.cos(phi);
            for (var j = 0; j <= slices; j++) {
                var theta = 2.0 * Math.PI * j / slices;
                var st = Math.sin(theta), ct = Math.cos(theta);
                v.push(R * sp * ct, R * cp, R * sp * st);
                /* Amiga checker: alternating red & white bands */
                var ci = Math.floor(i * 8.0 / stacks);
                var cj = Math.floor(j * 8.0 / slices);
                var isRed = (ci + cj) % 2 === 0;
                if (isRed) { c.push(0.85, 0.08, 0.08); }
                else       { c.push(0.95, 0.95, 0.95); }
            }
        }
        /* wireframe + triangle indices (using TRIANGLES) */
        for (var i = 0; i < stacks; i++) {
            for (var j = 0; j < slices; j++) {
                var a = i * stride + j;
                var b = a + stride;
                idx.push(a, b, a + 1);
                idx.push(a + 1, b, b + 1);
            }
        }
        var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
        var cb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cb);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(c), gl.STATIC_DRAW);
        var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
        return { vb: vb, cb: cb, ib: ib, count: idx.length };
    }
    function makeShip() {
        var v = [
            0.0, 0.0,-3.0,          // 0 nose
           -0.3, 0.15,-1.5,         // 1 fwd-top-left
            0.3, 0.15,-1.5,         // 2 fwd-top-right
            0.0,-0.2,-1.5,          // 3 fwd-bottom
           -0.4, 0.15, 0.0,         // 4 mid-top-left
            0.4, 0.15, 0.0,         // 5 mid-top-right
            0.0,-0.25, 0.0,         // 6 mid-bottom
           -2.0,-0.05, 0.3,         // 7 left-wing-tip
            2.0,-0.05, 0.3,         // 8 right-wing-tip
           -0.35, 0.15, 1.5,        // 9 rear-top-left
            0.35, 0.15, 1.5,        //10 rear-top-right
            0.0,-0.2, 1.5,          //11 rear-bottom
            0.0, 0.7, 1.0,          //12 tail-fin-top
           -0.2, 0.0, 2.0,          //13 engine-left
            0.2, 0.0, 2.0,          //14 engine-right
            0.0,-0.15, 2.0          //15 engine-bottom
        ];
        var idx = [
            0,1, 0,2, 0,3,          // nose
            1,2, 2,3, 3,1,          // fwd ring
            1,4, 2,5, 3,6,          // fwd→mid
            4,5, 5,6, 6,4,          // mid ring
            4,7, 5,8, 7,9, 8,10,   // wings
            6,7, 6,8,               // wing underside
            4,9, 5,10, 6,11,        // mid→rear
            9,10, 10,11, 11,9,      // rear ring
            4,12, 5,12, 12,9, 12,10,// tail fin
            9,13, 10,14, 11,15,     // engines
            13,14, 14,15, 15,13     // engine ring
        ];
        var vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.STATIC_DRAW);
        var ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);
        return {vb:vb,ib:ib,count:idx.length};
    }

    /* SECTION TRACKING — compute part weights */
    var demoParts = [];

    function computePartWeights() {
        var wh = window.innerHeight;
        var best = -1, bestVal = -1;
        for (var i = 0; i < demoParts.length; i++) {
            var rect = demoParts[i].getBoundingClientRect();
            var top = Math.max(rect.top, 0);
            var bot = Math.min(rect.bottom, wh);
            var vis = Math.max(0, bot - top) / wh;
            partWeights[i] = vis;
            if (vis > bestVal) { bestVal = vis; best = i; }
        }
        var sum = 0;
        for (var i = 0; i < partWeights.length; i++) sum += partWeights[i];
        if (sum > 0) for (var i = 0; i < partWeights.length; i++) partWeights[i] /= sum;

        if (best !== activePart && best >= 0) {
            activePart = best;
            updatePartUI(best);
        }
    }

    function updatePartUI(idx) {
        var dots = document.querySelectorAll('.part-dot');
        for (var i = 0; i < dots.length; i++) {
            dots[i].classList.toggle('active', i === idx);
        }
        var section = demoParts[idx];
        if (section) {
            var numEl = document.getElementById('part-num');
            var nameEl = document.getElementById('part-name');
            if (numEl) numEl.textContent = 'PART ' + section.getAttribute('data-part-num');
            if (nameEl) nameEl.textContent = section.getAttribute('data-part-name');
        }
        var navLinks = document.querySelectorAll('.nav-links a');
        for (var i = 0; i < navLinks.length; i++) {
            navLinks[i].classList.toggle('active-link', i === idx);
        }
    }

    /* RENDER PASSES */

    function renderBackground(time) {
        gl.useProgram(progBG);
        gl.uniform1f(gl.getUniformLocation(progBG, 'uTime'), time);
        gl.uniform2f(gl.getUniformLocation(progBG, 'uRes'), W*DPR, H*DPR);
        gl.uniform2f(gl.getUniformLocation(progBG, 'uMouse'), mouseX, mouseY);
        gl.uniform1f(gl.getUniformLocation(progBG, 'w0'), partWeights[0]);
        gl.uniform1f(gl.getUniformLocation(progBG, 'w1'), partWeights[1]);
        gl.uniform1f(gl.getUniformLocation(progBG, 'w2'), partWeights[2]);
        gl.uniform1f(gl.getUniformLocation(progBG, 'w3'), partWeights[3]);
        gl.uniform1f(gl.getUniformLocation(progBG, 'w4'), partWeights[4]);
        var aPos = gl.getAttribLocation(progBG, 'aPos');
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.disableVertexAttribArray(aPos);
    }

    function renderStarfield(time) {
        var alpha = partWeights[0];
        if (alpha < 0.01) return;

        var px = (mouseX - 0.5) * 1.0;
        var py = (mouseY - 0.5) * 0.8;
        m4.perspective(_proj, 1.0, W/H, 0.1, 100);
        m4.lookAt(_view, [px, py, 5], [0,0,0], [0,1,0]);
        m4.multiply(_tmp, _proj, _view);

        gl.useProgram(progStar);
        gl.uniformMatrix4fv(gl.getUniformLocation(progStar,'uVP'), false, _tmp);
        gl.uniform1f(gl.getUniformLocation(progStar,'uTime'), time);
        gl.uniform1f(gl.getUniformLocation(progStar,'uSpeed'), CFG.STAR_SPEED);
        gl.uniform1f(gl.getUniformLocation(progStar,'uSpread'), CFG.STAR_SPREAD);
        gl.uniform1f(gl.getUniformLocation(progStar,'uAlpha'), alpha);

        var aPos = gl.getAttribLocation(progStar,'aPos');
        gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.POINTS, 0, starN);
        gl.disableVertexAttribArray(aPos);
    }

    function renderShip(time) {
        var alpha = partWeights[1];
        if (alpha < 0.02) return;

        m4.perspective(_proj, 0.9, W/H, 0.1, 100);
        m4.lookAt(_view, [0,1.5,8], [0,0,0], [0,1,0]);
        m4.identity(_model);
        m4.rotateY(_model, _model, time*0.25);
        m4.rotateX(_model, _model, Math.sin(time*0.15)*0.4+0.2);
        m4.rotateZ(_model, _model, Math.sin(time*0.1)*0.15);
        m4.multiply(_tmp, _proj, _view);
        m4.multiply(_mvp, _tmp, _model);

        gl.useProgram(progWire);
        gl.uniformMatrix4fv(gl.getUniformLocation(progWire,'uMVP'), false, _mvp);
        gl.uniform1f(gl.getUniformLocation(progWire,'uTime'), time);
        gl.uniform1f(gl.getUniformLocation(progWire,'uAlpha'), alpha);

        var aPos = gl.getAttribLocation(progWire,'aPos');
        gl.bindBuffer(gl.ARRAY_BUFFER, shipVBuf);
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shipIBuf);
        gl.drawElements(gl.LINES, shipIC, gl.UNSIGNED_SHORT, 0);
        gl.disableVertexAttribArray(aPos);
    }

    function renderAmigaBall(time) {
        var alpha = partWeights[4];
        if (alpha < 0.02) return;

        /* bouncing: abs(sin) for bounce, slight horizontal sway */
        var bounceY = Math.abs(Math.sin(time * 1.8)) * 2.5 - 0.5;
        var swayX   = Math.sin(time * 0.5) * 2.0;

        m4.perspective(_proj, 0.9, W/H, 0.1, 100);
        m4.lookAt(_view, [0, 0.5, 8], [0, 0, 0], [0, 1, 0]);
        m4.identity(_model);
        /* translate to bouncing position */
        var tMat = m4.create(); m4.identity(tMat);
        tMat[12] = swayX; tMat[13] = bounceY; tMat[14] = 0;
        m4.multiply(_model, tMat, _model);
        /* classic Amiga tilt + spin */
        m4.rotateZ(_model, _model, -0.25);
        m4.rotateY(_model, _model, time * 1.2);
        m4.rotateX(_model, _model, -0.15);
        m4.multiply(_tmp, _proj, _view);
        m4.multiply(_mvp, _tmp, _model);

        gl.useProgram(progWire);
        gl.uniformMatrix4fv(gl.getUniformLocation(progWire, 'uMVP'), false, _mvp);
        gl.uniform1f(gl.getUniformLocation(progWire, 'uTime'), time);
        gl.uniform1f(gl.getUniformLocation(progWire, 'uAlpha'), alpha);

        var aPos = gl.getAttribLocation(progWire, 'aPos');
        var aCol = gl.getAttribLocation(progWire, 'aCol');

        gl.bindBuffer(gl.ARRAY_BUFFER, ballVBuf);
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, ballCBuf);
        gl.enableVertexAttribArray(aCol);
        gl.vertexAttribPointer(aCol, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ballIBuf);
        gl.drawElements(gl.TRIANGLES, ballIC, gl.UNSIGNED_SHORT, 0);

        gl.disableVertexAttribArray(aPos);
        gl.disableVertexAttribArray(aCol);
    }

    /* MAIN LOOP */
    var prevT = 0;
    function frame(ts) {
        requestAnimationFrame(frame);
        var time = (ts - startTime) * 0.001;
        var dt = Math.min(time - prevT, 0.05);
        prevT = time;

        computePartWeights();

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0.02, 0.02, 0.04, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.disable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        renderBackground(time);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        renderStarfield(time);
        renderShip(time);
        renderAmigaBall(time);

        gl.disable(gl.BLEND);
    }

    /* RESIZE */
    function resize() {
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth; H = window.innerHeight;
        canvas.width = W*DPR; canvas.height = H*DPR;
        canvas.style.width = W+'px'; canvas.style.height = H+'px';
    }

    /* SCROLL, REVEAL, SKILLS */
    function onScroll() {
        var els = document.querySelectorAll('.reveal');
        for (var i=0; i<els.length; i++) {
            if (els[i].getBoundingClientRect().top < window.innerHeight * 0.88)
                els[i].classList.add('visible');
        }
        var fills = document.querySelectorAll('.skill-fill');
        for (var i=0; i<fills.length; i++) {
            if (fills[i].getBoundingClientRect().top < window.innerHeight * 0.92) {
                var w = fills[i].getAttribute('data-width');
                if (w) fills[i].style.width = w + '%';
            }
        }
    }

    /* LOADING SCREEN */
    function runBoot() {
        return new Promise(function (resolve) {
            var bootEl = document.getElementById('boot-text');
            var barEl  = document.getElementById('loading-bar');
            var statEl = document.getElementById('loading-status');
            if (!bootEl) { resolve(); return; }
            var lines = [
                'AKNAVJ://RENDER — Graphics Core v3.0',
                '(c) Ondrej Vanka',
                '',
                'GPU     : WebGL ' + (gl ? (gl.getParameter(gl.VERSION)||'1.0') : 'N/A'),
                'DISPLAY : ' + W + 'x' + H + ' @ 60Hz',
                '',
                'Mounting render modules...',
                '> Module 01 [HYPERSPACE]  ... OK',
                '> Module 02 [RASTERIZER]  ... OK',
                '> Module 03 [TRON]        ... OK',
                '> Module 04 [RAYTRACER]   ... OK',
                '> Module 05 [DEMOSCENE]   ... OK',
                '',
                'All systems nominal. Commencing render loop...'
            ];
            var idx = 0;
            function next() {
                if (idx < lines.length) {
                    bootEl.textContent += lines[idx] + '\n';
                    idx++;
                    var pct = Math.min(95, (idx/lines.length)*95);
                    barEl.style.width = pct+'%';
                    statEl.textContent = Math.round(pct)+'%';
                    setTimeout(next, 50 + Math.random()*40);
                } else {
                    barEl.style.width = '100%';
                    statEl.textContent = 'ONLINE';
                    setTimeout(function () {
                        var s = document.getElementById('loading-screen');
                        if (s) s.classList.add('fade-out');
                        setTimeout(resolve, 800);
                    }, 300);
                }
            }
            next();
        });
    }

    /* NAV */
    function initNav() {
        var toggle = document.getElementById('nav-toggle');
        var links  = document.getElementById('nav-links');
        if (!toggle || !links) return;
        toggle.addEventListener('click', function(){ links.classList.toggle('open'); });
        var anchors = links.querySelectorAll('a');
        for (var i=0; i<anchors.length; i++)
            anchors[i].addEventListener('click', function(){ links.classList.remove('open'); });

        var lastY = 0, nav = document.getElementById('main-nav');
        window.addEventListener('scroll', function(){
            var y = window.pageYOffset;
            nav.style.transform = (y > lastY && y > 150) ? 'translateY(-100%)' : 'translateY(0)';
            lastY = y;
        });
    }
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function(a){
            a.addEventListener('click', function(e){
                var t = document.querySelector(this.getAttribute('href'));
                if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});}
            });
        });
    }

    /* INIT */
    function init() {
        canvas = document.getElementById('demoscene-canvas');
        if (!canvas) return;
        gl = canvas.getContext('webgl',{alpha:false,antialias:false})
          || canvas.getContext('experimental-webgl',{alpha:false,antialias:false});
        if (!gl) { document.getElementById('loading-screen').classList.add('fade-out'); return; }

        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', function(e){ mouseX=e.clientX/W; mouseY=e.clientY/H; });
        window.addEventListener('scroll', onScroll, {passive:true});
        onScroll();

        demoParts = Array.prototype.slice.call(document.querySelectorAll('.demo-part'));

        progBG    = linkProgram(BG_VS, BG_FS);
        progStar  = linkProgram(STAR_VS, STAR_FS);
        progWire  = linkProgram(WIRE_VS, WIRE_FS);

        quadBuf = makeQuad();
        var sf = makeStars(CFG.STAR_COUNT, CFG.STAR_SPREAD);
        starBuf = sf.buf; starN = sf.count;
        var ball = makeAmigaBall(CFG.BALL_R, CFG.BALL_SLICES, CFG.BALL_STACKS);
        ballVBuf=ball.vb; ballCBuf=ball.cb; ballIBuf=ball.ib; ballIC=ball.count;
        var sh = makeShip();
        shipVBuf=sh.vb; shipIBuf=sh.ib; shipIC=sh.count;

        initNav();
        initSmoothScroll();

        runBoot().then(function(){
            startTime = performance.now();
            requestAnimationFrame(frame);
        });
    }

    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init);
    else init();
})();
