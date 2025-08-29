package com.alarmapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == "android.intent.action.BOOT_COMPLETED") {
            // Tu by sa v budúcnosti mala nachádzať logika pre obnovenie alarmov
            // Napríklad načítanie uložených časov z SharedPreferences a ich opätovné nastavenie
            Log.d("BootReceiver", "Zariadenie sa reštartovalo. V budúcnosti tu obnovíme alarmy.")
        }
    }
}

