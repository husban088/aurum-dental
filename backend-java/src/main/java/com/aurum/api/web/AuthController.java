package com.aurum.api.web;

import com.aurum.api.config.JwtService;
import com.aurum.api.model.Appointment;
import com.aurum.api.model.User;
import com.aurum.api.repo.AppointmentRepository;
import com.aurum.api.repo.ReviewRepository;
import com.aurum.api.repo.UserRepository;
import com.aurum.api.service.EventPublisher;
import com.aurum.api.web.Dtos.AuthResponse;
import com.aurum.api.web.Dtos.LoginRequest;
import com.aurum.api.web.Dtos.ResetPasswordRequest;
import com.aurum.api.web.Dtos.SignupRequest;
import com.aurum.api.web.Dtos.UserDto;
import jakarta.validation.Valid;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final AppointmentRepository appointments;
    private final ReviewRepository reviews;
    private final EventPublisher events;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthController(UserRepository users, AppointmentRepository appointments, ReviewRepository reviews,
                          EventPublisher events, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.appointments = appointments;
        this.reviews = reviews;
        this.events = events;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    private static UserDto dto(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getPhone(),
            u.getCreatedAt() == null ? null : u.getCreatedAt().toString());
    }

    private static String digits(String s) { return s == null ? "" : s.replaceAll("[^0-9]", ""); }

    private AuthResponse respond(User u) {
        return new AuthResponse(jwt.create(u.getId(), u.getName(), u.getEmail()), dto(u));
    }

    @PostMapping("/signup")
    public AuthResponse signup(@Valid @RequestBody SignupRequest r) {
        String email = r.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        User u = new User();
        u.setName(r.name().trim());
        u.setEmail(email);
        u.setPhone(r.phone().trim());
        u.setPasswordHash(encoder.encode(r.password()));
        return respond(users.save(u));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest r) {
        String email = r.email().trim().toLowerCase(Locale.ROOT);
        User u = users.findByEmail(email)
            .filter(x -> encoder.matches(r.password(), x.getPasswordHash()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong email or password."));
        return respond(u);
    }

    /** Forgot password: the email and the phone number given at signup must both match. */
    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest r) {
        String email = r.email().trim().toLowerCase(Locale.ROOT);
        String phone = digits(r.phone());
        User u = users.findByEmail(email)
            .filter(x -> !phone.isEmpty() && digits(x.getPhone()).equals(phone))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "No account matches this email and phone number."));
        u.setPasswordHash(encoder.encode(r.password()));
        users.save(u);
        return Map.of("message", "Password updated. You can sign in now.");
    }

    @GetMapping("/me")
    public UserDto me(Authentication auth) {
        return users.findById(auth.getName()).map(AuthController::dto)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in again."));
    }

    /** Deletes the signed-in account together with its appointments and reviews. */
    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMe(Authentication auth) {
        String id = auth.getName();
        if (!users.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in again.");
        }
        for (Appointment a : appointments.findByUserId(id)) {
            events.publish("DELETED", a);
        }
        appointments.deleteByUserId(id);
        reviews.deleteByUserId(id);
        users.deleteById(id);
    }
}