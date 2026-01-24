# Software Requirements Specification (SRS)

**Project Title:** Waste Coordination & Recycling Management System  
**Subtitle:** Decision-Support Platform for Informal Recycling Ecosystems – India Pilot  
**Version:** 2.0  
**Date:** January 24, 2026  
**Status:** Final

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Initial | Project Team | Initial draft |
| 2.0 | Jan 24, 2026 | Enhanced | Complete rewrite with comprehensive details |

### Distribution List
- Academic evaluators and research committees
- Project mentors and advisors
- Software development and QA teams
- Startup incubators and investors
- System architects and technical reviewers

---

## Executive Summary

The Waste Coordination & Recycling Management System is a web-based decision-support platform designed to optimize informal recycling operations in urban India. The system connects citizens generating recyclable waste with Kabadiwalas (informal scrap collectors) through an intelligent pickup coordination mechanism.

**Key Innovation:** The system incorporates a single, bounded machine learning component—a learning-based pickup assignment engine that improves assignment quality over time through feedback-driven weight optimization. This represents an ethical, measurable application of artificial intelligence in resource-constrained informal economies.

**Target Impact:**
- 30-40% improvement in coordination efficiency
- 85%+ pickup completion rate
- Improved income stability for Kabadiwalas
- Measurable reduction in recyclable waste sent to landfills

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Architecture](#3-system-architecture)
4. [Functional Requirements](#4-functional-requirements)
5. [Core Intelligence Module](#5-core-intelligence-module)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [External Interface Requirements](#7-external-interface-requirements)
8. [Data Requirements](#8-data-requirements)
9. [Security Requirements](#9-security-requirements)
10. [Quality Attributes](#10-quality-attributes)
11. [Constraints and Assumptions](#11-constraints-and-assumptions)
12. [Testing Requirements](#12-testing-requirements)
13. [Deployment and Maintenance](#13-deployment-and-maintenance)
14. [Future Scope](#14-future-scope)
15. [Acceptance Criteria](#15-acceptance-criteria)
16. [Appendices](#16-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document provides comprehensive functional and non-functional requirements for the **Waste Coordination & Recycling Management System**. The system is a location-aware, web-based platform that facilitates coordination between urban citizens and informal scrap collectors (Kabadiwalas) in Indian cities.

The document serves multiple stakeholders:

**For Academic Evaluators:**
- Detailed specification of the learning algorithm
- Research methodology and validation approach
- Impact measurement framework
- Ethical AI considerations

**For Development Teams:**
- Complete functional requirements
- Technical architecture specifications
- API contracts and data models
- Security and performance requirements

**For Business Stakeholders:**
- Product scope and objectives
- User role definitions
- Success metrics and KPIs
- Deployment and scaling strategy

### 1.2 Project Scope

#### 1.2.1 What's Included (In Scope)

**Core System Components:**
1. **Responsive Web Application** with three role-specific interfaces:
   - Citizen interface for scheduling and tracking pickups
   - Kabadiwala interface for managing assigned pickups
   - Admin dashboard for policy configuration and monitoring

2. **Backend Services:**
   - User authentication and authorization
   - Pickup request and lifecycle management
   - Learning-based assignment engine (PRIMARY CONTRIBUTION)
   - Real-time tracking and notifications
   - Payment tracking and history
   - Analytics and reporting

3. **Data Management:**
   - Centralized database
   - User profiles and preferences
   - Pickup and transaction history
   - Learning algorithm performance data

4. **Integration Services:**
   - Map services for location and navigation
   - SMS gateway for OTP and notifications
   - Cloud storage for images

**Supported Features:**
- Multi-language support (English and Hindi)
- Three waste categories (Plastic, Paper, Metal)
- Daily scrap rate management
- Manual data entry (weights, payments)
- Performance analytics and dashboards
- Learning algorithm performance tracking

#### 1.2.2 What's Excluded (Out of Scope)

**Hardware Components:**
- ❌ Smart bins with sensors
- ❌ IoT weight measurement devices
- ❌ GPS tracking hardware
- ❌ Automated sorting equipment
- ❌ RFID tagging systems

**Software Components:**
- ❌ Native mobile applications (iOS/Android)
- ❌ Blockchain integration
- ❌ Carbon credit trading platform
- ❌ Cryptocurrency payments
- ❌ Advanced AI/ML beyond assignment engine
- ❌ Municipality ERP integration
- ❌ Automated pricing algorithms

**Business Processes:**
- ❌ Direct payment processing (UPI payments handled externally)
- ❌ Scrap material quality verification
- ❌ Recycling facility operations
- ❌ Municipality contract management

**Rationale for Exclusions:**
- Focus MVP on core coordination problem
- Minimize hardware dependencies
- Reduce complexity and cost
- Faster time to market
- Easier validation of core hypothesis

#### 1.2.3 Future Enhancements (Conceptual)

Documented for future phases but not part of current implementation:
- Native mobile apps for offline support
- Additional waste categories (e-waste, glass, organic)
- Integration with municipal systems
- Hardware sensor integration
- Advanced route optimization
- Predictive demand forecasting
- Community engagement features
- Gamification for citizen participation

### 1.3 Product Objectives

#### 1.3.1 Primary Objectives

**1. Operational Efficiency**
- **Target:** Improve coordination efficiency by 30-40%
- **Measurement:** Reduction in average time from request to completion
- **Baseline:** Current manual coordination methods

**2. Service Reliability**
- **Target:** Achieve 85%+ pickup completion rate
- **Measurement:** Completed pickups / Total requested pickups
- **Baseline:** Establish during first 30 days

**3. Income Stability for Kabadiwalas**
- **Target:** Reduce income variance by 25%
- **Measurement:** Standard deviation of daily earnings
- **Impact:** More predictable livelihood for workers

**4. Waste Diversion**
- **Target:** Quantify recyclables diverted from landfills
- **Measurement:** Total weight collected through platform
- **Impact:** Environmental sustainability metrics

**5. Learning Algorithm Validation**
- **Target:** Demonstrate measurable improvement from ML component
- **Measurement:** Before/after comparison of assignment success rate
- **Academic Value:** Validate incremental learning approach

#### 1.3.2 Secondary Objectives

**6. Transparency and Trust**
- Provide real-time visibility into pricing and pickup status
- Build trust between citizens and informal sector workers
- Establish accountability through ratings and feedback

**7. Data-Driven Insights**
- Generate actionable data for urban planners
- Establish baseline metrics for informal recycling
- Support evidence-based policy making

**8. Scalability Validation**
- Demonstrate technical architecture supports multi-city deployment
- Prove business model viability
- Establish framework for future expansion

**9. Digital Inclusion**
- Enable digitalization of informal economy
- Provide accessible platform for low-digital-literacy users
- Create income opportunities through technology

### 1.4 Definitions, Acronyms, and Abbreviations

#### Core Terms

| Term | Definition |
|------|------------|
| **Assignment Engine** | System component responsible for matching pickup requests to Kabadiwalas using factor-weighted scoring |
| **Citizen** | Registered household user who schedules recyclable waste pickups through the platform |
| **ETA** | Estimated Time of Arrival - calculated time for Kabadiwala to reach pickup location |
| **Kabadiwala** | Informal scrap collector who performs pickups. Hindi term for waste picker/recycler operating in India's informal economy |
| **Learning Loop** | Feedback-driven mechanism that adjusts assignment factor weights based on observed outcomes |
| **Locality** | Geographic service zone defined by pincode or neighborhood boundaries |
| **MVP** | Minimum Viable Product - initial version with core features for market validation |
| **OTP** | One-Time Password for secure authentication via SMS |
| **Pickup Request** | Citizen-initiated request for collection of recyclable materials |
| **Policy Engine** | Rule-based decision logic for system operations and business rules |
| **Reliability Score** | Performance metric (0.0-1.0) measuring Kabadiwala's historical success rate |
| **Scrap Rate** | Current market price per kilogram for recyclable materials |
| **Service Zone** | Geographic area where pickup services are available and active |
| **Waste Category** | Classification of recyclable materials: Plastic, Paper, or Metal |

#### Technical Acronyms

| Acronym | Full Form |
|---------|-----------|
| **API** | Application Programming Interface |
| **HTTPS** | Hypertext Transfer Protocol Secure |
| **JSON** | JavaScript Object Notation |
| **JWT** | JSON Web Token |
| **RBAC** | Role-Based Access Control |
| **REST** | Representational State Transfer |
| **SMS** | Short Message Service |
| **TLS** | Transport Layer Security |
| **UUID** | Universally Unique Identifier |

#### India-Specific Terms

| Term | Definition |
|------|------------|
| **RWA** | Resident Welfare Association - community organization in housing societies |
| **UPI** | Unified Payments Interface - India's real-time payment system |
| **Pincode** | Postal Index Number - 6-digit code for geographic areas in India |
| **Aadhar** | 12-digit unique identity number for Indian residents |

### 1.5 Document References

**Standards and Guidelines:**
1. IEEE Std 830-1998 - IEEE Recommended Practice for Software Requirements Specifications
2. ISO/IEC 25010:2011 - Systems and software Quality Requirements and Evaluation (SQuaRE)
3. Web Content Accessibility Guidelines (WCAG) 2.1, Level AA
4. OWASP Top 10 Web Application Security Risks

**Regulatory Documents:**
5. Information Technology Act, 2000 (India)
6. Solid Waste Management Rules, 2016 (India)
7. Personal Data Protection Bill (Draft)

**Technical Documentation:**
8. Google Maps Platform Documentation
9. Twilio SMS API Documentation
10. PostgreSQL 13 Documentation
11. React.js Documentation

**Research Papers:**
12. "Informal Recycling Networks in Urban India" - Relevant academic research
13. "Machine Learning in Resource-Constrained Environments"
14. "Ethical AI in Development Economics"

### 1.6 Document Organization

This SRS is structured into 16 major sections:

**Sections 1-2 (Introduction and Context):**
- Document purpose and scope
- Product description and user roles
- Operating environment

**Section 3 (Architecture):**
- Design philosophy and principles
- System architecture overview
- Component interactions

**Section 4 (Functional Requirements):**
- Detailed requirements for all three user interfaces
- Use cases and workflows
- Business logic specifications

**Section 5 (Core Intelligence Module):**
- Learning-based assignment engine (primary academic contribution)
- Algorithm specification
- Performance validation approach

**Sections 6-7 (Non-Functional Requirements and Interfaces):**
- Performance, security, usability requirements
- External system integrations
- API specifications

**Sections 8-10 (Data, Security, Quality):**
- Data models and relationships
- Security measures and compliance
- Quality attributes

**Sections 11-16 (Implementation and Validation):**
- Constraints and assumptions
- Testing approach
- Deployment strategy
- Future roadmap
- Acceptance criteria

---

## 2. Overall Description

### 2.1 Product Perspective

The Waste Coordination & Recycling Management System operates within India's informal recycling ecosystem, which processes an estimated 20-30% of urban waste through unorganized networks of Kabadiwalas. The system does not replace this ecosystem but rather digitizes and optimizes it.

#### 2.1.1 System Context Diagram

```
                    ┌──────────────────┐
                    │   Citizens       │
                    │ (Households)     │
                    └────────┬─────────┘
                             │ Web Browser
                             ↓
         ┌───────────────────────────────────────┐
         │   WASTE MANAGEMENT PLATFORM           │
         │                                       │
         │  ┌─────────────────────────────────┐ │
         │  │   Presentation Layer            │ │
         │  │  - Citizen Interface            │ │
         │  │  - Kabadiwala Interface         │ │
         │  │  - Admin Dashboard              │ │
         │  └──────────┬──────────────────────┘ │
         │             │                         │
         │  ┌──────────┴──────────────────────┐ │
         │  │   Business Logic Layer          │ │
         │  │  - Authentication Service       │ │
         │  │  - Pickup Management           │ │
         │  │  - Assignment Engine (ML)      │ │
         │  │  - Payment Tracking            │ │
         │  │  - Policy Engine               │ │
         │  └──────────┬──────────────────────┘ │
         │             │                         │
         │  ┌──────────┴──────────────────────┐ │
         │  │   Data Layer                    │ │
         │  │  - PostgreSQL Database          │ │
         │  │  - Redis Cache                  │ │
         │  │  - Cloud File Storage           │ │
         │  └─────────────────────────────────┘ │
         └───────┬───────────────┬───────────────┘
                 │               │
                 ↓               ↓
       ┌─────────────────┐  ┌──────────────┐
       │  External APIs  │  │ Kabadiwalas  │
       │  - Maps         │  │ (Workers)    │
       │  - SMS Gateway  │  └──────────────┘
       └─────────────────┘
```

#### 2.1.2 System Boundaries

**What the System Does:**
- Facilitates request submission and tracking
- Intelligently assigns pickups to Kabadiwalas
- Provides real-time status updates
- Tracks payments and earnings
- Learns from outcomes to improve assignments
- Generates performance analytics

**What the System Does NOT Do:**
- Process payments (payments via external UPI)
- Physically collect or transport waste
- Determine scrap material quality
- Set scrap market prices (admin-configured)
- Provide transportation for Kabadiwalas

#### 2.1.3 User Environment

The system operates in the context of:

**Geographic Context:**
- Urban and semi-urban areas in India
- Localities with existing informal recycling networks
- Areas with mobile internet coverage

**Socio-Economic Context:**
- Mixed-income residential areas
- Informal economy integration
- Low to medium digital literacy
- Price-sensitive users
- Trust-building required

**Technical Context:**
- Predominant Android smartphones
- Intermittent internet connectivity
- Limited device storage
- Variable network speeds (3G/4G)

### 2.2 Product Functions Summary

#### 2.2.1 Core User Functions

**For Citizens:**
1. **Account Management**
   - Register with phone number
   - Login via OTP
   - Manage profile and preferences
   - View pickup and payment history

2. **Pickup Scheduling**
   - Select waste categories
   - View current scrap rates
   - Choose pickup date and time
   - Provide special instructions
   - Submit pickup request

3. **Pickup Tracking**
   - View real-time pickup status
   - Track Kabadiwala location
   - Receive ETA updates
   - Contact assigned Kabadiwala
   - Report issues

4. **Payment Management**
   - View calculated payment amount
   - Enter UPI transaction reference
   - View payment history
   - Track total earnings from recycling

**For Kabadiwalas:**
1. **Account Management**
   - Register with verification
   - Login via OTP
   - Manage availability status
   - View performance metrics

2. **Assignment Management**
   - View daily assigned pickups
   - Accept/reject assignments
   - Access pickup details
   - Get navigation assistance
   - View suggested route order

3. **Pickup Execution**
   - Mark pickup as started
   - Navigate to location
   - Complete pickup with weight entry
   - Upload completion photo
   - Report issues if unable to complete

4. **Earnings Tracking**
   - View daily earnings
   - Access historical earnings data
   - See performance statistics
   - Track citizen ratings

**For Administrators:**
1. **User Management**
   - Approve Kabadiwala registrations
   - Manage user accounts
   - Handle complaints and issues
   - View user activity

2. **Policy Configuration**
   - Set scrap rates
   - Define service zones
   - Configure assignment parameters
   - Adjust business rules

3. **Operations Management**
   - Monitor active pickups
   - Manually assign/reassign pickups
   - Resolve failed assignments
   - Handle escalations

4. **Analytics and Reporting**
   - View system performance metrics
   - Monitor learning algorithm effectiveness
   - Generate custom reports
   - Export data for analysis

#### 2.2.2 System Functions

**Intelligent Assignment:**
- Calculate assignment scores for available Kabadiwalas
- Apply factor weights (distance, workload, reliability)
- Select optimal Kabadiwala
- Handle rejection and reassignment
- Learn from outcomes to improve future assignments

**Real-Time Tracking:**
- Update pickup status throughout lifecycle
- Track Kabadiwala location (when available)
- Calculate and update ETAs
- Send notifications on status changes

**Payment Calculation:**
- Apply current scrap rates
- Calculate payment per category
- Sum total payment amount
- Track payment status

**Performance Analytics:**
- Track completion rates
- Calculate delay metrics
- Monitor income distribution
- Measure learning algorithm improvement
- Generate impact reports

### 2.3 User Classes and Characteristics

#### 2.3.1 Citizen Users

**Demographics:**
- **Age Range:** 18-65 years
- **Location:** Urban households in serviceable localities
- **Income Level:** Mixed (middle to upper-middle class predominantly)
- **Education:** Varied (literacy required for using smartphone)

**Technical Profile:**
- **Device:** Primarily Android smartphones
- **Internet:** WiFi at home, mobile data on-the-go
- **Technical Expertise:** Low to Medium
  - Can use basic smartphone apps
  - Familiar with OTP login
  - May need guidance for advanced features

**Usage Pattern:**
- **Frequency:** 1-4 times per month
- **Session Duration:** 5-10 minutes
- **Peak Times:** Weekends, mornings
- **Primary Device:** Mobile phone

**Needs and Goals:**
- **Primary:** Convenient, reliable waste disposal
- **Secondary:** Fair pricing, transparency
- **Pain Points:** 
  - Current Kabadiwalas unreliable
  - Lack of price transparency
  - No tracking or accountability

**Behavioral Characteristics:**
- Price-conscious but value convenience
- Prefer minimal effort interactions
- Appreciate transparency and reliability
- Willing to try new digital services
- May be skeptical initially (trust-building needed)

#### 2.3.2 Kabadiwala Users

**Demographics:**
- **Age Range:** 20-60 years
- **Location:** Urban and semi-urban areas
- **Income Level:** Low to low-middle income
- **Education:** Varied (may have limited formal education)
- **Language:** Predominantly Hindi, regional languages

**Technical Profile:**
- **Device:** Basic to mid-range Android smartphones
- **Internet:** Primarily mobile data (prepaid)
- **Technical Expertise:** Low
  - Limited smartphone experience
  - May struggle with complex interfaces
  - Need simple, icon-based navigation
  - Prefer voice/visual guidance

**Usage Pattern:**
- **Frequency:** Daily, multiple times
- **Session Duration:** Throughout working day (8-10 hours)
- **Peak Times:** Morning to evening (8 AM - 7 PM)
- **Connectivity:** Often intermittent (data constraints)

**Needs and Goals:**
- **Primary:** Maximize daily earnings
- **Secondary:** Optimize routes, reduce travel time
- **Pain Points:**
  - Income unpredictability
  - Inefficient routing
  - Citizen availability uncertainty
  - No formal job security

**Behavioral Characteristics:**
- Highly motivated to complete pickups (livelihood)
- Value fairness in work distribution
- Prefer face-to-face interactions
- May be wary of digital platforms initially
- Need assurance of steady income
- Appreciate recognition and respect

**Special Considerations:**
- Interface must be extremely simple
- Minimize text, maximize icons/visual cues
- Provide Hindi language support
- Design for low-bandwidth scenarios
- Offline capability for critical functions
- Voice guidance where possible (future)

#### 2.3.3 Administrator Users

**Demographics:**
- **Age Range:** 25-50 years
- **Role:** System operators, managers, support staff
- **Location:** Office environment
- **Education:** Graduate level, technical aptitude

**Technical Profile:**
- **Device:** Desktop/laptop computers, tablets
- **Internet:** High-speed, reliable connection
- **Technical Expertise:** Medium to High
  - Comfortable with web applications
  - Can interpret data and analytics
  - Understand system configuration
  - Capable of troubleshooting

**Usage Pattern:**
- **Frequency:** Daily, extended sessions
- **Session Duration:** Multiple hours
- **Primary Tasks:** 
  - Monitoring system performance
  - Resolving issues
  - Configuring policies
  - Generating reports

**Needs and Goals:**
- **Primary:** Efficient system operation
- **Secondary:** Data-driven decision making
- **Requirements:**
  - Comprehensive dashboard
  - Real-time monitoring
  - Alert mechanisms
  - Detailed analytics
  - Manual override capability

**Behavioral Characteristics:**
- Data-driven decision making
- Need for control and visibility
- Appreciate automation but want oversight
- Require clear documentation
- Value efficiency tools

### 2.4 Operating Environment

#### 2.4.1 Client-Side Environment

**Supported Web Browsers:**

| Browser | Minimum Version | Platform | Priority |
|---------|----------------|----------|----------|
| Google Chrome | 90+ | Android, Desktop | High |
| Mozilla Firefox | 88+ | Desktop | Medium |
| Microsoft Edge | 90+ | Desktop | Medium |
| Safari | 14+ | iOS, macOS | Medium |
| Samsung Internet | 14+ | Android | High |

**Device Requirements:**

**Smartphones (Primary):**
- Operating System: Android 8.0+ or iOS 13+
- Screen Size: Minimum 320px width (5" display)
- RAM: Minimum 2GB
- Storage: 50MB for cached data
- Camera: For uploading photos (optional)
- GPS: For location services (optional but recommended)

**Tablets:**
- Operating System: Android 8.0+ or iOS 13+
- Screen Size: 7" or larger
- Similar specs as smartphones

**Desktop Computers (Admin primarily):**
- Operating System: Windows 10+, macOS 10.14+, or Linux
- Screen Resolution: Minimum 1280x720
- Modern web browser

**Network Requirements:**
- **Minimum:** 3G connectivity (≈384 Kbps)
- **Recommended:** 4G/LTE or WiFi
- **Data Usage:** ~5-10 MB per day (typical usage)
- **Offline Capability:** Critical functions cached locally

**Browser Features Required:**
- JavaScript enabled
- Cookies and local storage enabled
- Geolocation API (optional, for enhanced features)
- Camera access (for photo uploads)

#### 2.4.2 Server-Side Environment

**Infrastructure:**
- **Hosting:** Cloud infrastructure (AWS, Azure, or GCP)
- **Architecture:** Microservices with API gateway
- **Scalability:** Auto-scaling enabled
- **Availability:** Multi-AZ deployment for high availability

**Application Server:**
- **Platform:** Node.js 16+ / Python 3.9+ / Java 11+
- **Framework:** Express.js / Django / Spring Boot
- **Containerization:** Docker containers
- **Orchestration:** Kubernetes (for production scaling)

**Database:**
- **Primary:** PostgreSQL 13+
- **Purpose:** Transactional data, user profiles, pickup records
- **Configuration:** 
  - Master-slave replication
  - Automated backups (daily)
  - Point-in-time recovery enabled

**Caching Layer:**
- **Technology:** Redis 6+
- **Purpose:** 
  - Session management
  - Frequently accessed data (scrap rates, localities)
  - Rate limiting
- **Configuration:** Cluster mode for high availability

**File Storage:**
- **Service:** AWS S3 / Google Cloud Storage / Azure Blob
- **Purpose:** User photos, document uploads, export files
- **Configuration:** 
  - CDN integration for fast delivery
  - Lifecycle policies for cost optimization
  - Versioning enabled

**Load Balancer:**
- Application Load Balancer (ALB)
- SSL/TLS termination
- Health check monitoring
- Auto-scaling integration

**Monitoring and Logging:**
- **Application Monitoring:** New Relic / Datadog
- **Log Aggregation:** ELK Stack (Elasticsearch, Logstash, Kibana)
- **Uptime Monitoring:** Pingdom / StatusCake
- **Alerting:** PagerDuty / Opsgenie

#### 2.4.3 Third-Party Services

**Map Services:**
- **Provider:** Google Maps Platform (or Mapbox/OpenStreetMap)
- **APIs Used:**
  - Maps JavaScript API (map display)
  - Geocoding API (address to coordinates)
  - Distance Matrix API (distance calculation)
  - Directions API (route guidance)
- **Usage Limits:** Monitored to stay within free tier initially

**SMS Gateway:**
- **Provider:** Twilio / MSG91 / AWS SNS
- **Purpose:** OTP delivery, critical notifications
- **Volume:** ~1000-5000 SMS/day initially
- **Backup:** Secondary provider for failover

**Email Service (Optional):**
- **Provider:** SendGrid / AWS SES
- **Purpose:** Weekly summaries, admin alerts
- **Volume:** ~500-1000 emails/day

**Analytics:**
- **Google Analytics:** User behavior tracking
- **Custom Analytics:** In-app event tracking

#### 2.4.4 Development Environment

**Version Control:**
- Git with GitHub/GitLab/Bitbucket
- Branching strategy: Git Flow

**CI/CD Pipeline:**
- GitHub Actions / Jenkins / CircleCI
- Automated testing on commits
- Automated deployment to staging
- Manual approval for production

**Testing Environments:**
- **Development:** Local development machines
- **Staging:** Cloud environment (mirrors production)
- **Production:** Live environment

**Development Tools:**
- **IDE:** VS Code, IntelliJ IDEA, PyCharm
- **API Testing:** Postman, Insomnia
- **Database Tools:** pgAdmin, DBeaver
- **Monitoring:** Browser DevTools, React DevTools

### 2.5 Design and Implementation Constraints

#### 2.5.1 Technology Constraints

**1. Web-Only Implementation (MVP)**
- **Constraint:** No native mobile applications in initial release
- **Rationale:** 
  - Faster development and deployment
  - Single codebase for all platforms
  - Lower development and maintenance cost
  - Easier updates and bug fixes
- **Implications:**
  - Limited offline capability (compared to native apps)
  - May have slight performance trade-offs
  - No access to all device features
- **Mitigation:**
  - Progressive Web App (PWA) techniques
  - Service workers for offline support
  - Responsive design optimized for mobile

**2. Manual Data Entry**
- **Constraint:** No automated weight measurement in MVP
- **Rationale:**
  - Hardware cost and complexity
  - Accessibility for all Kabadiwalas
  - Focus on core coordination problem first
- **Implications:**
  - Reliance on manual weight entry by Kabadiwalas
  - Potential for entry errors
  - Need for validation and reasonableness checks
- **Mitigation:**
  - Input validation (reasonable ranges)
  - Audit trails
  - Citizen confirmation of weights
  - Future hardware integration path

**3. Limited Waste Categories**
- **Constraint:** Only Plastic, Paper, and Metal supported
- **Rationale:**
  - These are most common recyclables in India
  - Simplifies initial rollout
  - Market pricing data readily available
- **Implications:**
  - Other categories (glass, e-waste) not handled
  - May not serve all citizen needs initially
- **Mitigation:**
  - Architecture supports easy addition of categories
  - Documented as future enhancement
  - User feedback collected for prioritization

**4. Browser Compatibility**
- **Constraint:** Support limited to browsers from last 2 years
- **Rationale:**
  - Modern JavaScript features required
  - Security considerations
  - Development effort vs. user base
- **Implications:**
  - Users with older devices may face issues
  - Need clear messaging about requirements
- **Mitigation:**
  - Graceful degradation where possible
  - Browser detection and user notification
  - Polyfills for critical features

#### 2.5.2 Business and Regulatory Constraints

**1. No Direct Payment Processing**
- **Constraint:** System does not process payments directly
- **Rationale:**
  - Regulatory compliance complexity (RBI regulations)
  - PCI DSS certification requirements
  - Focus on core coordination, not fintech
- **Implications:**
  - Payments handled via UPI outside platform
  - System only tracks payment status
  - Trust-based confirmation
- **Mitigation:**
  - Integration with UPI for tracking (future)
  - Clear payment protocol
  - Dispute resolution process

**2. Service Hours Limitation**
- **Constraint:** Pickups only during daylight hours (8 AM - 7 PM)
- **Rationale:**
  - Safety for Kabadiwalas
  - Citizen availability
  - Cultural norms in India
- **Implications:**
  - Cannot serve shift workers or night-time requests
  - Reduces available pickup slots
- **Mitigation:**
  - Clear communication of service hours
  - Next-day scheduling for off-hour requests

**3. Geographic Limitation (Initial)**
- **Constraint:** India-specific implementation initially
- **Rationale:**
  - Deep understanding of Indian informal economy
  - Specific UPI, language, cultural context
  - Regulatory compliance focused on India
- **Implications:**
  - Not immediately applicable to other countries
  - India-specific pricing, units, regulations
- **Mitigation:**
  - Architecture designed for internationalization
  - Configuration-driven localization
  - Documented adaptation requirements

**4. Data Privacy Compliance**
- **Constraint:** Must comply with Indian data protection laws
- **Rationale:**
  - Legal requirement
  - User trust and ethical responsibility
- **Implications:**
  - Data collection limited to necessary fields
  - User consent required
  - Data retention and deletion policies
  - Export and portability features
- **Mitigation:**
  - Privacy-by-design approach
  - Regular compliance audits
  - Clear privacy policy
  - User data control features

#### 2.5.3 Domain-Specific Constraints

**1. Informal Economy Integration**
- **Constraint:** System must accommodate unstructured work patterns
- **Challenges:**
  - Kabadiwalas have no fixed schedules
  - May use multiple platforms or traditional methods
  - Income depends on multiple factors beyond platform
- **Implications:**
  - Cannot mandate exclusivity
  - Must account for variable availability
  - Reliability scoring may be noisy
- **Mitigation:**
  - Flexible availability settings
  - No penalty for non-platform work
  - Robust reliability metric design

**2. Low Digital Literacy**
- **Constraint:** Many users have limited tech experience
- **Challenges:**
  - Kabadiwalas may struggle with complex UI
  - Citizens may be unfamiliar with tracking features
  - Training and support needs
- **Implications:**
  - Interface must be extremely simple
  - Heavy reliance on visual design
  - May need offline training/support
- **Mitigation:**
  - Extensive usability testing with target users
  - Simple, icon-based interfaces
  - In-app help and tooltips
  - Video tutorials (future)
  - Community support model

**3. Pricing Volatility**
- **Constraint:** Scrap prices fluctuate daily based on market
- **Challenges:**
  - Citizens expect current fair rates
  - Kabadiwalas' earnings affected by price changes
  - Need frequent rate updates
- **Implications:**
  - Admin must update rates regularly
  - System must handle rate changes gracefully
  - Historical pricing data needed
- **Mitigation:**
  - Daily rate review process
  - Automated rate alerts for admins
  - Pickup requests show rates at time of request
  - Rate history preserved

**4. Trust and Adoption**
- **Constraint:** Digital platforms face skepticism in informal sector
- **Challenges:**
  - Citizens may not trust Kabadiwalas from app
  - Kabadiwalas may prefer known territories
  - Both sides accustomed to cash transactions
- **Implications:**
  - Slow adoption initially
  - Need for trust-building features
  - Hybrid (digital + traditional) approaches
- **Mitigation:**
  - Ratings and reviews system
  - Transparent pricing
  - Option to request familiar Kabadiwalas
  - Community outreach and education

#### 2.5.4 Resource and Timeline Constraints

**1. Development Timeline**
- **Constraint:** MVP to be completed in 4-6 months
- **Implications:**
  - Feature prioritization critical
  - May defer nice-to-have features
  - Focus on core functionality
- **Mitigation:**
  - Agile development methodology
  - Regular sprint planning and reviews
  - Feature flags for gradual rollout

**2. Budget Constraints**
- **Constraint:** Limited budget for MVP phase
- **Implications:**
  - Cannot afford expensive enterprise tools initially
  - Limited infrastructure budget
  - Small core team
- **Mitigation:**
  - Use open-source technologies where possible
  - Cloud free tiers and startup credits
  - Outsource non-core functions if needed
  - Auto-scaling to control costs

**3. Team Size and Expertise**
- **Constraint:** Small, multidisciplinary team
- **Implications:**
  - Team members wear multiple hats
  - Limited domain expertise initially
  - Knowledge transfer critical
- **Mitigation:**
  - Comprehensive documentation
  - Code reviews and pair programming
  - Consultant engagement for specialized needs
  - Continuous learning and upskilling

### 2.6 Assumptions and Dependencies

#### 2.6.1 User Assumptions

**About Citizens:**
1. **Device Ownership:** Citizens have access to smartphones with web browsers
2. **Internet Access:** Citizens have intermittent to regular internet connectivity
3. **Basic Literacy:** Citizens can read and understand English or Hindi at basic level
4. **Phone Number:** Citizens have active Indian mobile phone numbers
5. **UPI Awareness:** Citizens are familiar with UPI payment system
6. **Availability:** Citizens are available during scheduled pickup windows
7. **Accurate Information:** Citizens provide accurate addresses and waste estimates
8. **Cooperation:** Citizens will cooperate with Kabadiwalas during pickups

**About Kabadiwalas:**
1. **Device Ownership:** Kabadiwalas own or have access to Android smartphones
2. **Data Connectivity:** Kabadiwalas have prepaid mobile data plans
3. **Basic Tech Skills:** Kabadiwalas can operate basic smartphone functions
4. **Navigation Ability:** Kabadiwalas can follow map-based directions or ask for help
5. **Weighing Equipment:** Kabadiwalas have access to weighing scales (portable/fixed)
6. **Availability:** Kabadiwalas are available during declared service hours
7. **Honesty:** Kabadiwalas report weights and payments accurately
8. **Commitment:** Kabadiwalas are motivated to complete assigned pickups

**About Administrators:**
1. **Technical Competence:** Admins have medium to high technical proficiency
2. **Time Availability:** Admins can monitor system regularly during work hours
3. **Decision Authority:** Admins have authority to configure policies and resolve issues
4. **Market Knowledge:** Admins understand scrap market pricing dynamics

#### 2.6.2 Operational Assumptions

**Market Conditions:**
1. **Scrap Market Stability:** Scrap prices fluctuate within reasonable ranges
2. **Demand:** Sufficient demand for recycling services in target localities
3. **Supply:** Adequate Kabadiwalas willing to participate in platform
4. **Competition:** No significant competitive platforms in initial target area (or differentiation strategy)

**Data Quality:**
1. **Initial Data Sparsity:** First 30-60 days will have limited pickup data
2. **Data Noise:** Manual data entry will have some errors (~5-10% error rate acceptable)
3. **Incomplete Data:** Not all fields will be filled completely by users initially
4. **Data Validity:** User-provided data is generally truthful (with some exceptions)

**Adoption and Growth:**
1. **Gradual Adoption:** User base will grow gradually, not exponentially initially
2. **Retention:** Reasonable user retention rate (>60% month-over-month)
3. **Network Effects:** Platform becomes more valuable as more users join
4. **Word of Mouth:** Primary growth driver will be user referrals

**Learning Algorithm:**
1. **Convergence:** Learning algorithm will converge to better weights over 8-12 weeks
2. **Performance Improvement:** At least 10-15% improvement in assignment success rate achievable
3. **Sufficient Data:** Minimum 100-200 pickups needed for reliable learning signal
4. **Outcome Quality:** Pickup outcomes (success/failure) are accurately captured

#### 2.6.3 Technical Dependencies

**Third-Party Services:**
1. **Map Services (Google Maps / OpenStreetMap):**
   - Service availability: 99.9%+
   - API rate limits sufficient for usage
   - Pricing remains within budget
   - Alternative providers available if needed

2. **SMS Gateway (Twilio / MSG91):**
   - Reliable message delivery (>95%)
   - India coverage comprehensive
   - Cost per SMS remains reasonable
   - Backup provider available

3. **Cloud Infrastructure (AWS / Azure / GCP):**
   - High availability and reliability
   - Auto-scaling works as expected
   - Pricing predictable
   - Technical support available

4. **Email Service (SendGrid / AWS SES):**
   - Delivery rate >98%
   - Spam filtering doesn't block transactional emails
   - Cost within budget

**Technology Stack:**
1. **JavaScript/Node.js Ecosystem:**
   - Libraries and frameworks remain maintained
   - Security vulnerabilities patched promptly
   - Community support continues
   - Breaking changes are manageable

2. **Database (PostgreSQL):**
   - Performance scales to expected load
   - Backup and recovery work reliably
   - Replication setup functions correctly
   - Extensions (PostGIS for geospatial) available

3. **Frontend Framework (React):**
   - Browser compatibility maintained
   - Performance acceptable on target devices
   - Security issues addressed
   - Ecosystem tools available

**External Factors:**
1. **Internet Connectivity:**
   - 3G/4G coverage in target areas
   - Network quality sufficient for real-time features
   - Data costs affordable for users
   - WiFi available for most citizens

2. **Regulatory Environment:**
   - No adverse changes to data protection laws
   - Informal sector operations remain legal
   - UPI system continues to operate freely
   - No new regulations prohibit platform operations

3. **Device Ecosystem:**
   - Android continues to dominate Indian market
   - Device specifications continue to improve
   - Browser updates don't break functionality
   - Users upgrade devices reasonably (every 2-3 years)

#### 2.6.4 Business and Organizational Dependencies

**Stakeholder Support:**
1. **Management Buy-In:** Continued support from project sponsors
2. **Funding:** Sufficient funding for MVP development and initial operations
3. **Team Stability:** Core team remains intact through MVP phase
4. **Partner Cooperation:** Collaboration from RWAs, community organizations

**Operational Support:**
1. **Admin Availability:** Admins available to configure and monitor system daily
2. **Customer Support:** Basic support infrastructure in place for user queries
3. **Training Resources:** Materials and personnel for user onboarding
4. **Issue Resolution:** Process for handling complaints and disputes

**External Partnerships:**
1. **No Vendor Lock-in:** Ability to switch third-party providers if needed
2. **Community Engagement:** RWAs and local organizations willing to promote platform
3. **Scrap Dealers:** Existing scrap market infrastructure remains accessible to Kabadiwalas
4. **Government:** No regulatory barriers to platform operation

#### 2.6.5 Risk Mitigation for Dependencies

**For Critical Dependencies:**

1. **Map Services Dependency:**
   - **Risk:** Provider changes pricing or terms
   - **Mitigation:** 
     - Design abstraction layer for map services
     - Evaluate alternative providers (OpenStreetMap, Mapbox)
     - Cache map data where possible

2. **SMS Gateway Dependency:**
   - **Risk:** Service outage or delivery failures
   - **Mitigation:**
     - Implement fallback to secondary SMS provider
     - Monitor delivery rates closely
     - Consider alternative auth methods (email backup)

3. **Cloud Infrastructure Dependency:**
   - **Risk:** Vendor lock-in, pricing changes, outages
   - **Mitigation:**
     - Use infrastructure-as-code (Terraform) for portability
     - Multi-region deployment for redundancy
     - Regular backup and disaster recovery drills

4. **Kabadiwala Participation:**
   - **Risk:** Insufficient Kabadiwalas join platform
   - **Mitigation:**
     - Direct outreach and onboarding campaigns
     - Incentive programs for early adopters
     - Partnership with existing Kabadiwala networks
     - Hybrid model allowing both platform and traditional work

5. **User Adoption:**
   - **Risk:** Citizens don't adopt platform
   - **Mitigation:**
     - Community engagement and awareness campaigns
     - Partnership with RWAs for endorsement
     - Referral incentives
     - Demonstration of value (transparency, convenience)

6. **Learning Data Quality:**
   - **Risk:** Insufficient or poor-quality data for learning algorithm
   - **Mitigation:**
     - Design algorithm to handle noise
     - Manual data validation for critical cases
     - Gradual transition from rule-based to learned weights
     - Fallback to deterministic rules if learning fails

**Assumption Validation Plan:**

- Monthly review of key assumptions
- User surveys to validate behavioral assumptions
- Data analysis to check operational assumptions
- Technical monitoring to verify infrastructure assumptions
- Adjustment of strategy based on assumption violations

---

## 3. System Architecture

### 3.1 Architectural Design Philosophy

The system architecture is guided by three core principles that balance innovation with pragmatism:

#### 3.1.1 Human-Centered Automation

**Philosophy:** Technology augments human decision-making rather than replacing it.

**Rationale:**
The informal recycling ecosystem depends on human relationships, trust, and flexibility. Full automation would:
- Erode trust and agency of Kabadiwalas
- Remove critical human judgment from complex situations
- Create black-box decisions in contexts requiring transparency
- Risk encoding and amplifying existing biases

**Implementation:**
- **ONE learning component:** Pickup assignment engine (bounded, explainable)
- **All other logic:** Rule-based and deterministic
- **Human oversight:** Admins can view, understand, and override all decisions
- **Transparency:** Users understand why decisions were made

**Example:**
Instead of automatically canceling pickups that Kabadiwalas haven't accepted, the system:
1. Sends reminders
2. Escalates to admin after timeout
3. Admin reviews context (maybe Kabadiwala had emergency)
4. Admin decides whether to reassign or wait

**Benefits:**
- Maintains dignity and agency of informal workers
- Builds trust through transparency
- Allows for exceptional circumstances
- Reduces risk of algorithmic harm

---

#### 3.1.2 Incremental Intelligence

**Philosophy:** Introduce learning gradually, with one bounded component, not wholesale AI transformation.

**Rationale:**
Complex AI systems in informal economies risk:
- Unpredictable behavior in corner cases
- Difficulty debugging and explaining failures
- Over-optimization for narrow metrics
- Inability to adapt to rapid context changes

**Implementation:**

**Learning Component (ONE):**
- **What:** Pickup assignment factor weights
- **How:** Feedback-driven gradient descent
- **Boundary:** Only adjusts 3 weights within constraints
- **Validation:** Performance compared to baseline rule-based system

**Deterministic Components (MANY):**
- Authentication and authorization
- Payment calculation
- Status lifecycle management
- Notification triggering
- Policy enforcement

**Why This Approach:**
1. **Explainability:** Easy to understand what system is learning and why
2. **Safety:** Failures are contained and reversible
3. **Validation:** Clear before/after comparison
4. **Scalability:** Can add more learning components later if successful
5. **Academic Value:** Isolates impact of learning for research

**Contrast with Alternative (Rejected) Approach:**
❌ End-to-end deep learning for all decisions
❌ Automated pricing based on demand prediction
❌ Fully autonomous routing and scheduling
❌ NLP-based customer service chatbots

These are intentionally deferred to preserve system stability and explainability.

---

#### 3.1.3 Progressive Disclosure

**Philosophy:** Reveal complexity gradually based on user expertise and needs.

**Design Principles:**

**Level 1: Essential (All Users)**
- Core task completion
- Minimal required information
- Simple, clear interface
- One primary action per screen

**Level 2: Advanced (Experienced Users)**
- Efficiency shortcuts
- Batch operations
- Historical data access
- Customization options

**Level 3: Expert (Administrators)**
- System configuration
- Performance analytics
- Manual overrides
- Data exports

**Examples:**

**Citizen Interface:**
- **Level 1:** "Schedule Pickup" - selects categories, date, submits
- **Level 2:** View detailed pickup history, set default preferences
- **Level 3:** (N/A for citizens in MVP)

**Kabadiwala Interface:**
- **Level 1:** Today's pickup list, complete pickup
- **Level 2:** Performance dashboard, earnings analytics, route optimization
- **Level 3:** (N/A for Kabadiwalas in MVP)

**Admin Interface:**
- **Level 1:** View active pickups, resolve basic issues
- **Level 2:** Configure rates and zones, manual assignment
- **Level 3:** Adjust learning parameters, export data, system configuration

**Implementation:**
- Collapsible sections for advanced features
- "Show More" / "Advanced Options" patterns
- Contextual help that appears when needed
- Separate tabs/pages for different complexity levels

---

### 3.2 High-Level Architecture

#### 3.2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                          │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│  │   Citizen    │  │  Kabadiwala   │  │   Admin           │   │
│  │   Web App    │  │   Web App     │  │   Dashboard       │   │
│  │  (React)     │  │   (React)     │  │   (React)         │   │
│  └──────┬───────┘  └───────┬───────┘  └────────┬──────────┘   │
└─────────┼──────────────────┼───────────────────┼──────────────┘
          │                  │                   │
          └──────────────────┴───────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Route requests to services                            │  │
│  │  - Authentication & authorization                        │  │
│  │  - Rate limiting                                          │  │
│  │  - Request/response logging                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
┌──────────────────────────────────────────────────────────────────┐
│                   APPLICATION SERVICES LAYER                      │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Auth Service   │  │ Pickup Service  │  │ Payment Service │ │
│  │  - OTP gen/val  │  │ - CRUD          │  │ - Calculation   │ │
│  │  - JWT tokens   │  │ - Status mgmt   │  │ - Tracking      │ │
│  │  - Session mgmt │  │ - Tracking      │  │ - History       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │Location Service │  │  Policy Engine  │  │ Notification    │ │
│  │ - Geocoding     │  │ - Rate mgmt     │  │ Service         │ │
│  │ - Distance calc │  │ - Zone config   │  │ - SMS           │ │
│  │ - Zone check    │  │ - Rules         │  │ - In-app        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🧠 ASSIGNMENT ENGINE (Learning Component)               │   │
│  │  - Factor scoring (distance, workload, reliability)      │   │
│  │  - Weight optimization via feedback loop                 │   │
│  │  - Performance tracking                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  User Service   │  │Analytics Service│  │  Admin Service  │ │
│  │  - Profile mgmt │  │ - Metrics       │  │ - Config        │ │
│  │  - Preferences  │  │ - Reports       │  │ - Monitoring    │ │
│  │  - History      │  │ - Dashboards    │  │ - Overrides     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└───────────────────────────────┬───────────────────────────────────┘
                                │
          ┌─────────────────────┼────────────────────┐
          │                     │                    │
          ▼                     ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                 │
│                                                                   │
│  ┌─────────────────────────┐  ┌────────────────────────────┐    │
│  │  PostgreSQL Database    │  │   Redis Cache              │    │
│  │  - User profiles        │  │   - Session data           │    │
│  │  - Pickups              │  │   - Rate limiting          │    │
│  │  - Assignments          │  │   - Scrap rates (cache)    │    │
│  │  - Payments             │  │   - Frequently accessed    │    │
│  │  - Learning feedback    │  │     data                   │    │
│  │  - Localities           │  │                            │    │
│  └─────────────────────────┘  └────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────┐  ┌────────────────────────────┐    │
│  │  File Storage (S3)      │  │   Time-Series DB           │    │
│  │  - User photos          │  │   (InfluxDB/TimescaleDB)   │    │
│  │  - Completion photos    │  │   - Performance metrics    │    │
│  │  - Documents            │  │   - Location tracking      │    │
│  │  - Exports              │  │   - System logs            │    │
│  └─────────────────────────┘  └────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                               │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Maps API    │  │  SMS Gateway │  │  Email Service       │  │
│  │  (Google)    │  │  (Twilio)    │  │  (SendGrid)          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

#### 3.2.2 Component Descriptions

**Presentation Layer:**
- Three separate React applications (can be built from same codebase)
- Responsive design using Tailwind CSS / Material-UI
- State management: Redux / Context API
- Client-side routing: React Router

**API Gateway:**
- Single entry point for all client requests
- Handles cross-cutting concerns (auth, logging, rate limiting)
- Technology: Express.js / Kong / AWS API Gateway
- SSL/TLS termination

**Application Services:**
- Microservices architecture (or modular monolith for MVP simplicity)
- RESTful APIs
- Each service owns its data domain
- Inter-service communication via HTTP/HTTPS or message queue

**Data Layer:**
- PostgreSQL: Primary data store
- Redis: Caching and session management
- S3: Object storage for files
- Time-Series DB: Optional, for detailed analytics

**External Services:**
- Integrated via HTTP APIs
- Abstraction layer to allow provider swapping
- Graceful degradation if services unavailable

---

### 3.3 Data Flow Architecture

#### 3.3.1 Pickup Request Flow (Typical Scenario)

```
1. CITIZEN CREATES PICKUP REQUEST
   ├─> Citizen fills form (categories, date, address)
   ├─> Clicks "Submit"
   ├─> Frontend validates inputs
   └─> POST /api/pickups
       │
       ▼
2. API GATEWAY
   ├─> Authenticates request (JWT token)
   ├─> Authorizes (role = citizen)
   ├─> Rate limit check
   └─> Routes to Pickup Service
       │
       ▼
3. PICKUP SERVICE
   ├─> Validates request data
   ├─> Checks service availability (locality active?)
   ├─> Creates pickup record (status = "requested")
   ├─> Saves to database
   └─> Triggers ASSIGNMENT ENGINE
       │
       ▼
4. ASSIGNMENT ENGINE 🧠
   ├─> Fetches available Kabadiwalas in locality
   ├─> For each Kabadiwala, calculates score:
   │   ├─> Distance score = 1 / (1 + distance_km)
   │   ├─> Workload score = (max - current) / max
   │   └─> Reliability score = historical performance
   ├─> Applies current factor weights
   ├─> Computes weighted sum
   ├─> Ranks Kabadiwalas by score
   ├─> Selects highest-scoring available Kabadiwala
   ├─> Creates Assignment record
   ├─> Updates pickup status = "assigned"
   └─> Saves assignment to database
       │
       ▼
5. NOTIFICATION SERVICE
   ├─> Triggered by new assignment
   ├─> Sends SMS to Kabadiwala: "New pickup assigned"
   ├─> Sends in-app notification to citizen: "Pickup assigned"
   └─> Logs notifications
       │
       ▼
6. RESPONSE TO CITIZEN
   ├─> Pickup Service returns pickup details
   ├─> Includes assigned Kabadiwala info
   ├─> Estimated arrival time
   └─> Frontend displays confirmation
       │
       ▼
7. KABADIWALA VIEWS ASSIGNMENT
   ├─> Kabadiwala opens app
   ├─> Fetch /api/assignments?kabadiwala_id=X&date=today
   ├─> Sees pickup in "Assigned" list
   └─> Can accept/reject or just start when ready
       │
       ▼
8. KABADIWALA STARTS PICKUP
   ├─> Clicks "Start Pickup"
   ├─> PUT /api/pickups/{id}/status (status = "on_the_way")
   ├─> Pickup Service updates status
   ├─> Notification sent to citizen
   └─> Optional: Location tracking begins
       │
       ▼
9. KABADIWALA COMPLETES PICKUP
   ├─> Arrives, collects scrap, weighs items
   ├─> Enters weights in app (plastic, paper, metal)
   ├─> Optionally uploads photo
   ├─> Clicks "Complete"
   ├─> POST /api/pickups/{id}/complete
   │   └─> Body: {weights, photo_url}
   ├─> Pickup Service:
   │   ├─> Creates Completion record
   │   ├─> Calls Payment Service to calculate amount
   │   ├─> Updates pickup status = "completed"
   │   └─> Logs feedback data for learning
   └─> Response confirms completion
       │
       ▼
10. PAYMENT CALCULATION
    ├─> Payment Service fetches current scrap rates
    ├─> Calculates: Σ (weight_i × rate_i)
    ├─> Creates Payment record (status = "pending")
    ├─> Returns payment amount
    └─> Displayed to both Kabadiwala and Citizen
       │
       ▼
11. CITIZEN MAKES PAYMENT (External to System)
    ├─> Citizen uses UPI to pay Kabadiwala
    ├─> Optionally enters UPI reference in app
    ├─> PUT /api/payments/{id}/confirm
    └─> Payment status = "completed"
       │
       ▼
12. LEARNING FEEDBACK LOOP
    ├─> ASYNC process (runs periodically)
    ├─> Fetches completed pickups from last 7 days
    ├─> Analyzes outcomes (success/delay/failure)
    ├─> Calculates outcome scores
    ├─> Adjusts factor weights via gradient descent
    ├─> Validates performance improvement
    ├─> If improved, updates weight configuration
    └─> Logs new weights (used for future assignments)
```

#### 3.3.2 Authentication Flow

```
1. LOGIN REQUEST
   Citizen/Kabadiwala → POST /api/auth/request-otp
   Body: {phone_number: "9876543210"}
   │
   ▼
2. OTP GENERATION
   Auth Service:
   ├─> Validates phone number format
   ├─> Checks rate limit (5 OTPs/hour per number)
   ├─> Generates 6-digit random OTP
   ├─> Hashes OTP (bcrypt)
   ├─> Stores in database with 5-min expiry
   └─> Calls SMS Service to send OTP
   │
   ▼
3. SMS DELIVERY
   SMS Service → Twilio API → User receives SMS
   │
   ▼
4. OTP VERIFICATION
   User → POST /api/auth/verify-otp
   Body: {phone_number, otp: "123456"}
   │
   ▼
5. VALIDATION & SESSION CREATION
   Auth Service:
   ├─> Fetches hashed OTP from database
   ├─> Compares with provided OTP (bcrypt.compare)
   ├─> If match:
   │   ├─> Fetches user profile
   │   ├─> Generates JWT token
   │   │   Payload: {user_id, role, locality_id}
   │   │   Expiry: 7 days
   │   ├─> Creates session record in database
   │   ├─> Invalidates OTP
   │   └─> Returns {token, user_profile}
   └─> If no match:
       └─> Increment failed attempts, return error
   │
   ▼
6. CLIENT STORES TOKEN
   Frontend stores JWT in localStorage
   Includes in Authorization header for future requests
   │
   ▼
7. AUTHENTICATED REQUESTS
   User → GET /api/pickups (with Authorization: Bearer <token>)
   │
   ▼
8. TOKEN VALIDATION (Every Request)
   API Gateway:
   ├─> Extracts token from header
   ├─> Verifies signature
   ├─> Checks expiry
   ├─> Validates session exists in database
   └─> If valid:
       ├─> Attaches user context to request
       └─> Forwards to service
   └─> If invalid:
       └─> Returns 401 Unauthorized
```

#### 3.3.3 Learning Loop Data Flow

```
PERIODIC TRIGGER (Every 7 days)
   │
   ▼
1. FETCH LEARNING DATA
   Learning Service:
   ├─> SELECT * FROM learning_feedback
   │   WHERE completed_at >= NOW() - INTERVAL '7 days'
   ├─> Retrieves:
   │   ├─> Assignment factors (distance, workload, reliability)
   │   ├─> Factor weights used at assignment time
   │   ├─> Outcomes (success/partial/failure)
   │   └─> Delay, ratings
   └─> Groups by outcome type
   │
   ▼
2. CALCULATE OUTCOME SCORES
   For each pickup:
   ├─> IF completed on-time AND rating >= 3.5: outcome_score = +1.0
   ├─> IF completed late OR rating < 3.5: outcome_score = +0.5
   └─> IF not completed: outcome_score = -1.0
   │
   ▼
3. AGGREGATE BY FACTOR
   For distance factor:
   ├─> High-distance assignments → avg outcome score
   ├─> Low-distance assignments → avg outcome score
   └─> Compare: which correlates with success?
   
   Repeat for workload and reliability factors
   │
   ▼
4. COMPUTE WEIGHT ADJUSTMENTS
   For each factor f:
   ├─> Δw_f = α × Σ(outcome_score_i × normalized_factor_value_i)
   │   where α = learning rate (0.05)
   ├─> w_f(new) = w_f(old) + Δw_f
   └─> Normalize so weights sum to 1.0
   │
   ▼
5. VALIDATE CONSTRAINTS
   ├─> Ensure w_distance >= 0.1 and <= 0.6
   ├─> Ensure w_workload >= 0.1 and <= 0.6
   ├─> Ensure w_reliability >= 0.1 and <= 0.6
   └─> Ensure Σ weights = 1.0
   │
   ▼
6. PERFORMANCE COMPARISON
   ├─> Calculate metrics with new weights (simulated)
   ├─> Compare to baseline:
   │   ├─> Assignment success rate
   │   ├─> Average delay
   │   └─> Income distribution fairness
   └─> IF performance improves by >= 5%:
       └─> Accept new weights
       ELSE:
       └─> Reject, keep current weights
   │
   ▼
7. SAVE NEW WEIGHTS
   IF accepted:
   ├─> INSERT INTO weight_configuration
   │   (distance, workload, reliability, effective_from)
   ├─> Log performance metrics
   └─> Future assignments use new weights
   │
   ▼
8. NOTIFY ADMIN
   ├─> Send in-app notification:
   │   "Learning algorithm updated weights. Performance improved by X%"
   └─> Admin can review changes in dashboard
```

---

### 3.4 Technology Stack

#### 3.4.1 Frontend Technologies

**Framework:**
- **React 18+**
  - Component-based architecture
  - Hooks for state management
  - Virtual DOM for performance
  - Large ecosystem and community

**UI Library:**
- **Material-UI (MUI)** or **Tailwind CSS + Headless UI**
  - Pre-built responsive components
  - Mobile-first design system
  - Accessibility built-in
  - Customizable theming

**State Management:**
- **React Context API** (simple state)
- **Redux Toolkit** (complex state, if needed)
  - Predictable state management
  - Dev tools for debugging
  - Middleware for async actions

**Routing:**
- **React Router v6**
  - Client-side routing
  - Nested routes
  - Lazy loading

**API Communication:**
- **Axios** or **React Query**
  - HTTP client
  - Request/response interceptors
  - Automatic retries
  - Caching (React Query)

**Maps Integration:**
- **React Google Maps** or **Leaflet (OpenStreetMap)**
  - Map display components
  - Marker and route rendering
  - Geolocation support

**Form Handling:**
- **Formik** or **React Hook Form**
  - Form validation
  - Error handling
  - State management for forms

**Internationalization:**
- **react-i18next**
  - Multi-language support
  - Dynamic language switching
  - Translation management

**Build Tools:**
- **Vite** or **Create React App**
  - Fast development server
  - Hot module replacement
  - Production bundling
  - Code splitting

**Testing:**
- **Jest** (unit tests)
- **React Testing Library** (component tests)
- **Cypress** (E2E tests)

#### 3.4.2 Backend Technologies

**Runtime:**
- **Node.js 18 LTS** (or Python 3.10+, Java 17)
  - Non-blocking I/O
  - JavaScript/TypeScript across stack
  - Rich package ecosystem (npm)

**Framework:**
- **Express.js** (Node.js)
  - Lightweight, flexible
  - Middleware architecture
  - Large community
- **Alternatives:** NestJS (TypeScript), Django (Python), Spring Boot (Java)

**API Style:**
- **RESTful APIs**
  - Stateless
  - Resource-based URLs
  - Standard HTTP methods (GET, POST, PUT, DELETE)
  - JSON data format

**Authentication:**
- **JWT (JSON Web Tokens)**
  - Stateless authentication
  - Signed tokens
  - Expiry handling

**ORM/Database Access:**
- **Prisma** (Node.js) or **TypeORM**
  - Type-safe database queries
  - Migrations
  - Schema management
- **Alternatives:** Sequelize (Node.js), SQLAlchemy (Python), Hibernate (Java)

**Validation:**
- **Joi** or **Zod** or **express-validator**
  - Request payload validation
  - Schema definition
  - Custom validators

**Background Jobs:**
- **Bull** (Redis-based queue)
  - Learning loop execution
  - Scheduled tasks (rate updates, notifications)
  - Job retries

**File Upload:**
- **Multer** (Node.js)
  - Multipart/form-data handling
  - File size limits
  - File type validation

**Logging:**
- **Winston** or **Pino**
  - Structured logging
  - Multiple transports (file, console, remote)
  - Log levels

**Monitoring:**
- **Prometheus** (metrics)
- **Grafana** (visualization)
- **Sentry** (error tracking)

#### 3.4.3 Database Technologies

**Primary Database:**
- **PostgreSQL 13+**
  - Relational database
  - ACID compliance
  - Geospatial support (PostGIS extension)
  - JSON/JSONB for semi-structured data
  - Full-text search
  - Excellent performance and scalability

**Caching:**
- **Redis 6+**
  - In-memory data store
  - Cache frequently accessed data (scrap rates, localities)
  - Session storage
  - Rate limiting (atomic counters)
  - Pub/Sub for real-time features

**Time-Series Data (Optional):**
- **TimescaleDB** (PostgreSQL extension) or **InfluxDB**
  - Pickup metrics over time
  - Learning algorithm performance tracking
  - Location tracking data
  - Optimized for time-based queries

**Object Storage:**
- **AWS S3** / **Google Cloud Storage** / **Azure Blob Storage**
  - User profile photos
  - Pickup completion photos
  - Document uploads (ID proofs)
  - Export files (CSVs, PDFs)
  - Scalable, durable
  - CDN integration

#### 3.4.4 DevOps and Infrastructure

**Containerization:**
- **Docker**
  - Application containerization
  - Consistent environments (dev/staging/prod)
  - Isolation

**Container Orchestration:**
- **Docker Compose** (development, small deployments)
- **Kubernetes** (production, large scale)
  - Auto-scaling
  - Load balancing
  - Self-healing

**Cloud Provider:**
- **AWS** / **Google Cloud Platform** / **Microsoft Azure**
  - Choice based on cost, region availability, team expertise
  - Suggested: AWS for rich ecosystem and market maturity

**CI/CD:**
- **GitHub Actions** / **GitLab CI** / **CircleCI**
  - Automated testing on every commit
  - Automated deployment to staging
  - Manual approval for production

**Infrastructure as Code:**
- **Terraform** or **AWS CloudFormation**
  - Version-controlled infrastructure
  - Reproducible deployments
  - Multi-environment management

**Web Server:**
- **Nginx** or **Apache**
  - Reverse proxy
  - Static file serving
  - SSL/TLS termination
  - Load balancing

**CDN:**
- **Cloudflare** / **AWS CloudFront**
  - Static asset delivery
  - Image optimization
  - DDoS protection
  - Edge caching

**Monitoring & Alerting:**
- **Prometheus + Grafana** (metrics and dashboards)
- **ELK Stack** (Elasticsearch, Logstash, Kibana) for log aggregation
- **PagerDuty** or **Opsgenie** for on-call alerting
- **New Relic** or **Datadog** (APM - Application Performance Monitoring)

**Backup and Disaster Recovery:**
- Automated database backups (daily full, hourly incremental)
- Multi-region backups for redundancy
- Tested disaster recovery procedures

#### 3.4.5 Third-Party Integrations

**Maps:**
- **Google Maps Platform**
  - Maps JavaScript API
  - Geocoding API
  - Distance Matrix API
  - Directions API
- **Alternative:** OpenStreetMap + Mapbox (cost-effective, open-source)

**SMS:**
- **Twilio** (reliable, global)
- **MSG91** (India-focused, cost-effective)
- **AWS SNS** (backup option)

**Email:**
- **SendGrid** (easy integration, reliable)
- **AWS SES** (cost-effective for high volume)
- **Mailgun** (developer-friendly)

**Payment (Future):**
- UPI integration via **Razorpay** or **PayU** (India-specific)
- Currently, payments external to system

**Analytics:**
- **Google Analytics** (user behavior)
- **Mixpanel** or **Amplitude** (product analytics)
- **Custom analytics** (pickup metrics, learning algorithm performance)

#### 3.4.6 Development Tools

**Version Control:**
- **Git** + **GitHub** / **GitLab** / **Bitbucket**

**Code Editor:**
- **VS Code** (recommended for JavaScript/TypeScript)
- **IntelliJ IDEA** / **PyCharm** (for Java/Python)

**API Testing:**
- **Postman** / **Insomnia**
- Automated API tests with **Jest** + **Supertest**

**Database Tools:**
- **pgAdmin** / **DBeaver** (PostgreSQL GUI)
- **Redis Commander** (Redis GUI)

**Design Tools:**
- **Figma** / **Sketch** (UI/UX design)
- **Whimsical** / **Miro** (wireframing, flowcharts)

**Project Management:**
- **Jira** / **Linear** / **GitHub Projects**
- **Confluence** (documentation)

**Communication:**
- **Slack** / **Microsoft Teams**
- **Zoom** / **Google Meet**

---

*(Continuing in next message...)*