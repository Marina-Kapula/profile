---
title: "AMFI Meetups"
date: 2026-11-25
draft: false
toc: false
image: "images/events-meetups.jpg"
description: "A website where Erasmus students create and join meetups: food, trips and new friends. Built with Django and Tailwind during my internship in Italy."
tags: ["Django", "Python", "Tailwind", "daisyUI"]
code: "https://github.com/Marina-Kapula/events"
---

## The problem

AMFI International in Avezzano hosts Erasmus students. The students want to meet each other: go for pizza, take a trip, play sport. But they don't know each other yet, and there was no one place to find these plans. AMFI also wants to be sure every event is real and safe.

## The solution

A small website, like Meetup, only for AMFI students:

- **Find an event.** Search by keyword, city, date, type and size.
- **Join with one click.** When the event is full, you join the waiting list. When a spot frees up, the first person waiting gets it and an email.
- **Chat.** Every event has a chat, so people can ask questions and agree on details.
- **Create your own event.** Title, photo, city, place, time and how many people.
- **Admin review.** An AMFI admin checks every new event and every change before other students see it.
- **Register with a QR code.** At the welcome meeting the admin shows a QR code. Students scan it and sign up on their phone. The code works only for a short time.
- **Emails.** You get an email when your event is approved, when you get a spot, or when an event is cancelled.

## How it works

{{< screenshot src="images/meetups/how-it-works.png" caption="A student creates an event, AMFI reviews it, other students join, everyone meets" >}}

## Screenshots

<p class="note">The screenshots use demo data: the names and people are not real.</p>

### Find an event

The home page shows the next events. The search form filters them by keyword, city, date, type and size.

{{< screenshot src="images/meetups/home-v2.jpg" caption="Home page with search and event cards" >}}

### Event page and chat

Who is going, how many spots are left, and a chat for the people going.

{{< screenshot src="images/meetups/event-v2.jpg" caption="Event page: details, people going and the chat" >}}

### My events and a new event

{{< gallery >}}
{{< screenshot src="images/meetups/my-events-v2.jpg" caption="**My events**: events I created and events I joined" >}}
{{< screenshot src="images/meetups/new-event.jpg" caption="**New event**: the form sends the event to AMFI for review" >}}
{{< /gallery >}}

### On a phone

On a phone the menu moves to the bottom of the screen, so it is easy to reach with a thumb.

{{< gallery class="phones" >}}
{{< screenshot src="images/meetups/phone-cards-v2.jpg" caption="Event list" >}}
{{< screenshot src="images/meetups/phone-event-v2.jpg" caption="Event page" >}}
{{< /gallery >}}

### For the AMFI admin

The admin works in the Django admin.

{{< gallery >}}
{{< screenshot src="images/meetups/admin-review.jpg" caption="**Review**: Approve, or Reject with a reason" >}}
{{< screenshot src="images/meetups/admin-qr.jpg" caption="**QR code** for registration at the welcome meeting" >}}
{{< /gallery >}}

## Privacy

Everything is behind a login. Student photos are shown only to logged-in users. The site removes the GPS location from uploaded photos.

## How it is built

- **Django** renders the pages on the server. Plain HTML forms, very little JavaScript.
- **Tailwind CSS and daisyUI** for the design (the "lemonade" theme).
- **SQLite** database.
- **Tests** with pytest and automatic checks before every commit.
- **Docker and Dokku** to put the site on a server.

## Tools

Python, Django, Tailwind CSS, daisyUI, SQLite, pytest, Docker, Dokku, Git and GitHub.
