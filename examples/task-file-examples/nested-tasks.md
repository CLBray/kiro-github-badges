# Nested Task File Example

This example demonstrates complex task hierarchies with nested sub-tasks.

## Implementation Plan

- [x] 1. Project Setup
  - Initialize repository structure
  - Configure development environment
  - _Requirements: 1.1_

- [ ] 2. Backend Development
  - [ ] 2.1 Database Setup
    - Design database schema
    - Create migration scripts
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.2 API Development
    - Implement REST endpoints
    - Add authentication middleware
    - _Requirements: 2.3, 2.4_
  
  - [ ] 2.3 Business Logic
    - [ ] 2.3.1 User Management
      - Create user registration
      - Implement user authentication
      - _Requirements: 2.5_
    
    - [x] 2.3.2 Data Processing
      - Build data validation
      - Add data transformation
      - _Requirements: 2.6_

- [x] 3. Frontend Development
  - [x] 3.1 Component Library
    - Create reusable components
    - Implement design system
    - _Requirements: 3.1_
  
  - [ ] 3.2 User Interface
    - [ ] 3.2.1 Authentication Pages
      - Login form
      - Registration form
      - _Requirements: 3.2_
    
    - [ ] 3.2.2 Dashboard
      - User dashboard layout
      - Data visualization components
      - _Requirements: 3.3_

- [ ] 4. Testing & Quality Assurance
  - [ ] 4.1 Unit Tests
    - Backend unit tests
    - Frontend component tests
    - _Requirements: 4.1_
  
  - [ ] 4.2 Integration Tests
    - API integration tests
    - End-to-end user flows
    - _Requirements: 4.2_

- [ ] 5. Deployment & DevOps
  - [ ] 5.1 CI/CD Pipeline
    - Set up GitHub Actions
    - Configure automated testing
    - _Requirements: 5.1_
  
  - [ ] 5.2 Production Deployment
    - Configure production servers
    - Set up monitoring and logging
    - _Requirements: 5.2_

## Task Summary

**Total Tasks**: 15 (including all parent and sub-tasks)
- **Main Tasks**: 5
- **Sub-tasks**: 10

**Completed**: 4
- ✅ 1. Project Setup
- ✅ 2.2 API Development  
- ✅ 2.3.2 Data Processing
- ✅ 3.1 Component Library

**Remaining**: 11
- All other tasks and sub-tasks

**Completion Rate**: 27% (4/15)

This example would generate a badge showing "4/15" with yellow color.

## Notes

- Both parent tasks and sub-tasks are counted individually
- A parent task can be marked complete even if sub-tasks remain
- Sub-tasks at any level (2.1, 2.3.1, etc.) are all counted equally
- The badge generator handles arbitrary nesting levels