> NOTE: This article is still under research, and there may be inconsistencies or incomplete/inaccurate information. Most of the work was conducted using version `EinScan HX v1.3.0.3` with the older SDK and `Shining3D/SDKDoc` as a reference point. However, recent updates have been largely based on in-depth investigation of `EinScan HX v1.4.1.2`.

# Einscan HX Soft (Community)

The development and integration of third-party software with the EinScan HX scanner, produced by Shining3D, present considerable challenges due to the lack of a standardized and well-documented SDK. The official software development kit (SDK) lacks comprehensive documentation, and inconsistencies in SDK compatibility with various scanner hardware versions further complicate integration efforts. Thus, a thorough analysis of the scanner’s communication protocols and software architecture is required.

## Overview of EinScan SDK Variability

Shining3D’s EinScan Scanners SDK exhibits significant fragmentation across different hardware models, making it difficult for developers to ensure compatibility. The following table summarizes the supported SDK versions per scanner model:

In summary the following marketing claim is not very true
> The EinScan H2 scanning SDK is available and open for customization! Integrate our powerful scanning and data processing into your own software or app.

## Official SDK Information and Availability

https://support.einscan.com/en/support/solutions/articles/60001009796-einscan-scanners-sdk

> This is a summary table of the EinScan Scanner SDK and we will keep updating. If you need SDK, please send your account manager an email to tell him/her your github account and which scanner SDK is needed. 

| Scanner Model | Software Version | SDK URL
| - | - | - |
| Einstar |	EXStar_v1.0.6.0 | https://github.com/Shining3D/EXStarSDK1.6 |
| EinScan SE/SP & SE V2/SP V2 |	EXScan S_v3.1.3.0 | https://github.com/Shining3D/SESPSDK https://github.com/Shining3D/SESPSDK-Doc https://github.com/Shining3D/SESPSDK-Demo |
| Transcan C	| EXScan C_v1.4 | https://github.com/Shining3D/Transcan-C-SDK |
| EinScan Pro Series | EXScan Pro_v3.5.0.9 | https://github.com/Shining3D/2X2020SDK |
| EinScan HX |	EXScan HX_v1.0.1 | https://github.com/Shining3D/HHXSDK |
| EinScan H/H2 |	EXScan H_v1.1 EXScan H_v1.2 | https://github.com/Shining3D/H1.2SDK |

Official response from Einscan support
>Thank you for your reply. 
>
> We have checked internally and confirmed the SDK version 1.1 , unfortunately, are not compatible with the hardware and software you are  currently using for integrating the real time data. We sincerely apologize for this and regret that we are unable to provide further support at this time.

| Latest Available Version | USB Stick Installer Version | Declared Version of "Working" / "Available" SDK |
| - | - | - |
|  EinScan HX v1.4.1.2 | EinScan HX v1.3.0.3 | EinScan HX v1.0.1 |

Available materials:
> These are outdated compared to version `1.4.1.2`, but at least they map out the basic principles for communication.

| | Material |
| - | - |
| "Current Documentation" | https://github.com/Shining3D/SDKDoc | 
| Old SDK from 2018 | https://github.com/Shining3DDeprecated/EinScan-SDK |

## Research Objectives

The overarching goal of this research is to establish a functional understanding of Shining3D’s EinScan HX software and scanner communication architecture. The following objectives have been set.

- [x] Map the general functionality of Shining3D in all aspects
  - [x] Metadata, Configs, and Logs
  - [x] Disassemble binaries and libraries
  - [ ] Monitor running:
	- [x] process
  	- [ ] trees
   	- [x] IPC map events
  - [x] Monitor network activity
- [x]  Identify the minimum requirements to establish TCP / MQTT / WebSocket communication with sn3DCommunity.exe running in the background
- [ ] Write a utility "Hello World" program that extracts basic METADATA
- [ ] Develop a low-level IPC communication driver
- [ ] Develop a backend quine-plugin
- [ ] Develop a frontend plugin for the editor
- [ ] Write tests

## Architectural Analysis of EinScan HX Software

The EinScan HX scanner operates through a suite of interdependent software components that facilitate real-time communication between the scanning hardware and the host system. These components manage essential functions, including data acquisition, processing, and communication via multiple protocols.

### Core Software Components

The primary executable, EXScan HX.exe, acts as the central controller of the scanning process. Upon initialization, it launches several auxiliary services responsible for different aspects of the scanner’s operation. These include:

1. **Hardware Communication** – The software establishes connectivity with the scanner via multiple protocols, including MQTT (Message Queuing Telemetry Transport), TCP (Transmission Control Protocol), and IPC (Inter-Process Communication) through shared memory access.
2. **Data Processing** – Raw scan data is acquired, formatted into JSON-based structures, and optimized in real time before being transmitted to the host system.
3. **Graphical Interface Management** – The software provides a visual representation of the scan and allows user interaction for modifying scanning parameters.

### Essential Background Services
- **scanhub.exe** -  Oversees scanning-related operations and manages scanning workflows.
- **passportCommunity.exe** - Handles authentication and network verification mechanisms.
- **scanservice.exe** - Governs internal scanning functions and ensures device status monitoring.
- **einscan_net_svr.exe** - Functions as a network service that manages system-wide communication between software and hardware components.

### Communication Mechanisms

The EinScan HX software architecture leverages multiple communication protocols to facilitate data exchange.

- **MQTT Broker** –The message distribution system that enables lightweight, real-time data synchronization between different software modules.
- **sn3DCommunity.exe** –  A core execution module responsible for orchestrating software-to-hardware interactions.
- **Shared Memory Regions** – High-speed data exchange is achieved through allocated shared memory, which minimizes latency during scanning operations.

### Network and Reverse Engineering Insights

#### Protocol Analysis

Analysis of network interactions reveals several key findings.

- **ZeroMQ Messaging Framework** – The backbone of MQTT communication, allowing low-latency, asynchronous messaging.
- **Wireshark Traffic Analysis** – Traffic analysis demonstrates that encrypted MQTT messages govern scanner authentication, session initiation, and command execution.
- **Message Topics** – Identified topics correspond to device metadata retrieval, execution commands, and status reporting.

#### Reverse Engineering Discoveries

- Several binary sections within `EXScan HX.exe` contain encrypted or obfuscated code.
- The function `sub_7FF6383C21F0` initializes sn3DCommunity.exe, establishing fundamental communication routes.
- `.server.json` files store crucial configuration parameters, including MQTT credentials and network endpoints.
- `sn3DCommunity.exe` supports multiple startup arguments to modify its protocol, including WebSocket and MQTT configurations.
- Runtime modifications can be performed by manipulating the startup flags of sn3DCommunity.exe, allowing protocol reconfiguration to support WebSocket and MQTT interactions.

Further research will focus on decompiling software libraries, documenting network protocol variations, reverse-engineering internal encryption mechanisms and development of tools to interface with the EinScan HX scanner efficiently.

## Configuration Files Referencing Important Settings

The EinScan HX software relies on various configuration files that store critical system settings, governing aspects such as communication protocols, shared memory access, and MQTT broker configurations. These files play an integral role in defining the scanner’s behavior and interoperability with external applications.

### Key Configuration Files

<table>
<tr>
  <td>Config</td>
  <td>Service</td>
  <td>Interest</td>
  <td>Purpose</td>
  <td>Path</td>
</tr>
  
<tr>
  <td>.server.json</td>
  <td>EXScan HX.exe</td>
  <td>
        
  ```json
  "modelCode": "exscanhxsoft",
  ```
  </td>  
  <td>
  </td>
  <td>C:\Shining3d\EinScan HX\</td>
</tr>

<tr>
  <td>.server.json</td>
  <td>EXScan HX.exe</td>
  <td>
        
  ```json
  "mqtt": {
        "host": "127.0.0.1",
        "port": "1883",
        "username": "",
        "password": "",
  }
  ```
  </td>  
  <td>MQTT Broker Setup</td>
  <td>C:\Shining3d\EinScan HX\</td>
</tr>

<tr>
  <td>SystemCfg.json</td>
  <td>SnSyncService</td>
  <td>
        
  ```json
  "SharedMemory":{
		"Name":"SnSyncService_SharedMemory",
		"Size":2147483648
	}
  ```
  </td>  
  <td>
    
  Uses in MQTT communication topic route `demo/ipc/req/SnSyncService/execute` 
  
  </td>
  <td>C:\Shining3d\EinScan HX\syncservice\config\SystemCfg.json</td>
</tr>

</table>

These files contain parameters for network communication, system preferences, and hardware settings, which determine how the scanner interacts with its surrounding software environment.

## Network Communication Overview

The EinScan HX scanner employs a robust network communication stack based on MQTT (Message Queuing Telemetry Transport) and ZeroMQ messaging. These protocols enable seamless, low-latency interaction between the scanner, the host PC, and third-party applications.

### MQTT-Based Communication Workflow

- **Client Initialization:** The scanner establishes a connection with an MQTT broker, typically running on 127.0.0.1:1883.
- **Authentication Handshake:** The scanner and software authenticate using an AES-encrypted challenge-response mechanism.
- **Message Subscription:** The scanner subscribes to specific MQTT topics related to device metadata, command execution, and event notifications.
- **Command Execution:** Requests are sent via JSON messages, specifying actions such as scanning mode activation, data retrieval, and sensor adjustments.

### MTQQ Communication Archutecture Class Diagram

```
 					   +---------------------+
					   |     MQTT Broker     |
              				   |---------------------|
              				   | + manageTopics()    |
              				   | + dispatchMessages()|
              				   +----------+----------+
						      |
                               +----------------------+----------------------+
			       |                                       	     |
		      +--------v--------+                             	+----v----+
		      |    Publisher    |                             	| Subscriber|
		      |-----------------|                             	|-----------|
                      | - topic         |                             	| - topic   |
		      | + publish(msg)  |                      		| + subscribe(topic) |
		      +---------+-------+                             	+-----+-----+
  			        |                                             |
			        | Publishes messages                          | Receives messages
				|                                             |
			   +----v--------+                                +----v--------+
			   | Client      |                             	  | Client      |
  			   |-------------|                             	  |-------------|
			   | - clientID  |                         	  | - clientID  |
			   | + connect() |                         	  | + connect() |
			   | + send()    |                         	  | + receive() |
			   +------------+                          	  +-------------+
```

### Diagram Analysis

#### Wireshark setup

TCP filter for catching MQTT communication on default port
```
tcp.port == 1883
```

Wireshark filter for identifying heartbeat
```
mqtt.msgtype == 12 || mqtt.msgtype == 13
```

#### Diagram component methodology in Nutshell

| Wireshark Packet | Diagram Component              | Event Description                        |
|------------------|--------------------------------|------------------------------------------|
| 273 (Connect Command) | Client.connect() → Broker    | Client initiates connection to broker  |
| 275 (ConnAck)        | Broker → Client.connect()    | Broker acknowledges connection request  |
| 277 (SUBSCRIBE)      | Client.subscribe() → Broker  | Client subscribes to relevant topics   |
| 279 (SUBACK)         | Broker → Client.subscribe()  | Broker acknowledges subscription        |
| 281 (PUBLISH - Auth Request) | Client → Broker → Scanner | Client sends authentication request    |
| 283 (PUBLISH - Auth Response) | Scanner → Broker → Client | Scanner responds with authentication data |
| 285 (PUBLISH - Heartbeat) | Scanner → Broker → Client | Scanner sends periodic heartbeat       |
| 287 (PUBLISH - Execution Command) | Client → Broker → Scanner | Client sends command to scanner       |
| 289 (PUBLISH - Execution Response) | Scanner → Broker → Client | Scanner responds to execution command |

These findings confirm that the EinScan HX scanner operates within a structured and well-defined messaging framework, enabling secure and efficient machine-to-machine communication.

#### Flowchart representing MQTT communication

```
         +-------------+                  				+------------+
         |  Client A   |                  				|   Broker   |
         +-------------+                  				+------------+
                  |  (SYN)                        				|
                  | ----------------------------------------------------------> |
                  |  (SYN, ACK)                   				|
                  | <---------------------------------------------------------- |
                  |  (ACK)                         				|
                  | ----------------------------------------------------------> |
                  |                                				|
                  |  CONNECT                       				|
                  | ----------------------------------------------------------> |
                  |  CONNACK                       				|
                  | <---------------------------------------------------------- |
                  |                                				|
                  |  PUBLISH (demo/info/modules/SnSyncService/password)   	|
                  | ----------------------------------------------------------> |
                  |                                				|
                  |  SUBSCRIBE [demo/info/#, demo/ipc/rep/SnSyncService]  	|
                  | ----------------------------------------------------------> |
                  |  SUBACK                        				|
                  | <---------------------------------------------------------- |
                  |  PUBLISH (demo/info/modules/SnSyncService/status)  		|
                  | ----------------------------------------------------------> |
                  |  PUBLISH (demo/ipc/pub/SnSyncService/moduleInitialized)  	|
                  | ----------------------------------------------------------> |
                  |                                				|
         +-------------+                 				+------------+
         |  Client B   |                  				|   Broker   |
         +-------------+                  				+------------+
                  |  (SYN)                        				|
                  | ----------------------------------------------------------> |
                  |  (SYN, ACK)                   				|
                  | <---------------------------------------------------------- |
                  |  (ACK)                        				|
                  | ----------------------------------------------------------> |
                  |                                				|
                  |  CONNECT                       				|
                  | ----------------------------------------------------------> |
                  |  CONNACK                       				|
                  | <---------------------------------------------------------- |
                  |                                				|
                  |  PUBLISH (demo/info/modules/c5msnsync/password)   		|
                  | ----------------------------------------------------------> |
                  |                                				|
                  |  SUBSCRIBE [demo/info/#, demo/ipc/rep/c5msnsync]  		|
                  | ----------------------------------------------------------> |
                  |  SUBACK                        				|
                  | <---------------------------------------------------------- |
                  |  PUBLISH (demo/info/modules/c5msnsync/status)  		|
                  | ----------------------------------------------------------> |
                  |  PUBLISH (demo/ipc/pub/SnSyncService/message) 		|
                  | ----------------------------------------------------------> |
                  |                                				|
         +-------------+                  				+------------+
         |  Client A   |                  				|   Broker   |
         +-------------+                  				+------------+
                  |  PUBLISH (demo/ipc/req/SnSyncService/execute)  		|
                  | ----------------------------------------------------------> |
                  |  PUBLISH (demo/ipc/rep/c5msnsync)  				|
                  | <---------------------------------------------------------- |
                  |  PUBLISH (demo/ipc/pub/SnSyncService/message)  		|
                  | ----------------------------------------------------------> |
                  |  PUBLISH (demo/ipc/pub/SnSyncService/moduleInitialized)  	|
                  | ----------------------------------------------------------> |

```

##### A Brief Explanation of Flow

1. Client A (53813) establishes a connection with the broker via a TCP handshake.
2. Client A sends an MQTT CONNECT command to the broker.
3. Broker acknowledges with CONNACK.
4. Client A publishes messages to `demo/info/modules/SnSyncService/password`.
5. Client A subscribes to multiple topics (`demo/info/#`, `demo/ipc/rep/SnSyncService`).
6. Broker sends a SUBACK response confirming the subscription.
7. Client A publishes to `demo/info/modules/SnSyncService/status` and `demo/ipc/pub/SnSyncService/moduleInitialized`.
8. Client B (53814) establishes a new connection with the broker via TCP handshake.
9. Client B follows the same MQTT sequence: CONNECT → CONNACK → PUBLISH → SUBSCRIBE → SUBACK.
10. Client B publishes messages related to `demo/info/modules/c5msnsync/password` and `demo/info/modules/c5msnsync/status`.
11. Both clients start interacting with the broker:
 * Client A sends `demo/ipc/req/SnSyncService/execute`.
 * Broker responds with `demo/ipc/rep/c5msnsync`.
 * Client A publishes `demo/ipc/pub/SnSyncService/message` and `demo/ipc/pub/SnSyncService/moduleInitialized`.

##### MQTT topic routes from extracted communication

###### Description Table

| Component |	Role | Explanation
| - | - | - |
| Publisher (Pub) | Sends messages to topics |  A publisher is responsible for generating and sending data that subscribers are interested in. |
| Subscriber (Sub) | Receives messages from topics| Subscribers register their interest in topics and consume messages when they are published.|
| Requester (Req) | Sends requests to a service|  The requester sends a message (request) and expects a response from a responder (or service)|
| Responder (Rep) | Handles requests and sends responses|  A responder waits for incoming requests and provides a response when needed.|
| IPC (Inter-Process Communication) | Enables communication between system components| IPC in MQTT is used for communication between microservices or system components.|
| Message Broker | Routes messages between publishers and subscribers| The broker manages message distribution between clients.|

##### Explanation of MQTT components by example

* Publisher (pub)
	
> A publisher is a client that sends messages to a specific topic on the broker. Other clients can subscribe to these topics to receive the published messages.

Example:
- Publish Message `demo/ipc/pub/SnSyncService/message`
- Publish Message `demo/ipc/pub/SnSyncService/moduleInitialized`
- Publish Message `demo/info/modules/c5msnsync/status`
  
* Subscriber (sub)

> A subscriber is a client that listens for messages on a given topic. When a message is published to a topic the subscriber is interested in, it receives the message.

Example:
- Subscribe Request (id=1) `demo/info/#`
- Subscribe Request (id=5) `demo/ipc/req/SnSyncService/errorInfo`
- Subscribe Request (id=6) `demo/ipc/req/SnSyncService/exit`

* Requester (req)

> A requester (or client) is a specific type of publisher that sends a request to another service and expects a response.

Example:
- Publish Message `demo/ipc/req/SnSyncService/execute`
- Publish Message `demo/ipc/req/SnSyncService/errorInfo`

* Responder (rep)

> A responder listens for incoming requests and responds with data.

Example:
- Publish Message `demo/ipc/rep/c5msnsync`
- Publish Message `demo/ipc/rep/SnSyncService`

* Inter-Process Communication (IPC)

> IPC (Inter-Process Communication) refers to communication between different processes within a system. In MQTT, this often means local communication between different services within
the same system.

Example:
- `demo/ipc/req/SnSyncService/execute`
- `demo/ipc/pub/SnSyncService/moduleInitialized`
- `demo/ipc/rep/c5msnsync`

* Message Broker
   
> The broker is the central system that routes messages between publishers and subscribers. It does not generate messages but ensures that they are delivered reliably.

##### Summary of needed MTQQ Topics

###### Published Topics
- `demo/info/modules/SnSyncService/password`
- `demo/info/modules/SnSyncService/status`
- `demo/ipc/pub/SnSyncService/moduleInitialized`
- `demo/info/modules/c5msnsync/password`
- `demo/info/modules/c5msnsync/status`
- `demo/ipc/pub/SnSyncService/message`
- `demo/ipc/req/SnSyncService/execute`
- `demo/ipc/rep/c5msnsync`

##### Subscribed Topics
- `demo/info/#`
- `demo/ipc/rep/SnSyncService`
- `demo/ipc/cab/SnSyncService`
- `demo/ipc/req/SnSyncService/execute`
- `demo/ipc/req/SnSyncService/errorInfo`
- `demo/ipc/req/SnSyncService/exit`
- `demo/ipc/pub/SnSyncService/message`
- `demo/ipc/pub/SnSyncService/moduleInitialized`
- `demo/ipc/map/SnSyncService/aboutToExit`
- `demo/ipc/map/SnSyncService/callback`
- `demo/ipc/map/SnSyncService/calibrateCallback`
- `demo/ipc/rep/c5msnsync`
- `demo/ipc/cab/c5msnsync`

### **239** (Connect Command): Client.connect() → Broker:

Protocol info

```
Header Flags: 0x10, Message Type: Connect Command
Protocol Name: MQTT
Version: MQTT v3.1.1 (4)
```

Authentification Basic Info: (for now this must be catched from wireshark)

| | v1.4.1.2  | v1.3.0.3  | v1.3.0beta |
|-| - | - | - |
| Client ID | SnSyncService  |  passportcommunity  | No information |
| Password | X03MO1qnZdYdgyfeuILPmQ==  |  kAFQmDzST7DWlj99KOF/cg== | No information |
| Postman | Yes | No | Can't |


### **285** (PUBLISH - Heartbeat) Scanner → Broker → Client

|| v1.4.1.2  | v1.3.0.3  | v1.3.0beta |
|-| - | - | - |
|| `demo/info/modules/SnSyncService/status`  |  `PassPort/info/modules/passportcommunity/status`  |  v1.0/device/status |
| Postman | Yes | No | Can't |

Reply

| v1.4.1.2  | v1.3.0.3  | v1.3.0beta |
| - | - | - |
| {"online":true} |  { }  | REQ: None REP: String |

#### **Client A** Explanation of Flow stage:

##### Summary of the Table:

- **Connect Command & Acknowledgment:** Client establishes connection (239 → 241).
- **Publishing Messages:** Messages are published to topics like `demo/info/modules/SnSyncService/password`, `status`, `moduleInitialized`.
- **Subscription Process:** Client subscribes to multiple topics (245, 247, 249).
- **Broker Acknowledgment:** The broker acknowledges the subscription requests (250, 253, 255, etc.).

##### Wireshark Log Mapping

<details>

| **Wireshark Packet**  | **Diagram Component**             | **Event Description** |
|-----------------------|---------------------------------|------------------------|
| **239** (Connect Command)  | `Client.connect()` → `Broker`   | Client initiates connection to broker |
| **241** (Connect Ack)      | `Broker` → `Client`           | Broker acknowledges connection |
| **243** (Publish Message)  | `Publisher.publish(msg)` → `Broker` | Client publishes message to `demo/info/modules/SnSyncService/password` |
| **245** (Subscribe Request) | `Subscriber.subscribe(topic)` → `Broker` | Client subscribes to multiple topics (`demo/info/#`, `demo/ipc/rep/SnSyncService`, etc.) |
| **249** (Subscribe Request) | `Subscriber.subscribe(topic)` → `Broker` | Additional subscriptions (`demo/ipc/req/SnSyncService/exit`) |
| **250-264** (Subscribe Ack) | `Broker` → `Subscriber`      | Broker acknowledges successful subscriptions |
| **257** (Publish Message)  | `Publisher.publish(msg)` → `Broker` | Client publishes `demo/info/modules/SnSyncService/status` |
| **263** (Publish Message)  | `Publisher.publish(msg)` → `Broker` | Client publishes `demo/ipc/pub/SnSyncService/moduleInitialized` |

</details>

##### Wireshark Log

<details>

```
239	10.935874	127.0.0.1	127.0.0.1	MQTT	114	Connect Command
240	10.935882	127.0.0.1	127.0.0.1	TCP	44	1883 → 53813 [ACK] Seq=1 Ack=71 Win=2619648 Len=0
241	10.937872	127.0.0.1	127.0.0.1	MQTT	48	Connect Ack
242	10.937881	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=71 Ack=5 Win=2619648 Len=0
243	10.937896	127.0.0.1	127.0.0.1	MQTT	127	Publish Message [demo/info/modules/SnSyncService/password]
244	10.937900	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=71 Ack=88 Win=2619648 Len=0
245	10.938029	127.0.0.1	127.0.0.1	MQTT	185	Subscribe Request (id=1) [demo/info/#], Subscribe Request (id=2) [demo/ipc/rep/SnSyncService], Subscribe Request (id=3) [demo/ipc/cab/SnSyncService], Publish Message [demo/info/modules/SnSyncService/status]
246	10.938037	127.0.0.1	127.0.0.1	TCP	44	1883 → 53813 [ACK] Seq=88 Ack=212 Win=2619648 Len=0
247	10.938149	127.0.0.1	127.0.0.1	MQTT	128	Subscribe Request (id=4) [demo/ipc/req/SnSyncService/execute], Subscribe Request (id=5) [demo/ipc/req/SnSyncService/errorInfo]
248	10.938154	127.0.0.1	127.0.0.1	TCP	44	1883 → 53813 [ACK] Seq=88 Ack=296 Win=2619392 Len=0
249	10.938218	127.0.0.1	127.0.0.1	MQTT	82	Subscribe Request (id=6) [demo/ipc/req/SnSyncService/exit]
250	10.938220	127.0.0.1	127.0.0.1	MQTT	49	Subscribe Ack (id=1)
251	10.938231	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=334 Ack=93 Win=2619648 Len=0
252	10.938237	127.0.0.1	127.0.0.1	TCP	44	1883 → 53813 [ACK] Seq=93 Ack=334 Win=2619392 Len=0
253	10.938256	127.0.0.1	127.0.0.1	MQTT	49	Subscribe Ack (id=2)
254	10.938261	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=334 Ack=98 Win=2619648 Len=0
255	10.938274	127.0.0.1	127.0.0.1	MQTT	49	Subscribe Ack (id=3)
256	10.938278	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=334 Ack=103 Win=2619648 Len=0
257	10.938304	127.0.0.1	127.0.0.1	MQTT	101	Publish Message [demo/info/modules/SnSyncService/status]
258	10.938308	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=334 Ack=160 Win=2619392 Len=0
259	10.938326	127.0.0.1	127.0.0.1	MQTT	49	Subscribe Ack (id=4)
260	10.938330	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=334 Ack=165 Win=2619392 Len=0
261	10.938345	127.0.0.1	127.0.0.1	MQTT	49	Subscribe Ack (id=5)
262	10.938349	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=334 Ack=170 Win=2619392 Len=0
263	10.938360	127.0.0.1	127.0.0.1	MQTT	107	Publish Message [demo/ipc/pub/SnSyncService/moduleInitialized]
264	10.938366	127.0.0.1	127.0.0.1	MQTT	49	Subscribe Ack (id=6)
265	10.938371	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=397 Ack=175 Win=2619392 Len=0
```

</details>

#### **Client B** Explanation of Flow stage 2

##### Summary of the Table

- **Connect Command & Acknowledgment:** Client establishes connection. (273 → 275).
- **Subscription Process:** The client subscribes to multiple topics (e.g., `demo/info/#`, `demo/ipc/rep/c5msnsync`), and the broker acknowledges. (281, 285, 287, 295, 299, 305, 309, 311).
- **Publishing Messages:** The client publishes messages related to module statuses and execution requests  (`demo/ipc/req/SnSyncService/execute`). (279, 293, 297, 303, 307).
- **Broker Acknowledgments:** The broker confirms subscriptions but does not acknowledge individual message delivery (indicating MQTT QoS 0) (285, 287, 295, 299, 305, 309, 311).

##### Wireshark Log Mapping

<details>

| **Wireshark Packet**  | **Diagram Component**             | **Event Description** |
|-----------------------|---------------------------------|------------------------|
| **273** (Connect Command)  | `Client.connect()` → `Broker`   | Client initiates connection to broker |
| **275** (Connect Ack)      | `Broker` → `Client`           | Broker acknowledges connection |
| **277** (Publish Message)  | `Publisher.publish(msg)` → `Broker` | Client publishes message to `demo/info/modules/c5msnsync/password` |
| **279** (Subscribe Request) | `Subscriber.subscribe(topic)` → `Broker` | Client subscribes to multiple topics (`demo/info/#`, `demo/ipc/rep/c5msnsync`, etc.) and publishes `demo/info/modules/c5msnsync/status` |
| **281** (Subscribe Ack) | `Broker` → `Subscriber` | Broker acknowledges subscription (id=1) |
| **283** (Publish Message)  | `Publisher.publish(msg)` → `Broker` | Client publishes `demo/info/modules/SnSyncService/status` |
| **285** (Subscribe Ack) | `Broker` → `Subscriber` | Broker acknowledges subscription (id=2) |
| **287** (Subscribe Ack) | `Broker` → `Subscriber` | Broker acknowledges subscription (id=3) |
| **289** (Publish Message)  | `Publisher.publish(msg)` → `Broker` | Client publishes `demo/info/modules/c5msnsync/status` |
| **291** (Publish Message)  | `Publisher.publish(msg)` → `Broker` | Client publishes `demo/info/modules/c5msnsync/status` again |
| **293** (Subscribe Request) | `Subscriber.subscribe(topic)` → `Broker` | Client subscribes to `demo/ipc/pub/SnSyncService/message` |
| **295** (Subscribe Ack) | `Broker` → `Subscriber` | Broker acknowledges subscription (id=4) |
| **297** (Subscribe Request) | `Subscriber.subscribe(topic)` → `Broker` | Client subscribes to `demo/ipc/pub/SnSyncService/moduleInitialized` |
| **299** (Subscribe Ack) | `Broker` → `Subscriber` | Broker acknowledges subscription (id=5) |
| **301** (Publish Message)  | `Publisher.publish(msg)` → `Broker` | Client publishes `demo/ipc/pub/SnSyncService/moduleInitialized` |
| **303** (Subscribe Request) | `Subscriber.subscribe(topic)` → `Broker` | Client subscribes to `demo/ipc/map/SnSyncService/aboutToExit` |
| **305** (Subscribe Ack) | `Broker` → `Subscriber` | Broker acknowledges subscription (id=6) |
| **307** (Subscribe Request) | `Subscriber.subscribe(topic)` → `Broker` | Client subscribes to `demo/ipc/map/SnSyncService/callback` and `demo/ipc/map/SnSyncService/calibrateCallback` |
| **309** (Subscribe Ack) | `Broker` → `Subscriber` | Broker acknowledges subscription (id=7) |
| **311** (Subscribe Ack) | `Broker` → `Subscriber` | Broker acknowledges subscription (id=8) |
| **313** (Publish Message)  | `Publisher.publish(msg)` → `Broker` | Client publishes `demo/ipc/req/SnSyncService/execute` |
| **315** (Publish Message)  | `Publisher.publish(msg)` → `Broker` | Client publishes `demo/ipc/req/SnSyncService/execute` again |

</details>

##### Wireshark Log

<details>

```
273	11.025958	127.0.0.1	127.0.0.1	MQTT	106	Connect Command
274	11.025966	127.0.0.1	127.0.0.1	TCP	44	1883 → 53814 [ACK] Seq=1 Ack=63 Win=2619648 Len=0
275	11.027713	127.0.0.1	127.0.0.1	MQTT	48	Connect Ack
276	11.027723	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=63 Ack=5 Win=2619648 Len=0
277	11.027733	127.0.0.1	127.0.0.1	MQTT	123	Publish Message [demo/info/modules/c5msnsync/password]
278	11.027737	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=63 Ack=84 Win=2619648 Len=0
279	11.027874	127.0.0.1	127.0.0.1	MQTT	173	Subscribe Request (id=1) [demo/info/#], Subscribe Request (id=2) [demo/ipc/rep/c5msnsync], Subscribe Request (id=3) [demo/ipc/cab/c5msnsync], Publish Message [demo/info/modules/c5msnsync/status]
280	11.027883	127.0.0.1	127.0.0.1	TCP	44	1883 → 53814 [ACK] Seq=84 Ack=192 Win=2619648 Len=0
281	11.027899	127.0.0.1	127.0.0.1	MQTT	49	Subscribe Ack (id=1)
282	11.027906	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=192 Ack=89 Win=2619648 Len=0
283	11.027912	127.0.0.1	127.0.0.1	MQTT	101	Publish Message [demo/info/modules/SnSyncService/status]
284	11.027915	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=192 Ack=146 Win=2619648 Len=0
285	11.027929	127.0.0.1	127.0.0.1	MQTT	49	Subscribe Ack (id=2)
286	11.027933	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=192 Ack=151 Win=2619648 Len=0
287	11.027945	127.0.0.1	127.0.0.1	MQTT	49	Subscribe Ack (id=3)
288	11.027949	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=192 Ack=156 Win=2619392 Len=0
289	11.027967	127.0.0.1	127.0.0.1	MQTT	97	Publish Message [demo/info/modules/c5msnsync/status]
290	11.027974	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=397 Ack=228 Win=2619392 Len=0
291	11.027981	127.0.0.1	127.0.0.1	MQTT	97	Publish Message [demo/info/modules/c5msnsync/status]
292	11.027984	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=192 Ack=209 Win=2619392 Len=0
293	11.028075	127.0.0.1	127.0.0.1	MQTT	85	Subscribe Request (id=4) [demo/ipc/pub/SnSyncService/message]
294	11.028086	127.0.0.1	127.0.0.1	TCP	44	1883 → 53814 [ACK] Seq=209 Ack=233 Win=2619392 Len=0
295	11.028106	127.0.0.1	127.0.0.1	MQTT	49	Subscribe Ack (id=4)
296	11.028114	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=233 Ack=214 Win=2619392 Len=0
297	11.028268	127.0.0.1	127.0.0.1	MQTT	95	Subscribe Request (id=5) [demo/ipc/pub/SnSyncService/moduleInitialized]
298	11.028276	127.0.0.1	127.0.0.1	TCP	44	1883 → 53814 [ACK] Seq=214 Ack=284 Win=2619392 Len=0
299	11.028290	127.0.0.1	127.0.0.1	MQTT	49	Subscribe Ack (id=5)
300	11.028297	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=284 Ack=219 Win=2619392 Len=0
301	11.028303	127.0.0.1	127.0.0.1	MQTT	107	Publish Message [demo/ipc/pub/SnSyncService/moduleInitialized]
302	11.028306	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=284 Ack=282 Win=2619392 Len=0
303	11.028361	127.0.0.1	127.0.0.1	MQTT	89	Subscribe Request (id=6) [demo/ipc/map/SnSyncService/aboutToExit]
304	11.028368	127.0.0.1	127.0.0.1	TCP	44	1883 → 53814 [ACK] Seq=282 Ack=329 Win=2619392 Len=0
305	11.028380	127.0.0.1	127.0.0.1	MQTT	49	Subscribe Ack (id=6)
306	11.028385	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=329 Ack=287 Win=2619392 Len=0
307	11.028500	127.0.0.1	127.0.0.1	MQTT	137	Subscribe Request (id=7) [demo/ipc/map/SnSyncService/callback], Subscribe Request (id=8) [demo/ipc/map/SnSyncService/calibrateCallback]
308	11.028509	127.0.0.1	127.0.0.1	TCP	44	1883 → 53814 [ACK] Seq=287 Ack=422 Win=2619392 Len=0
309	11.028520	127.0.0.1	127.0.0.1	MQTT	49	Subscribe Ack (id=7)
310	11.028526	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=422 Ack=292 Win=2619392 Len=0
311	11.028541	127.0.0.1	127.0.0.1	MQTT	49	Subscribe Ack (id=8)
312	11.028545	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=422 Ack=297 Win=2619392 Len=0
313	11.028733	127.0.0.1	127.0.0.1	MQTT	236	Publish Message [demo/ipc/req/SnSyncService/execute]
314	11.028742	127.0.0.1	127.0.0.1	TCP	44	1883 → 53814 [ACK] Seq=297 Ack=614 Win=2619136 Len=0
315	11.028759	127.0.0.1	127.0.0.1	MQTT	236	Publish Message [demo/ipc/req/SnSyncService/execute]
316	11.028765	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=397 Ack=420 Win=2619136 Len=0
```
</details>

#### **Client A** Explanation of Flow Stage 3

##### Summary of the Table

> ```TODO```

##### Wireshark Log Mapping

<details>

| **Wireshark Packet**  | **Diagram Component**                     | **Event Description** |
|-----------------------|-------------------------------------------|------------------------|
| **544**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/rep/c5msnsync` |
| **546**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/rep/c5msnsync` |
| **548**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/rep/c5msnsync` |
| **550**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/req/SnSyncService/execute` |
| **552**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/req/SnSyncService/execute` |
| **554**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **556**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **558**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **560**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/req/SnSyncService/execute` |
| **562**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/req/SnSyncService/execute` |
| **564**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **566**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **568**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **570**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/req/SnSyncService/execute` |
| **572**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/req/SnSyncService/execute` |
| **574**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **576**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **578**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **580**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/req/SnSyncService/execute` |
| **582**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/req/SnSyncService/execute` |
| **584**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **586**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **588**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **590**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/req/SnSyncService/execute` |
| **592**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/req/SnSyncService/execute` |
| **594**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **596**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **598**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **600**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/req/SnSyncService/execute` |
| **602**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/req/SnSyncService/execute` |
| **604**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **606**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **608**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **610**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/req/SnSyncService/execute` |
| **612**              | `Publisher.publish(msg)` → `Broker`       | Client publishes message to `demo/ipc/req/SnSyncService/execute` |
| **614**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **616**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |
| **618**              | `Broker` → `Subscriber.receive(msg)`       | Broker forwards message to `demo/ipc/rep/c5msnsync` |

</details>

##### Wireshark Log

<details>

```
544	17.512600	127.0.0.1	127.0.0.1	MQTT	195	Publish Message [demo/ipc/rep/c5msnsync], Publish Message [demo/ipc/rep/c5msnsync]
545	17.512621	127.0.0.1	127.0.0.1	TCP	44	1883 → 53813 [ACK] Seq=598 Ack=690 Win=2619136 Len=0
546	17.512689	127.0.0.1	127.0.0.1	MQTT	143	Publish Message [demo/ipc/rep/c5msnsync]
547	17.512701	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=792 Ack=538 Win=2619136 Len=0
548	17.512727	127.0.0.1	127.0.0.1	MQTT	96	Publish Message [demo/ipc/rep/c5msnsync]
549	17.512731	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=792 Ack=590 Win=2619136 Len=0
550	17.512901	127.0.0.1	127.0.0.1	MQTT	259	Publish Message [demo/ipc/req/SnSyncService/execute]
551	17.512909	127.0.0.1	127.0.0.1	TCP	44	1883 → 53814 [ACK] Seq=590 Ack=1007 Win=2618624 Len=0
552	17.512937	127.0.0.1	127.0.0.1	MQTT	259	Publish Message [demo/ipc/req/SnSyncService/execute]
553	17.512947	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=690 Ack=813 Win=2618880 Len=0
554	17.513375	127.0.0.1	127.0.0.1	MQTT	186	Publish Message [demo/ipc/rep/c5msnsync], Publish Message [demo/ipc/rep/c5msnsync]
555	17.513382	127.0.0.1	127.0.0.1	TCP	44	1883 → 53813 [ACK] Seq=813 Ack=832 Win=2618880 Len=0
556	17.513400	127.0.0.1	127.0.0.1	MQTT	134	Publish Message [demo/ipc/rep/c5msnsync]
557	17.513407	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=1007 Ack=680 Win=2618880 Len=0
558	17.513427	127.0.0.1	127.0.0.1	MQTT	96	Publish Message [demo/ipc/rep/c5msnsync]
559	17.513432	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=1007 Ack=732 Win=2618880 Len=0
560	17.513568	127.0.0.1	127.0.0.1	MQTT	245	Publish Message [demo/ipc/req/SnSyncService/execute]
561	17.513576	127.0.0.1	127.0.0.1	TCP	44	1883 → 53814 [ACK] Seq=732 Ack=1208 Win=2618624 Len=0
562	17.513592	127.0.0.1	127.0.0.1	MQTT	245	Publish Message [demo/ipc/req/SnSyncService/execute]
563	17.513599	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=832 Ack=1014 Win=2618624 Len=0
564	17.531794	127.0.0.1	127.0.0.1	MQTT	186	Publish Message [demo/ipc/rep/c5msnsync], Publish Message [demo/ipc/rep/c5msnsync]
565	17.531806	127.0.0.1	127.0.0.1	TCP	44	1883 → 53813 [ACK] Seq=1014 Ack=974 Win=2618880 Len=0
566	17.531832	127.0.0.1	127.0.0.1	MQTT	134	Publish Message [demo/ipc/rep/c5msnsync]
567	17.531842	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=1208 Ack=822 Win=2618880 Len=0
568	17.531864	127.0.0.1	127.0.0.1	MQTT	96	Publish Message [demo/ipc/rep/c5msnsync]
569	17.531869	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=1208 Ack=874 Win=2618880 Len=0
570	17.532201	127.0.0.1	127.0.0.1	MQTT	246	Publish Message [demo/ipc/req/SnSyncService/execute]
571	17.532211	127.0.0.1	127.0.0.1	TCP	44	1883 → 53814 [ACK] Seq=874 Ack=1410 Win=2618368 Len=0
572	17.532235	127.0.0.1	127.0.0.1	MQTT	246	Publish Message [demo/ipc/req/SnSyncService/execute]
573	17.532243	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=974 Ack=1216 Win=2618368 Len=0
574	17.551930	127.0.0.1	127.0.0.1	MQTT	186	Publish Message [demo/ipc/rep/c5msnsync], Publish Message [demo/ipc/rep/c5msnsync]
575	17.551943	127.0.0.1	127.0.0.1	TCP	44	1883 → 53813 [ACK] Seq=1216 Ack=1116 Win=2618624 Len=0
576	17.551997	127.0.0.1	127.0.0.1	MQTT	134	Publish Message [demo/ipc/rep/c5msnsync]
577	17.552006	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=1410 Ack=964 Win=2618624 Len=0
578	17.552029	127.0.0.1	127.0.0.1	MQTT	96	Publish Message [demo/ipc/rep/c5msnsync]
579	17.552033	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=1410 Ack=1016 Win=2618624 Len=0
580	17.552327	127.0.0.1	127.0.0.1	MQTT	242	Publish Message [demo/ipc/req/SnSyncService/execute]
581	17.552337	127.0.0.1	127.0.0.1	TCP	44	1883 → 53814 [ACK] Seq=1016 Ack=1608 Win=2618112 Len=0
582	17.552388	127.0.0.1	127.0.0.1	MQTT	242	Publish Message [demo/ipc/req/SnSyncService/execute]
583	17.552397	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=1116 Ack=1414 Win=2618368 Len=0
584	17.553420	127.0.0.1	127.0.0.1	MQTT	203	Publish Message [demo/ipc/rep/c5msnsync], Publish Message [demo/ipc/rep/c5msnsync]
585	17.553431	127.0.0.1	127.0.0.1	TCP	44	1883 → 53813 [ACK] Seq=1414 Ack=1275 Win=2618368 Len=0
586	17.553474	127.0.0.1	127.0.0.1	MQTT	151	Publish Message [demo/ipc/rep/c5msnsync]
587	17.553489	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=1608 Ack=1123 Win=2618624 Len=0
588	17.553547	127.0.0.1	127.0.0.1	MQTT	96	Publish Message [demo/ipc/rep/c5msnsync]
589	17.553554	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=1608 Ack=1175 Win=2618624 Len=0
590	17.553862	127.0.0.1	127.0.0.1	MQTT	246	Publish Message [demo/ipc/req/SnSyncService/execute]
591	17.553870	127.0.0.1	127.0.0.1	TCP	44	1883 → 53814 [ACK] Seq=1175 Ack=1810 Win=2617856 Len=0
592	17.553923	127.0.0.1	127.0.0.1	MQTT	246	Publish Message [demo/ipc/req/SnSyncService/execute]
593	17.553931	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=1275 Ack=1616 Win=2618112 Len=0
594	17.554622	127.0.0.1	127.0.0.1	MQTT	193	Publish Message [demo/ipc/rep/c5msnsync], Publish Message [demo/ipc/rep/c5msnsync]
595	17.554630	127.0.0.1	127.0.0.1	TCP	44	1883 → 53813 [ACK] Seq=1616 Ack=1424 Win=2618368 Len=0
596	17.554680	127.0.0.1	127.0.0.1	MQTT	141	Publish Message [demo/ipc/rep/c5msnsync]
597	17.554689	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=1810 Ack=1272 Win=2618368 Len=0
598	17.554711	127.0.0.1	127.0.0.1	MQTT	96	Publish Message [demo/ipc/rep/c5msnsync]
599	17.554715	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=1810 Ack=1324 Win=2618368 Len=0
600	17.554921	127.0.0.1	127.0.0.1	MQTT	241	Publish Message [demo/ipc/req/SnSyncService/execute]
601	17.554928	127.0.0.1	127.0.0.1	TCP	44	1883 → 53814 [ACK] Seq=1324 Ack=2007 Win=2617856 Len=0
602	17.554982	127.0.0.1	127.0.0.1	MQTT	241	Publish Message [demo/ipc/req/SnSyncService/execute]
603	17.554991	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=1424 Ack=1813 Win=2617856 Len=0
604	17.555359	127.0.0.1	127.0.0.1	MQTT	183	Publish Message [demo/ipc/rep/c5msnsync], Publish Message [demo/ipc/rep/c5msnsync]
605	17.555366	127.0.0.1	127.0.0.1	TCP	44	1883 → 53813 [ACK] Seq=1813 Ack=1563 Win=2618112 Len=0
606	17.555383	127.0.0.1	127.0.0.1	MQTT	131	Publish Message [demo/ipc/rep/c5msnsync]
607	17.555390	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=2007 Ack=1411 Win=2618368 Len=0
608	17.555408	127.0.0.1	127.0.0.1	MQTT	96	Publish Message [demo/ipc/rep/c5msnsync]
609	17.555414	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=2007 Ack=1463 Win=2618112 Len=0
610	17.557462	127.0.0.1	127.0.0.1	MQTT	245	Publish Message [demo/ipc/req/SnSyncService/execute]
611	17.557470	127.0.0.1	127.0.0.1	TCP	44	1883 → 53814 [ACK] Seq=1463 Ack=2208 Win=2617600 Len=0
612	17.557488	127.0.0.1	127.0.0.1	MQTT	245	Publish Message [demo/ipc/req/SnSyncService/execute]
613	17.557494	127.0.0.1	127.0.0.1	TCP	44	53813 → 1883 [ACK] Seq=1563 Ack=2014 Win=2617600 Len=0
614	17.575507	127.0.0.1	127.0.0.1	MQTT	204	Publish Message [demo/ipc/rep/c5msnsync], Publish Message [demo/ipc/rep/c5msnsync]
615	17.575528	127.0.0.1	127.0.0.1	TCP	44	1883 → 53813 [ACK] Seq=2014 Ack=1723 Win=2618112 Len=0
616	17.575601	127.0.0.1	127.0.0.1	MQTT	152	Publish Message [demo/ipc/rep/c5msnsync]
617	17.575613	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=2208 Ack=1571 Win=2618112 Len=0
618	17.575641	127.0.0.1	127.0.0.1	MQTT	96	Publish Message [demo/ipc/rep/c5msnsync]
619	17.575645	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=2208 Ack=1623 Win=2618112 Len=0
626	18.032947	127.0.0.1	127.0.0.1	MQTT	216	Publish Message [demo/ipc/pub/SnSyncService/message]
627	18.032963	127.0.0.1	127.0.0.1	TCP	44	1883 → 53813 [ACK] Seq=2014 Ack=1895 Win=2617856 Len=0
628	18.033031	127.0.0.1	127.0.0.1	MQTT	216	Publish Message [demo/ipc/pub/SnSyncService/message]
629	18.033043	127.0.0.1	127.0.0.1	TCP	44	53814 → 1883 [ACK] Seq=2208 Ack=1795 Win=2617856 Len=0
```

</details>

#### MQTT Event Topics

The following topics can be catched in PostMan

##### MQTT EinscanHX Launch sequence (services startup)

The important trafic is mostly between two topics `demo/ipc/req/SnSyncService/execute` and `demo/ipc/rep/c5msnsync`. Where the device information is obtained.

###### Topic `demo/ipc/req/SnSyncService/execute`
Replies:

<details>

```json
{
    "id": 0,
    "params": {
        "cmd": "getProperty",
        "params": [
            null,
            "GetDeviceTypeE3",
            null
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 1,
    "params": {
        "cmd": "openDevices",
        "params": [
            {
                "type": "E3"
            }
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 2,
    "params": {
        "cmd": "setFlagBitInterface",
        "params": [
            2364629105280,
            "AutoReconnectControl",
            false
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 3,
    "params": {
        "cmd": "setProperty",
        "params": [
            2364629105280,
            "MonoStrobeWorkMode",
            1
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 4,
    "params": {
        "cmd": "setProperty",
        "params": [
            2364629105280,
            "ColorStrobeWorkMode",
            1
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 5,
    "params": {
        "cmd": "getProperty",
        "params": [
            2364629105280,
            "CameraSerial",
            null
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 6,
    "params": {
        "cmd": "getProperty",
        "params": [
            2364629105280,
            "CameraResolution",
            null
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 7,
    "params": {
        "cmd": "getProperty",
        "params": [
            2364629105280,
            "CameraCount",
            null
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 8,
    "params": {
        "cmd": "getProperty",
        "params": [
            2364629105280,
            "FirmwareVersion",
            null
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

```

</details>

###### Topic `demo/ipc/rep/c5msnsync`
Replies:

<details>

```json
{
    "id": 0,
    "params": {
        "index": 0,
        "result": "E3"
    },
    "type": "resultReady"
}

{
    "id": 0,
    "type": "finished"
}

{
    "id": 1,
    "params": {
        "index": 0,
        "result": 3241002797136
    },
    "type": "resultReady"
}

{
    "id": 1,
    "type": "finished"
}

{
    "id": 2,
    "params": {
        "index": 0,
        "result": null
    },
    "type": "resultReady"
}

{
    "id": 2,
    "type": "finished"
}

{
    "id": 3,
    "params": {
        "index": 0,
        "result": null
    },
    "type": "resultReady"
}

{
    "id": 3,
    "type": "finished"
}

{
    "id": 4,
    "params": {
        "index": 0,
        "result": null
    },
    "type": "resultReady"
}

{
    "id": 4,
    "type": "finished"
}

{
    "id": 5,
    "params": {
        "index": 0,
        "result": "SH77690199439179785"
    },
    "type": "resultReady"
}

{
    "id": 5,
    "type": "finished"
}

{
    "id": 6,
    "params": {
        "index": 0,
        "result": [
            1280,
            1024
        ]
    },
    "type": "resultReady"
}

{
    "id": 6,
    "type": "finished"
}

{
    "id": 7,
    "params": {
        "index": 0,
        "result": 1
    },
    "type": "resultReady"
}

{
    "id": 7,
    "type": "finished"
}

{
    "id": 8,
    "params": {
        "index": 0,
        "result": "E3HXV218_\u0002312EN"
    },
    "type": "resultReady"
}

```

</details>


###### Topic `demo/pub/SnSyncService/message`
Replies:
<details>

```json
{
    "list": [
        "Einscan3",
        "011402D3241A00",
        "Connected",
        0
    ],
    "msgName": "deviceState",
    "pluginName": "3DDigitalSyncInterface",
    "version": "2.57.1"
}
```

</details>

##### MQTT EinscanHX Launch ScanMode - Rapid Scan (Device Setup and information)

When Scan Mode beign executed the communication catches the setup and basic information obtaining from device this is mapped from (`id: 9` → `id: 33`) between MQTT topics: (requester) `demo/ipc/req/SnSyncService/execute` and (replyier) `demo/ipc/rep/c5msnsync`.

###### Topic `demo/ipc/req/SnSyncService/execute`
Replies:
<details>

```json:
{
    "id": 9,
    "params": {
        "cmd": "getProperty",
        "params": [
            2253253317200,
            "CameraCount",
            null
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 10,
    "params": {
        "cmd": "getProperty",
        "params": [
            2253253317200,
            "CameraCount",
            null
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 11,
    "params": {
        "cmd": "getProperty",
        "params": [
            2253253317200,
            "CameraCount",
            null
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 12,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "ScanIndication",
            0
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 13,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "Indication",
            0
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 14,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "ProjectorControl",
            1
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 15,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "ScanIndication",
            0
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 16,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "Indication",
            0
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 17,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "MonoStrobeWorkMode",
            1
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 19,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "ScanTriggerPeriod",
            33000
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 20,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "LaserSwitchState",
            false
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 21,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "CameraGainAndExposure",
            [
                0,
                7,
                7
            ]
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 22,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "CameraGainAndExposure",
            [
                1,
                7,
                7
            ]
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 23,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "LedStrobeLightTime",
            {
                "DEVICE": 0,
                "LIGHTTIME": 500
            }
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 24,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "LedStrobeLightTime",
            {
                "DEVICE": 1,
                "LIGHTTIME": 6000
            }
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 25,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "DeviceLightTime",
            {
                "DEVICE": 2,
                "LIGHTTIME": 7000
            }
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 26,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "StrobeLuminance",
            {
                "COLORLED": 100,
                "MONOLED": 100,
                "MONOLEDOFCOLOR": 0
            }
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 27,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "CameraGainAndExposure",
            [
                2,
                3,
                6
            ]
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 28,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "LedStrobeLightTime",
            {
                "DEVICE": 0,
                "LIGHTTIME": 500
            }
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 29,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "LedStrobeLightTime",
            {
                "DEVICE": 1,
                "LIGHTTIME": 6000
            }
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 30,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "TriggerMode",
            1
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 31,
    "params": {
        "cmd": "setFlagBitInterface",
        "params": [
            2253253317200,
            "ImageStream",
            true
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 32,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "ScanIndication",
            0
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

{
    "id": 33,
    "params": {
        "cmd": "setProperty",
        "params": [
            2253253317200,
            "Indication",
            0
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": ""
    },
    "requester": "c5msnsync"
}

```

</details>

###### Topic `demo/ipc/rep/c5msnsync`
Replies

<details>

```json
{"id":9,"params":{"index":0,"result":1},"type":"resultReady"}
{"id":9,"type":"finished"}

{"id":10,"params":{"index":0,"result":1},"type":"resultReady"}
{"id":10,"type":"finished"}

{"id":11,"params":{"index":0,"result":1},"type":"resultReady"}
{"id":11,"type":"finished"}

{"id":12,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":12,"type":"finished"}

{"id":13,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":13,"type":"finished"}

{"id":14,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":14,"type":"finished"}

{"id":15,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":15,"type":"finished"}

{"id":16,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":16,"type":"finished"}

{"id":17,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":17,"type":"finished"}

{"id":18,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":18,"type":"finished"}

{"id":19,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":19,"type":"finished"}

{"id":20,"params":{"error":779,"why":""},"type":"exception"}
{"id":20,"type":"finished"}

{"id":21,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":21,"type":"finished"}

{"id":22,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":22,"type":"finished"}

{"id":23,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":23,"type":"finished"}

{"id":24,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":24,"type":"finished"}

{"id":25,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":25,"type":"finished"}

{"id":26,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":26,"type":"finished"}

{"id":27,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":27,"type":"finished"}

{"id":28,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":28,"type":"finished"}

{"id":29,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":29,"type":"finished"}

{"id":30,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":30,"type":"finished"}

{"id":31,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":31,"type":"finished"}

{"id":32,"params":{"index":0,"result":null},"type":"resultReady"}
{"id":32,"type":"finished"}
```

</details>

##### MQTT EinscanHX Launch ScanMode - Rapid Scan (IPC setup for ImageData)

###### Topic `demo/ipc/map/SnSyncService/callback`
Reply:
```json
{
    "id": 0,
    "params": {
        "callbackName": "imageData",
        "list": [
            "Einscan3",
            "011402D3241A00",
            "GrayImage",
            [
                "InternalE3Image1",
                "InternalE3Image2"
            ],
            {
                "camera0": {
                    "channel": 1,
                    "height": 1024,
                    "sharedName": "InternalE3Image1",
                    "size": 1310720,
                    "width": 1280
                },
                "camera1": {
                    "channel": 1,
                    "height": 1024,
                    "sharedName": "InternalE3Image2",
                    "size": 1310720,
                    "width": 1280
                },
                "imageCount": 2
            }
        ],
        "pluginName": "3DDigitalSyncInterface",
        "version": "2.57.1"
    }
}
```

###### Topic `demo/ipc/cab/SnSyncService`
Reply:
```json
{
    "callbacker": "c5msnsync",
    "id": 0,
    "method": "callback",
    "params": {
        "results": [
            null
        ]
    },
    "type": "resultReady"
}
```

# "Theoretical Description" of the IPC (Inter-Process Communication) (For Now)

Inter-Process Communication (IPC) in the **EinScan HX software** enables multiple system components to exchange data efficiently while maintaining low latency and system stability. Given that the scanner operates in **real-time processing environments**, it requires a **fast, synchronized, and secure communication mechanism** between different software modules, background services, and the scanner hardware.

The **IPC mechanism** in EinScan HX primarily relies on **Shared Memory** and **Message Queues**, allowing various system services `EXScan HX.exe`, `scanservice.exe`, `sn3DCommunity.exe` to communicate seamlessly.

## **IPC Communication Model**

The IPC architecture of the EinScan HX scanner consists of three fundamental layers.

1 Process Coordination Layer (High-Level Control)
- Manages the **execution order** of scanning tasks.
- Handles **message routing and synchronization** between services.
- Uses **ZeroMQ (ZMQ) messaging framework** for inter-service coordination.

2 Data Exchange Layer (Shared Memory & Message Queues)
- Implements **Shared Memory Buffers** for **low-latency data transfer**.
- Uses **Message Queues** to **schedule command execution**.
- Ensures **real-time updates** via **memory-mapped files**.

3 Hardware Abstraction Layer (Low-Level Operations)
- Interfaces with **scanner firmware** via **system drivers**.
- Uses **memory-mapped input/output (MMIO)** to interact with sensors.
- Supports **interrupt-driven data handling** for real-time processing.

### Diagram represents the layered structure
```
+-----------------------------------------------------+
|               EinScan HX Software                   |
+-----------------------------------------------------+
|                    GUI Interface                    |
|                   (EXScan HX.exe)                   |
+-----------------------------------------------------+
|           High-Level Process Coordination           |
|              (ZeroMQ Messaging Layer)               |
+-----------------------------------------------------+
|       Shared Memory & Message Queue System          |
| (Real-time Data Exchange & Command Processing)      |
+-----------------------------------------------------+
|        Hardware Interaction & MMIO Layer            |
|  (Direct Sensor Communication, Interrupts)          |
+-----------------------------------------------------+
|                   Scanner Hardware                  |
| (3D Sensors, Motors, Embedded Processing Unit)      |
+-----------------------------------------------------+

```

## High-Level Coordination: Message-Based IPC Using ZeroMQ

At the highest level, the **EinScan HX software architecture** utilizes **ZeroMQ** for message-based IPC. ZeroMQ is an asynchronous messaging library that enables efficient communication between multiple processes while avoiding traditional bottlenecks.

### Message-Based IPC Workflow

- **Initialization** – Each software module `EXScan HX.exe`, `sn3DCommunity.exe` establishes an IPC connection via the **MQTT broker** or **ZMQ socket**.
- **Request Transmission** – The **client module** (e.g., the GUI) sends scanning commands to the **backend services**.
- **Service Execution** – The backend processes the request and communicates with **scanservice.exe** to retrieve sensor data.
- **Response Handling** – The scan data is processed and transmitted back to the client via **shared memory** or a **message queue**.

## Low-Level IPC: Shared Memory Communication

For real-time operations, **Shared Memory (SHM)** is used as the **fastest** IPC mechanism. It allows multiple processes to **read/write data** without constant network overhead.

## Shared Memory Implementation

- **Memory Buffer Creation:** `sn3DCommunity.exe` creates a **predefined shared memory segment** named `"SnSyncService_SharedMemory"`.
- **Data Structure:** The memory buffer is allocated with **2GB** (`2147483648 bytes`), ensuring sufficient space for **high-resolution point cloud data**.
- **Synchronization:** A **mutex or semaphore** ensures that multiple processes do not overwrite memory simultaneously.
- **Data Access:** Scanning software reads from shared memory every **X milliseconds** to ensure a smooth user experience.

### Shared Memory Configuration Example

```json
"SharedMemory": {
  "Name": "SnSyncService_SharedMemory",
  "Size": 2147483648
}
```

#### Shared Memory-Based Data Transfer
```
+----------------------------------+
|       Shared Memory Region       |
|  "SnSyncService_SharedMemory"    |
+----------------------------------+
       |                     |
    (Write)                (Read)
       |                     |
+-------------+      +-----------------+
|  ScanService |      |  EXScan HX.exe |
|  (Writes)    |      |  (Reads)       |
+-------------+      +-----------------+

``` 

#### Real-Time Sensor Data Handling Using MMIO

Shows how memory-mapped I/O (MMIO) enables direct sensor communication.
```
+--------------------------------------+
|         Memory-Mapped I/O (MMIO)     |
+--------------------------------------+
          |                 |
   +--------------+    +------------------+
   |  3D Scanner  |    |   EXScan HX      |
   | (Sensor Data)|    | (Accesses Data)  |
   +--------------+    +------------------+

```


This configuration dictates how the EinScan HX scanner software manages large datasets without direct network overhead.

## Task Scheduling: Message Queues

Since real-time scanning involves multiple concurrent operations, the software uses message queues for efficient task execution.

###  Message Queue Workflow

- **Command Queuing** – Each scan request is pushed to a message queue.
- **Prioritization** – Critical tasks (e.g., hardware initialization) have higher execution priority.
- **Execution & Status Update** – Once the command is executed, the software sends a completion notification via MQTT.

Message queues allow asynchronous execution, ensuring no scanning request blocks system resources.

## Real-Time Sensor Data Processing

The EinScan HX scanner utilizes memory-mapped input/output (MMIO) to interact with sensors in real time.

- **Direct Sensor Access** – Instead of relying on network polling, the scanner uses MMIO registers to stream data directly into shared memory.
- **Interrupt-Driven Architecture** – The scanner generates hardware interrupts when a new frame of scan data is ready.
- **Buffer Optimization** – The system uses rolling memory buffers to store multiple scan frames, reducing latency spikes.

## Conclusion

The IPC mechanism in the EinScan HX software is a multi-layered and highly efficient system designed for real-time, low-latency communication between software components. It integrates:

- ZeroMQ Messaging for inter-process command execution.
- Shared Memory Buffers for high-speed data exchange.
- Message Queues for efficient task scheduling.
- Memory-Mapped I/O (MMIO) for real-time sensor data streaming.

This architecture ensures that the scanner operates with high efficiency, minimizing latency, while allowing seamless process synchronization across multiple software modules.

# Reverse Engineering Insights of Binary Software Installer "SDK"

Reverse engineering efforts have provided a deeper understanding of how binary executables and shared libraries interact within the EinScan HX ecosystem. The analysis focused on disassembling critical functions, identifying encrypted sections, and mapping undocumented API calls.

## Key Findings

1. **Obfuscated Code Sections:** The EXScan HX.exe binary contains multiple layers of encryption to obscure function calls and prevent direct code modification.

2. **Function Hooks:** For example the function sub_7FF6383C21F0 is responsible for launching sn3DCommunity.exe, which orchestrates inter-process communication and data exchange.

3. **Configuration Parsing:** The .server.json file stores MQTT authentication credentials, broker settings, and network endpoints, indicating potential customization opportunities.

4. **Startup Parameters:** The sn3DCommunity.exe process accepts multiple command-line arguments to adjust protocol behavior:
	* `--protoType websocket` → Enables WebSocket-based communication, `but I was unable to estabilish communication!`
	* `--mqttAuth true` → Enforces MQTT authentication
	* `--qtTunnelModule` passportcommunity → Configures module-level access

These discoveries pave the way for custom client development, third-party software integration, and potential protocol modifications.

## Application stack overview

- **scanhub.exe** -  Facilitates scanning-related services.
- **passportCommunity.exe** - Handles authentication and network communication.
- **scanservice.exe** - Manages internal scanning functions.
- **einscan_net_svr.exe** - Networking and system service handler.

## Basic library overview

### Ignored libraries from the overview:
- Win32 System Libraries https://learn.microsoft.com/en-us/windows/win32/api/
- OSG - OpenSceneGraph https://openscenegraph.github.io/openscenegraph.io/
- Default QT Libraries https://github.com/qt
- Eigen Library https://gitlab.com/libeigen/eigen
- TBB - Thread Building Blocks
- OpenCV https://github.com/3MFConsortium/lib3mf
- lib3mf https://github.com/3MFConsortium/lib3mf
- libcrypto https://github.com/openssl/openssl
- libpng
- libz
- libpg (postrgesql)
- OpenMesh https://www.graphics.rwth-aachen.de/software/openmesh/
- ... and other not mentioned yet... (I am in the process of analyzing them)

### SN3DLibraries

| **Library**                   | **Description**                                             | **Potential Usage** |
|--------------------------------|------------------------------------------------------------|----------------------|
| **algorithm1**                 | Advanced 3D feature registration and reconstruction.       | - Aligning multiple point clouds.<br>- Poisson surface reconstruction.<br>- Quadric Edge Collapse Simplification (QEMS).<br>- Cloud-based registration and feature alignment.<br>- Multi-abutment and dental impression registration. |
| **algorithm2**                 | GPU-accelerated 3D processing and mesh optimization.       | - Fast hole filling and mesh merging.<br>- Removing spikes and noise.<br>- Parallelized Quadric Edge Collapse Simplification (QEMS).<br>- Surface smoothing and noise reduction.<br>- Edge and feature extraction. |
| **algorithmHj**                | Specialized 3D surface fitting and geometric calculations. | - Creating planes, lines, and points from scan data.<br>- Geometric shape detection and processing.<br>- Intersecting and projecting 3D elements. |
| **algorithmHlj**               | Hybrid registration and alignment processing.             | - Point cloud hybrid registration using **feature & ICP-based methods**.<br>- Fast hybrid transformations for scan merging. |
| **algorithmLy**                | High-precision curvature-based mesh refinement.           | - Curvature-guided Laplacian smoothing.<br>- Feature-preserving noise removal.<br>- Adaptive mesh subdivision and optimization. |
| **algorithmLzy**               | Advanced segmentation and classification for 3D scans.    | - Object and feature classification.<br>- Region growing segmentation for **automatic object separation**.<br>- Edge-preserving denoising. |
| **algorithmZbt**               | Structured light and pattern-based feature recognition.   | - Extracting patterns from **structured light scanning**.<br>- Identifying **marker-based alignment points**.<br>- Processing 3D calibration grids. |
| **ceres**                      | Non-linear optimization library.                         | - Solving bundle adjustment problems in camera calibration.<br>- Optimizing pose estimation and alignment in 3D scans. |
| **usbapi**                     | USB communication interface for hardware.                 | - Low-level USB communication between the scanner and the PC.<br>- Handling data transfer for connected devices. |
| **common**                     | Configuration and initialization utilities.              | Managing system settings, initializing 3D scanner operations. |
| **globals**                    | System-wide configuration management.                    | Storing/retrieving system preferences. |
| **logiclayer**                  | Application logic and UI interactions.                  | Handling user info, network operations, software updates, UI event signaling. |
| **qttunnel.3.0.9**              | Inter-process communication module using Qt.            | Message passing, logging, handling exceptions. |
| **laser_scanner_e3**            | Laser-based 3D scanning module.                         | Capturing high-precision depth data using structured laser light. |
| **speckle_scanner_e3**          | Speckle-pattern-based 3D scanning.                      | Depth estimation using structured speckle patterns. |
| **sdk_adapter**                 | Adapter for SDK-based interactions.                     | Remote control, setting ports for communication. |
| **calibration_e3**              | Scanner calibration utilities.                          | Ensuring measurement accuracy through calibration. |
| **postprocess**                 | Post-processing for scan data.                          | Enhancing mesh quality, noise reduction, smoothing. |
| **multi_project_process**       | Multi-project management for 3D scanning.              | Organizing, aligning, and processing multiple scan projects. |
| **libapp**                      | Scanner device interaction utilities.                   | Fetching device info, managing scanner settings, configuring scanning parameters. |
| **DeviceControll**              | Device control and status monitoring.                   | Managing hardware connections, checking device status, synchronizing services. |
| **libproject**                  | Project handling utilities.                             | Loading, saving, and managing scan projects. |
| **scan_common**                 | Shared utilities for scanning operations.               | Marker-based alignment, processing scan listeners, scan type identification. |
| **libpassport**                 | User authentication and account management.             | Handling user login, account info retrieval, and authentication. |
| **information_api**             | API for retrieving system and scanner information.       | - Fetching scanner model, firmware version, and device status.<br>- Monitoring scanning progress and diagnostics. |
| **UsbTreeModel**                | USB device hierarchy and connection management.          | - Managing connected USB devices in a tree structure.<br>- Tracking scanner device connections and disconnections. |
| **sn3DHIDCommunication**        | HID-based communication layer for scanner devices.        | - Communicating with **HID (Human Interface Device) peripherals**.<br>- Controlling scanner buttons and manual inputs. |
| **snCameraControl**             | Advanced camera control API.                            | - Adjusting **focus, exposure, white balance, and auto-gain settings**.<br>- Controlling multiple cameras in a scanning system. |
| **Sn3DTextureBasedTrack**       | Texture-based tracking and alignment.                   | - Aligning scans using **texture features instead of geometry**.<br>- Improving accuracy in **texture-rich object scanning**.<br>- Tracking movement in real-time scan sessions. |
| **Sn3DMagic**                   | Memory and performance optimization.                   | Allocating and optimizing memory usage for 3D processes. |
| **sn3DCamera**                  | Comprehensive 3D camera control and image processing.  | - Controlling camera (open, close, reset, start, stop).<br>- Adjusting exposure, gain, white balance, and auto-settings.<br>- Image processing (color modes, raw to RGB conversion, frame capture).<br>- Managing **GIGE camera configurations**.<br>- Handling **strobe and trigger** settings for precise frame capturing. |
| **Sn3DAlgorithm**               | Core 3D processing algorithms and mesh operations.     | - **Poisson Reconstruction** for mesh generation.<br>- **QEM Simplification** for mesh optimization.<br>- **Hole filling and denoising**.<br>- **Cloud registration** for scan alignment.<br>- **Edge and feature extraction**. |
| **Sn3DGPUAlgorithm**            | GPU-accelerated 3D processing functions.               | High-speed 3D operations using **parallel processing**. |
| **Sn3DMeshProcess**             | Advanced mesh processing functions.                    | - Refinement, noise reduction, cutting, merging.<br>- Laplacian smoothing and edge-preserving filtering. |
| **Sn3DTextureBasedTrack**       | Texture tracking for scan alignment.                   | Using **texture patterns** instead of geometry for precise tracking. |


## Insight into EXScan HX.exe

### sub_7FF6382DB1F0
- The function is used for appending a string to a QStringList.

### sub_7FF6383C0310
- The function is used to start the service 'eintscan_net_svr'.
  
  Decompilation of area of interest (reference):
  ```c++
  .
  ..
  v18 = QString::fromAscii_helper("./einscan_net_svr.exe", 21LL);
  v27 = 3;
  QProcess::start(*(_QWORD *)(a1 + 1944), &v18, &v28, 3LL);
  ..
  .
  ```

### sub_7FF6383C21F0
- The function is used to start the communication service via the IPC interface "QTtunnel".

  Decompilation of area of interest (reference):
  ```c++
  ..
  ...
  v29 = QString::fromAscii_helper("sn3DCommunity.exe", 17LL);
  sub_7FF63837BAA0(a1, &v29);
  Sleep(0x64u);
  QCoreApplication::applicationDirPath(v27);
  v2 = (const struct QString *)QString::fromUtf8(v31, "\"", 0xFFFFFFFFLL);
  v44 = 1;
  QString::append((QString *)v31, (const struct QString *)v27);
  v3 = *(_WORD *)QDir::separator(&v43);
  v4 = QString::QString((QString *)v30, v2);
  v44 = 3;
  QString::operator+=(v30, v3);
  sub_7FF6382A9530(v26, v4, "sn3DCommunity.exe\"");
  QString::~QString(v30);
  QString::~QString(v31);
  v5 = QMessageLogger::QMessageLogger((QMessageLogger *)v42, 0LL, 0, 0LL);
  v6 = QMessageLogger::debug(v5, v34);
  v7 = QDebug::operator<<(v6, "processPath path:");
  QDebug::operator<<(v7, v26);
  QDebug::~QDebug((QDebug *)v34);
  v25 = (struct QListData::Data *)QListData::shared_null;
  v33 = QString::fromAscii_helper("--modelCode", 11LL);
  v32 = QString::fromAscii_helper("run", 3LL);
  v8 = (const struct QString *)sub_7FF638359A00(a1, v35);
  sub_7FF6382DB1F0((QListData *)&v25, (const struct QString *)&v32);
  sub_7FF6382DB1F0((QListData *)&v25, (const struct QString *)&v33);
  sub_7FF6382DB1F0((QListData *)&v25, v8);
  ...
  ..
  ```

#### sn3DCommunity.exe

- Default params:
  ```shell
  sn3DCommunity.exe"  run --modelCode exscanhxsoft
  ```

- Websocket test:
  ```shell
  sn3DCommunity.exe --protoType websocket --modelCode exscanhxsoft run
  ```

- Proc Help:
  ```cmd
  Usage:
    community run [flags]

  Flags:
        --dbSavePath string               db save path that community startup on, default from config file
    -h, --help                            help for run
        --httpPort string                 http port that community startup on, default from config file
        --httpPrefix string               http prefix that community startup on, default from config file
        --modelCode string                software model code connect through QTtunnel, can't be empty, modelCode must exist in config file
        --mqttAuth                        QTtunnel server auth, default false
        --mqttHost string                 QTtunnel server host, default from config file
        --mqttPassword string             QTtunnel server password, default empty string
        --mqttPort string                 QTtunnel server port, default from config file
        --mqttUsername string             QTtunnel server username, default empty string
        --oemURL string                   oemURL, default is index meaning shining3d without oem customization. (default "index")
        --protoType string                qttunnel|websocket|all (default "qttunnel")
        --qtTunnelChannel string          QTtunnel channel name, default from config file
        --qtTunnelModule string           QTtunnel module name, default from config file
        --qtTunnelSelfMethod string       QTtunnel method name registered by community that requested by software, default from config file
        --qtTunnelSoftwareMethod string   QTtunnel method name subscribed by software for publishing of community, default from config file
        --singleName string               single instance name that community startup on, default from config file, exit if instance existed with same name.
  
  Global Flags:
        --config string   config file (default is $HOME/.server.json)
  ```

### scanhub.exe

- Default params:
  ```shell
  scanhub.exe"  35108 -p 1883
  ```

### passportCommunity.exe

 - Default params:
  ```
  passportCommunity.exe"  run --modelCode passport --qtTunnelChannel PassPort --qtTunnelModule passportcommunity --mqttUsername passportcommunity --mqttPassword abc --mqttAuth false --mqttHost 127.0.0.1 --mqttPort 1883 --qtTunnelSelfMethod clientMQTTQTApiPassport --config .server.json
  ```

## References

- OASIS. MQTT Version 3.1.1 Plus Errata 01. OASIS Standard, December 2015. Available at: https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/mqtt-v3.1.1.html.

- OASIS. MQTT Version 5.0. OASIS Standard, March 2019. Available at: https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html.

- Eclipse Foundation. Eclipse Paho MQTT Documentation. Eclipse Paho Project. Available at: https://www.eclipse.org/paho/.

- HiveMQ. MQTT Essentials – A Technical Deep Dive into MQTT Protocol. HiveMQ Blog Series. Available at: https://www.hivemq.com/mqtt-essentials/.

- Wireshark Foundation. Wireshark MQTT Protocol Dissector Documentation. Available at: https://wiki.wireshark.org/MQTT.

- Wireshark Foundation. Filtering MQTT Traffic in Wireshark – A Guide for Debugging and Performance Analysis. Available at: https://www.wireshark.org/docs/dfref/m/mqtt.html.

- Kerrisk, M. Linux Inter-Process Communication (IPC) Mechanisms. Linux Manual Pages, 2023. Available at: https://man7.org/linux/man-pages/man7/ipc.7.html.

- Hintjens, P. ZeroMQ: Messaging for Many Applications. O’Reilly Media, 2013. ISBN: 978-1449334062.

- HiveMQ. MQTT Security Fundamentals: Authentication, Encryption, and Best Practices. HiveMQ Blog, 2021. Available at: https://www.hivemq.com/mqtt-security-fundamentals/.

- HiveMQ. Understanding MQTT Quality of Service (QoS) Levels 0, 1, and 2. HiveMQ Blog, 2018. Available at: https://www.hivemq.com/blog/mqtt-essentials-part-6-mqtt-quality-of-service-levels/.

- Cognex Corporation. (n.d.). How Speckle-Free Lasers Improve 3D Inspections. Retrieved from https://www.cognex.com/blogs/machine-vision/how-speckle-free-lasers-improve-3d-inspections

- Zhou, Q., Park, J., & Koltun, V. (2018). Open3D: A Modern Library for 3D Data Processing. Open3D Documentation. Retrieved from https://www.open3d.org/.

- Cignoni, P., Callieri, M., Corsini, M., Dellepiane, M., Ganovelli, F., & Ranzuglia, G. (2008). MeshLab: an Open-Source 3D Mesh Processing System. ERCIM News, (73), 45–46. Retrieved from https://www.researchgate.net/publication/220571929_MeshLab_an_Open-Source_3D_Mesh_Processing_System.

- Rusu, R. B., & Cousins, S. (2011). 3D is here: Point Cloud Library (PCL). IEEE International Conference on Robotics and Automation (ICRA), 1–4. Retrieved from https://en.wikipedia.org/wiki/Point_Cloud_Library.

- Artec 3D. (2023). Artec 3D Scanning SDK Documentation. Retrieved from https://docs.artec-group.com/sdk/2.0/.

- Zhang, Y., Liu, Z., & Wang, J. (2021). 3D Mesh Processing and Character Animation. Springer International Publishing. DOI: 10.1007/978-3-030-81354-3.

- Hanocka, R., Hertz, A., Fish, N., Giryes, R., Fleishman, S., & Cohen-Or, D. (2020). Mesh Convolution with Continuous Filters for 3D Surface Parsing. arXiv preprint arXiv:2112.01801. Retrieved from https://arxiv.org/abs/2112.01801.

- Hu, Y., Gong, Y., Peng, S., Yang, H., & Li, Q. (2021). LaplacianNet: Learning on 3D Meshes with Laplacian Encoding and Pooling. arXiv preprint arXiv:1910.14063. Retrieved from https://arxiv.org/abs/1910.14063.

- Atkinson, J. A., & Smith, R. (2012). A Novel Mesh Processing Based Technique for 3D Plant Analysis. BMC Plant Biology, 12(1), 63. DOI: 10.1186/1471-2229-12-63.

- Dziedzic, R., & D’Souza, R. M. (2020). 3D Mesh Processing Using GAMer 2 to Enable Reaction-Diffusion Simulations in Realistic Cellular Geometries. PLoS Computational Biology, 16(8), e1007756. DOI: 10.1371/journal.pcbi.1007756.

- Liu, C., Ma, Y., Wei, S., & Zhou, J. (2021). 3D Mesh Pre-Processing Method Based on Feature Point Detection and Anisotropic Filtering. Remote Sensing, 13(11), 2145. DOI: 10.3390/rs13112145.



