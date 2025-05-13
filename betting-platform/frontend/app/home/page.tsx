'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import io from 'socket.io-client'
import { UserIcon, CurrencyDollarIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline'

const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`)

interface DailyLine {
  question: string
  yes_odds: string
  no_odds: string
  cutoff_time: string
  is_active: boolean
  winning_side?: 'YES' | 'NO' | null
}

let countdownInterval: ReturnType<typeof setInterval> | null = null;

export default function HomePage() {
  const [username, setUsername] = useState('')
  const [balance, setBalance] = useState(0)
  const [wager, setWager] = useState('')
  const [dailyLine, setDailyLine] = useState<DailyLine | null>(null)
  const [timeRemaining, setTimeRemaining] = useState('')
  const [oddsFormat, setOddsFormat] = useState<"american" | "decimal">("american")
  const [volume, setVolume] = useState({ total_bets: 0, total_amount: 0 })

  const router = useRouter()

  const startCountdown = (cutoffISO: string) => {
    if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }

    const cutoff = new Date(cutoffISO).getTime()
    countdownInterval = setInterval(() => {
      const now = Date.now()
      const remaining = cutoff - now

      if (remaining <= 0) {
        clearInterval(countdownInterval!)
        setTimeRemaining('0:00:00')
        return
      }
      const hours = Math.floor(remaining / 3600000)
      const minutes = Math.floor((remaining % 3600000) / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      setTimeRemaining(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)
  }

  // Initial data load and socket setup
  useEffect(() => {
    const storedUsername = localStorage.getItem('username')
    const storedBalance = localStorage.getItem('balance')

    if (!storedUsername) {
      router.push('/login')
      return
    }

    setUsername(storedUsername)
    if (storedBalance) setBalance(parseFloat(storedBalance))

    socket.emit('register_username', storedUsername)

    // Fetch balance
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/balance/${storedUsername}`)
      .then(res => res.json())
      .then(data => {
        if (data?.balance !== undefined) {
          setBalance(data.balance)
          localStorage.setItem("balance", data.balance.toString())
        }
      })
      .catch(() => console.warn("⚠️ Failed to fetch balance"))

    // Fetch daily line
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/daily-line`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setDailyLine(data)
          startCountdown(data.cutoff_time)
        }
      })

    // Fetch bet volume
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bet-volume`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setVolume(data)
        }
      })
      .catch(err => console.error("❌ Failed to fetch volume:", err))

    // Setup socket events
    socket.on('daily_line_updated', (line: DailyLine) => {
      setDailyLine(line)
      startCountdown(line.cutoff_time)
    })

    socket.on('daily_line_resolved', (line: DailyLine) => {
      setDailyLine(line)
    })

    socket.on('bet_volume_updated', (data) => {
      if (!data.error) {
        setVolume(data)
      }
    })

    socket.on('balance_updated', (data) => {
      if (data?.balance !== undefined) {
        setBalance(data.balance)
        localStorage.setItem('balance', data.balance.toString())
      }
    })

    return () => {
      socket.off('daily_line_updated')
      socket.off('daily_line_resolved')
      socket.off('bet_volume_updated')
      socket.off('balance_updated')
      if (countdownInterval) clearInterval(countdownInterval)
    }
  }, [router])

  const placeBet = async (side: 'YES' | 'NO') => {
    const amount = parseFloat(wager)
    if (isNaN(amount) || amount <= 0 || amount > balance) {
      alert('Invalid wager')
      return
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/place-bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, choice: side, amount })
    })

    const data = await res.json()
    if (res.ok) {
      alert('Bet placed')
      setBalance(data.balance)
      localStorage.setItem('balance', data.balance.toString())
      setWager('')
    } else {
      alert(data.error || 'Bet failed')
    }
  }

  if (!dailyLine) return <p className="text-center mt-10">Loading...</p>

  const isClosed = new Date() > new Date(dailyLine.cutoff_time)

  const convertOdds = (americanOdds: number): string => {
    if (isNaN(americanOdds)) return "0.00"
    const decimal = americanOdds > 0
      ? (americanOdds / 100 + 1)
      : (100 / Math.abs(americanOdds) + 1)
    return decimal.toFixed(2)
  }

  return (
    <>
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6 text-sm text-gray-700">
          <div className="flex items-center gap-1">
            <UserIcon className="w-5 h-5 text-gray-600" />
            <span className="font-medium">{username}</span>
          </div>
          <div className="flex items-center gap-1">
            <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
            <span className="font-semibold">{balance} ETH</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <label htmlFor="odds" className="text-sm font-medium text-gray-600">Odds format:</label>
          <select
            id="odds"
            value={oddsFormat}
            onChange={(e) => setOddsFormat(e.target.value as "american" | "decimal")}
            className="text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none"
          >
            <option value="american">American</option>
            <option value="decimal">Decimal</option>
          </select>
        </div>

        <div className="border border-gray-200 bg-white shadow-md p-6 mb-6 rounded-md">
          <h2 className="text-xl font-semibold text-center mb-2 text-gray-800">{dailyLine.question}</h2>
          <p className="flex items-center justify-center gap-1 text-sm text-gray-500 mb-4">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            Time left: {timeRemaining}
          </p>

          {dailyLine.winning_side && (
            <p className="text-center text-green-600 font-bold text-lg mb-4">
              ✅ Result: {dailyLine.winning_side} wins!
            </p>
          )}

          <input
            type="number"
            value={wager}
            onChange={(e) => setWager(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4 text-center"
            placeholder="Enter bet amount"
            disabled={isClosed || !!dailyLine.winning_side}
          />

          <div className="flex gap-4">
            <button
              onClick={() => placeBet('YES')}
              className="flex-1 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-semibold"
              disabled={isClosed || !!dailyLine.winning_side}
            >
              YES {oddsFormat === "american" 
                ? dailyLine.yes_odds 
                : convertOdds(parseFloat(dailyLine.yes_odds))}
            </button>
            <button
              onClick={() => placeBet('NO')}
              className="flex-1 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold"
              disabled={isClosed || !!dailyLine.winning_side}
            >
              NO {oddsFormat === "american" 
                ? dailyLine.no_odds 
                : convertOdds(parseFloat(dailyLine.no_odds))}
            </button>
          </div>

          <div className="text-center">
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600 font-medium">
              <ChartBarIcon className="w-5 h-5 text-blue-500" />
              <span>{volume.total_bets} bet(s) — {(volume.total_amount || 0).toLocaleString()} ETH</span>
            </div>
          </div>
        </div>


        <div className="flex justify-center gap-4 mt-6">
          <button 
            onClick={() => router.push('/deposit')} 
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
          >
            Deposit
          </button>
          <button 
            onClick={() => router.push('/withdraw')} 
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
          >
            Withdraw
          </button>
        </div>

      </div>
    </>
  )
}