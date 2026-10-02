package com.aurum.api.service;

import com.aurum.api.model.Appointment;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

/**
 * Publishes appointment events to Kafka for the Kotlin notification service and the Python analytics service.
 * Kafka problems are logged and never break a booking.
 */
@Service
public class EventPublisher {
    private static final Logger log = LoggerFactory.getLogger(EventPublisher.class);

    private final KafkaTemplate<String, String> kafka;
    private final ObjectMapper mapper;
    private final String topic;

    public EventPublisher(KafkaTemplate<String, String> kafka, ObjectMapper mapper,
                          @Value("${aurum.topic}") String topic) {
        this.kafka = kafka;
        this.mapper = mapper;
        this.topic = topic;
    }

    /** type is one of CREATED, STATUS_CHANGED, DELETED. */
    public void publish(String type, Appointment a) {
        try {
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("type", type);
            e.put("appointmentId", a.getId());
            e.put("patient", a.getName());
            e.put("service", a.getService());
            e.put("doctor", a.getDoctor());
            e.put("date", a.getDate());
            e.put("time", a.getTime());
            e.put("status", a.getStatus());
            e.put("at", Instant.now().toString());
            kafka.send(topic, a.getId(), mapper.writeValueAsString(e))
                 .whenComplete((r, ex) -> {
                     if (ex != null) log.warn("Kafka publish failed: {}", ex.getMessage());
                 });
        } catch (Exception ex) {
            log.warn("Could not publish {} event: {}", type, ex.getMessage());
        }
    }
}
