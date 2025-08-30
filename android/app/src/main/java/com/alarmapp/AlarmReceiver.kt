package com.alarmapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val serviceIntent = Intent(context, AlarmService::class.java).apply {
            putExtra("ALARM_SOUND_NAME", intent.getStringExtra("ALARM_SOUND_NAME"))
            putExtra("ALARM_MESSAGE", intent.getStringExtra("ALARM_MESSAGE"))
        }
        ContextCompat.startForegroundService(context, serviceIntent)
    }
}

