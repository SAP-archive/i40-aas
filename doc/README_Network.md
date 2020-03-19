
---
## Joining service containers locally
Service containers can be added to the Compose setup as follows: 

Verify that the network `i40-aas_default` exists
```bash 
$ docker network ls
NETWORK ID          NAME                   DRIVER              SCOPE
825a5b8a43f8        bridge                 bridge              local
28788e024d61        host                   host                local
74bfa9f289c0        i40-aas_default        bridge              local
b3d4c74514f2        none                   null                local
```

Build your container and join the network:
```bash 
## Exemplary for i40-aas-storage-adapter-ain:

# Build & tag the container
$ docker build -t i40-aas-storage-adapter-ain .

# Join & run the container
$ docker run --network="i40-aas_default" --name="i40-aas-storage-adapter-ain" i40-aas-storage-adapter-ain
```

Verify that the container is now part of the network:
```bash 
$ docker network inspect i40-aas_default
```
You should find your container in the list, somewhat resembling this:
```json
[
    {
        "Name": "i40-aas_default",
        ...
        "Containers": {
            "0b48213c2d39eb9d36539105cbd1415d0128024e1ba5c8875e147e319638480e": {
                "Name": "i40-aas-storage-adapter-ain",
                "EndpointID": "f57a8301071f12010586fe6b767ed50a90024512e6ddf10f7795685547e9cf86",
                "MacAddress": "########",
                "IPv4Address": "########",
                "IPv6Address": "########"
            },
            ...
        }
    }
]
```

Now you can verify that hosts are resolved correctly within the container and connection can be established:
```bash 
# Retrieve the container ID
$ docker ps
CONTAINER ID   IMAGE                         COMMAND         CREATED         STATUS         PORTS       NAMES
2f93d0cd60b1   i40-aas-storage-adapter-ain   "npm run dev"   5 seconds ago   Up 4 seconds   3000/tcp    i40-aas-storage-adapter-ain
...

# Install install ping
$ docker exec -it 2f93d0cd60b1 apt-get update
...
$ docker exec -it 2f93d0cd60b1 apt-get install iputils-ping
...

# Ping any other container
$ docker exec -it 2f93d0cd60b1 ping postgres

PING postgres (192.168.16.6) 56(84) bytes of data.
64 bytes from i40-aas_postgres_1.i40-aas_default (192.168.16.6): icmp_seq=1 ttl=64 time=0.250 ms
64 bytes from i40-aas_postgres_1.i40-aas_default (192.168.16.6): icmp_seq=2 ttl=64 time=0.181 ms
...
```
