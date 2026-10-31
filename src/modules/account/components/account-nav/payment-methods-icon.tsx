"use client"

import React from "react"

export const PaymentMethodsIcon = ({ color = "currentColor", ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M42 16C42 13.7909 40.2091 12 38 12H12C9.79086 12 8 13.7909 8 16V34C8 36.2091 9.79086 38 12 38H38C40.2091 38 42 36.2091 42 34V16ZM12 14H38C39.1046 14 40 14.8954 40 16V19H10V16C10 14.8954 10.8954 14 12 14ZM10 34V23H40V34C40 35.1046 39.1046 36 38 36H12C10.8954 36 10 35.1046 10 34ZM15 30H21V32H15V30Z" fill={color} />
    </svg>
)
