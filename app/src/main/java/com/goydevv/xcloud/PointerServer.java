package com.goydevv.xcloud;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class PointerServer {
    public static final byte ACTION_MOVE = 1;
    public static final byte ACTION_BUTTON_PRESS = 2;
    public static final byte ACTION_BUTTON_RELEASE = 3;
    public static final byte ACTION_SCROLL = 4;
    public static final byte ACTION_POINTER_CAPTURE_CHANGED = 5;
    public static final byte ACTION_PROTOCOL_VERSION = 127;
    public static final short PROTOCOL_VERSION = 2;

    private final int port;
    private ServerSocket serverSocket;
    private volatile boolean running = false;
    private final List<OutputStream> clients = new CopyOnWriteArrayList<>();

    public PointerServer(int port) {
        this.port = port;
    }

    public synchronized int startServer() {
        if (running && serverSocket != null && !serverSocket.isClosed()) {
            return serverSocket.getLocalPort();
        }
        try {
            serverSocket = new ServerSocket(port, 8, InetAddress.getByName("127.0.0.1"));
            running = true;
            Thread acceptThread = new Thread(this::acceptLoop, "BxPointerServerAccept");
            acceptThread.setDaemon(true);
            acceptThread.start();
            return serverSocket.getLocalPort();
        } catch (Exception e) {
            return port;
        }
    }

    private void acceptLoop() {
        while (running) {
            try {
                Socket client = serverSocket.accept();
                client.setTcpNoDelay(true);
                Thread clientThread = new Thread(() -> handleClient(client), "BxPointerClient");
                clientThread.setDaemon(true);
                clientThread.start();
            } catch (Exception e) {
                if (!running) break;
            }
        }
    }

    private void handleClient(Socket client) {
        try {
            InputStream in = client.getInputStream();
            OutputStream out = client.getOutputStream();
            BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));

            String line;
            String wsKey = null;
            while ((line = reader.readLine()) != null && !line.isEmpty()) {
                if (line.toLowerCase().startsWith("sec-websocket-key:")) {
                    wsKey = line.substring(18).trim();
                }
            }

            if (wsKey == null) {
                client.close();
                return;
            }

            String acceptSeed = wsKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
            byte[] sha1 = MessageDigest.getInstance("SHA-1").digest(acceptSeed.getBytes(StandardCharsets.UTF_8));
            String acceptKey = Base64.getEncoder().encodeToString(sha1);

            String response = "HTTP/1.1 101 Switching Protocols\r\n"
                    + "Upgrade: websocket\r\n"
                    + "Connection: Upgrade\r\n"
                    + "Sec-WebSocket-Accept: " + acceptKey + "\r\n\r\n";
            out.write(response.getBytes(StandardCharsets.UTF_8));
            out.flush();

            clients.add(out);

            ByteBuffer handshake = ByteBuffer.allocate(3);
            handshake.put(ACTION_PROTOCOL_VERSION);
            handshake.putShort(PROTOCOL_VERSION);
            sendBinaryFrame(out, handshake.array());

            while (running && in.read() != -1) {
            }
        } catch (Exception ignored) {
        } finally {
            try {
                client.close();
            } catch (Exception ignored) {}
        }
    }

    public void sendMouseMove(short dx, short dy) {
        ByteBuffer buf = ByteBuffer.allocate(5);
        buf.put(ACTION_MOVE);
        buf.putShort(dx);
        buf.putShort(dy);
        broadcast(buf.array());
    }

    public void sendMouseButton(byte buttonMask, boolean pressed) {
        ByteBuffer buf = ByteBuffer.allocate(2);
        buf.put(pressed ? ACTION_BUTTON_PRESS : ACTION_BUTTON_RELEASE);
        buf.put(buttonMask);
        broadcast(buf.array());
    }

    public void sendMouseScroll(short vScroll, short hScroll) {
        ByteBuffer buf = ByteBuffer.allocate(5);
        buf.put(ACTION_SCROLL);
        buf.putShort(vScroll);
        buf.putShort(hScroll);
        broadcast(buf.array());
    }

    public void sendPointerCaptureChanged(boolean captured) {
        ByteBuffer buf = ByteBuffer.allocate(2);
        buf.put(ACTION_POINTER_CAPTURE_CHANGED);
        buf.put((byte) (captured ? 1 : 0));
        broadcast(buf.array());
    }

    private void broadcast(byte[] payload) {
        for (OutputStream out : clients) {
            try {
                sendBinaryFrame(out, payload);
            } catch (Exception e) {
                clients.remove(out);
            }
        }
    }

    private synchronized void sendBinaryFrame(OutputStream out, byte[] payload) throws Exception {
        int len = payload.length;
        out.write(0x82);
        out.write(len & 0x7F);
        out.write(payload);
        out.flush();
    }

    public void stopServer() {
        running = false;
        try {
            if (serverSocket != null) serverSocket.close();
        } catch (Exception ignored) {}
    }
}
