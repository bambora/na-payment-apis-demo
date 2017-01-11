#!/bin/bash

echo "Building frontend"
rm -rf serverApp/static
cd browserApp
npm run build

echo "Renaming React app paths"
mv build/static/js/*.js build/static/js/bundle.js
mv build/static/js/*.js.map build/static/js/bundle.js.map
mv build/static/css/*.css build/static/css/main.css
mv build/static/css/*.css.map build/static/css/main.css.map
mv build/favicon.ico build/static/favicon.ico

echo "Copying MDL dependencies"
cp node_modules/react-mdl/extra/material.css build/static/css/material.css
cp node_modules/react-mdl/extra/material.js build/static/js/material.js

echo "Moving Frontend build artifacts to Flasks static dir"
mv build/static ../serverApp/static
rm -rf build
cd ../

