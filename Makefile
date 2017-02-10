REPO_BASE=056252067802.dkr.ecr.us-west-2.amazonaws.com
APP_NAME=payments-api-demo
IMAGE_NAME=beanstream/$(APP_NAME)
VERSION=0.0.1
EB_BUCKET=eb-docker-deploy
EB_APP_ENV_NAME=$(APP_NAME)
ZIP=$(EB_APP_ENV_NAME).zip

all:

build:
	docker build -t $(IMAGE_NAME):$(VERSION) .

run:
	docker run -p 5000:5000 $(IMAGE_NAME):$(VERSION)

run_latest:
	docker run -p 5000:5000 $(IMAGE_NAME):latest

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

deploy: login
    # Set version string
    #sed -i'' -e "s/VERSION/$(VERSION)/g" Dockerrun.aws.json

	# Upload zipped Dockerrun file to S3
	zip -r $(ZIP) Dockerrun.aws.json
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
