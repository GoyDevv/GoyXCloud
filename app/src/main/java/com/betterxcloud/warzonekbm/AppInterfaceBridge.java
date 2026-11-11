package com.betterxcloud.warzonekbm;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

public class AppInterfaceBridge {
    private static final String PREFS_NAME = "BetterXcloudForeverKbm";
    private static final String KEY_TOUCH_KBM_JSON = "touch_kbm_forever_v1";
    private static final String FOREVER_FILE_NAME = "touch_kbm_forever.json";

    private final MainActivity activity;
    private final WebView webView;
    private final PointerServer pointerServer;
    private final SharedPreferences prefs;

    public AppInterfaceBridge(MainActivity activity, WebView webView, PointerServer pointerServer) {
        this.activity = activity;
        this.webView = webView;
        this.pointerServer = pointerServer;
        this.prefs = activity.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    @JavascriptInterface
    public int startPointerServer() {
        return pointerServer.startServer();
    }

    @JavascriptInterface
    public void requestPointerCapture() {
        activity.runOnUiThread(activity::enableHardwarePointerCapture);
    }

    @JavascriptInterface
    public void releasePointerCapture() {
        activity.runOnUiThread(activity::disableHardwarePointerCapture);
    }

    @JavascriptInterface
    public void saveTouchKbmConfig(String jsonConfig) {
        if (jsonConfig == null || jsonConfig.isEmpty()) {
            return;
        }
        prefs.edit().putString(KEY_TOUCH_KBM_JSON, jsonConfig).apply();
        try {
            File file = new File(activity.getFilesDir(), FOREVER_FILE_NAME);
            try (FileOutputStream fos = new FileOutputStream(file, false)) {
                fos.write(jsonConfig.getBytes(StandardCharsets.UTF_8));
                fos.flush();
            }
        } catch (Exception ignored) {}
    }

    @JavascriptInterface
    public String loadTouchKbmConfig() {
        String stored = prefs.getString(KEY_TOUCH_KBM_JSON, null);
        if (stored != null && !stored.isEmpty()) {
            return stored;
        }
        try {
            File file = new File(activity.getFilesDir(), FOREVER_FILE_NAME);
            if (file.exists()) {
                byte[] bytes = new byte[(int) file.length()];
                try (FileInputStream fis = new FileInputStream(file)) {
                    int read = fis.read(bytes);
                    if (read > 0) {
                        String recovered = new String(bytes, 0, read, StandardCharsets.UTF_8);
                        prefs.edit().putString(KEY_TOUCH_KBM_JSON, recovered).apply();
                        return recovered;
                    }
                }
            }
        } catch (Exception ignored) {}
        return "";
    }

    @JavascriptInterface
    public void vibrate(String dataJson, int intensity) {
        try {
            Vibrator vibrator = (Vibrator) activity.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    int amp = Math.max(1, Math.min(255, (intensity * 255) / 100));
                    vibrator.vibrate(VibrationEffect.createOneShot(20, amp));
                } else {
                    vibrator.vibrate(20);
                }
            }
        } catch (Exception ignored) {}
    }

    @JavascriptInterface
    public void runShortcut(String action) {}

    @JavascriptInterface
    public void saveScreenshot(String name, String data) {}

    @JavascriptInterface
    public void openTrueAchievementsLink(boolean override, String xboxTitleId, String id) {}

    @JavascriptInterface
    public void openAppSettings() {
        activity.runOnUiThread(() -> webView.evaluateJavascript(
                "window.TouchKbmOverlay && window.TouchKbmOverlay.getInstance().renderProfile();",
                null
        ));
    }

    @JavascriptInterface
    public void updateLatestScript() {}

    @JavascriptInterface
    public void closeApp() {
        activity.runOnUiThread(activity::finish);
    }

    @JavascriptInterface
    public String getDeepLinkData() {
        return "";
    }

    @JavascriptInterface
    public void createShortcut(String path) {}

    @JavascriptInterface
    public void createConsoleShortcut(String serverId, String deviceName, String optionsJson) {}

    @JavascriptInterface
    public void downloadWallpapers(String titleSlug, String productId) {}

    @JavascriptInterface
    public void onEvent(String event) {}

    @JavascriptInterface
    public void onEventBus(String event) {}
}
