SHELL=/bin/bash
RANDOM := $(shell bash -c 'echo $$((1 + $$RANDOM %3))')
.DEFAULT_GOAL := all

all: go nodejs java

go:
	go get github.com/golang/protobuf/proto
	go get google.golang.org/protobuf/cmd/protoc-gen-go
	go get google.golang.org/grpc/cmd/protoc-gen-go-grpc
	protoc --proto_path=./ --go-grpc_out=examples/go/interaction interaction.proto
	protoc --proto_path=./ --go_out=examples/go/interaction interaction.proto
	cd examples/go/client &&	go mod download && go build -o ./client
	cd examples/go/server &&	go mod download && go build -o ./server

nodejs:
	npm install --unsafe-perm -g grpc-tools
	protoc --proto_path=./ --js_out=import_style=commonjs,binary:examples/nodejs/interaction interaction.proto
	grpc_tools_node_protoc --js_out=import_style=commonjs,binary:examples/nodejs/client/ --grpc_out=examples/nodejs/client/ --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin` interaction.proto
	grpc_tools_node_protoc --js_out=import_style=commonjs,binary:examples/nodejs/server/ --grpc_out=examples/nodejs/server/ --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin` interaction.proto
	yarn install --cwd=./examples/nodejs/client
	yarn install --cwd=./examples/nodejs/server

java:
	# protoc --proto_path=./ --plugin=protoc-gen-grpc-java --grpc-java_out=examples/java/interaction interaction.proto
	cp interaction.proto examples/java/client/src/main/proto/interaction.proto
	# cd examples/java/client && mvn clean protobuf:compile compile install
	rm examples/java/client/src/main/proto/interaction.proto
	cp interaction.proto examples/java/server/src/main/proto/interaction.proto
	cd examples/java/server && mvn clean && mvn protobuf:compile && mvn generate-sources install
	rm examples/java/server/src/main/proto/interaction.proto

client:
	if (($(RANDOM) == 1)); then \
    echo "USING JAVA CLIENT"; \
    java -jar examples/java/client/target/client-1.0-SNAPSHOT.jar; \
  elif (($(RANDOM) == 2)); then \
    echo "USING NODEJS CLIENT"; \
    node examples/nodejs/client/client.js; \
  elif (($(RANDOM) == 3)); then \
    echo "USING GO CLIENT"; \
    ./examples/go/client/client; \
  fi

server:
	if (($(RANDOM) == 1)); then \
    echo "USING JAVA SERVER"; \
    java -jar examples/java/server/target/server-1.0-SNAPSHOT.jar; \
  elif (($(RANDOM) == 2)); then \
    echo "USING NODEJS SERVER"; \
    node examples/nodejs/server/server.js; \
  elif (($(RANDOM) == 3)); then \
    echo "USING GO SERVER"; \
    ./examples/go/server/server; \
  fi
