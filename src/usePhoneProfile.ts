import { useEffect, useState } from 'react'

const PHONE_MQ = '(max-width: 820px)'

function readPhone() {
  return typeof window !== 'undefined' && window.matchMedia(PHONE_MQ).matches
}

/** Narrow / phone layout — also used to drop GPU cost. */
export default function usePhoneProfile() {
  const [phone, setPhone] = useState(readPhone)

  useEffect(() => {
    const mq = window.matchMedia(PHONE_MQ)
    const sync = () => setPhone(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return phone
}
