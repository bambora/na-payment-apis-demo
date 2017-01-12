FROM python:3.6.0-alpine

MAINTAINER Aengus Bates <aengus.bates@bambora.com>

# We copy just the requirements.txt first to leverage Docker cache
COPY ./requirements.txt /app/requirements.txt

WORKDIR /app

RUN pip3 install -r requirements.txt

COPY app/ /app

ENTRYPOINT [ "python" ]

CMD [ "app.py" ]
