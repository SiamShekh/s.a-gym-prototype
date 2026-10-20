package com.sagym.management.data.api

import com.sagym.management.data.model.LoginRequest
import com.sagym.management.data.model.LoginResponse
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApi {
    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse
}
