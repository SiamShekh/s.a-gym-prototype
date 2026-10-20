package com.sagym.management.data.api

import com.sagym.management.data.model.Member
import com.sagym.management.data.model.MemberResponse
import com.sagym.management.data.model.MembersResponse
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface MemberApi {
    @GET("members")
    suspend fun getMembers(): MembersResponse

    @GET("members/{id}")
    suspend fun getMember(@Path("id") id: String): MemberResponse

    @POST("members")
    suspend fun createMember(@Body member: Member): MemberResponse

    @PUT("members/{id}")
    suspend fun updateMember(@Path("id") id: String, @Body member: Member): MemberResponse

    @DELETE("members/{id}")
    suspend fun deleteMember(@Path("id") id: String)
}
