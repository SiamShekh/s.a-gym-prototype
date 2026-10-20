package com.sagym.management.data.repository

import com.sagym.management.data.api.RetrofitClient
import com.sagym.management.data.model.Member
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext

class MemberRepository private constructor() {

    private val api = RetrofitClient.memberApi
    private val _members = MutableStateFlow<List<Member>>(emptyList())
    val members: StateFlow<List<Member>> = _members.asStateFlow()

    suspend fun refresh() = withContext(Dispatchers.IO) {
        _members.value = api.getMembers().members
    }

    suspend fun addMember(member: Member): Member = withContext(Dispatchers.IO) {
        val created = api.createMember(member.copy(id = "")).member
        refresh()
        created
    }

    suspend fun updateMember(member: Member): Member = withContext(Dispatchers.IO) {
        val updated = api.updateMember(member.id, member).member
        refresh()
        updated
    }

    suspend fun deleteMember(id: String) = withContext(Dispatchers.IO) {
        api.deleteMember(id)
        refresh()
    }

    companion object {
        @Volatile
        private var instance: MemberRepository? = null

        fun getInstance(): MemberRepository {
            return instance ?: synchronized(this) {
                instance ?: MemberRepository().also { instance = it }
            }
        }
    }
}
