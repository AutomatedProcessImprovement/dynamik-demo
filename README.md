# dynamik: A tool for performance drift detection in business processes

This repository contains everything needed to deploy an instance of *dynamik* using containers.

## Online demonstrator

You may try *dynamik* online [**here**](http://dynamik.cloud.ut.ee).

## Requirements

  - Docker (version tested: 27.1.1)

## Deployement instructions

The repository already contains everything needed for deplying a fully functional version of *dynamik*.
For deploying your own instance:
  
  - Clone this repository with `git clone https://github.com/AutomatedProcessImprovement/dynamik-demo.git`
  - Navigate to the cloned repository with `cd dynamik-demo`
  - Deploy the application with `docker compose up -d`
  - Navigate to `localhost` in your web browser. The application should be running. 

## Customize deployement

You can customize the deployement modifying the `compose.yaml` file.
The frontend exposes the interface in port 80 by default.
Both the frontend and the workers can be configured with the following environment properties:

```
  RABBITMQ_HOST: <queue name>
  RABBITMQ_PORT: <rabbitmq port>
  RABBITMQ_USER: <rabbitmq user>
  RABBITMQ_PASS: <rabbitmq password>
  LIVE_STATUS_EXCHANGE: <name of the exchange for the live updates> 
  EXPERIMENTS_QUEUE: <name of the queue for the experiments>
  BASE_DATA_PATH: <directory where data is stored in the containers>
```

Both the frontend and the workers should share a volume, mounted on the directory specified by the env variable `BASE_DATA_PATH`. 
This volume will be used to store log files and experiment results.
By default, docker will create 5 instances of the dynamik-worker.
If you want to modify this, you can change the attribute `deploy.replicas` to the number of workers you want.

```
  deploy:
    mode: replicated
    replicas: <number of workers>
    restart_policy:
      condition: on-failure
      delay: 60s
      max_attempts: 3
      window: 120s
```
