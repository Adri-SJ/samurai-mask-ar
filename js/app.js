(() => {
  const $ = (id) => document.getElementById(id);
  let sceneBuilt = false;

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

        <a-assets timeout="20000">
          <a-asset-item
            id="kabuto-model"
            src="./assets/models/samurai_helmet.glb?v=3">
          </a-asset-item>

          <a-asset-item
            id="menpo-model"
            src="./assets/models/menpo_-_samurai_mask.glb?v=3">
          </a-asset-item>
        </a-assets>

        <a-camera active="false" position="0 0 0"></a-camera>

        <a-light type="ambient" intensity="1.7"></a-light>
        <a-light type="directional" position="1 2 2" intensity="1.35"></a-light>
        <a-light type="directional" position="-1 1 1" intensity=".55"></a-light>

        <!--
          El Kabuto tiene un origen prácticamente centrado en su propio GLB.
          Usamos escala explícita para evitar que el centrado automático lo
          desplace fuera del rostro.
        -->
        <a-entity id="helmet-anchor" mindar-face-target="anchorIndex: 10">
          <a-gltf-model
            id="kabuto"
            src="#kabuto-model"
            position="0 .23 .00"
            rotation="0 0 0"
            scale=".025 .025 .025">
          </a-gltf-model>
        </a-entity>

        <!--
          El origen del Menpō viene desplazado dentro del archivo original,
          por eso se compensa con position además de su escala.
        -->
        <a-entity id="menpo-anchor" mindar-face-target="anchorIndex: 1">
          <a-gltf-model
            id="menpo"
            src="#menpo-model"
            position="0 .15 -.08"
            rotation="0 0 0"
            scale=".035 .035 .035">
          </a-gltf-model>
        </a-entity>
      </a-scene>`;

    const scene = root.querySelector("a-scene");

    root.querySelectorAll("a-gltf-model").forEach((model) => {
      model.addEventListener("model-loaded", () => {
        console.log("Modelo cargado:", model.id);
      });

      model.addEventListener("model-error", (event) => {
        console.error("Error cargando modelo:", model.getAttribute("src"), event.detail);
      });
    });

    scene.addEventListener("targetFound", () => {
      document.body.classList.add("tracking");
      $("tracking-state").textContent = "Rostro detectado";
    });

    scene.addEventListener("targetLost", () => {
      document.body.classList.remove("tracking");
      $("tracking-state").textContent = "Buscando rostro…";
    });
  }

  function start() {
    $("intro").classList.add("hidden");
    $("ar-shell").classList.remove("hidden");
    buildScene();
  }

  $("start-camera").addEventListener("click", start);
})();
