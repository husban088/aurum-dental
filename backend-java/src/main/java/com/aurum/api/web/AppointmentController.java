package com.aurum.api.web;

import com.aurum.api.model.Appointment;
import com.aurum.api.repo.AppointmentRepository;
import com.aurum.api.service.EventPublisher;
import com.aurum.api.web.Dtos.AppointmentRequest;
import com.aurum.api.web.Dtos.StatusRequest;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
    private static final Set<String> STATUSES = Set.of("Pending", "Confirmed", "Completed", "Cancelled");

    private final AppointmentRepository repo;
    private final EventPublisher events;

    public AppointmentController(AppointmentRepository repo, EventPublisher events) {
        this.repo = repo;
        this.events = events;
    }

    /** Public: the dashboard shows every appointment to everyone. */
    @GetMapping
    public List<Appointment> all() { return repo.findAll(); }

    /** Signed-in user's own bookings. */
    @GetMapping("/mine")
    public List<Appointment> mine(Authentication auth) {
        return repo.findByUserIdOrderByDateDescTimeDesc(auth.getName());
    }

    /** Website booking form (needs a signed-in user). */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Appointment book(@Valid @RequestBody AppointmentRequest r, Authentication auth) {
        LocalDate d = parse(r.date());
        if (d.isBefore(LocalDate.now().minusDays(1))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pick today or a later date.");
        }
        Appointment a = build(r);
        a.setUserId(auth.getName());
        Appointment saved = repo.save(a);
        events.publish("CREATED", saved);
        return saved;
    }

    /** Dashboard "New appointment" button (dashboard is public, no login). */
    @PostMapping("/manual")
    @ResponseStatus(HttpStatus.CREATED)
    public Appointment manual(@Valid @RequestBody AppointmentRequest r) {
        parse(r.date());
        Appointment saved = repo.save(build(r));
        events.publish("CREATED", saved);
        return saved;
    }

    @PatchMapping("/{id}/status")
    public Appointment setStatus(@PathVariable String id, @Valid @RequestBody StatusRequest r) {
        if (!STATUSES.contains(r.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown status.");
        }
        Appointment a = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found."));
        a.setStatus(r.status());
        Appointment saved = repo.save(a);
        events.publish("STATUS_CHANGED", saved);
        return saved;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        Appointment a = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found."));
        repo.deleteById(id);
        events.publish("DELETED", a);
    }

    private static LocalDate parse(String s) {
        try {
            return LocalDate.parse(s);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid date.");
        }
    }

    private static Appointment build(AppointmentRequest r) {
        Appointment a = new Appointment();
        a.setName(r.name().trim());
        a.setPhone(r.phone().trim());
        a.setService(r.service().trim());
        a.setDoctor(r.doctor() == null || r.doctor().isBlank() ? "Any available dentist" : r.doctor().trim());
        a.setDate(r.date());
        a.setTime(r.time().trim());
        a.setNote(r.note() == null || r.note().isBlank() ? null : r.note().trim());
        a.setStatus("Pending");
        return a;
    }
}
