package com.sagym.management.ui.overview

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.sagym.management.R
import com.sagym.management.data.model.MemberStatusKey
import com.sagym.management.databinding.FragmentOverviewBinding
import com.sagym.management.databinding.ItemBarBinding
import com.sagym.management.databinding.ItemProgressRowBinding
import com.sagym.management.ui.MembersViewModel
import com.sagym.management.utils.MemberUtils
import kotlinx.coroutines.launch

class OverviewFragment : Fragment() {

    private var _binding: FragmentOverviewBinding? = null
    private val binding get() = _binding!!
    private val viewModel: MembersViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentOverviewBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.members.collect { render() }
            }
        }
    }

    private fun render() {
        val members = viewModel.members.value
        val total = members.size
        val active = members.count { MemberUtils.statusOf(it).key == MemberStatusKey.ACTIVE }
        val expiring = members.count { MemberUtils.statusOf(it).key == MemberStatusKey.EXPIRING }
        val expired = members.count { MemberUtils.statusOf(it).key == MemberStatusKey.EXPIRED }
        val revenue = members.filter { it.paid }.sumOf { it.amount }

        bindStat(
            binding.statRevenue.root,
            android.R.drawable.ic_menu_info_details,
            MemberUtils.money(revenue),
            "এই মাসের আয়",
            "↑ $total সদস্যের মোট আয়",
            R.color.ink
        )
        bindStat(
            binding.statMembers.root,
            android.R.drawable.ic_menu_myplaces,
            total.toString(),
            "মোট সদস্য",
            "$active জন সক্রিয়",
            R.color.ink
        )
        bindStat(
            binding.statExpiring.root,
            android.R.drawable.ic_dialog_alert,
            expiring.toString(),
            "মেয়াদ শেষ হচ্ছে",
            "আগামী ৭ দিনে",
            R.color.gray
        )
        bindStat(
            binding.statExpired.root,
            android.R.drawable.ic_delete,
            expired.toString(),
            "মেয়াদ শেষ",
            "পেমেন্ট বাকি",
            R.color.danger
        )

        val months = listOf("মে", "জুন", "জুলাই", "আগস্ট", "সেপ্ট", "অক্টো")
        val vals = listOf(3200, 4500, 3800, 5200, 4100, revenue)
        val max = vals.maxOrNull()?.coerceAtLeast(1) ?: 1
        binding.revenueChart.removeAllViews()
        vals.forEachIndexed { i, v ->
            val barBinding = ItemBarBinding.inflate(layoutInflater, binding.revenueChart, false)
            barBinding.barVal.text = "৳${"%.1f".format(v / 1000.0)}k"
            barBinding.barLabel.text = months[i]
            val heightDp = ((v.toFloat() / max) * 90f + 10f).toInt()
            val params = barBinding.bar.layoutParams
            params.height = (heightDp * resources.displayMetrics.density).toInt()
            barBinding.bar.layoutParams = params
            binding.revenueChart.addView(barBinding.root)
        }

        binding.planStats.removeAllViews()
        val p1m = members.count { it.plan == "30:1000" || it.plan == "30:500" }
        val p3m = members.count { it.plan == "90:2500" || it.plan == "90:1200" }
        val pYear = members.count { it.plan == "365:10000" || it.plan == "365:4000" }
        addProgress("১ মাস প্যাকেজ", p1m, total, R.color.ink)
        addProgress("৩ মাস প্যাকেজ", p3m, total, R.color.sky)
        addProgress("১২ মাস প্যাকেজ", pYear, total, R.color.gray)
    }

    private fun bindStat(
        root: View,
        icon: Int,
        value: String,
        label: String,
        change: String,
        valueColor: Int
    ) {
        root.findViewById<ImageView>(R.id.statIcon).setImageResource(icon)
        val valueView = root.findViewById<TextView>(R.id.statValue)
        valueView.text = value
        valueView.setTextColor(ContextCompat.getColor(requireContext(), valueColor))
        root.findViewById<TextView>(R.id.statLabel).text = label
        val changeView = root.findViewById<TextView>(R.id.statChange)
        changeView.text = change
        changeView.setTextColor(ContextCompat.getColor(requireContext(), valueColor))
    }

    private fun addProgress(label: String, count: Int, total: Int, color: Int) {
        val row = ItemProgressRowBinding.inflate(layoutInflater, binding.planStats, false)
        row.progressLabel.text = label
        row.progressCount.text = "$count জন"
        val pct = if (total == 0) 0 else (count * 100 / total)
        row.progressFill.setBackgroundColor(ContextCompat.getColor(requireContext(), color))
        row.progressFill.post {
            val parentWidth = (row.progressFill.parent as View).width
            val lp = row.progressFill.layoutParams
            lp.width = parentWidth * pct / 100
            row.progressFill.layoutParams = lp
        }
        binding.planStats.addView(row.root)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
