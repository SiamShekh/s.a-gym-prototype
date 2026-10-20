package com.sagym.management.utils

import com.sagym.management.data.model.Member
import com.sagym.management.data.model.MemberStatus
import com.sagym.management.data.model.MemberStatusKey
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

object MemberUtils {
    private val iso = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    private val display = SimpleDateFormat("yyyy/MM/dd", Locale.US)
    private val bnLocale = Locale("bn", "BD")

    fun today(): String = iso.format(Date())

    fun formatDate(date: String?): String {
        if (date.isNullOrBlank()) return "—"
        return try {
            display.format(iso.parse(date)!!)
        } catch (_: Exception) {
            date
        }
    }

    fun daysLeft(expiry: String): Int {
        return try {
            val end = iso.parse(expiry)!!.time
            val start = iso.parse(today())!!.time
            TimeUnit.MILLISECONDS.toDays(end - start).toInt()
        } catch (_: Exception) {
            0
        }
    }

    fun statusOf(member: Member): MemberStatus {
        val d = daysLeft(member.expiry)
        return when {
            d < 0 -> MemberStatus("মেয়াদ শেষ", MemberStatusKey.EXPIRED, true)
            d <= 3 -> MemberStatus("জরুরি! $d দিন", MemberStatusKey.EXPIRING, true)
            d <= 7 -> MemberStatus("$d দিন বাকি", MemberStatusKey.EXPIRING, false)
            else -> MemberStatus("সক্রিয়", MemberStatusKey.ACTIVE, false)
        }
    }

    /** days:amount — popular gym packages */
    val PLAN_CODES = listOf("30:1000", "90:2500", "365:10000")
    val PLAN_LABELS = listOf("১ মাস — ৳১,০০০", "৩ মাস — ৳২,৫০০", "১২ মাস — ৳১০,০০০")

    fun planLabel(plan: String): String = when (plan) {
        "30:1000", "30:500" -> "১ মাস"
        "90:2500", "90:1200" -> "৩ মাস"
        "365:10000", "365:4000" -> "১২ মাস"
        "60:900" -> "২ মাস" // legacy
        else -> plan
    }

    fun planIndex(plan: String): Int {
        val normalized = when (plan) {
            "30:500" -> "30:1000"
            "90:1200" -> "90:2500"
            "365:4000" -> "365:10000"
            else -> plan
        }
        val idx = PLAN_CODES.indexOf(normalized)
        return if (idx >= 0) idx else 0
    }

    fun planAmount(plan: String): Int = plan.split(":").getOrNull(1)?.toIntOrNull() ?: 0

    fun planDays(plan: String): Int = plan.split(":").getOrNull(0)?.toIntOrNull() ?: 30

    fun calcExpiry(join: String, plan: String): String {
        return try {
            val cal = Calendar.getInstance()
            cal.time = iso.parse(join)!!
            cal.add(Calendar.DAY_OF_MONTH, planDays(plan))
            iso.format(cal.time)
        } catch (_: Exception) {
            join
        }
    }

    fun money(amount: Int): String {
        val nf = NumberFormat.getNumberInstance(Locale.US)
        return "৳${nf.format(amount)}"
    }

    fun todayBn(): String {
        return SimpleDateFormat("d MMMM yyyy", bnLocale).format(Date())
    }

    fun whatsappUrl(phone: String, message: String): String {
        val normalized = if (phone.startsWith("0")) phone.drop(1) else phone
        return "https://wa.me/88$normalized?text=${java.net.URLEncoder.encode(message, "UTF-8")}"
    }
}
