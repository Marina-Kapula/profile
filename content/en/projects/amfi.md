---
title: "AMFI Forms"
date: 2026-11-17
draft: false
toc: false
image: "images/amfi-forms.jpg"
description: "A website that replaces the paper forms of an Erasmus+ internship with online forms. Built with Django during my internship in Italy."
tags: ["Django", "Python", "HTML", "CSS"]
---

## The problem

AMFI International in Italy organises Erasmus+ internships. For every student there is a pile of paper forms: personal data, an internship journal, a weekly log with hours, an assessment from the company tutor and a certificate at the end. The forms went by email and on paper, got lost, and AMFI typed the same data again and again.

## The solution

One website where each person fills in only their own part:

- **AMFI** enters the student's data once, on one simple page. The site puts it into all the forms by itself.
- **The student** logs in and writes every week what they did and how many hours.
- **The company tutor** gets a secret link, no password needed. The tutor approves the weeks, writes comments and gives the marks.
- **The certificate** appears by itself when everything is done.
- **Print / PDF**: all forms look like the paper ones and can be printed.
- **Emails**: the student and the tutor get their links by email.

## How it works

{{< screenshot src="images/forms/how-it-works-v2.png" caption="AMFI fills in one form, the student and the tutor fill in their parts, the certificate appears by itself" >}}

## Screenshots

<p class="note">The screenshots use demo data: the names, emails and numbers are not real.</p>

### For AMFI

A list of teachers and their students, with the status of every student: what is missing and whose turn it is.

{{< screenshot src="images/forms/overview.jpg" caption="**Teachers and students**: the AMFI control panel" >}}

All the data of a student on one page. From here it goes into the forms by itself.

{{< screenshot src="images/forms/student-info.jpg" caption="**Student info**: AMFI fills it in once" >}}

### For the student

The site always says what to do now. The student writes the tasks of the week, the usual hours go in by themselves.

{{< screenshot src="images/forms/student-week.jpg" caption="**Weekly log**: \"What to do now\" and the week to fill in" >}}

### For the company tutor

The tutor opens a personal link, checks every week and approves it with one button.

{{< screenshot src="images/forms/tutor-weeks.jpg" caption="**Approved week** with the tutor's comment" >}}

{{< gallery >}}
{{< screenshot src="images/forms/tutor-assessment.jpg" caption="**Assessment**: the tutor gives the marks" >}}
{{< screenshot src="images/forms/tutor-anagrafica.jpg" caption="**Personal data**: the tutor sees private numbers hidden 🔒" >}}
{{< /gallery >}}

### On a phone

{{< gallery class="phones" >}}
{{< screenshot src="images/forms/phone-login-v2.jpg" caption="Log in" >}}
{{< screenshot src="images/forms/phone-tutor.jpg" caption="The certificate, ready" >}}
{{< /gallery >}}

## Privacy

- The ID card number and the Erasmus+ project number are **encrypted** in the database.
- The tutor sees private numbers (date of birth, ID card, phone) hidden.
- Each person sees only their own student and only the forms they need.

## How it is built

- **Django** renders the pages on the server. Plain HTML forms and a little JavaScript.
- **HTML and CSS** made to look like the real paper forms, also when printed.
- **SQLite** database.
- **Tests** that click through the whole site: AMFI, student, tutor and certificate.
- **Docker and Dokku** to put the site on a server, emails through SMTP.

## Tools

Python, Django, HTML, CSS, JavaScript, SQLite, Docker, Dokku, Git and GitHub.

## Thank you

A big thank you to **[Hakan Ates](https://ateshakan.com/)**, a software engineer at Go Project who helps Erasmus+ exchange students with their internship projects. He guided me through every step: planning, code, testing and putting the site on a server. He explained everything step by step, and I learned a lot from him. I am really grateful for his help and support. His GitHub: [github.com/ateshakan](https://github.com/ateshakan).
