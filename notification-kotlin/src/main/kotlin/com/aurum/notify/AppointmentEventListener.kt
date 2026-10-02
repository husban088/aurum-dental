package com.aurum.notify

import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Component

/** Consumes appointment events published by the Java API and stores a readable notification in MongoDB. */
@Component
class AppointmentEventListener(
    private val repo: NotificationRepository,
    private val mapper: ObjectMapper,
) {
    private val log = LoggerFactory.getLogger(AppointmentEventListener::class.java)

    @KafkaListener(topics = ["\${aurum.topic}"])
    fun onEvent(payload: String) {
        try {
            val e = mapper.readTree(payload)
            val type = e.path("type").asText("UNKNOWN")
            val patient = e.path("patient").asText("A patient")
            val service = e.path("service").asText("a treatment")
            val doctor = e.path("doctor").asText("")
            val date = e.path("date").asText("")
            val time = e.path("time").asText("")
            val status = e.path("status").asText("")
            val withDoctor = if (doctor.isBlank()) "" else " with $doctor"

            val message = when (type) {
                "CREATED" -> "New appointment: $patient booked $service$withDoctor on $date at $time."
                "STATUS_CHANGED" -> "Status changed: $patient's $service appointment is now $status."
                "DELETED" -> "Appointment removed: $patient's $service on $date."
                else -> "Appointment event ($type) for $patient."
            }
            repo.save(
                Notification(
                    type = type,
                    message = message,
                    appointmentId = e.path("appointmentId").asText("").ifBlank { null },
                ),
            )
            log.info("Stored notification: {}", message)
        } catch (ex: Exception) {
            log.warn("Skipping unreadable event: {}", ex.message)
        }
    }
}
