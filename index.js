const MIN_DISK_COUNT = 3;
const MAX_DISK_COUNT = 20;

const DEFAULT_DISK_COUNT = 10;

const MIN_TOWER_COUNT = 3;
const MAX_TOWER_COUNT = 10;
const DEFAULT_TOWER_COUNT = 3;

const disk_count_input = document.getElementById("disk_count");
const disk_count_display = document.getElementById("disk_count_value");
const tower_count_input = document.getElementById("tower_count");
const tower_count_display = document.getElementById("tower_count_value");
const solver_display = document.getElementById("solver_value");
const solver_input = document.getElementById("solver");

function set_range_settings(id, min, max, initial_value) {
    document.getElementById(`min_${id}`).innerText = min;
    document.getElementById(`max_${id}`).innerText = max;
    const input = document.getElementById(id);
    input.setAttribute("min", min);
    input.setAttribute("max", max);
    input.setAttribute("value", initial_value);
}

set_range_settings('disk_count', MIN_DISK_COUNT, MAX_DISK_COUNT, DEFAULT_DISK_COUNT);
set_range_settings('tower_count', MIN_TOWER_COUNT, MAX_TOWER_COUNT, DEFAULT_TOWER_COUNT);

let disk_count;
let tower_count;
let solver;

function update_disk_count() {
    disk_count = disk_count_input.value;
    disk_count_display.innerText = disk_count;
}

function update_tower_count() {
    tower_count = tower_count_input.value;
    tower_count_display.innerText = tower_count;
}

function update_solver() {
    solver = solver_input.value;
    solver_display.innerText = solver;
}

disk_count_input.addEventListener('input', () => {
    update_disk_count();
});

tower_count_input.addEventListener('input', () => {
    update_tower_count();
});

solver_input.addEventListener('input', () => {
    update_solver();
});

update_disk_count();
update_tower_count();
update_solver();

document.getElementById('btn_start').addEventListener('click', (e) => {
    e.preventDefault();
    console.log(`starting puzzle with ${disk_count} disks and ${tower_count} towers.`);
    if(solver == 'normal')
        tower_count = 3;
    window.location = `/3dview.html?d=${disk_count}&t=${tower_count}&solver=${solver}`;
});

document.addEventListener('DOMContentLoaded', function() {
    // Sélectionnez l'élément <select> pour le mode de résolution
    const solverSelect = document.getElementById('solver');

    // Sélectionnez l'élément input pour le nombre de piquets
    const towerCount = document.getElementById('tower_count');

    // Sélectionnez le conteneur du nombre de piquets en utilisant l'ID de l'élément input associé
    const towerCountContainer = towerCount.parentNode.parentNode;

    // Fonction pour mettre à jour la visibilité et la valeur du contrôle du nombre de piquets
    function updateTowerCountVisibilityAndValue() {
        if (solverSelect.value === 'normal' || solverSelect.value === 'bicolore') {
            // Cachez le contrôle et réinitialisez la valeur en mode Normal
            towerCountContainer.style.display = 'none';
            /*
            tower_count_display.innerText = 3; // Réinitialisez le nombre de piquets à 3 pour le mode Normal
            tower_count = 3;*/
        } else {
            // Réaffichez le contrôle en mode Multipegs
            towerCountContainer.style.display = 'block';
        }
    }

    // Ajoutez un écouteur d'événements 'change' au menu déroulant
    solverSelect.addEventListener('change', updateTowerCountVisibilityAndValue);

    // Appelez la fonction initialement pour définir la visibilité et la valeur correctes au chargement de la page
    updateTowerCountVisibilityAndValue();
});