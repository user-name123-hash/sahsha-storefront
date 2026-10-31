import { enrichTestimonialsData } from "@lib/data/testimonials"
import TestimonialsClient from "./testimonials-client"

interface TestimonialsProps {
  initialData?: {
    title: string
    eyebrow?: string
    description?: string
    testimonials: Array<{
      id: string
      text: string
      name: string
      rating: number
      avatar?: string
    }>
  } | null
}

const Testimonials = async ({ initialData }: TestimonialsProps) => {
  const enrichedData = await enrichTestimonialsData(initialData ?? null)

  return <TestimonialsClient initialData={enrichedData} />
}

export default Testimonials
