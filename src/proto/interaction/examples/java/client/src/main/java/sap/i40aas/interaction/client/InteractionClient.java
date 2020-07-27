package sap.i40aas.interaction.client;

import io.grpc.Channel;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.StatusRuntimeException;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;

import sap.i40aas.interaction.proto.*;

public class InteractionClient {
  private static final Logger logger = Logger.getLogger(InteractionClient.class.getName());
  public static void main( String[] args ) {
    System.out.println( "Hello World!" );
  }
}
