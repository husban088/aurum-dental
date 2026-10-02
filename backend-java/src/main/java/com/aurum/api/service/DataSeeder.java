package com.aurum.api.service;

import com.aurum.api.model.Appointment;
import com.aurum.api.model.Review;
import com.aurum.api.repo.AppointmentRepository;
import com.aurum.api.repo.ReviewRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/** Fills an empty database with 5 dummy appointments and 6 reviews so the dashboard is never blank. */
@Component
public class DataSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final AppointmentRepository appointments;
    private final ReviewRepository reviews;

    public DataSeeder(AppointmentRepository appointments, ReviewRepository reviews) {
        this.appointments = appointments;
        this.reviews = reviews;
    }

    private static String day(int offset) { return LocalDate.now().plusDays(offset).toString(); }

    @Override
    public void run(String... args) {
        if (appointments.count() == 0) {
            appointments.saveAll(List.of(
                new Appointment("Hira Siddiqui", "+92 300 1112233", "Porcelain veneers", "Dr. Ayesha Khan", day(0), "11:00 AM", "Confirmed"),
                new Appointment("Usman Tariq", "+92 321 4445566", "Painless root canal", "Dr. Zain Malik", day(0), "03:00 PM", "Pending"),
                new Appointment("Maryam Ali", "+92 333 7778899", "Advanced whitening", "Dr. Ayesha Khan", day(1), "12:00 PM", "Confirmed"),
                new Appointment("Bilal Ahmed", "+92 345 2223344", "Invisible aligners", "Dr. Sana Riaz", day(2), "05:00 PM", "Pending"),
                new Appointment("Sadia Noor", "+92 300 9998877", "Family and kids", "Dr. Sana Riaz", day(-1), "10:00 AM", "Completed")
            ));
            log.info("Seeded 5 dummy appointments");
        }
        if (reviews.count() == 0) {
            reviews.saveAll(List.of(
                review("Hira Siddiqui", "Porcelain veneers", 5, "I used to hide my smile in photos. After Dr. Ayesha's veneers I stopped thinking about my teeth at all, which is exactly the point.", 12),
                review("Usman Tariq", "Painless root canal", 5, "My root canal was calmer than most haircuts. The team explained every step before touching anything.", 30),
                review("Maryam Ali", "Advanced whitening", 5, "One visit, eight shades brighter, zero sensitivity. The clinic feels like a spa, not a dentist.", 45),
                review("Bilal Ahmed", "Invisible aligners", 4, "The 3D preview showed my final smile before I started. Nobody at work even noticed I was wearing aligners.", 60),
                review("Sadia Noor", "Family and kids", 5, "My daughter asks when we can go back. I never thought I would hear a child say that about a dentist.", 75),
                review("Farhan Raza", "Dental implants", 5, "Dr. Zain planned everything on screen first. The implant feels completely like my own tooth.", 90)
            ));
            log.info("Seeded 6 reviews");
        }
    }

    private static Review review(String name, String treat, int rating, String text, int daysAgo) {
        return new Review(name, treat, rating, text, day(-daysAgo), Instant.now().minus(daysAgo, ChronoUnit.DAYS));
    }
}
