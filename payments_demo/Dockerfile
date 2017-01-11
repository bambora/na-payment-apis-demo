FROM alpine:3.4

RUN mkdir /code
WORKDIR /code

RUN apk add --no-cache --update \
  python3 build-base python3-dev libffi-dev postgresql-dev \
  nginx supervisor openssl ca-certificates \
  && python3 -m ensurepip \
  && rm -rf /usr/lib/python*/ensurepip \
  && rm -rf /root/.cache \
  && pip3 install --upgrade pip gunicorn \
  && rm -rf /var/cache/apk/* \
  && apk del build-base python3-dev

# Setup nginx
ADD conf/etc /etc/
RUN mkdir -p /etc/nginx/sites-enabled \
    && mkdir -p /run/nginx \
    && ln -s /etc/nginx/sites-available/app.conf /etc/nginx/sites-enabled/app.conf

# Setup supervisord
RUN mkdir -p /var/log/supervisor/conf.d

# Copy server app
ADD serverApp /code/
RUN pip3 install -r /code/requirements.txt

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
