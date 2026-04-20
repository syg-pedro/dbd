export function useDemandRefresh() {
  const version = useState('demand-refresh-version', () => 0)

  function refreshDemands() {
    version.value += 1
  }

  return { version, refreshDemands }
}
