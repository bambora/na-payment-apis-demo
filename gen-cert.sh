#!/bin/sh
set -e

cd server/app

openssl genrsa -out server_rootCA.key 2048
openssl req -x509 -new -nodes -key server_rootCA.key -sha256 -days 730 -out server_rootCA.pem -config ../conf/openssl.conf
openssl req -new -nodes -newkey rsa:2048 -sha256 -out domain.csr -keyout domain.key -config ../conf/openssl.conf
openssl x509 -req -in domain.csr -CA server_rootCA.pem -CAkey server_rootCA.key -CAcreateserial -sha256 -days 365 -out domain.crt -extfile ../conf/openssl.ext.conf
