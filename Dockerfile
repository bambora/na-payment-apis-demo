FROM python:3.6.0-alpine

COPY ./requirements.txt /app/requirements.txt

WORKDIR /app

RUN pip3 install -r requirements.txt

COPY app/ /app

ENTRYPOINT [ "python" ]

CMD [ "app.py" ]
