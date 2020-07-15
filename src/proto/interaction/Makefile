.DEFAULT_GOAL := all

all: proto-gen go nodejs java

go:
	printenv

nodejs:
	npm install -g grpc-tools
	grpc_tools_node_protoc --js_out=import_style=commonjs,binary:examples/nodejs/grpc-client/ --grpc_out=examples/nodejs/grpc-client/ --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin` interaction.proto
	grpc_tools_node_protoc --js_out=import_style=commonjs,binary:examples/nodejs/grpc-server/ --grpc_out=examples/nodejs/grpc-server/ --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin` interaction.proto
	yarn install --cwd=./examples/nodejs/grpc-client
  yarn install --cwd=./examples/nodejs/grpc-server
  yarn install --cwd=./examples/nodejs/protobufjs-client

java:
	printenv

proto-gen:
	go get google.golang.org/protobuf/cmd/protoc-gen-go
	protoc --proto_path=./ --go_out=examples/go/interaction --go_opt=paths=source_relative interaction.proto
	protoc --proto_path=./ --java_out=examples/java/interaction interaction.proto
	protoc --proto_path=./ --js_out=import_style=commonjs,binary:examples/nodejs/interaction interaction.proto
