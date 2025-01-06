import AppTrackingTransparency
import AdSupport
import WebKit

@objc class Tracking: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?
    
    init(webView: WKWebView) {
        self.webView = webView
        super.init()
    }
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "tracking" {
            requestPermission(message.body)
        }
    }
    
    @objc func requestPermission(_ message: Any) {
        guard let dict = message as? [String: Any],
              let callback = dict["callback"] as? String else {
            return
        }
        
        if #available(iOS 14, *) {
            ATTrackingManager.requestTrackingAuthorization { status in
                let authorized = status == .authorized
                DispatchQueue.main.async {
                    let js = "window.\(callback)(\(authorized));"
                    self.webView?.evaluateJavaScript(js, completionHandler: nil)
                }
            }
        } else {
            // For iOS 13 and below, always return true
            let js = "window.\(callback)(true);"
            self.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }
} 