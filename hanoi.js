import {gsap} from 'gsap';

import {
    Factory,
    movingDiskMaterial, finishedDiskMaterial,
    towerLabelMaterial, hilitedTowerLabelMaterial, arrowMaterial
} from './factory3d';

import {
    TOWER_X,
    START_TOWER, TARGET_TOWER, TOWERS_COUNT,
    DISK_THICKNESS, SOLVER,
    DISK_COUNT, TOPT,
    POLE_HEIGHT,
    TOWERS_DISTANCE,
    MIN_REQUIRED_MOVES,
    HANOI_ARRAY_REPRESENTATION
} from './constants';

export const ANIMATION_DURATION_QUANTA = {
    'N': .5,        // seconds
    'U': .1,
    'F': .2,
    'S': .8
};


////////////////////////////////////////////////////////////////////////////
// A generator implementing the recursive solver of the problem
////////////////////////////////////////////////////////////////////////////

function* solverBicoloreRecur(n, A, C, B) {
    if (n == 1) {
        yield[A, B];
        yield[C, B];
    }else if (n == 2){
        yield[A, C];
        yield[A, B];
        yield[C, A];
        yield[C, A];
        yield[C, B];
        yield[A, C];
        yield[A, B];
        yield[C, B];
    }
    else{
        for (let move of solverBicoloreRecur(n-1,A,C,B)) {
            yield move;
        }
        yield[A, C];

        for (let move of doubleTowersOfHanoi(n-1,B,A,C)) {
            yield move;
        }
        yield[C, B];
        yield[C, B];
        for (let move of doubleTowersOfHanoi(n-1,A,B,C)) {
            yield move;
        }
    }
}



function* doubleTowersOfHanoi(n, A, B, C) {
    if (n == 1) {
        yield[A, B];
        yield[A, B];
    } else {
        for (let move of doubleTowersOfHanoi(n - 1, A, C, B)) {
            yield move;
        }
        yield[A, B];
        yield[A, B];
        for (let move of doubleTowersOfHanoi(n - 1, C, B, A)) {
            yield move;
        }
    }
}

function* solverClassique(n, from, to){
    if (n === 1) {
        yield [from, to];

    } else {
        const other = TOWERS_COUNT - from - to;
        yield* solverClassique(n - 1, from, other);
        yield [from, to];
        yield* solverClassique(n - 1, other, to);
    }
}

function* solverMultiPegs(n, pegs, from, to){
    if (n > 0) {
        if (pegs.length === 2) {
            // Cas de base : s'il n'y a que 2 piquets
            console.log(`Move disk from ${pegs[0]} to ${pegs[1]}`);
            yield [pegs[0], pegs[1]];
        } else if (pegs.length === 3) {
            // Cas classique des Tours de Hanoï avec 3 piquets
            const [p1, p2, p3] = pegs;
            yield* solverMultiPegs(n - 1, [p1, p3, p2]);
            console.log(`Move disk from ${p1} to ${p2}`);
            yield [p1, p2];
            yield* solverMultiPegs(n - 1, [p3, p2, p1]);
        } else if (pegs.length > 3) {
            // Cas généralisé pour plus de 3 piquets, utilisant findK pour calculer k
            const k = TOPT.kn[pegs.length - 3][n - 1];
            const [p1, p2, p3, ...rest] = pegs;
            yield* solverMultiPegs(k, [p1, p3, p2, ...rest]);
            yield* solverMultiPegs(n - k, [p1, p2, ...rest]);
            yield* solverMultiPegs(k, [p3, p2, p1, ...rest]);
        }
    }
}


function* solveForSteps(disks, targets = null, n = disks.length, depth = 0) {
    console.log(disks);
    console.log("ok");
    if (depth === 0) { // Initialisation lors du premier appel
        targets = new Array(n);
        let target = 2; // La plus grande disque doit aller à la tige la plus à droite
        for (let i = n - 1; i >= 0; i--) {
            targets[i] = target;
            if (disks[i] !== target) {
                target = 3 - target - disks[i];
            }
        }
    }

    // Identifier le disque à déplacer
    let i = 0;
    for (; i < n; i++) {
        if (targets[i] !== disks[i]) {
            break; // Disque trouvé
        }
    }

    if (i === n) { // Si tous les disques sont à leur place, la récursion s'arrête
        return;
    }

    // Déplacer le disque trouvé à sa position cible
    let target = targets[i];
    yield [disks[i], target];
    disks[i] = target;

    // Mettre à jour les positions cibles des disques plus petits
    for (let j = i - 1; j >= 0; j--) {
        targets[j] = target;
        target = 3 - target - disks[j];
    }

    // Appel récursif pour vérifier et effectuer le prochain mouvement nécessaire
    yield* solveForSteps(disks, targets, n, depth + 1);
}

function* solveForStepsMulti(disks, nPegs) {
    let n = disks.length;
    let targets = new Array(n);
    let currentTarget = nPegs - 1; // On commence par déplacer le plus grand disque vers le dernier piquet

    // Initialisation des cibles pour chaque disque
    for (let i = n - 1; i >= 0; i--) {
        targets[i] = currentTarget;
        if (disks[i] !== currentTarget) {
            // Choix du piquet intermédiaire optimal
            currentTarget = chooseIntermediatePeg(disks, i, nPegs, currentTarget);
        }
    }

    let i = 0;
    while (i < n) {
        for (i = 0; i < n; i++) {
            if (targets[i] !== disks[i]) {
                let target = targets[i];
                // Au lieu de simplement logger, on "produit" le mouvement
                yield [disks[i], target]; // Cela représente le disque en mouvement et sa cible
                disks[i] = target;
                for (let j = i - 1; j >= 0; j--) {
                    targets[j] = target;
                    target = chooseIntermediatePeg(disks, j, nPegs, target);
                }
                break;
            }
        }
    }
}

function chooseIntermediatePeg(disks, diskIndex, nPegs, target) {
    let availablePegs = [];
    for (let peg = 0; peg < nPegs; peg++) {
        if (peg !== disks[diskIndex] && peg !== target) {
            availablePegs.push(peg);
        }
    }
    // Sélection du piquet avec le moins de disques au-dessus
    let minDisksAbove = Infinity;
    let optimalPeg = -1;
    for (let peg of availablePegs) {
        let disksAbove = 0;
        for (let i = diskIndex + 1; i < disks.length; i++) {
            if (disks[i] === peg) {
                disksAbove++;
            }
        }
        if (disksAbove < minDisksAbove) {
            minDisksAbove = disksAbove;
            optimalPeg = peg;
        }
    }

    return optimalPeg;
}



// Assume deplacerDisque is defined elsewhere in your JS code



////////////////////////////////////////////////////////////////////////////

function makeTowerStorage(count) {
    const ts = [];
    for (let i = 0; i < count; i++) {
        ts.push([])
    }
    return ts;
}

export class HanoiTowersGame {
    constructor(onTerminated, onProgress) {
        this.towers = makeTowerStorage(TOWERS_COUNT);
        this.towerLabels = [];
        this.disks = [];
        this.disksBleu = [];
        this.disksJaune = [];
        this.arrows = null;
        this.arrowAnimation = null;

        this.movesDone = 0;
        this.waitingMove = null;
        this.animation = null;
        this.paused = false;

        this.solver = null;

        this.onTerminated = onTerminated;
        this.onProgress = onProgress;

        this.hanoi_array = HANOI_ARRAY_REPRESENTATION;

    }


    ////////////////////////////////////////////////////////////////////////////
    async create3DModel(scene) {
        const factory = new Factory(scene);
        factory.createPlatform3DModel();
        if(SOLVER==="bicolore"){
            this.disksBleu = factory.createDisk3DModelsBleu();
            this.disksJaune = factory.createDisk3DModelsJaune();
        }else
            this.disks = factory.createDisk3DModels(null);

        this.towerLabels = await factory.createTowerLabels()
        this.arrows = factory.createMoveArrows();
    }

    ////////////////////////////////////////////////////////////////////////////
    reset() {
        if(SOLVER==="bicolore"){
            const tower = [];
            const tower2 = [];
            const x = TOWER_X[START_TOWER];

            const x2 = TOWER_X[2];

            for (const disk of this.disksBleu) {
                tower.push(disk);
                disk.position.x = x;
                disk.position.y = DISK_THICKNESS * (tower.length - 1);
                disk.material = disk.userData.defaultMaterial;
            }

            for (const disk of this.disksJaune) {
                tower2.push(disk);
                disk.position.x = x2;
                disk.position.y = DISK_THICKNESS * (tower2.length - 1);
                disk.material = disk.userData.defaultMaterial;
            }

            this.towers = makeTowerStorage(TOWERS_COUNT);
            this.towers[START_TOWER] = tower;
            this.towers[2] = tower2;
            this.movesDone = 0;
            this.waitingMove = null;

            this.solver = null;
        }else{
            const tower = [];
            const x = TOWER_X[START_TOWER];
            for (const disk of this.disks) {
                tower.push(disk);
                disk.position.x = x;
                disk.position.y = DISK_THICKNESS * (tower.length - 1);
                disk.material = disk.userData.defaultMaterial;
            }
            this.towers = makeTowerStorage(TOWERS_COUNT);
            this.towers[START_TOWER] = tower;
            this.movesDone = 0;
            this.waitingMove = null;

            this.solver = null;
        }

    }

    ////////////////////////////////////////////////////////////////////////////
    isTerminated() {
        if(SOLVER==="bicolore"){
            return this.towers[1].length === DISK_COUNT*2;
        }else{
            return this.towers[TARGET_TOWER].length === DISK_COUNT;
        }

    }

    ////////////////////////////////////////////////////////////////////////////
    showArrows(fromIndex, toIndex) {
        this.hideArrows();

        const angle = (toIndex > fromIndex) ? 0 : Math.PI;
        this.arrows.arrowXN.rotation.y = this.arrows.arrowXP.rotation.y = angle;
        this.arrows.arrowXN.visible = (fromIndex === START_TOWER) || (toIndex === START_TOWER);
        this.arrows.arrowXP.visible = (fromIndex === TARGET_TOWER) || (toIndex === TARGET_TOWER);

        if (this.arrowAnimation) {
            // lazy creation of the animation
            this.arrowAnimation.play();
        } else {
            const tl = gsap.timeline({repeat: -1, yoyo: true});
            const nominalValue = arrowMaterial.emissiveIntensity;
            tl.to(arrowMaterial, {
                emissiveIntensity: 0,
                duration: .5
            }).to(arrowMaterial, {
                emissiveIntensity: nominalValue,
                duration: .5
            });
            this.arrowAnimation = tl;
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    hideArrows() {
        if (this.arrowAnimation) {
            this.arrowAnimation.pause();
        }
        for (const arrowName of Object.keys(this.arrows)) {
            this.arrows[arrowName].visible = false;
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    showTowerLabels() {
        for (const label of this.towerLabels) {
            label.visible = true;
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    hideTowerLabels() {
        for (const label of this.towerLabels) {
            label.visible = false;
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    moveDisk(from, to, speed) {
        if (from === to) {
            return "from and to are the same";
        }

        const fromHeight = this.towers[from].length;
        if (fromHeight === 0) {
            return "origin column is empty";
        }

        const toHeight = this.towers[to].length;
        if (toHeight === DISK_COUNT*2) {
            return "destination column is full";
        }

        const diskSize = this.towers[from][fromHeight - 1].userData.size;
        if (toHeight !== 0) {
            const toSize = this.towers[to][toHeight - 1].userData.size;
            if (diskSize > toSize) {
                return "cannot stack on a smaller disk";
            }
        }

        this.hanoi_array[diskSize-1] = to;

        // update the game state by moving the disk
        const disk = this.towers[from].pop();
        this.towers[to].push(disk);

        // create the animation of the disk move
        const fromAltitude = disk.position.y;
        const toAltitude = DISK_THICKNESS * toHeight;

        this.animation = this.createDiskTravelAnimation(
            disk,
            {x: TOWER_X[from], y: fromAltitude},
            {x: TOWER_X[to], y: toAltitude},
            speed
        );
        this.animation.disk = disk;

        this.movesDone++;

        // no error to be returned here
        return null;
    }

    ////////////////////////////////////////////////////////////////////////////
    createDiskTravelAnimation(disk, fromXY, toXY, speed) {
        const flightAltitude = POLE_HEIGHT + 2 * DISK_THICKNESS;
        const fromColumn = TOWER_X.indexOf(fromXY.x);
        const toColumn = TOWER_X.indexOf(toXY.x);

        const durationBase = ANIMATION_DURATION_QUANTA[speed];

        // move up to the flight altitude
        const tl = gsap.timeline({
            onStart: () => {
                disk.material = movingDiskMaterial;
                this.towerLabels[fromColumn].material = hilitedTowerLabelMaterial;
                this.towerLabels[toColumn].material = hilitedTowerLabelMaterial;
            },
            onComplete: () => {
                disk.material = disk.userData.defaultMaterial;
                this.towerLabels[fromColumn].material = towerLabelMaterial;
                this.towerLabels[toColumn].material = towerLabelMaterial;
                this.hideArrows();
                this.animation = null;

                // maybe this was the last move of the game
                if (this.isTerminated()) {
                    for (const disk of this.disks) { //disks
                        disk.material = finishedDiskMaterial;
                    }
                    for (let towerIndex = 0; towerIndex < TOWERS_COUNT; towerIndex++) {
                        this.towerLabels[towerIndex].material = towerLabelMaterial;
                    }

                    this?.onTerminated(this.movesDone === MIN_REQUIRED_MOVES);

                } else {
                    this?.onProgress(this.movesDone);
                }
            }
        });
        tl.to(disk.position, {
            y: flightAltitude,
            duration: durationBase,
            ease: "elastic",
        }).to(disk.position, {
            x: toXY.x,
            duration: durationBase,
            ease: "back.out"
            // }).to(disk.rotation, {
            //     z: ((fromColumn < toColumn) ? "-=" : "+=") + 2 * Math.PI,
            //     duration: durationBase * travelDist,
            //     ease: "expo.inOut"
        }).to(disk.position, {
            y: toXY.y,
            duration: durationBase,
            ease: "expo.inOut",
        });

        return tl;
    }

    ////////////////////////////////////////////////////////////////////////////
    animate(mode, speed) {
        if (this.solver) {
            switch (mode) {
                case 'D':
                    if (!this.animation && !this.paused) {
                        // time to start next move animation
                        const move = this.solver.next();
                        if (!move.done) {
                            const [from, to] = move.value;
                            this.moveDisk(from, to, speed);
                        } else {
                            this.solver = null;
                        }
                        if (mode === 'S') {
                            this.paused = true;
                        }
                    }
                    break;

                case 'S':
                    if (!this.animation) {
                        if (this.waitingMove) {
                            if (!this.paused) {
                                const [from, to] = this.waitingMove;
                                this.moveDisk(from, to, speed);
                                this.waitingMove = null;
                            }

                        } else {
                            const move = this.solver.next();
                            if (!move.done) {
                                const [from, to] = this.waitingMove = move.value;
                                this.showNextMove(from, to);
                                this.paused = true;
                            } else {
                                this.solver = null;
                            }
                        }
                    }
                    break;
            }
        }

        // TWEEN.update();
    }

    ////////////////////////////////////////////////////////////////////////////   
    showNextMove(fromIndex, toIndex) {
        for (let towerIndex = 0; towerIndex < TOWERS_COUNT; towerIndex++) {
            this.towerLabels[towerIndex].material = (towerIndex === fromIndex || towerIndex === toIndex) ? hilitedTowerLabelMaterial : towerLabelMaterial;
        }
        const fromTower = this.towers[fromIndex];
        fromTower[fromTower.length - 1].material = movingDiskMaterial;

        this.showArrows(fromIndex, toIndex);
    }

    ////////////////////////////////////////////////////////////////////////////   
    nextStep() {
        this.paused = false;
    }

    ////////////////////////////////////////////////////////////////////////////   
    startDemo(paused, currentMode) {

        console.log(this.hanoi_array);
        console.log("okok")
        let modeResolution = null;
        console.log(SOLVER);
        if(currentMode == "M" && this.towers[0].length != DISK_COUNT && SOLVER == "normal"){
            this.solver = solveForSteps(this.hanoi_array);
            this.paused = paused;
        }
        else if(currentMode == "M" && this.towers[0].length != DISK_COUNT && SOLVER == "multipegs"){
            console.log(TOWERS_COUNT);
            this.solver = solveForStepsMulti(this.hanoi_array, TOWERS_COUNT);
            this.paused = paused;
        } else {
            if(SOLVER === 'bicolore'){
                //this.solver = solverBicolore(DISK_COUNT, START_TOWER, 1, TARGET_TOWER);
                this.solver = solverBicoloreRecur(DISK_COUNT, START_TOWER, TARGET_TOWER, 1);
            }
            else if (SOLVER==='normal'){
                this.solver = solverClassique(DISK_COUNT, START_TOWER, TARGET_TOWER);
            }
            else {
                const tableau = [];
                tableau.push(0);
                tableau.push(TARGET_TOWER);
                for (let i = 1; i <= TARGET_TOWER-1; i++) {
                    tableau.push(i); // Ajoute les nombres de 1 à n
                }
                console.log("Tableau : ");
                console.log(tableau);
                this.solver = solverMultiPegs(DISK_COUNT, tableau, START_TOWER, TARGET_TOWER);
            }
        }

        this.paused = paused;
    }

    ////////////////////////////////////////////////////////////////////////////   
    terminateDemo() {
        if (this.animation) {
            this.animation.kill();
            this.animation.disk.material = this.animation.disk.userData.defaultMaterial;
            this.animation = null;
        }

        for (const text of this.towerLabels) {
            text.material = towerLabelMaterial;
        }

        this.reset();
    }

    ////////////////////////////////////////////////////////////////////////////   
    shiftTimeTo(step) {
        this.reset();
        this.startDemo(true);

        for (let current = 0; current < step; current++) {
            const move = this.solver.next().value;
            const [from, to] = move;

            this.towers[to].push(this.towers[from].pop());
            this.movesDone++;
        }

        for (let towerIndex = 0; towerIndex < 3; towerIndex++) {
            const tower = this.towers[towerIndex];
            const x = TOWER_X[towerIndex];

            for (let level = 0; level < tower.length; level++) {
                const disk = tower[level];
                disk.position.x = x;
                disk.position.y = DISK_THICKNESS * level;

                disk.material = disk.userData.defaultMaterial;
            }
        }

        if (this.isTerminated()) {
            this.onTerminated(true);
        } else {
            this.onProgress(this.movesDone, MIN_REQUIRED_MOVES);
            this.paused = true;
        }
    }

}
