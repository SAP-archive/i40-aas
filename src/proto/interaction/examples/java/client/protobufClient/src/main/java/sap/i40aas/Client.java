package sap.i40aas;

import com.google.protobuf.Struct.Builder;
import com.google.protobuf.Struct;
import com.google.protobuf.util.JsonFormat;
import com.google.protobuf.BlockingRpcChannel;
import io.grpc.Channel;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.StatusRuntimeException;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

public class Client {

    // private final Interaction.InteractionIngress.BlockingInterface blockingStub;

    // /** Construct client for accessing HelloWorld server using the existing channel. */
    // public Client(BlockingRpcChannel channel) {
    //   // 'channel' here is a Channel, not a ManagedChannel, so it is not this code's responsibility to
    //   // shut it down.

    //   // Passing Channels to code makes code easier to test and makes it easier to reuse Channels.
    //   // blockingStub = GreeterGrpc.newBlockingStub(channel);
    //   blockingStub = Interaction.InteractionIngress.newBlockingStub(channel);

    // }
    public static void main(final String args[]){

      JSONParser jsonParser = new JSONParser();

      try (FileReader reader = new FileReader("/home/chief/i40-aas/opensource/i40-aas/src/proto/interaction/examples/sample_interaction.json"))
      {
          //Read JSON file
          Object obj = jsonParser.parse(reader);

          //Builder structBuilder = Struct.newBuilder();
          Interaction.InteractionMessage.Builder interactionBuilder = Interaction.InteractionMessage.newBuilder();

          JsonFormat.parser().merge(obj.toString(), interactionBuilder);

          //System.out.println(interactionBuilder.build().getAllFields());

          Interaction.InteractionMessage interactionMessage = interactionBuilder.build();
          //System.out.println(interactionMessage);

          System.out.println("Hello from Client!");

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
            Interaction.InteractionIngress.BlockingInterface blockingStub = Interaction.InteractionIngress.newBlockingStub(channel);
            Interaction.InteractionStatus response;
            try {
              response = blockingStub.sendInteractionMessage(interactionMessage);
            } catch (StatusRuntimeException e) {
              System.out.println( "RPC failed: {0}", e.getStatus());
              return;
            }
          } finally {
            // ManagedChannels use resources like threads and TCP connections. To prevent leaking these
            // resources the channel should be shut down when it will no longer be used. If it may be used
            // again leave it running.
            channel.shutdownNow().awaitTermination(5, TimeUnit.SECONDS);
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

// public class HelloWorldClient {
//   private static final Logger logger = Logger.getLogger(HelloWorldClient.class.getName());

//   private final GreeterGrpc.GreeterBlockingStub blockingStub;



  // /** Say hello to server. */
  // public void greet(String name) {
  //   logger.info("Will try to greet " + name + " ...");
  //   HelloRequest request = HelloRequest.newBuilder().setName(name).build();
  //   HelloReply response;
  //   try {
  //     response = blockingStub.sayHello(request);
  //   } catch (StatusRuntimeException e) {
  //     logger.log(Level.WARNING, "RPC failed: {0}", e.getStatus());
  //     return;
  //   }
  //   logger.info("Greeting: " + response.getMessage());
  // }

  // /**
  //  * Greet server. If provided, the first element of {@code args} is the name to use in the
  //  * greeting. The second argument is the target server.
  //  */
  // public static void main(String[] args) throws Exception {
  //   String user = "world";
  //   // Access a service running on the local machine on port 50051
  //   String target = "localhost:50051";
  //   // Allow passing in the user and target strings as command line arguments
  //   if (args.length > 0) {
  //     if ("--help".equals(args[0])) {
  //       System.err.println("Usage: [name [target]]");
  //       System.err.println("");
  //       System.err.println("  name    The name you wish to be greeted by. Defaults to " + user);
  //       System.err.println("  target  The server to connect to. Defaults to " + target);
  //       System.exit(1);
  //     }
  //     user = args[0];
  //   }
  //   if (args.length > 1) {
  //     target = args[1];
  //   }


//   }
// }
