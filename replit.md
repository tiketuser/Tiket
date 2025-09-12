# Overview

Tiket is a ticket reselling marketplace platform built as a Next.js web application. The platform allows customers to buy and sell event tickets in a secure and user-friendly environment. Users can browse available tickets, create listings to sell their own tickets, and manage their ticket inventory through a comprehensive dashboard system.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: Next.js 14 with React 18 and TypeScript for type safety
- **Styling**: Tailwind CSS with custom design system including Hebrew typography support (Assistant font)
- **Component Architecture**: Modular component structure with reusable UI components using Radix UI primitives
- **State Management**: React hooks for local state management with Firebase authentication state handling
- **Routing**: Next.js App Router for file-based routing and server-side rendering capabilities

## Authentication System
- **Provider**: Firebase Authentication with email/password and Google OAuth integration
- **Persistence**: Browser local persistence for maintaining user sessions
- **User Management**: Firestore integration for storing additional user profile data beyond Firebase Auth

## Data Storage
- **Primary Database**: Firebase Firestore for storing ticket listings, user profiles, and transaction data
- **File Storage**: Firebase Storage for ticket images and user-uploaded content
- **Data Structure**: Collections for tickets, users, and favorites with real-time synchronization

## UI/UX Design Patterns
- **Responsive Design**: Mobile-first approach with breakpoint-specific layouts
- **RTL Support**: Right-to-left text direction for Hebrew language support
- **Component Library**: shadcn/ui components with custom styling and DaisyUI integration
- **Dialog System**: Modal-based interactions for authentication, ticket uploads, and checkout processes

## Development Environment
- **Mock Data**: Static data files for development and testing (cardsData, citiesData, venueData)
- **Fallback System**: Graceful degradation when Firebase is not configured for local development
- **Error Handling**: User-friendly Hebrew error messages and loading states

# External Dependencies

## Firebase Services
- **Authentication**: User registration, login, and session management
- **Firestore Database**: Real-time document database for application data
- **Storage**: File upload and retrieval for ticket images
- **Hosting**: Deployment platform with static site generation support

## UI Component Libraries
- **Radix UI**: Accessible component primitives for complex UI elements
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Touch-friendly carousel implementation for ticket galleries

## Development Tools
- **TypeScript**: Type checking and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **ESLint**: Code linting with Next.js and TypeScript rules
- **Date-fns**: Date manipulation and formatting utilities

## Third-Party Integrations
- **Google Fonts**: Assistant font family with Hebrew character support
- **React Day Picker**: Calendar component for date selection in filters
- **Class Variance Authority**: Utility for managing conditional CSS classes