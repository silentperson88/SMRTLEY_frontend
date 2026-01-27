// utils/authGuard.js
export const redirectIfAuthenticated = router => {
  if (typeof window === 'undefined') return

  const token = localStorage.getItem('token')

  if (token) {
    router.replace('/') // or dashboard
  }
}
