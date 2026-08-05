import { useEffect, useState } from 'react'

type Props = {
  active: boolean
}

/** Flaming cursor + “ouch” bubble while burned after control-room timeout. */
export default function BurnCursor({ active }: Props) {
  const [pos, setPos] = useState({ x: -100, y: -100 })

  useEffect(() => {
    if (!active) return
    setPos({ x: window.innerWidth * 0.5, y: window.innerHeight * 0.45 })
    const onMove = (e: PointerEvent) => {
      setPos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('pointermove', onMove)
    document.documentElement.classList.add('cursor-on-fire')
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.classList.remove('cursor-on-fire')
    }
  }, [active])

  if (!active) return null

  return (
    <div
      className="burn-cursor"
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
      aria-live="assertive"
    >
      <div className="burn-cursor-flame" aria-hidden>
        <span className="burn-cursor-core" />
        <span className="burn-cursor-lick burn-cursor-lick-a" />
        <span className="burn-cursor-lick burn-cursor-lick-b" />
        <span className="burn-cursor-lick burn-cursor-lick-c" />
        <span className="burn-cursor-ember" />
      </div>
      <p className="burn-cursor-ouch">ouch</p>
    </div>
  )
}
