package com.sagym.management.data.auth

/**
 * In-memory session — cleared when the process dies,
 * so the login screen is shown every time the app is opened fresh.
 */
object SessionManager {
    @Volatile
    var isLoggedIn: Boolean = false
        private set

    @Volatile
    var token: String? = null
        private set

    @Volatile
    var adminName: String? = null
        private set

    fun login(authToken: String, name: String? = null) {
        token = authToken
        adminName = name
        isLoggedIn = true
    }

    fun logout() {
        token = null
        adminName = null
        isLoggedIn = false
    }
}
