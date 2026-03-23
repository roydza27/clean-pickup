# 📘 Software Requirements Specification (SRS)

## Waste Coordination & Recycling Management System

*(Decision-Support Platform for Informal Recycling Ecosystems – India Pilot)*

---

## 1. Introduction

### 1.1 Purpose

This document defines the functional and non-functional requirements for the **Waste Coordination & Recycling Management System**, a web-based, location-aware platform designed to improve coordination between citizens and scrap collectors (Kabadiwalas) in urban India.

The system emphasizes **decision support over automation**, incorporating a **single adaptive learning component** to improve pickup assignment efficiency over time.

This document is intended for:

* Developers and system architects
* Academic evaluators and mentors
* Startup reviewers and stakeholders

---

### 1.2 Scope

The system is a **Minimum Viable Product (MVP)** delivered as a **responsive web application**, accessible via desktop and mobile browsers.

It enables:

* Citizens to schedule recyclable waste pickups
* Kabadiwalas to manage and complete pickups
* Admins to monitor operations and configure policies

**Out of scope (MVP phase):**

* Hardware integrations (e.g., smart bins, IoT devices)
* Automated weighing systems
* GPS hardware tracking

---

### 1.3 Objectives

* Improve coordination efficiency in waste collection
* Increase pickup completion rates
* Enhance income predictability for Kabadiwalas
* Provide pricing transparency
* Reduce recyclable waste sent to landfills
* Enable measurable operational improvements
* Validate a learning-based decision model in real-world conditions

---

### 1.4 Definitions & Acronyms

| Term            | Meaning                                |
| --------------- | -------------------------------------- |
| MVP             | Minimum Viable Product                 |
| OTP             | One-Time Password                      |
| ETA             | Estimated Time of Arrival              |
| UPI             | Unified Payments Interface             |
| Policy Engine   | Rule-based decision logic              |
| Learning Module | Feedback-driven optimization component |

---

## 2. Overall Description

### 2.1 Product Perspective

The system is a **map-centric coordination platform**, similar in interaction style to ride-hailing or delivery applications.

It consists of:

* Citizen Interface
* Kabadiwala Interface
* Admin Dashboard

All components interact with a centralized backend supporting:

* Role-based access control
* Policy-driven decision making
* A single adaptive learning module

---

### 2.2 User Classes

| User Type  | Description                                     |
| ---------- | ----------------------------------------------- |
| Citizen    | Schedules waste pickups                         |
| Kabadiwala | Executes assigned pickups                       |
| Admin      | Manages system policies and monitors operations |

---

### 2.3 Operating Environment

* Web browsers (Chrome, Firefox, Edge)
* Android mobile browsers (primary target)
* Cloud-based backend infrastructure
* Intermittent internet connectivity

---

### 2.4 Design Constraints

* Web-only (no native apps)
* Mobile-first user experience
* Manual data entry supported
* India-specific operational context
* Supported waste categories:

  * Plastic
  * Paper
  * Metal

---

### 2.5 Assumptions

* Users have access to smartphones with internet
* Scrap rates are updated regularly
* Payments are handled externally via UPI
* Initial data may be limited or inconsistent
* Full automation is avoided for fairness and reliability

---

## 3. System Philosophy

### 3.1 Human-Centered Design

The system prioritizes **assisted decision-making** over full automation due to:

* Informal workforce dynamics
* Data limitations
* Ethical considerations

---

### 3.2 Controlled Intelligence

Only one system component (pickup assignment) uses adaptive learning.
All other modules remain deterministic for:

* Predictability
* Transparency
* Debuggability

---

## 4. Functional Requirements

---

### 4.1 Citizen Interface

#### 4.1.1 Authentication

* Login via phone number and OTP
* Persistent user profile
* Access to pickup and payment history

---

#### 4.1.2 Locality Selection

* Select pincode/locality
* View service availability

---

#### 4.1.3 Pickup Request

* Select waste category
* View current scrap rates
* Choose pickup date and time
* Submit request

---

#### 4.1.4 Pickup Tracking

Pickup lifecycle:

* Requested
* Assigned
* In Progress
* Completed

Includes optional map-based tracking.

---

#### 4.1.5 Payments

* View payment status per pickup
* Enter UPI reference (optional)
* View transaction history

---

#### 4.1.6 Garbage Schedule

* View collection timings
* Report missed pickups
* Access historical schedule performance

---

### 4.2 Kabadiwala Interface

#### 4.2.1 Authentication

* OTP-based login
* Role-specific access

---

#### 4.2.2 Pickup Management

* View assigned pickups
* Access details:

  * Address
  * Category
  * Time window

---

#### 4.2.3 Route Assistance

* Suggested pickup sequence
* Integration with external map apps

---

#### 4.2.4 Completion Workflow

* Mark pickup as completed
* Record timestamp
* Enter weight (optional)

---

#### 4.2.5 Earnings Dashboard

* Daily earnings
* Pickup statistics
* Historical trends

---

### 4.3 Admin Dashboard

#### 4.3.1 Access Control

* Restricted access
* Desktop-optimized interface

---

#### 4.3.2 Policy Management

* Manage scrap rates
* Configure service areas
* Adjust assignment rules

---

#### 4.3.3 Pickup Oversight

* Monitor assignments
* Override assignments when required

---

#### 4.3.4 Analytics & Metrics

* Pickup completion rate
* Delay reduction metrics
* Earnings trends
* Route efficiency

---

## 5. Core Intelligence Module

### 5.1 Learning-Based Assignment Engine

#### Overview

A feedback-driven system that improves pickup assignment decisions over time.

---

#### Inputs

* Distance to pickup
* Current workload
* Reliability score
* Historical performance

---

#### Initial Behavior

* Equal-weight rule-based assignment

---

#### Learning Process

* Track assignment outcomes
* Adjust weights periodically
* Reward successful patterns
* Penalize delays/failures

---

#### Output

* Improved assignment accuracy
* Increased operational efficiency

---

⚠️ This is the **only adaptive component** in the system.

---

## 6. Non-Functional Requirements

### 6.1 Performance

* ≥ 500 concurrent users
* ≤ 3 seconds average response time

---

### 6.2 Reliability

* Prevent duplicate assignments
* Handle network failures gracefully

---

### 6.3 Usability

* Mobile-first interface
* Simple and intuitive UX
* English and Hindi support

---

### 6.4 Security

* OTP authentication
* Role-based authorization
* Secure API access

---

### 6.5 Scalability

* Multi-locality support
* Expandable to multiple cities
* Configurable policy system

---

## 7. External Interfaces

### 7.1 User Interface

* Responsive web UI
* Map-based interactions

---

### 7.2 Software Interfaces

* Map/navigation APIs
* Notification systems
* PostgreSQL database

---

## 8. Out of Scope

* Blockchain integration
* Carbon credit systems
* IoT hardware
* Fully autonomous decision systems
* Native mobile apps

---

## 9. Future Enhancements

* Advanced learning models
* Municipal-level dashboards
* Hardware integration (future phases)

---

## 10. Acceptance Criteria

The system is successful if:

* Pickup completion rate improves over time
* Assignment efficiency increases
* Kabadiwala income stability improves
* System operates reliably for ≥ 30 days

---

## 11. Conclusion

This system demonstrates that **incremental, explainable intelligence** in real-world coordination systems can produce measurable impact without relying on over-automation.

It balances:

* Practical usability
* Ethical design
* Scalable architecture

making it suitable for both **academic validation** and **real-world deployment**.

---
