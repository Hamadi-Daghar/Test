import {
    Mesh,
    Group,
    Vector2,
    LatheGeometry,
    ConeGeometry,
    CapsuleGeometry,
    BoxGeometry,
    TextureLoader,
    RepeatWrapping,
    MeshStandardMaterial,
    Color
} from 'three';

import {
    FontLoader
} from 'three/examples/jsm/loaders/FontLoader';

import {
    TextGeometry
} from 'three/examples/jsm/geometries/TextGeometry';

import {
    DISK_COUNT,
    DISK_BASE_DIAMETER, DISK_THICKNESS, DISK_DIAMETER_INCREMENT,
    TABLE_THICKNESS, SOLVER,
    TOWERS_COUNT, TOWER_X, TARGET_TOWER, TOWERS_DISTANCE,
    POLE_RADIUS, POLE_HEIGHT,
    POLE_LABELS_BASE_SIZE, DISK_COUNT_TO_TEXT_SIZE_RATIO, POLE_LABELS_Y,
    ARROWS_Y
} from './constants';

const textureLoader = new TextureLoader();
textureLoader.setPath('textures/');

const diskTexture = textureLoader.load('disturb-bw.jpg');
const woodTexture = textureLoader.load('hardwood2_diffuse.jpg');

const labelTexture = textureLoader.load('lavatile.jpg');
labelTexture.wrapS = RepeatWrapping;
labelTexture.wrapT = RepeatWrapping;
labelTexture.repeat.set(.2, .2);

const blankMaterial = new MeshStandardMaterial({
    color: 0xffffff,
});

const diskMaterialsBleu =
    new MeshStandardMaterial({
        color: new Color('skyblue'),
        map: diskTexture
    });

const diskMaterialsJaune =
    new MeshStandardMaterial({
        color: new Color('yellow'),
        map: diskTexture,
    });

const diskMaterials = [
    new MeshStandardMaterial({
        color: new Color('lime'),
        map: diskTexture
    }),
    new MeshStandardMaterial({
        color: new Color('skyblue'),
        map: diskTexture
    }),
    new MeshStandardMaterial({
        color: new Color('yellow'),
        map: diskTexture,
    }),
];

export const movingDiskMaterial = new MeshStandardMaterial({
    color: new Color('red'),
    map: diskTexture,
    emissive: new Color('red'),
    emissiveIntensity: .5
});

export const finishedDiskMaterial = new MeshStandardMaterial({
    color: new Color('gold'),
});

const poleMaterial = new MeshStandardMaterial({
    color: new Color('white'),
    map: woodTexture
});

const targetPoleMaterial = new MeshStandardMaterial({
    color: new Color('red'),
    map: woodTexture
});

const tableMaterial = new MeshStandardMaterial({
    color: new Color('white'),
    map: woodTexture
});

export const towerLabelMaterial = new MeshStandardMaterial({
    color: new Color('grey'),
    emissive: new Color('grey'),
    map: labelTexture,
    emissiveIntensity: 0.6
});

export const hilitedTowerLabelMaterial = new MeshStandardMaterial({
    color: new Color('red'),
    emissive: new Color('red'),
    map: labelTexture,
    emissiveIntensity: 0.4
});

export const arrowMaterial = new MeshStandardMaterial({
    color: new Color('darkred'),
    emissive: new Color('red'),
    emissiveIntensity: 0.6
});


export class Factory {
    constructor(scene) {
        this.scene = scene;
    }

    ////////////////////////////////////////////////////////////////////////////
    createPlatform3DModel() {
        const pole_geom = new CapsuleGeometry(POLE_RADIUS, POLE_HEIGHT, 32);

        console.log(TOWERS_COUNT);

        for (let i = 0; i < TOWERS_COUNT; i++) {
            const mesh = new Mesh(pole_geom, i !== TARGET_TOWER ? poleMaterial : targetPoleMaterial);
            mesh.position.x = TOWER_X[i];
            mesh.position.y = POLE_HEIGHT/2;

            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
        }

        const tableWidth = TOWERS_DISTANCE * (TOWERS_COUNT - 1) + DISK_BASE_DIAMETER * 1.1;
        const tableGeom = new BoxGeometry(tableWidth, TABLE_THICKNESS, DISK_BASE_DIAMETER * 1.1);
        const table = new Mesh(tableGeom, tableMaterial);
        table.position.y = -TABLE_THICKNESS / 2;
        table.receiveShadow = true;
        table.castShadow = true;

        this.scene.add(table);
    }

    ////////////////////////////////////////////////////////////////////////////
    createDisk3DModelsBleu(owner) {
        const disks = [];

        let diameter = DISK_BASE_DIAMETER;
        for (let i = 0; i < DISK_COUNT; i++) {
            const geom = this.makeDiskGeometry(diameter)

            const mat = diskMaterialsBleu;
            const disk = new Mesh(geom, mat);
            disk.receiveShadow = true;
            disk.castShadow = true;

            disk.userData = {
                size: DISK_COUNT - i,
                defaultMaterial: mat
            };

            disks.push(disk);
            this.scene.add(disk);

            diameter -= DISK_DIAMETER_INCREMENT;
        }

        return disks;
    }

    createDisk3DModelsJaune(owner) {
        const disks = [];

        let diameter = DISK_BASE_DIAMETER;
        for (let i = 0; i < DISK_COUNT; i++) {
            const geom = this.makeDiskGeometry(diameter)

            const mat = diskMaterialsJaune;
            const disk = new Mesh(geom, mat);
            disk.receiveShadow = true;
            disk.castShadow = true;

            disk.userData = {
                size: DISK_COUNT - i,
                defaultMaterial: mat
            };

            disks.push(disk);
            this.scene.add(disk);

            diameter -= DISK_DIAMETER_INCREMENT;
        }

        return disks;
    }

    createDisk3DModels(owner, colorName) {
        const disks = [];

        let diameter = DISK_BASE_DIAMETER;
        for (let i = 0; i < DISK_COUNT; i++) {
            const geom = this.makeDiskGeometry(diameter)
            const mat = diskMaterials[i % diskMaterials.length];

            const disk = new Mesh(geom, mat);
            disk.receiveShadow = true;
            disk.castShadow = true;

            disk.userData = {
                size: DISK_COUNT - i,
                defaultMaterial: mat
            };

            disks.push(disk);
            this.scene.add(disk);

            diameter -= DISK_DIAMETER_INCREMENT;
        }

        return disks;
    }

    ////////////////////////////////////////////////////////////////////////////
    makeDiskGeometry(diameter) {
        const externalRadius = diameter / 2;
        const holeRadius = POLE_RADIUS * 1.1;
        const y = DISK_THICKNESS / 2;
        const CHAMFER = DISK_COUNT / 20;

        const points = [
            new Vector2(holeRadius, y),
            new Vector2(holeRadius, -y),
            new Vector2(externalRadius - CHAMFER, -y),
            new Vector2(externalRadius, -y + CHAMFER),
            new Vector2(externalRadius, y - CHAMFER),
            new Vector2(externalRadius - CHAMFER, y),
            new Vector2(holeRadius, y),
        ];
        const geom = new LatheGeometry(points, 62);

        // shift geometry so that the local origin is in the bottom face of the disk 
        // (makes it a bit simpler to position it afterwards)
        geom.translate(0, DISK_THICKNESS / 2, 0);

        // add some random rotation so that all textures wont" be aligned when disks are stacked
        geom.rotateY(Math.random() * 2 * Math.PI);

        return geom;
    }

    ////////////////////////////////////////////////////////////////////////////
    async createTowerLabels() {
        const loader = new FontLoader();
        const towerLabels = [];

        const font = await loader.loadAsync("fonts/helvetiker_bold.typeface.json");
        for (let towerIndex = 0; towerIndex < TOWERS_COUNT; towerIndex++) {
            const geom = new TextGeometry(
                `${towerIndex + 1}`, {
                    font: font,
                    size: POLE_LABELS_BASE_SIZE * DISK_COUNT / DISK_COUNT_TO_TEXT_SIZE_RATIO,
                    height: DISK_COUNT / DISK_COUNT_TO_TEXT_SIZE_RATIO
                }
            );
            const mesh = new Mesh(geom, towerLabelMaterial);

            // move the pivot to the center of the bottom face so that the numbers rotate around the tower axis
            geom.computeBoundingBox();
            const width = geom.boundingBox.max.x - geom.boundingBox.min.x;
            const depth = geom.boundingBox.max.z - geom.boundingBox.min.z;
            mesh.geometry.translate(-width / 2 - 1, 0, -depth / 2);
            mesh.position.x = TOWER_X[towerIndex];
            mesh.position.y = POLE_LABELS_Y;
            mesh.visible = false;

            this.scene.add(mesh);

            towerLabels.push(mesh);

            mesh.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
                // make the text always facing the camera
                this.quaternion.copy(camera.quaternion);
            }
        }

        return towerLabels;
    }

    ////////////////////////////////////////////////////////////////////////////
    createMoveArrows() {
        const ARROW_BASE_RADIUS = POLE_RADIUS * 2
        const ARROW_TIP_LENGTH = POLE_RADIUS * 6;

        const coneGeom = new ConeGeometry(ARROW_BASE_RADIUS, ARROW_TIP_LENGTH);
        const arrowXP = new Group();

        const HALF_LENGTH = 1;
        for (let i = 0; i < 2 * HALF_LENGTH + 1; i++) {
            const mesh = new Mesh(coneGeom, arrowMaterial);
            mesh.translateY(ARROW_TIP_LENGTH * (i - HALF_LENGTH) * 1.5);
            arrowXP.add(mesh);
        }

        arrowXP.rotateZ(-Math.PI / 2);
        arrowXP.rotateY(-Math.PI / 2);
        arrowXP.position.set(TOWERS_DISTANCE / 2, ARROWS_Y);
        arrowXP.visible = false;
        this.scene.add(arrowXP);

        const arrowXN = arrowXP.clone();
        arrowXN.position.set(-TOWERS_DISTANCE / 2, ARROWS_Y);
        arrowXN.visible = false;
        this.scene.add(arrowXN);

        return {
            arrowXP,
            arrowXN
        }
    }
}