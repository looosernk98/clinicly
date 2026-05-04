// Utility functions for the application

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString()
}

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
