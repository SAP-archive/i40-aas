package sap.i40aas.interaction.server;

import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.grpc.stub.StreamObserver;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

import sap.i40aas.interaction.proto.*;

public class InteractionServer {
  private static final Logger logger = Logger.getLogger(InteractionServer.class.getName());

  private Server server;

  private void start() throws IOException {
    /* The port on which the server should run */
    int port = 50051;
    server = ServerBuilder.forPort(port)
        .addService(new InteractionIngressImpl())
        .build()
        .start();
    logger.info("Server started, listening on " + port);
    Runtime.getRuntime().addShutdownHook(new Thread() {
      @Override
      public void run() {
        // Use stderr here since the logger may have been reset by its JVM shutdown hook.
        System.err.println("*** shutting down gRPC server since JVM is shutting down");
        try {
          InteractionServer.this.stop();
        } catch (InterruptedException e) {
          e.printStackTrace(System.err);
        }
        System.err.println("*** server shut down");
      }
    });
  }

  private void stop() throws InterruptedException {
    if (server != null) {
      server.shutdown().awaitTermination(30, TimeUnit.SECONDS);
    }
  }

  /**
   * Await termination on the main thread since the grpc library uses daemon threads.
   */
  private void blockUntilShutdown() throws InterruptedException {
    if (server != null) {
      server.awaitTermination();
    }
  }


  public static void main(String[] args) throws IOException, InterruptedException {
    final InteractionServer server = new InteractionServer();
    server.start();
    server.blockUntilShutdown();
  }

  static class InteractionIngressImpl extends InteractionIngressGrpc.InteractionIngressImplBase {

    @Override
    public void sendInteractionMessage(InteractionMessage req, StreamObserver<InteractionStatus> responseObserver) {
      System.out.println(req.toString());
      InteractionStatus reply = InteractionStatus.newBuilder().setCodeValue(1).build();
      responseObserver.onNext(reply);
      responseObserver.onCompleted();
    }
  }
}
