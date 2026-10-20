package com.sagym.management.ui.dialog

import android.app.DatePickerDialog
import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.ArrayAdapter
import android.widget.FrameLayout
import android.widget.Toast
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import androidx.fragment.app.activityViewModels
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.sagym.management.R
import com.sagym.management.data.model.Member
import com.sagym.management.databinding.DialogMemberFormBinding
import com.sagym.management.ui.MembersViewModel
import com.sagym.management.utils.MemberUtils
import java.util.Calendar

class MemberFormDialog : BottomSheetDialogFragment() {

    private var _binding: DialogMemberFormBinding? = null
    private val binding get() = _binding!!
    private val viewModel: MembersViewModel by activityViewModels()

    private var editingId: String? = null
    private var computedExpiry: String = ""

    override fun getTheme(): Int = R.style.ThemeOverlay_SAGym_BottomSheetDialog

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        editingId = arguments?.getString(ARG_ID)?.takeIf { it.isNotBlank() }
    }

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val dialog = super.onCreateDialog(savedInstanceState) as BottomSheetDialog
        dialog.window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
        dialog.setOnShowListener { di ->
            val sheet = (di as BottomSheetDialog)
                .findViewById<FrameLayout>(com.google.android.material.R.id.design_bottom_sheet)
                ?: return@setOnShowListener
            sheet.setBackgroundResource(android.R.color.transparent)

            val behavior = BottomSheetBehavior.from(sheet)
            behavior.isFitToContents = true
            behavior.skipCollapsed = true
            behavior.isDraggable = true
            behavior.state = BottomSheetBehavior.STATE_EXPANDED
            behavior.maxHeight = (resources.displayMetrics.heightPixels * 0.88f).toInt()
        }
        return dialog
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = DialogMemberFormBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        // Keep CTA / fields above system nav & gesture bar (avoids covering bottom nav area)
        val baseBottom = binding.sheetRoot.paddingBottom
        ViewCompat.setOnApplyWindowInsetsListener(binding.sheetRoot) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.navigationBars())
            v.updatePadding(bottom = baseBottom + bars.bottom)
            insets
        }
        ViewCompat.requestApplyInsets(binding.sheetRoot)

        binding.spinnerPlan.adapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_dropdown_item,
            MemberUtils.PLAN_LABELS
        ).also { it.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item) }

        binding.etJoin.setOnClickListener { pickDate() }
        binding.spinnerPlan.setOnItemSelectedListener { calcExpiry() }

        binding.btnSave.setOnClickListener { save() }

        val existing = editingId?.let { id -> viewModel.members.value.find { it.id == id } }
        if (existing != null) {
            binding.btnSave.text = getString(R.string.update_member)
            binding.etName.setText(existing.name)
            binding.etPhone.setText(existing.phone)
            binding.etAddress.setText(existing.address)
            binding.etJoin.setText(existing.join)
            binding.spinnerPlan.setSelection(MemberUtils.planIndex(existing.plan))
            computedExpiry = existing.expiry
        } else {
            binding.btnSave.text = getString(R.string.create_member)
            binding.etJoin.setText(MemberUtils.today())
            calcExpiry()
        }
    }

    private fun android.widget.Spinner.setOnItemSelectedListener(onSelected: () -> Unit) {
        onItemSelectedListener = object : android.widget.AdapterView.OnItemSelectedListener {
            override fun onItemSelected(
                parent: android.widget.AdapterView<*>?,
                view: View?,
                position: Int,
                id: Long
            ) = onSelected()

            override fun onNothingSelected(parent: android.widget.AdapterView<*>?) = Unit
        }
    }

    private fun pickDate() {
        val cal = Calendar.getInstance()
        DatePickerDialog(
            requireContext(),
            { _, y, m, d ->
                binding.etJoin.setText("%04d-%02d-%02d".format(y, m + 1, d))
                calcExpiry()
            },
            cal.get(Calendar.YEAR),
            cal.get(Calendar.MONTH),
            cal.get(Calendar.DAY_OF_MONTH)
        ).show()
    }

    private fun calcExpiry() {
        val join = binding.etJoin.text?.toString().orEmpty()
        if (join.isBlank()) return
        val plan = MemberUtils.PLAN_CODES[binding.spinnerPlan.selectedItemPosition.coerceAtLeast(0)]
        computedExpiry = MemberUtils.calcExpiry(join, plan)
    }

    private fun save() {
        val name = binding.etName.text?.toString()?.trim().orEmpty()
        val phone = binding.etPhone.text?.toString()?.trim().orEmpty()
        val address = binding.etAddress.text?.toString()?.trim().orEmpty()
        val join = binding.etJoin.text?.toString()?.trim().orEmpty()
        if (name.isEmpty() || phone.isEmpty() || address.isEmpty() || join.isEmpty()) {
            Toast.makeText(requireContext(), "নাম, ফোন, ঠিকানা ও তারিখ আবশ্যক", Toast.LENGTH_SHORT).show()
            return
        }
        val plan = MemberUtils.PLAN_CODES[binding.spinnerPlan.selectedItemPosition]
        if (computedExpiry.isBlank()) {
            computedExpiry = MemberUtils.calcExpiry(join, plan)
        }
        val existing = editingId?.let { id -> viewModel.members.value.find { it.id == id } }
        val member = Member(
            id = editingId.orEmpty(),
            name = name,
            phone = phone,
            address = address,
            join = join,
            expiry = computedExpiry,
            plan = plan,
            amount = MemberUtils.planAmount(plan),
            paid = existing?.paid ?: true
        )
        viewModel.saveMember(member, editingId != null)
        dismiss()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        private const val ARG_ID = "member_id"

        fun newInstance(memberId: String): MemberFormDialog {
            return MemberFormDialog().apply {
                arguments = Bundle().apply { putString(ARG_ID, memberId) }
            }
        }
    }
}
