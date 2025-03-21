"use client"

import { checkProfileExists } from "@/lib/calls"
import { useWallet } from "@suiet/wallet-kit"
import { useState, useEffect } from "react"


export function useGlobalState() {
  const wallet = useWallet();
  const [profileCreated, setProfileCreated] = useState(false)

  async function makeCheck() {
    let res = await checkProfileExists(wallet)
    setProfileCreated(res.result)
  }

  useEffect(() => {
    makeCheck()
  }, [wallet])

  return { profileCreated, setProfileCreated }
}

