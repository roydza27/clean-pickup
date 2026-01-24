# 📘 Software Requirements Specification (SRS)

## Project Title  
**Waste Coordination & Recycling Management System**  
*(Decision-Support Platform for Informal Recycling Ecosystems – India Pilot)*

---

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements for the **Waste Coordination & Recycling Management System**, a web-based, location-aware **decision-support platform** designed to improve coordination between citizens and scrap collectors (Kabadiwalas) in urban Indian localities.

The system focuses on **data-driven operational decision support**, with **one adaptive learning component** that improves pickup assignment quality over time based on observed outcomes.

This SRS is intended for:

- Academic evaluators  
- Project mentors  
- Software developers  
- Startup incubators and reviewers  

---

### 1.2 Scope

The system is a **software-only Minimum Viable Product (MVP)** delivered as a **responsive web application** accessible via desktop and mobile browsers.

The platform supports:

- Citizens generating recyclable waste  
- Kabadiwalas performing pickups  
- Admin operators managing operations and policies  

⚠️ **Hardware components** (smart bins, GPS trackers, automated weighing devices) are **explicitly excluded** from this phase and documented only as future scope.

---

### 1.3 Objectives

- Improve coordination efficiency in informal recycling workflows  
- Increase pickup completion reliability  
- Improve income predictability for Kabadiwalas  
- Provide transparency in pricing and pickup status  
- Reduce recyclable waste sent to landfills  
- Demonstrate measurable operational improvement over time  
- Validate a learning-based decision mechanism under real-world constraints  

---

### 1.4 Definitions & Acronyms

| Term | Meaning |
|----|----|
| MVP | Minimum Viable Product |
| OTP | One-Time Password |
| ETA | Estimated Time of Arrival |
| RWA | Resident Welfare Association |
| UPI | Unified Payments Interface |
| Policy Engine | Rule-based decision logic |
| Learning Loop | Feedback-driven weight adjustment mechanism |

---

## 2. Overall Description

### 2.1 Product Perspective

The system is a **location-aware, map-centric coordination platform** inspired by modern consumer service applications (e.g., ride-hailing and delivery apps).

It consists of:

- Citizen Web Interface  
- Kabadiwala Web Interface  
- Admin Web Dashboard  

All interfaces communicate with a centralized backend implementing:

- Role-based access control  
- Policy-based decision engines  
- One adaptive learning module for pickup assignment  

---

### 2.2 User Classes

| User | Description |
|----|----|
| Citizen | Household user scheduling recyclable pickups |
| Kabadiwala | Scrap collector completing assigned pickups |
| Admin | Operator configuring policies and monitoring system performance |

---

### 2.3 Operating Environment

- Modern web browsers (Chrome, Firefox, Edge)  
- Android mobile browsers (primary)  
- Intermittent internet connectivity  
- Cloud-hosted backend infrastructure  

---

### 2.4 Design Constraints

- Web-only implementation (no native mobile apps)  
- Mobile-first UX  
- Manual data entry allowed  
- India-specific locality, pricing, and payment context  
- Supported waste categories:
  - Plastic  
  - Paper  
  - Metal  

---

### 2.5 Assumptions

- Users possess web-enabled smartphones  
- Scrap rates are updated daily  
- Payments are executed externally via UPI  
- Pickup data is initially limited and noisy  
- Full automation is intentionally avoided to ensure fairness and safety  

---

## 3. System Philosophy & Design Principles

### 3.1 Human-Centered Automation

The system prioritizes **decision support over full automation** due to:

- Informal labor dynamics  
- Data sparsity  
- Ethical and operational considerations  

---

### 3.2 Incremental Intelligence

Only **one system component learns over time**, while others remain deterministic to ensure stability and explainability.

---

## 4. Functional Requirements

---

## 4.1 Citizen Web Interface

### 4.1.1 Authentication

- Phone number + OTP login  
- Persistent account profile  
- Stored pickup and payment history  

---

### 4.1.2 Location Selection

- Pincode / locality selection  
- Service availability indication  

---

### 4.1.3 Scrap Pickup Request

- Select waste categories  
- View daily scrap rates  
- Choose pickup date  
- Submit pickup request  

---

### 4.1.4 Pickup Tracking

Pickup status lifecycle:

- Requested  
- Assigned  
- On the way  
- Completed  

Includes **map-based tracking view**.

---

### 4.1.5 Payment Tracking

- Pickup-wise payment status  
- Optional UPI reference entry  
- Payment history timeline  

---

### 4.1.6 Garbage Collection Timing

- Expected arrival window display  
- Updates based on historical performance  
- Missed pickup reporting  

---

## 4.2 Kabadiwala Web Interface

### 4.2.1 Authentication

- Phone number + OTP login  
- Role-specific interface  

---

### 4.2.2 Assigned Pickups

- Daily pickup list  
- Pickup details:
  - Address  
  - Category  
  - Scheduled window  

---

### 4.2.3 Route Guidance

- System-suggested pickup order  
- External map navigation launch  

---

### 4.2.4 Pickup Completion

- Mark pickup as completed  
- Completion timestamp recorded  
- Optional manual weight entry  

---

### 4.2.5 Earnings Summary

- Daily earnings  
- Pickup count  
- Historical summary  

---

## 4.3 Admin Web Dashboard

### 4.3.1 Access Control

- Role-restricted access  
- Desktop-optimized layout  

---

### 4.3.2 Policy Configuration

- Scrap rate management  
- Locality and service zone configuration  
- Assignment policy parameter tuning  

---

### 4.3.3 Pickup Assignment Oversight

- View system-assigned pickups  
- Manual override capability (exceptional cases only)  

---

### 4.3.4 Impact Metrics Engine

The system shall display:

- Pickup completion rate (before vs after learning)  
- Average delay reduction  
- Income stability trends  
- Route efficiency indicators  

---

## 5. Core Intelligence Module (PRIMARY CONTRIBUTION)

### 5.1 Learning-Based Pickup Assignment Engine

#### Description
The system implements a **learning-based feedback loop** that improves pickup assignment decisions over time by adjusting factor weights based on observed outcomes.

#### Inputs
- Kabadiwala distance  
- Current workload  
- Reliability score  
- Historical completion performance  

#### Initial State
- Rule-based assignment with equal weights  

#### Learning Mechanism
- Log assignment outcomes  
- Periodically adjust weights to favor successful outcomes  
- Penalize patterns associated with delays or failures  

#### Output
- Improved pickup assignment quality over time  
- Measurable performance gains  

⚠️ This is the **only adaptive learning component** in the system.

---

## 6. Non-Functional Requirements

### 6.1 Performance

- Support ≥ 500 concurrent users  
- Average response time ≤ 3 seconds  

---

### 6.2 Reliability

- Prevention of duplicate assignments  
- Graceful handling of network interruptions  

---

### 6.3 Usability

- Mobile-first, map-centric UX  
- Simple, non-technical interface  
- English and Hindi language support  

---

### 6.4 Security

- OTP-based authentication  
- Role-based access control  
- Secure API endpoints  

---

### 6.5 Scalability

- Multi-locality and multi-city support  
- Policy parameter extensibility  

---

## 7. External Interface Requirements

### 7.1 User Interfaces

- Responsive web UI for all roles  
- Map-centric interaction design  

---

### 7.2 Software Interfaces

- Map APIs (navigation only)  
- Browser notification services  
- Relational database system  

---

## 8. Out-of-Scope (Explicitly Excluded)

- Blockchain systems  
- Carbon credit integration  
- Smart bins and sensors  
- Fully autonomous decision systems  
- Native mobile applications  

---

## 9. Future Scope (Conceptual)

- Additional learning signals  
- Municipality-level analytics  
- Hardware integrations (future phases only)  

---

## 10. Acceptance Criteria

The system is considered successful if:

- Pickup completion rate improves measurably over time  
- Assignment efficiency improves compared to baseline  
- Kabadiwala income stability increases  
- System operates reliably for at least 30 days  

---

## 11. Conclusion

This project demonstrates that **incremental, ethical intelligence embedded within real-world coordination systems** can deliver measurable impact without relying on opaque or over-automated solutions.

The system prioritizes **explainability, adaptability, and operational realism**, making it suitable for both academic evaluation and real-world pilot deployments.

---
