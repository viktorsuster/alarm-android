package com.alarmapp

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AlarmModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "AlarmModule"

    @ReactMethod
    fun setAlarm(id: String, timestamp: Double, soundName: String, message: String, promise: Promise) {
        val context = reactApplicationContext

        // Uloženie názvu zvuku a správy
        val sharedPref = context.getSharedPreferences("AlarmPrefs", Context.MODE_PRIVATE)
        with (sharedPref.edit()) {
            putString("SOUND_NAME", soundName)
            putString("ALARM_MESSAGE", message)
            apply()
        }

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, AlarmReceiver::class.java)
        val requestCode = id.takeLast(9).toInt()
        val pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)

        try {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                timestamp.toLong(),
                pendingIntent
            )
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SET_ALARM_ERROR", "Could not set alarm", e)
        }
    }

    @ReactMethod
    fun stopAlarm(promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = Intent(context, AlarmService::class.java)
            context.stopService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ALARM_ERROR", "Could not stop alarm service", e)
        }
    }

    @ReactMethod
    fun checkAndRequestExactAlarmPermission(promise: Promise) {
        val context = reactApplicationContext
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            if (alarmManager.canScheduleExactAlarms()) {
                promise.resolve(true)
            } else {
                val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactApplicationContext.startActivity(intent)
                promise.resolve(false)
            }
        } else {
            promise.resolve(true)
        }
    }
}
