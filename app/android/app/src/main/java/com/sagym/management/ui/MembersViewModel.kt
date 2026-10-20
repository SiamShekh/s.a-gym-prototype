package com.sagym.management.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sagym.management.data.model.Member
import com.sagym.management.data.model.MemberStatusKey
import com.sagym.management.data.repository.MemberRepository
import com.sagym.management.utils.MemberUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class MembersViewModel(
    private val repository: MemberRepository = MemberRepository.getInstance()
) : ViewModel() {

    val members: StateFlow<List<Member>> = repository.members
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _toast = MutableStateFlow<String?>(null)
    val toast: StateFlow<String?> = _toast.asStateFlow()

    private val _pendingPayMemberId = MutableStateFlow<String?>(null)
    val pendingPayMemberId: StateFlow<String?> = _pendingPayMemberId.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            runCatching { repository.refresh() }
                .onFailure { _toast.value = "ডেটা লোড ব্যর্থ" }
        }
    }

    fun clearToast() {
        _toast.value = null
    }

    fun requestPay(memberId: String) {
        _pendingPayMemberId.value = memberId
    }

    fun consumePayRequest() {
        _pendingPayMemberId.value = null
    }

    fun saveMember(member: Member, editing: Boolean) {
        viewModelScope.launch {
            runCatching {
                if (editing) repository.updateMember(member)
                else repository.addMember(member.copy(id = ""))
            }.onSuccess {
                _toast.value = if (editing) "${member.name}-এর তথ্য আপডেট হয়েছে"
                else "${member.name} নতুন সদস্য হিসেবে যোগ হয়েছে"
            }.onFailure {
                _toast.value = "সংরক্ষণ ব্যর্থ"
            }
        }
    }

    fun deleteMember(member: Member) {
        viewModelScope.launch {
            runCatching { repository.deleteMember(member.id) }
                .onSuccess { _toast.value = "${member.name} মুছে ফেলা হয়েছে" }
                .onFailure { _toast.value = "মুছতে ব্যর্থ" }
        }
    }

    fun processPayment(memberId: String, plan: String, method: String) {
        viewModelScope.launch {
            val member = members.value.find { it.id == memberId } ?: return@launch
            val amt = MemberUtils.planAmount(plan)
            val join = MemberUtils.today()
            val expiry = MemberUtils.calcExpiry(join, plan)
            val updated = member.copy(
                join = join,
                expiry = expiry,
                plan = plan,
                amount = amt,
                paid = true
            )
            runCatching { repository.updateMember(updated) }
                .onSuccess {
                    _toast.value =
                        "${member.name}-এর পেমেন্ট সম্পন্ন ($method)! মেয়াদ ${MemberUtils.formatDate(expiry)} পর্যন্ত"
                }
                .onFailure { _toast.value = "পেমেন্ট ব্যর্থ" }
        }
    }

    fun notifCount(): Int = members.value.count {
        val d = MemberUtils.daysLeft(it.expiry)
        d in 0..7
    }

    fun filteredMembers(query: String, filter: String): List<Member> {
        val q = query.trim().lowercase()
        return members.value.filter { m ->
            val match = q.isEmpty() ||
                m.name.lowercase().contains(q) ||
                m.phone.contains(q)
            if (!match) return@filter false
            when (filter) {
                "active" -> MemberUtils.statusOf(m).key == MemberStatusKey.ACTIVE
                "expiring" -> MemberUtils.statusOf(m).key == MemberStatusKey.EXPIRING
                "expired" -> MemberUtils.statusOf(m).key == MemberStatusKey.EXPIRED
                else -> true
            }
        }
    }
}
