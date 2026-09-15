package com.umeshchaudhary.megapowerai;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

/**
 * Mega Power AI — Android shell.
 * Serves the bundled web app (assets/www) on a proper https origin via
 * WebViewAssetLoader, so storage, service worker and fetch all behave
 * exactly like on the real website.
 *
 * Created by Umesh Chaudhary.
 */
public class MainActivity extends Activity {

    private static final String APP_URL =
            "https://appassets.androidplatform.net/assets/www/index.html";
    private static final String APP_DOMAIN = "appassets.androidplatform.net";

    private WebView web;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#070B18"));
        WebView.setWebContentsDebuggingEnabled(false);

        WebSettings st = web.getSettings();
        st.setJavaScriptEnabled(true);
        st.setDomStorageEnabled(true);
        st.setDatabaseEnabled(true);
        st.setAllowFileAccess(true);
        st.setAllowContentAccess(true);
        st.setMediaPlaybackRequiresUserGesture(false);
        st.setSupportZoom(false);
        st.setDisplayZoomControls(false);
        st.setLoadWithOverviewMode(true);
        st.setUseWideViewPort(true);
        st.setCacheMode(WebSettings.LOAD_DEFAULT);
        st.setUserAgentString(st.getUserAgentString() + " MegaPowerAI/1.0 (Android)");

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(APP_DOMAIN)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                String scheme = url.getScheme() == null ? "" : url.getScheme();
                if (("https".equals(scheme) || "http".equals(scheme))
                        && APP_DOMAIN.equals(url.getHost())) {
                    return false; // keep the app inside the WebView
                }
                try { // everything else → open in the browser
                    startActivity(new Intent(Intent.ACTION_VIEW, url));
                } catch (Exception ignored) { }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                view.setVisibility(View.VISIBLE);
            }
        });

        web.setVisibility(View.INVISIBLE); // avoid white flash before first paint
        setContentView(web);
        web.loadUrl(APP_URL);
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
