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
        renderer="colorManagement:true; physicallyCorrectLights:true; antialias:true"
        vr-mode-ui="enabled:false"
        device-orientation-permission-ui="enabled:false">

        <a-camera active="false" position="0 0 0"></a-camera>

        <a-light type="ambient" intensity="1.9"></a-light>
        <a-light type="directional" position="1 2 2" intensity="1.5"></a-light>
        <a-light type="directional" position="-1 1 1" intensity=".8"></a-light>

        <!-- CASCO / KABUTO -->
        <a-entity id="kabuto-anchor" mindar-face-target="anchorIndex: 10" position="0 -.02 .08">

          <a-sphere
            position="0 .18 -.10"
            scale=".62 .34 .42"
            theta-start="0"
            theta-length="98"
            color="#161616"
            metalness=".8"
            roughness=".28">
          </a-sphere>

          <a-box
            position="0 .02 .05"
            width=".82"
            height=".10"
            depth=".08"
            color="#7f1d1d"
            metalness=".65"
            roughness=".3">
          </a-box>

          <a-box
            position="-.42 -.06 .03"
            rotation="0 0 10"
            width=".18"
            height=".42"
            depth=".08"
            color="#5b1717"
            metalness=".65"
            roughness=".32">
          </a-box>

          <a-box
            position=".42 -.06 .03"
            rotation="0 0 -10"
            width=".18"
            height=".42"
            depth=".08"
            color="#5b1717"
            metalness=".65"
            roughness=".32">
          </a-box>

          <a-cone
            position="-.18 .44 .02"
            rotation="0 0 24"
            radius-bottom=".04"
            radius-top=".015"
            height=".42"
            color="#b58a42"
            metalness=".9"
            roughness=".18"
            animation="property: rotation; from: 0 0 20; to: 0 0 28; dir: alternate; dur: 1300; loop: true; easing: easeInOutSine">
          </a-cone>

          <a-cone
            position=".18 .44 .02"
            rotation="0 0 -24"
            radius-bottom=".04"
            radius-top=".015"
            height=".42"
            color="#b58a42"
            metalness=".9"
            roughness=".18"
            animation="property: rotation; from: 0 0 -20; to: 0 0 -28; dir: alternate; dur: 1300; loop: true; easing: easeInOutSine">
          </a-cone>

          <a-torus
            position="0 .28 .10"
            radius=".09"
            radius-tubular=".015"
            color="#c7a55d"
            metalness=".95"
            roughness=".15"
            animation="property: rotation; to: 0 0 360; dur: 6500; loop: true; easing: linear">
          </a-torus>
        </a-entity>

        <!-- MÁSCARA / MENPŌ -->
        <a-entity id="menpo-anchor" mindar-face-target="anchorIndex: 1" position="0 -.02 .12" scale="1.05 1.05 1.05">

          <a-box
            id="visor"
            position="0 .12 .10"
            width=".62"
            height=".11"
            depth=".05"
            color="#251111"
            material="emissive:#d63a2f; emissiveIntensity:.65; opacity:.9; transparent:true"
            animation="property: material.emissiveIntensity; from: .45; to: 1.2; dir: alternate; dur: 700; loop: true">
          </a-box>

          <a-sphere
            position="-.16 .12 .14"
            radius=".03"
            color="#ff3b30"
            material="emissive:#ff241c; emissiveIntensity:1.2"
            animation="property: scale; from: .8 .8 .8; to: 1.25 1.25 1.25; dir: alternate; dur: 700; loop: true">
          </a-sphere>

          <a-sphere
            position=".16 .12 .14"
            radius=".03"
            color="#ff3b30"
            material="emissive:#ff241c; emissiveIntensity:1.2"
            animation="property: scale; from: .8 .8 .8; to: 1.25 1.25 1.25; dir: alternate; dur: 700; loop: true">
          </a-sphere>

          <a-box
            position="-.22 -.02 .10"
            rotation="0 0 -12"
            width=".22"
            height=".24"
            depth=".08"
            color="#4a1515"
            metalness=".7"
            roughness=".3">
          </a-box>

          <a-box
            position=".22 -.02 .10"
            rotation="0 0 12"
            width=".22"
            height=".24"
            depth=".08"
            color="#4a1515"
            metalness=".7"
            roughness=".3">
          </a-box>

          <a-cone
            position="0 .00 .15"
            rotation="90 0 0"
            radius-bottom=".06"
            radius-top=".02"
            height=".16"
            color="#222"
            metalness=".75"
            roughness=".25">
          </a-cone>

          <a-entity
            id="jaw"
            position="0 -.22 .10"
            animation="property: rotation; from: 0 0 0; to: 10 0 0; dir: alternate; dur: 900; loop: true; easing: easeInOutSine">

            <a-box
              width=".48"
              height=".16"
              depth=".10"
              color="#4c1414"
              metalness=".72"
              roughness=".3">
            </a-box>

            <a-box
              position="0 .05 .06"
              width=".28"
              height=".04"
              depth=".03"
              color="#d9c9a5">
            </a-box>

            <a-cone
              position="-.14 -.06 .05"
              rotation="180 0 0"
              radius-bottom=".025"
              radius-top="0"
              height=".09"
              color="#d7c8a8">
            </a-cone>

            <a-cone
              position=".14 -.06 .05"
              rotation="180 0 0"
              radius-bottom=".025"
              radius-top="0"
              height=".09"
              color="#d7c8a8">
            </a-cone>
          </a-entity>
        </a-entity>
      </a-scene>`;

    const scene = root.querySelector("a-scene");

    scene.addEventListener("targetFound", () => {
      document.body.classList.add("tracking");
      $("tracking-state").textContent = "Rostro detectado";
      $("mouth-state").textContent = "Mandíbula activa";
      $("blink-state").textContent = "Visor activo";
      $("brow-state").textContent = "Kabuto activo";
    });

    scene.addEventListener("targetLost", () => {
      document.body.classList.remove("tracking");
      $("tracking-state").textContent = "Buscando rostro…";
      $("mouth-state").textContent = "Boca";
      $("blink-state").textContent = "Ojos";
      $("brow-state").textContent = "Cejas";
    });
  }

  function start() {
    $("intro").classList.add("hidden");
    $("ar-shell").classList.remove("hidden");
    buildScene();
  }

  $("start-camera").addEventListener("click", start);
})();
