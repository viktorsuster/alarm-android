package com.alarmapp

import android.app.*
import android.app.Notification
import android.app.NotificationChannel
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.IBinder
import androidx.core.app.NotificationCompat

class AlarmService : Service() {
    private var mediaPlayer: MediaPlayer? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val channelId = "alarm_service_channel"
        val channelName = "Alarm Service"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        val channel = NotificationChannel(channelId, channelName, NotificationManager.IMPORTANCE_HIGH)
        notificationManager.createNotificationChannel(channel)

        val sharedPref = getSharedPreferences("AlarmPrefs", Context.MODE_PRIVATE)
        val soundName = sharedPref.getString("SOUND_NAME", null)
        val alarmMessage = sharedPref.getString("ALARM_MESSAGE", "Budík")

        // Intent na otvorenie aplikácie
        val notificationIntent = Intent(this, MainActivity::class.java).apply {
            this.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("notification_action", "stop_alarm")
            putExtra("alarm_message", alarmMessage) // Pridanie správy
        }
        val pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle(alarmMessage)
            .setContentText("Kliknite pre vypnutie a otvorenie aplikácie.")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent) // Pridanie intentu
            .setAutoCancel(true) // Notifikácia zmizne po kliknutí
            .build()
        
        startForeground(1, notification)

        // Priorita 1: Pokus o prehratie vybraného vlastného zvuku
        if (soundName != null) {
            try {
                val resId = resources.getIdentifier(soundName, "raw", packageName)
                if (resId != 0) {
                    mediaPlayer = MediaPlayer.create(this, resId)
                    mediaPlayer?.isLooping = true
                    mediaPlayer?.start()
                    return START_NOT_STICKY
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // Priorita 2 (záloha): Prehratie systémového zvuku
        try {
            val alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            mediaPlayer = MediaPlayer.create(this, alarmUri)
            mediaPlayer?.isLooping = true
            mediaPlayer?.start()
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return START_NOT_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        mediaPlayer?.stop()
        mediaPlayer?.release()
        mediaPlayer = null
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
