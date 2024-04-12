#!/bin/bash

# Arrêter le conteneur Docker nommé hanoi3d s'il est en cours d'exécution
docker stop hanoi3d

# Construire l'image Docker avec make (assurez-vous que le Makefile est correctement configuré)
make image

# Démarrer le conteneur Docker avec make (assurez-vous que le Makefile est correctement configuré)
make start
