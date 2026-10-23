import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createFormulaCar } from "./FormulaCar";
import { canvasTexture } from "./textures";

export type CarView = "quarter" | "front" | "top";

/** An on-demand inspection view of the exact model used on the circuit. */
export async function createCarStudio(
  host: HTMLDivElement,
  cancelled: () => boolean,
) {
  const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
  await pause();
  if (cancelled()) return null;
  const renderer = new T.WebGLRenderer({
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  const scene = new T.Scene();
  scene.background = new T.Color(0x05080e);
  scene.fog = new T.Fog(0x05080e, 8, 22);
  const pmrem = new T.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  room.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.32;
  await pause();
  const car = createFormulaCar({ resolution: 4096, driver: false });
  scene.add(car.group);
  // A dark launch studio: one soft key overhead, cool rims behind, as in the photos.
  const key = new T.SpotLight(0xfff4e6, 140, 0, 0.62, 0.65, 2);
  key.position.set(1.2, 7.5, 2.2);
  key.target.position.set(0, 0.3, 0);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(2048);
  key.shadow.camera.near = 2;
  key.shadow.camera.far = 14;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  const rim = new T.DirectionalLight(0x8fb6ff, 1.4);
  rim.position.set(-4, 3, -5);
  const kicker = new T.DirectionalLight(0xffd9b0, 0.7);
  kicker.position.set(5, 1.2, -3);
  scene.add(
    key,
    key.target,
    rim,
    kicker,
    new T.HemisphereLight(0xc8d8ff, 0x0a0f1a, 0.35),
  );
  const floor = new T.Mesh(
    new T.PlaneGeometry(200, 200),
    new T.MeshStandardMaterial({
      color: 0x0b111c,
      metalness: 0,
      roughness: 0.92,
      envMapIntensity: 0.15,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);
  // A painted sun disc and a red glow on the studio floor, after the launch set.
  const stage = new T.Mesh(
    new T.CircleGeometry(3.4, 96).rotateX(-Math.PI / 2).translate(0.6, -0.004, -0.4),
    new T.MeshStandardMaterial({
      map: canvasTexture(
        512,
        512,
        (ctx, w, h) => {
          const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
          glow.addColorStop(0, "#c98200");
          glow.addColorStop(0.62, "#b56f00");
          glow.addColorStop(0.68, "#7d1016");
          glow.addColorStop(0.9, "#3a0a12");
          glow.addColorStop(1, "#0b111c");
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, w, h);
        },
        { repeat: false },
      ),
      roughness: 0.7,
      transparent: true,
      opacity: 0.85,
    }),
  );
  stage.receiveShadow = true;
  scene.add(stage);
  const camera = new T.PerspectiveCamera(35, 1, 0.1, 250);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.4, 0);
  controls.enablePan = false;
  controls.minDistance = 4.5;
  controls.maxDistance = 20;
  controls.maxPolarAngle = Math.PI / 2 - 0.025;
  controls.rotateSpeed = 0.65;
  let ready = false;
  const draw = () => {
    if (ready) renderer.render(scene, camera);
  };
  const resize = () => {
    camera.aspect = host.clientWidth / Math.max(1, host.clientHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    draw();
  };
  const view = (name: CarView) => {
    const portrait = host.clientWidth < host.clientHeight;
    camera.up.set(0, 1, 0);
    const position = {
      quarter: [portrait ? 9 : 4.4, portrait ? 6 : 2.7, portrait ? 11 : 5.4],
      front: [0, 1.15, portrait ? 9.5 : 5.3],
      top: [0.01, portrait ? 17 : 12.5, 0],
    }[name];
    camera.position.set(...(position as [number, number, number]));
    controls.update();
    draw();
  };
  resize();
  view("quarter");
  const observer = new ResizeObserver(resize);
  const dispose = () => {
    ready = false;
    observer.disconnect();
    controls.dispose();
    const geometries = new Set<T.BufferGeometry>(),
      materials = new Set<T.Material>(),
      textures = new Set<T.Texture>();
    scene.traverse((object) => {
      if (!(object instanceof T.Mesh)) return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material]) {
        materials.add(material);
        for (const value of Object.values(material))
          if (value instanceof T.Texture) textures.add(value);
      }
    });
    geometries.forEach((g) => g.dispose());
    textures.forEach((t) => t.dispose());
    materials.forEach((m) => m.dispose());
    environment.dispose();
    pmrem.dispose();
    key.shadow.map?.dispose();
    key.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
  await renderer.compileAsync(scene, camera).catch(() => undefined);
  if (cancelled()) {
    dispose();
    return null;
  }
  controls.addEventListener("change", draw);
  host.appendChild(renderer.domElement);
  observer.observe(host);
  ready = true;
  draw();
  return {
    view,
    rotate(direction: number) {
      camera.position
        .sub(controls.target)
        .applyAxisAngle(new T.Vector3(0, 1, 0), direction * 0.15)
        .add(controls.target);
      controls.update();
    },
    dispose,
  };
}
