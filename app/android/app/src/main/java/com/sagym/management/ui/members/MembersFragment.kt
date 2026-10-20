package com.sagym.management.ui.members

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.LinearLayoutManager
import com.sagym.management.R
import com.sagym.management.databinding.FragmentMembersBinding
import com.sagym.management.ui.MainActivity
import com.sagym.management.ui.MembersViewModel
import com.sagym.management.ui.adapters.MemberAdapter
import com.sagym.management.ui.dialog.MemberFormDialog
import kotlinx.coroutines.launch

class MembersFragment : Fragment() {

    private var _binding: FragmentMembersBinding? = null
    private val binding get() = _binding!!
    private val viewModel: MembersViewModel by activityViewModels()
    private var activeFilter = "all"
    private lateinit var adapter: MemberAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentMembersBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        adapter = MemberAdapter(
            onEdit = { MemberFormDialog.newInstance(it.id).show(parentFragmentManager, "edit") },
            onDelete = { member ->
                AlertDialog.Builder(requireContext())
                    .setTitle("মুছে ফেলবেন?")
                    .setMessage("${member.name}-কে মুছে ফেলবেন?")
                    .setPositiveButton("হ্যাঁ") { _, _ -> viewModel.deleteMember(member) }
                    .setNegativeButton("না", null)
                    .show()
            },
            onPay = {
                viewModel.requestPay(it.id)
                (activity as? MainActivity)?.showPage("payment")
            }
        )
        binding.rvMembers.layoutManager = LinearLayoutManager(requireContext())
        binding.rvMembers.adapter = adapter

        binding.filterAll.setOnClickListener { setFilter("all", it as TextView) }
        binding.filterActive.setOnClickListener { setFilter("active", it as TextView) }
        binding.filterExpiring.setOnClickListener { setFilter("expiring", it as TextView) }
        binding.filterExpired.setOnClickListener { setFilter("expired", it as TextView) }
        binding.etSearch.doAfterTextChanged { renderList() }

        setFilter("all", binding.filterAll)

        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.members.collect { renderList() }
            }
        }
    }

    private fun setFilter(filter: String, selected: TextView) {
        activeFilter = filter
        listOf(
            binding.filterAll,
            binding.filterActive,
            binding.filterExpiring,
            binding.filterExpired
        ).forEach { pill ->
            val active = pill == selected
            pill.isSelected = active
            pill.setTextColor(
                ContextCompat.getColor(
                    requireContext(),
                    if (active) R.color.ink else R.color.gray
                )
            )
        }
        renderList()
    }

    private fun renderList() {
        adapter.submitList(
            viewModel.filteredMembers(binding.etSearch.text?.toString().orEmpty(), activeFilter)
        )
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
