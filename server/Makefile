IMAGE_NAME=bambora/na-merchant-api-demo
VERSION=latest

# Can specify arbitrary docker arguments on the command line.  Ex:
# make DOCKERBUILDARGS=--no-cache dockerbuild
# will pass --no-cache to the docker build command
DOCKERBUILDARGS?=

.PHONY: build shell run

all:

build:
	sed -i'.orig' -e "s/<VERSION>/$(VERSION)/g" app/server.py
	docker build $(DOCKERBUILDARGS) -t $(IMAGE_NAME):$(VERSION) .
	mv app/server.py.orig app/server.py

shell: build
	docker run --rm -it $(IMAGE_NAME):$(VERSION) /bin/sh

run: build
	docker run --rm -p 8080:8080 $(IMAGE_NAME):$(VERSION)

clean:
	# preceding dash is to prevent the makefile from erroring if the file/image doesn't exist
	# see: https://superuser.com/a/523510/150897
	-docker rmi $(IMAGE_NAME):$(VERSION)
