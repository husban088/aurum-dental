package com.aurum.notify

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.repository.MongoRepository
import java.time.Instant

@Document("notifications")
data class Notification(
    @Id val id: String? = null,
    val type: String,
    val message: String,
    val appointmentId: String? = null,
    val at: Instant = Instant.now(),
)

interface NotificationRepository : MongoRepository<Notification, String> {
    fun findTop10ByOrderByAtDesc(): List<Notification>
}
