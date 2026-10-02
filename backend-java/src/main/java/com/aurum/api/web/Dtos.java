package com.aurum.api.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request / response shapes for the REST API. */
public final class Dtos {
    private Dtos() { }

    public static final String PHONE = "[+0-9][0-9 ]{9,15}";

    public record SignupRequest(
        @NotBlank(message = "Enter your full name.") @Size(min = 3, max = 80, message = "Name must be 3 to 80 characters.") String name,
        @NotBlank(message = "Enter your email.") @Email(message = "Enter a valid email.") String email,
        @NotBlank(message = "Enter your phone number.") @Pattern(regexp = PHONE, message = "Enter a valid phone number.") String phone,
        @NotBlank(message = "Choose a password.") @Size(min = 6, max = 100, message = "Use at least 6 characters for the password.") String password) { }

    public record LoginRequest(
        @NotBlank(message = "Enter your email.") @Email(message = "Enter a valid email.") String email,
        @NotBlank(message = "Enter your password.") String password) { }

    public record ResetPasswordRequest(
        @NotBlank(message = "Enter your email.") @Email(message = "Enter a valid email.") String email,
        @NotBlank(message = "Enter your phone number.") @Pattern(regexp = PHONE, message = "Enter a valid phone number.") String phone,
        @NotBlank(message = "Choose a new password.") @Size(min = 6, max = 100, message = "Use at least 6 characters for the password.") String password) { }

    public record UserDto(String id, String name, String email, String phone, String createdAt) { }

    public record AuthResponse(String token, UserDto user) { }

    public record AppointmentRequest(
        @NotBlank(message = "Enter the patient name.") @Size(min = 3, max = 80, message = "Name must be 3 to 80 characters.") String name,
        @NotBlank(message = "Enter a phone number.") @Pattern(regexp = PHONE, message = "Enter a valid phone number.") String phone,
        @NotBlank(message = "Choose a treatment.") @Size(max = 80) String service,
        @Size(max = 80) String doctor,
        @NotBlank(message = "Pick a date.") @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Enter a valid date.") String date,
        @NotBlank(message = "Pick a time.") @Size(max = 20) String time,
        @Size(max = 500, message = "Notes can be up to 500 characters.") String note) { }

    public record StatusRequest(@NotBlank(message = "Status is required.") String status) { }

    public record ReviewRequest(
        @NotBlank(message = "Enter your name.") @Size(min = 3, max = 80, message = "Name must be 3 to 80 characters.") String name,
        @NotBlank(message = "Choose a treatment.") @Size(max = 80) String treat,
        @Min(value = 1, message = "Choose a rating from 1 to 5.") @Max(value = 5, message = "Choose a rating from 1 to 5.") int rating,
        @NotBlank(message = "Write your review.") @Size(min = 15, max = 1000, message = "Write between 15 and 1000 characters.") String text) { }
}