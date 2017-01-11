NAME=beanstream/payments_demo
VERSION=0.0.1
CORE_VERSION=HEAD

all: prepare login

prepare:
	bash scripts/build.sh

build: prepare
	docker build -t $(NAME):$(VERSION) --rm .

build_no_cache: prepare
	docker build --no-cache -t $(NAME):$(VERSION) --rm .

tag:
	docker tag $(NAME):$(VERSION) 056252067802.dkr.ecr.us-west-2.amazonaws.com/$(NAME):$(VERSION)

tag_latest:
	docker tag $(NAME):$(VERSION) 056252067802.dkr.ecr.us-west-2.amazonaws.com/$(NAME):latest

#test:
#	nosetests -sv

login:
	$(shell aws ecr get-login --region us-west-2)

push: login
	docker push 056252067802.dkr.ecr.us-west-2.amazonaws.com/$(NAME):$(VERSION)

push_latest: login
	docker push 056252067802.dkr.ecr.us-west-2.amazonaws.com/$(NAME):latest

shell:
	docker run -i -t $(NAME):$(VERSION) /bin/sh

run:
	docker run -i -t -p 80:8080 $(NAME):$(VERSION)

run_daemon:
	docker run -d --env-file local.env -p 80:8080 $(NAME):$(VERSION)
