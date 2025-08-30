package com.alarmapp

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity

class AlertActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val message = intent.getStringExtra("ALARM_MESSAGE") ?: "Budík"
        showAlarmAlert(message)
    }

    private fun showAlarmAlert(message: String) {
        if (!isFinishing) {
            AlertDialog.Builder(this)
                .setTitle("Pripomienka")
                .setMessage(message)
                .setPositiveButton("Zastaviť") { _, _ ->
                    stopAlarmService()
                    finish()
                }
                .setOnCancelListener {
                    stopAlarmService()
                    finish()
                }
                .create()
                .show()
        }
    }

    private fun stopAlarmService() {
        val serviceIntent = Intent(this, AlarmService::class.java).apply {
            action = AlarmService.ACTION_STOP
        }
        startService(serviceIntent)
    }
}
