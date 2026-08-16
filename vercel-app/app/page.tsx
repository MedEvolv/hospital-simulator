import type { Metadata } from 'next'
import { SplashDoor } from '@/components/SplashDoor'

export const metadata: Metadata = {
  title: 'Institutional Mirror | ArchLife',
  description: 'OTP access to the Institutional Mirror alignment work for practitioners. Not a public brief and not NABH certification.',
}

export default function SplashPage() {
  return <SplashDoor />
}
