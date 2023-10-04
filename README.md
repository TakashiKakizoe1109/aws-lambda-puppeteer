aws-lambda-puppeteer
===

The base project that runs Puppeteer with container-type Lambda.

[Deploy Node.js Lambda functions with container images](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-image.html)

# Initial construction

```shell
docker build --platform linux/amd64 -t docker-image:aws-lambda-pupppeteer .
```

**If using the ARM64 instruction set architecture**

```shell
docker build --platform linux/arm64 -t docker-image:aws-lambda-pupppeteer .
```

# Local image test

## 1. run container
```shell
docker run -p 9000:8080 docker-image:aws-lambda-pupppeteer
```

## 2. run with curl command

```shell
curl "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{"url": "https://google.com"}'
```

## 3. stop container

```shell
docker stop $(docker ps -q --filter "ancestor=docker-image:aws-lambda-pupppeteer")
```
