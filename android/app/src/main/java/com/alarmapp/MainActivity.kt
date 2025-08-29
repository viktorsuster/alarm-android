package com.alarmapp

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "AlarmApp"

    // Pre prípad, že je aplikácia spustená od nuly (cold start)
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
            override fun getLaunchOptions(): Bundle? {
                val bundle = Bundle()
                intent.getStringExtra("notification_action")?.let {
                    bundle.putString("notificationAction", it)
                }
                intent.getStringExtra("alarm_message")?.let {
                    bundle.putString("alarmMessage", it)
                }
                return bundle
            }
        }

    // Pre prípad, že je aplikácia už na pozadí (warm start)
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let {
            val notificationAction = it.getStringExtra("notification_action")
            val alarmMessage = it.getStringExtra("alarm_message")

            if (notificationAction == "stop_alarm" && alarmMessage != null) {
                val params: WritableMap = Arguments.createMap().apply {
                    putString("message", alarmMessage)
                }
                reactInstanceManager.currentReactContext
                    ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit("onAlarmTrigger", params)
            }
        }
    }
}
