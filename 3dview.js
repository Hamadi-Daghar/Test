import {
    AmbientLight,
    AxesHelper,
    CubeTextureLoader,
    DirectionalLight,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PointLight,
    Scene,
    sRGBEncoding,
    WebGLRenderer
} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';

import {ANIMATION_DURATION_QUANTA, HanoiTowersGame} from './hanoi';
import {createGUI} from './ui';
import {
    AnimationSpeed,
    DISK_COUNT,
    MIN_REQUIRED_MOVES,
    POLE_HEIGHT,
    RunningMode,
    START_TOWER,
    TARGET_TOWER,
    TOWERS_DISTANCE
} from './constants';

const VIEW_ANGLE = 50;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = TOWERS_DISTANCE * 20;

const threeContainer = document.getElementById('ThreeJS');

////////////////////////////////////////////////////////////////////////////
function create3DContext(container) {
    const scene = new Scene();
    const loader = new CubeTextureLoader();
    loader.setPath('textures/');
    scene.background = loader.load([
        'dark-s_px.jpg', 'dark-s_nx.jpg',
        'dark-s_py.jpg', 'dark-s_ny.jpg',
        'dark-s_pz.jpg', 'dark-s_nz.jpg',
    ]);

    const camera = new PerspectiveCamera(
        VIEW_ANGLE,
        window.innerWidth / window.innerHeight,
        CAMERA_NEAR, CAMERA_FAR
    );
    scene.add(camera);
    camera.position.setFromSphericalCoords(5 * TOWERS_DISTANCE, 2 * Math.PI / 5, -Math.PI / 4);
    camera.lookAt(scene.position);

    const renderer = new WebGLRenderer({
        antialias: true,
        outputEncoding: sRGBEncoding,
        gammaFactor: 2.2
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    threeContainer.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 0.2;
    controls.maxDistance = CAMERA_FAR * 0.5;
    controls.enableDamping = true;

    return {
        scene,
        camera,
        controls,
        renderer,
    };
}

////////////////////////////////////////////////////////////////////////////
function createLights(scene) {
    const ambientLight = new AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    for (const side of [-1, +1]) {
        const fillInLight = new PointLight(0xffffff, 0.3);
        fillInLight.position.set(0, 200, 200 * side);
        fillInLight.castShadow = false;
        scene.add(fillInLight);
    }

    const dirLight = new DirectionalLight(0xffffff, 0.3);
    dirLight.position.set(100, 250, 100);

    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    // dirLight.shadow.side = FRONT;

    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = DISK_COUNT * 1000;
    dirLight.shadow.camera.left = -DISK_COUNT * 20;
    dirLight.shadow.camera.bottom = -DISK_COUNT * 20;
    dirLight.shadow.camera.right = DISK_COUNT * 20;
    dirLight.shadow.camera.top = DISK_COUNT * 20;

    scene.add(dirLight);

    return {
        dirLight
    };
}

////////////////////////////////////////////////////////////////////////////
function createHelpers(scene) {
    const axisHelper = new AxesHelper(200);
    scene.add(axisHelper);

    return {
        axisHelper
    };
}

////////////////////////////////////////////////////////////////////////////
function createPerfsMeter(container) {
    const stats = new Stats();
    stats.domElement.style.cssText = '';   // use the CSS instead of hard-coding attributes here
    stats.domElement.className = 'stats';
    container.appendChild(stats.domElement);

    return stats;
}

////////////////////////////////////////////////////////////////////////////
function showPerfsMeter(showIt) {
    const elt = document.querySelector(".stats");
    if (showIt) {
        elt.classList.remove('hidden');
    } else {
        elt.classList.add('hidden');
    }
}

////////////////////////////////////////////////////////////////////////////
function animate() {
    requestAnimationFrame(animate);

    controls.update();
    persMeter.update();
    game.animate(currentMode, uiModel.displayOptions.animationSpeed);

    render();
}

////////////////////////////////////////////////////////////////////////////
function render() {
    renderer.render(scene, camera);
}

////////////////////////////////////////////////////////////////////////////
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

////////////////////////////////////////////////////////////////////////////
function doPlayMove() {
    const fromIndex = uiModel.runningMode.manual.fromTower - 1;
    const toIndex = uiModel.runningMode.manual.toTower - 1;

    const error = game.moveDisk(fromIndex, toIndex, uiModel.displayOptions.animationSpeed);
    if (error) {
        alert(error);
    }
}

////////////////////////////////////////////////////////////////////////////
function doResetGame() {
    game.reset();

    uiModel.runningMode.manual.fromTower = START_TOWER + 1;
    uiModel.runningMode.manual.toTower = TARGET_TOWER + 1;
    gui.updateDisplay();
}

////////////////////////////////////////////////////////////////////////////
function doNextStep() {
    game.nextStep();
}

////////////////////////////////////////////////////////////////////////////
function doRestartStepByStep() {
    terminateDemo();
    doStartDemo(true);
}

////////////////////////////////////////////////////////////////////////////
function doJumpToStep() {
    showInfoMessage("Time travel in progress. Please wait...");

    requestAnimationFrame(() =>
        requestAnimationFrame(function () {
                const moveNum = uiModel.runningMode.stepByStep.timeMachine.targetStep;

                game.shiftTimeTo(moveNum);
            }, 10
        )
    );
}

////////////////////////////////////////////////////////////////////////////
function doStartDemo(paused, currentMode) {
    game.startDemo(paused, currentMode);
}

////////////////////////////////////////////////////////////////////////////
function doPauseDemo() {
    game.paused = true;
}

////////////////////////////////////////////////////////////////////////////
function doResumeDemo() {
    game.paused = false;
}

////////////////////////////////////////////////////////////////////////////
function doRestartDemo() {
    terminateDemo();
    doStartDemo();
}

////////////////////////////////////////////////////////////////////////////
function terminateDemo() {
    game.terminateDemo();
    hideInfoBox();
}

////////////////////////////////////////////////////////////////////////////
function modeChanged(mode) {
    let active;
    switch (mode) {
        case RunningMode.MANUAL:
            active = gui.manualModeFolder;
            //terminateDemo();
            game.showTowerLabels();
            game.hideArrows();
            break;
        case RunningMode.STEP_BY_STEP:
            active = gui.stepByStepModeFolder;
            terminateDemo();
            doStartDemo(true);
            game.hideTowerLabels();
            break;
        case RunningMode.DEMO:
            active = gui.demoModeFolder;
            doStartDemo(false,currentMode);
            game.hideTowerLabels();
            game.hideArrows();
            break;
    }
    for (const folder of [gui.manualModeFolder, gui.stepByStepModeFolder, gui.demoModeFolder]) {
        if (folder == active) {
            folder.show();
            folder.open();
        } else {
            folder.hide();
        }
    }

    currentMode = mode;
}

////////////////////////////////////////////////////////////////////////////
function displayOptionChanged(option) {
    switch (option) {
        case 'directionalLightOn':
            dirLight.visible = uiModel.displayOptions.directionalLightOn;
            break;
        case 'animateCamera':
            controls.autoRotate = uiModel.displayOptions.animateCamera;
            break;
        case 'showAxes':
            axisHelper.visible = uiModel.displayOptions.showAxes;
            break;
        case 'showPerfs':
            showPerfsMeter(uiModel.displayOptions.showPerfs);
            break;
    }
}

////////////////////////////////////////////////////////////////////////////
function applyDisplayOptions() {
    dirLight.visible = uiModel.displayOptions.directionalLightOn;
    controls.autoRotate = uiModel.displayOptions.animateCamera;
    axisHelper.visible = uiModel.displayOptions.showAxes;
    showPerfsMeter(uiModel.displayOptions.showPerfs);
}

////////////////////////////////////////////////////////////////////////////
function showProgress(done, total) {
    const hilite = done > total ? "too-many-moves" : "";
    const pctDone = done / MIN_REQUIRED_MOVES * 100;
    const progress = pctDone >= 0.1 ? pctDone.toFixed(1) : "<&nbsp;0.1";

    let msg = `
      <div class="info-row">
          <div class="${hilite}">Moves: ${done.toLocaleString('fr')}</div>
          <div>Total: ${total.toLocaleString('fr')}</div>
          <div>Progress: ${progress}%</div>
      </div>
  `;

    if (currentMode == 'D') {
        const avgMoveSecs = ANIMATION_DURATION_QUANTA[uiModel.displayOptions.animationSpeed] * 3;
        const remainingSeconds = (MIN_REQUIRED_MOVES - game.movesDone) * avgMoveSecs;
        const remainingMinutes = remainingSeconds / 60;
        const remainingHours = remainingMinutes / 60;
        const remainingDays = remainingHours / 24;
        const remainingYears = remainingDays / 365;
        const remainingMonths = remainingYears * 12;

        let remaining;
        if (remainingYears > 1) {
            remaining = `${remainingYears.toFixed(1)} years`;
        } else if (remainingMonths > 1) {
            remaining = `${remainingMonths.toFixed(1)} months`;
        } else if (remainingDays > 1) {
            remaining = `${remainingDays.toFixed(1)} days`;
        } else if (remainingHours > 1) {
            remaining = `${remainingHours.toFixed(1)} hours`;
        } else if (remainingMinutes > 1) {
            remaining = `${remainingMinutes.toFixed(1)} minutes`;
        } else {
            remaining = `${remainingSeconds.toFixed(1)} seconds`;
        }

        msg += `
          <div class="info-row">
          Will take approx. ${remaining} to complete at current speed.
          </div>
      `;
    }

    showInfoMessage(msg);
}

const infoBox = document.querySelector("#info");
const helpBox = document.querySelector("#help");

////////////////////////////////////////////////////////////////////////////
function showInfoMessage(msg) {
    infoBox.innerHTML = msg;
    showInfoBox();
}

////////////////////////////////////////////////////////////////////////////
function showInfoBox() {
    infoBox.classList.remove("hidden");
}

////////////////////////////////////////////////////////////////////////////
function hideInfoBox() {
    infoBox.classList.add("hidden");
}

////////////////////////////////////////////////////////////////////////////
function onGameTerminated(success) {
    let msg;
    if (currentMode == RunningMode.MANUEL) {
        msg = success ? "Congratulations !!! You made it :)" : "You did it, but with too many moves :(";
    } else {
        msg = "Finished !!";
    }
    showInfoMessage(msg);
}

////////////////////////////////////////////////////////////////////////////
function onGameProgress() {
    showProgress(game.movesDone, MIN_REQUIRED_MOVES);
}

////////////////////////////////////////////////////////////////////////////
function onKeyUp(event) {
    console.log(event);
    switch (event.key) {
        case '?':
            helpBox.classList.toggle("hidden");
            break;
        case 'Escape':
            window.location = '/index.html';
            break;
    }
}

////////////////////////////////////////////////////////////////////////////
/// Main starts here
////////////////////////////////////////////////////////////////////////////

const {scene, camera, controls, renderer} = create3DContext(threeContainer);
const {dirLight} = createLights(scene);
const {axisHelper} = createHelpers(scene);

const persMeter = createPerfsMeter(threeContainer);

const uiModel = {
    displayOptions: {
        animationSpeed: AnimationSpeed.NORMAL,
        directionalLightOn: true,
        animateCamera: false,
        showAxes: false,
        showPerfs: false
    },
    runningMode: {
        current: RunningMode.MANUAL,
        manual: {
            fromTower: START_TOWER + 1,
            toTower: TARGET_TOWER + 1,
            play: doPlayMove,
            reset: doResetGame,
        },
        stepByStep: {
            next: doNextStep,
            restart: doRestartStepByStep,
            timeMachine: {
                targetStep: 0,
                jump: doJumpToStep
            }
        },
        demo: {
            pause: doPauseDemo,
            resume: doResumeDemo,
            restart: doRestartDemo,
        }
    }
};

let currentMode = null;
const gui = createGUI(uiModel, DISK_COUNT, modeChanged, displayOptionChanged);

window.addEventListener('resize', onWindowResize);
window.addEventListener('keyup', onKeyUp);

const game = new HanoiTowersGame(onGameTerminated, onGameProgress);
game.create3DModel(scene).then(() => {
    game.reset();
    modeChanged(uiModel.runningMode.current);
    applyDisplayOptions();
    animate();
});
