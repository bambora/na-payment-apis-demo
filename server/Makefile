REPO_BASE=056252067802.dkr.ecr.us-west-2.amazonaws.com
APP_NAME=na-merchant-api-demo
IMAGE_NAME=bambora/$(APP_NAME)
VERSION=0.0.3
EB_BUCKET=eb-docker-deploy
EB_APP_ENV_NAME=$(APP_NAME)
ZIP=$(EB_APP_ENV_NAME).zip

all:

build:
	sed -i'.orig' -e "s/<VERSION>/$(VERSION)/g" app/server.py
	docker build -t $(IMAGE_NAME):$(VERSION) --rm .
	mv app/server.py.orig app/server.py

build_no_cache:
	docker build --no-cache -t $(NAME):$(VERSION) --rm .

tag:
	docker tag $(IMAGE_NAME):$(VERSION) $(REPO_BASE)/$(IMAGE_NAME):$(VERSION)

tag_latest:
	docker tag $(IMAGE_NAME):$(VERSION) $(REPO_BASE)/$(IMAGE_NAME):latest

login:
	$(shell aws ecr get-login --region us-west-2)

push: login
	docker push $(REPO_BASE)/$(IMAGE_NAME):$(VERSION)

push_latest: login
	docker push $(REPO_BASE)/$(IMAGE_NAME):latest

shell:
	docker run -it $(NAME):$(VERSION) /bin/ash

shell_latest:
	docker run -it $(NAME):$(VERSION) /bin/ash

run:
	docker run -p 80:8080 $(IMAGE_NAME):$(VERSION)

run_latest:
	docker run -p 80:8080 $(IMAGE_NAME):latest

deploy: login
	# Upload zipped Dockerrun file to S3
	sed -i'.orig' -e "s/VERSION/$(VERSION)/g" Dockerrun.aws.json
	zip -r $(ZIP) Dockerrun.aws.json
	mv Dockerrun.aws.json.orig Dockerrun.aws.json

	aws s3 cp $(ZIP) s3://$(EB_BUCKET)/$(ZIP)

	# Create new app version with zipped Dockerrun file
	aws elasticbeanstalk create-application-version --application-name $(APP_NAME) \
	--version-label $(VERSION) \
	--source-bundle S3Bucket=$(EB_BUCKET),S3Key=$(ZIP) \
	--region us-west-2

	# Update the environment to use the new app version
	aws elasticbeanstalk update-environment --application-name $(APP_NAME) \
	--environment-name $(EB_APP_ENV_NAME) \
	--version-label $(VERSION) \
	--region us-west-2
