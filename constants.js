export const RunningMode = Object.freeze({
    MANUAL: 'M',
    STEP_BY_STEP: 'S',
    DEMO: 'D'
});

export const AnimationSpeed = Object.freeze({
    SLOW: 'S',
    NORMAL: 'N',
    FAST: 'F',
    ULTRA_FAST: 'U'
});

function topt(n, r) {
    const res = Array.from({ length: r - 2 }, () => Array(n).fill(0));
    const kn = Array.from({ length: r - 2 }, () => Array(n).fill(0));

    for (let rr = 0; rr < r - 2; rr++) {
        res[rr][0] = 1;
    }
    for (let nn = 1; nn < n; nn++) {
        res[0][nn] = 2 * res[0][nn - 1] + 1;
    }
    for (let rr = 1; rr < r - 2; rr++) {
        for (let nn = 1; nn < n; nn++) {
            let kmin = 0;
            let coutMin = res[rr - 1][nn];
            for (let k = 0; k < nn; k++) {
                const x = 2 * res[rr][k] + res[rr - 1][nn - k - 1];
                if (x < coutMin) {
                    kmin = k;
                    coutMin = x;
                }
            }
            kn[rr][nn] = kmin + 1;
            res[rr][nn] = coutMin;
        }
    }
    return { res, kn };
}

console.log(topt(10, 3));



// configuration of constants from the query parameters
const urlParams = new URLSearchParams(window.location.search);
export const DISK_COUNT = parseInt(urlParams.get('d') || '10');
export const TOWERS_COUNT = parseInt(urlParams.get('t') || '3');

export const SOLVER = urlParams.get('solver') || 'normal';
export const TOPT = topt(DISK_COUNT, TOWERS_COUNT);

let MIN_REQUIRED;
switch (SOLVER) {
    case 'normal':{
        MIN_REQUIRED = Math.pow(2, DISK_COUNT) - 1;
        break;
    }
    case 'multipegs':{
        MIN_REQUIRED = TOPT.res[TOWERS_COUNT - 3][DISK_COUNT - 1];
        break;
    }
    case 'bicolore':{
        MIN_REQUIRED = Math.pow(2, DISK_COUNT + 2) - DISK_COUNT - 6;
        break;
    }
}
export const MIN_REQUIRED_MOVES = MIN_REQUIRED;


export const POLE_RADIUS = DISK_COUNT * .2;

export const DISK_THICKNESS = Math.round(DISK_COUNT * .4);
export const DISK_DIAMETER_INCREMENT = DISK_COUNT * .5;
export const DISK_BASE_DIAMETER = POLE_RADIUS * 2 + DISK_DIAMETER_INCREMENT * (DISK_COUNT + 1);

let pHeight =DISK_THICKNESS * (DISK_COUNT + 1);
if(SOLVER==="bicolore")
    pHeight *= 2;
export const POLE_HEIGHT = pHeight;


export const TABLE_THICKNESS = DISK_THICKNESS;

export const START_TOWER = 0;
export const TARGET_TOWER = TOWERS_COUNT - 1;
export const TOWERS_DISTANCE = DISK_BASE_DIAMETER * 1.1;
export const TOWER_X = [];
let x = -(TOWERS_COUNT - 1) * TOWERS_DISTANCE / 2;
for (let i = 0; i < TOWERS_COUNT; i++, x += TOWERS_DISTANCE) {
    TOWER_X.push(x);
}

export const HANOI_ARRAY_REPRESENTATION = [];
for (let i = 0; i < DISK_COUNT; i++){
    HANOI_ARRAY_REPRESENTATION.push(0);
}

export const POLE_LABELS_BASE_SIZE = 6;
export const POLE_LABELS_Y = POLE_HEIGHT + 6 * DISK_THICKNESS;
export const DISK_COUNT_TO_TEXT_SIZE_RATIO = 6;

export const ARROWS_Y = POLE_HEIGHT + 7 * DISK_THICKNESS;
