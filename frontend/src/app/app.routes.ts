import { Routes } from "@angular/router";
import { authGuard } from "./core/auth.guard";
import { HomeComponent } from "./pages/home.component";
import { ServicesComponent } from "./pages/services.component";
import { DoctorsComponent } from "./pages/doctors.component";
import { ResultsComponent } from "./pages/results.component";
import { ReviewsComponent } from "./pages/reviews.component";
import { BookComponent } from "./pages/book.component";
import { LoginComponent } from "./pages/login.component";
import { SignupComponent } from "./pages/signup.component";
import { ForgotPasswordComponent } from "./pages/forgot-password.component";
import { ProfileComponent } from "./pages/profile.component";
import { DashboardComponent } from "./pages/dashboard.component";

export const routes: Routes = [
  {
    path: "",
    component: HomeComponent,
    title: "Luxury dentistry | Aurum Dental Atelier",
  },
  {
    path: "treatments",
    component: ServicesComponent,
    title: "Treatments | Aurum Dental Atelier",
  },
  {
    path: "dentists",
    component: DoctorsComponent,
    title: "Our dentists | Aurum Dental Atelier",
  },
  {
    path: "results",
    component: ResultsComponent,
    title: "Before and after | Aurum Dental Atelier",
  },
  {
    path: "reviews",
    component: ReviewsComponent,
    title: "Patient reviews | Aurum Dental Atelier",
  },
  {
    path: "book",
    component: BookComponent,
    canActivate: [authGuard],
    title: "Book a visit | Aurum Dental Atelier",
  },
  {
    path: "login",
    component: LoginComponent,
    title: "Sign in | Aurum Dental Atelier",
  },
  {
    path: "signup",
    component: SignupComponent,
    title: "Create account | Aurum Dental Atelier",
  },
  {
    path: "forgot-password",
    component: ForgotPasswordComponent,
    title: "Reset password | Aurum Dental Atelier",
  },
  {
    path: "profile",
    component: ProfileComponent,
    canActivate: [authGuard],
    title: "My profile | Aurum Dental Atelier",
  },
  {
    path: "dashboard",
    component: DashboardComponent,
    title: "Dashboard | Aurum Dental Atelier",
  },
  { path: "**", redirectTo: "" },
];
