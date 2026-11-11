package com.goydevv.xcloud;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.Bundle;
import android.view.MotionEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class MainActivity extends Activity {
    private static final String XCLOUD_HOME_URL = "https://www.xbox.com/en-US/play";
    private static final int POINTER_SERVER_PORT = 9269;

    private WebView webView;
    private PointerServer pointerServer;
    private AppInterfaceBridge appInterfaceBridge;
    private String cachedUserscriptJs;

    @SuppressLint({"SetJavaScriptEnabled", "ClickableViewAccessibility", "RequiresFeature"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        enableImmersiveFullscreen();

        pointerServer = new PointerServer(POINTER_SERVER_PORT);
        pointerServer.startServer();

        cachedUserscriptJs = loadUserscriptFromAssets();

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSupportMultipleWindows(false);
        settings.setUserAgentString(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0"
        );

        // Enable persistent first-party and third-party cookies for Microsoft / Xbox Live OAuth login
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        appInterfaceBridge = new AppInterfaceBridge(this, webView, pointerServer);
        webView.addJavascriptInterface(appInterfaceBridge, "AppInterface");

        // Primary true document-start userscript injection via AndroidX WebKit C++ hook
        // Ensures Patcher.init() hooks Function.prototype.bind BEFORE xCloud chunks execute
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT) && !cachedUserscriptJs.isEmpty()) {
            Set<String> allowedOriginRules = new HashSet<>(Arrays.asList(
                    "https://www.xbox.com",
                    "https://*.xbox.com"
            ));
            String docStartScript = "if (!window.__BX_WARZONE_KBM_INJECTED__) { window.__BX_WARZONE_KBM_INJECTED__ = true;\n"
                    + cachedUserscriptJs
                    + "\n}";
            WebViewCompat.addDocumentStartJavaScript(webView, docStartScript, allowedOriginRules);
        }

        // Support physical mouse capture if connected via USB/Bluetooth OTG
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setOnCapturedPointerListener((view, event) -> {
                int action = event.getActionMasked();
                if (action == MotionEvent.ACTION_MOVE) {
                    short dx = (short) Math.round(event.getX());
                    short dy = (short) Math.round(event.getY());
                    if (dx != 0 || dy != 0) {
                        pointerServer.sendMouseMove(dx, dy);
                    }
                    return true;
                } else if (action == MotionEvent.ACTION_BUTTON_PRESS) {
                    pointerServer.sendMouseButton((byte) event.getActionButton(), true);
                    return true;
                } else if (action == MotionEvent.ACTION_BUTTON_RELEASE) {
                    pointerServer.sendMouseButton((byte) event.getActionButton(), false);
                    return true;
                } else if (action == MotionEvent.ACTION_SCROLL) {
                    short vScroll = (short) Math.round(-event.getAxisValue(MotionEvent.AXIS_VSCROLL) * 100);
                    short hScroll = (short) Math.round(event.getAxisValue(MotionEvent.AXIS_HSCROLL) * 100);
                    pointerServer.sendMouseScroll(vScroll, hScroll);
                    return true;
                }
                return false;
            });
        }

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                if (url != null && url.contains("xbox.com")) {
                    injectBetterXcloudScript(view);
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (url != null && url.contains("xbox.com")) {
                    injectBetterXcloudScript(view);
                }
                // Flush Microsoft / Xbox Live auth cookies immediately to persistent disk storage
                CookieManager.getInstance().flush();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(XCLOUD_HOME_URL);
        }
    }

    private void injectBetterXcloudScript(WebView view) {
        if (cachedUserscriptJs == null || cachedUserscriptJs.isEmpty()) {
            return;
        }
        String wrapper = "if (!window.__BX_WARZONE_KBM_INJECTED__) { window.__BX_WARZONE_KBM_INJECTED__ = true;\n"
                + cachedUserscriptJs
                + "\n}";
        view.evaluateJavascript(wrapper, null);
    }

    private String loadUserscriptFromAssets() {
        try (InputStream is = getAssets().open("better-xcloud.user.js");
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[16384];
            int read;
            while ((read = is.read(buffer)) != -1) {
                baos.write(buffer, 0, read);
            }
            return baos.toString(StandardCharsets.UTF_8.name());
        } catch (Exception e) {
            return "";
        }
    }

    public void enableHardwarePointerCapture() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && webView != null) {
            webView.requestPointerCapture();
            pointerServer.sendPointerCaptureChanged(true);
        }
    }

    public void disableHardwarePointerCapture() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && webView != null) {
            webView.releasePointerCapture();
            pointerServer.sendPointerCaptureChanged(false);
        }
    }

    private void enableImmersiveFullscreen() {
        View decor = getWindow().getDecorView();
        decor.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) {
            webView.saveState(outState);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onStop() {
        super.onStop();
        CookieManager.getInstance().flush();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enableImmersiveFullscreen();
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null) {
            webView.evaluateJavascript(
                    "window.BX_EXPOSED && window.BX_EXPOSED.backButtonPressed ? window.BX_EXPOSED.backButtonPressed() : false",
                    result -> {
                        if (!"true".equals(result) && webView.canGoBack()) {
                            webView.goBack();
                        }
                    }
            );
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        CookieManager.getInstance().flush();
        if (pointerServer != null) {
            pointerServer.stopServer();
        }
        super.onDestroy();
    }
}
