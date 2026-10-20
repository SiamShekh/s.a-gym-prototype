package com.sagym.management.ui.billing

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
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.sagym.management.R
import com.sagym.management.data.model.Member
import com.sagym.management.data.model.MemberStatusKey
import com.sagym.management.databinding.FragmentBillingBinding
import com.sagym.management.databinding.ItemBillingBinding
import com.sagym.management.ui.MainActivity
import com.sagym.management.ui.MembersViewModel
import com.sagym.management.utils.MemberUtils
import kotlinx.coroutines.launch

class BillingFragment : Fragment() {

    private var _binding: FragmentBillingBinding? = null
    private val binding get() = _binding!!
    private val viewModel: MembersViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentBillingBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.rvBilling.layoutManager = LinearLayoutManager(requireContext())
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.members.collect { members -> render(members) }
            }
        }
    }

    private fun render(members: List<Member>) {
        val paid = members.filter { it.paid }.sumOf { it.amount }
        val due = members.filter {
            !it.paid || MemberUtils.statusOf(it).key == MemberStatusKey.EXPIRED
        }.sumOf { MemberUtils.planAmount(it.plan) }

        bindStat(binding.statPaid.root, MemberUtils.money(paid), "পরিশোধিত", R.color.ink)
        bindStat(binding.statDue.root, MemberUtils.money(due), "বকেয়া", R.color.danger)
        bindStat(binding.statTotal.root, MemberUtils.money(paid + due), "মোট", R.color.gray)

        binding.rvBilling.adapter = object : RecyclerView.Adapter<BillingVH>() {
            override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): BillingVH {
                val b = ItemBillingBinding.inflate(LayoutInflater.from(parent.context), parent, false)
                return BillingVH(b)
            }

            override fun getItemCount() = members.size

            override fun onBindViewHolder(holder: BillingVH, position: Int) {
                holder.bind(members[position])
            }
        }
    }

    private fun bindStat(root: View, value: String, label: String, color: Int) {
        root.findViewById<ImageView>(R.id.statIcon)
            .setImageResource(android.R.drawable.ic_menu_info_details)
        val valueView = root.findViewById<TextView>(R.id.statValue)
        valueView.text = value
        valueView.setTextColor(ContextCompat.getColor(requireContext(), color))
        root.findViewById<TextView>(R.id.statLabel).text = label
        root.findViewById<TextView>(R.id.statChange).visibility = View.GONE
    }

    private inner class BillingVH(private val b: ItemBillingBinding) :
        RecyclerView.ViewHolder(b.root) {
        fun bind(m: Member) {
            val st = MemberUtils.statusOf(m)
            val isPaid = m.paid && st.key != MemberStatusKey.EXPIRED
            b.tvName.text = m.name
            b.tvPhone.text = m.phone
            b.tvMeta.text =
                "${MemberUtils.planLabel(m.plan)} · ${MemberUtils.money(m.amount)} · মেয়াদ ${MemberUtils.formatDate(m.expiry)}"
            b.tvBadge.text = if (isPaid) "পরিশোধিত" else "বকেয়া"
            b.tvBadge.setBackgroundResource(if (isPaid) R.drawable.bg_badge_red else R.drawable.bg_badge_white)
            b.tvBadge.setTextColor(
                ContextCompat.getColor(
                    requireContext(),
                    if (isPaid) R.color.ink else R.color.gray
                )
            )
            b.btnPay.visibility = if (!isPaid) View.VISIBLE else View.GONE
            b.btnPay.setOnClickListener {
                viewModel.requestPay(m.id)
                (activity as? MainActivity)?.showPage("payment")
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
