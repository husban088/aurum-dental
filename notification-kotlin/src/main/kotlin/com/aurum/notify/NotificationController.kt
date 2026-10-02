package com.aurum.notify

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/notify")
class NotificationController(private val repo: NotificationRepository) {

    /** Latest 10 notifications, newest first (shown on the dashboard). */
    @GetMapping("/recent")
    fun recent(): List<Notification> = repo.findTop10ByOrderByAtDesc()

    @GetMapping("/health")
    fun health(): Map<String, String> = mapOf("status" to "UP")
}
