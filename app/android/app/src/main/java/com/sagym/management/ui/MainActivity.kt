package com.sagym.management.ui

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.core.view.updatePadding
import androidx.fragment.app.Fragment
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.sagym.management.R
import com.sagym.management.data.auth.SessionManager
import com.sagym.management.databinding.ActivityMainBinding
import com.sagym.management.ui.billing.BillingFragment
import com.sagym.management.ui.dialog.MemberFormDialog
import com.sagym.management.ui.members.MembersFragment
import com.sagym.management.ui.more.MoreFragment
import com.sagym.management.ui.notifications.NotificationsFragment
import com.sagym.management.ui.overview.OverviewFragment
import com.sagym.management.ui.payment.PaymentFragment
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val viewModel: MembersViewModel by viewModels()
    private var currentPage = "overview"
    private var syncingBottomNav = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (!SessionManager.isLoggedIn) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setupSystemBars()

        binding.imgLogo.setImageResource(R.drawable.sa_gym_logo)
        setupClicks()
        observe()

        if (savedInstanceState == null) {
            showPage("overview")
        } else {
            syncBottomNav(currentPage)
        }
    }

    fun logout() {
        SessionManager.logout()
        startActivity(Intent(this, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        })
        finish()
    }

    @Suppress("DEPRECATION")
    private fun setupSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            window.isStatusBarContrastEnforced = false
            window.isNavigationBarContrastEnforced = false
        }
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }

        val topBase = binding.topbar.paddingTop
        val bottomBase = binding.bottomNav.paddingBottom

        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { _, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            binding.topbar.updatePadding(top = topBase + bars.top)
            binding.bottomNav.updatePadding(bottom = bottomBase + bars.bottom)
            insets
        }
        ViewCompat.requestApplyInsets(binding.root)
    }

    private fun setupClicks() {
        binding.btnAddMember.setOnClickListener {
            MemberFormDialog().show(supportFragmentManager, "add_member")
        }
        binding.bottomNav.setOnItemSelectedListener { item ->
            if (syncingBottomNav) return@setOnItemSelectedListener true
            when (item.itemId) {
                R.id.bottom_dashboard -> showPage("overview")
                R.id.bottom_members -> showPage("members")
                R.id.bottom_more -> showPage("more")
            }
            true
        }
    }

    private fun observe() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                launch {
                    viewModel.toast.collect { msg ->
                        if (!msg.isNullOrBlank()) {
                            Toast.makeText(this@MainActivity, msg, Toast.LENGTH_SHORT).show()
                            viewModel.clearToast()
                        }
                    }
                }
                launch {
                    viewModel.pendingPayMemberId.collect { id ->
                        if (id != null) {
                            showPage("payment")
                        }
                    }
                }
            }
        }
    }

    fun showPage(id: String) {
        currentPage = id
        val fragment: Fragment = when (id) {
            "members" -> MembersFragment()
            "billing" -> BillingFragment()
            "notifications" -> NotificationsFragment()
            "payment" -> PaymentFragment()
            "more" -> MoreFragment()
            else -> OverviewFragment()
        }
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, fragment)
            .commit()

        binding.tvPageTitle.text = when (id) {
            "members" -> getString(R.string.nav_member)
            "billing" -> getString(R.string.nav_billing)
            "notifications" -> getString(R.string.nav_notifications)
            "payment" -> getString(R.string.nav_payment)
            "more" -> getString(R.string.nav_more)
            else -> getString(R.string.nav_dashboard)
        }
        syncBottomNav(id)
    }

    private fun syncBottomNav(id: String) {
        val itemId = when (id) {
            "overview" -> R.id.bottom_dashboard
            "members" -> R.id.bottom_members
            else -> R.id.bottom_more
        }
        if (binding.bottomNav.selectedItemId != itemId) {
            syncingBottomNav = true
            binding.bottomNav.selectedItemId = itemId
            syncingBottomNav = false
        }
    }
}
