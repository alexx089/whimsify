// Real-time WebGL Shader Engine for Convex Mirror Fisheye Distortion

const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  uniform float u_flipY; // 1.0 for upside down, 0.0 for standard
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    // Convert clip coordinates (-1..1) to texture coordinates (0..1)
    // Flip horizontally so mirror feels natural like looking into a real mirror
    float xTex = 1.0 - (a_position.x * 0.5 + 0.5);
    float yTex = a_position.y * 0.5 + 0.5;
    if (u_flipY > 0.5) {
      yTex = 1.0 - yTex;
    }
    v_texCoord = vec2(xTex, yTex);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_distortion; // 0.0 (flat) to 1.0 (strong convex)
  uniform float u_aspect;
  uniform float u_showConvex; // 1.0 for convex mirror, 0.0 for flat
  varying vec2 v_texCoord;

  void main() {
    vec2 p = v_texCoord - vec2(0.5, 0.5);
    // Aspect ratio adjustment so distortion is circular
    p.x *= u_aspect;

    float r = length(p);

    // Circular mirror mask: smooth falloff at the mirror rim
    float rimRadius = 0.485;
    if (r > rimRadius) {
      // Outside the mirror border: soft antique dark brass vignette
      float outerFade = smoothstep(rimRadius, rimRadius + 0.015, r);
      gl_FragColor = mix(vec4(0.2, 0.17, 0.22, 1.0), vec4(0.0, 0.0, 0.0, 0.0), outerFade);
      return;
    }

    vec2 uv = v_texCoord;

    if (u_showConvex > 0.5 && u_distortion > 0.01) {
      // Realistic convex spherical mirror mapping
      // Fisheye bulge formula: center expands, outer edges compress
      float strength = u_distortion * 1.5;
      float theta = atan(p.y, p.x);
      
      // Spherical projection
      float r_distorted = r * (1.0 + strength * (r * r * 3.5));
      
      // Normalised coordinates back from polar
      vec2 p_dist = vec2(cos(theta), sin(theta)) * r_distorted;
      p_dist.x /= u_aspect;
      uv = vec2(0.5, 0.5) + p_dist;
    }

    // Clamp UV to texture boundaries
    uv = clamp(uv, vec2(0.001, 0.001), vec2(0.999, 0.999));

    // Sample color with subtle chromatic aberration for realistic glass optics
    vec4 color;
    if (u_showConvex > 0.5 && u_distortion > 0.1) {
      vec2 dir = normalize(v_texCoord - vec2(0.5, 0.5));
      float ca = 0.006 * u_distortion * (r / rimRadius);
      float rChannel = texture2D(u_image, clamp(uv + dir * ca, 0.001, 0.999)).r;
      float gChannel = texture2D(u_image, uv).g;
      float bChannel = texture2D(u_image, clamp(uv - dir * ca, 0.001, 0.999)).b;
      color = vec4(rChannel, gChannel, bChannel, 1.0);
    } else {
      color = texture2D(u_image, uv);
    }

    // Vintage convex mirror highlights:
    // 1. Edge vignette (subtle darkening towards the curved perimeter)
    float edgeVignette = smoothstep(rimRadius * 0.45, rimRadius, r);
    color.rgb *= (1.0 - edgeVignette * 0.28);

    // 2. Spherical reflection sheen (soft glossy crescent shine in upper-left)
    vec2 shineCenter = vec2(-0.25, 0.25);
    float shineDist = length(p - shineCenter);
    float glassShine = exp(-shineDist * shineDist * 16.0) * 0.22 * u_showConvex;
    color.rgb += vec3(glassShine * 0.95, glassShine * 0.92, glassShine);

    // 3. Subtle rim specular edge
    float rimShine = smoothstep(rimRadius - 0.035, rimRadius - 0.005, r) * 0.18;
    color.rgb += vec3(rimShine * 0.9, rimShine * 0.85, rimShine * 0.95);

    gl_FragColor = vec4(color.rgb, 1.0);
  }
`;

export class WebGLFisheyeRenderer {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private animationFrameId: number | null = null;
  private isDestroyed: boolean = false;

  private uDistortionLoc: WebGLUniformLocation | null = null;
  private uAspectLoc: WebGLUniformLocation | null = null;
  private uShowConvexLoc: WebGLUniformLocation | null = null;
  private uFlipYLoc: WebGLUniformLocation | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.initWebGL();
  }

  private initWebGL() {
    const gl = this.canvas.getContext('webgl', { preserveDrawingBuffer: true, alpha: true });
    if (!gl) {
      console.warn('WebGL not supported for convex mirror, falling back to 2D');
      return;
    }
    this.gl = gl;

    // Create shaders
    const vertShader = this.createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragShader = this.createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);

    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    this.program = program;
    gl.useProgram(program);

    // Uniform locations
    this.uDistortionLoc = gl.getUniformLocation(program, 'u_distortion');
    this.uAspectLoc = gl.getUniformLocation(program, 'u_aspect');
    this.uShowConvexLoc = gl.getUniformLocation(program, 'u_showConvex');
    this.uFlipYLoc = gl.getUniformLocation(program, 'u_flipY');

    // Quad geometry (2 triangles covering full screen)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPositionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    // Texture
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  private createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  public renderFrame(
    video: HTMLVideoElement,
    distortion: number = 0.75,
    isConvexActive: boolean = true,
    isUpsideDown: boolean = true
  ) {
    if (!this.gl || !this.program || !this.texture) return;
    const gl = this.gl;

    if (video.readyState < video.HAVE_CURRENT_DATA) return;

    // Adjust canvas resolution to match container square dimension
    const size = Math.min(this.canvas.clientWidth || 600, 800);
    if (this.canvas.width !== size || this.canvas.height !== size) {
      this.canvas.width = size;
      this.canvas.height = size;
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    gl.useProgram(this.program);

    // Bind texture with video current frame
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

    // Pass uniforms
    const aspect = video.videoWidth > 0 && video.videoHeight > 0 
      ? video.videoWidth / video.videoHeight 
      : 1.0;

    gl.uniform1f(this.uDistortionLoc, distortion);
    gl.uniform1f(this.uAspectLoc, aspect);
    gl.uniform1f(this.uShowConvexLoc, isConvexActive ? 1.0 : 0.0);
    gl.uniform1f(this.uFlipYLoc, isUpsideDown ? 1.0 : 0.0);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  public startLoop(
    video: HTMLVideoElement,
    getDistortion: () => number,
    getIsConvex: () => boolean,
    getIsUpsideDown: () => boolean = () => true
  ) {
    this.isDestroyed = false;
    const loop = () => {
      if (this.isDestroyed) return;
      this.renderFrame(video, getDistortion(), getIsConvex(), getIsUpsideDown());
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  public stopLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public destroy() {
    this.isDestroyed = true;
    this.stopLoop();
    if (this.gl && this.texture) {
      this.gl.deleteTexture(this.texture);
    }
    if (this.gl && this.positionBuffer) {
      this.gl.deleteBuffer(this.positionBuffer);
    }
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }
    this.gl = null;
  }
}
