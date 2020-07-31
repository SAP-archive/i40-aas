package sap.i40aas.interaction.client;

import sap.i40aas.interaction.proto.*;

import com.google.protobuf.util.JsonFormat;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.StatusRuntimeException;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

public class InteractionClient {

    public static void main(final String args[]){

      JSONParser jsonParser = new JSONParser();

      try (FileReader reader = new FileReader("./examples/sample_interaction.json"))
      {
          //Read JSON file
          Object obj = jsonParser.parse(reader);

          // Construct an InteractionMessage Builder, as described here:
          // https://developers.google.com/protocol-buffers/docs/reference/java-generated#builders
          InteractionMessage.Builder interactionBuilder = InteractionMessage.newBuilder();

          // Fill InteractionMessage builder with JSON content
          JsonFormat.parser().merge(obj.toString(), interactionBuilder);

          // Construct the actual InteractionMessage object
          InteractionMessage interactionMessage = interactionBuilder.build();
          // TODO: check that this is really the correct message format and correctly filled.

          // Create a communication channel to the server, known as a Channel. Channels are thread-safe
          // and reusable. It is common to create channels at the beginning of your application and reuse
          // them until the application shuts down.
          String target = "localhost:50051";
          ManagedChannel channel = ManagedChannelBuilder.forTarget(target)
          // Channels are secure by default (via SSL/TLS). For the example we disable TLS to avoid
          // needing certificates.
          .usePlaintext()
          .build();
          try {
            // Tobi: I took this way of building the client from this example:
            // https://github.com/grpc/grpc-java/blob/v1.30.0/examples/src/main/java/io/grpc/examples/helloworld/HelloWorldClient.java
            // Also, for more general info see: https://grpc.io/docs/languages/java/basics/#client

            // Tobi: However, I didn't managed to correctly compile the protobuf classes for java
            // _ and I assume that's way newBlockingStub and channel aren't matching as they are in the example:
            InteractionIngressGrpc.InteractionIngressBlockingStub blockingStub = InteractionIngressGrpc.newBlockingStub(channel);

            try {
              InteractionStatus response = blockingStub.sendInteractionMessage(interactionMessage);
              System.out.println(response.toString());
            } catch (StatusRuntimeException e) {
              System.out.println( "RPC failed: {0}" + e.getStatus().toString());
              return;
            }
          } finally {
            // ManagedChannels use resources like threads and TCP connections. To prevent leaking these
            // resources the channel should be shut down when it will no longer be used. If it may be used
            // again leave it running.
            try {
              channel.shutdownNow().awaitTermination(5, TimeUnit.SECONDS);
            } catch (InterruptedException ie) {
              System.out.println("Channel termination failed" + ie.getMessage());
            }
          }

      } catch (FileNotFoundException e) {
          e.printStackTrace();
      } catch (IOException e) {
          e.printStackTrace();
      } catch (ParseException e) {
          e.printStackTrace();
      }


    }


}
