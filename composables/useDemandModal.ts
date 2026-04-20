import type { Demand } from '~/types/domain'

export function useDemandModal() {
  const isOpen = useState('demand-modal-open', () => false)
  const editingDemand = useState<Demand | null>('demand-modal-editing', () => null)

  function openDemandModal(demand: Demand | null = null) {
    editingDemand.value = demand
    isOpen.value = true
  }

  function closeDemandModal() {
    isOpen.value = false
    editingDemand.value = null
  }

  return {
    isOpen,
    editingDemand,
    openDemandModal,
    closeDemandModal
  }
}
