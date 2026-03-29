---
name: Enterprise Code Review Standards
description: This skill defines mandatory code review standards for frontend and backend systems. All reviewed code must comply with architecture, scalability, security, and performance guidelines before approval.
---

# 🎯 Code Review Philosophy

Code review is not about style policing.
It ensures:

- Maintainability
- Scalability
- Security
- Performance
- Architectural integrity
- Long-term system health

Reject code that violates core architecture or introduces technical debt.

---

# 🏗 Architecture Review Checklist

## 1. Separation of Concerns

- No business logic inside UI components.
- API calls exist only in `services/`.
- State mutations only inside `store/`.
- No tight coupling between modules.
- Feature-based modularization respected.

❌ Reject if architecture rules are violated.

---

## 🧠 Logic & Maintainability

- Functions must be small and focused.
- Avoid deeply nested logic.
- Use early returns.
- No duplicated logic.
- Reusable logic extracted to hooks/services.
- No magic numbers or hardcoded values.
- Meaningful variable and function names.

❌ Reject if code is unclear or overly complex.

---

## 🔐 Security Review

- No sensitive data exposed in frontend.
- No hardcoded secrets or API keys.
- Validate all external inputs.
- Prevent XSS risks.
- Proper authentication checks.
- Proper role-based access enforcement.
- No trust of client-side validation only.

❌ Immediate rejection for security violations.

---

## ⚡ Performance Review

- Avoid unnecessary re-renders.
- Proper use of `useMemo`, `useCallback`, `React.memo`.
- Large lists use virtualization.
- No heavy computation inside render.
- API calls optimized (no duplicate calls).
- Pagination used for large datasets.
- Avoid global state overuse.

❌ Flag performance risks.

---

## 🌐 API & Data Handling

- API calls use centralized Axios instance.
- Proper error handling.
- Loading states handled.
- Typed API responses (no `any`).
- Proper request cancellation (AbortController if needed).
- Interceptors used properly.

❌ Reject direct fetch/axios usage in components.

---

## 🗃 State Management Review (Zustand)

- Store slices are modular.
- No direct state mutation.
- Async logic handled properly.
- Selectors used to prevent re-renders.
- No unnecessary global state.

---

## 🧪 Testing Review

- Business logic covered by unit tests.
- Hooks tested.
- Critical flows tested.
- No untested complex logic.
- Mocks properly isolated.

❌ Major features without tests should not be approved.

---

## 🧹 Code Quality Rules

- No unused variables.
- No console.log in production.
- No commented dead code.
- No `any` unless justified.
- Proper TypeScript strict typing.
- Consistent formatting (ESLint/Prettier).

---

## 🔄 Scalability Review

- Will this code scale to 10x traffic?
- Is this reusable?
- Is it extensible?
- Does it increase technical debt?
- Is abstraction appropriate?

Think long-term.

---

## 📦 Backend Review (If Applicable)

- Proper validation.
- No N+1 query issues.
- Indexing considered.
- JWT verification correct.
- Role-based access control enforced.
- No direct DB exposure.
- Transactions used when needed.

---

## 🚫 Automatic Rejection Conditions

Immediately reject if:

- Security risk introduced
- Hardcoded secrets
- Architecture violation
- Untested critical logic
- Massive component (>300 lines)
- Business logic inside UI
- Duplicate logic added

---

# 🧑‍💻 Review Behavior Guidelines

- Be constructive, not emotional.
- Suggest improvements, not just problems.
- Provide example refactors when possible.
- Focus on system health over personal style.
- Avoid micro-optimizations unless necessary.
- Prioritize readability over cleverness.

---

# 📈 Senior-Level Review Mindset

Ask:

- Can a new developer understand this in 6 months?
- Will this survive 3+ years?
- Is it production-grade?
- Does this align with architecture?
- Is this technically sound?

If not → request changes.

---

# 🏁 Definition of Approval

Approve only if:

- Clean architecture respected
- Secure
- Performant
- Maintainable
- Scalable
- Tested
- Typed
- Readable

No compromises on core standards.