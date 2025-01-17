import UIKit
import Capacitor
import WebKit
import AppTrackingTransparency

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    var tracking: Tracking?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Create the window first
        window = UIWindow(frame: UIScreen.main.bounds)
        
        // Create a temporary WebView for initial setup
        let tempWebView = WKWebView(frame: .zero)
        
        // Initialize tracking with the temporary WebView
        tracking = Tracking(webView: tempWebView)
        
        // Create the bridge view controller
        let bridgeViewController = CAPBridgeViewController()
        
        // Update tracking with the real WebView once it's available
        if let webView = bridgeViewController.webView {
            tracking?.webView = webView
            webView.configuration.userContentController.add(
                tracking!,
                name: "tracking"
            )
        }
        
        let navigationController = UINavigationController(rootViewController: bridgeViewController)
        navigationController.navigationBar.isHidden = true
        
        window?.rootViewController = navigationController
        window?.makeKeyAndVisible()
        
        // Request tracking permission after a delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            if #available(iOS 14, *) {
                ATTrackingManager.requestTrackingAuthorization { status in
                    print("🔍 Tracking authorization status: \(status.rawValue)")
                }
            }
        }
        
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to active state
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused while the application was inactive
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
