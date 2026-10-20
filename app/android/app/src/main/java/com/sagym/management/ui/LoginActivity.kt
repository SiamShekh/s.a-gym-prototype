package com.sagym.management.ui

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.text.InputType
import android.text.SpannableString
import android.text.Spanned
import android.text.method.LinkMovementMethod
import android.text.style.UnderlineSpan
import android.view.inputmethod.EditorInfo
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.core.view.isVisible
import androidx.core.view.updatePadding
import androidx.lifecycle.lifecycleScope
import com.sagym.management.R
import com.sagym.management.data.auth.SessionManager
import com.sagym.management.data.repository.AuthRepository
import com.sagym.management.databinding.ActivityLoginBinding
import kotlinx.coroutines.launch
import retrofit2.HttpException
import java.io.IOException

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private var passwordVisible = false
    private val authRepository = AuthRepository.getInstance()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        SessionManager.logout()

        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setupSystemBars()
        setupFooter()

        binding.btnLogin.setOnClickListener { attemptLogin() }
        binding.btnTogglePassword.setOnClickListener { togglePasswordVisibility() }
        binding.etPassword.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                attemptLogin()
                true
            } else {
                false
            }
        }
    }

    private fun setupFooter() {
        val phone = getString(R.string.gym_phone)
        val full = getString(R.string.login_footer) + "\n$phone"
        val spannable = SpannableString(full)
        val start = full.indexOf(phone)
        if (start >= 0) {
            spannable.setSpan(UnderlineSpan(), start, start + phone.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }
        binding.tvLoginFooter.text = spannable
        binding.tvLoginFooter.movementMethod = LinkMovementMethod.getInstance()
    }

    private fun togglePasswordVisibility() {
        passwordVisible = !passwordVisible
        val selection = binding.etPassword.selectionEnd
        if (passwordVisible) {
            binding.etPassword.inputType =
                InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
            binding.btnTogglePassword.setImageResource(R.drawable.ic_visibility_off)
        } else {
            binding.etPassword.inputType =
                InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            binding.btnTogglePassword.setImageResource(R.drawable.ic_visibility)
        }
        binding.etPassword.setSelection(selection.coerceAtLeast(0))
    }

    private fun attemptLogin() {
        val phone = binding.etPhone.text?.toString()?.trim().orEmpty()
        val password = binding.etPassword.text?.toString().orEmpty()

        if (phone.isEmpty() || password.isEmpty()) {
            showError(getString(R.string.login_error_required))
            return
        }

        binding.tvLoginError.isVisible = false
        binding.btnLogin.isEnabled = false
        binding.btnLogin.alpha = 0.6f

        lifecycleScope.launch {
            try {
                authRepository.login(phone, password)
                startActivity(Intent(this@LoginActivity, MainActivity::class.java))
                finish()
            } catch (e: HttpException) {
                showError(
                    when (e.code()) {
                        401 -> getString(R.string.login_error_invalid)
                        400 -> getString(R.string.login_error_invalid)
                        else -> getString(R.string.login_error_generic)
                    }
                )
            } catch (_: IOException) {
                showError(getString(R.string.login_error_network))
            } catch (_: Exception) {
                showError(getString(R.string.login_error_generic))
            } finally {
                binding.btnLogin.isEnabled = true
                binding.btnLogin.alpha = 1f
            }
        }
    }

    private fun showError(message: String) {
        binding.tvLoginError.text = message
        binding.tvLoginError.isVisible = true
    }

    @Suppress("DEPRECATION")
    private fun setupSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.BLACK
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }

        ViewCompat.setOnApplyWindowInsetsListener(binding.loginRoot) { _, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            binding.loginHeader.updatePadding(top = bars.top)
            binding.loginScroll.updatePadding(bottom = bars.bottom)
            insets
        }
        ViewCompat.requestApplyInsets(binding.loginRoot)
    }
}
