(() => {
  const $ = (id) => document.getElementById(id);
  let sceneBuilt = false;

  if (window.AFRAME && !AFRAME.components["fit-gltf"]) {
    AFRAME.registerComponent("fit-gltf", {
      schema: { size: { type: "number", default: 1 } },

      init() {
        this.el.addEventListener("model-loaded", () => {
          const mesh = this.el.getObject3D("mesh");
          if (!mesh || !window.THREE) return;

          mesh.updateMatrixWorld(true);

          const box = new THREE.Box3().setFromObject(mesh);
          const center = new THREE.Vector3();
          const size = new THREE.Vector3();

          box.getCenter(center);
          box.getSize(size);

          mesh.position.x -= center.x;
          mesh.position.y -= center.y;
          mesh.position.z -= center.z;

          const longest = Math.max(size.x, size.y, size.z);

          if (longest > 0) {
            const scaleFactor = this.data.size / longest;
            mesh.scale.multiplyScalar(scaleFactor);
          }
        });
      }
    });
  }

  function buildScene() {
    if (sceneBuilt) return;
    sceneBuilt = true;

    const root = $("scene-root");

    root.innerHTML = `
      <a-scene
        mindar-face
        embedded
        color-space="sRGB"
        renderer="colorManagement:true; physicallyCorrectLights:true"
        vr-mode-ui="enabled:false"
        device-orientation-permission-ui="enabled:false">

        <a-assets>
          <a-asset-item id="kabuto-model" src="./assets/models/samurai_helmet.glb?v=2"></a-asset-item>
          <a-asset-item id="menpo-model" src="./assets/models/menpo_-_samurai_mask.glb?v=2"></a-asset-item>
        </a-assets>

        <a-camera active="false" position="0 0 0"></a-camera>

        <a-light type="ambient" intensity="1.35"></a-light>
        <a-light type="directional" position="1 2 2" intensity="1.2"></a-light>

        <a-entity id="helmet-anchor" mindar-face-target="anchorIndex: 10">
          <a-gltf-model
            id="kabuto"
            src="#kabuto-model"
            fit-gltf="size: 1.65"
            position="0 .18 .02"
            rotation="0 0 0"
            scale="1 1 1">
          </a-gltf-model>
        </a-entity>

        <a-entity id="menpo-anchor" mindar-face-target="anchorIndex: 1">
          <a-gltf-model
            id="menpo"
            src="#menpo-model"
            fit-gltf="size: .95"
            position="0 -.02 .10"
            rotation="0 0 0"
            scale="1 1 1">
          </a-gltf-model>
        </a-entity>
      </a-scene>`;

    const scene = root.querySelector("a-scene");

    root.querySelectorAll("a-gltf-model").forEach((model) => {
      model.addEventListener("model-error", (event) => {
        console.error("Error cargando modelo:", model.getAttribute("src"), event.detail);
      });
    });

    scene.addEventListener("targetFound", () => {
      document.body.classList.add("tracking");
      $("tracking-state").textContent = "ROSTRO DETECTADO";
    });

    scene.addEventListener("targetLost", () => {
      document.body.classList.remove("tracking");
      $("tracking-state").textContent = "BUSCANDO ROSTRO";
    });
  }

  function start() {
    $("intro").classList.add("hidden");
    $("ar-shell").classList.remove("hidden");
    buildScene();
  }

  $("start-camera").addEventListener("click", start);
})();
