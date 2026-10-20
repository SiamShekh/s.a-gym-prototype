package com.sagym.management.ui.payment

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.sagym.management.R
import com.sagym.management.databinding.FragmentPaymentBinding
import com.sagym.management.ui.MembersViewModel
import com.sagym.management.utils.MemberUtils
import kotlinx.coroutines.launch

class PaymentFragment : Fragment() {

    private var _binding: FragmentPaymentBinding? = null
    private val binding get() = _binding!!
    private val viewModel: MembersViewModel by activityViewModels()

    private var selectedMethod: String? = null
    private var memberIds = listOf<String>()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentPaymentBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.spinnerPlan.adapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_dropdown_item,
            MemberUtils.PLAN_LABELS
        )

        val methodViews = mapOf(
            "bkash" to binding.payBkash,
            "nagad" to binding.payNagad,
            "rocket" to binding.payRocket,
            "upay" to binding.payUpay,
            "cash" to binding.payCash,
            "bank" to binding.payBank
        )
        methodViews.forEach { (key, tv) ->
            tv.setOnClickListener { selectMethod(key, methodViews) }
        }

        val refreshAmount = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                updateAmount()
            }

            override fun onNothingSelected(parent: AdapterView<*>?) = Unit
        }
        binding.spinnerMember.onItemSelectedListener = refreshAmount
        binding.spinnerPlan.onItemSelectedListener = refreshAmount

        binding.btnConfirmPay.setOnClickListener { confirm() }

        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.members.collect { members ->
                    memberIds = members.map { it.id }
                    val labels = listOf("— সদস্য বাছুন —") + members.map { "${it.name} (${it.phone})" }
                    binding.spinnerMember.adapter = ArrayAdapter(
                        requireContext(),
                        android.R.layout.simple_spinner_dropdown_item,
                        labels
                    )
                    val pending = viewModel.pendingPayMemberId.value
                    if (pending != null) {
                        val idx = memberIds.indexOf(pending)
                        if (idx >= 0) binding.spinnerMember.setSelection(idx + 1)
                        viewModel.consumePayRequest()
                    }
                    updateAmount()
                }
            }
        }
    }

    private fun selectMethod(method: String, views: Map<String, TextView>) {
        selectedMethod = method
        views.forEach { (key, tv) -> tv.isSelected = key == method }
        val needsNumber = method !in listOf("cash", "bank")
        binding.payInputSection.visibility = if (needsNumber) View.VISIBLE else View.GONE
        binding.tvNumberLabel.text = when (method) {
            "bkash" -> "bKash নম্বর"
            "nagad" -> "Nagad নম্বর"
            "rocket" -> "Rocket নম্বর"
            "upay" -> "Upay নম্বর"
            else -> "নম্বর"
        }
    }

    private fun updateAmount() {
        val planIdx = binding.spinnerPlan.selectedItemPosition.coerceAtLeast(0)
        val plan = MemberUtils.PLAN_CODES[planIdx]
        val amt = MemberUtils.planAmount(plan)
        binding.tvPayAmount.text = MemberUtils.money(amt)
        val memberPos = binding.spinnerMember.selectedItemPosition
        binding.tvPayFor.text = if (memberPos > 0) {
            val member = viewModel.members.value.find { it.id == memberIds[memberPos - 1] }
            "${member?.name}-এর জন্য"
        } else {
            "সদস্য নির্বাচন করুন"
        }
    }

    private fun confirm() {
        val memberPos = binding.spinnerMember.selectedItemPosition
        if (memberPos <= 0) {
            Toast.makeText(requireContext(), "সদস্য বাছুন", Toast.LENGTH_SHORT).show()
            return
        }
        val method = selectedMethod
        if (method == null) {
            Toast.makeText(requireContext(), "পেমেন্ট পদ্ধতি বাছুন", Toast.LENGTH_SHORT).show()
            return
        }
        val plan = MemberUtils.PLAN_CODES[binding.spinnerPlan.selectedItemPosition]
        viewModel.processPayment(memberIds[memberPos - 1], plan, method)
        selectedMethod = null
        listOf(
            binding.payBkash, binding.payNagad, binding.payRocket,
            binding.payUpay, binding.payCash, binding.payBank
        ).forEach { it.isSelected = false }
        binding.payInputSection.visibility = View.GONE
        binding.etPayNumber.text?.clear()
        binding.etPayTxn.text?.clear()
        binding.spinnerMember.setSelection(0)
        binding.spinnerPlan.setSelection(0)
        updateAmount()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
