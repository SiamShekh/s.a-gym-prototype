package com.sagym.management.ui.notifications

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.sagym.management.R
import com.sagym.management.data.model.Member
import com.sagym.management.databinding.FragmentNotificationsBinding
import com.sagym.management.databinding.ItemNotificationBinding
import com.sagym.management.ui.MainActivity
import com.sagym.management.ui.MembersViewModel
import com.sagym.management.utils.MemberUtils
import kotlinx.coroutines.launch

class NotificationsFragment : Fragment() {

    private var _binding: FragmentNotificationsBinding? = null
    private val binding get() = _binding!!
    private val viewModel: MembersViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentNotificationsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.btnNotifyAll.setOnClickListener { notifyEveryone() }
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.members.collect { render(it) }
            }
        }
    }

    private fun render(members: List<Member>) {
        binding.notifList.removeAllViews()
        val urgent = members.filter { MemberUtils.daysLeft(it.expiry) in 0..1 }
        val warn = members.filter { MemberUtils.daysLeft(it.expiry) in 2..3 }
        val soon = members.filter { MemberUtils.daysLeft(it.expiry) in 4..7 }
        val expired = members.filter { MemberUtils.daysLeft(it.expiry) < 0 }

        var added = false
        added = addSection("● আজই শেষ (জরুরি)", urgent, R.color.danger) || added
        added = addSection("● ২-৩ দিন বাকি", warn, R.color.ink) || added
        added = addSection("● ৪-৭ দিন বাকি", soon, R.color.gray) || added
        added = addSection("● মেয়াদ শেষ — রিনিউ করুন", expired, R.color.danger) || added

        if (!added) {
            val empty = TextView(requireContext()).apply {
                text = "সবার সাবস্ক্রিপশন ঠিক আছে!"
                setTextColor(ContextCompat.getColor(requireContext(), R.color.gray))
                textAlignment = View.TEXT_ALIGNMENT_CENTER
                setPadding(0, 64, 0, 64)
            }
            binding.notifList.addView(empty)
        }
    }

    private fun addSection(title: String, list: List<Member>, color: Int): Boolean {
        if (list.isEmpty()) return false
        val header = TextView(requireContext()).apply {
            text = title
            setTextColor(ContextCompat.getColor(requireContext(), R.color.gray))
            textSize = 11f
            setPadding(0, 16, 0, 8)
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        }
        binding.notifList.addView(header)
        list.forEach { m ->
            val item = ItemNotificationBinding.inflate(layoutInflater, binding.notifList, false)
            item.tvName.text = m.name
            item.tvDetail.text = "${m.phone} · ${MemberUtils.planLabel(m.plan)}"
            val d = MemberUtils.daysLeft(m.expiry)
            item.tvDays.text = if (d < 0) "মেয়াদ শেষ হয়ে গেছে!" else "$d দিন বাকি"
            item.tvDays.setTextColor(ContextCompat.getColor(requireContext(), color))
            item.btnNotify.setOnClickListener {
                openWhatsApp(m)
                item.btnNotify.text = "Sent"
            }
            item.btnPay.setOnClickListener {
                viewModel.requestPay(m.id)
                (activity as? MainActivity)?.showPage("payment")
            }
            binding.notifList.addView(item.root)
        }
        return true
    }

    private fun openWhatsApp(m: Member) {
        val d = MemberUtils.daysLeft(m.expiry)
        val msg = if (d < 0) {
            "আপনার S.A Gym সদস্যপদের মেয়াদ শেষ হয়ে গেছে। রিনিউ করতে কল করুন: ${getString(R.string.gym_phone)}"
        } else {
            "আপনার S.A Gym সদস্যপদের মেয়াদ $d দিনের মধ্যে শেষ হবে। রিনিউ করুন: ${getString(R.string.gym_phone)}"
        }
        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(MemberUtils.whatsappUrl(m.phone, msg))))
        Toast.makeText(requireContext(), "${m.name}-কে WhatsApp নোটিফিকেশন পাঠানো হয়েছে", Toast.LENGTH_SHORT).show()
    }

    private fun notifyEveryone() {
        val list = viewModel.members.value.filter { MemberUtils.daysLeft(it.expiry) <= 7 }
        if (list.isEmpty()) {
            Toast.makeText(requireContext(), "সবার সদস্যপদ ঠিক আছে!", Toast.LENGTH_SHORT).show()
            return
        }
        list.forEach { openWhatsApp(it) }
        Toast.makeText(requireContext(), "${list.size} জনকে WhatsApp নোটিফিকেশন পাঠানো হচ্ছে", Toast.LENGTH_SHORT).show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
