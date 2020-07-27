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
  public static void main( String[] args ) {
    System.out.println( "Hello World!" );
  }
}
