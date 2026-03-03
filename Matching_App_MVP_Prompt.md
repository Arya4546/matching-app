# Matching App MVP --- Technical Implementation Prompt

## 📌 Project Overview

Build a **mobile-first, map-centric instant matching application**
focused on helping users quickly find and meet nearby people without
direct messaging.

The application must prioritize:

-   simplicity\
-   speed to match\
-   clean mobile UX\
-   real-time readiness (Phase 2)\
-   scalable backend architecture

------------------------------------------------------------------------

## 🎨 Design Source (MANDATORY)

All UI must strictly follow the provided Figma design:

**Figma Link:**\
https://www.figma.com/design/WH7HyYZAvLcj89Mdm0Br8U/matching-app?node-id=0-1&p=f&t=vMvZh2eSEciXRCQq-0,
https://www.figma.com/design/sTgU51pMkY87FviXUhjCJn/Social-App?node-id=0-1&p=f&t=QOFKQ2Cvrm2QnPK1-0

### Design Rules

-   Pixel-accurate implementation\
-   Mobile-first layout (primary target: smartphones)\
-   Consistent spacing, typography, and color usage\
-   Smooth, modern interactions\
-   Touch-friendly components\
-   Clean, minimal ride-hailing style UI (similar to GO/SRiDE concept)

------------------------------------------------------------------------

## 📱 Platform Priority

This application is **fundamentally intended for mobile devices**.

### Must Follow

-   Design for \~375px width first\
-   Use responsive scaling for larger screens\
-   Bottom sheets must be thumb-friendly\
-   Buttons must have proper touch targets\
-   Avoid desktop-first layouts

------------------------------------------------------------------------

## 🔐 Important Functional Concept

This is **NOT a chat-based dating app**.

Core behavior:

-   Users do NOT message each other\
-   Users request meetings\
-   Users approve meetings\
-   System guides both users to a meeting point\
-   Speed and simplicity are critical

------------------------------------------------------------------------

# 🧱 Current Code Situation

The existing UI and backend are **partially implemented but not
robust**.

### Required Improvements

-   Refactor messy or tightly coupled code\
-   Improve folder structure\
-   Ensure scalable architecture\
-   Improve API consistency\
-   Add proper error handling\
-   Ensure clean state management\
-   Optimize mobile performance

The goal is to make the system **production-ready and maintainable**,
not just functional.

------------------------------------------------------------------------

# 🚀 Phase-Based Development Plan

Development must be completed in **two structured phases**.

------------------------------------------------------------------------

# ✅ PHASE 1 --- Core Experience & Interface Foundation

**Goal:** Deliver a polished, mobile-ready core experience and complete
the flow up to sending a meeting request.

------------------------------------------------------------------------

## 🔑 Authentication & Profile

Implement:

-   User registration\
-   User login (**design required --- not present in Figma**)\
-   Profile creation/edit\
-   Basic validation\
-   Session handling

### Login Screen Requirement

Since no Figma design exists:

-   Design must match the visual language of the app\
-   Maintain typography consistency\
-   Use same color palette\
-   Follow mobile-first UX\
-   Keep UI clean and minimal

------------------------------------------------------------------------

## 🟢 Availability System

Implement:

-   ON / OFF availability toggle\
-   Status persistence in backend\
-   Immediate UI feedback

------------------------------------------------------------------------

## 🗺️ Map-Centric Main Screen (UI-Focused)

Implement the full UI layout of the map screen:

-   User location pin\
-   Bottom action panel\
-   Meet urgency selector (e.g., 5 min / 1 hour)\
-   Reason-to-meet selector\
-   Nearby users display (can be static or basic initially)

⚠️ Real-time synchronization is **NOT required in Phase 1**

------------------------------------------------------------------------

## 🤝 Meeting Request Flow

Implement flow up to:

-   User selects another user\
-   User sends meeting request\
-   Other user can approve\
-   Pending state visible

This flow must be functional but may use **basic API/polling** in Phase
1.

------------------------------------------------------------------------

## 🛠️ Basic Admin Controls

Provide minimal admin capability:

-   User listing\
-   Freeze / unfreeze user\
-   Basic status management

------------------------------------------------------------------------

## 🎯 Phase 1 Completion Criteria

Phase 1 is complete when:

-   Mobile UI matches Figma\
-   Login screen is professionally designed\
-   Users can register/login\
-   Users can toggle availability\
-   Map UI is functional\
-   Meeting request can be sent\
-   Flow works smoothly on mobile

------------------------------------------------------------------------

# 🔥 PHASE 2 --- Real-Time Intelligence & Advanced Features

**Goal:** Add production-level intelligence, automation, and real-time
behavior.

------------------------------------------------------------------------

## 📡 Real-Time Location System

Implement:

-   Live user location updates\
-   Socket or real-time sync\
-   Presence management\
-   Efficient location throttling

------------------------------------------------------------------------

## 📍 Automatic Midpoint Calculation

System must:

-   Calculate midpoint between matched users\
-   Handle edge cases\
-   Update dynamically if needed

------------------------------------------------------------------------

## 🧭 Route Visualization

Implement:

-   Route drawing on map\
-   Distance/time estimation\
-   Visual navigation preview

------------------------------------------------------------------------

## 🔐 eKYC Integration

Integrate selected provider:

-   Document upload\
-   Verification status\
-   Error handling\
-   Secure storage practices

------------------------------------------------------------------------

## ⚡ Matching Logic Enhancement

Improve:

-   Distance filtering\
-   Time window filtering\
-   Performance optimization\
-   Edge case handling

------------------------------------------------------------------------

## 🎨 Final UI Polish

Add:

-   Loading states\
-   Skeleton screens\
-   Micro-interactions\
-   Animation polish\
-   Responsive refinements

------------------------------------------------------------------------

## 🧪 Final QA & Stability

Ensure:

-   No major mobile UI bugs\
-   Smooth map performance\
-   Clean error handling\
-   Production readiness

------------------------------------------------------------------------

# 🏗️ Technical Expectations

The implementation should be:

-   modular\
-   scalable\
-   mobile-optimized\
-   cleanly structured\
-   well-commented\
-   easy to extend in future

------------------------------------------------------------------------

# ✅ Success Criteria

The project will be considered successful when:

-   UI matches Figma precisely\
-   Mobile UX is smooth and intuitive\
-   Meeting flow works reliably\
-   Codebase is clean and maintainable\
-   Real-time features operate correctly (Phase 2)\
-   System is ready for future community expansion

------------------------------------------------------------------------

**End of Prompt**
