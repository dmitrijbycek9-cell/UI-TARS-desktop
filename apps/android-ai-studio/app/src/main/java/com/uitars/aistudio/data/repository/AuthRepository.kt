package com.uitars.aistudio.data.repository

import android.content.Context
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.uitars.aistudio.data.model.UserProfile
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

sealed class AuthResult {
    data class Success(val user: UserProfile) : AuthResult()
    data class Error(val message: String) : AuthResult()
    object Loading : AuthResult()
}

@Singleton
class AuthRepository @Inject constructor(
    private val firebaseAuth: FirebaseAuth,
    @ApplicationContext private val context: Context
) {

    val currentUser: UserProfile?
        get() = firebaseAuth.currentUser?.let { user ->
            UserProfile(
                uid = user.uid,
                email = user.email ?: "",
                displayName = user.displayName ?: user.email?.substringBefore("@") ?: "User",
                photoUrl = user.photoUrl?.toString()
            )
        }

    val isLoggedIn: Boolean get() = firebaseAuth.currentUser != null

    fun observeAuthState(): Flow<UserProfile?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { auth ->
            trySend(auth.currentUser?.let { user ->
                UserProfile(
                    uid = user.uid,
                    email = user.email ?: "",
                    displayName = user.displayName ?: "User",
                    photoUrl = user.photoUrl?.toString()
                )
            })
        }
        firebaseAuth.addAuthStateListener(listener)
        awaitClose { firebaseAuth.removeAuthStateListener(listener) }
    }

    fun getGoogleSignInClient(webClientId: String): GoogleSignInClient {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(webClientId)
            .requestEmail()
            .requestProfile()
            .build()
        return GoogleSignIn.getClient(context, gso)
    }

    suspend fun signInWithGoogle(idToken: String): AuthResult {
        return try {
            val credential = GoogleAuthProvider.getCredential(idToken, null)
            val result = firebaseAuth.signInWithCredential(credential).await()
            val user = result.user ?: return AuthResult.Error("Authentication failed")
            AuthResult.Success(
                UserProfile(
                    uid = user.uid,
                    email = user.email ?: "",
                    displayName = user.displayName ?: "User",
                    photoUrl = user.photoUrl?.toString()
                )
            )
        } catch (e: Exception) {
            AuthResult.Error(e.message ?: "Sign in failed")
        }
    }

    suspend fun signInWithEmail(email: String, password: String): AuthResult {
        return try {
            val result = firebaseAuth.signInWithEmailAndPassword(email, password).await()
            val user = result.user ?: return AuthResult.Error("Authentication failed")
            AuthResult.Success(
                UserProfile(
                    uid = user.uid,
                    email = user.email ?: "",
                    displayName = user.displayName ?: email.substringBefore("@"),
                    photoUrl = user.photoUrl?.toString()
                )
            )
        } catch (e: Exception) {
            AuthResult.Error(e.localizedMessage ?: "Sign in failed")
        }
    }

    suspend fun registerWithEmail(email: String, password: String, displayName: String): AuthResult {
        return try {
            val result = firebaseAuth.createUserWithEmailAndPassword(email, password).await()
            val user = result.user ?: return AuthResult.Error("Registration failed")
            val profileUpdates = com.google.firebase.auth.UserProfileChangeRequest.Builder()
                .setDisplayName(displayName)
                .build()
            user.updateProfile(profileUpdates).await()
            AuthResult.Success(
                UserProfile(
                    uid = user.uid,
                    email = user.email ?: "",
                    displayName = displayName,
                    photoUrl = null
                )
            )
        } catch (e: Exception) {
            AuthResult.Error(e.localizedMessage ?: "Registration failed")
        }
    }

    suspend fun sendPasswordReset(email: String): Boolean {
        return try {
            firebaseAuth.sendPasswordResetEmail(email).await()
            true
        } catch (e: Exception) { false }
    }

    fun signOut() {
        firebaseAuth.signOut()
    }
}
