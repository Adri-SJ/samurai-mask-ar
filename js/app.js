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

        <a-camera active="false" position="0 0 0"></a-camera>

        <a-light type="ambient" intensity="1.35"></a-light>
        <a-light type="directional" position="1 2 2" intensity="1.2"></a-light>

        <!--
          Placeholder visual.
          Cuando tengamos los GLB del kabuto y del menpō, se reemplazan estas piezas
          manteniendo los mismos face anchors.
        -->

        <a-entity id="helmet-anchor" mindar-face-target="anchorIndex: 10">
          <a-sphere
            id="helmet-placeholder"
            position="0 .42 -.08"
            scale=".78 .44 .72"
            color="#181b20"
            metalness=".65"
            roughness=".34">
          </a-sphere>

          <a-box
            position="0 .56 .02"
            scale=".72 .11 .08"
            color="#b72b2b"
            metalness=".55">
          </a-box>

          <a-cone
            position="-.42 .55 .01"
            rotation="0 0 30"
            radius-bottom=".055"
            radius-top=".018"
            height=".5"
            color="#d5aa57">
          </a-cone>

          <a-cone
            position=".42 .55 .01"
            rotation="0 0 -30"
            radius-bottom=".055"
            radius-top=".018"
            height=".5"
            color="#d5aa57">
          </a-cone>
        </a-entity>

        <a-entity id="menpo-anchor" mindar-face-target="anchorIndex: 1">
          <a-box
            id="menpo-placeholder"
            position="0 -.12 .16"
            scale=".52 .23 .12"
            color="#252a31"
            metalness=".72"
            roughness=".28">
          </a-box>
        </a-entity>
      </a-scene>`;

    const scene = root.querySelector("a-scene");

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
