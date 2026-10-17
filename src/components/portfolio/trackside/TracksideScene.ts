import * as T from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import {
  smoothstep,
  startLights,
  trackModel,
  tracksidePose,
  type DriveFrame,
} from "@/lib/trackside";
import { createFormulaCar } from "./FormulaCar";
import { ribbon } from "./builder";
import { createForest } from "./forest";
import { createSurface } from "./surface";
import { createGround } from "./terrain";
import { canvasTexture } from "./textures";
import { createVenue } from "./venue";

export interface TracksideRenderer {
  draw: (frame: DriveFrame) => { x: number; y: number };
  dispose: () => void;
}

/** Day is a bright Ardennes afternoon; night mode becomes a low summer sunset. */
const LIGHTING = {
  day: {
    sun: new T.Vector3(-0.5, 0.62, 0.6).normalize(),
    sunColor: 0xfff1dc,
    sunIntensity: 4.2,
    sky: 0xd8e2ea,
    ground: 0x5d6a48,
    hemisphere: 0.75,
    fog: 0xbfd0dc,
    exposure: 0.72,
    turbidity: 3.2,
    rayleigh: 1.1,
    clouds: 0.38,
    envGround: 0x5c6450,
  },
  dusk: {
    sun: new T.Vector3(-0.88, 0.16, 0.45).normalize(),
    sunColor: 0xffb47a,
    sunIntensity: 3.4,
    sky: 0x9a9cc4,
    ground: 0x4a4638,
    hemisphere: 0.75,
    fog: 0x9b8a8f,
    exposure: 0.68,
    turbidity: 6,
    rayleigh: 2.4,
    clouds: 0.5,
    envGround: 0x3a3631,
  },
};

/**
 * Builds the circuit in stages, yielding between them so the page keeps
 * scrolling while it loads. `cancelled` stops the build if the section unmounts.
 */
export async function createTracksideScene(
  host: HTMLDivElement,
  onContextLost: () => void,
  cancelled: () => boolean,
): Promise<TracksideRenderer | null> {
  const fine =
    !window.matchMedia("(max-width: 760px)").matches &&
    (navigator.hardwareConcurrency ?? 8) > 4;
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, fine ? 1.5 : 1.25),
  );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  const contextLost = (event: Event) => {
    event.preventDefault();
    onContextLost();
  };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(40, 1, 0.3, 40000);
  const fog = new T.FogExp2(LIGHTING.day.fog, 0.00011);
  scene.fog = fog;
  const sky = new Sky();
  sky.scale.setScalar(30000);
  scene.add(sky);
  const hemisphere = new T.HemisphereLight(0xffffff, 0xffffff, 0.5);
  scene.add(hemisphere);
  const sun = new T.DirectionalLight(0xffffff, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(fine ? 2048 : 1024);
  sun.shadow.radius = 2.2;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 9000;
  scene.add(sun, sun.target);

  // ── The world ────────────────────────────────────────────────────────────
  const pause = () =>
    new Promise<void>((resolve) => {
      // Let pending input and painting run between expensive build stages.
      if (
        "scheduler" in window &&
        typeof (window.scheduler as { yield?: () => Promise<void> }).yield ===
          "function"
      )
        void (window.scheduler as { yield: () => Promise<void> })
          .yield()
          .then(resolve);
      else setTimeout(resolve, 0);
    });
  const ground = await createGround(fine, pause);
  scene.add(ground.mesh);
  await pause();
  createSurface(scene);
  await pause();
  const venue = createVenue(scene, ground);
  await pause();
  await createForest(scene, ground, venue.clearings, fine, pause);
  const formula = createFormulaCar();
  scene.add(formula.group);

  // A soft route line and numbered pins keep the circuit legible from the air.
  const routeLine = new T.MeshBasicMaterial({
    color: 0xffe08a,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  const routeMesh = new T.Mesh(
    ribbon({
      left: (i) => -trackModel.halfWidth[i] - 6,
      right: (i) => trackModel.halfWidth[i] + 6,
      lift: 1.5,
    }),
    routeLine,
  );
  routeMesh.renderOrder = 2;
  scene.add(routeMesh);
  const pins = venue.screens.map(({ anchor }, i) => {
    const material = new T.SpriteMaterial({
      map: canvasTexture(
        128,
        128,
        (ctx) => {
          ctx.fillStyle = "#fffaf0";
          ctx.beginPath();
          ctx.arc(64, 64, 56, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 6;
          ctx.strokeStyle = "#273d47";
          ctx.stroke();
          ctx.fillStyle = "#172b3d";
          ctx.font = "700 60px Arial, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(i + 1), 64, 68);
        },
        { repeat: false },
      ),
      sizeAttenuation: false,
      transparent: true,
      depthTest: false,
      fog: false,
    });
    const pin = new T.Sprite(material);
    pin.position.copy(anchor).y += 20;
    pin.renderOrder = 3;
    scene.add(pin);
    return pin;
  });

  // ── Theme: sky, sun, fog and reflections ────────────────────────────────
  const pmrem = new T.PMREMGenerator(renderer);
  const envScene = new T.Scene();
  const envSky = new Sky();
  envSky.scale.setScalar(50);
  envScene.add(envSky);
  // Ground below the horizon, so lower bodywork reflects the verges, not more sky.
  const envGround = new T.MeshBasicMaterial({ color: 0x5c6450 });
  envScene.add(
    new T.Mesh(
      new T.CircleGeometry(160, 32).rotateX(-Math.PI / 2).translate(0, -1.5, 0),
      envGround,
    ),
  );
  const environments = new Map<string, T.WebGLRenderTarget>();
  const applyTheme = (dark: boolean) => {
    const key = dark ? "dusk" : "day";
    const look = LIGHTING[key];
    for (const target of [sky, envSky]) {
      const u = target.material.uniforms;
      u.sunPosition.value.copy(look.sun);
      u.turbidity.value = look.turbidity;
      u.rayleigh.value = look.rayleigh;
      u.mieCoefficient.value = 0.004;
      u.mieDirectionalG.value = 0.82;
      u.cloudCoverage.value = look.clouds;
      u.cloudElevation.value = 0.55;
    }
    envSky.material.uniforms.showSunDisc.value = 0;
    envGround.color.setHex(look.envGround);
    if (!environments.has(key))
      environments.set(key, pmrem.fromScene(envScene, 0.04, 0.1, 200));
    scene.environment = environments.get(key)!.texture;
    scene.environmentIntensity = dark ? 0.55 : 0.38;
    sun.color.setHex(look.sunColor);
    sun.intensity = look.sunIntensity;
    hemisphere.color.setHex(look.sky);
    hemisphere.groundColor.setHex(look.ground);
    hemisphere.intensity = look.hemisphere;
    fog.color.setHex(look.fog);
    renderer.toneMappingExposure = look.exposure;
  };

  let width = 0,
    height = 0,
    lastDark: boolean | undefined;
  const dispose = () => {
    renderer.domElement.removeEventListener("webglcontextlost", contextLost);
    const geometries = new Set<T.BufferGeometry>(),
      materials = new Set<T.Material>(),
      textures = new Set<T.Texture>();
    for (const root of [scene, envScene])
      root.traverse((object) => {
        if (object instanceof T.Mesh || object instanceof T.Sprite) {
          geometries.add(object.geometry);
          const list = Array.isArray(object.material)
            ? object.material
            : [object.material];
          list.forEach((material: T.Material) => {
            materials.add(material);
            Object.values(material).forEach((value) => {
              if (value instanceof T.Texture) textures.add(value);
            });
          });
        }
      });
    geometries.forEach((g) => g.dispose());
    textures.forEach((t) => t.dispose());
    materials.forEach((m) => m.dispose());
    environments.forEach((e) => e.dispose());
    pmrem.dispose();
    sun.shadow.map?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
  // Compile shaders off the critical path where the browser supports it. The
  // environment map must exist first: adding it later would recompile everything.
  applyTheme(false);
  lastDark = false;
  camera.position.set(0, 2000, 2000);
  camera.lookAt(0, 0, 0);
  await renderer.compileAsync(scene, camera).catch(() => undefined);
  if (cancelled()) {
    dispose();
    return null;
  }
  host.appendChild(renderer.domElement);

  const projected = new T.Vector3();
  const target = new T.Vector3();
  let previousFrame: DriveFrame | undefined;
  let previousAnchor = { x: 0, y: 0 };
  let slowFrames = 0;
  let pixelRatio = renderer.getPixelRatio();
  return {
    draw(frame) {
      const w = Math.max(1, host.clientWidth),
        h = Math.max(1, host.clientHeight);
      const resized = w !== width || h !== height;
      if (
        !resized &&
        previousFrame &&
        (Object.keys(frame) as (keyof DriveFrame)[]).every(
          (key) => frame[key] === previousFrame![key],
        )
      )
        return previousAnchor;
      previousFrame = { ...frame };
      if (resized) {
        width = w;
        height = h;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
      }
      if (lastDark !== frame.dark) {
        lastDark = frame.dark;
        applyTheme(frame.dark);
      }
      const pose = tracksidePose(frame);
      const look = LIGHTING[frame.dark ? "dusk" : "day"];

      // Car on its line, pitched with the hill, wheels rolling and steering.
      formula.group.position.set(...pose.car.position);
      formula.group.rotation.set(pose.car.pitch, pose.car.heading, 0);
      formula.update(pose.car.s, pose.car.steer);

      // Camera, with the target framed off-centre to clear the story panel.
      target.set(...pose.target);
      camera.position.set(...pose.position);
      camera.lookAt(target);
      if (pose.roll) camera.rotateZ(pose.roll);
      const distance = camera.position.distanceTo(target);
      camera.near = Math.max(0.25, distance * 0.012);
      camera.fov = pose.fov;
      // On short landscape screens the chapter bar and dock cover more of the
      // lower frame, so lift the action a little higher.
      const lift = w > h && h < 600 ? 0.07 : 0;
      camera.setViewOffset(
        w,
        h,
        -(pose.screen[0] - 0.5) * w,
        -(pose.screen[1] - lift - 0.5) * h,
        w,
        h,
      );
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();

      // Shadows follow the action and widen with the view.
      const half = Math.min(2400, Math.max(28, distance * 1.15));
      Object.assign(sun.shadow.camera, {
        left: -half,
        right: half,
        top: half,
        bottom: -half,
      });
      sun.shadow.camera.updateProjectionMatrix();
      sun.shadow.normalBias = (half / sun.shadow.mapSize.x) * 2.5;
      sun.shadow.bias = -0.0002;
      sun.target.position.copy(target);
      sun.position.copy(target).addScaledVector(look.sun, 4000);
      sun.target.updateMatrixWorld();

      // Start lights: one by one, then out.
      const lit = startLights(frame);
      venue.lamps.forEach((lamp, k) => {
        lamp.emissiveIntensity = k < lit ? 1.6 : 0;
      });
      venue.screens.forEach(({ mesh }, i) => {
        (mesh.material as T.MeshBasicMaterial).color.setScalar(
          i === frame.index && !frame.overview ? 1 : 0.62,
        );
      });
      const altitude = camera.position.y - target.y;
      const air = smoothstep(260, 1400, altitude);
      routeLine.opacity = air * 0.75;
      routeMesh.visible = air > 0.01;
      pins.forEach((pin) => {
        pin.visible = air > 0.01;
        pin.material.opacity = air;
        pin.scale.setScalar(h > w ? 0.032 : 0.045);
      });

      const started = performance.now();
      renderer.render(scene, camera);
      // Sustained expensive submissions lower resolution instead of making
      // wheel input wait. Never change quality for a single shader upload.
      if (performance.now() - started > 24) slowFrames++;
      else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames >= 10 && pixelRatio > 1) {
        pixelRatio = Math.max(1, pixelRatio - 0.25);
        renderer.setPixelRatio(pixelRatio);
        slowFrames = 0;
      }
      projected.copy(venue.screens[frame.index].anchor).project(camera);
      previousAnchor = {
        x: ((projected.x + 1) * width) / 2,
        y: ((1 - projected.y) * height) / 2,
      };
      return previousAnchor;
    },
    dispose,
  };
}
