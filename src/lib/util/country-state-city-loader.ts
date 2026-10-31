/**
 * Lazy-loaded helper for country-state-city to prevent the 9.2 MB worldwide
 * city JSON database from being statically imported into client bundles.
 */

export type CSCState = { name: string; isoCode: string }
export type CSCCity = { name: string }

export type CSCLib = {
  State: { getStatesOfCountry: (code: string) => CSCState[] }
  City: { getCitiesOfState: (countryCode: string, stateCode: string) => CSCCity[] }
}

let cscPromise: Promise<CSCLib> | null = null

export function loadCSC(): Promise<CSCLib> {
  if (!cscPromise) {
    cscPromise = import("country-state-city").then((m) => ({
      State: m.State as CSCLib["State"],
      City: m.City as CSCLib["City"],
    }))
  }
  return cscPromise
}
