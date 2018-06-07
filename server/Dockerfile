# Bambora na-payment-apis-demo

FROM python:3.6.0-alpine

# Install platform dependencies & setup flask application
RUN mkdir -p /deploy/app/blueprints \
  && mkdir -p /deploy/app/static \
  && mkdir -p /deploy/app/templates

COPY app/requirements.txt /deploy/app/

RUN apk add --no-cache --update python3 \
  && python3 -m ensurepip \
  && rm -rf /usr/lib/python*/ensurepip \
  && rm -rf /root/.cache \
  && apk add --no-cache --update \
     build-base python3-dev libffi-dev postgresql-dev \
     nginx supervisor \
  && pip3 install --upgrade pip \
  && pip3 install virtualenv gunicorn \
  && pip3 install -r /deploy/app/requirements.txt \
  && apk del \
    build-base python3-dev \
  && apk add logrotate \
  && rm -rf /var/cache/apk/*

COPY app/*.py /deploy/app/
COPY app/blueprints /deploy/app/blueprints
COPY app/static /deploy/app/static
COPY app/templates /deploy/app/templates

# Setup nginx
RUN mkdir -p /run/nginx \
  && mkdir -p /etc/nginx/sites-available \
  && mkdir /etc/nginx/sites-enabled \
  && rm -f /etc/nginx/sites-enabled/default
COPY flask.conf /etc/nginx/sites-available/
RUN ln -s /etc/nginx/sites-available/flask.conf /etc/nginx/sites-enabled/flask.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Setup supervisord
RUN mkdir -p /var/log/supervisor/conf.d
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Setup logrotate
RUN touch /var/log/messages

# get the apple pay cert in place
COPY ApplePayProcessingCert.crt /deploy/app/ApplePayProcessingCert.crt
COPY ApplePayProcessingKey.key /deploy/app/ApplePayProcessingKey.key

# Start processes
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
