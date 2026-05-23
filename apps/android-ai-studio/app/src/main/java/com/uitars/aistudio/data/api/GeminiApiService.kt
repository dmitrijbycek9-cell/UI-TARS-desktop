package com.uitars.aistudio.data.api

import com.uitars.aistudio.data.model.CountTokensRequest
import com.uitars.aistudio.data.model.CountTokensResponse
import com.uitars.aistudio.data.model.GeminiRequest
import com.uitars.aistudio.data.model.GeminiResponse
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.Streaming

interface GeminiApiService {

    @POST("v1beta/models/{model}:generateContent")
    suspend fun generateContent(
        @Path("model") model: String,
        @Query("key") apiKey: String,
        @Body request: GeminiRequest
    ): Response<GeminiResponse>

    @Streaming
    @POST("v1beta/models/{model}:streamGenerateContent")
    suspend fun streamGenerateContent(
        @Path("model") model: String,
        @Query("key") apiKey: String,
        @Query("alt") alt: String = "sse",
        @Body request: GeminiRequest
    ): Response<ResponseBody>

    @POST("v1beta/models/{model}:countTokens")
    suspend fun countTokens(
        @Path("model") model: String,
        @Query("key") apiKey: String,
        @Body request: CountTokensRequest
    ): Response<CountTokensResponse>
}
