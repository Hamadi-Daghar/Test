import * as dat from 'dat.gui';

import {RunningMode, AnimationSpeed} from './constants';

export function createGUI(uiModel, diskCount, modeChanged, displayOptionChanged) {
    const gui = new dat.GUI({
        width: 300,
    });

    gui.add(uiModel.runningMode, 'current', {
        'manual': RunningMode.MANUAL,
        'step by step': RunningMode.STEP_BY_STEP,
        'demo': RunningMode.DEMO
    }).name("Mode").onChange((mode) => { modeChanged(mode); });

    const manualModeFolder = gui.addFolder("Manual mode");
    manualModeFolder.add(uiModel.runningMode.manual, 'fromTower', [1, 2, 3]).name("from tower");
    manualModeFolder.add(uiModel.runningMode.manual, 'toTower', [1, 2, 3]).name("to tower");
    manualModeFolder.add(uiModel.runningMode.manual, 'play').name('Do it');
    manualModeFolder.add(uiModel.runningMode.manual, 'reset').name('Reset game');

    gui.manualModeFolder = manualModeFolder;

    const stepByStepModeFolder = gui.addFolder("Step by step mode");
    stepByStepModeFolder.add(uiModel.runningMode.stepByStep, 'next').name('Next step');
    stepByStepModeFolder.add(uiModel.runningMode.stepByStep, 'restart').name('Restart');

    const timeMachineFolder = stepByStepModeFolder.addFolder('Time machine');
    timeMachineFolder.add(uiModel.runningMode.stepByStep.timeMachine, 'targetStep', 0, Math.pow(2, diskCount) - 1).name("target step");
    timeMachineFolder.add(uiModel.runningMode.stepByStep.timeMachine, 'jump').name('Jump');

    gui.stepByStepModeFolder = stepByStepModeFolder;

    const demoModeFolder = gui.addFolder("Demo mode");
    demoModeFolder.add(uiModel.runningMode.demo, 'pause').name('Pause');
    demoModeFolder.add(uiModel.runningMode.demo, 'resume').name('Resume');
    demoModeFolder.add(uiModel.runningMode.demo, 'restart').name('Restart');

    gui.demoModeFolder = demoModeFolder;

    const displayOptionsFolder = gui.addFolder("Display options");
    displayOptionsFolder.add(uiModel.displayOptions, 'animationSpeed', {
        'normal': AnimationSpeed.NORMAL,
        'slow': AnimationSpeed.SLOW,
        'fast': AnimationSpeed.FAST,
        'ultra fast': AnimationSpeed.ULTRA_FAST
    }).name('animation speed');
    displayOptionsFolder.add(uiModel.displayOptions, 'directionalLightOn').name("directional light ON").onChange((lightsOn) => { displayOptionChanged('directionalLightOn'); });
    displayOptionsFolder.add(uiModel.displayOptions, 'animateCamera').name("camera animation").onChange((arOn) => { displayOptionChanged('animateCamera'); });
    displayOptionsFolder.add(uiModel.displayOptions, 'showAxes').name("show axes").onChange((showAxes) => { displayOptionChanged('showAxes'); });
    displayOptionsFolder.add(uiModel.displayOptions, 'showPerfs').name("show perfs meter").onChange((showPerfs) => { displayOptionChanged('showPerfs'); });

    return gui;
}
