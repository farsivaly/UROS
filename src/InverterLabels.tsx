import { Html } from '@react-three/drei'
import {
  displayInvId,
  findInverter,
  healthTone,
  type TwinSnapshot,
} from './digitalTwin'
import { getStringInverterPositions } from './SolarArray'

/** Fleet badges only for the first four units (twin-backed) for now. */
const LABELED_INVERTER_COUNT = 4

type Props = {
  snapshot: TwinSnapshot | null
  visible: boolean
}

/**
 * Overview labels above each string inverter — health % and status from live data.
 */
export default function InverterLabels({ snapshot, visible }: Props) {
  if (!visible) return null
  const positions = getStringInverterPositions().slice(0, LABELED_INVERTER_COUNT)

  return (
    <group name="InverterLabels">
      {positions.map((pos, i) => {
        const unitId = `StringInverter_${String(i + 1).padStart(2, '0')}`
        const inv = findInverter(snapshot, unitId)
        const health = inv?.health ?? 0
        const status = inv?.status ?? 'No data'
        const tone = healthTone(health)
        const invLabel = inv?.id ?? displayInvId(unitId)

        return (
          <Html
            key={unitId}
            position={[pos[0], 2.35, pos[2]]}
            center
            distanceFactor={18}
            style={{ pointerEvents: 'none' }}
          >
            <div className={`inv-badge ${tone}`}>
              <div className="inv-badge-id">{invLabel}</div>
              <div className="inv-badge-health">{health}%</div>
              <div className="inv-badge-status">
                <span className="status-dot" />
                {status}
              </div>
            </div>
          </Html>
        )
      })}
    </group>
  )
}
