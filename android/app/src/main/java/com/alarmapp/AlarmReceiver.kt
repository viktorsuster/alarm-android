package com.alarmapp

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import java.util.Calendar

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // Spustenie služby pre prehrávanie zvuku a zobrazenie notifikácie
        val serviceIntent = Intent(context, AlarmService::class.java).apply {
            putExtra("ALARM_SOUND_NAME", intent.getStringExtra("ALARM_SOUND_NAME"))
            putExtra("ALARM_MESSAGE", intent.getStringExtra("ALARM_MESSAGE"))
        }
        ContextCompat.startForegroundService(context, serviceIntent)

        // Preplánovanie opakovaného alarmu
        val repeat = intent.getStringExtra("ALARM_REPEAT")
        if (repeat != null) {
            val id = intent.getStringExtra("ALARM_ID") ?: return
            val soundName = intent.getStringExtra("ALARM_SOUND_NAME")
            val message = intent.getStringExtra("ALARM_MESSAGE")
            val days = intent.getIntArrayExtra("ALARM_DAYS")

            val calendar = Calendar.getInstance()
            
            when (repeat) {
                "daily" -> calendar.add(Calendar.DAY_OF_MONTH, 1)
                "weekly" -> {
                    if (days != null && days.isNotEmpty()) {
                        val currentDayOfWeek = (calendar.get(Calendar.DAY_OF_WEEK) + 5) % 7 // Pondelok = 0
                        var nextDayOffset = -1
                        for (i in 1..7) {
                            val nextDay = (currentDayOfWeek + i) % 7
                            if (days.contains(nextDay)) {
                                nextDayOffset = i
                                break
                            }
                        }
                        if (nextDayOffset != -1) {
                            calendar.add(Calendar.DAY_OF_MONTH, nextDayOffset)
                        } else {
                            // Ak sa nenájde žiadny deň (nemalo by nastať), pre istotu nastavíme o týždeň
                            calendar.add(Calendar.DAY_OF_MONTH, 7)
                        }
                    } else {
                        // Ak nie sú špecifikované dni, opakujeme o týždeň
                        calendar.add(Calendar.DAY_OF_MONTH, 7)
                    }
                }
            }

            val newTimestamp = calendar.timeInMillis
            
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val newIntent = Intent(context, AlarmReceiver::class.java).apply {
                putExtra("ALARM_ID", id)
                putExtra("ALARM_SOUND_NAME", soundName)
                putExtra("ALARM_MESSAGE", message)
                putExtra("ALARM_REPEAT", repeat)
                putExtra("ALARM_DAYS", days)
            }
            
            val pendingIntent = PendingIntent.getBroadcast(
                context, 
                id.hashCode(), 
                newIntent, 
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, newTimestamp, pendingIntent)
        }
    }
}

