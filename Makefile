SHELL = /bin/bash

.ONESHELL:

APP_ID=hanoi3d

# -name
IMAGE_NAME=$(APP_ID)

# - tags
BRANCH_SUFFIX?=$$(echo "-"$$(git branch --show-current) | sed 's/-main//' | sed 's!/!_!g')
LATEST=latest$(BRANCH_SUFFIX)
VERSION?=$$(git describe --long | tr -d 'v' | cut -d- -f 1-2 | sed 's/-0$$//')$(BRANCH_SUFFIX)

LOCAL_PORT=8000

default: help

.PHONY: help
help: 				## show this help
	@echo -e "\n\033[37;1mAvailable targets:\033[0m\n"
	egrep -h '\s##\s' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' \
		| sort
	echo ""

.PHONY: install-deps
install-deps:		## installs development dependencies
	@echo "---------- Installing development dependencies..."
	npm install

.PHONY: bundle
bundle:				## bundles the JS application
	@echo "---------- Bundling the application..."
	npm run build

.PHONY: image
image:				## builds the Docker image
image: bundle
	@echo "---------- Building Docker image $(IMAGE_NAME):$(VERSION)..."
	docker buildx build \
		-f docker/Dockerfile \
		-t $(IMAGE_NAME):$(LATEST) \
		-t $(IMAGE_NAME):$(VERSION) \
		.

.PHONY: clean-build
clean-build:		## cleanup build artefacts
	@echo "---------- Deleting build artefacts..."
	rm -rf dist/

.PHONY: clean-deps
clean-deps:			## cleanup development dependencies
	@echo "---------- Deleting development dependencies..."
	rm -rf node_modules/

.PHONY: clean-all
clean-all:			## cleans all
clean-all: clean-build clean-deps

.PHONY: start
start:				## starts the image locally
	@echo "---------- Starting the application in background..."
	docker run -q -d --rm --name $(APP_ID) -p $(LOCAL_PORT):80 $(IMAGE_NAME):$(LATEST) > /dev/null \
	&& docker ps \
	&& echo -e "\nApplication is running and can be accessed at : http://localhost:$(LOCAL_PORT)"

.PHONY: stop
stop:				## stops the local application
	@docker stop $(APP_ID) > /dev/null \
	&& echo "Application $(APP_ID) stopped"
