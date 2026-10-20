package com.sagym.management.data.repository

import com.sagym.management.data.api.RetrofitClient
import com.sagym.management.data.auth.SessionManager
import com.sagym.management.data.model.LoginRequest
import com.sagym.management.data.model.LoginResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository private constructor() {

    private val api = RetrofitClient.authApi

    suspend fun login(phone: String, password: String): LoginResponse =
        withContext(Dispatchers.IO) {
            val normalizedPhone = phone.replace(Regex("[\\s-]"), "").trim()
            val response = api.login(LoginRequest(normalizedPhone, password))
            SessionManager.login(response.token, response.admin.name)
            response
        }

    companion object {
        @Volatile
        private var instance: AuthRepository? = null

        fun getInstance(): AuthRepository {
            return instance ?: synchronized(this) {
                instance ?: AuthRepository().also { instance = it }
            }
        }
    }
}
