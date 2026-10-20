package com.sagym.management.data.model

import com.google.gson.annotations.SerializedName

data class Member(
    @SerializedName("id") val id: String = "",
    @SerializedName("name") val name: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("address") val address: String = "",
    @SerializedName("join") val join: String,
    @SerializedName("expiry") val expiry: String,
    @SerializedName("plan") val plan: String,
    @SerializedName("amount") val amount: Int,
    @SerializedName("paid") val paid: Boolean = true
)

data class MembersResponse(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("members") val members: List<Member>
)

data class MemberResponse(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("member") val member: Member
)

data class LoginRequest(
    @SerializedName("phone") val phone: String,
    @SerializedName("password") val password: String
)

data class Admin(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("isActive") val isActive: Boolean = true
)

data class LoginResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("token") val token: String,
    @SerializedName("admin") val admin: Admin
)

enum class MemberStatusKey { ACTIVE, EXPIRING, EXPIRED }

data class MemberStatus(
    val label: String,
    val key: MemberStatusKey,
    val isUrgent: Boolean = false
)
