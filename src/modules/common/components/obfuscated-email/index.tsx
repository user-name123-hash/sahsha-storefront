"use client"

import React, { useEffect, useState } from "react"

interface ObfuscatedEmailProps {
  email: string
  className?: string
}

const ObfuscatedEmail: React.FC<ObfuscatedEmailProps> = ({ email, className }) => {
  const [displayEmail, setDisplayEmail] = useState("")

  useEffect(() => {
    // Reveal the email only on the client side
    setDisplayEmail(email)
  }, [email])

  if (!displayEmail) {
    // Hide or show placeholder while loading
    return <span className={className}>...</span>
  }

  return (
    <a href={`mailto:${displayEmail}`} className={className}>
      {displayEmail}
    </a>
  )
}

export default ObfuscatedEmail
