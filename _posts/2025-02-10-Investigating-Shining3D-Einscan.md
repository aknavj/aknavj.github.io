> NOTE: This article is still under research, and there may be inconsistencies or incomplete/inaccurate information. Most of the work was conducted using version `EinScan HX v1.3.0.3` with the older SDK and `Shining3D/SDKDoc` as a reference point. However, recent updates have been largely based on in-depth investigation of `EinScan HX v1.4.1.2`.

### Article changelog:

```
11. Feb 2025: Section for `Network and Reverse Engineering Insights` is rewritten and closed due to the PoC python script.
10. Feb 2025: Draft of IPC Communication Model is created and most of the Binary libraries are mapped.
9. Feb 2025: Draft of the article published, written form is restructured.
```

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
  - [x] Monitor running:
	- [x] process
  	- [x] trees
   	- [x] IPC map events
  - [x] Monitor network activity
- [x] Identify the minimum requirements to establish TCP / MQTT / WebSocket communication with `sn3DCommunity.exe` running in the background
- [x] Write a utility "Hello World" program that extracts basic METADATA
- [ ] Write a low-level IPC communication utility for extracting live scanner Image data
- [ ] Develop a backend engine plugin
- [ ] Develop a frontend plugin for the engine editor
- [ ] ~~Write tests~~ (not needed)

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

The EinScan HX scanner utilizes an advanced network communication framework, integrating MQTT (Message Queuing Telemetry Transport) and ZeroMQ messaging to ensure seamless, low-latency interactions between the scanner, the host PC, and third-party applications.

### MQTT Communication Workflow

1. **Client Initialization**: The scanner initiates a connection with an MQTT broker, typically hosted locally on 127.0.0.1:1883.
2. **Authentication Handshake**: A secure, AES-encrypted challenge-response mechanism verifies the identity of the scanner and the software.
3. **Message Subscription**: The scanner subscribes to MQTT topics that govern device metadata retrieval, command execution, and event notifications.
4. **Command Execution**: JSON-structured requests are sent to manage scanning parameters, initiate scanning procedures, and retrieve data.

### MQTT Communication Architecture

The architecture of MQTT communication follows a well-defined message distribution system involving publishers, subscribers, and the broker. Below is a conceptual class diagram illustrating the structure:

```
        +---------------------+
        |     MQTT Broker     |
        |---------------------|
        | + manageTopics()    |
        | + dispatchMessages()|
        +----------+----------+
                   |
        +----------------------+----------------------+
        |                                            |
    +--------v--------+                         +----v----+
    |    Publisher    |                         | Subscriber |
    |-----------------|                         |-----------|
    | - topic         |                         | - topic   |
    | + publish(msg)  |                         | + subscribe(topic) |
    +---------+-------+                         +-----+-----+
              |                                       |
              | Publishes messages                   | Receives messages
              |                                       |
         +----v--------+                       +----v--------+
         | Client      |                       | Client      |
         |-------------|                       |-------------|
         | - clientID  |                       | - clientID  |
         | + connect() |                       | + connect() |
         | + send()    |                       | + receive() |
         +------------+                       +-------------+
```

### Network Traffic Analysis

By utilizing tools such as Wireshark, network interactions can be examined to extract vital information about the scanner’s communication process. Filters such as `tcp.port == 1883` capture MQTT communication, while `mqtt.msgtype == 12 || mqtt.msgtype == 13` helps isolate heartbeat signals.

#### Wireshark Packet Analysis

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

#### Flowchart representing MQTT communication flow

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

### MQTT Topic Routes 

For examing trafic of the MQTT Topic Routes in postman use 'MQTT version 3' protocol with '"Auth Type = Basic Auth"'.

> Username: SnSyncService
> 
> Password: X03MO1qnZdYdgyfeuILPmQ==

#### Published Topics
- `demo/info/modules/SnSyncService/password`
- `demo/info/modules/SnSyncService/status`
- `demo/ipc/pub/SnSyncService/moduleInitialized`
- `demo/info/modules/c5msnsync/password`
- `demo/info/modules/c5msnsync/status`
- `demo/ipc/pub/SnSyncService/message`
- `demo/ipc/req/SnSyncService/execute`
- `demo/ipc/rep/c5msnsync`

#### Subscribed Topics
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

### PoC implementation in python

The following Python script establishes an MQTT client using the Paho MQTT library to connect to a broker, authenticate, and subscribe to multiple topics related to **SnSyncService**. It handles incoming messages, manages disconnections, and includes a reconnection strategy to ensure continuous operation. 

```python
import paho.mqtt.client as mqtt
import time

# MQTT Configuration
BROKER = "localhost"
PORT = 1883
TOPICS = [
    "demo/info/#",
    "demo/ipc/rep/SnSyncService",
    "demo/ipc/cab/SnSyncService",
    "demo/ipc/req/SnSyncService/execute",
    "demo/ipc/req/SnSyncService/errorInfo",
    "demo/ipc/req/SnSyncService/exit",
    "demo/ipc/pub/SnSyncService/message",
    "demo/ipc/pub/SnSyncService/moduleInitialized",
    "demo/ipc/map/SnSyncService/aboutToExit",
    "demo/ipc/map/SnSyncService/callback",
    "demo/ipc/map/SnSyncService/calibrateCallback",
    "demo/ipc/rep/c5msnsync",
    "demo/ipc/cab/c5msnsync"
]

# Authentication
USERNAME = "SnSyncService"
PASSWORD = "X03MO1qnZdYdgyfeuILPmQ=="

# Reconnection Delay
RETRY_DELAY = 5  # Seconds before retrying

# Initialize MQTT Client
client = mqtt.Client()

# Set Authentication
client.username_pw_set(USERNAME, PASSWORD)

# Callback for successful connection
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[INFO] Connected to MQTT Broker at {BROKER}:{PORT}")
        for TOPIC in TOPICS:
            client.subscribe(TOPIC)
            print(f"[INFO] Subscribed to topic: {TOPIC}")
    else:
        print(f"[ERROR] Connection failed with return code {rc}")
        print(f"[INFO] Retrying in {RETRY_DELAY} seconds...")
        time.sleep(RETRY_DELAY)
        client.reconnect()

# Callback for message reception
def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode("utf-8")
        print(f"[INFO] Received message from {msg.topic}: {payload}")
    except Exception as e:
        print(f"[ERROR] Failed to process message: {e}")

# Callback for connection loss
def on_disconnect(client, userdata, rc):
    print(f"[WARNING] Disconnected from MQTT Broker (Code: {rc})")
    if rc != 0:
        print(f"[INFO] Attempting to reconnect in {RETRY_DELAY} seconds...")
        time.sleep(RETRY_DELAY)
        client.reconnect()

# Assign Callbacks
client.on_connect = on_connect
client.on_message = on_message
client.on_disconnect = on_disconnect

# Connect to MQTT Broker
while True:
    try:
        print(f"[INFO] Connecting to MQTT Broker {BROKER}:{PORT}...")
        client.connect(BROKER, PORT, 60)
        client.loop_forever()  # Keep listening for messages
    except Exception as e:
        print(f"[ERROR] MQTT Connection Failed: {e}")
        print(f"[INFO] Retrying in {RETRY_DELAY} seconds...")
        time.sleep(RETRY_DELAY)

```

### Conclusion

The EinScan HX scanner employs a structured and secure network communication system that ensures reliable data transmission and command execution. Through MQTT and ZeroMQ, it achieves low-latency synchronization between the scanning software and the hardware, facilitating real-time adjustments and data retrieval.

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
| **Sn3DAlgorithm**               | Core 3D processing algorithms and mesh operations.     | - **Poisson Reconstruction** for mesh generation.<br>- **QEM Simplification** for mesh optimization.<br>- **Hole filling and denoising**.<br>- **Cloud registration** for scan alignment.<br>- **Edge and feature extraction**. |
| **Sn3DGPUAlgorithm**            | GPU-accelerated 3D processing functions.               | High-speed 3D operations using **parallel processing**. |
| **SnCommon** | TODO | TODO |
| **Sn3DAVXImp** | TODO | TODO |
| **Sn3DCalibrationJR** | TODO | TODO | 
| **sn3DCamera**                  | Comprehensive 3D camera control and image processing.  | - Controlling camera (open, close, reset, start, stop).<br>- Adjusting exposure, gain, white balance, and auto-settings.<br>- Image processing (color modes, raw to RGB conversion, frame capture).<br>- Managing **GIGE camera configurations**.<br>- Handling **strobe and trigger** settings for precise frame capturing. |
| **snCameraControl**             | Advanced camera control API.                            | - Adjusting **focus, exposure, white balance, and auto-gain settings**.<br>- Controlling multiple cameras in a scanning system. |
| **Sn3DColorCorrect** | TODO | TODO |
| **Sn3DCork** | TODO | TODO |
| **Sn3DDental** | TODO | TODO |
| **Sn3DDigital** | TODO | TODO |
| **Sn3DDLPdev** | TODO | TODO |
| **Sn3DFaceUnity** | TODO | TODO |
| **sn3DHandiDLPDev** | TODO | TODO |
| **sn3DHandiSync** | TODO | TODO |
| **sn3DHIDCommunication**        | HID-based communication layer for scanner devices.        | - Communicating with **HID (Human Interface Device) peripherals**.<br>- Controlling scanner buttons and manual inputs. |
| **sn3DImageLoad** | TODO | TODO |
| **Sn3DImageQueue** | TODO | TODO |
| **sn3DLock** | TODO | TODO |
| **Sn3DMagic**                   | Memory and performance optimization.                   | Allocating and optimizing memory usage for 3D processes. |
| **Sn3DRegistration** | TODO | TODO |
| **Sn3DScanSlam** | TODO | TODO |
| **Sn3DSparseSolver** | TODO | TODO |
| **Sn3DTextureBasedTrack**       | Texture-based tracking and alignment.                   | - Aligning scans using **texture features instead of geometry**.<br>- Improving accuracy in **texture-rich object scanning**.<br>- Tracking movement in real-time scan sessions. |
| **Sn3DMeshProcess**             | Advanced mesh processing functions.                    | - Refinement, noise reduction, cutting, merging.<br>- Laplacian smoothing and edge-preserving filtering. |
| **SnSharedBlock**               | Shared memory management for 3D data structures.        | - Managing **shared blocks** for point clouds, meshes, frames, and custom data.<br>- Allocating, modifying, and retrieving memory blocks.<br>- Handling **partial data** for improved storage efficiency.<br>- Structuring **data offsets** for color, normal, and texture mapping.<br>- Supporting **multi-threaded** and **multi-session** data access. |

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

 RANSAC: Random Sample Consensus: A Paradigm for Model Fitting with Applications to Image Analysis and Automated Cartography. 1981 [[paper]](http://www.cs.ait.ac.th/~mdailey/cvreadings/Fischler-RANSAC.pdf)
- Locally Optimized RANSAC. 2003 [[paper]](ftp://cmp.felk.cvut.cz/pub/cmp/articles/matas/chum-dagm03.pdf)
- Graph-cut RANSAC. CVPR'2018 [[paper]](https://arxiv.org/abs/1706.00984) [[code]](https://github.com/danini/graph-cut-ransac)
- MAGSAC: Marginalizing Sample Consensus. CVPR'2019 [[paper]](http://openaccess.thecvf.com/content_CVPR_2019/papers/Barath_MAGSAC_Marginalizing_Sample_Consensus_CVPR_2019_paper.pdf) [[code]](https://github.com/danini/magsac)
- VFC: A Robust Method for Vector Field Learning with Application To Mismatch Removing. CVPR'2011 [[paper]](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.721.5913&rep=rep1&type=pdf)
- In Search of Inliers: 3D Correspondence by Local and Global Voting. CVPR'2014 [[paper]](http://www.cv-foundation.org/openaccess/content_cvpr_2014/papers/Buch_In_Search_of_2014_CVPR_paper.pdf)
- FGR: Fast Global Registration. ECCV'2016 [[paper]](https://vladlen.info/publications/fast-global-registration/) [[code]](https://github.com/intel-isl/FastGlobalRegistration)
- Ranking 3D Feature Correspondences Via Consistency Voting. PRL'2019 [[paper]](https://doi.org/10.1016/j.patrec.2018.11.018)
- An Accurate and Efficient Voting Scheme for a Maximally All-Inlier 3D Correspondence Set. TPAMI'2020 [[paper]](https://ieeexplore.ieee.org/ielx7/34/4359286/08955806.pdf) 
- GORE: Guaranteed Outlier Removal for Point Cloud Registration with Correspondences. TPAMI'2018 [[paper]](https://arxiv.org/abs/1711.10209) [[code]](https://cs.adelaide.edu.au/~aparra/project/gore/)
- A Polynomial-time Solution for Robust Registration with Extreme Outlier Rates. RSS'2019 [[paper]](https://arxiv.org/abs/1903.08588)
- Graduated Non-Convexity for Robust Spatial Perception: From Non-Minimal Solvers to Global Outlier Rejection. ICRA'2020 [[paper]](https://arxiv.org/abs/1909.08605)
- TEASER: Fast and Certifiable Point Cloud Registration. T-RO'2020 [[paper]](https://arxiv.org/abs/2001.07715) [[code]](https://github.com/MIT-SPARK/TEASER-plusplus)
- One Ring to Rule Them All: Certifiably Robust Geometric Perception with Outliers. NeurIPS'2020 [[paper]](https://arxiv.org/abs/2006.06769)
- SDRSAC: Semidefinite-Based Randomized Approach for Robust Point Cloud Registration without Correspondences. CVPR'2019 [[paper]](https://arxiv.org/abs/1904.03483) [[code]](https://github.com/intellhave/SDRSAC)
- Robust Low-Overlap 3D Point Cloud Registration for Outlier Rejection. ICRA'2019 [[paper]](https://arpg.colorado.edu/papers/hmrf_icp.pdf)
- ICOS: Efficient and Highly Robust Rotation Search and Point Cloud Registration with Correspondences. arxiv'2021 [[paper]](https://arxiv.org/pdf/2104.14763.pdf)
- Fast Semantic-Assisted Outlier Removal for Large-scale Point Cloud Registration. arxiv'2022 [[paper]](https://arxiv.org/pdf/2202.10579.pdf)
- A Single Correspondence Is Enough: Robust Global Registration to Avoid Degeneracy in Urban Environments. ICRA'2022 [[paper]](https://arxiv.org/pdf/2203.06612.pdf) [[code]](https://github.com/url-kaist/quatro)
- SC^2-PCR: A Second Order Spatial Compatibility for Efficient and Robust Point Cloud Registration. CVPR'2022 [[paper]](https://arxiv.org/abs/2203.14453) [[code]](https://github.com/ZhiChen902/SC2-PCR)
- HKS: A Concise and Provably Informative Multi‐Scale Signature Based on Heat Diffusion. CGF'2009 [[paper]](http://www.cs.jhu.edu/~misha/ReadingSeminar/Papers/Sun09.pdf)
- Harris3D: a robust extension of the harris operator for interest point detection on 3D meshes. VC'2011 [[paper]](http://www.ivan-sipiran.com/papers/SB11b.pdf)
- Intrinsic shape signatures: A shape descriptor for 3D object recognition. ICCV'2009 [[paper]](https://www.computer.org/csdl/proceedings/iccvw/2009/4442/00/05457637.pdf)
- Learning a Descriptor-Specific 3D Keypoint Detector. ICCV'2015 [[paper]](http://www.cv-foundation.org/openaccess/content_iccv_2015/papers/Salti_Learning_a_Descriptor-Specific_ICCV_2015_paper.pdf)
- 3DFeat-Net: Weakly Supervised Local 3D Features for Point Cloud Registration. ECCV'2018 [[paper]](https://arxiv.org/pdf/1807.09413.pdf) [[code]](https://github.com/yewzijian/3DFeatNet)
- USIP: Unsupervised Stable Interest Point Detection from 3D Point Clouds. ICCV'2019 [[paper]](https://openaccess.thecvf.com/content_ICCV_2019/papers/Li_USIP_Unsupervised_Stable_Interest_Point_Detection_From_3D_Point_Clouds_ICCV_2019_paper.pdf) [[code]](https://github.com/lijx10/USIP)
- D3Feat: Joint Learning of Dense Detection and Description of 3D Local Features. CVPR'2020 [[paper]](https://arxiv.org/abs/2003.03164) [[code]](https://github.com/XuyangBai/D3Feat)
- PointCloud Saliency Maps. ICCV'2019 [[paper]](http://arxiv.org/pdf/1812.01687) [[code]](https://github.com/tianzheng4/PointCloud-Saliency-Maps)
- SK-Net: Deep Learning on Point Cloud via End-to-end Discovery of Spatial Keypoints. AAAI'2020 [[paper]](https://arxiv.org/pdf/2003.14014.pdf)
- SKD: Unsupervised Keypoint Detecting for Point Clouds using Embedded Saliency Estimation. arxiv'2019 [[paper]](https://arxiv.org/pdf/1912.04943.pdf)
- Fuzzy Logic and Histogram of Normal Orientation-based 3D Keypoint Detection For Point Clouds. PRL'2020 [[paper]](https://www.sciencedirect.com/science/article/abs/pii/S016786552030180X)
- MaskNet: A Fully-Convolutional Network to Estimate Inlier Points. 3DV'2020 [[paper]](https://arxiv.org/abs/2010.09185) [[code]](https://github.com/vinits5/masknet)
- PREDATOR: Registration of 3D Point Clouds with Low Overlap. arxiv'2020 [[paper]](https://arxiv.org/pdf/2011.13005.pdf) [[code]](https://github.com/ShengyuH/OverlapPredator)
- SC3K: Self-supervised and Coherent 3D Keypoints Estimation from Rotated, Noisy, and Decimated Point Cloud Data. ICCV'2023 [[paper]](https://openaccess.thecvf.com/content/ICCV2023/papers/Zohaib_SC3K_Self-supervised_and_Coherent_3D_Keypoints_Estimation_from_Rotated_Noisy_ICCV_2023_paper.pdf) [[code]](https://github.com/IIT-PAVIS/SC3K)
- OASIS. MQTT Version 3.1.1 Plus Errata 01. OASIS Standard, December 2015. [[docs]](https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/mqtt-v3.1.1.html)
- Spin Image: Using spin images for efficient object recognition in cluttered 3D scenes. TPAMI'1999 [[paper]](https://pdfs.semanticscholar.org/30c3/e410f689516983efcd780b9bea02531c387d.pdf?_ga=2.267321353.662069860.1609508014-1451995720.1602238989)
- USC: Unique shape context for 3D data description. 3DOR'2010 [[paper]](http://www.vision.deis.unibo.it/fede/papers/3dor10.pdf)
- 3DShapeContext: Recognizing Objects in Range Data Using Regional Point Descriptors. ECCV'2004 [[paper]](http://www.ri.cmu.edu/pub_files/pub4/frome_andrea_2004_1/frome_andrea_2004_1.pdf)
- SHOT: Unique Signatures of Histograms for Local Surface Description. ECCV'2010 [[paper]](http://www.researchgate.net/profile/Samuele_Salti/publication/262111100_SHOT_Unique_Signatures_of_Histograms_for_Surface_and_Texture_Description/links/541066b00cf2df04e75d5939.pdf)
- FPFH: Fast Point Feature Histograms (FPFH) for 3D registration. ICRA'2009 [[paper]](http://www.cvl.iis.u-tokyo.ac.jp/class2016/2016w/papers/6.3DdataProcessing/Rusu_FPFH_ICRA2009.pdf)
- RoPS: 3D Free Form Object Recognition using Rotational Projection Statistics. WACV'2013 [[paper]](http://www.researchgate.net/profile/Ferdous_Sohel/publication/236645183_3D_free_form_object_recognition_using_rotational_projection_statistics/links/0deec518a1038a2980000000.pdf)
- CGF: Learning Compact Geometric Features. ICCV'2017 [[paper]](http://arxiv.org/pdf/1709.05056)
- 3DMatch: Learning Local Geometric Descriptors from RGB-D Reconstructions. CVPR'2017 [[paper]](http://arxiv.org/pdf/1603.08182) [[code]](https://github.com/andyzeng/3dmatch-toolbox)
- End-to-end learning of keypoint detector and descriptor for pose invariant 3D matching. CVPR'2018 [[paper]](http://arxiv.org/pdf/1802.07869)
- PPFNet: Global Context Aware Local Features for Robust 3D Point Matching. CVPR'2018 [[paper]](http://arxiv.org/pdf/1802.02669)
- 3DFeat-Net: Weakly Supervised Local 3D Features for Point Cloud Registration. ECCV'2018 [[paper]](https://arxiv.org/pdf/1807.09413.pdf) [[code]](https://github.com/yewzijian/3DFeatNet)
- MVDesc: Learning and Matching Multi-View Descriptors for Registration of Point Clouds. ECCV'2018 [[paper]](https://arxiv.org/pdf/1807.05653.pdf) [[code]](https://github.com/zlthinker/RMBP)
- FoldingNet: Point Cloud Auto-encoder via Deep Grid Deformation. CVPR'2018 [[paper]](http://arxiv.org/pdf/1712.07262) [[code]](https://github.com/XuyangBai/FoldingNet)
- PPF-FoldNet: Unsupervised Learning of Rotation Invariant 3D Local Descriptors. ECCV'2018 [[paper]](https://arxiv.org/abs/1808.10322) [[code]](https://github.com/XuyangBai/PPF-FoldNet)
- 3D Local Features for Direct Pairwise Registration. CVPR'2019 [[paper]](https://arxiv.org/abs/1904.04281)
- 3D Point-Capsule Networks. CVPR'2019 [[paper]](https://arxiv.org/abs/1812.10775) [[code]](https://github.com/yongheng1991/3D-point-capsule-networks)
- The Perfect Match: 3D Point Cloud Matching with Smoothed Densities. CVPR'2019 [[paper]](https://arxiv.org/abs/1811.06879) [[code]](https://github.com/zgojcic/3DSmoothNet)
- FCGF: Fully Convolutional Geometric Features. ICCV'2019 [[paper]](https://openaccess.thecvf.com/content_ICCV_2019/papers/Choy_Fully_Convolutional_Geometric_Features_ICCV_2019_paper.pdf) [[code]](https://github.com/chrischoy/FCGF)
- Learning an Effective Equivariant 3D Descriptor Without Supervision. ICCV'2019 [[paper]](https://arxiv.org/abs/1909.06887)
- D3Feat: Joint Learning of Dense Detection and Description of 3D Local Features. CVPR'2020 [[paper]](https://arxiv.org/abs/2003.03164) [[code]](https://github.com/XuyangBai/D3Feat)
- End-to-End Learning Local Multi-view Descriptors for 3D Point Clouds. CVPR'2020 [[paper]](https://arxiv.org/abs/2003.05855) [[code]](https://github.com/craigleili/3DLocalMultiViewDesc)
- LRF-Net- Learning Local Reference Frames for 3D Local Shape Description and Matching. arxiv'2020 [[paper]](https://arxiv.org/abs/2001.07832)
- DH3D: Deep Hierarchical 3D Descriptors for Robust Large-Scale 6DoF Relocalization. ECCV'2020 [[paper]](https://arxiv.org/pdf/2007.09217.pdf) [[code]](https://github.com/JuanDuGit/DH3D)
- Distinctive 3D local deep descriptors. arxiv'2020 [[paper]](https://arxiv.org/abs/2009.00258) [[code]](https://github.com/fabiopoiesi/dip)
- SpinNet: Learning a General Surface Descriptor for 3D Point Cloud Registration. CVPR'2021 [[paper]](https://arxiv.org/abs/2011.12149) [[code]](https://github.com/QingyongHu/SpinNet)
- PREDATOR: Registration of 3D Point Clouds with Low Overlap. CVPR'2021 [[paper]](https://arxiv.org/pdf/2011.13005.pdf) [[code]](https://github.com/ShengyuH/OverlapPredator)
- Self-supervised Geometric Perception. CVPR'2021 [[paper]](https://arxiv.org/abs/2103.03114) [[code]](https://github.com/theNded/SGP)
- 3D Point Cloud Registration with Multi-Scale Architecture and Self-supervised Fine-tuning. arxiv'2021 [[paper]](https://arxiv.org/abs/2103.14533) [[code]](https://github.com/humanpose1/MS-SVConv)
- Generalisable and Distinctive (GeDi) 3D local deep descriptors for point cloud registration. arxiv'2021 [[paper]](https://arxiv.org/pdf/2105.10382.pdf) [[code]](https://github.com/fabiopoiesi/gedi)
- Neighborhood Normalization for Robust Geometric Feature Learning. CVPR'2021 [[paper]](https://openaccess.thecvf.com/content/CVPR2021/papers/Liu_Neighborhood_Normalization_for_Robust_Geometric_Feature_Learning_CVPR_2021_paper.pdf) [[code]](https://github.com/lppllppl920/NeighborhoodNormalization-Pytorch)
- UnsupervisedR&R: Unsupervised Point Cloud Registration via Differentiable Rendering. CVPR'2021 [[paper]](https://arxiv.org/abs/2102.11870) [[code]](https://github.com/mbanani/unsupervisedRR)
- Bootstrap Your Own Correspondences. ICCV'2021 [[paper]](https://arxiv.org/abs/2106.00677) [[code]](https://github.com/mbanani/byoc)
- WSDesc: Weakly Supervised 3D Local Descriptor Learning for Point Cloud Registration. TVCG'2022 [[paper]](https://arxiv.org/abs/2108.02740) [[code]](https://github.com/craigleili/WSDesc)
- You Only Hypothesize Once: Point Cloud Registration with Rotation-equivariant Descriptors. ICCV'2021 [[paper]](https://arxiv.org/abs/2109.00182) [[code]](https://github.com/HpWang-whu/YOHO)
- P2-Net: Joint Description and Detection of Local Features for Pixel and Point Matching. ICCV'2021 [[paper]](https://openaccess.thecvf.com/content/ICCV2021/papers/Wang_P2-Net_Joint_Description_and_Detection_of_Local_Features_for_Pixel_ICCV_2021_paper.pdf)
- Distinctiveness oriented Positional Equilibrium for Point Cloud Registration. ICCV'2021 [[paper]](https://openaccess.thecvf.com/content/ICCV2021/papers/Min_Distinctiveness_Oriented_Positional_Equilibrium_for_Point_Cloud_Registration_ICCV_2021_paper.pdf)
- CoFiNet: Reliable Coarse-to-fine Correspondences for Robust Point Cloud Registration. NeurIPS'2021 [[paper]](https://arxiv.org/pdf/2110.14076.pdf) [[code]](https://github.com/haoyu94/Coarse-to-fine-correspondences)
- IMFNet: Interpretable Multimodal Fusion for Point Cloud Registration. arxiv'2021 [[paper]](https://arxiv.org/pdf/2111.09624.pdf)
- Lepard: Learning partial point cloud matching in rigid and deformable scenes. CVPR'2022 [[paper]](https://arxiv.org/abs/2111.12591) [[code]](https://github.com/rabbityl/lepard)
- Fast and Robust Registration of Partially Overlapping Point Clouds. RA-L'2021 [[paper]](https://arxiv.org/pdf/2112.09922.pdf) [[code]](https://github.com/eduardohenriquearnold/fastreg)
- Geometric Transformer for Fast and Robust Point Cloud Registration. CVPR'2022 [[paper]](https://arxiv.org/abs/2202.06688) [[code]](https://github.com/qinzheng93/GeoTransformer)
- ImLoveNet: Misaligned Image-supported Registration Network for Low-overlap Point Cloud Pairs. SIGGRAPH'2022 [[paper]](https://arxiv.org/pdf/2207.00826.pdf)
- Learning to Register Unbalanced Point Pairs. arxiv'2022 [[paper]](https://arxiv.org/abs/2207.04221)
- OASIS. MQTT Version 5.0. OASIS Standard, March 2019. [[docs]](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html)
- Eclipse Foundation. Eclipse Paho MQTT Documentation. Eclipse Paho Project. [[docs]](https://www.eclipse.org/paho/)
- HiveMQ. MQTT Essentials – A Technical Deep Dive into MQTT Protocol. HiveMQ Blog Series. [[docs]](https://www.hivemq.com/mqtt-essentials/)
- Wireshark Foundation. Wireshark MQTT Protocol Dissector Documentation. [[article]](https://wiki.wireshark.org/MQTT)
- Wireshark Foundation. Filtering MQTT Traffic in Wireshark – A Guide for Debugging and Performance Analysis. [[article]](https://www.wireshark.org/docs/dfref/m/mqtt.html)
- Kerrisk, M. Linux Inter-Process Communication (IPC) Mechanisms. Linux Manual Pages, 2023. [[docs]](https://man7.org/linux/man-pages/man7/ipc.7.html)
- Hintjens, P. ZeroMQ: Messaging for Many Applications. O’Reilly Media, 2013. ISBN: 978-1449334062.
- HiveMQ. MQTT Security Fundamentals: Authentication, Encryption, and Best Practices. HiveMQ Blog, 2021. [[article]](https://www.hivemq.com/mqtt-security-fundamentals/)
- HiveMQ. Understanding MQTT Quality of Service (QoS) Levels 0, 1, and 2. HiveMQ Blog, 2018. [[article]](https://www.hivemq.com/blog/mqtt-essentials-part-6-mqtt-quality-of-service-levels/)
- Cognex Corporation. (n.d.). How Speckle-Free Lasers Improve 3D Inspections. [[article]](https://www.cognex.com/blogs/machine-vision/how-speckle-free-lasers-improve-3d-inspections)
- Zhou, Q., Park, J., & Koltun, V. (2018). Open3D: A Modern Library for 3D Data Processing. Open3D Documentation. [[docs]](https://www.open3d.org/)
- Cignoni, P., Callieri, M., Corsini, M., Dellepiane, M., Ganovelli, F., & Ranzuglia, G. (2008). MeshLab: an Open-Source 3D Mesh Processing System. ERCIM News, (73), 45–46. [[paper]](https://www.researchgate.net/publication/220571929_MeshLab_an_Open-Source_3D_Mesh_Processing_System)
- Rusu, R. B., & Cousins, S. (2011). 3D is here: Point Cloud Library (PCL). IEEE International Conference on Robotics and Automation (ICRA), 1–4. [[article]](https://en.wikipedia.org/wiki/Point_Cloud_Library)
- Artec 3D. (2023). Artec 3D Scanning SDK Documentation. [[article]](https://docs.artec-group.com/sdk/2.0/)
- Zhang, Y., Liu, Z., & Wang, J. (2021). 3D Mesh Processing and Character Animation. Springer International Publishing. DOI: 10.1007/978-3-030-81354-3.
- Hanocka, R., Hertz, A., Fish, N., Giryes, R., Fleishman, S., & Cohen-Or, D. (2020). Mesh Convolution with Continuous Filters for 3D Surface Parsing. arXiv preprint arXiv:2112.01801. [[paper]](https://arxiv.org/abs/2112.01801)
- Hu, Y., Gong, Y., Peng, S., Yang, H., & Li, Q. (2021). LaplacianNet: Learning on 3D Meshes with Laplacian Encoding and Pooling. arXiv preprint arXiv:1910.14063. [[paper]](https://arxiv.org/abs/1910.14063)
- Atkinson, J. A., & Smith, R. (2012). A Novel Mesh Processing Based Technique for 3D Plant Analysis. BMC Plant Biology, 12(1), 63. DOI: 10.1186/1471-2229-12-63.
- Dziedzic, R., & D’Souza, R. M. (2020). 3D Mesh Processing Using GAMer 2 to Enable Reaction-Diffusion Simulations in Realistic Cellular Geometries. PLoS Computational Biology, 16(8), e1007756. DOI: 10.1371/journal.pcbi.1007756.
- Liu, C., Ma, Y., Wei, S., & Zhou, J. (2021). 3D Mesh Pre-Processing Method Based on Feature Point Detection and Anisotropic Filtering. Remote Sensing, 13(11), 2145. DOI: 10.3390/rs13112145.



