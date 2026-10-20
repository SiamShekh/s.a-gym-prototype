package com.sagym.management.ui.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.sagym.management.R
import com.sagym.management.data.model.Member
import com.sagym.management.data.model.MemberStatusKey
import com.sagym.management.databinding.ItemMemberBinding
import com.sagym.management.utils.MemberUtils

class MemberAdapter(
    private val onEdit: (Member) -> Unit,
    private val onDelete: (Member) -> Unit,
    private val onPay: (Member) -> Unit
) : ListAdapter<Member, MemberAdapter.VH>(DIFF) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemMemberBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        holder.bind(getItem(position))
    }

    inner class VH(private val binding: ItemMemberBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(member: Member) {
            val status = MemberUtils.statusOf(member)
            binding.tvName.text = member.name
            binding.tvPhone.text = buildString {
                append(member.phone)
                if (member.address.isNotBlank()) append(" · ${member.address}")
            }
            binding.tvMeta.text =
                "যোগদান ${MemberUtils.formatDate(member.join)} · মেয়াদ ${MemberUtils.formatDate(member.expiry)}\n" +
                    "প্যাকেজ: ${MemberUtils.planLabel(member.plan)} · ${MemberUtils.money(member.amount)}"
            binding.tvStatus.text = status.label
            if (status.key == MemberStatusKey.EXPIRED || status.isUrgent) {
                binding.tvStatus.setBackgroundResource(R.drawable.bg_badge_red)
                binding.tvStatus.setTextColor(ContextCompat.getColor(binding.root.context, R.color.danger))
            } else {
                binding.tvStatus.setBackgroundResource(R.drawable.bg_badge_white)
                binding.tvStatus.setTextColor(ContextCompat.getColor(binding.root.context, R.color.ink))
            }
            binding.btnPay.visibility =
                if (status.key == MemberStatusKey.EXPIRED) View.VISIBLE else View.GONE
            binding.btnEdit.setOnClickListener { onEdit(member) }
            binding.btnDelete.setOnClickListener { onDelete(member) }
            binding.btnPay.setOnClickListener { onPay(member) }
        }
    }

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<Member>() {
            override fun areItemsTheSame(oldItem: Member, newItem: Member) = oldItem.id == newItem.id
            override fun areContentsTheSame(oldItem: Member, newItem: Member) = oldItem == newItem
        }
    }
}
