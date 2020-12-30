BUILD
======

`docker build -t build-org .`

Publish
-------
```sh
VERSION=0.2
docker tag build-org xuxxux/org-re-reveal-builder:${VERSION}
docker push xuxxux/org-re-reveal-builder
```
