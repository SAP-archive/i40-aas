# Protobuf-based AAS Interactions

## Instructions
Generate code from `interaction.proto` and build all client & server applications via:
```bash
make all
```

Launch a gRPC server by running (the command will use a Go/Java/NodeJS server at random):
```bash
make server
```

Now start a gRPC client by running (the command will use a Go/Java/NodeJS client at random):
```bash
make client
```
